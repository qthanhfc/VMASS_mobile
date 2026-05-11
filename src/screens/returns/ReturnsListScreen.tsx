import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { ChipRow, SearchBar } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import { useRealtimeRefresh } from '../../realtime';
import {
  approveReturnRequest,
  executeReturnRequest,
  listReturnRequests,
  rejectReturnRequest,
  type ReturnRequest,
  type ReturnRequestStatus,
} from '../../services';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

type ReturnStatus = 'pending' | 'approved' | 'refunded' | 'rejected';

const STATUS_CHIPS = [
  { key: 'all', labelKey: 'messages.filter.all' },
  { key: 'pending', labelKey: 'returns.status.pendingWithCount' },
  { key: 'approved', labelKey: 'returns.status.approved' },
  { key: 'refunded', labelKey: 'returns.status.refunded' },
  { key: 'rejected', labelKey: 'returns.status.rejected' },
];

const STATUS_META: Record<ReturnStatus, { labelKey: TranslationKey; color: string; bg: string }> = {
  pending: { labelKey: 'returns.status.pending', color: Colors.warning, bg: Colors.warningLight },
  approved: { labelKey: 'returns.status.approved', color: Colors.primary, bg: Colors.primaryLight },
  refunded: { labelKey: 'returns.status.refunded', color: Colors.success, bg: Colors.successLight },
  rejected: { labelKey: 'returns.status.rejected', color: Colors.textSecondary, bg: Colors.border },
};

const mapStatus = (status: ReturnRequestStatus): ReturnStatus => {
  if (status === 'completed') return 'refunded';
  if (status === 'rejected') return 'rejected';
  if (status === 'approved') return 'approved';
  return 'pending';
};

const toReasonKey = (reasonKey?: string | null): TranslationKey => {
  const value = String(reasonKey || '').trim();
  if (!value) return 'returns.reason.other';
  if (value.startsWith('returns.reason.')) return value as TranslationKey;
  return `returns.reason.${value}` as TranslationKey;
};

const formatMoneyShort = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  return String(value);
};

const formatSystemDateTime = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export function ReturnsListScreen() {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | ReturnStatus>('all');
  const [rows, setRows] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState('');

  const loadRows = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await listReturnRequests();
      setRows(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tải được danh sách trả hàng';
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRows();
    }, [loadRows]),
  );
  const handleRefresh = useCallback(() => {
    void loadRows(true);
  }, [loadRows]);
  useRealtimeRefresh(['returns'], handleRefresh);

  const stats = useMemo(() => {
    const pending = rows.filter(item => mapStatus(item.status) === 'pending').length;
    const approved = rows.filter(item => mapStatus(item.status) === 'approved').length;
    const refundedAmount = rows
      .filter(item => mapStatus(item.status) === 'refunded')
      .reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
    const returnRate = 1.8;
    return { pending, approved, refundedAmount, returnRate };
  }, [rows]);

  const mappedItems = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        returnCode: row.return_code,
        sourceOrderCode: row.source_order_code || 'N/A',
        customerName: `NV #${row.requested_by || 'N/A'}`,
        reasonKey: toReasonKey(row.reason_key) as TranslationKey,
        reasonText: row.reason_text || '',
        itemCount: Array.isArray(row.items) ? row.items.length : 0,
        refundAmount: Number(row.total_amount || 0),
        status: mapStatus(row.status),
        createdAt: row.createdAt || '',
      })),
    [rows],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return mappedItems.filter(item => {
      if (filter !== 'all' && item.status !== filter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        item.returnCode.toLowerCase().includes(query) ||
        item.sourceOrderCode.toLowerCase().includes(query) ||
        item.customerName.toLowerCase().includes(query) ||
        t(item.reasonKey).toLowerCase().includes(query) ||
        item.reasonText.toLowerCase().includes(query)
      );
    });
  }, [filter, mappedItems, search, t]);

  const onApprove = async (id: string) => {
    try {
      setActingId(id);
      await approveReturnRequest(id);
      await loadRows(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Duyệt phiếu thất bại';
      Alert.alert('Lỗi', message);
    } finally {
      setActingId('');
    }
  };

  const onReject = async (id: string) => {
    try {
      setActingId(id);
      await rejectReturnRequest(id, 'Từ chối từ mobile');
      await loadRows(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Từ chối phiếu thất bại';
      Alert.alert('Lỗi', message);
    } finally {
      setActingId('');
    }
  };

  const onExecute = async (id: string) => {
    try {
      setActingId(id);
      await executeReturnRequest(id);
      await loadRows(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Thực thi hoàn tiền thất bại';
      Alert.alert('Lỗi', message);
    } finally {
      setActingId('');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('returns.title')}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{t('returns.pendingSubtitle', { count: stats.pending })}</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListHeaderComponent={
          <View>
            <View style={styles.fullBleedRow}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder={t('returns.searchPlaceholder')}
              />
            </View>

            <View style={styles.statsRow}>
              {[
                { label: t('returns.status.pending'), value: stats.pending, color: Colors.warning },
                { label: t('returns.status.approved'), value: stats.approved, color: Colors.primary },
                { label: t('returns.monthlyRefund'), value: formatMoneyShort(stats.refundedAmount), color: Colors.success },
                { label: t('returns.returnRate'), value: `${stats.returnRate}%`, color: Colors.accent },
              ].map(s => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.fullBleedRow, styles.filterBleedRow]}>
              <ChipRow
                chips={STATUS_CHIPS.map(chip => ({ key: chip.key, label: t(chip.labelKey as TranslationKey) }))}
                selected={filter}
                onSelect={key => setFilter(key as 'all' | ReturnStatus)}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="search-outline" size={24} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>{t('returns.empty')}</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.card,
              index === 0 && styles.cardFirst,
              index === filtered.length - 1 && styles.cardLast,
            ]}
            onPress={() => nav.navigate('ReturnDetail', { id: item.id })}
            activeOpacity={0.88}
          >
            <View style={styles.cardTop}>
              <Text style={styles.returnCode}>#{item.returnCode}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_META[item.status].bg },
                ]}
              >
                <Text
                  style={[
                    styles.statusLabel,
                    { color: STATUS_META[item.status].color },
                  ]}
                >
                  {t(STATUS_META[item.status].labelKey)}
                </Text>
              </View>
              <Text style={styles.time}>{formatSystemDateTime(item.createdAt)}</Text>
            </View>
            <Text style={styles.customerName}>{item.customerName} · {item.sourceOrderCode}</Text>
            <Text style={styles.reason}>“{item.reasonText || t(item.reasonKey)}”</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.itemCount}>{t('returns.itemCount', { count: item.itemCount })}</Text>
              <Text style={styles.refund}>-{formatMoneyShort(item.refundAmount)}</Text>
            </View>
            {item.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  disabled={actingId === item.id}
                  onPress={() => onApprove(item.id)}
                >
                  <Text style={styles.approveTxt}>{actingId === item.id ? '...' : `✓ ${t('returns.approve')}`}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  disabled={actingId === item.id}
                  onPress={() => onReject(item.id)}
                >
                  <Text style={styles.rejectTxt}>{actingId === item.id ? '...' : `✗ ${t('returns.reject')}`}</Text>
                </TouchableOpacity>
              </View>
            )}
            {item.status === 'approved' && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  disabled={actingId === item.id}
                  onPress={() => onExecute(item.id)}
                >
                  <Text style={styles.approveTxt}>{actingId === item.id ? '...' : '✓ Hoàn tiền'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={styles.fabPill}
        onPress={() => nav.navigate('ReturnCreate')}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.fabPillText}>{t('returns.createTitle')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginRight: 8, padding: 4 },
  headerMain: { flex: 1 },
  headerTitle: { ...Typography.h3 },
  headerSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 66,
    ...Shadow.sm,
  },
  statVal: { ...Typography.h4, fontWeight: '700' },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1, fontSize: 10.5, textAlign: 'center' },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 96 },
  fullBleedRow: {
    marginHorizontal: -Spacing.lg,
  },
  filterBleedRow: {
    paddingRight: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardFirst: {
    marginTop: Spacing.xs,
    borderTopWidth: 0,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  cardLast: {
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  returnCode: { ...Typography.label, color: Colors.text, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  statusLabel: { ...Typography.label },
  time: { ...Typography.caption, color: Colors.textSecondary, marginLeft: 'auto' },
  customerName: { ...Typography.bodyMd, color: Colors.text, marginTop: 5 },
  reason: { ...Typography.captionMd, color: Colors.textSecondary, marginTop: 3, fontStyle: 'italic' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  itemCount: { ...Typography.caption, color: Colors.textSecondary },
  refund: { ...Typography.h4, color: Colors.accent, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.md },
  approveBtn: { backgroundColor: Colors.success },
  rejectBtn: { borderWidth: 1.5, borderColor: Colors.border },
  approveTxt: { ...Typography.bodyMd, color: Colors.card },
  rejectTxt: { ...Typography.bodyMd, color: Colors.text },
  emptyWrap: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
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
  fabPillText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
});
