import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { ChipRow, SearchBar } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

type ReturnStatus = 'pending' | 'approved' | 'refunded' | 'rejected';

interface ReturnItem {
  id: number;
  returnCode: string;
  sourceOrderCode: string;
  customerName: string;
  reasonKey: TranslationKey;
  itemCount: number;
  refundAmount: number;
  status: ReturnStatus;
  createdAt: string;
}

const MOCK_RETURNS: ReturnItem[] = [
  {
    id: 1,
    returnCode: 'TH-2412-008',
    sourceOrderCode: 'DH00000008',
    customerName: 'Nguyễn Thị Lan',
    reasonKey: 'returns.reason.defective',
    itemCount: 1,
    refundAmount: 285000,
    status: 'pending',
    createdAt: '10:42',
  },
  {
    id: 2,
    returnCode: 'TH-2412-007',
    sourceOrderCode: 'DH00000007',
    customerName: 'Trần Văn Minh',
    reasonKey: 'returns.reason.notSatisfied',
    itemCount: 2,
    refundAmount: 120000,
    status: 'approved',
    createdAt: '09:15',
  },
  {
    id: 3,
    returnCode: 'TH-2412-006',
    sourceOrderCode: 'DH00000006',
    customerName: 'Lê Thị Hoa',
    reasonKey: 'returns.reason.wrongModel',
    itemCount: 1,
    refundAmount: 45000,
    status: 'refunded',
    createdAt: '16:20',
  },
  {
    id: 4,
    returnCode: 'TH-2412-005',
    sourceOrderCode: 'DH00000005',
    customerName: 'Phạm Đức Anh',
    reasonKey: 'returns.reason.expired',
    itemCount: 3,
    refundAmount: 540000,
    status: 'pending',
    createdAt: '14:08',
  },
  {
    id: 5,
    returnCode: 'TH-2412-004',
    sourceOrderCode: 'DH00000004',
    customerName: 'Khách lẻ',
    reasonKey: 'returns.reason.changeSize',
    itemCount: 1,
    refundAmount: 28000,
    status: 'rejected',
    createdAt: '2 ngày trước',
  },
];

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

const formatMoneyShort = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  return String(value);
};

export function ReturnsListScreen() {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | ReturnStatus>('all');

  const stats = useMemo(() => {
    const pending = MOCK_RETURNS.filter(item => item.status === 'pending').length;
    const approved = MOCK_RETURNS.filter(item => item.status === 'approved').length;
    const refundedAmount = MOCK_RETURNS
      .filter(item => item.status === 'refunded')
      .reduce((sum, item) => sum + item.refundAmount, 0);
    const returnRate = 1.8;
    return { pending, approved, refundedAmount, returnRate };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return MOCK_RETURNS.filter(item => {
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
        t(item.reasonKey).toLowerCase().includes(query)
      );
    });
  }, [filter, search]);

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
          <View
            style={[
              styles.card,
              index === 0 && styles.cardFirst,
              index === filtered.length - 1 && styles.cardLast,
            ]}
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
              <Text style={styles.time}>{item.id <= 2 ? t('returns.todayAt', { time: item.createdAt }) : item.id <= 4 ? t('returns.yesterdayAt', { time: item.createdAt }) : t('returns.twoDaysAgo')}</Text>
            </View>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.reason}>“{t(item.reasonKey)}”</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.itemCount}>{t('returns.itemCount', { count: item.itemCount })}</Text>
              <Text style={styles.refund}>-{formatMoneyShort(item.refundAmount)}</Text>
            </View>
            {item.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]}>
                  <Text style={styles.approveTxt}>✓ {t('returns.approve')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]}>
                  <Text style={styles.rejectTxt}>✗ {t('returns.reject')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
