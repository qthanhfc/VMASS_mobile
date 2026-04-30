import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { ChipRow, Header, SearchBar } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

type OrderStatus = 'pending' | 'packing' | 'shipping' | 'done' | 'cancelled';
type OrderChannel = 'pos' | 'shopee' | 'lazada' | 'tiktok' | 'tiki';

type MockOrder = {
  id: number;
  orderNumber: string;
  customerName: string;
  items: number;
  total: number;
  status: OrderStatus;
  channel: OrderChannel;
  channelLabel: string;
  createdAt: string;
};

const CHANNEL_META: Record<OrderChannel, { short: string; label: string; color: string }> = {
  pos: { short: 'P', label: 'POS', color: '#008ecc' },
  shopee: { short: 'S', label: 'Shopee', color: '#ee4d2d' },
  lazada: { short: 'L', label: 'Lazada', color: '#0f146d' },
  tiktok: { short: 'T', label: 'TikTok Shop', color: '#1a1a1a' },
  tiki: { short: 'K', label: 'Tiki', color: '#0a7cff' },
};

const STATUS_META: Record<OrderStatus, { labelKey: TranslationKey; textColor: string; bgColor: string }> = {
  pending: { labelKey: 'orders.status.pending', textColor: '#d97757', bgColor: '#fff2ed' },
  packing: { labelKey: 'orders.status.packing', textColor: '#6b8cae', bgColor: '#edf5ff' },
  shipping: { labelKey: 'orders.status.shipping', textColor: '#8a6a9e', bgColor: '#f4ecfb' },
  done: { labelKey: 'orders.status.done', textColor: '#2e7d32', bgColor: '#e8f5e9' },
  cancelled: { labelKey: 'orders.status.cancelled', textColor: '#6b6860', bgColor: '#efede7' },
};

const MOCK_ORDERS: MockOrder[] = [
  { id: 1, orderNumber: 'DH-2412-0038', customerName: 'Nguyễn Thị Lan', items: 4, total: 524000, status: 'pending', channel: 'shopee', channelLabel: 'Shopee', createdAt: '10:42' },
  { id: 2, orderNumber: 'DH-2412-0037', customerName: 'Khách lẻ', items: 2, total: 87000, status: 'done', channel: 'pos', channelLabel: 'POS', createdAt: '10:28' },
  { id: 3, orderNumber: 'DH-2412-0036', customerName: 'Trần Văn Minh', items: 8, total: 1200000, status: 'shipping', channel: 'tiktok', channelLabel: 'TikTok Shop', createdAt: '10:15' },
  { id: 4, orderNumber: 'DH-2412-0035', customerName: 'Lê Thị Hoa', items: 3, total: 245000, status: 'packing', channel: 'lazada', channelLabel: 'Lazada', createdAt: '09:58' },
  { id: 5, orderNumber: 'DH-2412-0034', customerName: 'Khách lẻ', items: 1, total: 32000, status: 'done', channel: 'pos', channelLabel: 'POS', createdAt: '09:44' },
  { id: 6, orderNumber: 'DH-2412-0033', customerName: 'Phạm Đức Anh', items: 5, total: 680000, status: 'pending', channel: 'shopee', channelLabel: 'Shopee', createdAt: '09:30' },
  { id: 7, orderNumber: 'DH-2412-0032', customerName: 'Vũ Thị Mai', items: 2, total: 156000, status: 'cancelled', channel: 'lazada', channelLabel: 'Lazada', createdAt: '09:12' },
  { id: 8, orderNumber: 'DH-2412-0031', customerName: 'Hoàng Văn Tú', items: 12, total: 2100000, status: 'done', channel: 'pos', channelLabel: 'POS', createdAt: '08:55' },
];

const CHANNEL_FILTERS: Array<{ key: 'all' | OrderChannel; labelKey?: TranslationKey; label?: string }> = [
  { key: 'all', labelKey: 'messages.filter.all' },
  { key: 'pos', label: 'POS' },
  { key: 'shopee', label: 'Shopee' },
  { key: 'lazada', label: 'Lazada' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'tiki', label: 'Tiki' },
];

export function OrdersListScreen() {
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | OrderChannel>('all');

  const statusCounts = useMemo(
    () => ({
      pending: MOCK_ORDERS.filter((o) => o.status === 'pending').length,
      packing: MOCK_ORDERS.filter((o) => o.status === 'packing').length,
      shipping: MOCK_ORDERS.filter((o) => o.status === 'shipping').length,
      done: MOCK_ORDERS.filter((o) => o.status === 'done').length,
      cancelled: MOCK_ORDERS.filter((o) => o.status === 'cancelled').length,
    }),
    []
  );

  const statusChips = useMemo(
    () => [
      { key: 'all', label: t('messages.filter.all'), count: MOCK_ORDERS.length },
      { key: 'pending', label: t('orders.status.pending'), count: statusCounts.pending },
      { key: 'packing', label: t('orders.status.packing'), count: statusCounts.packing },
      { key: 'shipping', label: t('orders.status.shipping'), count: statusCounts.shipping },
      { key: 'done', label: t('orders.status.done'), count: statusCounts.done },
      { key: 'cancelled', label: t('orders.status.cancelled'), count: statusCounts.cancelled },
    ],
    [statusCounts, t]
  );

  const filtered = useMemo(
    () =>
      MOCK_ORDERS.filter((o) => {
        const q = search.trim().toLowerCase();
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        const matchChannel = channelFilter === 'all' || o.channel === channelFilter;
        const matchSearch =
          q.length === 0 ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q);
        return matchStatus && matchChannel && matchSearch;
      }),
    [channelFilter, search, statusFilter]
  );

  const totalRevenue = useMemo(
    () => MOCK_ORDERS.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={t('orders.title')}
        subtitle={t('orders.subtitle', { total: MOCK_ORDERS.length, pending: statusCounts.pending })}
        onBack={() => nav.goBack()}
        rightActions={
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="search" size={20} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="filter-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        }
      />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={t('orders.searchPlaceholder')}
        onQrPress={() => nav.navigate('QrScan')}
      />

      <View style={styles.statsRow}>
        {[
          { label: t('orders.totalOrders'), value: MOCK_ORDERS.length.toLocaleString(dateLocale), color: Colors.text },
          { label: t('orders.status.pending'), value: statusCounts.pending.toLocaleString(dateLocale), color: '#d97757' },
          { label: t('orders.status.shipping'), value: statusCounts.shipping.toLocaleString(dateLocale), color: '#8a6a9e' },
          { label: t('home.kpi.revenue'), value: `${(totalRevenue / 1000000).toFixed(1)}M`, color: Colors.primary },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ChipRow chips={statusChips} selected={statusFilter} onSelect={(key) => setStatusFilter(key as 'all' | OrderStatus)} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.channelContent}
        style={styles.channelScroll}
      >
        <Text style={styles.channelTitle}>{t('orders.channel')}:</Text>
        {CHANNEL_FILTERS.map((channel) => {
          const active = channelFilter === channel.key;
          return (
            <TouchableOpacity
              key={channel.key}
              onPress={() => setChannelFilter(channel.key)}
              style={[styles.channelChip, active && styles.channelChipActive]}
            >
              <Text style={[styles.channelLabel, active && styles.channelLabelActive]}>
                {channel.labelKey ? t(channel.labelKey) : channel.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const statusMeta = STATUS_META[item.status];
          const channelMeta = CHANNEL_META[item.channel];
          const isFirst = index === 0;
          const isLast = index === filtered.length - 1;

          return (
            <TouchableOpacity
              style={[
                styles.orderRow,
                isFirst && styles.orderRowFirst,
                !isFirst && styles.orderRowWithSeparator,
                isLast && styles.orderRowLast,
                item.status === 'cancelled' && styles.orderRowCancelled,
              ]}
              onPress={() => nav.navigate('OrderDetail', { id: item.id })}
            >
              <View style={styles.orderTopLine}>
                <Text style={styles.orderNum}>#{item.orderNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusMeta.bgColor }]}>
                  <Text style={[styles.statusText, { color: statusMeta.textColor }]}>{t(statusMeta.labelKey)}</Text>
                </View>
                <Text style={styles.orderTime}>{item.createdAt}</Text>
              </View>

              <View style={styles.customerLine}>
                <View style={[styles.channelSquare, { backgroundColor: channelMeta.color }]}>
                  <Text style={styles.channelShort}>{channelMeta.short}</Text>
                </View>
                <Text style={styles.customerName} numberOfLines={1}>{item.customerName}</Text>
                <Text style={styles.channelName}>· {item.channelLabel}</Text>
              </View>

              <View style={styles.orderBottomLine}>
                <Text style={styles.itemsText}>{t('orders.itemCount', { count: item.items })}</Text>
                <Text style={styles.orderTotal}>{item.total.toLocaleString(dateLocale)}{t('home.currency')}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <Text style={styles.loadMoreText}>
            {t('orders.loadMore', { count: Math.max(MOCK_ORDERS.length - filtered.length, 0) })}
          </Text>
        }
      />

      <TouchableOpacity style={styles.fabPill} onPress={() => nav.navigate('PosScreen')}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.fabText}>{t('orders.createOrder')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 6,
  },
  statVal: {
    ...Typography.bodyMd,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  channelScroll: {
    maxHeight: 34,
    marginBottom: Spacing.sm,
  },
  channelContent: {
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.xl,
    alignItems: 'center',
    gap: 6,
  },
  channelTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginRight: 2,
  },
  channelChip: {
    height: 26,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  channelChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  channelLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  channelLabelActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  orderRow: {
    backgroundColor: Colors.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  orderRowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    ...Shadow.sm,
  },
  orderRowWithSeparator: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
  },
  orderRowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  orderRowCancelled: {
    opacity: 0.58,
  },
  orderTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  orderNum: {
    ...Typography.captionMd,
    color: Colors.text,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusText: {
    ...Typography.label,
    fontSize: 10,
  },
  orderTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 'auto',
    fontFamily: 'monospace',
  },
  customerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  channelSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelShort: {
    ...Typography.label,
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },
  customerName: {
    ...Typography.bodyMd,
    color: Colors.text,
    flex: 1,
  },
  channelName: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  orderBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemsText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  orderTotal: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '700',
  },
  loadMoreText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
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
  fabText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
});
