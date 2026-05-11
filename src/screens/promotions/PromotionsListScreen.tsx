import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import { ChipRow, EmptyState, Header, ProgressBar, SearchBar } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import { useRealtimeRefresh } from '../../realtime';
import {
  ApiError,
  deletePromotions,
  listPromotions,
  togglePromotionStatus,
  type Promotion,
  type PromotionRuleType,
  type PromotionStatus,
} from '../../services';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type PromotionFilterKey =
  | 'all'
  | PromotionStatus
  | 'discount'
  | 'gift'
  | PromotionRuleType;

const PAGE_SIZE = 20;

const FILTER_CHIPS: Array<{ key: PromotionFilterKey; labelKey: TranslationKey }> = [
  { key: 'all', labelKey: 'messages.filter.all' },
  { key: 'active', labelKey: 'promotions.status.active' },
  { key: 'scheduled', labelKey: 'promotions.status.scheduled' },
  { key: 'paused', labelKey: 'promotions.status.paused' },
  { key: 'ended', labelKey: 'promotions.status.ended' },
  { key: 'discount', labelKey: 'promotions.kind.discount' },
  { key: 'gift', labelKey: 'promotions.kind.gift' },
  { key: 'total-order-value', labelKey: 'promotions.type.totalOrderValue' },
  { key: 'one-product', labelKey: 'promotions.type.oneProduct' },
  { key: 'product-get-product', labelKey: 'promotions.type.productGift' },
];

const STATUS_META: Record<PromotionStatus, { labelKey: TranslationKey; color: string }> = {
  active: { labelKey: 'promotions.status.active', color: Colors.success },
  scheduled: { labelKey: 'promotions.status.scheduled', color: Colors.primary },
  paused: { labelKey: 'promotions.status.paused', color: Colors.warning },
  ended: { labelKey: 'promotions.status.ended', color: Colors.textSecondary },
};

const RULE_LABELS: Record<PromotionRuleType, TranslationKey> = {
  'total-order-value': 'promotions.type.totalOrderValue',
  'one-product': 'promotions.type.oneProduct',
  'quantity-product': 'promotions.type.quantityProduct',
  'one-type-product': 'promotions.type.oneCategory',
  'quantity-type-product': 'promotions.type.quantityCategory',
  'customer-accrual-points': 'promotions.type.customerPoints',
  'customer-group-discount': 'promotions.type.customerGroup',
  'first-order-discount': 'promotions.type.firstOrder',
  'product-get-product': 'promotions.type.productGift',
  'total-order-value-get-product': 'promotions.type.orderGift',
  'customer-accrual-points-get-product': 'promotions.type.pointsGift',
};

const STATUS_FILTERS = new Set<PromotionFilterKey>(['active', 'scheduled', 'paused', 'ended']);

function compactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

function formatDate(value: string, locale: string) {
  if (!value) return '--/--';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function ruleBadgeText(promotion: Promotion) {
  const firstRule = promotion.rules[0];
  if (promotion.promotionType === 'GIFT') return 'GIFT';
  if (firstRule?.discount_type === 2) return `${firstRule.discount_value || '?'}%`;
  if (firstRule?.discount_value) return `-${compactNumber(Number(String(firstRule.discount_value).replace(/\D/g, '')) || 0)}`;
  return 'KM';
}

function filterMatches(filter: PromotionFilterKey, promotion: Promotion) {
  if (filter === 'all') return true;
  if (STATUS_FILTERS.has(filter)) return promotion.status === filter;
  if (filter === 'discount') return promotion.promotionType === 'DISCOUNT';
  if (filter === 'gift') return promotion.promotionType === 'GIFT';
  return promotion.ruleType === filter;
}

export function PromotionsListScreen() {
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<PromotionFilterKey>('all');
  const [items, setItems] = useState<Promotion[]>([]);
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

  const fetchData = useCallback(
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

      if (append) setLoadingMore(true);
      else if (refresh) setRefreshing(true);
      else setLoading(true);
      setErrorMessage('');

      try {
        const result = await listPromotions({
          pageSize: PAGE_SIZE,
          currentPage: page,
          search: debouncedSearch,
        });

        if (requestSeq.current !== seq) return;

        setItems((prev) => {
          if (!append) return result.items;
          const seen = new Set(prev.map((item) => item.id));
          return [...prev, ...result.items.filter((item) => !seen.has(item.id))];
        });
        setTotalItem(result.totalItem);
        setCurrentPage(result.currentPage);
        setTotalPage(result.totalPage);
      } catch (error) {
        if (requestSeq.current !== seq) return;
        const message =
          error instanceof ApiError || error instanceof Error
            ? error.message
            : t('promotions.loadError');
        setErrorMessage(message);
        if (!append) {
          setItems([]);
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
    [debouncedSearch, t],
  );

  useEffect(() => {
    fetchData({ page: 1 });
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData({ page: 1, refresh: true });
    }, [fetchData]),
  );

  const stats = useMemo(() => {
    const activeCount = items.filter((item) => item.status === 'active').length;
    const pausedCount = items.filter((item) => item.status === 'paused').length;
    const totalUsed = items.reduce((sum, item) => sum + item.usageCount, 0);
    const totalLimit = items.reduce((sum, item) => sum + Math.max(item.usageLimit, 0), 0);
    return { activeCount, pausedCount, totalUsed, totalLimit };
  }, [items]);

  const filtered = useMemo(
    () => items.filter((promotion) => filterMatches(filter, promotion)),
    [filter, items],
  );

  const hasMore = currentPage < totalPage;
  const headerSub = t('promotions.subtitle', {
    total: totalItem.toLocaleString(dateLocale),
    active: stats.activeCount.toLocaleString(dateLocale),
  });

  const handleRefresh = useCallback(() => {
    fetchData({ page: 1, refresh: true });
  }, [fetchData]);
  useRealtimeRefresh(['promotions'], handleRefresh);

  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchData({ page: currentPage + 1, append: true });
    }
  }, [currentPage, fetchData, hasMore, loading, loadingMore]);

  const handleToggleStatus = async (promotion: Promotion) => {
    try {
      await togglePromotionStatus(promotion.id);
      fetchData({ page: 1, refresh: true });
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : t('promotions.loadError');
      Alert.alert(t('common.error'), message);
    }
  };

  const handleDelete = (promotion: Promotion) => {
    Alert.alert(
      t('promotions.deleteTitle'),
      t('promotions.deleteMessage', { name: promotion.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('promotions.deleteAction'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePromotions([promotion.id]);
              fetchData({ page: 1, refresh: true });
            } catch (error) {
              const message = error instanceof ApiError || error instanceof Error ? error.message : t('promotions.loadError');
              Alert.alert(t('common.error'), message);
            }
          },
        },
      ],
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadMoreWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadMoreText}>{t('promotions.loadingMore')}</Text>
        </View>
      );
    }

    if (!filtered.length) return null;

    return (
      <Text style={styles.loadMoreText}>
        {hasMore
          ? t('promotions.loadedCount', {
              loaded: items.length.toLocaleString(dateLocale),
              total: totalItem.toLocaleString(dateLocale),
            })
          : t('promotions.loadedAll')}
      </Text>
    );
  };

  const renderPromotion = ({ item }: { item: Promotion }) => {
    const statusMeta = STATUS_META[item.status];
    const usageProgress = item.usageLimit > 0 ? item.usageCount / item.usageLimit : 0;
    const accentColor = item.promotionType === 'GIFT' ? Colors.accent : Colors.primary;

    return (
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border },
          item.status === 'ended' && styles.endedRow,
        ]}
        onPress={() => nav.navigate('PromotionEdit', { id: item.id })}
        activeOpacity={0.86}
      >
        <View style={[styles.discountBox, { borderColor: accentColor, backgroundColor: `${accentColor}22` }]}>
          <Ionicons name={item.promotionType === 'GIFT' ? 'gift-outline' : 'pricetag-outline'} size={14} color={accentColor} />
          <Text style={[styles.discountBadgeValue, { color: accentColor }]}>{ruleBadgeText(item)}</Text>
        </View>

        <View style={styles.infoCol}>
          <View style={styles.nameLine}>
            <Text style={[styles.promoName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.promoMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {(item.code || 'AUTO')} · {t(RULE_LABELS[item.ruleType])} · {t('promotions.endsOn', { date: formatDate(item.endDate, dateLocale) })}
          </Text>

          <View style={styles.progressWrap}>
            <ProgressBar progress={usageProgress} color={accentColor} height={5} />
          </View>

          <View style={styles.statusLine}>
            <Text style={[styles.statusText, { color: statusMeta.color }]}>
              * {t(statusMeta.labelKey)}
            </Text>
            <View style={styles.rowActions}>
              <Text style={[styles.usageText, { color: colors.textSecondary }]}>
                {item.usageCount}/{item.usageLimit > 0 ? item.usageLimit : '∞'}
              </Text>
              <TouchableOpacity onPress={() => handleToggleStatus(item)} style={styles.statusAction}>
                <Text style={[styles.statusActionText, { color: item.isActive ? Colors.warning : Colors.success }]}>
                  {item.isActive ? t('promotions.pause') : t('promotions.activate')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('promotions.title')} subtitle={headerSub} onBack={() => nav.goBack()} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, filtered.length === 0 && styles.listEmpty]}
        refreshControl={
          <RefreshControl refreshing={refreshing} tintColor={Colors.primary} colors={[Colors.primary]} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <View>
            <View style={styles.fullBleedRow}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder={t('promotions.searchPlaceholder')}
              />
            </View>

            <View style={styles.heroWrap}>
              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>{t('promotions.monthlyPerformance')}</Text>
                <View style={styles.heroStatRow}>
                  {[
                    { label: t('promotions.status.active'), value: String(stats.activeCount) },
                    { label: t('promotions.status.paused'), value: String(stats.pausedCount) },
                    { label: t('promotions.used'), value: compactNumber(stats.totalUsed) },
                    { label: t('promotions.usageLimit'), value: compactNumber(stats.totalLimit) },
                  ].map((stat) => (
                    <View key={stat.label} style={styles.heroStatCol}>
                      <Text style={styles.heroStatValue}>{stat.value}</Text>
                      <Text style={styles.heroStatLabel} numberOfLines={1}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={[styles.fullBleedRow, styles.filterBleedRow]}>
              <ChipRow
                chips={FILTER_CHIPS.map((chip) => ({ key: chip.key, label: t(chip.labelKey) }))}
                selected={filter}
                onSelect={(key) => setFilter(key as PromotionFilterKey)}
              />
            </View>

            {errorMessage ? (
              <View style={[styles.errorBanner, { backgroundColor: Colors.dangerLight }]}>
                <Ionicons name="warning-outline" size={16} color={Colors.danger} />
                <Text style={styles.errorText} numberOfLines={2}>{errorMessage}</Text>
                <TouchableOpacity onPress={() => fetchData({ page: 1 })}>
                  <Text style={styles.retryText}>{t('promotions.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>{t('promotions.loading')}</Text>
            </View>
          ) : (
            <EmptyState
              icon="pricetag-outline"
              title={t('promotions.empty')}
              description={search ? t('promotions.searchPlaceholder') : t('promotions.createTitle')}
            />
          )
        }
        renderItem={renderPromotion}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fabPill} onPress={() => nav.navigate('PromotionEdit', {})}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.fabPillText}>{t('promotions.createTitle')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 112,
  },
  listEmpty: {
    flexGrow: 1,
  },
  fullBleedRow: {
    marginHorizontal: -Spacing.lg,
  },
  filterBleedRow: {
    paddingRight: Spacing.lg,
  },
  heroWrap: {
    paddingBottom: Spacing.sm,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...Shadow.sm,
  },
  heroLabel: {
    ...Typography.captionMd,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  heroStatRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroStatCol: {
    flex: 1,
    minWidth: 0,
  },
  heroStatValue: {
    ...Typography.h3,
    color: '#fff',
    fontWeight: '700',
  },
  heroStatLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    marginTop: Spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  endedRow: {
    opacity: 0.62,
  },
  discountBox: {
    width: 54,
    height: 54,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadgeValue: {
    ...Typography.captionMd,
    marginTop: 2,
    fontWeight: '800',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  promoName: {
    ...Typography.bodyMd,
    color: Colors.text,
    flex: 1,
  },
  iconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressWrap: {
    marginTop: 6,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  statusText: {
    ...Typography.captionMd,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usageText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statusAction: {
    minHeight: 24,
    justifyContent: 'center',
  },
  statusActionText: {
    ...Typography.captionMd,
    fontWeight: '800',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  errorBanner: {
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#f2c6c6',
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
  fabPillText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
});
