import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, ChipRow, Header, SearchBar } from '../../components';
import { useLanguage } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import {
  getCachedDebtInvoices,
  listDebtInvoices,
  type DebtInvoiceFilter,
  type DebtInvoiceListItem,
} from '../../services';
import { useRealtimeRefresh } from '../../realtime';

type Nav = NativeStackNavigationProp<ManageStackParamList, 'DebtInvoiceMain'>;
type DebtRoute = RouteProp<ManageStackParamList, 'DebtInvoiceMain'>;

const PAGE_SIZE = 20;
const PRELOAD_PAGE_SIZE = 500;

const FILTERS: Array<{ key: DebtInvoiceFilter; labelKey: string }> = [
  { key: 'all', labelKey: 'debtInvoice.filter.all' },
  { key: 'receivable', labelKey: 'debtInvoice.filter.receivable' },
  { key: 'payable', labelKey: 'debtInvoice.filter.payable' },
  { key: 'open', labelKey: 'debtInvoice.filter.open' },
  { key: 'overdue', labelKey: 'debtInvoice.filter.overdue' },
  { key: 'settled', labelKey: 'debtInvoice.filter.settled' },
];

function formatDate(iso: string, locale: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '--';
  return parsed.toLocaleDateString(locale);
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function matchFilter(item: DebtInvoiceListItem, filter: DebtInvoiceFilter) {
  if (filter === 'all') return true;
  if (filter === 'receivable') return item.kind === 'receivable';
  if (filter === 'payable') return item.kind === 'payable';
  if (filter === 'overdue') return item.status === 'overdue';
  if (filter === 'open') return item.status === 'open' || item.status === 'partial';
  if (filter === 'settled') return item.status === 'settled';
  return true;
}

function matchSearch(item: DebtInvoiceListItem, query: string) {
  if (!query.trim()) return true;
  const q = normalizeText(query);
  const haystack = [
    item.code,
    item.partyName,
    item.partyPhone || '',
    item.note || '',
    item.sourceId,
  ]
    .map((part) => normalizeText(part))
    .join(' ');
  return haystack.includes(q);
}

export function DebtInvoiceScreen() {
  const { colors } = useThemeMode();
  const { t, dateLocale } = useLanguage();
  const navigation = useNavigation<Nav>();
  const route = useRoute<DebtRoute>();
  const isFocused = useIsFocused();
  const [search, setSearch] = useState(route.params?.search || '');
  const [debouncedSearch, setDebouncedSearch] = useState(route.params?.search || '');
  const [filter, setFilter] = useState<DebtInvoiceFilter>(route.params?.filter || 'all');
  const [allItems, setAllItems] = useState<DebtInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [summary, setSummary] = useState({
    totalReceivable: 0,
    totalPayable: 0,
    overdueReceivable: 0,
    overduePayable: 0,
    dueToday: 0,
    totalOpen: 0,
    totalSettled: 0,
  });

  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent && allItems.length === 0) {
        setLoading(true);
      }
      setError('');
      try {
        const listResult = await listDebtInvoices({
          pageSize: PRELOAD_PAGE_SIZE,
          currentPage: 1,
          search: '',
          filter: 'all',
        });
        setAllItems(listResult.items);
        setVisibleCount(PAGE_SIZE);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('debtInvoice.error.load'));
        const cached = await getCachedDebtInvoices();
        if (cached) {
          setAllItems(cached.items);
        } else {
          setAllItems([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [allItems.length, t],
  );

  const hydrateFromCache = useCallback(async () => {
    try {
      const cached = await getCachedDebtInvoices();
      if (cached?.items?.length) {
        setAllItems(cached.items);
        setVisibleCount(PAGE_SIZE);
        setLoading(false);
      }
    } catch {
      // Ignore cache hydration errors; network refresh will continue.
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      await hydrateFromCache();
      if (!isMounted) return;
      loadData({ silent: true });
    })();
    return () => {
      isMounted = false;
    };
  }, [hydrateFromCache, loadData]);

  useRealtimeRefresh(
    ['orders', 'customers', 'inventory'],
    () => { void loadData({ silent: true }); },
    { debounceMs: 500, enabled: isFocused },
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, debouncedSearch]);

  const filteredItems = useMemo(
    () => allItems.filter((item) => matchFilter(item, filter) && matchSearch(item, debouncedSearch)),
    [allItems, filter, debouncedSearch],
  );

  const items = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount],
  );

  const hasMore = items.length < filteredItems.length;

  useEffect(() => {
    const nextSummary = filteredItems.reduce(
      (sum, item) => {
        if (item.kind === 'receivable') sum.totalReceivable += item.remainingAmount;
        if (item.kind === 'payable') sum.totalPayable += item.remainingAmount;
        if (item.kind === 'receivable' && item.status === 'overdue') sum.overdueReceivable += item.remainingAmount;
        if (item.kind === 'payable' && item.status === 'overdue') sum.overduePayable += item.remainingAmount;
        if (item.remainingAmount > 0 && (item.status === 'open' || item.status === 'partial' || item.status === 'overdue')) sum.totalOpen += 1;
        if (item.status === 'settled') sum.totalSettled += 1;
        const due = new Date(item.dueDate);
        const now = new Date();
        if (
          item.remainingAmount > 0 &&
          due.getFullYear() === now.getFullYear() &&
          due.getMonth() === now.getMonth() &&
          due.getDate() === now.getDate()
        ) {
          sum.dueToday += item.remainingAmount;
        }
        return sum;
      },
      {
        totalReceivable: 0,
        totalPayable: 0,
        overdueReceivable: 0,
        overduePayable: 0,
        dueToday: 0,
        totalOpen: 0,
        totalSettled: 0,
      },
    );
    setSummary(nextSummary);
  }, [filteredItems]);

  const chips = useMemo(
    () =>
      FILTERS.map((item) => ({
        key: item.key,
        label: t(item.labelKey as never),
      })),
    [t],
  );

  if (loading && allItems.length === 0) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={t('debtInvoice.title' as never)}
        subtitle={t('debtInvoice.subtitle' as never, {
          open: summary.totalOpen.toLocaleString(dateLocale),
          settled: summary.totalSettled.toLocaleString(dateLocale),
        })}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData({ silent: true });
            }}
          />
        }
        onEndReached={() => {
          if (!hasMore) return;
          setVisibleCount((prev) => prev + PAGE_SIZE);
        }}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <View>
            <View style={styles.fullBleed}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder={t('debtInvoice.searchPlaceholder' as never)}
              />
            </View>
            <View style={styles.summaryRow}>
              <Card padding={Spacing.md} style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t('debtInvoice.summary.receivable' as never)}</Text>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>
                  {summary.totalReceivable.toLocaleString(dateLocale)} {t('home.currency')}
                </Text>
              </Card>
              <Card padding={Spacing.md} style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t('debtInvoice.summary.payable' as never)}</Text>
                <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                  {summary.totalPayable.toLocaleString(dateLocale)} {t('home.currency')}
                </Text>
              </Card>
            </View>

            <View style={styles.summaryRow}>
              <Card padding={Spacing.md} style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t('debtInvoice.summary.overdue' as never)}</Text>
                <Text style={[styles.summaryValue, { color: Colors.warning }]}>
                  {(summary.overdueReceivable + summary.overduePayable).toLocaleString(dateLocale)} {t('home.currency')}
                </Text>
              </Card>
              <Card padding={Spacing.md} style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t('debtInvoice.summary.dueToday' as never)}</Text>
                <Text style={[styles.summaryValue, { color: Colors.primary }]}>
                  {summary.dueToday.toLocaleString(dateLocale)} {t('home.currency')}
                </Text>
              </Card>
            </View>

            <View style={styles.fullBleed}>
              <ChipRow chips={chips} selected={filter} onSelect={(key) => setFilter(key as DebtInvoiceFilter)} />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        }
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;
          const kindColor = item.kind === 'receivable' ? Colors.success : Colors.danger;
          const statusColor =
            item.status === 'settled' ? Colors.success : item.status === 'overdue' ? Colors.warning : Colors.primary;
          const displayCode = item.kind === 'receivable' ? `#${item.code}` : item.code;
          return (
            <TouchableOpacity
              style={[
                styles.row,
                { backgroundColor: colors.card, borderColor: colors.border },
                isFirst && styles.rowFirst,
                !isFirst && styles.rowSeparator,
                isLast && styles.rowLast,
              ]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('DebtInvoiceDetail', { id: item.id })}
            >
              <View style={styles.rowTop}>
                <Text style={styles.codeText}>{displayCode}</Text>
                <Text style={[styles.statusText, { color: statusColor }]}>{t(`debtInvoice.status.${item.status}` as never)}</Text>
              </View>
              <Text style={styles.partyText} numberOfLines={1}>{item.partyName}</Text>
              <View style={styles.rowBottom}>
                <View>
                  <Text style={styles.metaText}>{t(`debtInvoice.kind.${item.kind}` as never)}</Text>
                  <View style={styles.sourceMetaRow}>
                    <View style={[styles.sourceBadge, { backgroundColor: item.sourceType === 'order' ? Colors.primaryLight : Colors.warningLight }]}>
                      <Text style={styles.sourceBadgeText}>
                        {item.sourceType === 'order'
                          ? t('debtInvoice.sourceTypeOrder' as never)
                          : t('debtInvoice.sourceTypeSupplier' as never)}
                      </Text>
                    </View>
                    <Text style={styles.sourceCodeText}>
                      {t('debtInvoice.sourceCodeLabel' as never)}: {item.sourceId}
                    </Text>
                  </View>
                  <Text style={[styles.remainingText, { color: kindColor }]}>
                    {item.remainingAmount.toLocaleString(dateLocale)} {t('home.currency')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('debtInvoice.empty' as never)}</Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <Text style={styles.footerHint}>{t('customers.loadMore')}</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  fullBleed: { marginHorizontal: -Spacing.lg },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  summaryCard: { flex: 1 },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  summaryValue: { ...Typography.h4, marginTop: 2 },
  row: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: Spacing.md,
  },
  rowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    ...Shadow.sm,
  },
  rowSeparator: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
  },
  rowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeText: { ...Typography.captionMd, color: Colors.text, fontFamily: 'monospace', fontWeight: '700' },
  statusText: { ...Typography.captionMd, fontWeight: '700' },
  partyText: { ...Typography.bodyMd, color: Colors.text, marginTop: 4 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  metaText: { ...Typography.caption, color: Colors.textSecondary },
  sourceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sourceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  sourceBadgeText: {
    ...Typography.label,
    color: Colors.text,
    fontSize: 10,
  },
  sourceCodeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  remainingText: { ...Typography.h4, marginTop: 2 },
  emptyWrap: { alignItems: 'center', paddingVertical: 52, gap: 10 },
  emptyText: { ...Typography.bodySm, textAlign: 'center' },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 4,
    marginBottom: 8,
  },
  footerHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
