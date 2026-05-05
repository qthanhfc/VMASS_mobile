import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { Header, SearchBar } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import {
  getCachedOrders,
  listOrders,
  type OrderChannel,
  type OrderListItem,
  type OrderStatus,
} from '../../services';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

const PAGE_SIZE = 12;

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
  const route = useRoute<RouteProp<ManageStackParamList, 'OrdersList'>>();
  const routePhone = (route.params?.customerPhone || '').replace(/[^\d+]/g, '');
  const routeCustomerName = (route.params?.customerName || '').trim();
  const isCustomerScoped = routePhone.length > 0;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | OrderChannel>('all');
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [totalItem, setTotalItem] = useState(0);
  const [totalPage, setTotalPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [usingCache, setUsingCache] = useState(false);
  const loadingPageKeysRef = useRef(new Set<string>());

  const mergeOrders = useCallback((current: OrderListItem[], next: OrderListItem[]) => {
    const map = new Map<string, OrderListItem>();
    [...current, ...next].forEach((item) => {
      map.set(item.detailId || item.id, item);
    });
    return Array.from(map.values());
  }, []);

  const loadOrderPage = useCallback(
    async (page = 1, options?: { append?: boolean; silent?: boolean }) => {
      const apiSearch = isCustomerScoped ? routePhone : debouncedSearch;
      const pageKey = `${apiSearch}:${page}`;
      if (loadingPageKeysRef.current.has(pageKey)) return;
      loadingPageKeysRef.current.add(pageKey);

      if (options?.append) {
        setLoadingMore(true);
      } else if (!options?.silent) {
        setLoading(true);
      }
      setError('');

      try {
        const result = await listOrders({
          pageSize: PAGE_SIZE,
          currentPage: page,
          search: apiSearch,
        });
        setOrders((prev) => (options?.append ? mergeOrders(prev, result.items) : result.items));
        setTotalItem(result.totalItem);
        setTotalPage(result.totalPage);
        setCurrentPage(result.currentPage);
        setUsingCache(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không thể tải danh sách đơn hàng.';
        setError(message);

        if (page === 1) {
          const cached = await getCachedOrders();
          if (cached) {
            setOrders(cached.items);
            setTotalItem(cached.totalItem);
            setTotalPage(cached.totalPage);
            setCurrentPage(cached.currentPage);
            setUsingCache(true);
          }
        }
      } finally {
        loadingPageKeysRef.current.delete(pageKey);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, isCustomerScoped, mergeOrders, routePhone],
  );

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    loadOrderPage(1);
  }, [loadOrderPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrderPage(1, { silent: true });
  }, [loadOrderPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || currentPage >= totalPage) return;
    loadOrderPage(currentPage + 1, { append: true, silent: true });
  }, [currentPage, loadOrderPage, loading, loadingMore, totalPage]);

  const routeMatchedOrders = useMemo(
    () =>
      orders.filter((o) => {
        if (!routePhone) return true;
        const phone = (o.customerPhone || '').replace(/[^\d+]/g, '');
        return phone === routePhone;
      }),
    [orders, routePhone],
  );

  const statusCounts = useMemo(
    () => ({
      pending: routeMatchedOrders.filter((o) => o.status === 'pending').length,
      packing: routeMatchedOrders.filter((o) => o.status === 'packing').length,
      shipping: routeMatchedOrders.filter((o) => o.status === 'shipping').length,
      done: routeMatchedOrders.filter((o) => o.status === 'done').length,
      cancelled: routeMatchedOrders.filter((o) => o.status === 'cancelled').length,
    }),
    [routeMatchedOrders]
  );

  const statusChips = useMemo(
    () => [
      { key: 'all', label: t('messages.filter.all'), count: routeMatchedOrders.length },
      { key: 'pending', label: t('orders.status.pending'), count: statusCounts.pending },
      { key: 'packing', label: t('orders.status.packing'), count: statusCounts.packing },
      { key: 'shipping', label: t('orders.status.shipping'), count: statusCounts.shipping },
      { key: 'done', label: t('orders.status.done'), count: statusCounts.done },
      { key: 'cancelled', label: t('orders.status.cancelled'), count: statusCounts.cancelled },
    ],
    [routeMatchedOrders.length, statusCounts, t]
  );

  const filtered = useMemo(
    () =>
      routeMatchedOrders.filter((o) => {
        const q = search.trim().toLowerCase();
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        const matchChannel = channelFilter === 'all' || o.channel === channelFilter;
        const matchSearch =
          q.length === 0 ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q);
        return matchStatus && matchChannel && matchSearch;
      }),
    [channelFilter, routeMatchedOrders, search, statusFilter]
  );

  const totalRevenue = useMemo(
    () => routeMatchedOrders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
    [routeMatchedOrders]
  );

  const channelCounts = useMemo(
    () =>
      filtered.reduce<Record<OrderChannel, number>>(
        (acc, item) => {
          acc[item.channel] = (acc[item.channel] || 0) + 1;
          return acc;
        },
        { pos: 0, shopee: 0, lazada: 0, tiktok: 0, tiki: 0 },
      ),
    [filtered],
  );

  if (loading && orders.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={t('orders.title')}
        subtitle={
          routePhone
            ? `${routeCustomerName || 'Khách hàng'} · ${routePhone} · ${routeMatchedOrders.length} đơn`
            : t('orders.subtitle', { total: totalItem.toLocaleString(dateLocale), pending: statusCounts.pending })
        }
        onBack={() => nav.goBack()}
      />

      <FlatList
        data={filtered}
        keyExtractor={(i) => `${i.detailId || i.id}:${i.orderNumber}`}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <View style={styles.listHeaderContent}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={t('orders.searchPlaceholder')}
              onQrPress={() => nav.navigate('QrScan')}
            />

            <View style={styles.statsRow}>
              {[
                { label: t('orders.totalOrders'), value: totalItem.toLocaleString(dateLocale), color: Colors.text },
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              alwaysBounceHorizontal={false}
              contentContainerStyle={styles.filterContent}
              style={styles.filterScroll}
            >
              {statusChips.map((chip) => {
                const active = statusFilter === chip.key;
                return (
                  <TouchableOpacity
                    key={chip.key}
                    onPress={() => setStatusFilter(chip.key as 'all' | OrderStatus)}
                    style={[
                      styles.filterChip,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      active && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[styles.filterLabel, { color: colors.textSecondary }, active && styles.filterLabelActive]}
                    >
                      {chip.label}{chip.count !== undefined ? ` (${chip.count.toLocaleString(dateLocale)})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              alwaysBounceHorizontal={false}
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
                    style={[
                      styles.channelChip,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      active && styles.channelChipActive,
                    ]}
                  >
                    <Text numberOfLines={1} style={[styles.channelLabel, active && styles.channelLabelActive]}>
                      {channel.labelKey ? t(channel.labelKey) : channel.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
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
              onPress={() => nav.navigate('OrderDetail', { id: item.detailId })}
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
                <Text style={styles.channelName}>{item.channelLabel} · {channelCounts[item.channel] || 0}</Text>
              </View>

              <View style={styles.orderBottomLine}>
                <Text style={styles.itemsText}>{t('orders.itemCount', { count: item.items })}</Text>
                <Text style={styles.orderTotal}>{item.total.toLocaleString(dateLocale)}{t('home.currency')}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={42} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {error || 'Chưa có đơn hàng phù hợp.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          <View>
            {loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : (
              <Text style={styles.loadMoreText}>
                {t('orders.loadMore', { count: Math.max(totalItem - orders.length, 0).toLocaleString(dateLocale) })}
              </Text>
            )}
            {(error || usingCache) && orders.length > 0 ? (
              <Text style={styles.footerNote}>
                {usingCache ? 'Đang hiển thị dữ liệu đã lưu gần nhất.' : error}
              </Text>
            ) : null}
          </View>
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
  centerContent: {
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
  filterScroll: {
    flexGrow: 0,
    minHeight: 44,
    marginBottom: 4,
    overflow: 'visible',
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.xl,
    paddingVertical: 5,
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  filterChip: {
    height: 34,
    minWidth: 88,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  filterLabelActive: {
    color: '#fff',
    fontWeight: '800',
  },
  channelScroll: {
    flexGrow: 0,
    minHeight: 38,
    marginBottom: Spacing.sm,
    overflow: 'visible',
  },
  channelContent: {
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.xl,
    paddingVertical: 4,
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
  },
  channelTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginRight: 2,
    lineHeight: 18,
  },
  channelChip: {
    height: 30,
    minWidth: 66,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
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
    lineHeight: 18,
    textAlign: 'center',
  },
  channelLabelActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  listHeaderContent: {
    marginHorizontal: -Spacing.lg,
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
  footerLoading: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  footerNote: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: 8,
  },
  emptyText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
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
