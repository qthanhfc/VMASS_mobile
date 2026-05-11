import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { ChipRow, SearchBar } from '../../components';
import { useLanguage } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import { useRealtimeRefresh } from '../../realtime';
import { ApiError, listSuppliers, type SupplierListItem } from '../../services';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

type FilterKey = string;

const PAGE_SIZE = 20;

const formatMoneyShort = (value: number) => `${(value / 1_000_000).toFixed(1)}M`;

export function SuppliersListScreen() {
  const { colors } = useThemeMode();
  const { locale, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
  const [totalItem, setTotalItem] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const requestSeq = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchSuppliers = useCallback(
    async ({
      page,
      append = false,
      refresh = false,
    }: {
      page: number;
      append?: boolean;
      refresh?: boolean;
    }) => {
      const seq = requestSeq.current + 1;
      requestSeq.current = seq;

      if (append) {
        setLoadingMore(true);
      } else if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage('');

      try {
        const result = await listSuppliers({
          pageSize: PAGE_SIZE,
          currentPage: page,
          search: debouncedSearch,
        });

        if (requestSeq.current !== seq) return;

        setSuppliers((prev) => {
          if (!append) return result.items;

          const seen = new Set(prev.map((item) => item.id));
          return [...prev, ...result.items.filter((item) => !seen.has(item.id))];
        });
        setTotalItem(result.totalItem);
        setCurrentPage(result.currentPage);
        setTotalPage(Math.max(result.totalPage, 1));
      } catch (error) {
        if (requestSeq.current !== seq) return;

        const message =
          error instanceof ApiError || error instanceof Error
            ? error.message
            : locale === 'vi'
              ? 'Không tải được danh sách nhà cung cấp.'
              : 'Unable to load suppliers.';
        setErrorMessage(message);
        if (!append) {
          setSuppliers([]);
          setTotalItem(0);
          setCurrentPage(1);
          setTotalPage(1);
        }
      } finally {
        if (requestSeq.current === seq) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [debouncedSearch, locale],
  );

  useFocusEffect(
    useCallback(() => {
      setFilter('all');
      fetchSuppliers({ page: 1 });
    }, [fetchSuppliers]),
  );

  const totalDebt = useMemo(
    () => suppliers.reduce((sum, supplier) => sum + supplier.currentDebt, 0),
    [suppliers]
  );
  const totalOrders = useMemo(
    () => suppliers.reduce((sum, supplier) => sum + supplier.totalOrders, 0),
    [suppliers]
  );
  const activeCount = useMemo(
    () => suppliers.filter(supplier => supplier.status === 'active').length,
    [suppliers]
  );

  const filterChips = useMemo(() => {
    return [
      { key: 'all', label: t('messages.filter.all') },
      { key: 'withDebt', label: t('suppliers.withDebt') },
      { key: 'noDebt', label: locale === 'vi' ? 'Đã thanh toán' : 'No debt' },
      { key: 'hasOrders', label: locale === 'vi' ? 'Có đơn nhập' : 'Has imports' },
    ];
  }, [locale, t]);

  const filtered = useMemo(() => {
    return suppliers.filter(supplier => {
      const filterMatched =
        filter === 'all'
          ? true
          : filter === 'withDebt'
            ? supplier.currentDebt > 0
            : filter === 'noDebt'
              ? supplier.currentDebt <= 0
              : filter === 'hasOrders'
                ? supplier.totalOrders > 0
                : true;

      return filterMatched;
    });
  }, [filter, suppliers]);

  const hasMore = currentPage < totalPage;

  const handleRefresh = useCallback(() => {
    fetchSuppliers({ page: 1, refresh: true });
  }, [fetchSuppliers]);
  useRealtimeRefresh(['suppliers'], handleRefresh);

  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchSuppliers({ page: currentPage + 1, append: true });
    }
  }, [currentPage, fetchSuppliers, hasMore, loading, loadingMore]);

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadMoreWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>
            {locale === 'vi' ? 'Đang tải thêm...' : 'Loading more...'}
          </Text>
        </View>
      );
    }

    if (!suppliers.length) return null;

    return (
      <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>
        {hasMore
          ? `${suppliers.length}/${totalItem}`
          : locale === 'vi'
            ? 'Đã tải tất cả nhà cung cấp'
            : 'All suppliers loaded'}
      </Text>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('suppliers.title')}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {t('suppliers.subtitle', { count: totalItem, debt: formatMoneyShort(totalDebt) })}
          </Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.fullBleedRow}>
              <SearchBar value={search} onChangeText={setSearch} placeholder={t('suppliers.searchPlaceholder')} />
            </View>

            <View style={styles.statsRow}>
              {[
                { label: t('suppliers.stat.total'), value: String(totalItem), color: colors.text },
                { label: t('suppliers.stat.active'), value: String(activeCount), color: Colors.success },
                { label: t('suppliers.stat.debt'), value: formatMoneyShort(totalDebt), color: Colors.accent },
                { label: t('suppliers.stat.purchaseOrders'), value: String(totalOrders), color: Colors.primary },
              ].map(stat => (
                <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.fullBleedRow, styles.filterBleedRow]}>
              <ChipRow chips={filterChips} selected={filter} onSelect={key => setFilter(key as FilterKey)} />
            </View>

            {errorMessage ? (
              <View style={[styles.errorBanner, { borderColor: colors.border }]}>
                <Ionicons name="warning-outline" size={16} color={Colors.danger} />
                <Text style={styles.errorText} numberOfLines={2}>{errorMessage}</Text>
                <TouchableOpacity onPress={() => fetchSuppliers({ page: 1 })}>
                  <Text style={styles.retryText}>{locale === 'vi' ? 'Thử lại' : 'Retry'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                {locale === 'vi' ? 'Đang tải nhà cung cấp...' : 'Loading suppliers...'}
              </Text>
            </View>
          ) : (
            <View style={[styles.emptyWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={24} color={Colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('suppliers.empty')}</Text>
            </View>
          )
        }
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
        ListFooterComponent={renderFooter}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.row,
              index === 0 && styles.rowFirst,
              index === filtered.length - 1 && styles.rowLast,
              item.status === 'paused' && styles.rowPaused,
              { backgroundColor: colors.card, borderTopColor: colors.border },
            ]}
            onPress={() => nav.navigate('SupplierEdit', { id: item.id })}
            activeOpacity={0.85}
          >
            <View style={[styles.logo, { borderColor: item.color, backgroundColor: `${item.color}22` }]}>
              <Ionicons name="cube-outline" size={20} color={item.color} />
            </View>

            <View style={styles.infoCol}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {item.code}
              </Text>
              <View style={styles.bottomRow}>
                <Text style={[styles.ordersText, { color: colors.textSecondary }]}>
                  {locale === 'vi'
                    ? `${item.totalOrders} mặt hàng nhập`
                    : `${item.totalOrders} imported items`}
                </Text>
                {item.currentDebt > 0 ? (
                  <Text style={[styles.debtText, { color: Colors.accent }]}>
                    {locale === 'vi'
                      ? `· nợ ${formatMoneyShort(item.currentDebt)}`
                      : `· debt ${formatMoneyShort(item.currentDebt)}`}
                  </Text>
                ) : null}
              </View>
            </View>

            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fabPill}
        onPress={() => nav.navigate('SupplierEdit', {})}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.fabPillText}>{t('suppliers.addTitle')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  headerMain: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
  },
  headerSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  iconBtn: {
    padding: 4,
  },
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
  statValue: {
    ...Typography.h4,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 96,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowFirst: {
    borderTopWidth: 0,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    marginTop: Spacing.xs,
  },
  rowLast: {
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  rowPaused: {
    opacity: 0.6,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  name: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  meta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 8,
  },
  ordersText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  debtText: {
    ...Typography.captionMd,
    textTransform: 'lowercase',
  },
  emptyWrap: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    ...Typography.bodySm,
    marginTop: 10,
  },
  errorBanner: {
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
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
  loadMoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
  },
  loadMoreText: {
    ...Typography.caption,
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
  fabPillText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
});
