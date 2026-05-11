import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { Header, SearchBar, ChipRow } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import { useRealtimeRefresh } from '../../realtime';
import { Customer } from '../../types';
import {
  getCachedCustomers,
  listAllCustomers,
  listCustomers,
  type CustomerRow,
} from '../../services';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type CustomerFilter = 'all' | 'VIP' | 'Gold' | 'Silver' | 'Normal' | 'new' | 'debt';
type CustomerSort = 'spent_desc' | 'spent_asc';

const PAGE_SIZE = 12;

const TIER_META: Record<Customer['tier'], { color: string; bg: string; labelKey: TranslationKey }> = {
  VIP: { color: '#d97757', bg: '#fff1eb', labelKey: 'customers.tier.vip' },
  Gold: { color: '#d4a574', bg: '#fcf5eb', labelKey: 'customers.tier.gold' },
  Silver: { color: '#8a8a8a', bg: '#f2f2f2', labelKey: 'customers.tier.silver' },
  Normal: { color: '#7a9e7a', bg: '#edf7ed', labelKey: 'customers.tier.normal' },
};

const FILTER_CHIPS: Array<{ key: CustomerFilter; labelKey: TranslationKey }> = [
  { key: 'all', labelKey: 'messages.filter.all' },
  { key: 'VIP', labelKey: 'customers.tier.vip' },
  { key: 'Gold', labelKey: 'customers.tier.gold' },
  { key: 'Silver', labelKey: 'customers.tier.silver' },
  { key: 'Normal', labelKey: 'customers.tier.normal' },
  { key: 'new', labelKey: 'customers.filter.new' },
  { key: 'debt', labelKey: 'suppliers.withDebt' },
];

const FILTER_COLOR: Partial<Record<CustomerFilter, string>> = {
  VIP: TIER_META.VIP.color,
  Gold: TIER_META.Gold.color,
  Silver: TIER_META.Silver.color,
  Normal: TIER_META.Normal.color,
  new: Colors.success,
  debt: Colors.danger,
};

function compactMoney(value: number): string {
  if (value >= 1_000_000) {
    const million = value / 1_000_000;
    return million >= 100 ? `${Math.round(million)}M` : `${million.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  return String(value);
}

function compactMoneyLower(value: number): string {
  return compactMoney(value).replace('K', 'k');
}

function formatDebtVnd(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function firstLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function customerKey(customer: CustomerRow): string {
  if (customer.id > 0) return `id:${customer.id}`;
  const phone = normalizePhone(customer.phone);
  if (phone) return `phone:${phone}`;
  if (customer.email) return `email:${customer.email.toLowerCase()}`;
  return `name:${customer.name.trim().toLowerCase()}`;
}

function uniqueCustomers(customers: CustomerRow[]): CustomerRow[] {
  const seen = new Set<string>();

  return customers.filter((customer) => {
    const key = customerKey(customer);
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export function CustomersListScreen() {
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [searchedCustomers, setSearchedCustomers] = useState<CustomerRow[] | null>(null);
  const [filter, setFilter] = useState<CustomerFilter>('all');
  const [sortBy, setSortBy] = useState<CustomerSort>('spent_desc');
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerRow[]>([]);
  const [totalItem, setTotalItem] = useState(0);
  const [totalPage, setTotalPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [usingCache, setUsingCache] = useState(false);
  const requestSeq = useRef(0);
  const searchRequestSeq = useRef(0);

  const loadCustomers = useCallback(
    async (page = 1, options?: { append?: boolean; silent?: boolean }) => {
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
        const [result, allItems] = await Promise.all([
          listCustomers({
            pageSize: PAGE_SIZE,
            currentPage: page,
            search: '',
          }),
          page === 1 ? listAllCustomers() : Promise.resolve(null),
        ]);

        if (requestSeq.current !== seq) return;

        setCustomers((prev) => {
          if (!options?.append) return uniqueCustomers(result.items);

          const seen = new Set(prev.map(customerKey));
          return uniqueCustomers([...prev, ...result.items.filter((item) => !seen.has(customerKey(item)))]);
        });
        setTotalItem(result.totalItem);
        setTotalPage(Math.max(result.totalPage, 1));
        setCurrentPage(result.currentPage);
        setUsingCache(false);
        if (allItems) {
          setAllCustomers(uniqueCustomers(allItems));
        }
      } catch (err) {
        if (requestSeq.current !== seq) return;

        const message = err instanceof Error ? err.message : 'Không thể tải danh sách khách hàng.';
        setError(message);

        if (page === 1) {
          const cached = await getCachedCustomers();
          if (cached) {
            const cachedItems = uniqueCustomers(cached.items);
            setCustomers(cachedItems);
            setAllCustomers(cachedItems);
            setTotalItem(cached.totalItem);
            setTotalPage(cached.totalPage);
            setCurrentPage(cached.currentPage);
            setUsingCache(true);
          } else {
            setCustomers([]);
            setAllCustomers([]);
            setTotalItem(0);
            setTotalPage(1);
            setCurrentPage(1);
          }
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
    loadCustomers(1);
  }, [loadCustomers]);

  useEffect(() => {
    const keyword = search.trim();
    if (!keyword) {
      setSearchedCustomers(null);
      return;
    }

    const timeout = setTimeout(async () => {
      const seq = searchRequestSeq.current + 1;
      searchRequestSeq.current = seq;

      try {
        const result = await listCustomers({
          pageSize: 200,
          currentPage: 1,
          search: keyword,
        });

        if (searchRequestSeq.current !== seq) return;
        setSearchedCustomers(uniqueCustomers(result.items));
      } catch {
        if (searchRequestSeq.current !== seq) return;
        setSearchedCustomers([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [search]);

  const statsCustomers = useMemo(
    () => uniqueCustomers(allCustomers.length ? allCustomers : customers),
    [allCustomers, customers],
  );

  const totalSpent = useMemo(
    () => statsCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0),
    [statsCustomers],
  );

  const avgSpent = useMemo(
    () => (statsCustomers.length ? Math.round(totalSpent / statsCustomers.length) : 0),
    [statsCustomers.length, totalSpent],
  );

  const thisMonthPrefix = useMemo(() => {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }, []);

  const newThisMonth = useMemo(
    () => statsCustomers.filter((customer) => customer.createdAt.startsWith(thisMonthPrefix)).length,
    [statsCustomers, thisMonthPrefix],
  );

  const totalCustomers = statsCustomers.length || totalItem;
  const vipCustomers = statsCustomers.filter((customer) => customer.tier === 'VIP').length;
  const hasSearchQuery = search.trim().length > 0;
  const hasMore =
    filter === 'all' &&
    !hasSearchQuery &&
    currentPage < totalPage &&
    customers.length < totalCustomers;

  const filterChips = useMemo(() => {
    const getFilterCount = (filterKey: CustomerFilter) => {
      if (filterKey === 'all') return totalCustomers;
      if (filterKey === 'new') {
        return statsCustomers.filter((customer) => customer.createdAt.startsWith(thisMonthPrefix)).length;
      }
      if (filterKey === 'debt') {
        return statsCustomers.filter((customer) => customer.hasDebt).length;
      }

      return statsCustomers.filter((customer) => customer.tier === filterKey).length;
    };

    return FILTER_CHIPS.map((chip) => ({
      key: chip.key,
      label: t(chip.labelKey),
      count: getFilterCount(chip.key),
      color: FILTER_COLOR[chip.key],
    }));
  }, [statsCustomers, t, thisMonthPrefix, totalCustomers]);

  const displayedCustomers = useMemo(() => {
    const query = normalizeSearchText(search);
    const normalizedQueryPhone = normalizePhone(search);
    const source = hasSearchQuery ? searchedCustomers || [] : statsCustomers;

    const filteredItems = uniqueCustomers(source)
      .filter((customer) => {
        const normalizedName = normalizeSearchText(customer.name);
        const normalizedEmail = normalizeSearchText(customer.email || '');
        const bySearch =
          query.length === 0 ||
          normalizedName.includes(query) ||
          normalizePhone(customer.phone).includes(normalizedQueryPhone) ||
          normalizedEmail.includes(query);

        let byFilter = true;
        if (filter === 'new') {
          byFilter = customer.createdAt.startsWith(thisMonthPrefix);
        } else if (filter === 'debt') {
          byFilter = customer.hasDebt;
        } else if (filter !== 'all') {
          byFilter = customer.tier === filter;
        }

        return bySearch && byFilter;
      });

    if (sortBy === 'spent_asc') {
      return filteredItems.sort((a, b) => a.totalSpent - b.totalSpent);
    }

    return filteredItems.sort((a, b) => b.totalSpent - a.totalSpent);
  }, [filter, hasSearchQuery, search, searchedCustomers, sortBy, statsCustomers, thisMonthPrefix]);

  const sortLabel =
    sortBy === 'spent_desc'
      ? t('customers.sortHighestSpend')
      : 'Sắp xếp: Chi tiêu thấp nhất';

  const handleRefresh = useCallback(() => {
    loadCustomers(1, { silent: true });
  }, [loadCustomers]);
  useRealtimeRefresh(['customers', 'orders'], handleRefresh);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    loadCustomers(currentPage + 1, { append: true, silent: true });
  }, [currentPage, hasMore, loadCustomers, loading, loadingMore]);

  if (loading && customers.length === 0) {
    return (
      <View style={[styles.screen, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title={t('customers.title')}
        subtitle={t('customers.subtitle', { total: totalCustomers.toLocaleString(dateLocale), vip: vipCustomers })}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={displayedCustomers}
        keyExtractor={(item, index) => `${customerKey(item)}:${index}`}
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
            <View style={styles.fullBleedHeaderRow}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder={t('customers.searchPlaceholder')}
              />
            </View>

            <View style={styles.heroWrap}>
              <View style={styles.heroCard}>
                <Text style={[styles.heroHeading, { color: 'rgba(255,255,255,0.85)' }]}>{t('customers.overview')}</Text>
                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroValue, { color: '#fff' }]}>{compactMoney(totalSpent)}</Text>
                    <Text style={[styles.heroLabel, { color: 'rgba(255,255,255,0.85)' }]}>{t('customers.totalSpent')}</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroValue, { color: '#fff' }]}>{compactMoney(avgSpent)}</Text>
                    <Text style={[styles.heroLabel, { color: 'rgba(255,255,255,0.85)' }]}>{t('customers.avgPerCustomer')}</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroValue, { color: '#fff' }]}>+{newThisMonth}</Text>
                    <Text style={[styles.heroLabel, { color: 'rgba(255,255,255,0.85)' }]}>{t('customers.newThisMonth')}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.fullBleedHeaderRow, styles.filterBleedRow, styles.filterNoTop]}>
              <ChipRow chips={filterChips} selected={filter} onSelect={(key) => setFilter(key as CustomerFilter)} />
            </View>

            <TouchableOpacity
              style={styles.sortRow}
              activeOpacity={0.8}
              onPress={() =>
                setSortBy((prev) => (prev === 'spent_desc' ? 'spent_asc' : 'spent_desc'))
              }
            >
              <Text style={[styles.sortText, { color: colors.textSecondary }]}>{sortLabel}</Text>
              <Ionicons
                name={sortBy === 'spent_desc' ? 'chevron-down' : 'chevron-up'}
                size={14}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={16} color={Colors.danger} />
                <Text style={styles.errorText} numberOfLines={2}>
                  {usingCache ? 'Đang hiển thị dữ liệu đã lưu gần nhất.' : error}
                </Text>
                <TouchableOpacity onPress={() => loadCustomers(1)}>
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          const isLast = index === displayedCustomers.length - 1;
          const tier = TIER_META[item.tier] || TIER_META.Normal;

          return (
            <TouchableOpacity
              style={[
                styles.customerRow,
                { backgroundColor: colors.card, borderColor: colors.border },
                isFirst && styles.customerRowFirst,
                !isFirst && [styles.customerRowWithSeparator, { borderTopColor: colors.border }],
                isLast && styles.customerRowLast,
              ]}
              onPress={() => navigation.navigate('CustomerEdit', { id: item.id, phone: item.phone })}
              activeOpacity={0.8}
            >
              <View style={[styles.avatarCircle, { backgroundColor: tier.bg, borderColor: tier.color }]}>
                <Text style={[styles.avatarText, { color: tier.color }]}>{firstLetter(item.name)}</Text>
              </View>

              <View style={styles.customerInfo}>
                <View style={styles.customerNameRow}>
                  <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
                    <Text style={styles.tierText}>{t(tier.labelKey)}</Text>
                  </View>
                </View>

                <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>
                  {item.phone}
                  {item.debt > 0 ? (
                    <Text style={styles.debtInline}> · Công nợ: {formatDebtVnd(item.debt)}</Text>
                  ) : null}
                </Text>
                <Text style={[styles.customerMeta, { color: colors.textSecondary }]}>
                  {t('manage.orderCount', { count: item.orderCount })} · {t('orders.itemCount', { count: item.productCount })} · <Text style={[styles.customerSpent, { color: colors.primary }]}>{compactMoneyLower(item.totalSpent)}</Text> · {item.points.toLocaleString(dateLocale)} điểm
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={46} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('customers.empty')}</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>
              {hasMore
                ? t('customers.loadMore')
                : `${displayedCustomers.length.toLocaleString(dateLocale)} / ${totalCustomers.toLocaleString(dateLocale)}`}
            </Text>
          )
        }
      />

      <TouchableOpacity style={styles.fabPill} onPress={() => navigation.navigate('CustomerEdit', {})}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.fabPillText}>{t('customers.addShort')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    paddingBottom: Spacing.sm,
  },
  heroCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  heroHeading: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStat: {
    flex: 1,
  },
  heroValue: {
    ...Typography.h3,
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  heroLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  sortRow: {
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sortText: {
    ...Typography.caption,
    color: Colors.textSecondary,
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
  fullBleedHeaderRow: {
    marginHorizontal: -Spacing.lg,
  },
  filterBleedRow: {
    paddingRight: Spacing.lg,
  },
  filterNoTop: {
    marginTop: -Spacing.xs,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  customerRowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    ...Shadow.sm,
  },
  customerRowWithSeparator: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
  },
  customerRowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    ...Typography.bodyMd,
    fontSize: 16,
    fontWeight: '800',
  },
  customerInfo: {
    flex: 1,
    minWidth: 0,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    ...Typography.bodyMd,
    color: Colors.text,
    flex: 1,
  },
  debtInline: {
    ...Typography.captionMd,
    color: Colors.danger,
    fontWeight: '700',
  },
  tierBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tierText: {
    ...Typography.label,
    color: '#fff',
    fontSize: 9,
    letterSpacing: 0.2,
  },
  customerPhone: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  customerMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  customerSpent: {
    color: Colors.primary,
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
  fabPillText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
});
