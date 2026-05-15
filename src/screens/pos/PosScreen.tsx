import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import { ManageStackParamList, ScanActionItem } from '../../navigation';
import { useRealtimeRefresh } from '../../realtime';
import {
  calculateShippingFee,
  ApiError,
  createGuestOrderDone,
  createGuestPending,
  createShippingOrder,
  printPosReceiptViaConfiguredPrinter,
  getCurrentUserProfile,
  getEInvoiceConfig,
  getAvailablePromotions,
  getBusinessType,
  getProvisionalInvoices,
  getShippingDistricts,
  listConnectedShippingProviders,
  listProducts,
  getShippingProvinces,
  getShippingWards,
  PosChargeForm,
  issueEInvoice,
  recordPromotionUsage,
  validateCheckoutPromotions,
} from '../../services';
import type { Product, ProductVariantOption } from '../../types';
import type { UserProfile } from '../../services/profile';
import { getProductPlaceholderConfig } from '../../utils/productPlaceholder';

type PosRoute = RouteProp<ManageStackParamList, 'PosScreen'>;

type CartItem = {
  key: string;
  productId: number;
  productName: string;
  categoryId?: number;
  qty: number;
  unitPrice: number;
  variantId?: number | null;
  selectedAttributes: Record<string, { label: string; value: string }>;
  sizeSelectedId: Array<number | string>;
  toppingSelectedId: Array<number | string>;
  sizeLabel?: string;
  toppingLabels: string[];
  iceSelectedValue?: string;
  sugarSelectedValue?: string;
  note?: string;
};

type ChargeState = {
  enabled: boolean;
  value: string;
  type: 'percent' | 'price';
  note: string;
};

type ProductCustomizationState = {
  product: Product;
  selectedAttributes: Record<string, { label: string; value: string }>;
  selectedSizeId?: number | string;
  selectedToppingIds: Array<number | string>;
  iceSelectedValue: string;
  sugarSelectedValue: string;
};

type PromotionSelection = {
  id: number | string;
  name: string;
  discountAmount?: number;
  giftItems?: Array<{ productId?: number | string; productName?: string; quantity?: number }>;
};

type ShippingOption = {
  label: string;
  value: string | number;
};

const PAY_METHODS = [
  { key: 'cash', label: 'Tiền mặt', icon: 'cash-outline' as const },
  { key: 'transfer', label: 'Chuyển khoản', icon: 'swap-horizontal-outline' as const },
  { key: 'card', label: 'Thẻ', icon: 'card-outline' as const },
  { key: 'credit', label: 'Công nợ', icon: 'wallet-outline' as const },
];

const ALL_CATEGORY = 'Tất cả';
const PAGE_SIZE = 200;
const ICE_SUGAR_LEVELS = ['0', '30', '50', '70', '100'];

const formatMoney = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}đ`;
const toLookupValue = (value: unknown) => String(value || '').trim().toLowerCase();
const formatMoneyRange = (values: number[]) => {
  const valid = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!valid.length) return formatMoney(0);
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  return min === max ? formatMoney(min) : `${formatMoney(min)} - ${formatMoney(max)}`;
};
const getProductDisplayPrices = (product: Product) => {
  if ((product.variants || []).length > 0) {
    const variantPrices = (product.variants || []).map((variant) => Number(variant.price || 0));
    const variantPromoPrices = (product.variants || [])
      .map((variant) => Number(variant.promoPrice || 0))
      .filter((price) => Number.isFinite(price) && price > 0);
    return {
      basePriceText: formatMoneyRange(variantPrices),
      salePriceText: variantPromoPrices.length > 0 ? formatMoneyRange(variantPromoPrices) : null,
      hasSale: variantPromoPrices.length > 0,
    };
  }

  const basePrice = Number(product.price || 0);
  const salePrice = Number(product.priceSale || 0);
  const hasSale = Boolean(product.activeSale) && Number.isFinite(salePrice) && salePrice > 0 && salePrice < basePrice;
  return {
    basePriceText: formatMoney(basePrice),
    salePriceText: hasSale ? formatMoney(salePrice) : null,
    hasSale,
  };
};

const parseOptionPrice = (option?: ProductVariantOption) => {
  if (!option) return 0;
  const promo = Number(option.promo_price || 0);
  if (Number.isFinite(promo) && promo > 0) return promo;
  const value = Number(option.value || 0);
  return Number.isFinite(value) ? value : 0;
};

const SIZE_ALPHA_ORDER = [
  'XXXS',
  '3XS',
  'XXS',
  '2XS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '2XL',
  'XXXL',
  '3XL',
  '4XL',
  '5XL',
];

const normalizeSizeLabel = (input: unknown) =>
  String(input || '')
    .trim()
    .toUpperCase()
    .replace(/^SIZE\s*/i, '')
    .replace(/^SZ\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

const getSizeSortMeta = (rawLabel: unknown) => {
  const label = normalizeSizeLabel(rawLabel);

  const numericMatch = label.match(/^\d+(?:[.,]\d+)?$/);
  if (numericMatch) {
    const num = Number(label.replace(',', '.'));
    if (Number.isFinite(num)) {
      return { group: 0, order: num, label };
    }
  }

  const alphaToken = label.split(/[\s/-]+/).find(Boolean) || label;
  const alphaIndex = SIZE_ALPHA_ORDER.indexOf(alphaToken);
  if (alphaIndex >= 0) {
    return { group: 1, order: alphaIndex, label };
  }

  return { group: 2, order: Number.POSITIVE_INFINITY, label };
};

const compareSizeNatural = (aLabel: unknown, bLabel: unknown) => {
  const aMeta = getSizeSortMeta(aLabel);
  const bMeta = getSizeSortMeta(bLabel);
  if (aMeta.group !== bMeta.group) return aMeta.group - bMeta.group;
  if (aMeta.order !== bMeta.order) return aMeta.order - bMeta.order;
  return aMeta.label.localeCompare(bMeta.label, 'vi', { numeric: true, sensitivity: 'base' });
};

const buildVariantAttributeOptions = (product: Product) => {
  const optionsByKey: Record<string, Array<{ label: string; value: string }>> = {};
  (product.variants || []).forEach((variant) => {
    const attrs = variant.attributes || {};
    Object.entries(attrs).forEach(([key, value]) => {
      if (!value) return;
      const label = String(value.label || value.name || value.value || '');
      const rawValue = String(value.value || value.label || value.name || '');
      if (!label || !rawValue) return;
      if (!optionsByKey[key]) optionsByKey[key] = [];
      if (!optionsByKey[key].some((item) => item.value === rawValue)) {
        optionsByKey[key].push({ label, value: rawValue });
      }
    });
  });
  return optionsByKey;
};

const resolveVariantOptionPrice = (
  product: Product,
  attrKey: string,
  attrValue: string,
  selectedAttributes: Record<string, { label: string; value: string }>,
) => {
  const variants = product.variants || [];
  const normalizedKey = attrKey.toLowerCase();
  const candidates = variants.filter((variant) => {
    const value = variant.attributes?.[attrKey]?.value;
    return String(value || '') === attrValue;
  });

  if (!candidates.length) return 0;

  const contextual = candidates.find((variant) =>
    Object.entries(selectedAttributes).every(([key, selected]) => {
      if (key.toLowerCase() === normalizedKey) return true;
      return String(variant.attributes?.[key]?.value || '') === String(selected.value || '');
    }),
  );
  const chosen = contextual || candidates[0];
  const promo = Number(chosen?.promoPrice || 0);
  if (Number.isFinite(promo) && promo > 0) return promo;
  const base = Number(chosen?.price || 0);
  return Number.isFinite(base) ? base : 0;
};

const resolveVariantOptionStock = (
  product: Product,
  attrKey: string,
  attrValue: string,
  selectedAttributes: Record<string, { label: string; value: string }>,
) => {
  const variants = product.variants || [];
  const normalizedKey = attrKey.toLowerCase();
  const candidates = variants.filter((variant) => {
    const value = variant.attributes?.[attrKey]?.value;
    return String(value || '') === attrValue;
  });
  if (!candidates.length) return 0;

  const scoped = candidates.filter((variant) =>
    Object.entries(selectedAttributes).every(([key, selected]) => {
      if (key.toLowerCase() === normalizedKey) return true;
      return String(variant.attributes?.[key]?.value || '') === String(selected.value || '');
    }),
  );
  const pool = scoped.length > 0 ? scoped : candidates;
  const quantity = pool.reduce((sum, variant) => sum + Math.max(0, Number(variant.quantity || 0)), 0);
  return Number.isFinite(quantity) ? quantity : 0;
};

const resolveMatchedVariant = (
  product: Product,
  selectedAttributes: Record<string, { label: string; value: string }>,
) => {
  const attrKeys = Object.keys(selectedAttributes);
  if (!attrKeys.length) return undefined;
  return (product.variants || []).find((variant) =>
    attrKeys.every((key) => variant.attributes?.[key]?.value === selectedAttributes[key]?.value),
  );
};

const resolveUnitPrice = (
  product: Product,
  selectedAttributes: Record<string, { label: string; value: string }>,
  selectedSizeId?: number | string,
  selectedToppingIds: Array<number | string> = [],
) => {
  const matchedVariant = resolveMatchedVariant(product, selectedAttributes);
  let price = 0;

  if (matchedVariant) {
    price = (matchedVariant.promoPrice || 0) > 0 ? matchedVariant.promoPrice || 0 : matchedVariant.price;
  } else if (product.activeSale && (product.priceSale || 0) > 0) {
    price = product.priceSale || 0;
  } else {
    price = product.price || 0;
  }

  if (selectedSizeId !== undefined) {
    const size = (product.sizeOptions || []).find((item) => String(item.id) === String(selectedSizeId));
    if (size) {
      const sizePrice = parseOptionPrice(size);
      if (sizePrice > 0) price = sizePrice;
    }
  }

  if (selectedToppingIds.length > 0) {
    const toppings = (product.toppings || []).filter((item) =>
      selectedToppingIds.some((id) => String(id) === String(item.id)),
    );
    toppings.forEach((item) => {
      price += parseOptionPrice(item);
    });
  }

  return Number.isFinite(price) ? price : 0;
};

const buildCartKey = (item: Omit<CartItem, 'key' | 'qty'>) =>
  [
    item.productId,
    item.variantId || '',
    JSON.stringify(item.selectedAttributes),
    item.sizeSelectedId.join(','),
    item.toppingSelectedId.join(','),
    item.iceSelectedValue || '100',
    item.sugarSelectedValue || '100',
    item.note || '',
  ].join('|');

const toChargeForm = (state: ChargeState): PosChargeForm => ({
  orders_id: [],
  user_id: '',
  note: state.note,
  value: state.value || '0',
  type: state.type,
  saved: state.enabled && Number(state.value || 0) > 0,
  isManual: state.enabled && Number(state.value || 0) > 0,
});

const calcChargeAmount = (subtotal: number, charge: ChargeState) => {
  if (!charge.enabled) return 0;
  const value = Number(charge.value || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (charge.type === 'percent') return Math.round((subtotal * value) / 100);
  return value;
};

const buildInitialCustomization = (product: Product): ProductCustomizationState => {
  const variantAttrOptions = buildVariantAttributeOptions(product);
  const selectedAttributes: Record<string, { label: string; value: string }> = {};
  Object.entries(variantAttrOptions).forEach(([key, values]) => {
    if (values.length === 1) selectedAttributes[key] = values[0];
  });
  const hasVariantSize = Object.keys(variantAttrOptions).some((key) => key.toLowerCase() === 'size');

  const sortedSizes = [...(product.sizeOptions || [])].sort((a, b) => {
    const priceDiff = parseOptionPrice(a) - parseOptionPrice(b);
    if (priceDiff !== 0) return priceDiff;
    return compareSizeNatural(a.name, b.name);
  });
  const firstSize = sortedSizes[0];

  return {
    product,
    selectedAttributes,
    selectedSizeId: hasVariantSize ? undefined : firstSize?.id,
    selectedToppingIds: [],
    iceSelectedValue: '100',
    sugarSelectedValue: '100',
  };
};

const mapShippingOption = (item: Record<string, unknown>): ShippingOption => {
  const value = (item.value ?? item.id ?? item.DistrictID ?? item.WardCode ?? item.ProvinceID ?? '') as string | number;
  const label = String(item.label ?? item.name ?? value);
  return { label, value };
};

const parsePromotionIdsInput = (input: string) =>
  input
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((value) => (Number.isFinite(Number(value)) ? Number(value) : value));

const parsePercentOptionValues = (options?: ProductVariantOption[]) => {
  const values = (options || [])
    .map((item) => String(item.value || item.label || item.name || '').trim())
    .filter(Boolean)
    .map((text) => text.replace('%', '').trim())
    .filter((text) => /^\d+$/.test(text));
  return Array.from(new Set(values)).sort((a, b) => Number(a) - Number(b));
};

const isMeaningfulOptionText = (value: unknown) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return false;
  const compact = normalized.replace(/[\s_]+/g, '-');
  if (['null', 'undefined', 'none', 'n/a', '-', '--'].includes(compact)) return false;
  if (
    [
      'no-color',
      'no-size',
      'no-material',
      'no-colour',
      'no-variant',
      'no-option',
    ].includes(compact)
  ) {
    return false;
  }
  return true;
};

export function PosScreen() {
  const { colors } = useThemeMode();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const isFocused = useIsFocused();
  const route = useRoute<PosRoute>();

  const [products, setProducts] = useState<Product[]>([]);
  const [businessType, setBusinessType] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORY);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customizeState, setCustomizeState] = useState<ProductCustomizationState | null>(null);
  const [itemNote, setItemNote] = useState('');
  const [customizeError, setCustomizeError] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [shippingProvider, setShippingProvider] = useState<string | null>(null);
  const [connectedShippingProviders, setConnectedShippingProviders] = useState<string[]>([]);
  const [shippingFee, setShippingFee] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingProvince, setShippingProvince] = useState<ShippingOption | null>(null);
  const [shippingDistrict, setShippingDistrict] = useState<ShippingOption | null>(null);
  const [shippingWard, setShippingWard] = useState<ShippingOption | null>(null);
  const [shippingProvinces, setShippingProvinces] = useState<ShippingOption[]>([]);
  const [shippingDistricts, setShippingDistricts] = useState<ShippingOption[]>([]);
  const [shippingWards, setShippingWards] = useState<ShippingOption[]>([]);
  const [shippingModalVisible, setShippingModalVisible] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingOrderCreated, setShippingOrderCreated] = useState<string>('');

  const [discount, setDiscount] = useState<ChargeState>({ enabled: false, value: '', type: 'price', note: '' });
  const [taxFee, setTaxFee] = useState<ChargeState>({ enabled: false, value: '', type: 'percent', note: '' });
  const [feeOther, setFeeOther] = useState<ChargeState>({ enabled: false, value: '', type: 'price', note: '' });
  const [selectedPromotions, setSelectedPromotions] = useState<PromotionSelection[]>([]);
  const [availablePromotions, setAvailablePromotions] = useState<PromotionSelection[]>([]);
  const [promotionIdsInput, setPromotionIdsInput] = useState('');

  const [eInvoiceEnabled, setEInvoiceEnabled] = useState(false);
  const [issueEInvoiceChecked, setIssueEInvoiceChecked] = useState(false);
  const [eInvoiceVatRate, setEInvoiceVatRate] = useState(10);
  const [createDraftWhenNotIssue, setCreateDraftWhenNotIssue] = useState(true);

  const [provisionalModalVisible, setProvisionalModalVisible] = useState(false);
  const [provisionalInvoices, setProvisionalInvoices] = useState<Array<{ pin?: string; orders: Array<Record<string, unknown>> }>>([]);
  const [provisionalOrderIds, setProvisionalOrderIds] = useState<Array<number | string>>([]);
  const [deletedProvisionalItems, setDeletedProvisionalItems] = useState<Array<number | string>>([]);
  const [currentPin, setCurrentPin] = useState('');
  const [currentPinPrint, setCurrentPinPrint] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [printStatus, setPrintStatus] = useState('');
  const [printStatusError, setPrintStatusError] = useState(false);
  const [realtimeReloadTick, setRealtimeReloadTick] = useState(0);
  const requestSeq = useRef(0);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isCartSheetVisible, setIsCartSheetVisible] = useState(false);
  const cartSheetTranslateY = useRef(new Animated.Value(32)).current;
  const cartBackdropOpacity = useRef(new Animated.Value(0)).current;
  const customizeSheetTranslateY = useRef(new Animated.Value(32)).current;
  const customizeBackdropOpacity = useRef(new Animated.Value(0)).current;

  const loadPosBootstrap = useCallback(async (showLoader = true) => {
    const seq = requestSeq.current + 1;
    requestSeq.current = seq;
    if (showLoader) {
      setLoadingProducts(true);
    }
    setLoadError('');

    try {
      const profile: Partial<UserProfile> = await getCurrentUserProfile().catch(() => ({}));
      const resolvedUserId = String(profile.id || '').trim();
      const [productRes, shippingProviders, businessTypeRes, eInvoiceConfig] = await Promise.all([
        listProducts({ pageSize: PAGE_SIZE, currentPage: 1, search: '' }),
        listConnectedShippingProviders().catch(() => []),
        getBusinessType().catch(() => ''),
        resolvedUserId ? getEInvoiceConfig(resolvedUserId).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      ]);
      if (requestSeq.current !== seq) return;
      setCurrentUserId(resolvedUserId);
      setProducts(productRes.items.filter((item) => item.status === 'active'));
      setConnectedShippingProviders(shippingProviders.map((item) => String(item.provider)));
      setBusinessType(String(businessTypeRes || ''));
      if (eInvoiceConfig?.data?.is_active) {
        setEInvoiceEnabled(true);
        setIssueEInvoiceChecked(Boolean(eInvoiceConfig.data.auto_issue));
        setEInvoiceVatRate(Number(eInvoiceConfig.data.vat_rate || 10));
        setCreateDraftWhenNotIssue(Boolean(eInvoiceConfig.data.create_draft_when_not_issue ?? true));
      }
    } catch (error) {
      if (requestSeq.current !== seq) return;
      const message = error instanceof ApiError || error instanceof Error ? error.message : 'Không tải được dữ liệu POS';
      setLoadError(message);
    } finally {
      if (requestSeq.current === seq) setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void loadPosBootstrap(true);
  }, [loadPosBootstrap]);

  useRealtimeRefresh(
    ['products', 'inventory', 'orders', 'promotions', 'customers'],
    () => {
      void loadPosBootstrap(false);
      setRealtimeReloadTick((current) => current + 1);
    },
    { debounceMs: 500, enabled: isFocused },
  );

  useEffect(() => {
    const scanItems = route.params?.scanItems || [];
    if (!products.length || scanItems.length === 0) return;

    const items = scanItems
      .map((scanItem: ScanActionItem, idx: number) => {
        const code = toLookupValue(scanItem.code);
        const sku = toLookupValue(scanItem.sku);
        const name = toLookupValue(scanItem.name);
        const product = products.find(
          (item) =>
            toLookupValue(item.sku) === sku ||
            toLookupValue(item.sku) === code ||
            toLookupValue(item.barcode) === code ||
            code.includes(toLookupValue(item.sku)) ||
            name.includes(toLookupValue(item.sku)),
        );
        if (!product) {
          return {
            key: `unknown-${idx}`,
            productId: -(idx + 1),
            productName: scanItem.name || `Mã ${scanItem.code}`,
            qty: scanItem.qty || 1,
            unitPrice: 0,
            categoryId: undefined,
            variantId: null,
            selectedAttributes: {},
            sizeSelectedId: [],
            toppingSelectedId: [],
            toppingLabels: [],
          } as CartItem;
        }

        const customization = buildInitialCustomization(product);
        const unitPrice = resolveUnitPrice(
          product,
          customization.selectedAttributes,
          customization.selectedSizeId,
          customization.selectedToppingIds,
        );
        const base: Omit<CartItem, 'key' | 'qty'> = {
          productId: product.id,
          productName: product.name,
          categoryId: product.categoryId,
          unitPrice,
          variantId: resolveMatchedVariant(product, customization.selectedAttributes)?.id || null,
          selectedAttributes: customization.selectedAttributes,
          sizeSelectedId: customization.selectedSizeId !== undefined ? [customization.selectedSizeId] : [],
          toppingSelectedId: customization.selectedToppingIds,
          toppingLabels: [],
          iceSelectedValue: customization.iceSelectedValue,
          sugarSelectedValue: customization.sugarSelectedValue,
        };
        return { ...base, key: buildCartKey(base), qty: scanItem.qty || 1 };
      });

    setCart((prev) => {
      const next = [...prev];
      items.forEach((item) => {
        const existing = next.find((cartItem) => cartItem.key === item.key);
        if (existing) existing.qty += item.qty;
        else next.push(item);
      });
      return next;
    });
  }, [products, route.params?.scanItems]);

  useEffect(() => {
    if (cart.length === 0) {
      setIsCartSheetVisible(false);
    }
  }, [cart.length]);

  useEffect(() => {
    if (!isCartSheetVisible) return;
    cartSheetTranslateY.setValue(32);
    cartBackdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(cartSheetTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cartBackdropOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isCartSheetVisible, cartBackdropOpacity, cartSheetTranslateY]);

  useEffect(() => {
    if (!customizeState) return;
    customizeSheetTranslateY.setValue(32);
    customizeBackdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(customizeSheetTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(customizeBackdropOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [Boolean(customizeState), customizeBackdropOpacity, customizeSheetTranslateY]);

  useEffect(() => {
    if (!shippingProvider) {
      setShippingProvinces([]);
      setShippingDistricts([]);
      setShippingWards([]);
      setShippingProvince(null);
      setShippingDistrict(null);
      setShippingWard(null);
      return;
    }

    getShippingProvinces(shippingProvider)
      .then((rows) => setShippingProvinces(rows.map((item) => mapShippingOption(item as Record<string, unknown>))))
      .catch(() => setShippingProvinces([]));
  }, [shippingProvider]);

  useEffect(() => {
    if (!shippingProvider || !shippingProvince?.value) {
      setShippingDistricts([]);
      setShippingDistrict(null);
      setShippingWards([]);
      setShippingWard(null);
      return;
    }

    getShippingDistricts(shippingProvider, shippingProvince.value)
      .then((rows) => setShippingDistricts(rows.map((item) => mapShippingOption(item as Record<string, unknown>))))
      .catch(() => setShippingDistricts([]));
  }, [shippingProvider, shippingProvince]);

  useEffect(() => {
    if (!shippingProvider || !shippingDistrict?.value) {
      setShippingWards([]);
      setShippingWard(null);
      return;
    }

    getShippingWards(shippingProvider, shippingDistrict.value)
      .then((rows) => setShippingWards(rows.map((item) => mapShippingOption(item as Record<string, unknown>))))
      .catch(() => setShippingWards([]));
  }, [shippingProvider, shippingDistrict]);

  useEffect(() => {
    if (cart.length === 0) {
      setAvailablePromotions([]);
      setSelectedPromotions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const cartData = cart.map((item) => ({
          id: item.productId,
          quantity: item.qty,
          price: item.unitPrice,
          category_id: item.categoryId ?? null,
          isGift: item.unitPrice === 0,
        }));
        const result = await getAvailablePromotions({
          cartData,
          customerPhone: customerPhone.trim() || null,
        });
        const mapped = (result.data || []).map((item) => ({
          id: item.id || '',
          name: String(item.name || item.code || item.id || 'Promotion'),
          discountAmount: Number(item.benefit?.actualDiscount || 0),
          giftItems: (item.benefit?.gifts || []).map((gift) => ({
            productId: gift.productId,
            productName: gift.productName,
            quantity: Number(gift.quantity || 1),
          })),
        }));
        setAvailablePromotions(mapped.filter((item) => item.id !== ''));
      } catch {
        setAvailablePromotions([]);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [cart, customerPhone, realtimeReloadTick]);

  const categories = useMemo(() => {
    const values = Array.from(new Set(products.map((item) => item.category).filter(Boolean)));
    return [ALL_CATEGORY, ...values];
  }, [products]);
  const placeholderConfig = useMemo(() => getProductPlaceholderConfig(businessType), [businessType]);
  const isFnBBusiness = businessType === 'cafe' || businessType === 'restaurant';
  const customizeVariantOptions = useMemo(
    () => (customizeState ? buildVariantAttributeOptions(customizeState.product) : {}),
    [customizeState],
  );
  const hasVariantSize = useMemo(
    () => Object.keys(customizeVariantOptions).some((key) => key.toLowerCase() === 'size'),
    [customizeVariantOptions],
  );
  const customizeVariantEntries = useMemo(
    () =>
      Object.entries(customizeVariantOptions)
        .map(([key, options]) => [
          key,
          (options || []).filter(
            (option) => isMeaningfulOptionText(option?.label) && isMeaningfulOptionText(option?.value),
          ),
        ] as const)
        .map(([key, options]) => {
          const normalizedKey = String(key || '').trim().toLowerCase();
          // Với color/material: chỉ hiển thị khi có option thực sự phân biệt.
          if (normalizedKey === 'color' || normalizedKey === 'material') {
            const distinctValues = Array.from(new Set(options.map((option) => String(option.value).trim().toLowerCase())));
            if (distinctValues.length === 0) return [key, []] as const;
          }
          return [key, options] as const;
        })
        .filter(([, options]) => Array.isArray(options) && options.length > 0),
    [customizeVariantOptions],
  );

  useEffect(() => {
    if (!customizeState) return;
    const debugKeys = ['size', 'color', 'material'];
    const raw = buildVariantAttributeOptions(customizeState.product);
    const payload = debugKeys.map((key) => {
      const rawOptions = raw[key] || [];
      const filteredOptions = customizeVariantEntries.find(([entryKey]) => entryKey === key)?.[1] || [];
      return {
        key,
        rawCount: rawOptions.length,
        rawOptions,
        filteredCount: filteredOptions.length,
        filteredOptions,
      };
    });
    // Temporary debug log to validate variant option payload from API.
  }, [customizeState, customizeVariantEntries]);
  const validRegularSizes = useMemo(
    () =>
      (customizeState?.product.sizeOptions || []).filter(
        (size) => String(size?.name || '').trim().length > 0 && String(size?.id ?? '').trim().length > 0,
      ),
    [customizeState],
  );
  const iceLevels = useMemo(() => {
    if (!customizeState) return ICE_SUGAR_LEVELS;
    const values = parsePercentOptionValues(customizeState.product.iceOptions);
    return values.length > 0 ? values : ICE_SUGAR_LEVELS;
  }, [customizeState]);
  const sugarLevels = useMemo(() => {
    if (!customizeState) return ICE_SUGAR_LEVELS;
    const values = parsePercentOptionValues(customizeState.product.sugarOptions);
    return values.length > 0 ? values : ICE_SUGAR_LEVELS;
  }, [customizeState]);
  const showIceSection = useMemo(() => {
    if (!customizeState) return false;
    if (!isFnBBusiness) return false;
    const configured = parsePercentOptionValues(customizeState.product.iceOptions);
    return configured.length > 0;
  }, [customizeState, isFnBBusiness]);
  const showSugarSection = useMemo(() => {
    if (!customizeState) return false;
    if (!isFnBBusiness) return false;
    const configured = parsePercentOptionValues(customizeState.product.sugarOptions);
    return configured.length > 0;
  }, [customizeState, isFnBBusiness]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((item) => {
      const matchCategory = category === ALL_CATEGORY || item.category === category;
      const matchQuery =
        !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || toLookupValue(item.barcode).includes(q);
      return matchCategory && matchQuery;
    });
  }, [products, query, category]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0), [cart]);
  const discountAmt = calcChargeAmount(subtotal, discount);
  const taxAmt = calcChargeAmount(subtotal, taxFee);
  const feeOtherAmt = calcChargeAmount(subtotal, feeOther);
  const promoDiscountAmt = selectedPromotions.reduce((sum, item) => sum + Number(item.discountAmount || 0), 0);
  const shippingAmt = Number(shippingFee || 0) || 0;
  const total = Math.max(0, subtotal - discountAmt - promoDiscountAmt + taxAmt + feeOtherAmt + shippingAmt);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const openCustomize = (product: Product) => {
    setItemNote('');
    setCustomizeError('');
    setCustomizeState(buildInitialCustomization(product));
  };

  const closeCustomize = () => {
    setCustomizeState(null);
    setItemNote('');
    setCustomizeError('');
  };

  const applyCustomizedProduct = () => {
    if (!customizeState) return;
    const { product, selectedAttributes, selectedSizeId, selectedToppingIds, iceSelectedValue, sugarSelectedValue } = customizeState;
    const requiredVariantKeys = Object.keys(buildVariantAttributeOptions(product));
    const hasMissingVariantSelection = requiredVariantKeys.some((key) => !selectedAttributes[key]?.value);
    if (hasMissingVariantSelection) {
      setCustomizeError('Vui lòng chọn đủ thuộc tính biến thể trước khi thêm');
      return;
    }

    const matchedVariant = resolveMatchedVariant(product, selectedAttributes);
    const unitPrice = resolveUnitPrice(product, selectedAttributes, selectedSizeId, selectedToppingIds);
    const selectedSize = (product.sizeOptions || []).find((item) => String(item.id) === String(selectedSizeId));
    const selectedToppings = (product.toppings || []).filter((item) =>
      selectedToppingIds.some((id) => String(id) === String(item.id)),
    );

    const base: Omit<CartItem, 'key' | 'qty'> = {
      productId: product.id,
      productName: product.name,
      categoryId: product.categoryId,
      unitPrice,
      variantId: matchedVariant?.id || null,
      selectedAttributes,
      sizeSelectedId: selectedSizeId !== undefined ? [selectedSizeId] : [],
      toppingSelectedId: selectedToppingIds,
      sizeLabel: selectedSize?.name,
      toppingLabels: selectedToppings.map((item) => String(item.name || '')),
      iceSelectedValue,
      sugarSelectedValue,
      note: itemNote.trim() || undefined,
    };

    const key = buildCartKey(base);
    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) => (item.key === key ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { ...base, qty: 1, key }];
    });
    closeCustomize();
  };

  const adjustQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.key === key ? { ...item, qty: Math.max(0, item.qty + delta) } : item))
        .filter((item) => item.qty > 0),
    );
  };

  const calculateFee = async () => {
    if (!shippingProvider || !shippingDistrict?.value) return;
    setShippingLoading(true);
    try {
      const totalWeight = cart.reduce((sum, item) => sum + item.qty * 200, 0) || 500;
      const feeResult = await calculateShippingFee({
        provider: shippingProvider,
        to_district_id: shippingDistrict.value,
        to_ward_code: shippingWard?.value || null,
        weight: totalWeight,
        cod_value: payMethod === 'credit' ? 0 : total,
      });
      if (feeResult.success && feeResult.data?.fee !== undefined) {
        setShippingFee(String(feeResult.data.fee));
      } else if (feeResult.message) {
        setSubmitError(feeResult.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lỗi tính phí vận chuyển';
      setSubmitError(message);
    } finally {
      setShippingLoading(false);
    }
  };

  const loadProvisionalInvoices = async () => {
    try {
      const rows = await getProvisionalInvoices();
      const mapped = rows.map((row) => ({
        pin: row.pin,
        orders: (row.orders || row.data || []) as Array<Record<string, unknown>>,
      }));
      setProvisionalInvoices(mapped);
      setProvisionalModalVisible(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không tải được hóa đơn tạm';
      setSubmitError(message);
    }
  };

  const reopenProvisionalInvoice = (index: number) => {
    const selected = provisionalInvoices[index];
    if (!selected?.orders?.length) return;

    const allProducts = products;
    const hydrated = selected.orders.map((row, idx) => {
      const productId = Number(row.product_id || (row.product as { id?: number })?.id || 0);
      const productDef = allProducts.find((item) => item.id === productId);
      const qty = Math.max(1, Number(row.count || 1));
      const ice = String(row.ice || '100');
      const sugar = String(row.sugar || '100');
      const note = String(row.note || '').trim() || undefined;

      if (!productDef) {
        const fallback: Omit<CartItem, 'key'> = {
          productId: productId || -(idx + 1),
          productName: String((row.product as { name?: string })?.name || `SP-${productId || idx + 1}`),
          categoryId: undefined,
          qty,
          unitPrice: Number(row.price || 0),
          variantId: null,
          selectedAttributes: {},
          sizeSelectedId: [],
          toppingSelectedId: [],
          toppingLabels: [],
          iceSelectedValue: ice,
          sugarSelectedValue: sugar,
          note,
        };
        return { ...fallback, key: buildCartKey(fallback) };
      }

      const sizeName = String(row.size || '').split(',')[0].trim();
      const toppingRaw = String(row.topping || '');
      const toppingNames = toppingRaw
        .split('|')
        .map((entry) => entry.split(',')[0]?.trim())
        .filter(Boolean);
      const selectedSize = (productDef.sizeOptions || []).find((item) => String(item.name || '').trim() === sizeName);
      const selectedToppings = (productDef.toppings || []).filter((item) =>
        toppingNames.some((name) => String(item.name || '').trim() === name),
      );
      const sizeSelectedId = selectedSize?.id !== undefined ? [selectedSize.id] : [];
      const toppingSelectedId = selectedToppings.map((item) => item.id || item.name || '');
      const unitPrice = resolveUnitPrice(productDef, {}, selectedSize?.id, toppingSelectedId);
      const base: Omit<CartItem, 'key'> = {
        productId: productDef.id,
        productName: productDef.name,
        categoryId: productDef.categoryId,
        qty,
        unitPrice: Number(row.price || unitPrice || 0),
        variantId: null,
        selectedAttributes: {},
        sizeSelectedId,
        toppingSelectedId,
        sizeLabel: selectedSize?.name,
        toppingLabels: selectedToppings.map((item) => String(item.name || '')),
        iceSelectedValue: ice,
        sugarSelectedValue: sugar,
        note,
      };
      return { ...base, key: buildCartKey(base) };
    });

    setCart(hydrated);
    setProvisionalOrderIds(selected.orders.map((order) => order.id as number | string).filter(Boolean));
    setDeletedProvisionalItems([]);
    setCurrentPin(String(selected.orders[0]?.pin || selected.pin || ''));
    setCurrentPinPrint(String(selected.orders[0]?.pin_print || ''));
    setProvisionalModalVisible(false);
  };

  const submitOrder = async (mode: 'paid' | 'pending') => {
    if (submitting || cart.length === 0) return;
    setSubmitting(true);
    setSubmitError('');
    setPrintStatus('');
    setPrintStatusError(false);

    try {
      const profile: Partial<UserProfile> = await getCurrentUserProfile().catch(() => ({}));
      const storeDomain = String(profile.domain || '').trim();
      const cartData = cart.map((item) => ({
        id: item.productId,
        quantity: item.qty,
        price: item.unitPrice,
        category_id: item.categoryId ?? null,
      }));
      const promotionIds = Array.from(
        new Set(
          selectedPromotions
            .map((item) => item.id)
            .concat(parsePromotionIdsInput(promotionIdsInput))
            .map((id) => {
              const num = Number(id);
              return Number.isFinite(num) ? num : String(id);
            })
            .filter((id) => String(id).length > 0),
        ),
      );
      if (promotionIds.length > 0) {
        const validateResult = await validateCheckoutPromotions({
          promotionIds,
          cartData,
          customerPhone: customerPhone.trim() || null,
        });
        if (validateResult.valid === false) {
          const text = (validateResult.invalidPromotions || [])
            .map((item) => `${item.name || item.id}: ${item.message || 'Không hợp lệ'}`)
            .join('\n');
          throw new Error(text || 'Khuyến mại không còn hợp lệ');
        }
      }

      const giftItems = selectedPromotions.flatMap((promo) =>
        (promo.giftItems || []).map((gift) => ({
          id: Number(gift.productId || products.find((p) => p.name === gift.productName)?.id || 0),
          product_id: Number(gift.productId || products.find((p) => p.name === gift.productName)?.id || 0),
          name: gift.productName || `Quà tặng ${gift.productId || ''}`,
          product: {
            name: gift.productName || `Quà tặng ${gift.productId || ''}`,
            price: 0,
            category_id: undefined,
          },
          price: 0,
          count: Math.max(1, Number(gift.quantity || 1)),
          id_variant: null,
          size: '',
          topping: '',
          ice: '100',
          sugar: '100',
          sizeSelectedId: [],
          toppingSelectedId: [],
          selectedAttributes: {},
          note: `PROMO_GIFT:${promo.name}`,
        })),
      ).filter((gift) => gift.product_id > 0);

      const payloadBase = {
        deleted_orders: provisionalOrderIds,
        pin: currentPin || '',
        pin_print: currentPinPrint || '',
        data: cart.map((item) => ({
          id: item.productId,
          product_id: item.productId,
          name: item.productName,
          product: {
            name: item.productName,
            price: item.unitPrice,
            category_id: item.categoryId,
          },
          price: item.unitPrice,
          count: item.qty,
          id_variant: item.variantId || null,
          size: item.sizeLabel || '',
          topping: item.toppingLabels.join('|'),
          ice: item.iceSelectedValue || '100',
          sugar: item.sugarSelectedValue || '100',
          sizeSelectedId: item.sizeSelectedId,
          toppingSelectedId: item.toppingSelectedId,
          selectedAttributes: item.selectedAttributes,
          note: item.note,
        })).concat(giftItems),
        store: storeDomain,
        phone: customerPhone.trim(),
        name: customerName.trim(),
        hash: String(profile.companyMenuHash || ''),
        table_id: '',
        payment_method: payMethod,
        shipping_provider: shippingProvider,
        shipping_fee: Number(shippingFee || 0) || 0,
        staff_id: null,
        discount: toChargeForm(discount),
        tax_fee: toChargeForm(taxFee),
        fee_other: toChargeForm(feeOther),
      };

      let checkoutResult: { bill_id?: string | number } | null = null;
      if (mode === 'paid') {
        checkoutResult = await createGuestOrderDone({
          ...payloadBase,
          paid: 'PAYMENTED',
        });
      } else {
        checkoutResult = await createGuestPending(payloadBase);
      }

      if (provisionalOrderIds.length > 0) {
        setDeletedProvisionalItems(provisionalOrderIds);
      }

      const billId = checkoutResult?.bill_id;
      const billIdText = String(billId || '').trim();

      if (billId && shippingProvider && shippingAddress.trim() && shippingDistrict?.value) {
        const totalWeight = cart.reduce((sum, item) => sum + item.qty * 200, 0) || 500;
        const codAmount = payMethod === 'credit' ? 0 : total;
        const shipResult = await createShippingOrder({
          provider: shippingProvider,
          bill_id: billId,
          receiver_name: customerName.trim() || 'Khách lẻ',
          receiver_phone: customerPhone.trim(),
          receiver_address: `${shippingAddress.trim()}, ${shippingWard?.label || ''}, ${shippingDistrict?.label || ''}, ${shippingProvince?.label || ''}`,
          receiver_province_id: shippingProvince?.value || null,
          receiver_district_id: shippingDistrict?.value || null,
          receiver_ward_code: shippingWard?.value || null,
          weight: totalWeight,
          cod_amount: codAmount,
          note: 'Giao hàng từ VMASS',
          items: cart.map((item) => ({ name: item.productName, quantity: item.qty, weight: 200 })),
        });
        if (shipResult.success && shipResult.data?.tracking_code) {
          setShippingOrderCreated(shipResult.data.tracking_code);
        }
      }

      if (billId && currentUserId && eInvoiceEnabled && (issueEInvoiceChecked || createDraftWhenNotIssue)) {
        const paymentMethodMap: Record<string, string> = {
          cash: 'TM',
          transfer: 'CK',
          card: 'TH',
          credit: 'CN',
        };
        await issueEInvoice({
          user_id: currentUserId,
          bill_id: billId,
          customer_name: customerName.trim() || 'Khách lẻ',
          customer_phone: customerPhone.trim(),
          customer_address: shippingAddress.trim(),
          customer_email: '',
          customer_tax_id: '',
          subtotal,
          discount_amount: discountAmt + promoDiscountAmt,
          vat_rate: eInvoiceVatRate,
          payment_method: paymentMethodMap[payMethod] || 'TM/CK',
          items: cart.map((item) => ({
            name: item.productName,
            quantity: item.qty,
            unit_price: item.unitPrice,
            amount: item.unitPrice * item.qty,
          })),
          note: `Đơn hàng ${billId}`,
          is_draft: !issueEInvoiceChecked,
        });
      }

      if (billId && promotionIds.length > 0) {
        for (const promotionId of promotionIds) {
          const picked = selectedPromotions.find((item) => String(item.id) === String(promotionId));
          await recordPromotionUsage({
            promotionId,
            customerPhone: customerPhone.trim() || null,
            billId,
            discountAmount: Number(picked?.discountAmount || 0),
            giftItems: picked?.giftItems || null,
            orderTotal: total,
          }).catch(() => null);
        }
      }

      if (mode === 'paid' && billIdText) {
        const paymentMethodLabel =
          PAY_METHODS.find((item) => item.key === payMethod)?.label || payMethod;

        const printResult = await printPosReceiptViaConfiguredPrinter({
          billId: billIdText,
          storeName: String(profile.companyName || profile.domain || 'VMASS').trim() || 'VMASS',
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          paymentMethodLabel,
          subtotal,
          discountAmount: discountAmt + promoDiscountAmt,
          taxAmount: taxAmt,
          feeOtherAmount: feeOtherAmt,
          shippingAmount: shippingAmt,
          totalAmount: total,
          items: cart.map((item) => ({
            name: item.productName,
            qty: item.qty,
            unitPrice: item.unitPrice,
            lineTotal: item.unitPrice * item.qty,
          })),
          printedAt: new Date(),
        });

        if (printResult.message) {
          setPrintStatus(printResult.message);
          setPrintStatusError(!printResult.success);
        }
      }

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setShippingFee('');
      setShippingAddress('');
      setShippingProvince(null);
      setShippingDistrict(null);
      setShippingWard(null);
      setSelectedPromotions([]);
      setPromotionIdsInput('');
      setProvisionalOrderIds([]);
      setDeletedProvisionalItems([]);
      setCurrentPin('');
      setCurrentPinPrint('');
      setSubmitError('');
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : 'Không tạo được đơn POS';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Bán POS nhanh</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="qr-code-outline" size={18} color={Colors.primary} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Quét mã hoặc nhập tên sản phẩm..."
              placeholderTextColor={Colors.textSecondary}
            />
            <Ionicons name="camera-outline" size={18} color={Colors.primary} />
          </View>
        </View>

        <FlatList
          data={categories}
          horizontal
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          style={styles.categoryList}
          contentContainerStyle={styles.categoryWrap}
          renderItem={({ item, index }) => {
            const active = category === item;
            const isLast = index === categories.length - 1;
            return (
              <TouchableOpacity
                style={[styles.categoryChip, active && styles.categoryChipActive, !isLast && styles.categoryChipSpacing]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />

        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(i) => String(i.id)}
          style={styles.productList}
          contentContainerStyle={styles.productListContent}
          columnWrapperStyle={styles.columnWrap}
          renderItem={({ item }) => (
            <View style={styles.productCol}>
              <TouchableOpacity style={styles.productCard} onPress={() => openCustomize(item)}>
                <View style={styles.productThumb}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
                  ) : (
                    <View
                      style={[
                        styles.productPlaceholder,
                        { backgroundColor: placeholderConfig.backgroundColor },
                      ]}
                    >
                      <Ionicons
                        name={placeholderConfig.icon}
                        size={30}
                        color={placeholderConfig.iconColor}
                      />
                    </View>
                  )}
                </View>
                <View style={styles.productBody}>
                  <View style={styles.productMeta}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  </View>
                  <View style={styles.productFooter}>
                    {(() => {
                      const prices = getProductDisplayPrices(item);
                      return (
                        <View style={styles.priceBadge}>
                        {prices.hasSale && prices.salePriceText ? (
                          <View style={styles.priceStack}>
                            <Text style={styles.productPriceSale}>{prices.salePriceText}</Text>
                            <Text style={styles.productPriceBase}>{prices.basePriceText}</Text>
                          </View>
                        ) : (
                          <Text style={styles.productPrice}>{prices.basePriceText}</Text>
                        )}
                      </View>
                    );
                    })()}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyProducts}>
              {loadingProducts ? (
                <>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.emptyText}>Đang tải sản phẩm...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cube-outline" size={24} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>{loadError || 'Không tìm thấy sản phẩm phù hợp'}</Text>
                </>
              )}
            </View>
          }
        />

        {cart.length > 0 ? (
          <TouchableOpacity style={styles.orderPreviewBtn} onPress={() => setIsCartSheetVisible(true)}>
            <View style={styles.orderPreviewMeta}>
              <Ionicons name="receipt-outline" size={18} color="#fff" />
              <Text style={styles.orderPreviewText}>{`${totalItems} món • ${formatMoney(total)}`}</Text>
            </View>
            <Text style={styles.orderPreviewAction}>Xem giỏ hàng</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal visible={isCartSheetVisible} animationType="none" transparent onRequestClose={() => setIsCartSheetVisible(false)}>
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.modalOverlay, { opacity: cartBackdropOpacity }]} />
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsCartSheetVisible(false)} />
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: cartSheetTranslateY }] }]}>
            <Pressable onPress={(event) => event.stopPropagation()} style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, Spacing.sm), maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Giỏ hàng ({totalItems})</Text>
              <TouchableOpacity onPress={() => setIsCartSheetVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm }}>
          <View style={styles.panelTop}>
            <Text style={styles.panelTitle}>Giỏ hàng ({totalItems})</Text>
            <View style={styles.cartBadge}>
              <Ionicons name="cart-outline" size={16} color={Colors.primary} />
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={24} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>Chạm sản phẩm để thêm vào giỏ</Text>
            </View>
          ) : (
            <ScrollView style={styles.cartList} contentContainerStyle={styles.cartListContent}>
              {cart.map((item) => (
                <View key={item.key} style={styles.cartRow}>
                  <View style={styles.cartMeta}>
                    <Text style={styles.cartName} numberOfLines={1}>{item.productName}</Text>
                    <Text style={styles.cartUnitPrice}>{`Đơn giá ${formatMoney(item.unitPrice)}`}</Text>
                    <View style={styles.badgesRow}>
                      {item.sizeLabel ? <Text style={styles.badge}>Size: {item.sizeLabel}</Text> : null}
                      {item.toppingLabels.map((topping) => <Text key={`${item.key}-${topping}`} style={styles.badge}>Top: {topping}</Text>)}
                      {item.iceSelectedValue && item.iceSelectedValue !== '100' ? <Text style={styles.badge}>Đá: {item.iceSelectedValue}%</Text> : null}
                      {item.sugarSelectedValue && item.sugarSelectedValue !== '100' ? <Text style={styles.badge}>Đường: {item.sugarSelectedValue}%</Text> : null}
                    </View>
                  </View>
                  <View style={styles.qtyStepper}>
                    <TouchableOpacity onPress={() => adjustQty(item.key, -1)} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity onPress={() => adjustQty(item.key, 1)} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemTotal}>{formatMoney(item.unitPrice * item.qty)}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.summary}>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Tạm tính</Text>
              <Text style={styles.sumVal}>{formatMoney(subtotal)}</Text>
            </View>
            {[
              { key: 'discount', label: 'Giảm giá', state: discount, setState: setDiscount },
              { key: 'tax', label: 'Thuế', state: taxFee, setState: setTaxFee },
              { key: 'fee', label: 'Phí khác', state: feeOther, setState: setFeeOther },
            ].map((entry) => (
              <View key={entry.key} style={styles.chargeRow}>
                <TouchableOpacity
                  style={styles.chargeCheck}
                  onPress={() => entry.setState((prev) => ({ ...prev, enabled: !prev.enabled }))}
                >
                  <Ionicons name={entry.state.enabled ? 'checkbox' : 'square-outline'} size={18} color={Colors.primary} />
                  <Text style={styles.sumLabel}>{entry.label}</Text>
                </TouchableOpacity>
                <View style={styles.chargeInputWrap}>
                  <TouchableOpacity
                    onPress={() => entry.setState((prev) => ({ ...prev, type: prev.type === 'percent' ? 'price' : 'percent' }))}
                    style={styles.chargeTypeBtn}
                  >
                    <Text style={styles.chargeTypeText}>{entry.state.type === 'percent' ? '%' : 'đ'}</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.discountInput}
                    value={entry.state.value}
                    onChangeText={(value) => entry.setState((prev) => ({ ...prev, value }))}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>
            ))}
            {selectedPromotions.length > 0 ? (
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>KM áp dụng</Text>
                <Text style={styles.sumVal}>- {formatMoney(promoDiscountAmt)}</Text>
              </View>
            ) : null}
            <View style={styles.chargeRow}>
              <Text style={styles.sumLabel}>Phí ship</Text>
              <TextInput
                style={styles.discountInput}
                value={shippingFee}
                onChangeText={setShippingFee}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Nhà vận chuyển</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.shippingRow}>
                  <TouchableOpacity
                    style={[styles.shippingChip, !shippingProvider && styles.shippingChipActive]}
                    onPress={() => setShippingProvider(null)}
                  >
                    <Text style={[styles.shippingChipText, !shippingProvider && styles.shippingChipTextActive]}>Không chọn</Text>
                  </TouchableOpacity>
                  {connectedShippingProviders.map((provider) => (
                    <TouchableOpacity
                      key={provider}
                      style={[styles.shippingChip, shippingProvider === provider && styles.shippingChipActive]}
                      onPress={() => setShippingProvider(provider)}
                    >
                      <Text style={[styles.shippingChipText, shippingProvider === provider && styles.shippingChipTextActive]}>
                        {provider.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Khuyến mại (IDs)</Text>
              <TextInput
                style={styles.promoInput}
                value={promotionIdsInput}
                onChangeText={setPromotionIdsInput}
                placeholder="Ví dụ: 12,15"
              />
            </View>
            {availablePromotions.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoChipWrap}>
                {availablePromotions.map((promo) => {
                  const active = selectedPromotions.some((item) => String(item.id) === String(promo.id));
                  return (
                    <TouchableOpacity
                      key={`promo-${promo.id}`}
                      style={[styles.promoChip, active && styles.promoChipActive]}
                      onPress={() =>
                        setSelectedPromotions((prev) => {
                          const exists = prev.some((item) => String(item.id) === String(promo.id));
                          if (exists) return prev.filter((item) => String(item.id) !== String(promo.id));
                          return [...prev, promo];
                        })
                      }
                    >
                      <Text style={[styles.promoChipText, active && styles.promoChipTextActive]}>
                        {promo.name} {promo.discountAmount ? `(-${Math.round(promo.discountAmount).toLocaleString('vi-VN')}đ)` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}
            <View style={styles.inlineActionsRow}>
              <TouchableOpacity style={styles.inlineActionBtn} onPress={() => setShippingModalVisible(true)}>
                <Text style={styles.inlineActionText}>Địa chỉ giao</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inlineActionBtn} onPress={calculateFee} disabled={shippingLoading || !shippingProvider}>
                <Text style={styles.inlineActionText}>{shippingLoading ? 'Đang tính...' : 'Tính phí ship'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inlineActionBtn} onPress={loadProvisionalInvoices}>
                <Text style={styles.inlineActionText}>HĐ tạm</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.sumRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>TỔNG</Text>
              <Text style={styles.totalVal}>{formatMoney(total)}</Text>
            </View>
          </View>

          <View style={styles.customerRow}>
            <TextInput
              style={styles.customerInput}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Tên khách hàng"
            />
            <TextInput
              style={styles.customerInput}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
              placeholder="SĐT khách hàng"
            />
          </View>

          <View style={styles.payRow}>
            {PAY_METHODS.map((method) => (
              <TouchableOpacity
                key={method.key}
                onPress={() => setPayMethod(method.key)}
                style={[styles.payBtn, payMethod === method.key && styles.payBtnActive]}
              >
                <Ionicons name={method.icon} size={16} color={payMethod === method.key ? '#fff' : Colors.textSecondary} />
                <Text style={[styles.payLabel, payMethod === method.key && styles.payLabelActive]}>{method.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {eInvoiceEnabled ? (
            <TouchableOpacity style={styles.eInvoiceRow} onPress={() => setIssueEInvoiceChecked((prev) => !prev)}>
              <Ionicons name={issueEInvoiceChecked ? 'checkbox' : 'square-outline'} size={18} color={Colors.primary} />
              <Text style={styles.eInvoiceText}>
                {issueEInvoiceChecked ? 'Phát hành HĐĐT chính thức' : 'Tạo nháp HĐĐT khi thanh toán'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
          {shippingOrderCreated ? <Text style={styles.successText}>Mã vận đơn: {shippingOrderCreated}</Text> : null}
          {printStatus ? (
            <Text style={printStatusError ? styles.errorText : styles.successText}>{printStatus}</Text>
          ) : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.subActionBtn, cart.length === 0 && styles.createBtnDisabled]}
              disabled={cart.length === 0 || submitting}
              onPress={() => submitOrder('pending')}
            >
              <Text style={styles.subActionText}>Lưu tạm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, cart.length === 0 && styles.createBtnDisabled]}
              disabled={cart.length === 0 || submitting}
              onPress={() => submitOrder('paid')}
            >
              <Text style={styles.createBtnText}>{submitting ? 'Đang tạo đơn...' : `Thanh toán ${formatMoney(total)}`}</Text>
            </TouchableOpacity>
          </View>
            </ScrollView>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={!!customizeState} animationType="none" transparent onRequestClose={closeCustomize}>
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.modalOverlay, { opacity: customizeBackdropOpacity }]} />
          <Pressable style={StyleSheet.absoluteFill} onPress={closeCustomize} />
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: customizeSheetTranslateY }] }]}>
            <Pressable onPress={(event) => event.stopPropagation()} style={styles.modalCard}>
            {customizeState ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={1}>{customizeState.product.name}</Text>
                  <TouchableOpacity onPress={closeCustomize}>
                    <Ionicons name="close" size={22} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  {customizeVariantEntries.map(([key, options]) => (
                    <View key={key} style={styles.optionGroup}>
                      <Text style={styles.optionTitle}>{key.toUpperCase()}</Text>
                      {key.toLowerCase() === 'size' ? (
                        <View style={styles.optionList}>
                          {[...options]
                            .sort(
                              (a, b) =>
                                (resolveVariantOptionPrice(
                                  customizeState.product,
                                  key,
                                  a.value,
                                  customizeState.selectedAttributes,
                                ) -
                                  resolveVariantOptionPrice(
                                    customizeState.product,
                                    key,
                                    b.value,
                                    customizeState.selectedAttributes,
                                  )) ||
                                compareSizeNatural(a.label, b.label),
                            )
                            .map((option) => {
                              const active = customizeState.selectedAttributes[key]?.value === option.value;
                              const optionPrice = resolveVariantOptionPrice(
                                customizeState.product,
                                key,
                                option.value,
                                customizeState.selectedAttributes,
                              );
                              const optionStock = resolveVariantOptionStock(
                                customizeState.product,
                                key,
                                option.value,
                                customizeState.selectedAttributes,
                              );
                              return (
                                <TouchableOpacity
                                  key={`${key}-${option.value}`}
                                  style={[styles.optionLineItem, active && styles.optionLineItemActive]}
                                  onPress={() =>
                                    setCustomizeState((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            selectedAttributes: {
                                              ...prev.selectedAttributes,
                                              [key]: option,
                                            },
                                          }
                                        : prev,
                                    )
                                  }
                                >
                                  <View style={styles.optionLineLeft}>
                                    <Text style={[styles.optionLineName, active && styles.optionLineTextActive]}>{option.label}</Text>
                                    <Text style={[styles.optionLineStock, active && styles.optionLineTextActive]}>Tồn: {optionStock}</Text>
                                  </View>
                                  <Text style={[styles.optionLinePrice, active && styles.optionLineTextActive]}>
                                    {formatMoney(optionPrice)}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                        </View>
                      ) : (
                        <View style={styles.optionWrap}>
                          {options.map((option) => {
                            const active = customizeState.selectedAttributes[key]?.value === option.value;
                            return (
                              <TouchableOpacity
                                key={`${key}-${option.value}`}
                                style={[styles.optionChip, active && styles.optionChipActive]}
                                onPress={() =>
                                  setCustomizeState((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          selectedAttributes: {
                                            ...prev.selectedAttributes,
                                            [key]: option,
                                          },
                                        }
                                      : prev,
                                  )
                                }
                              >
                                <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{option.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  ))}
                  {!hasVariantSize && validRegularSizes.length > 0 ? (
                    <View style={styles.optionGroup}>
                      <Text style={styles.optionTitle}>SIZE</Text>
                      <View style={styles.optionList}>
                        {[...validRegularSizes]
                          .sort((a, b) => {
                            const priceDiff = parseOptionPrice(a) - parseOptionPrice(b);
                            if (priceDiff !== 0) return priceDiff;
                            return compareSizeNatural(a.name, b.name);
                          })
                          .map((size) => {
                          const active = String(customizeState.selectedSizeId) === String(size.id);
                          return (
                            <TouchableOpacity
                              key={`size-${size.id}`}
                              style={[styles.optionLineItem, active && styles.optionLineItemActive]}
                              onPress={() =>
                                setCustomizeState((prev) => (prev ? { ...prev, selectedSizeId: size.id } : prev))
                              }
                            >
                              <Text style={[styles.optionLineName, active && styles.optionLineTextActive]}>{size.name}</Text>
                              <Text style={[styles.optionLinePrice, active && styles.optionLineTextActive]}>
                                {formatMoney(parseOptionPrice(size))}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                  {(customizeState.product.toppings || []).length > 0 ? (
                    <View style={styles.optionGroup}>
                      <Text style={styles.optionTitle}>TOPPING</Text>
                      <View style={styles.optionList}>
                        {[...(customizeState.product.toppings || [])]
                          .sort((a, b) => parseOptionPrice(a) - parseOptionPrice(b))
                          .map((topping) => {
                          const active = customizeState.selectedToppingIds.some((id) => String(id) === String(topping.id));
                          return (
                            <TouchableOpacity
                              key={`tp-${topping.id}`}
                              style={[styles.optionLineItem, active && styles.optionLineItemActive]}
                              onPress={() =>
                                setCustomizeState((prev) => {
                                  if (!prev) return prev;
                                  const exists = prev.selectedToppingIds.some((id) => String(id) === String(topping.id));
                                  return {
                                    ...prev,
                                    selectedToppingIds: exists
                                      ? prev.selectedToppingIds.filter((id) => String(id) !== String(topping.id))
                                      : [...prev.selectedToppingIds, topping.id || topping.name || ''],
                                  };
                                })
                              }
                            >
                              <Text style={[styles.optionLineName, active && styles.optionLineTextActive]}>{topping.name}</Text>
                              <Text style={[styles.optionLinePrice, active && styles.optionLineTextActive]}>
                                +{formatMoney(parseOptionPrice(topping))}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                  {showIceSection ? (
                  <View style={styles.optionGroup}>
                    <Text style={styles.optionTitle}>ĐÁ</Text>
                    <View style={styles.optionLevelRow}>
                      {iceLevels.map((level) => {
                        const active = customizeState.iceSelectedValue === level;
                        return (
                          <TouchableOpacity
                            key={`ice-${level}`}
                            style={[styles.optionLevelItem, active && styles.optionLineItemActive]}
                            onPress={() => setCustomizeState((prev) => (prev ? { ...prev, iceSelectedValue: level } : prev))}
                          >
                            <Text style={[styles.optionLineName, active && styles.optionLineTextActive]}>{level}%</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  ) : null}
                  {showSugarSection ? (
                  <View style={styles.optionGroup}>
                    <Text style={styles.optionTitle}>ĐƯỜNG</Text>
                    <View style={styles.optionLevelRow}>
                      {sugarLevels.map((level) => {
                        const active = customizeState.sugarSelectedValue === level;
                        return (
                          <TouchableOpacity
                            key={`sugar-${level}`}
                            style={[styles.optionLevelItem, active && styles.optionLineItemActive]}
                            onPress={() => setCustomizeState((prev) => (prev ? { ...prev, sugarSelectedValue: level } : prev))}
                          >
                            <Text style={[styles.optionLineName, active && styles.optionLineTextActive]}>{level}%</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  ) : null}
                  <TextInput
                    style={styles.noteInput}
                    value={itemNote}
                    onChangeText={setItemNote}
                    placeholder="Ghi chú món..."
                    multiline
                  />
                  {customizeError ? <Text style={styles.modalErrorText}>{customizeError}</Text> : null}
                </ScrollView>
                <TouchableOpacity style={styles.modalAddBtn} onPress={applyCustomizedProduct}>
                  <Text style={styles.modalAddBtnText}>
                    Thêm giỏ hàng {formatMoney(resolveUnitPrice(customizeState.product, customizeState.selectedAttributes, customizeState.selectedSizeId, customizeState.selectedToppingIds))}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={shippingModalVisible} animationType="slide" transparent onRequestClose={() => setShippingModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông tin giao hàng</Text>
              <TouchableOpacity onPress={() => setShippingModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.noteInput}
                value={shippingAddress}
                onChangeText={setShippingAddress}
                placeholder="Số nhà, đường..."
              />
              <Text style={styles.optionTitle}>Tỉnh/Thành</Text>
              <View style={styles.optionWrap}>
                {shippingProvinces.map((item) => (
                  <TouchableOpacity
                    key={`p-${item.value}`}
                    style={[styles.optionChip, shippingProvince?.value === item.value && styles.optionChipActive]}
                    onPress={() => setShippingProvince(item)}
                  >
                    <Text style={[styles.optionChipText, shippingProvince?.value === item.value && styles.optionChipTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.optionTitle}>Quận/Huyện</Text>
              <View style={styles.optionWrap}>
                {shippingDistricts.map((item) => (
                  <TouchableOpacity
                    key={`d-${item.value}`}
                    style={[styles.optionChip, shippingDistrict?.value === item.value && styles.optionChipActive]}
                    onPress={() => setShippingDistrict(item)}
                  >
                    <Text style={[styles.optionChipText, shippingDistrict?.value === item.value && styles.optionChipTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.optionTitle}>Phường/Xã</Text>
              <View style={styles.optionWrap}>
                {shippingWards.map((item) => (
                  <TouchableOpacity
                    key={`w-${item.value}`}
                    style={[styles.optionChip, shippingWard?.value === item.value && styles.optionChipActive]}
                    onPress={() => setShippingWard(item)}
                  >
                    <Text style={[styles.optionChipText, shippingWard?.value === item.value && styles.optionChipTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.modalAddBtn} onPress={() => setShippingModalVisible(false)}>
              <Text style={styles.modalAddBtnText}>Xong</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={provisionalModalVisible} animationType="slide" transparent onRequestClose={() => setProvisionalModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hóa đơn tạm</Text>
              <TouchableOpacity onPress={() => setProvisionalModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {provisionalInvoices.length === 0 ? (
                <Text style={styles.emptyText}>Không có hóa đơn tạm</Text>
              ) : (
                provisionalInvoices.map((item, idx) => (
                  <TouchableOpacity key={`${item.pin || 'pin'}-${idx}`} style={styles.provisionalItem} onPress={() => reopenProvisionalInvoice(idx)}>
                    <Text style={styles.provisionalTitle}>PIN: {item.pin || `#${idx + 1}`}</Text>
                    <Text style={styles.provisionalSub}>{item.orders.length} món</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.card },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3, flex: 1 },
  content: { flex: 1 },
  searchRow: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  searchInputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 44 },
  searchInput: { flex: 1, ...Typography.body },
  categoryList: { maxHeight: 40 },
  categoryWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  categoryChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card, flexShrink: 0 },
  categoryChipSpacing: { marginRight: 6 },
  categoryChipActive: { borderColor: Colors.text, backgroundColor: Colors.text },
  categoryText: { ...Typography.captionMd, color: Colors.text },
  categoryTextActive: { color: Colors.card },
  productList: { flex: 1 },
  productListContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.md },
  columnWrap: { gap: Spacing.sm, marginBottom: Spacing.sm },
  productCol: { width: '50%' },
  productCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 0,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 178,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  productThumb: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: { width: '100%', height: '100%' },
  productThumbText: { ...Typography.h3, color: Colors.primary },
  productBody: { flex: 1, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8 },
  productMeta: { minHeight: 44, gap: 2 },
  productName: { ...Typography.body, color: Colors.text, fontWeight: '400' },
  productFooter: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center' },
  priceBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  priceStack: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  productPrice: { ...Typography.caption, color: Colors.primary, fontWeight: '500' },
  productPriceSale: { ...Typography.caption, color: Colors.primary, fontWeight: '500' },
  productPriceBase: { ...Typography.caption, color: Colors.textSecondary, textDecorationLine: 'line-through' },
  orderPreviewBtn: {
    marginHorizontal: Spacing.lg,
    marginBottom: Math.max(Spacing.md, 12),
    marginTop: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.sm,
  },
  orderPreviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderPreviewText: { ...Typography.bodyMd, color: '#fff', fontWeight: '700' },
  orderPreviewAction: { ...Typography.captionMd, color: '#fff' },
  emptyProducts: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl, gap: 6 },
  emptyText: { ...Typography.caption, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
  checkoutPanel: { backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, ...Shadow.md },
  panelTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  panelTitle: { ...Typography.bodyMd },
  cartBadge: { minWidth: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', gap: 1, paddingHorizontal: 6 },
  cartBadgeText: { ...Typography.captionMd, color: Colors.primary },
  emptyCart: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md },
  cartList: { maxHeight: 180 },
  cartListContent: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  cartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: Colors.border, gap: 4, backgroundColor: Colors.card },
  cartMeta: { flex: 1, paddingRight: 4 },
  cartName: { ...Typography.captionMd },
  cartUnitPrice: { ...Typography.caption, color: Colors.textSecondary },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  badge: { ...Typography.caption, color: Colors.primary, backgroundColor: Colors.primaryLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.sm },
  qtyStepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, borderRadius: 11, borderWidth: 1.5, borderColor: Colors.border },
  stepBtnText: { fontSize: 16, color: Colors.text, lineHeight: 20 },
  qtyText: { ...Typography.captionMd, paddingHorizontal: 4 },
  cartItemTotal: { ...Typography.caption, color: Colors.primary, minWidth: 64, textAlign: 'right' },
  summary: { paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, gap: 6, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumLabel: { ...Typography.caption, color: Colors.textSecondary },
  sumVal: { ...Typography.captionMd },
  chargeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chargeCheck: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chargeInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chargeTypeBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  chargeTypeText: { ...Typography.captionMd, color: Colors.primary },
  discountInput: { ...Typography.captionMd, textAlign: 'right', width: 90, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 2 },
  promoInput: { ...Typography.captionMd, textAlign: 'right', width: 120, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 2 },
  promoChipWrap: { flexDirection: 'row', gap: 6, paddingTop: 4 },
  promoChip: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.card },
  promoChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  promoChipText: { ...Typography.caption, color: Colors.textSecondary },
  promoChipTextActive: { color: Colors.primary },
  inlineActionsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  inlineActionBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingVertical: 6, alignItems: 'center', backgroundColor: Colors.card },
  inlineActionText: { ...Typography.caption, color: Colors.textSecondary },
  shippingRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  shippingChip: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.card },
  shippingChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  shippingChipText: { ...Typography.captionMd, color: Colors.textSecondary },
  shippingChipTextActive: { color: '#fff' },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, borderStyle: 'dashed', paddingTop: 6 },
  totalLabel: { ...Typography.bodyMd },
  totalVal: { ...Typography.h4, color: Colors.primary },
  customerRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.sm },
  customerInput: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.card, paddingHorizontal: 10, paddingVertical: 8, ...Typography.captionMd },
  payRow: { flexDirection: 'row', paddingTop: Spacing.sm, gap: Spacing.sm },
  payBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, gap: 4 },
  payBtnActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  payLabel: { ...Typography.label, color: Colors.textSecondary },
  payLabelActive: { color: '#fff' },
  eInvoiceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  eInvoiceText: { ...Typography.captionMd, color: Colors.textSecondary },
  errorText: { ...Typography.caption, color: Colors.danger, marginTop: 8, textAlign: 'center' },
  successText: { ...Typography.caption, color: Colors.success, marginTop: 6, textAlign: 'center' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  subActionBtn: { flex: 1, paddingVertical: 13, borderRadius: Radius.full, backgroundColor: Colors.card, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  subActionText: { ...Typography.bodyMd, color: Colors.text },
  createBtn: { flex: 2, paddingVertical: 13, borderRadius: Radius.full, backgroundColor: Colors.primary, alignItems: 'center', ...Shadow.sm },
  createBtnDisabled: { backgroundColor: Colors.border },
  createBtnText: { ...Typography.bodyMd, color: '#fff' },
  modalRoot: { flex: 1, justifyContent: 'flex-end', position: 'relative' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '86%', backgroundColor: Colors.card, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingBottom: Spacing.md },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { ...Typography.bodyMd, flex: 1, marginRight: 8 },
  modalBody: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  optionGroup: { marginBottom: Spacing.sm },
  optionTitle: { ...Typography.captionMd, color: Colors.textSecondary, marginBottom: 6 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionList: { gap: 6 },
  optionLineItem: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionLineItemActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionLineLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 8 },
  optionLineName: { ...Typography.captionMd, color: Colors.text },
  optionLineStock: { ...Typography.caption, color: Colors.textSecondary },
  optionLinePrice: { ...Typography.captionMd, color: Colors.textSecondary },
  optionLineTextActive: { color: Colors.primary },
  optionLevelRow: { flexDirection: 'row', gap: 6 },
  optionLevelItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 0,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionChip: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.background },
  optionChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionChipText: { ...Typography.captionMd, color: Colors.text },
  optionChipTextActive: { color: Colors.primary },
  noteInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, minHeight: 72, padding: 10, marginTop: Spacing.sm, textAlignVertical: 'top' },
  modalErrorText: { ...Typography.caption, color: Colors.danger, marginTop: 8 },
  modalAddBtn: { marginTop: Spacing.sm, marginHorizontal: Spacing.lg, paddingVertical: 13, borderRadius: Radius.full, backgroundColor: Colors.primary, alignItems: 'center' },
  modalAddBtnText: { ...Typography.bodyMd, color: '#fff' },
  provisionalItem: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.card, padding: 10, marginBottom: 8 },
  provisionalTitle: { ...Typography.captionMd, color: Colors.text },
  provisionalSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
