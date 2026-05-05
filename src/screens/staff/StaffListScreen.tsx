import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { Header, SearchBar, ChipRow, Card } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type StaffStatus = 'online' | 'offline' | 'break';
type StaffFilter = 'all' | 'onDuty' | 'manager' | 'cashier' | 'sales' | 'warehouse' | 'd1' | 'd3';

type StaffRow = {
  id: number;
  name: string;
  role: string;
  roleLabelKey: TranslationKey;
  roleKey: 'owner' | 'manager' | 'cashier' | 'sales' | 'warehouse';
  branch: string;
  branchLabelKey: TranslationKey;
  branchKey: 'all' | 'd1' | 'd3' | 'wh';
  status: StaffStatus;
  shiftLabelKey: TranslationKey;
  accent: string;
};

const STATUS_META: Record<StaffStatus, { labelKey: TranslationKey; color: string }> = {
  online: { labelKey: 'staff.status.online', color: '#4a9f4a' },
  offline: { labelKey: 'staff.status.offline', color: '#8a8a8a' },
  break: { labelKey: 'staff.status.break', color: '#d97757' },
};

const FILTER_CHIPS: Array<{ key: StaffFilter; labelKey: TranslationKey }> = [
  { key: 'all', labelKey: 'messages.filter.all' },
  { key: 'onDuty', labelKey: 'staff.status.online' },
  { key: 'manager', labelKey: 'staff.role.manager' },
  { key: 'cashier', labelKey: 'staff.role.cashier' },
  { key: 'sales', labelKey: 'staff.role.sales' },
  { key: 'warehouse', labelKey: 'staff.role.warehouse' },
  { key: 'd1', labelKey: 'staff.branch.d1Short' },
  { key: 'd3', labelKey: 'staff.branch.d3Short' },
];

const MOCK_STAFF: StaffRow[] = [
  { id: 1, name: 'Nguyễn Thị Mai', role: 'Chủ cửa hàng', roleLabelKey: 'staff.role.owner', roleKey: 'owner', branch: 'Tất cả CN', branchLabelKey: 'staff.branch.all', branchKey: 'all', status: 'online', shiftLabelKey: 'staff.shift.fulltime', accent: '#008ecc' },
  { id: 2, name: 'Trần Văn Hùng', role: 'Quản lý', roleLabelKey: 'staff.role.manager', roleKey: 'manager', branch: 'CN Quận 1', branchLabelKey: 'staff.branch.d1', branchKey: 'd1', status: 'online', shiftLabelKey: 'staff.shift.morning', accent: '#7a9e7a' },
  { id: 3, name: 'Lê Minh Phúc', role: 'Thu ngân', roleLabelKey: 'staff.role.cashier', roleKey: 'cashier', branch: 'CN Quận 1', branchLabelKey: 'staff.branch.d1', branchKey: 'd1', status: 'online', shiftLabelKey: 'staff.shift.morning', accent: '#d4a574' },
  { id: 4, name: 'Phạm Thị Linh', role: 'Thu ngân', roleLabelKey: 'staff.role.cashier', roleKey: 'cashier', branch: 'CN Quận 3', branchLabelKey: 'staff.branch.d3', branchKey: 'd3', status: 'offline', shiftLabelKey: 'staff.shift.afternoon', accent: '#d4a574' },
  { id: 5, name: 'Vũ Hoàng Nam', role: 'Bán hàng', roleLabelKey: 'staff.role.sales', roleKey: 'sales', branch: 'CN Quận 1', branchLabelKey: 'staff.branch.d1', branchKey: 'd1', status: 'break', shiftLabelKey: 'staff.shift.morning', accent: '#8a8a6a' },
  { id: 6, name: 'Đặng Thu Hà', role: 'Kho', roleLabelKey: 'staff.role.warehouse', roleKey: 'warehouse', branch: 'Kho trung tâm', branchLabelKey: 'staff.branch.warehouse', branchKey: 'wh', status: 'online', shiftLabelKey: 'staff.shift.fulltime', accent: '#b08968' },
  { id: 7, name: 'Bùi Đức Anh', role: 'Bán hàng', roleLabelKey: 'staff.role.sales', roleKey: 'sales', branch: 'CN Quận 3', branchLabelKey: 'staff.branch.d3', branchKey: 'd3', status: 'offline', shiftLabelKey: 'staff.shift.afternoon', accent: '#8a8a6a' },
];

function getInitial(name: string) {
  return name.trim().charAt(name.trim().length - 1).toUpperCase();
}

export function StaffListScreen() {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StaffFilter>('all');

  const onDutyCount = useMemo(
    () => MOCK_STAFF.filter((staff) => staff.status === 'online').length,
    []
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return MOCK_STAFF.filter((staff) => {
      const matchSearch =
        query.length === 0 ||
        staff.name.toLowerCase().includes(query) ||
        t(staff.roleLabelKey).toLowerCase().includes(query);

      const matchFilter =
        filter === 'all' ||
        (filter === 'onDuty' && staff.status === 'online') ||
        (filter === 'manager' && (staff.roleKey === 'manager' || staff.roleKey === 'owner')) ||
        (filter === 'cashier' && staff.roleKey === 'cashier') ||
        (filter === 'sales' && staff.roleKey === 'sales') ||
        (filter === 'warehouse' && staff.roleKey === 'warehouse') ||
        (filter === 'd1' && staff.branchKey === 'd1') ||
        (filter === 'd3' && staff.branchKey === 'd3');

      return matchSearch && matchFilter;
    });
  }, [filter, search]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title={t('staff.title')}
        subtitle={t('staff.subtitle', { total: MOCK_STAFF.length, onDuty: onDutyCount })}
        onBack={() => nav.goBack()}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.fullBleedRow}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder={t('staff.searchPlaceholder')}
              />
            </View>

            <View style={styles.attendanceWrap}>
              <Card padding={12}>
                <View style={styles.attendanceHead}>
                  <View style={styles.attendanceTitleWrap}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.text} />
                    <Text style={styles.attendanceTitle}>{t('staff.attendanceToday')}</Text>
                  </View>
                  <TouchableOpacity>
                    <Text style={styles.attendanceAction}>{t('staff.detail')} {'>'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.attendanceRow}>
                  {[
                    { label: t('staff.checkedIn'), value: '8', color: '#4a9f4a' },
                    { label: t('staff.notCheckedIn'), value: '2', color: '#d97757' },
                    { label: t('staff.absent'), value: '2', color: '#8a8a8a' },
                    { label: t('staff.late'), value: '1', color: '#c94a4a' },
                  ].map((stat) => (
                    <View key={stat.label} style={styles.attendanceStat}>
                      <Text style={[styles.attendanceValue, { color: stat.color }]}>{stat.value}</Text>
                      <Text style={styles.attendanceLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </View>

            <View style={[styles.fullBleedRow, styles.filterBleedRow]}>
              <ChipRow chips={FILTER_CHIPS.map(chip => ({ key: chip.key, label: t(chip.labelKey) }))} selected={filter} onSelect={(value) => setFilter(value as StaffFilter)} />
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          const isLast = index === filtered.length - 1;
          const status = STATUS_META[item.status];

          return (
            <TouchableOpacity
              style={[
                styles.row,
                isFirst && styles.rowFirst,
                !isFirst && styles.rowWithSeparator,
                isLast && styles.rowLast,
              ]}
              onPress={() => nav.navigate('StaffEdit', { id: item.id })}
            >
              <View style={styles.avatarWrap}>
                <View style={[styles.avatarCircle, { borderColor: item.accent, backgroundColor: `${item.accent}33` }]}>
                  <Text style={[styles.avatarText, { color: item.accent }]}>{getInitial(item.name)}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              </View>

              <View style={styles.mainContent}>
                <Text style={styles.nameText}>{item.name}</Text>
                <Text style={styles.metaText}>{t(item.roleLabelKey)} · {t(item.branchLabelKey)}</Text>
                <Text style={[styles.statusText, { color: status.color }]}>● {t(status.labelKey)} · {t(item.shiftLabelKey)}</Text>
              </View>

              <Ionicons name="ellipsis-horizontal" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={46} color={Colors.border} />
            <Text style={styles.emptyText}>{t('staff.empty')}</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fabPill} onPress={() => nav.navigate('StaffEdit', {})}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.fabPillText}>{t('staff.addShort')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  attendanceWrap: {
    paddingBottom: Spacing.sm,
  },
  attendanceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  attendanceTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendanceTitle: {
    ...Typography.captionMd,
    color: Colors.text,
    fontWeight: '700',
  },
  attendanceAction: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  attendanceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceStat: {
    flex: 1,
    alignItems: 'center',
  },
  attendanceValue: {
    ...Typography.h2,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  attendanceLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: 1,
    fontWeight: '500',
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
  nameText: {
    ...Typography.bodyMd,
    color: Colors.text,
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
  fabPillText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
});
