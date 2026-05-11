import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  Pressable,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, type TranslationKey } from '../../i18n';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { Card, SearchBar, SectionHeader } from '../../components';
import { ManageStackParamList } from '../../navigation';
import {
  ApiError,
  connectPlatform,
  listCustomers,
  listDebtInvoices,
  listEcommercePlatforms,
  listInventoryStocks,
  listOrders,
  listProducts,
  listPromotions,
  listReturnRequests,
  listStaff,
  listSuppliers,
  syncPlatform,
  type EcommercePlatformSummary,
} from '../../services';
import type { Product } from '../../types';

type NavProp = NativeStackNavigationProp<ManageStackParamList, 'ManageMain'>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ManageSection {
  key: keyof ManageStackParamList;
  labelKey: TranslationKey;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  statKey: TranslationKey;
  color?: string;
}

type PlatformVisual = {
  label: string;
  logo: ImageSourcePropType;
};

type SearchResultType = 'feature' | 'action' | 'platform' | 'product';

type ManageRoute = keyof ManageStackParamList;
type NavigateFn = (key: ManageRoute, params?: any) => void;

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  type: SearchResultType;
  route: ManageRoute;
  params?: any;
  keywords: string[];
  scoreBoost?: number;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const SECTIONS: ManageSection[] = [
  { key: 'OrdersList', labelKey: 'manage.section.orders', icon: 'receipt-outline', statKey: 'manage.section.ordersStat', color: Colors.primary },
  { key: 'ProductsList', labelKey: 'manage.section.products', icon: 'shirt-outline', statKey: 'manage.section.productsStat', color: '#7c3aed' },
  { key: 'InventoryMain', labelKey: 'manage.section.inventory', icon: 'cube-outline', statKey: 'manage.section.inventoryStat', color: Colors.warning },
  { key: 'CustomersList', labelKey: 'manage.section.customers', icon: 'people-outline', statKey: 'manage.section.customersStat', color: '#0891b2' },
  { key: 'SuppliersList', labelKey: 'manage.section.suppliers', icon: 'business-outline', statKey: 'manage.section.suppliersStat', color: '#16a34a' },
  { key: 'ReturnsList', labelKey: 'manage.section.returns', icon: 'return-down-back-outline', statKey: 'manage.section.returnsStat', color: Colors.danger },
  { key: 'PromotionsList', labelKey: 'manage.section.promotions', icon: 'pricetag-outline', statKey: 'manage.section.promotionsStat', color: Colors.accent },
  { key: 'StaffList', labelKey: 'manage.section.staff', icon: 'id-card-outline', statKey: 'manage.section.staffStat', color: '#db2777' },
  { key: 'DebtInvoiceMain', labelKey: 'manage.section.debtInvoice', icon: 'document-text-outline', statKey: 'manage.section.debtInvoiceStat', color: '#0891b2' },
  { key: 'TaxMain', labelKey: 'manage.section.accounting', icon: 'calculator-outline', statKey: 'manage.section.accountingStat', color: Colors.success },
];

const PLATFORM_VISUALS: Record<string, PlatformVisual> = {
  shopee: { label: 'Shopee', logo: require('../../../assets/ecommerce/shopee.png') },
  lazada: { label: 'Lazada', logo: require('../../../assets/ecommerce/lazada.png') },
  tiktok: { label: 'TikTok Shop', logo: require('../../../assets/ecommerce/tiktok.png') },
  tiki: { label: 'Tiki', logo: require('../../../assets/ecommerce/tiki.png') },
  sendo: { label: 'Sendo', logo: require('../../../assets/ecommerce/sendo.png') },
  facebook: { label: 'Facebook Shop', logo: require('../../../assets/ecommerce/facebook.png') },
};

const QUICK_ACTIONS = [
  {
    key: 'pos-sale',
    labelKey: 'manage.quick.posSale' as TranslationKey,
    icon: 'storefront-outline' as const,
    onPress: (navigate: NavigateFn) => navigate('PosScreen'),
  },
  {
    key: 'import-stock',
    labelKey: 'manage.quick.importStock' as TranslationKey,
    icon: 'download-outline' as const,
    onPress: (navigate: NavigateFn) =>
      navigate('InventoryEdit', { mode: 'import' }),
  },
  {
    key: 'add-customer',
    labelKey: 'manage.quick.addCustomer' as TranslationKey,
    icon: 'person-add-outline' as const,
    onPress: (navigate: NavigateFn) => navigate('CustomerEdit'),
  },
  {
    key: 'add-product',
    labelKey: 'manage.quick.addProduct' as TranslationKey,
    icon: 'cube-outline' as const,
    onPress: (navigate: NavigateFn) => navigate('ProductCreate'),
  },
];

const BOOKKEEPING_STATS = [
  { labelKey: 'manage.stat.q4Revenue' as TranslationKey, value: '287.4M', color: Colors.success },
  { labelKey: 'manage.stat.taxDue' as TranslationKey, value: '14.3M', color: Colors.danger },
  { labelKey: 'manage.stat.dueDate' as TranslationKey, value: '31/01', color: Colors.warning },
];

const BOOKKEEPING_LINKS: Array<{ labelKey: TranslationKey; route: keyof ManageStackParamList }> = [
  { labelKey: 'manage.link.q4Declaration', route: 'TaxMain' },
  { labelKey: 'manage.link.vatInvoice', route: 'TaxMain' },
  { labelKey: 'manage.link.incomeExpense', route: 'BookkeepingMain' },
  { labelKey: 'manage.link.report', route: 'BookkeepingMain' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function money(n: number, dateLocale: string, currency: string) {
  return `${n.toLocaleString(dateLocale)} ${currency}`;
}

function productTimestamp(product: Product) {
  const value = product.updatedAt || product.createdAt;
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value).split(/\s+/).filter(Boolean);
}

function rankSearchItem(item: SearchItem, query: string) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return -1;

  const title = normalizeText(item.title);
  const subtitle = normalizeText(item.subtitle);
  const keywords = item.keywords.map(normalizeText);
  const allText = `${title} ${subtitle} ${keywords.join(' ')}`;
  const tokens = tokenize(query);

  let score = item.scoreBoost || 0;

  if (title === normalizedQuery) score += 120;
  else if (title.startsWith(normalizedQuery)) score += 86;
  else if (title.includes(normalizedQuery)) score += 58;

  if (subtitle.includes(normalizedQuery)) score += 32;
  if (allText.includes(normalizedQuery)) score += 20;

  let matchedTokens = 0;
  for (const token of tokens) {
    if (title.startsWith(token)) score += 20;
    if (title.includes(token)) score += 13;
    else if (subtitle.includes(token)) score += 9;
    else if (keywords.some(k => k.includes(token))) score += 7;

    if (allText.includes(token)) matchedTokens += 1;
  }

  if (tokens.length > 1 && matchedTokens === tokens.length) score += 26;
  if (tokens.length > 0 && matchedTokens === 0) return -1;

  return score;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightParts(text: string, query: string) {
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (tokens.length === 0) {
    return [{ text, highlight: false }];
  }

  const pattern = tokens.map(token => escapeRegExp(token)).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  const segments = text.split(regex).filter(part => part.length > 0);

  return segments.map(segment => ({
    text: segment,
    highlight: tokens.some(token => segment.toLowerCase() === token.toLowerCase()),
  }));
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function ManageScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const navigation = useNavigation<NavProp>();
  const [search, setSearch] = useState('');
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState('');
  const [platforms, setPlatforms] = useState<EcommercePlatformSummary[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);
  const [platformError, setPlatformError] = useState('');
  const [syncingPlatform, setSyncingPlatform] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sectionStats, setSectionStats] = useState<Partial<Record<keyof ManageStackParamList, number>>>({});
  const searchBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectedPlatforms = useMemo(() => platforms.filter(p => p.connected), [platforms]);
  const totalOrdersToday = useMemo(() => connectedPlatforms.reduce((sum, p) => sum + p.orders, 0), [connectedPlatforms]);
  const totalPendingOrders = useMemo(() => connectedPlatforms.reduce((sum, p) => sum + p.pending, 0), [connectedPlatforms]);

  const clearBlurTimer = useCallback(() => {
    if (!searchBlurTimerRef.current) return;
    clearTimeout(searchBlurTimerRef.current);
    searchBlurTimerRef.current = null;
  }, []);

  const loadRecentProducts = useCallback(async () => {
    setLoadingRecent(true);
    setRecentError('');

    try {
      const result = await listProducts({ pageSize: 20, currentPage: 1, search: '' });
      const nextRecentProducts = [...result.items]
        .sort((a, b) => productTimestamp(b) - productTimestamp(a))
        .slice(0, 3);
      setRecentProducts(nextRecentProducts);
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : t('products.loadError');
      setRecentError(message);
      setRecentProducts([]);
    } finally {
      setLoadingRecent(false);
    }
  }, [t]);

  const loadPlatformSummary = useCallback(async () => {
    setLoadingPlatforms(true);
    setPlatformError('');
    try {
      const result = await listEcommercePlatforms();
      setPlatforms(result.items);
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Không thể tải dữ liệu sàn TMĐT.';
      setPlatformError(message);
      setPlatforms([]);
    } finally {
      setLoadingPlatforms(false);
    }
  }, []);

  const loadSectionStats = useCallback(async () => {
    try {
      const [
        ordersResult,
        productsResult,
        customersResult,
        suppliersResult,
        returnsResult,
        promotionsResult,
        staffResult,
        debtInvoicesResult,
        inventoryStocksResult,
      ] = await Promise.all([
        listOrders({ pageSize: 1, currentPage: 1 }),
        listProducts({ pageSize: 1, currentPage: 1 }),
        listCustomers({ pageSize: 1, currentPage: 1 }),
        listSuppliers({ pageSize: 1, currentPage: 1 }),
        listReturnRequests({ status: 'all' }),
        listPromotions({ pageSize: 1, currentPage: 1 }),
        listStaff({ pageSize: 1, currentPage: 1 }),
        listDebtInvoices({ pageSize: 1, currentPage: 1 }),
        listInventoryStocks(),
      ]);

      const nearOutCount = inventoryStocksResult.filter((item) => item.alertDown10 || item.alertDown20 || item.count <= 5).length;

      setSectionStats({
        OrdersList: ordersResult.totalItem,
        ProductsList: productsResult.totalItem,
        InventoryMain: nearOutCount,
        CustomersList: customersResult.totalItem,
        SuppliersList: suppliersResult.totalItem,
        ReturnsList: returnsResult.length,
        PromotionsList: promotionsResult.totalItem,
        StaffList: staffResult.totalStaff || staffResult.totalItem,
        DebtInvoiceMain: debtInvoicesResult.totalItem,
      });
    } catch {
      // Fallback to static i18n stat text if real stats cannot be loaded.
    }
  }, []);

  const formatSectionStat = useCallback((key: keyof ManageStackParamList, fallbackText: string) => {
    const count = sectionStats[key];
    if (typeof count !== 'number') return fallbackText;
    const formatted = count.toLocaleString(dateLocale);
    switch (key) {
      case 'OrdersList':
        return t('manage.orderCount', { count });
      case 'InventoryMain':
        return `${formatted} ${t('inventory.lowStockProducts').toLowerCase()}`;
      case 'ReturnsList':
        return `${formatted} ${t('manage.section.returns').toLowerCase()}`;
      case 'PromotionsList':
        return `${formatted} ${t('promotions.title').toLowerCase()}`;
      case 'StaffList':
        return `${formatted} ${t('manage.section.staff').toLowerCase()}`;
      case 'DebtInvoiceMain':
        return `${formatted} ${t('manage.section.debtInvoice').toLowerCase()}`;
      case 'ProductsList':
      case 'CustomersList':
      case 'SuppliersList':
      default:
        return `${formatted} ${t(
          key === 'ProductsList'
            ? 'manage.section.products'
            : key === 'CustomersList'
              ? 'manage.section.customers'
              : 'manage.section.suppliers',
        ).toLowerCase()}`;
    }
  }, [dateLocale, sectionStats, t]);

  useFocusEffect(
    useCallback(() => {
      loadRecentProducts();
      loadPlatformSummary();
      loadSectionStats();
    }, [loadPlatformSummary, loadRecentProducts, loadSectionStats]),
  );

  function navigate(key: keyof ManageStackParamList, params?: any) {
    navigation.navigate(key as any, params);
  }

  const triggerQuickConnect = useCallback(
    async (platformKey: string) => {
      try {
        const result = await connectPlatform(platformKey as any);
        const redirect =
          (result as any)?.url ||
          (result as any)?.data?.url ||
          '';
        if (typeof redirect === 'string' && /^https?:\/\//i.test(redirect)) {
          await Linking.openURL(redirect);
        }
      } catch (error) {
        setPlatformError(
          error instanceof Error ? error.message : 'Không thể mở luồng kết nối sàn.',
        );
      }
    },
    [],
  );

  const triggerQuickSync = useCallback(
    async (platformKey: string) => {
      setSyncingPlatform(platformKey);
      setPlatformError('');
      try {
        await syncPlatform(platformKey as any);
        await loadPlatformSummary();
      } catch (error) {
        setPlatformError(
          error instanceof Error ? error.message : 'Không thể đồng bộ dữ liệu sàn.',
        );
      } finally {
        setSyncingPlatform('');
      }
    },
    [loadPlatformSummary],
  );

  const featureSearchItems = useMemo<SearchItem[]>(
    () => [
      {
        id: 'feature-orders',
        title: t('manage.section.orders'),
        subtitle: formatSectionStat('OrdersList', t('manage.section.ordersStat')),
        icon: 'receipt-outline',
        type: 'feature',
        route: 'OrdersList',
        keywords: ['order', 'don hang', 'ban hang'],
      },
      {
        id: 'feature-products',
        title: t('manage.section.products'),
        subtitle: formatSectionStat('ProductsList', t('manage.section.productsStat')),
        icon: 'shirt-outline',
        type: 'feature',
        route: 'ProductsList',
        keywords: ['product', 'san pham', 'sku', 'hang hoa'],
      },
      {
        id: 'feature-inventory',
        title: t('manage.section.inventory'),
        subtitle: formatSectionStat('InventoryMain', t('manage.section.inventoryStat')),
        icon: 'cube-outline',
        type: 'feature',
        route: 'InventoryMain',
        keywords: ['inventory', 'ton kho', 'kho'],
      },
      {
        id: 'feature-customers',
        title: t('manage.section.customers'),
        subtitle: formatSectionStat('CustomersList', t('manage.section.customersStat')),
        icon: 'people-outline',
        type: 'feature',
        route: 'CustomersList',
        keywords: ['customer', 'khach hang'],
      },
      {
        id: 'feature-suppliers',
        title: t('manage.section.suppliers'),
        subtitle: formatSectionStat('SuppliersList', t('manage.section.suppliersStat')),
        icon: 'business-outline',
        type: 'feature',
        route: 'SuppliersList',
        keywords: ['supplier', 'nha cung cap', 'ncc'],
      },
      {
        id: 'feature-returns',
        title: t('manage.section.returns'),
        subtitle: formatSectionStat('ReturnsList', t('manage.section.returnsStat')),
        icon: 'return-down-back-outline',
        type: 'feature',
        route: 'ReturnsList',
        keywords: ['returns', 'tra hang', 'doi tra'],
      },
      {
        id: 'feature-promotions',
        title: t('manage.section.promotions'),
        subtitle: formatSectionStat('PromotionsList', t('manage.section.promotionsStat')),
        icon: 'pricetag-outline',
        type: 'feature',
        route: 'PromotionsList',
        keywords: ['promotion', 'khuyen mai', 'voucher'],
      },
      {
        id: 'feature-staff',
        title: t('manage.section.staff'),
        subtitle: formatSectionStat('StaffList', t('manage.section.staffStat')),
        icon: 'id-card-outline',
        type: 'feature',
        route: 'StaffList',
        keywords: ['staff', 'nhan vien', 'phan quyen'],
      },
      {
        id: 'feature-bookkeeping',
        title: t('manage.section.accounting'),
        subtitle: formatSectionStat('BookkeepingMain', t('manage.section.accountingStat')),
        icon: 'calculator-outline',
        type: 'feature',
        route: 'BookkeepingMain',
        keywords: ['bookkeeping', 'ke toan', 'bao cao'],
      },
      {
        id: 'feature-tax',
        title: t('manage.taxDeclaration'),
        subtitle: t('manage.bookkeepingTitle'),
        icon: 'document-text-outline',
        type: 'feature',
        route: 'TaxMain',
        keywords: ['tax', 'thue', 'vat'],
      },
      {
        id: 'feature-pos',
        title: t('manage.quick.posSale'),
        subtitle: t('manage.searchQuickAction'),
        icon: 'storefront-outline',
        type: 'feature',
        route: 'PosScreen',
        keywords: ['pos', 'ban nhanh', 'thu ngan'],
      },
      {
        id: 'feature-qr',
        title: t('tabs.scanQr'),
        subtitle: t('scan.title'),
        icon: 'qr-code-outline',
        type: 'feature',
        route: 'QrScan',
        keywords: ['qr', 'barcode', 'quet ma'],
      },
      {
        id: 'feature-ecommerce',
        title: t('manage.ecommercePlatforms'),
        subtitle: t('manage.totalOrdersToday'),
        icon: 'storefront-outline',
        type: 'feature',
        route: 'EcommerceMain',
        keywords: ['ecommerce', 'tmđt', 'shopee', 'lazada', 'tiktok'],
      },
    ],
    [formatSectionStat, t],
  );

  const quickActionSearchItems = useMemo<SearchItem[]>(
    () =>
      QUICK_ACTIONS.map(action => ({
        id: `quick-${action.key}`,
        title: t(action.labelKey),
        subtitle: t('manage.searchQuickAction'),
        icon: action.icon,
        type: 'action' as const,
        route:
          action.key === 'import-stock'
            ? 'InventoryEdit'
            : action.key === 'add-customer'
              ? 'CustomerEdit'
              : action.key === 'add-product'
                ? 'ProductCreate'
                : 'PosScreen',
        params: action.key === 'import-stock' ? { mode: 'import' } : undefined,
        keywords: ['quick action', 'truy cap nhanh', normalizeText(t(action.labelKey))],
        scoreBoost: 10,
      })),
    [t],
  );

  const platformSearchItems = useMemo<SearchItem[]>(
    () =>
      platforms.map(platform => {
        const visual = PLATFORM_VISUALS[platform.key];
        const label = visual?.label || platform.key;
        return {
          id: `platform-${platform.key}`,
          title: label,
          subtitle: platform.connected
            ? t('manage.searchPlatformConnected', { count: platform.orders })
            : t('manage.notConnected'),
          icon: 'storefront-outline' as const,
          type: 'platform' as const,
          route: 'EcommerceMain' as const,
          keywords: [label, platform.key, 'ecommerce', 'san'],
        };
      }),
    [platforms, t],
  );

  const recentProductSearchItems = useMemo<SearchItem[]>(
    () =>
      recentProducts.map(product => ({
        id: `product-${product.id}`,
        title: product.name,
        subtitle: `${product.sku || t('manage.searchNoSku')} · ${money(product.price, dateLocale, t('home.currency'))}`,
        icon: 'shirt-outline' as const,
        type: 'product' as const,
        route: 'ProductEdit' as const,
        params: { id: product.id },
        keywords: [product.name, product.sku || '', 'product', 'san pham'],
        scoreBoost: 16 + Math.round(productTimestamp(product) / 1000000000000),
      })),
    [dateLocale, recentProducts, t],
  );

  const searchItems = useMemo(
    () => [...featureSearchItems, ...quickActionSearchItems, ...platformSearchItems, ...recentProductSearchItems],
    [featureSearchItems, platformSearchItems, quickActionSearchItems, recentProductSearchItems],
  );

  const rankedSearchResults = useMemo(() => {
    const q = search.trim();
    if (!q) return [];
    return searchItems
      .map(item => ({ item, score: rankSearchItem(item, q) }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .slice(0, 10)
      .map(result => result.item);
  }, [search, searchItems]);

  const topSearchResults = rankedSearchResults.slice(0, 4);
  const secondarySearchResults = rankedSearchResults.slice(4);
  const showSearchOverlay = isSearchFocused && search.trim().length > 0;

  const handleSearchFocus = useCallback(() => {
    clearBlurTimer();
    setIsSearchFocused(true);
  }, [clearBlurTimer]);

  const handleSearchBlur = useCallback(() => {
    clearBlurTimer();
    searchBlurTimerRef.current = setTimeout(() => {
      setIsSearchFocused(false);
    }, 140);
  }, [clearBlurTimer]);

  const closeSearchOverlay = useCallback(() => {
    clearBlurTimer();
    setIsSearchFocused(false);
  }, [clearBlurTimer]);

  const navigateFromSearch = useCallback(
    (item: SearchItem) => {
      clearBlurTimer();
      setSearch('');
      setIsSearchFocused(false);
      navigate(item.route, item.params);
    },
    [clearBlurTimer],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('manage.title')}</Text>
        {/* <TouchableOpacity style={styles.headerIcon} onPress={() => navigate('QrScan')}>
          <Ionicons name="qr-code-outline" size={22} color={Colors.text} />
        </TouchableOpacity> */}
      </View>

      {showSearchOverlay && (
        <Pressable
          style={styles.searchBackdrop}
          onPress={closeSearchOverlay}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        />
      )}

      {/* ── Search ── */}
      <View style={styles.searchArea}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('manage.searchPlaceholder')}
          onQrPress={() => navigate('QrScan')}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
        />

        {showSearchOverlay && (
          <View style={[styles.searchOverlay, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.searchOverlayHeader}>
              <Text style={styles.searchOverlayTitle}>{t('manage.searchTopResults')}</Text>
              <Text style={styles.searchOverlayCount}>
                {t('manage.searchResultCount', { count: rankedSearchResults.length })}
              </Text>
            </View>

            <ScrollView
              style={styles.searchOverlayList}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {rankedSearchResults.length === 0 ? (
                <View style={styles.searchEmptyWrap}>
                  <Ionicons name="search-outline" size={22} color={Colors.textSecondary} />
                  <Text style={styles.searchEmptyTitle}>{t('manage.searchNoResultTitle')}</Text>
                  <Text style={styles.searchEmptyDescription}>{t('manage.searchNoResultDescription')}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.searchGroupWrap}>
                    <Text style={styles.searchGroupLabel}>{t('manage.searchGroupBestMatch')}</Text>
                    {topSearchResults.map(item => (
                      <Pressable
                        key={item.id}
                        style={styles.searchItem}
                        onPress={() => navigateFromSearch(item)}
                      >
                        <View style={styles.searchItemIconWrap}>
                          <Ionicons name={item.icon} size={18} color={Colors.primary} />
                        </View>
                        <View style={styles.searchItemBody}>
                          <Text style={styles.searchItemTitle} numberOfLines={1}>
                            {highlightParts(item.title, search).map((part, index) => (
                              <Text
                                key={`${item.id}-title-${index}`}
                                style={part.highlight ? styles.searchTextHighlight : undefined}
                              >
                                {part.text}
                              </Text>
                            ))}
                          </Text>
                          <Text style={styles.searchItemSubtitle} numberOfLines={1}>
                            {highlightParts(item.subtitle, search).map((part, index) => (
                              <Text
                                key={`${item.id}-subtitle-${index}`}
                                style={part.highlight ? styles.searchTextHighlight : undefined}
                              >
                                {part.text}
                              </Text>
                            ))}
                          </Text>
                        </View>
                        <Text style={styles.searchItemType}>
                          {item.type === 'product'
                            ? t('manage.searchTypeProduct')
                            : item.type === 'action'
                              ? t('manage.searchTypeQuickAction')
                              : item.type === 'platform'
                                ? t('manage.searchTypePlatform')
                                : t('manage.searchTypeFeature')}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {secondarySearchResults.length > 0 && (
                    <View style={styles.searchGroupWrap}>
                      <Text style={styles.searchGroupLabel}>{t('manage.searchGroupRelated')}</Text>
                      {secondarySearchResults.map(item => (
                        <Pressable
                          key={item.id}
                          style={styles.searchItem}
                          onPress={() => navigateFromSearch(item)}
                        >
                          <View style={styles.searchItemIconWrap}>
                            <Ionicons name={item.icon} size={18} color={Colors.primary} />
                          </View>
                          <View style={styles.searchItemBody}>
                            <Text style={styles.searchItemTitle} numberOfLines={1}>
                              {highlightParts(item.title, search).map((part, index) => (
                                <Text
                                  key={`${item.id}-related-title-${index}`}
                                  style={part.highlight ? styles.searchTextHighlight : undefined}
                                >
                                  {part.text}
                                </Text>
                              ))}
                            </Text>
                            <Text style={styles.searchItemSubtitle} numberOfLines={1}>
                              {highlightParts(item.subtitle, search).map((part, index) => (
                                <Text
                                  key={`${item.id}-related-subtitle-${index}`}
                                  style={part.highlight ? styles.searchTextHighlight : undefined}
                                >
                                  {part.text}
                                </Text>
                              ))}
                            </Text>
                          </View>
                          <Ionicons name="arrow-forward" size={16} color={Colors.textSecondary} />
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Quick Actions ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsRow}
        >
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.key}
              style={[styles.quickChip, { backgroundColor: colors.primaryLight }]}
              onPress={() => action.onPress(navigate)}
              activeOpacity={0.7}
            >
              <Ionicons name={action.icon} size={16} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.quickChipLabel, { color: colors.primary }]}>{t(action.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Bookkeeping Card ── */}
        <View style={styles.px}>
          <TouchableOpacity onPress={() => navigate('BookkeepingMain')} activeOpacity={0.85}>
            <Card style={styles.bookkeepingCard} padding={Spacing.lg}>
              <View style={styles.bookkeepingHeader}>
                <View style={styles.bookkeepingTitleRow}>
                  <Ionicons name="calculator" size={20} color="#fff" />
                  <Text style={[styles.bookkeepingTitle, { color: '#fff' }]}>{t('manage.bookkeepingTitle')}</Text>
                </View>
                <View style={styles.taxPill}>
                  <Text style={[styles.taxPillText, { color: '#fff' }]}>{t('manage.taxDeclaration')}</Text>
                </View>
              </View>

              <View style={styles.bookkeepingStats}>
                {BOOKKEEPING_STATS.map((s, index) => (
                  <View
                    key={s.labelKey}
                    style={[
                      styles.bookkeepingStat,
                      index === 1 && styles.bookkeepingStatCenter,
                      index === BOOKKEEPING_STATS.length - 1 && styles.bookkeepingStatRight,
                    ]}
                  >
                    <Text style={[styles.bookkeepingStatValue, { color: '#fff' }]}>{s.value}</Text>
                    <Text style={[styles.bookkeepingStatLabel, { color: 'rgba(255,255,255,0.78)' }]}>{t(s.labelKey)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.bookkeepingLinks}>
                {BOOKKEEPING_LINKS.map(link => (
                  <TouchableOpacity
                    key={link.labelKey}
                    style={styles.bookkeepingLinkChip}
                    onPress={() => navigate(link.route)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.bookkeepingLinkText, { color: '#fff' }]}>{t(link.labelKey)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* ── Management Sections ── */}
        <SectionHeader title={t('manage.title')} />
        <View style={styles.px}>
          <Card padding={0}>
            {SECTIONS.map((s, i) => (
              <TouchableOpacity
                key={`${s.key}-${i}`}
                style={[
                  styles.sectionRow,
                  i < SECTIONS.length - 1 && styles.rowBorder,
                ]}
                onPress={() => navigate(s.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.sectionRowIconWrap, { backgroundColor: (s.color || Colors.primary) + '18' }]}>
                  <Ionicons name={s.icon} size={20} color={s.color || Colors.primary} />
                </View>
                <View style={styles.sectionRowContent}>
                  <Text style={styles.sectionRowLabel}>{t(s.labelKey)}</Text>
                  <Text style={styles.sectionRowStat}>{formatSectionStat(s.key, t(s.statKey))}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* ── E-commerce Platforms ── */}
        <View style={styles.px}>
          <Card padding={Spacing.md}>
            <View style={styles.platformSectionHeaderWrap}>
              <SectionHeader title={t('manage.ecommercePlatforms')}/>
            </View>
            {loadingPlatforms ? (
              <View style={styles.recentStateWrap}>
                <Text style={styles.recentStateText}>{t('products.loading')}</Text>
              </View>
            ) : platformError ? (
              <View style={styles.recentStateWrap}>
                <Text style={[styles.recentStateText, styles.recentErrorText]} numberOfLines={3}>
                  {platformError}
                </Text>
                <TouchableOpacity
                  onPress={loadPlatformSummary}
                  style={styles.recentRetryBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.recentRetryText}>{t('products.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.platformGrid}>
                {platforms.map(p => {
                  const visual = PLATFORM_VISUALS[p.key] || PLATFORM_VISUALS.shopee;
                  return (
                    <TouchableOpacity
                      key={p.key}
                      style={[styles.platformCard, { backgroundColor: colors.background, borderColor: colors.border }, !p.connected && styles.platformCardDisabled]}
                      onPress={() => navigate('EcommerceMain')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.platformTop}>
                        <Image source={visual.logo} style={styles.platformLogo} resizeMode="contain" />
                        <Text style={[styles.platformStateText, p.connected ? styles.stateOn : styles.stateOff]}>
                          {p.connected ? 'ON' : 'OFF'}
                        </Text>
                      </View>
                      <Text style={styles.platformName}>{visual.label}</Text>
                      {p.connected ? (
                        <View style={styles.platformMetaRow}>
                          <Text style={styles.platformOrders}>{t('manage.orderCount', { count: p.orders })}</Text>
                          {p.pending > 0 && (
                            <>
                              <Ionicons
                                name="ellipse"
                                size={5}
                                color={Colors.textSecondary}
                                style={styles.platformMetaDot}
                              />
                              <Text style={styles.platformPendingOrders}>{t('manage.pendingCount', { count: p.pending })}</Text>
                            </>
                          )}
                        </View>
                      ) : (
                        <Text style={[styles.platformOrders, styles.platformOrdersStandalone]}>{t('manage.notConnected')}</Text>
                      )}
                      <View style={styles.platformActionRow}>
                        {p.connected ? (
                          <TouchableOpacity
                            onPress={() => triggerQuickSync(p.key)}
                            disabled={syncingPlatform === p.key}
                            style={styles.platformActionBtn}
                          >
                            <Text style={styles.platformActionText}>
                              {syncingPlatform === p.key ? 'Sync...' : 'Sync'}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={() => triggerQuickConnect(p.key)}
                            style={styles.platformActionBtn}
                          >
                            <Text style={styles.platformActionText}>{t('ecommerce.connect')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <View style={styles.platformSummary}>
              <View style={styles.platformSummaryDivider}>
                {Array.from({ length: 36 }).map((_, i) => (
                  <View key={`dash-${i}`} style={styles.platformSummaryDash} />
                ))}
              </View>
              <View style={styles.platformSummaryLine}>
                <Text style={styles.platformSummaryLabel}>{t('manage.totalOrdersToday')}</Text>
                <View style={styles.platformSummaryMetrics}>
                  <Text style={styles.platformSummaryTotal}>{t('manage.orderCount', { count: totalOrdersToday })}</Text>
                  {/* <Text style={styles.platformSummaryDot}>.</Text> */}
                  <Ionicons
                    name="ellipse"
                    size={5}
                    color={Colors.textSecondary}
                    style={styles.platformMetaDot}
                  />
                  <Text style={styles.platformSummaryPendingText}>{t('manage.pendingCount', { count: totalPendingOrders })}</Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* ── Recent Products ── */}
        <SectionHeader title={t('manage.recentProducts')} action={t('manage.viewAll')} onAction={() => navigate('ProductsList')} />
        <View style={styles.px}>
          <Card padding={0} style={styles.tableCard}>
            {loadingRecent ? (
              <View style={styles.recentStateWrap}>
                <Text style={styles.recentStateText}>{t('products.loading')}</Text>
              </View>
            ) : recentError ? (
              <View style={styles.recentStateWrap}>
                <Text style={[styles.recentStateText, styles.recentErrorText]} numberOfLines={2}>
                  {recentError}
                </Text>
                <TouchableOpacity onPress={loadRecentProducts} style={styles.recentRetryBtn} activeOpacity={0.7}>
                  <Text style={styles.recentRetryText}>{t('products.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : recentProducts.length === 0 ? (
              <View style={styles.recentStateWrap}>
                <Text style={styles.recentStateText}>{t('products.emptyDescription')}</Text>
              </View>
            ) : (
              recentProducts.map((p, i) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.productRow,
                    i < recentProducts.length - 1 && styles.rowBorder,
                  ]}
                  onPress={() => navigation.navigate('ProductEdit', { id: p.id })}
                  activeOpacity={0.7}
                >
                  <View style={styles.productThumb}>
                    <Ionicons name="shirt-outline" size={20} color={Colors.textSecondary} />
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.productSku}>{p.sku}</Text>
                  </View>
                  <View style={styles.productRight}>
                    <Text style={styles.productPrice}>{money(p.price, dateLocale, t('home.currency'))}</Text>
                    <Text style={[styles.productStock, p.stock <= 5 && { color: Colors.danger }]}>
                      {t('manage.stock', { count: p.stock })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  scroll: { flex: 1 },
  scrollContent: { gap: Spacing.sm },
  px: { paddingHorizontal: Spacing.lg },
  searchBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  searchArea: {
    position: 'relative',
    zIndex: 10,
  },
  searchOverlay: {
    position: 'absolute',
    top: 56,
    left: Spacing.lg,
    right: Spacing.lg,
    maxHeight: 380,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Shadow.md,
    overflow: 'hidden',
  },
  searchOverlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  searchOverlayTitle: {
    ...Typography.captionMd,
    color: Colors.text,
    fontWeight: '700',
  },
  searchOverlayCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  searchOverlayList: {
    maxHeight: 320,
  },
  searchEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  searchEmptyTitle: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  searchEmptyDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  searchGroupWrap: {
    paddingBottom: Spacing.xs,
  },
  searchGroupLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchItemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary + '16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchItemBody: {
    flex: 1,
    gap: 2,
  },
  searchItemTitle: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  searchItemSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  searchTextHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
  searchItemType: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  // Quick actions
  quickActionsRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  quickChipLabel: {
    ...Typography.captionMd,
    color: Colors.primary,
  },
  // Bookkeeping card
  bookkeepingCard: {
    backgroundColor: Colors.primary,
    gap: Spacing.md,
  },
  bookkeepingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookkeepingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bookkeepingTitle: {
    ...Typography.h4,
    color: '#fff',
  },
  taxPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  taxPillText: {
    ...Typography.label,
    color: '#fff',
    fontSize: 10,
  },
  bookkeepingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookkeepingStat: {
    minWidth: 88,
  },
  bookkeepingStatCenter: {
    alignItems: 'center',
  },
  bookkeepingStatRight: {
    alignItems: 'flex-end',
  },
  bookkeepingStatValue: {
    ...Typography.h4,
    color: '#fff',
  },
  bookkeepingStatLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  bookkeepingLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  bookkeepingLinkChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  bookkeepingLinkText: {
    ...Typography.captionMd,
    color: '#fff',
  },
  // Platforms
  platformSectionHeaderWrap: {
    marginHorizontal: -Spacing.lg,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.sm,
  },
  platformCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformCardDisabled: {
    opacity: 0.55,
  },
  platformTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  platformLogo: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
  },
  platformStateText: {
    ...Typography.captionMd,
    fontWeight: '700',
  },
  stateOn: {
    color: Colors.success,
  },
  stateOff: {
    color: Colors.textSecondary,
  },
  platformName: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  platformOrders: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  platformPendingOrders: {
    ...Typography.caption,
    color: Colors.warning,
  },
  platformOrdersStandalone: {
    marginTop: 2,
  },
  platformMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  platformMetaDot: {
    marginHorizontal: 6,
    alignSelf: 'center',
  },
  platformSummary: {
    marginTop: Spacing.md,
  },
  platformSummaryDivider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  platformSummaryDash: {
    width: 6,
    height: 1.5,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  platformSummaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformSummaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  platformSummaryMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformSummaryTotal: {
    ...Typography.h4,
    color: Colors.text,
  },
  platformSummaryDot: {
    ...Typography.bodyMd,
    color: Colors.textSecondary,
    marginHorizontal: 6,
  },
  platformSummaryPendingText: {
    ...Typography.bodyMd,
    color: Colors.warning,
  },
  platformActionRow: {
    marginTop: Spacing.xs,
  },
  platformActionBtn: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformActionText: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '700',
  },
  // Management sections list
  sectionRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  sectionRowIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRowContent: {
    flex: 1,
  },
  sectionRowLabel: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  sectionRowStat: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Table
  tableCard: {
    overflow: 'hidden',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  productThumb: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    gap: 3,
  },
  productName: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  productSku: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  productRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  productPrice: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  productStock: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  recentStateWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  recentStateText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recentErrorText: {
    color: Colors.danger,
  },
  recentRetryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  recentRetryText: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '700',
  },
});

