import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import { ChipRow, Header, SearchBar } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import { useRealtimeRefresh } from '../../realtime';
import { addStaffLogs, deleteStaff, getStaffDetail, listStaff } from '../../services';
import type { Staff } from '../../types';
import { formatVnd, getSalaryByLabel, getStatusWorkingLabel, normalizeText } from '../../utils/staff';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type StaffFilter = 'all' | 'on' | 'off' | 'manager' | 'cashier' | 'service' | 'kitchen';
type StaffPermission = 'R' | 'C' | 'U' | 'D';

const PAGE_SIZE = 12;
const ROLE_ALIAS = 'user_staff';
const OVERTIME_COEFFICIENTS = ['1', '1.5', '2', '2.5', '3'];
const STAFF_LOG_COLUMNS = [
  { key: 'commission', label: 'Hoa hồng', type: 'money' },
  { key: 'bonus', label: 'Thưởng', type: 'money' },
  { key: 'overtime_hour', label: 'Tăng ca (h)', type: 'hour' },
  { key: 'overtime_coefficient', label: 'Hệ số', type: 'select' },
  { key: 'advence', label: 'Tạm ứng', type: 'money' },
  { key: 'fined', label: 'Phạt', type: 'money' },
  { key: 'day_off_hour', label: 'Nghỉ (h)', type: 'hour' },
] as const;
type StaffLogKey = (typeof STAFF_LOG_COLUMNS)[number]['key'];
type StaffLogForm = Record<StaffLogKey, string>;

const FILTER_CHIPS: Array<{ key: StaffFilter; labelKey?: TranslationKey; label?: string }> = [
  { key: 'all', labelKey: 'messages.filter.all' },
  { key: 'on', label: 'Đang làm' },
  { key: 'off', label: 'Nghỉ việc' },
  { key: 'manager', label: 'Quản lý' },
  { key: 'cashier', label: 'Thu ngân' },
  { key: 'service', label: 'Phục vụ' },
  { key: 'kitchen', label: 'Bếp/Pha chế' },
];

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const normalizePhoneSearch = (value: string) => value.replace(/\D/g, '');

const staffKey = (staff: Staff) => `staff:${staff.id}`;

const uniqueStaff = (items: Staff[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = String(item.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

async function hydrateStaffCompensation(items: Staff[]) {
  const resolved = await Promise.all(
    items.map(async (item) => {
      try {
        const detail = await getStaffDetail(item.id);
        return [String(item.id), detail] as const;
      } catch {
        return [String(item.id), null] as const;
      }
    }),
  );

  const detailMap = new Map<string, Staff | null>(resolved);
  return items.map((item) => {
    const detail = detailMap.get(String(item.id));
    if (!detail) return item;
    return {
      ...item,
      salary_value: detail.salary_value,
      salary_by: detail.salary_by,
      pending_date: detail.pending_date,
      pending_hour: detail.pending_hour,
    };
  });
}

const getInitial = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const last = words[words.length - 1] || name;
  return last.charAt(0).toUpperCase() || 'N';
};

async function readStaffPermissions(): Promise<Record<StaffPermission, boolean>> {
  const allowed = { R: true, C: true, U: true, D: true };
  const raw = await AsyncStorage.getItem('roleSettings');
  if (!raw) return allowed;

  try {
    const settings = JSON.parse(raw) as Array<{ role_alias?: string; permission?: string }>;
    if (!Array.isArray(settings) || settings.length === 0) return allowed;

    return {
      R: settings.some((item) => item.role_alias === ROLE_ALIAS && item.permission === 'R'),
      C: settings.some((item) => item.role_alias === ROLE_ALIAS && item.permission === 'C'),
      U: settings.some((item) => item.role_alias === ROLE_ALIAS && item.permission === 'U'),
      D: settings.some((item) => item.role_alias === ROLE_ALIAS && item.permission === 'D'),
    };
  } catch {
    return allowed;
  }
}

export function StaffListScreen() {
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StaffFilter>('all');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [totalItem, setTotalItem] = useState(0);
  const [totalPage, setTotalPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [staffLimit, setStaffLimit] = useState(Number.POSITIVE_INFINITY);
  const [totalStaff, setTotalStaff] = useState(0);
  const [permissions, setPermissions] = useState<Record<StaffPermission, boolean>>({ R: true, C: true, U: true, D: true });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [logSaving, setLogSaving] = useState(false);
  const [logStaff, setLogStaff] = useState<Staff[]>([]);
  const [commonLogs, setCommonLogs] = useState<StaffLogForm>(blankStaffLogForm);
  const [staffLogs, setStaffLogs] = useState<Record<string, StaffLogForm>>({});
  const [coefficientPicker, setCoefficientPicker] = useState<{ visible: boolean; staffId: string | null }>({
    visible: false,
    staffId: null,
  });
  const requestSeq = useRef(0);
  const searchRef = useRef('');

  const loadStaff = useCallback(
    async (page = 1, options?: { append?: boolean; silent?: boolean; query?: string }) => {
      const seq = requestSeq.current + 1;
      requestSeq.current = seq;

      if (options?.append) {
        setLoadingMore(true);
      } else if (options?.silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const result = await listStaff({
          pageSize: options?.query ? 200 : PAGE_SIZE,
          currentPage: page,
          search: options?.query || '',
        });

        if (requestSeq.current !== seq) return;

        const hydratedItems = await hydrateStaffCompensation(result.items);
        if (requestSeq.current !== seq) return;

        setStaff((prev) => {
          if (!options?.append) return uniqueStaff(hydratedItems);
          return uniqueStaff([...prev, ...hydratedItems]);
        });
        if (page === 1 && !options?.query) {
          setAllStaff(uniqueStaff(hydratedItems));
        }
        setTotalItem(result.totalItem);
        setTotalPage(Math.max(result.totalPage, 1));
        setCurrentPage(result.currentPage);
        setStaffLimit(result.staffLimit);
        setTotalStaff(result.totalStaff);
      } catch (err) {
        if (requestSeq.current !== seq) return;
        const message = err instanceof Error ? err.message : 'Không thể tải danh sách nhân viên.';
        setError(message);
        if (page === 1) {
          setStaff([]);
          setAllStaff([]);
          setTotalItem(0);
          setTotalPage(1);
          setCurrentPage(1);
        }
      } finally {
        if (requestSeq.current === seq) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    readStaffPermissions().then(setPermissions);
    loadStaff(1);
  }, [loadStaff]);

  useEffect(() => {
    searchRef.current = search.trim();
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      loadStaff(1, { silent: true, query: searchRef.current });
    }, [loadStaff]),
  );

  useEffect(() => {
    const query = search.trim();
    const timeout = setTimeout(() => {
      loadStaff(1, { silent: true, query });
    }, 300);

    return () => clearTimeout(timeout);
  }, [loadStaff, search]);

  const statsStaff = useMemo(() => uniqueStaff(allStaff.length ? allStaff : staff), [allStaff, staff]);
  const activeCount = statsStaff.filter((item) => item.status_working === 'on').length;
  const inactiveCount = statsStaff.filter((item) => item.status_working === 'off').length;
  const payrollTotal = statsStaff.reduce((sum, item) => sum + item.total_salary, 0);
  const hasSearch = search.trim().length > 0;
  const hasMore = !hasSearch && filter === 'all' && currentPage < totalPage && staff.length < totalItem;
  const hideAdd = Number.isFinite(staffLimit) && totalStaff >= staffLimit;

  const filterChips = useMemo(() => {
    const countFor = (key: StaffFilter) => {
      if (key === 'all') return totalStaff || totalItem || statsStaff.length;
      if (key === 'on') return activeCount;
      if (key === 'off') return inactiveCount;
      if (key === 'manager') return statsStaff.filter((item) => item.permission_name.includes('Quản lý')).length;
      if (key === 'cashier') return statsStaff.filter((item) => item.permission_name.includes('Thu ngân')).length;
      if (key === 'service') return statsStaff.filter((item) => item.permission_name.includes('Phục vụ')).length;
      return statsStaff.filter((item) => item.permission_name.includes('Bếp') || item.permission_name.includes('Pha chế')).length;
    };

    return FILTER_CHIPS.map((chip) => ({
      key: chip.key,
      label: chip.labelKey ? t(chip.labelKey) : chip.label || chip.key,
      count: countFor(chip.key),
    }));
  }, [activeCount, inactiveCount, statsStaff, t, totalItem, totalStaff]);

  const displayedStaff = useMemo(() => {
    const query = normalizeSearchText(search);
    const queryTokens = query.split(/\s+/).filter(Boolean);
    const phoneQuery = normalizePhoneSearch(search);
    return staff.filter((item) => {
      const position = item.permission_name || '';
      const haystack = [
        normalizeSearchText(item.name),
        normalizeSearchText(position),
        normalizeSearchText(item.phone),
      ].join(' ');
      const phoneDigits = normalizePhoneSearch(item.phone || '');
      const bySearch =
        !query ||
        queryTokens.every((token) => haystack.includes(token)) ||
        (phoneQuery.length > 0 && phoneDigits.includes(phoneQuery));

      let byFilter = true;
      if (filter === 'on' || filter === 'off') byFilter = item.status_working === filter;
      if (filter === 'manager') byFilter = position.includes('Quản lý');
      if (filter === 'cashier') byFilter = position.includes('Thu ngân');
      if (filter === 'service') byFilter = position.includes('Phục vụ');
      if (filter === 'kitchen') byFilter = position.includes('Bếp') || position.includes('Pha chế');

      return bySearch && byFilter;
    });
  }, [filter, search, staff]);

  const handleRefresh = useCallback(() => {
    loadStaff(1, { silent: true, query: search.trim() });
  }, [loadStaff, search]);
  useRealtimeRefresh(['staff'], handleRefresh);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    loadStaff(currentPage + 1, { append: true, silent: true });
  }, [currentPage, hasMore, loadStaff, loading, loadingMore]);

  const handleAdd = () => {
    if (!permissions.C) {
      Alert.alert('Không có quyền', 'Bạn không có quyền thêm nhân viên.');
      return;
    }
    if (hideAdd) {
      Alert.alert('Đã đạt giới hạn', 'Gói hiện tại đã đạt giới hạn số lượng nhân viên.');
      return;
    }
    nav.navigate('StaffEdit', {});
  };

  const openLogModal = async () => {
    if (!permissions.U) {
      Alert.alert('Không có quyền', 'Bạn không có quyền cập nhật phúc lợi/thưởng phạt.');
      return;
    }

    try {
      setLogLoading(true);
      setLogModalOpen(true);
      const result = await listStaff({ pageSize: 200, currentPage: 1, search: '' });
      const activeStaff = result.items.filter((item) => item.status_working === 'on');
      setLogStaff(activeStaff);
      const initialLogs: Record<string, StaffLogForm> = {};
      activeStaff.forEach((item) => {
        initialLogs[String(item.id)] = blankStaffLogForm();
      });
      setStaffLogs(initialLogs);
      setCommonLogs(blankStaffLogForm());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách nhân viên.';
      Alert.alert('Lỗi', message);
      setLogModalOpen(false);
    } finally {
      setLogLoading(false);
    }
  };

  const closeLogModal = () => {
    if (logSaving) return;
    setLogModalOpen(false);
  };

  const setCommonValue = (key: StaffLogKey, value: string) => {
    setCommonLogs((prev) => ({ ...prev, [key]: sanitizeStaffLogValue(key, value) }));
  };

  const setStaffValue = (staffId: string, key: StaffLogKey, value: string) => {
    setStaffLogs((prev) => ({
      ...prev,
      [staffId]: {
        ...(prev[staffId] || blankStaffLogForm()),
        [key]: sanitizeStaffLogValue(key, value),
      },
    }));
  };

  const applyCommonValues = () => {
    setStaffLogs((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((staffId) => {
        const current = next[staffId] || blankStaffLogForm();
        const merged = { ...current };
        (Object.keys(commonLogs) as StaffLogKey[]).forEach((key) => {
          if (commonLogs[key]) merged[key] = commonLogs[key];
        });
        next[staffId] = merged;
      });
      return next;
    });
  };

  const submitLogs = async () => {
    const payload: Array<{ staffId: string; logType: StaffLogKey; value: number | string }> = [];
    Object.entries(staffLogs).forEach(([staffId, values]) => {
      (Object.keys(values) as StaffLogKey[]).forEach((key) => {
        const raw = values[key];
        if (!raw) return;
        const numeric = Number.parseFloat(raw);
        if (Number.isNaN(numeric) || numeric <= 0) return;
        payload.push({ staffId, logType: key, value: key === 'overtime_coefficient' ? raw : numeric });
      });
    });

    if (payload.length === 0) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng nhập ít nhất một giá trị lớn hơn 0.');
      return;
    }

    try {
      setLogSaving(true);
      await addStaffLogs(payload);
      Alert.alert('Thành công', 'Đã cập nhật phúc lợi/thưởng phạt cho nhân viên.');
      setLogModalOpen(false);
      await loadStaff(1, { silent: true, query: search.trim() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể lưu dữ liệu.';
      Alert.alert('Lỗi', message);
    } finally {
      setLogSaving(false);
    }
  };

  const openCoefficientPicker = (staffId: string | null) => {
    setCoefficientPicker({ visible: true, staffId });
  };

  const closeCoefficientPicker = () => {
    setCoefficientPicker({ visible: false, staffId: null });
  };

  const onSelectCoefficient = (value: string) => {
    if (coefficientPicker.staffId === null) {
      setCommonValue('overtime_coefficient', value);
    } else {
      setStaffValue(coefficientPicker.staffId, 'overtime_coefficient', value);
    }
    closeCoefficientPicker();
  };

  const handleDelete = (item: Staff) => {
    if (!permissions.D) {
      Alert.alert('Không có quyền', 'Bạn không có quyền xóa nhân viên.');
      return;
    }

    Alert.alert('Xóa nhân viên', `Bạn chắc chắn muốn xóa ${item.name}?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStaff([item.id]);
            await loadStaff(1, { silent: true, query: search.trim() });
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Không thể xóa nhân viên.';
            Alert.alert(t('common.error'), message);
          }
        },
      },
    ]);
  };

  if (!permissions.R) {
    return (
      <View style={[styles.screen, styles.centerContent, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={42} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Bạn không có quyền sử dụng tính năng này.</Text>
      </View>
    );
  }

  if (loading && staff.length === 0) {
    return (
      <View style={[styles.screen, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title={t('staff.title')}
        subtitle={t('staff.subtitle', { total: (totalStaff || totalItem).toLocaleString(dateLocale), onDuty: activeCount })}
        onBack={() => nav.goBack()}
      />

      <FlatList
        data={displayedStaff}
        keyExtractor={staffKey}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            onRefresh={handleRefresh}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <View>
            <View style={styles.fullBleedRow}>
              <SearchBar value={search} onChangeText={setSearch} placeholder={t('staff.searchPlaceholder')} />
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewTitle}>TỔNG QUAN NHÂN SỰ</Text>
              <View style={styles.overviewRow}>
                <OverviewStat label="Đang làm" value={String(activeCount)} color={Colors.success} />
                <OverviewStat label="Nghỉ việc" value={String(inactiveCount)} color={Colors.danger} />
                <OverviewStat label="Tổng lương" value={compactMoney(payrollTotal)} color="#fff" />
              </View>
              {Number.isFinite(staffLimit) ? (
                <Text style={styles.limitText}>
                  {totalStaff}/{staffLimit} nhân viên trong gói hiện tại
                </Text>
              ) : null}
            </View>

            <View style={[styles.fullBleedRow, styles.filterBleedRow]}>
              <ChipRow chips={filterChips} selected={filter} onSelect={(key) => setFilter(key as StaffFilter)} />
            </View>

            {permissions.U ? (
              <TouchableOpacity style={styles.bulkLogBtn} activeOpacity={0.85} onPress={openLogModal}>
                <Ionicons name="gift-outline" size={16} color="#fff" />
                <Text style={styles.bulkLogBtnText}>Phúc lợi/Thưởng phạt chung</Text>
              </TouchableOpacity>
            ) : null}

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={16} color={Colors.danger} />
                <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
                <TouchableOpacity onPress={() => loadStaff(1)}>
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          const isLast = index === displayedStaff.length - 1;
          const active = item.status_working === 'on';
          const accent = active ? Colors.success : Colors.danger;
          const effectiveSalaryValue =
            normalizeText(item.salary_value) ||
            normalizeText(item.pending_date?.salary_value) ||
            normalizeText(item.pending_hour?.salary_value);
          const effectiveSalaryBy =
            normalizeText(item.salary_by) ||
            normalizeText(item.pending_date?.salary_by) ||
            normalizeText(item.pending_hour?.salary_by) ||
            'h';
          const hasSalaryConfigured = effectiveSalaryValue !== '';
          const salaryLine = hasSalaryConfigured
            ? `${formatVnd(effectiveSalaryValue)}/${getSalaryByLabel(effectiveSalaryBy)}`
            : 'Chưa cấu hình lương';

          return (
            <TouchableOpacity
              style={[
                styles.row,
                { backgroundColor: colors.card, borderColor: colors.border },
                isFirst && styles.rowFirst,
                !isFirst && [styles.rowWithSeparator, { borderTopColor: colors.border }],
                isLast && styles.rowLast,
              ]}
              onPress={() => {
                if (!item.id) {
                  Alert.alert('Thiếu dữ liệu', 'Không tìm thấy mã nhân viên để mở chi tiết.');
                  return;
                }
                nav.navigate('StaffEdit', { id: item.id, preview: item });
              }}
              activeOpacity={0.85}
            >
              <View style={styles.avatarWrap}>
                <View style={[styles.avatarCircle, { borderColor: accent, backgroundColor: `${accent}22` }]}>
                  <Text style={[styles.avatarText, { color: accent }]}>{getInitial(item.name)}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: accent, borderColor: colors.card }]} />
              </View>

              <View style={styles.mainContent}>
                <View style={styles.nameRow}>
                  <Text style={[styles.nameText, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={15} color={permissions.D ? Colors.danger : colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.permission_name || 'Chưa có chức vụ'} · {normalizeText(item.phone) || 'Chưa có SĐT'}
                </Text>
                <Text style={[styles.statusText, { color: accent }]} numberOfLines={1}>
                  ● {getStatusWorkingLabel(item.status_working)} · {salaryLine}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={46} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('staff.empty')}</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>
              {hasMore ? 'Kéo để tải thêm' : `${displayedStaff.length.toLocaleString(dateLocale)} / ${(totalStaff || totalItem).toLocaleString(dateLocale)}`}
            </Text>
          )
        }
      />

      {permissions.C ? (
        <TouchableOpacity style={[styles.fabPill, hideAdd && styles.fabDisabled]} onPress={handleAdd}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.fabPillText}>{t('staff.addShort')}</Text>
        </TouchableOpacity>
      ) : null}

      <Modal visible={logModalOpen} transparent animationType="fade" onRequestClose={closeLogModal}>
        <Pressable style={styles.logBackdrop} onPress={closeLogModal}>
          <Pressable style={[styles.logPanel, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <View style={styles.logHeader}>
              <Text style={[styles.logTitle, { color: colors.text }]}>Phúc lợi/Thưởng phạt chung</Text>
              <TouchableOpacity onPress={closeLogModal} disabled={logSaving}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {logLoading ? (
              <View style={styles.logLoadingWrap}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.logSectionTitle, { color: colors.textSecondary }]}>Áp dụng cho tất cả</Text>
                <View style={styles.logColumnsWrap}>
                  {STAFF_LOG_COLUMNS.map((column) => (
                    <View key={`common-${column.key}`} style={styles.logColumnItem}>
                      <Text style={[styles.logLabel, { color: colors.textSecondary }]} numberOfLines={1}>{column.label}</Text>
                      {column.type === 'select' ? (
                        <TouchableOpacity
                          style={[styles.logSelectBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                          onPress={() => openCoefficientPicker(null)}
                          activeOpacity={0.82}
                        >
                          <Text style={[styles.logSelectText, { color: commonLogs[column.key] ? colors.text : colors.textSecondary }]}>
                            {commonLogs[column.key] || 'Chọn'}
                          </Text>
                          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      ) : (
                        <TextInput
                          value={formatLogValue(commonLogs[column.key], column.type)}
                          onChangeText={(value) => setCommonValue(column.key, value)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={colors.textSecondary}
                          style={[styles.logInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        />
                      )}
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.applyAllBtn} onPress={applyCommonValues}>
                  <Ionicons name="arrow-down-outline" size={14} color="#fff" />
                  <Text style={styles.applyAllBtnText}>Áp dụng cho toàn bộ nhân viên</Text>
                </TouchableOpacity>

                <Text style={[styles.logSectionTitle, { color: colors.textSecondary }]}>Nhập theo nhân viên</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={styles.logTableHeader}>
                      <Text style={[styles.logStaffHeaderText, { color: colors.textSecondary }]}>Nhân viên</Text>
                      {STAFF_LOG_COLUMNS.map((column) => (
                        <Text key={`head-${column.key}`} style={[styles.logHeaderCellText, { color: colors.textSecondary }]}>{column.label}</Text>
                      ))}
                    </View>
                    {logStaff.map((staffItem) => {
                      const staffId = String(staffItem.id);
                      const row = staffLogs[staffId] || blankStaffLogForm();
                      return (
                        <View key={`row-${staffId}`} style={[styles.logTableRow, { borderTopColor: colors.border }]}>
                          <View style={styles.logStaffCell}>
                            <Text style={[styles.logStaffName, { color: colors.text }]} numberOfLines={1}>{staffItem.name}</Text>
                            <Text style={[styles.logStaffMeta, { color: colors.textSecondary }]} numberOfLines={1}>{staffItem.permission_name}</Text>
                          </View>
                          {STAFF_LOG_COLUMNS.map((column) => (
                            <View key={`${staffId}-${column.key}`} style={styles.logCell}>
                              {column.type === 'select' ? (
                                <TouchableOpacity
                                  style={[styles.logSelectBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                                  onPress={() => openCoefficientPicker(staffId)}
                                  activeOpacity={0.82}
                                >
                                  <Text style={[styles.logSelectText, { color: row[column.key] ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                                    {row[column.key] || 'Chọn'}
                                  </Text>
                                  <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                                </TouchableOpacity>
                              ) : (
                                <TextInput
                                  value={formatLogValue(row[column.key], column.type)}
                                  onChangeText={(value) => setStaffValue(staffId, column.key, value)}
                                  keyboardType="numeric"
                                  placeholder="0"
                                  placeholderTextColor={colors.textSecondary}
                                  style={[styles.logInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                />
                              )}
                            </View>
                          ))}
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </ScrollView>
            )}

            <View style={[styles.logFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.logFooterBtn, { borderColor: colors.border }]} onPress={closeLogModal} disabled={logSaving}>
                <Text style={[styles.logFooterBtnText, { color: colors.textSecondary }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.logFooterBtn, styles.logFooterPrimary]} onPress={submitLogs} disabled={logSaving}>
                <Text style={[styles.logFooterBtnText, styles.logFooterPrimaryText]}>
                  {logSaving ? 'Đang lưu...' : 'Lưu tất cả'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={coefficientPicker.visible} transparent animationType="fade" onRequestClose={closeCoefficientPicker}>
        <Pressable style={styles.logBackdrop} onPress={closeCoefficientPicker}>
          <Pressable style={[styles.coeffModalPanel, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.coeffModalTitle, { color: colors.text }]}>Chọn hệ số tăng ca</Text>
            {OVERTIME_COEFFICIENTS.map((item) => (
              <TouchableOpacity key={`coeff-${item}`} style={[styles.coeffModalItem, { borderTopColor: colors.border }]} onPress={() => onSelectCoefficient(item)}>
                <Text style={[styles.coeffModalItemText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function blankStaffLogForm(): StaffLogForm {
  return {
    commission: '',
    bonus: '',
    overtime_hour: '',
    overtime_coefficient: '',
    advence: '',
    fined: '',
    day_off_hour: '',
  };
}

function sanitizeStaffLogValue(key: StaffLogKey, value: string) {
  if (key === 'overtime_coefficient') {
    return value.replace(/[^0-9.]/g, '');
  }
  return value.replace(/[^\d]/g, '');
}

function formatLogValue(value: string, type: (typeof STAFF_LOG_COLUMNS)[number]['type']) {
  if (!value) return '';
  if (type === 'money') {
    const numeric = value.replace(/[^\d]/g, '');
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  return value;
}

function OverviewStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.overviewStat}>
      <Text style={[styles.overviewValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.overviewLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function compactMoney(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  fullBleedRow: {
    marginHorizontal: -Spacing.lg,
  },
  filterBleedRow: {
    paddingRight: Spacing.lg,
  },
  overviewCard: {
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  overviewTitle: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 10,
  },
  overviewStat: {
    flex: 1,
  },
  overviewValue: {
    ...Typography.h3,
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  overviewLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.84)',
    marginTop: 2,
  },
  limitText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.84)',
    marginTop: 8,
  },
  errorBanner: {
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#f2c6c6',
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    flex: 1,
  },
  retryText: {
    ...Typography.captionMd,
    color: Colors.danger,
    fontWeight: '700',
  },
  bulkLogBtn: {
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.sm,
  },
  bulkLogBtnText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  rowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    ...Shadow.sm,
  },
  rowWithSeparator: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
  },
  rowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.bodyMd,
    fontSize: 16,
    fontWeight: '800',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  mainContent: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    ...Typography.bodyMd,
    color: Colors.text,
    flex: 1,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusText: {
    ...Typography.caption,
    marginTop: 2,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 52,
    gap: 10,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loadMoreText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  footerLoading: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  fabPill: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    ...Shadow.md,
  },
  fabDisabled: {
    opacity: 0.55,
  },
  fabPillText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
  logBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  logPanel: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    maxHeight: '90%',
    paddingTop: 12,
  },
  logHeader: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  logTitle: {
    ...Typography.bodyMd,
    fontWeight: '800',
  },
  logLoadingWrap: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logSectionTitle: {
    ...Typography.captionMd,
    fontWeight: '700',
    marginBottom: 6,
    marginHorizontal: 12,
  },
  logColumnsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  logColumnItem: {
    width: '48%',
    gap: 5,
  },
  logLabel: {
    ...Typography.caption,
    fontWeight: '700',
  },
  logInput: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    ...Typography.bodySm,
    fontWeight: '700',
  },
  logSelectBtn: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logSelectText: {
    ...Typography.bodySm,
    fontWeight: '700',
  },
  coeffChip: {
    minWidth: 30,
    minHeight: 24,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
  },
  coeffChipActive: {
    backgroundColor: Colors.primary,
  },
  coeffChipText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  coeffChipTextActive: {
    color: '#fff',
  },
  applyAllBtn: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  applyAllBtnText: {
    ...Typography.captionMd,
    color: '#fff',
    fontWeight: '800',
  },
  logTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    paddingVertical: 6,
  },
  logStaffHeaderText: {
    width: 140,
    ...Typography.captionMd,
    fontWeight: '700',
  },
  logHeaderCellText: {
    width: 108,
    ...Typography.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
  logTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    paddingVertical: 7,
    borderTopWidth: 1,
  },
  logStaffCell: {
    width: 140,
    paddingRight: 8,
  },
  logStaffName: {
    ...Typography.bodySm,
    fontWeight: '700',
  },
  logStaffMeta: {
    ...Typography.caption,
    marginTop: 2,
  },
  logCell: {
    width: 108,
    paddingHorizontal: 4,
  },
  coeffModalPanel: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    marginHorizontal: 28,
    overflow: 'hidden',
  },
  coeffModalTitle: {
    ...Typography.bodySm,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  coeffModalItem: {
    minHeight: 42,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coeffModalItemText: {
    ...Typography.bodySm,
    fontWeight: '700',
  },
  logFooter: {
    marginTop: 8,
    borderTopWidth: 1,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
  },
  logFooterBtn: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logFooterBtnText: {
    ...Typography.bodySm,
    fontWeight: '700',
  },
  logFooterPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  logFooterPrimaryText: {
    color: '#fff',
  },
});
