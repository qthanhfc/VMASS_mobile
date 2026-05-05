import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  FlatList,
  Image,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { EmptyState, Header } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ApiError, getBusinessType, listMakeProducts, listProducts } from '../../services';
import type { Product, ProductMakeItem } from '../../types';
import { getProductPlaceholderConfig } from '../../utils/productPlaceholder';

type ProductListItem = Product & { sold: number };
type StockDisplay = {
  text: string;
  tone: 'neutral' | 'ok' | 'warning' | 'danger';
  countedStock: number;
};
type PriceDisplay = {
  priceText: string;
  promoText?: string;
};
type SortKey = 'recent_created' | 'recent_recipe' | 'name_asc' | 'name_desc';

const PAGE_SIZE = 20;

const BASE_FILTERS = [
  { key: 'all', labelKey: 'messages.filter.all' },
  { key: 'selling', labelKey: 'products.selling' },
  { key: 'oos', labelKey: 'products.outOfStock' },
] as const;
const SORT_OPTIONS: Array<{ key: SortKey; labelKey: TranslationKey }> = [
  { key: 'recent_created', labelKey: 'products.sort.newCreated' },
  { key: 'recent_recipe', labelKey: 'products.sort.newRecipe' },
  { key: 'name_asc', labelKey: 'products.sort.az' },
  { key: 'name_desc', labelKey: 'products.sort.za' },
];

function shortPrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
  }
  return `${Math.round(value / 1000)}K`;
}

function formatPriceRange(values: number[]) {
  const validValues = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!validValues.length) return '0';

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);

  return min === max ? shortPrice(min) : `${shortPrice(min)}-${shortPrice(max)}`;
}

function isPromoActive(dateStart?: string | null, dateEnd?: string | null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = dateStart ? new Date(dateStart) : null;
  const end = dateEnd ? new Date(dateEnd) : null;

  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(0, 0, 0, 0);

  if (start && end) return today >= start && today <= end;
  if (start) return today >= start;
  return true;
}

function ProductPlaceholder({ businessType }: { businessType: string }) {
  const placeholder = getProductPlaceholderConfig(businessType);

  return (
    <View style={[styles.productPlaceholder, { backgroundColor: placeholder.backgroundColor }]}>
      <Ionicons name={placeholder.icon} size={24} color={placeholder.iconColor} />
    </View>
  );
}

export function ProductsListScreen() {
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('recent_created');
  const [sortOpen, setSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [makeProducts, setMakeProducts] = useState<ProductMakeItem[]>([]);
  const [businessType, setBusinessType] = useState('');
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(() => new Set());
  const requestSeq = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  const fetchProducts = useCallback(
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
        const [result, makeItems, nextBusinessType] = await Promise.all([
          listProducts({
            pageSize: PAGE_SIZE,
            currentPage: page,
            search: debouncedSearch,
          }),
          page === 1 ? listMakeProducts() : Promise.resolve(null),
          page === 1 ? getBusinessType() : Promise.resolve(null),
        ]);

        if (requestSeq.current !== seq) return;

        const items = result.items.map((item) => ({
          ...item,
          sold: item.bestter ? 1 : 0,
        }));

        setProducts((prev) => {
          if (!append) return items;

          const seen = new Set(prev.map((item) => item.id));
          return [...prev, ...items.filter((item) => !seen.has(item.id))];
        });
        setCurrentPage(result.currentPage);
        setTotalPage(Math.max(result.totalPage, 1));
        setTotalItems(result.totalItem);
        setTotalProducts(result.totalProduct || result.totalItem || items.length);
        if (page === 1) {
          setMakeProducts(makeItems || []);
          setBusinessType(nextBusinessType || '');
        }
      } catch (error) {
        if (requestSeq.current !== seq) return;

        const message =
          error instanceof ApiError || error instanceof Error
            ? error.message
            : t('products.loadError');
        setErrorMessage(message);
        if (!append) {
          setProducts([]);
          setTotalProducts(0);
          setTotalItems(0);
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
    [debouncedSearch],
  );

  useEffect(() => {
    setCategory('all');
    fetchProducts({ page: 1 });
  }, [fetchProducts]);

  const filters = useMemo(() => {
    const hasHotProduct = products.some((p) => Boolean(p.bestter));
    const categoryFilters = Array.from(new Set(products.map((p) => p.category)))
      .filter((name) => name && name !== 'Chưa phân loại')
      .map((name) => ({ key: name, label: name }));

    return [
      { key: BASE_FILTERS[0].key, label: t(BASE_FILTERS[0].labelKey) },
      ...(hasHotProduct ? [{ key: 'hot', label: 'Hot' }] : []),
      ...BASE_FILTERS.slice(1).map((filter) => ({ key: filter.key, label: t(filter.labelKey) })),
      ...categoryFilters,
    ];
  }, [products, t]);

  const makeProductsByProductId = useMemo(() => {
    const byProduct = new Map<number, ProductMakeItem[]>();

    makeProducts.forEach((item) => {
      if (!byProduct.has(item.productId)) {
        byProduct.set(item.productId, []);
      }
      byProduct.get(item.productId)?.push(item);
    });

    return byProduct;
  }, [makeProducts]);

  const getStockDisplay = useCallback(
    (item: Product): StockDisplay => {
      const linkedMakeProducts = makeProductsByProductId.get(item.id) || [];
      const isFnB = businessType === 'cafe' || businessType === 'restaurant';
      const variantStock = item.variants?.reduce((sum, variant) => sum + variant.quantity, 0) || 0;

      if (isFnB) {
        if (linkedMakeProducts.length > 0) {
          return {
            text: t('products.stock.recipeCount', { count: linkedMakeProducts.length }),
            tone: 'neutral',
            countedStock: 0,
          };
        }

        return {
          text: t('products.stock.noRecipe'),
          tone: 'warning',
          countedStock: 0,
        };
      }

      if ((item.variantCount || 0) > 0) {
        return {
          text: variantStock > 0 ? t('products.stock.variantStock', { count: variantStock }) : t('products.stock.out'),
          tone: variantStock > 0 ? (variantStock <= item.minStock ? 'warning' : 'ok') : 'danger',
          countedStock: variantStock,
        };
      }

      const directStockLink =
        linkedMakeProducts.length === 1 &&
        Number(linkedMakeProducts[0].count) === 1 &&
        linkedMakeProducts[0].stock;

      if (directStockLink) {
        const stockCount = linkedMakeProducts[0].stock?.count || 0;

        return {
          text: stockCount > 0 ? t('products.stock.inventory', { count: stockCount }) : t('products.stock.out'),
          tone: stockCount > 0 ? (stockCount <= item.minStock ? 'warning' : 'ok') : 'danger',
          countedStock: stockCount,
        };
      }

      if (linkedMakeProducts.length > 0) {
        return {
          text: t('products.stock.recipeCount', { count: linkedMakeProducts.length }),
          tone: 'neutral',
          countedStock: 0,
        };
      }

      return {
        text: t('products.stock.noLink'),
        tone: 'warning',
        countedStock: 0,
      };
    },
    [businessType, makeProductsByProductId, t],
  );

  const getPriceDisplay = useCallback((item: Product): PriceDisplay => {
    if ((item.variantCount || 0) > 0 && item.variants?.length) {
      const priceText = formatPriceRange(item.variants.map((variant) => variant.price));
      const activePromoPrices = item.variants
        .filter(
          (variant) =>
            (variant.promoPrice || 0) > 0 &&
            isPromoActive(variant.dateStart, variant.dateEnd),
        )
        .map((variant) => variant.promoPrice || 0);
      const promoText = activePromoPrices.length ? formatPriceRange(activePromoPrices) : undefined;

      return { priceText, promoText };
    }

    const hasPromo = Boolean(item.activeSale && (item.priceSale || 0) > 0);

    return {
      priceText: shortPrice(item.price),
      promoText: hasPromo ? shortPrice(item.priceSale || 0) : undefined,
    };
  }, []);

  const stockDisplays = useMemo(
    () => products.map((product) => getStockDisplay(product)),
    [getStockDisplay, products],
  );
  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const stockDisplay = getStockDisplay(p);
        if (category === 'all') return true;
        if (category === 'hot') return Boolean(p.bestter);
        if (category === 'selling') return p.status === 'active' && stockDisplay.tone !== 'danger';
        if (category === 'oos') return stockDisplay.tone === 'danger';
        return p.category === category;
      }),
    [category, getStockDisplay, products],
  );
  const sortedProducts = useMemo(() => {
    const parseDate = (value?: string) => {
      const time = value ? new Date(value).getTime() : 0;
      return Number.isFinite(time) ? time : 0;
    };

    const getRecipeScore = (product: Product) => {
      const linked = makeProductsByProductId.get(product.id);
      return linked?.length || 0;
    };

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name, 'vi', { sensitivity: 'base' });
      }
      if (sortBy === 'recent_recipe') {
        const recipeDiff = getRecipeScore(b) - getRecipeScore(a);
        if (recipeDiff !== 0) return recipeDiff;
        return parseDate(b.updatedAt || b.createdAt) - parseDate(a.updatedAt || a.createdAt);
      }
      return parseDate(b.createdAt) - parseDate(a.createdAt);
    });

    return sorted;
  }, [filtered, makeProductsByProductId, sortBy]);
  const activeSortLabel = t(SORT_OPTIONS.find((option) => option.key === sortBy)?.labelKey || 'products.sort.newCreated');
  const selling = products.filter((p, index) => p.status === 'active' && stockDisplays[index]?.tone !== 'danger').length;
  const lowStock = stockDisplays.filter(display => display.tone === 'warning' && display.countedStock > 0).length;
  const outOfStock = stockDisplays.filter(display => display.tone === 'danger').length;
  const hasMore = currentPage < totalPage;

  const handleRefresh = useCallback(() => {
    fetchProducts({ page: 1, refresh: true });
  }, [fetchProducts]);

  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchProducts({ page: currentPage + 1, append: true });
    }
  }, [currentPage, fetchProducts, hasMore, loading, loadingMore]);

  const renderProduct = ({ item, index }: { item: ProductListItem; index: number }) => {
    if (viewMode === 'grid') {
      const stockDisplay = getStockDisplay(item);
      const priceDisplay = getPriceDisplay(item);
      const showImage = item.image && !failedImageIds.has(item.id);
      const isHot = Boolean(item.bestter);

      return (
        <TouchableOpacity
          style={styles.gridItemWrap}
          onPress={() => navigation.navigate('ProductEdit', { id: item.id })}
          activeOpacity={0.9}
        >
          <View style={[styles.gridItem, stockDisplay.tone === 'danger' && styles.productRowDisabled]}>
            <View style={styles.gridImage}>
              {isHot ? (
                <View style={styles.gridHotBadge}>
                  <Text style={styles.hotBadgeText}>HOT</Text>
                </View>
              ) : null}
              {showImage ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.productImagePhoto}
                  onError={() => {
                    setFailedImageIds((prev) => {
                      const next = new Set(prev);
                      next.add(item.id);
                      return next;
                    });
                  }}
                />
              ) : (
                <ProductPlaceholder businessType={businessType} />
              )}
            </View>
            <View style={styles.gridInfo}>
              <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.gridSku} numberOfLines={1}>{item.sku}</Text>
              <Text
                style={[
                  styles.gridStock,
                  stockDisplay.tone === 'danger'
                    ? styles.stockOutText
                    : stockDisplay.tone === 'warning'
                      ? styles.stockLowText
                      : stockDisplay.tone === 'ok'
                        ? styles.stockOkText
                        : undefined,
                ]}
                numberOfLines={1}
              >
                {stockDisplay.text}
              </Text>
              <View style={styles.gridPriceRow}>
                {priceDisplay.promoText ? (
                  <View style={styles.promoPriceRow}>
                    <Text style={styles.gridOriginalPrice}>{priceDisplay.priceText}</Text>
                    <Text style={styles.priceText}>{priceDisplay.promoText}</Text>
                  </View>
                ) : (
                  <Text style={styles.priceText}>{priceDisplay.priceText}</Text>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    const isHot = Boolean(item.bestter);
    const isFirst = index === 0;
    const isLast = index === sortedProducts.length - 1;
    const stockDisplay = getStockDisplay(item);
    const priceDisplay = getPriceDisplay(item);
    const showImage = item.image && !failedImageIds.has(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.productRow,
          isFirst && styles.productRowFirst,
          !isFirst && styles.productRowWithSeparator,
          isLast && styles.productRowLast,
          stockDisplay.tone === 'danger' && styles.productRowDisabled,
        ]}
        onPress={() => navigation.navigate('ProductEdit', { id: item.id })}
      >
        <View style={styles.productImage}>
          {showImage ? (
            <Image
              source={{ uri: item.image }}
              style={styles.productImagePhoto}
              onError={() => {
                setFailedImageIds((prev) => {
                  const next = new Set(prev);
                  next.add(item.id);
                  return next;
                });
              }}
            />
          ) : (
            <ProductPlaceholder businessType={businessType} />
          )}
        </View>

        <View style={styles.productInfo}>
          <View style={styles.productNameRow}>
            {isHot && (
              <View style={styles.hotBadge}>
                <Text style={styles.hotBadgeText}>HOT</Text>
              </View>
            )}
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          </View>
          <Text style={styles.skuText}>{item.sku} · {item.category}</Text>
          <Text
            style={[
              styles.stockInlineText,
              stockDisplay.tone === 'danger'
                ? styles.stockOutText
                : stockDisplay.tone === 'warning'
                  ? styles.stockLowText
                  : stockDisplay.tone === 'ok'
                    ? styles.stockOkText
                    : undefined,
            ]}
          >
            {stockDisplay.text}
          </Text>
        </View>

        <View style={styles.productRight}>
          {priceDisplay.promoText ? (
            <View style={styles.promoPriceRow}>
              <Text style={styles.originalPriceText}>{priceDisplay.priceText}</Text>
              <Text style={styles.priceText}>{priceDisplay.promoText}</Text>
            </View>
          ) : (
            <Text style={styles.priceText}>{priceDisplay.priceText}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadMoreWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadMoreText}>{t('products.loadingMore')}</Text>
        </View>
      );
    }

    if (!filtered.length) return null;

    return (
      <Text style={styles.loadMoreText}>
        {hasMore
          ? t('products.loadedCount', { loaded: products.length.toLocaleString(dateLocale), total: totalItems.toLocaleString(dateLocale) })
          : t('products.loadedAll')}
      </Text>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title={t('products.title')}
        subtitle={t('products.subtitle', { total: totalProducts.toLocaleString(dateLocale), low: lowStock.toLocaleString(dateLocale) })}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={sortedProducts}
        keyExtractor={item => String(item.id)}
        renderItem={renderProduct}
        key={viewMode}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={[
          styles.list,
          viewMode === 'grid' && styles.gridList,
          sortedProducts.length === 0 && styles.listEmpty,
        ]}
        ListHeaderComponent={
          <View>
            <View style={styles.searchBarWrap}>
              <View style={styles.searchInputWrap}>
                <Ionicons name="search" size={16} color={Colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('products.searchPlaceholder')}
                  placeholderTextColor={Colors.textSecondary}
                />
                <TouchableOpacity>
                  <Ionicons name="qr-code" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.chipRowWrap}>
              <ScrollView
                style={styles.chipScroll}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRowContent}
              >
                {filters.map(chip => {
                  const isActive = category === chip.key;
                  return (
                    <TouchableOpacity
                      key={chip.key}
                      style={[styles.chipItem, isActive && styles.chipItemActive]}
                      onPress={() => setCategory(chip.key)}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{chip.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalProducts}</Text>
                <Text style={styles.statLabel}>{t('products.totalShort')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statValueSuccess]}>{selling}</Text>
                <Text style={styles.statLabel}>{t('products.selling')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statValueWarning]}>{lowStock}</Text>
                <Text style={styles.statLabel}>{t('products.lowStock')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statValueDanger]}>{outOfStock}</Text>
                <Text style={styles.statLabel}>{t('products.outOfStock')}</Text>
              </View>
            </View>

            <View style={styles.sortRow}>
              <TouchableOpacity style={styles.sortBtn} onPress={() => setSortOpen((prev) => !prev)}>
                <Text style={styles.sortText}>{t('products.sortLabel', { label: activeSortLabel })}</Text>
                <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
              <View style={styles.segment}>
                <TouchableOpacity
                  style={[styles.segmentBtn, viewMode === 'list' && styles.segmentBtnActive]}
                  onPress={() => setViewMode('list')}
                >
                  <Text style={[styles.segmentText, viewMode === 'list' && styles.segmentTextActive]}>{t('products.view.list')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentBtn, viewMode === 'grid' && styles.segmentBtnActive]}
                  onPress={() => setViewMode('grid')}
                >
                  <Text style={[styles.segmentText, viewMode === 'grid' && styles.segmentTextActive]}>{t('products.view.grid')}</Text>
                </TouchableOpacity>
              </View>
            </View>
            {sortOpen ? (
              <View style={styles.sortMenu}>
                {SORT_OPTIONS.map((option) => {
                  const isSelected = option.key === sortBy;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.sortOption, isSelected && styles.sortOptionActive]}
                      onPress={() => {
                        setSortBy(option.key);
                        setSortOpen(false);
                      }}
                    >
                      <Text style={[styles.sortOptionText, isSelected && styles.sortOptionTextActive]}>
                        {t(option.labelKey)}
                      </Text>
                      {isSelected ? <Ionicons name="checkmark" size={14} color={Colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={16} color={Colors.danger} />
                <Text style={styles.errorText} numberOfLines={2}>{errorMessage}</Text>
                <TouchableOpacity onPress={() => fetchProducts({ page: 1 })}>
                    <Text style={styles.retryText}>{t('products.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        }
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
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>{t('products.loading')}</Text>
            </View>
          ) : (
            <EmptyState
              icon="cube-outline"
              title={t('products.emptyTitle')}
              description={debouncedSearch ? t('products.emptySearch') : t('products.emptyDescription')}
            />
          )
        }
        ListFooterComponent={renderFooter}
      />

      <TouchableOpacity style={styles.fabPill} onPress={() => navigation.navigate('ProductEdit')}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.fabPillText}>{t('products.addShort')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBarWrap: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  searchInputWrap: {
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
  },
  chipRowWrap: {
    paddingBottom: Spacing.sm,
  },
  chipScroll: {
    maxHeight: 36,
  },
  chipRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.sm,
    paddingBottom: 1,
  },
  chipItem: {
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginRight: 6,
  },
  chipItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.captionMd,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlignVertical: 'center',
  },
  chipTextActive: {
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  statItem: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statValue: {
    ...Typography.bodyMd,
    color: Colors.text,
    fontWeight: '700',
  },
  statValueSuccess: {
    color: Colors.success,
  },
  statValueWarning: {
    color: Colors.warning,
  },
  statValueDanger: {
    color: Colors.danger,
  },
  statLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sortRow: {
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  sortMenu: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    ...Shadow.sm,
  },
  sortOption: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  sortOptionText: {
    ...Typography.captionMd,
    color: Colors.text,
  },
  sortOptionTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: 2,
    backgroundColor: Colors.card,
  },
  segmentBtn: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  gridList: {
    paddingHorizontal: Spacing.md,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  gridItemWrap: {
    width: '48.8%',
    marginBottom: 8,
  },
  gridItem: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  gridImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    position: 'relative',
  },
  gridHotBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gridInfo: {
    padding: 8,
    gap: 4,
  },
  gridName: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '700',
    minHeight: 34,
  },
  gridSku: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  gridStock: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  gridPriceRow: {
    marginTop: 2,
  },
  promoPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  gridOriginalPrice: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
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
    marginHorizontal: Spacing.lg,
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
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  productRowFirst: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    ...Shadow.sm,
  },
  productRowWithSeparator: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
  },
  productRowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  productRowDisabled: {
    opacity: 0.6,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  productImagePhoto: {
    width: '100%',
    height: '100%',
  },
  productPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productName: {
    ...Typography.bodyMd,
    color: Colors.text,
    flex: 1,
  },
  hotBadge: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  hotBadgeText: {
    ...Typography.label,
    color: '#fff',
    fontSize: 9,
  },
  skuText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stockInlineText: {
    ...Typography.caption,
    marginTop: 2,
    color: Colors.textSecondary,
  },
  stockLowText: {
    color: Colors.warning,
    fontWeight: '600',
  },
  stockOkText: {
    color: Colors.success,
    fontWeight: '600',
  },
  stockOutText: {
    color: Colors.danger,
    fontWeight: '600',
  },
  priceText: {
    ...Typography.bodyMd,
    color: Colors.primary,
    fontWeight: '700',
  },
  originalPriceText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  productRight: {
    alignItems: 'flex-end',
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
