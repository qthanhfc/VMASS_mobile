import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow, Typography, useThemeMode } from '../../theme';
import {
  createBrand,
  createCategory,
  createProduct,
  getBusinessType,
  getProductDetail,
  importProducts,
  listAllProducts,
  listMakeProducts,
  listBrands,
  listCategories,
  listStocks,
  listStockUnits,
  updateProduct,
} from '../../services/products';
import type { ProductBrand, ProductCategory, StockUnit } from '../../services/products';
import type { Product, ProductComboItem, ProductMakeItem, ProductStock, ProductVariant, ProductVariantOption } from '../../types';
import {
  getUnitsForBusinessType,
  loadCustomUnitsForBusinessType,
  saveCustomUnitForBusinessType,
} from '../../utils/productUnits';
import { useLanguage } from '../../i18n';
import { useRealtimeRefresh } from '../../realtime';

type RouteParams = {
  ProductEdit: { id?: number };
};

type PhotoItem = {
  id: string;
  uri: string;
  fallbackUri?: string;
};

type FieldCardProps = {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  onScanPress?: () => void;
  onClearPress?: () => void;
  placeholder?: string;
  mono?: boolean;
  highlight?: boolean;
  dropdown?: boolean;
  scan?: boolean;
  clearable?: boolean;
  editable?: boolean;
  disabled?: boolean;
  keyboardType?: 'default' | 'numeric';
};

type CategorySelectModalProps = {
  visible: boolean;
  title: string;
  placeholder: string;
  createPrefix: string;
  emptyText: string;
  options: SelectOption[];
  value?: string | number;
  search: string;
  loading?: boolean;
  creating?: boolean;
  loadingText: string;
  selectedValues?: string[];
  footerActionLabel?: string;
  footerFallbackLabel: string;
  onSearchChange: (text: string) => void;
  onSelect: (category: SelectOption) => void;
  onCreate?: (name: string) => void;
  onFooterAction?: () => void;
  onClose: () => void;
};

type SelectOption = {
  id: string | number;
  name: string;
};

type DraftProductVariant = {
  id: string;
  name: string;
  sku: string;
  quantity: string;
  price: string;
  cost_price: string;
  promo_price: string;
  exchange_value: string;
  date_start?: string | null;
  date_end?: string | null;
  size?: ProductVariantOption;
  color?: ProductVariantOption;
  material?: ProductVariantOption;
  attributes: {
    size?: ProductVariantOption;
    color?: ProductVariantOption;
    material?: ProductVariantOption;
    [key: string]: ProductVariantOption | undefined;
  };
};

type DisplayVariant = ProductVariant | DraftProductVariant;

type RecipeIngredient = {
  id: string;
  stock_id?: number | string | null;
  stock_name: string;
  unit: string;
  quantity: string;
  price: string;
  is_new_stock: boolean;
  stock_count?: string;
  stock_quantity?: string;
  stock_cost_price?: string;
  stock_supplier?: string;
  stock_paid?: string;
};

type ComboProductDraft = {
  id: string;
  product_id?: number | null;
  product_name: string;
  quantity: string;
};

function FieldCard({
  label,
  value,
  onChangeText,
  onPress,
  onScanPress,
  onClearPress,
  placeholder,
  mono = false,
  highlight = false,
  dropdown = false,
  scan = false,
  clearable = false,
  editable = true,
  disabled = false,
  keyboardType = 'default',
}: FieldCardProps) {
  const canClear = clearable && Boolean(value.trim()) && Boolean(onClearPress) && !disabled;

  const fieldContent = (
    <>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        style={[styles.fieldInput, mono && styles.fieldInputMono, disabled && styles.fieldInputDisabled]}
        keyboardType={keyboardType}
        editable={!disabled && editable && !onPress}
        pointerEvents={onPress ? 'none' : 'auto'}
      />
      {canClear && (
        <TouchableOpacity
          onPress={(event) => {
            event.stopPropagation();
            onClearPress?.();
          }}
          disabled={disabled}
          style={styles.fieldIconButton}
          activeOpacity={0.85}
        >
          <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
      {scan ? (
        onScanPress ? (
          <TouchableOpacity onPress={onScanPress} disabled={disabled} style={styles.fieldIconButton} activeOpacity={0.85}>
            <Ionicons name="qr-code" size={16} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="qr-code" size={16} color={Colors.primary} />
        )
      ) : null}
      {dropdown && <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />}
    </>
  );

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {onPress ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          disabled={disabled}
          style={[styles.fieldBox, highlight && styles.fieldBoxHighlight, disabled && styles.fieldBoxDisabled]}
        >
          {fieldContent}
        </TouchableOpacity>
      ) : (
        <View style={[styles.fieldBox, highlight && styles.fieldBoxHighlight, disabled && styles.fieldBoxDisabled]}>
          {fieldContent}
        </View>
      )}
    </View>
  );
}

type ToggleItemProps = {
  label: string;
  value: boolean;
  onPress: () => void;
  last?: boolean;
};

function ToggleItem({ label, value, onPress, last = false }: ToggleItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.toggleRow, !last && styles.toggleRowBorder]}
    >
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

function CategorySelectModal({
  visible,
  title,
  placeholder,
  createPrefix,
  emptyText,
  options,
  value,
  search,
  loading = false,
  creating = false,
  loadingText,
  selectedValues = [],
  footerActionLabel,
  footerFallbackLabel,
  onSearchChange,
  onSelect,
  onCreate,
  onFooterAction,
  onClose,
}: CategorySelectModalProps) {
  const keyword = search.trim();
  const filteredCategories = keyword
    ? options.filter((item) => item.name.toLowerCase().includes(keyword.toLowerCase()))
    : options;
  const canCreate = Boolean(
    onCreate && keyword && !options.some((item) => item.name.trim().toLowerCase() === keyword.toLowerCase()),
  );
  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalBackdropPressable} onPressIn={handleClose} />
        <View style={styles.categoryModal}>
          <View style={styles.categoryModalHeader}>
            <Text style={styles.categoryModalTitle}>{title}</Text>
            <TouchableOpacity style={styles.categoryCloseBtn} onPressIn={handleClose}>
              <Ionicons name="close" size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.categorySearchBox}>
            <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
            <TextInput
              value={search}
              onChangeText={onSearchChange}
              placeholder={placeholder}
              placeholderTextColor={Colors.textSecondary}
              style={styles.categorySearchInput}
              autoFocus={false}
            />
          </View>

          <ScrollView style={styles.categoryList} keyboardShouldPersistTaps="handled">
            {loading ? (
              <View style={styles.categoryLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.categoryLoadingText}>{loadingText}</Text>
              </View>
            ) : (
              <>
                {filteredCategories.map((item) => {
                  const normalizedValue = normalizeSizeName(item.name);
                  const selected = selectedValues.length > 0
                    ? selectedValues.includes(normalizedValue)
                    : item.id === value;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.categoryOption, selected && styles.categoryOptionActive]}
                      onPress={() => onSelect(item)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.categoryOptionText, selected && styles.categoryOptionTextActive]}>
                        {item.name}
                      </Text>
                      {selected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
                {canCreate && (
                  <TouchableOpacity
                    style={styles.categoryCreateOption}
                    onPress={() => onCreate?.(keyword)}
                    disabled={creating || !onCreate}
                    activeOpacity={0.85}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                    )}
                    <Text style={styles.categoryCreateText}>{createPrefix} "{keyword}"</Text>
                  </TouchableOpacity>
                )}
                {!filteredCategories.length && !canCreate && (
                  <Text style={styles.categoryEmptyText}>{emptyText}</Text>
                )}
              </>
            )}
          </ScrollView>
          {onFooterAction && (
            <TouchableOpacity
              style={[
                styles.modalFooterButton,
                selectedValues.length === 0 && styles.modalFooterButtonDisabled,
              ]}
              onPress={onFooterAction}
              disabled={selectedValues.length === 0}
              activeOpacity={0.85}
            >
              <Text style={styles.modalFooterButtonText}>{footerActionLabel || footerFallbackLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const isFnBBusiness = (businessType: string) =>
  businessType === 'cafe' || businessType === 'restaurant';

const isRetailBusiness = (businessType: string) => businessType === 'retail';

const IMAGE_LIMIT = 8;
const PHOTO_SIZE = 90;
const PHOTO_GAP = 8;
const PHOTO_STEP = PHOTO_SIZE + PHOTO_GAP;
const DRAG_HOLD_DELAY = 220;

const formatMoney = (value?: number | string | null) =>
  `${Math.max(0, Number(value || 0)).toLocaleString('vi-VN')} đ`;

const parseCurrency = (value: string) => parseFloat(value.replace(/\D/g, '')) || 0;

const normalizeDecimalInput = (value?: number | string | null) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (raw.includes(',')) return raw.replace(/\./g, '').replace(',', '.');
  if (/^\d{1,3}(\.\d{3})+$/.test(raw)) return raw.replace(/\./g, '');
  return raw;
};

const parseDecimalInput = (value?: number | string | null) => {
  const parsed = Number(normalizeDecimalInput(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

const isRecipeIngredientConfigured = (ingredient: RecipeIngredient) =>
  Boolean(
    ingredient.stock_name.trim() &&
    parseDecimalInput(ingredient.quantity) &&
    parseCurrency(ingredient.price || ingredient.stock_cost_price || ''),
  );

const buildComboDraftId = () => `combo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const mergeBrandOptions = (current: ProductBrand[], incoming: ProductBrand[]) => {
  const byName = new Map<string, ProductBrand>();
  [...incoming, ...current].forEach((item) => {
    const nameKey = item.name.trim().toLowerCase();
    if (!nameKey) return;
    if (!byName.has(nameKey)) {
      byName.set(nameKey, item);
      return;
    }
    const existing = byName.get(nameKey)!;
    if ((item.id || 0) > (existing.id || 0)) {
      byName.set(nameKey, item);
    }
  });
  return Array.from(byName.values());
};

const mapComboItemToDraft = (item: ProductComboItem, index: number): ComboProductDraft => ({
  id: `combo-${item.productId}-${index}-${Math.random().toString(36).slice(2, 6)}`,
  product_id: item.productId,
  product_name: item.productName || '',
  quantity: formatNumberInput(item.quantity || 1) || '1',
});

const formatQuantityValue = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (Math.abs(value - Math.round(value)) < 0.000001) return String(Math.round(value));
  return value.toFixed(4).replace(/\.?0+$/, '');
};

const expandComboProductsToIngredients = (
  comboItems: ComboProductDraft[],
  allMakeProducts: ProductMakeItem[],
) => {
  const ingredientMap = new Map<
    string,
    {
      stockId: number;
      stockName: string;
      unit: string;
      quantity: number;
      price: number;
      stockCount: number;
    }
  >();
  const unresolved: Array<{ productId?: number | null; productName: string }> = [];

  comboItems.forEach((comboItem) => {
    const productId = comboItem.product_id ?? null;
    const productName = comboItem.product_name.trim();
    const comboQty = Math.max(0, parseDecimalInput(comboItem.quantity || '0'));
    if (!productId || comboQty <= 0) return;

    const makeProductsForChild = allMakeProducts.filter(
      (item) => item.productId === productId && item.stock?.id,
    );

    if (makeProductsForChild.length === 0) {
      unresolved.push({ productId, productName });
      return;
    }

    makeProductsForChild.forEach((item) => {
      const stock = item.stock;
      const stockId = stock?.id;
      if (!stockId) return;

      const usageQty = Math.max(0, Number(item.count || 0)) * comboQty;
      if (usageQty <= 0) return;

      const key = String(stockId);
      const cost = Math.max(0, stock.averagePrice || stock.latestPrice || 0);
      const stockCount = Math.max(0, Number(stock.count || 0));

      const existing = ingredientMap.get(key);
      if (existing) {
        existing.quantity += usageQty;
      } else {
        ingredientMap.set(key, {
          stockId,
          stockName: stock.name,
          unit: stock.unit || '',
          quantity: usageQty,
          price: cost,
          stockCount,
        });
      }
    });
  });

  const ingredients: RecipeIngredient[] = Array.from(ingredientMap.values()).map((item) => ({
    id: `combo-stock-${item.stockId}`,
    stock_id: item.stockId,
    stock_name: item.stockName,
    unit: item.unit,
    quantity: formatQuantityValue(item.quantity),
    price: formatNumberInput(item.price),
    is_new_stock: false,
    stock_count: formatNumberInput(item.stockCount),
  }));

  return { ingredients, unresolved };
};

const formatNumberInput = (value?: number | string | null) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('vi-VN');
};

const generateProductSku = () => {
  const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `SP-${seed.slice(-8).toUpperCase()}`;
};

const optionName = (option?: ProductVariantOption) =>
  option?.name || option?.label || option?.value || '';

const FNB_PERCENT_OPTIONS = ['0', '25', '50', '75', '100'];
const FNB_DEFAULT_SIZE_NAMES = ['Size S', 'Size M', 'Size L'];

const makeFnbOption = (name = '', value = '0', promoPrice = '0'): ProductVariantOption => ({
  id: `${name || 'opt'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name,
  label: name,
  value,
  promo_price: promoPrice,
});

const normalizeFnbOption = (option: ProductVariantOption): ProductVariantOption => {
  const name = optionName(option).trim();
  return {
    ...option,
    id: option.id ?? `${name || 'opt'}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    label: name,
    value: formatNumberInput(String(option.value ?? '0')) || '0',
    promo_price: formatNumberInput(String(option.promo_price ?? '0')) || '0',
  };
};

const buildFnbSizeOptions = (source: ProductVariantOption[] = []) => {
  const normalized = source
    .map(normalizeFnbOption)
    .filter((option) => optionName(option).trim().length > 0);
  const next = [...normalized];
  const lowerNames = new Set(next.map((option) => optionName(option).trim().toLowerCase()));

  FNB_DEFAULT_SIZE_NAMES.forEach((defaultName) => {
    if (!lowerNames.has(defaultName.toLowerCase())) {
      next.push(makeFnbOption(defaultName, '0', '0'));
    }
  });

  return next;
};

const buildFnbToppingOptions = (source: ProductVariantOption[] = []) =>
  source
    .map(normalizeFnbOption)
    .filter((option) => optionName(option).trim().length > 0);

const toImportOption = (option: ProductVariantOption | string): ProductVariantOption => {
  const name = typeof option === 'string' ? option : optionName(option);
  const value =
    typeof option === 'string'
      ? option
      : String(option.value ?? option.name ?? option.label ?? name);
  return {
    ...(typeof option === 'string' ? {} : option),
    name,
    label: typeof option === 'string' ? name : (option.label ?? name),
    value,
  };
};

const isRemoteImageUri = (uri?: string | null) => {
  if (!uri) return false;
  return /^https?:\/\//i.test(uri.trim());
};

const isDataImageUri = (uri?: string | null) => {
  if (!uri) return false;
  return /^data:image\//i.test(uri.trim());
};

const isUploadableLocalUri = (uri?: string | null) => {
  if (!uri) return false;
  return /^(file|content|ph|assets-library):/i.test(uri.trim());
};

const guessUploadMimeType = (uri: string, fallbackUri?: string) => {
  const lowerUri = uri.toLowerCase();
  if (lowerUri.endsWith('.png') || fallbackUri?.startsWith('data:image/png')) return 'image/png';
  if (lowerUri.endsWith('.webp') || fallbackUri?.startsWith('data:image/webp')) return 'image/webp';
  if (fallbackUri?.startsWith('data:image/')) {
    const mime = fallbackUri.slice(5, fallbackUri.indexOf(';'));
    if (mime) return mime;
  }
  return 'image/jpeg';
};

const buildUploadFilename = (uri: string, index: number) => {
  const extensionMatch = uri.split('?')[0].match(/\.(jpe?g|png|webp|heic)$/i);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
  return `product-mobile-${Date.now()}-${index}.${extension}`;
};

const getOrderedOptionWeight = (name: string, index: number) => {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/^size[\s:_-]*/i, '')
    .replace(/^kích\s*cỡ[\s:_-]*/i, '')
    .trim();
  const exactWeights: Record<string, number> = {
    xs: 1,
    s: 2,
    small: 2,
    nhỏ: 2,
    m: 3,
    medium: 3,
    vừa: 3,
    l: 4,
    large: 4,
    lớn: 4,
    xl: 5,
    xxl: 6,
  };
  const numeric = normalized.match(/\d+/);

  if (exactWeights[normalized]) return exactWeights[normalized];
  if (numeric) return Number(numeric[0]);

  return 1000 + index;
};

const sortOptionsSmallToLarge = (options: ProductVariantOption[] = []) =>
  [...options].sort((left, right) => {
    const leftName = optionName(left);
    const rightName = optionName(right);
    const leftIndex = options.indexOf(left);
    const rightIndex = options.indexOf(right);
    return getOrderedOptionWeight(leftName, leftIndex) - getOrderedOptionWeight(rightName, rightIndex);
  });

const makeOption = (name: string): ProductVariantOption => ({
  id: name,
  name,
  label: name,
  value: name,
});

const normalizeSizeName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/^size[\s:_-]*/i, '')
    .replace(/^kích\s*cỡ[\s:_-]*/i, '')
    .trim();

const buildSizeSuggestions = (currentOptions: ProductVariantOption[] = []) => {
  const currentNames = currentOptions.map(optionName).filter(Boolean);
  const normalizedSet = new Set(currentNames.map(normalizeSizeName));
  const numericSizes = currentNames
    .map((name) => Number(normalizeSizeName(name)))
    .filter((value) => Number.isFinite(value));

  if (numericSizes.length > 0) {
    const min = Math.min(...numericSizes);
    const max = Math.max(...numericSizes);
    const start = Math.max(1, min - 2);
    const end = max + 2;

    return Array.from({ length: end - start + 1 }, (_, index) => String(start + index))
      .filter((name) => !normalizedSet.has(normalizeSizeName(name)))
      .map(makeOption);
  }

  const letterSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  return letterSizes
    .filter((name) => !normalizedSet.has(normalizeSizeName(name)))
    .map((name) => {
      const hasSizePrefix = currentNames.some((currentName) => /^size[\s:_-]/i.test(currentName.trim()));
      return makeOption(hasSizePrefix ? `Size ${name}` : name);
    });
};

const optionToSelectOption = (option: ProductVariantOption): SelectOption => {
  const name = optionName(option);
  return {
    id: option.id ?? option.value ?? option.label ?? name,
    name,
  };
};

const formatVariantName = (variant: DisplayVariant) => {
  const attrs = variant.attributes || {};
  const names = [attrs.size, attrs.color, attrs.material].map(optionName).filter(Boolean);
  return names.length > 0 ? names.join(' / ') : variant.sku || ('name' in variant ? variant.name : `Biến thể #${variant.id}`);
};

const getVariantPrice = (variant: DisplayVariant) =>
  'cost_price' in variant ? parseCurrency(variant.price) : variant.price;

const getVariantCost = (variant: DisplayVariant) =>
  'cost_price' in variant ? parseCurrency(variant.cost_price) : variant.costPrice;

const getVariantPromoPrice = (variant: DisplayVariant) =>
  'promo_price' in variant ? parseCurrency(variant.promo_price) : variant.promoPrice || 0;

const getVariantQuantity = (variant: DisplayVariant) =>
  'quantity' in variant && typeof variant.quantity === 'string' ? variant.quantity : String(variant.quantity || 0);

const hasActivePromo = (variant: DisplayVariant) => {
  const promoPrice = getVariantPromoPrice(variant);
  if (!promoPrice || promoPrice <= 0) return false;

  const now = Date.now();
  const startValue = 'date_start' in variant
    ? variant.date_start
    : (variant as ProductVariant).dateStart;
  const endValue = 'date_end' in variant
    ? variant.date_end
    : (variant as ProductVariant).dateEnd;
  const start = startValue ? new Date(startValue).getTime() : Number.NEGATIVE_INFINITY;
  const end = endValue ? new Date(endValue).getTime() : Number.POSITIVE_INFINITY;

  return now >= start && now <= end;
};

const getVariantLabelsForBusiness = (businessType: string) => {
  if (businessType === 'retail') {
    return {
      size: 'Quy cách',
      color: 'Dung tích / Trọng lượng',
      material: 'Hương vị',
    };
  }

  if (businessType === 'cosmetics' || businessType === 'beauty') {
    return {
      size: 'Dung tích',
      color: 'Màu sắc/Tone',
      material: 'Dòng sản phẩm',
    };
  }

  return {
    size: 'Kích cỡ',
    color: 'Màu sắc',
    material: 'Chất liệu',
  };
};

const mapProductVariantToDraft = (variant: ProductVariant): DraftProductVariant => ({
  id: String(variant.id || variant.sku || Math.random().toString(36).slice(2)),
  name: formatVariantName(variant),
  sku: variant.sku || '',
  quantity: formatNumberInput(variant.quantity),
  price: formatNumberInput(variant.price),
  cost_price: formatNumberInput(variant.costPrice),
  promo_price: formatNumberInput(variant.promoPrice),
  exchange_value: '1',
  date_start: variant.dateStart || null,
  date_end: variant.dateEnd || null,
  size: variant.attributes?.size,
  color: variant.attributes?.color,
  material: variant.attributes?.material,
  attributes: variant.attributes || {},
});

const toBackendVariant = (variant: DraftProductVariant) => ({
  id: /^\d+$/.test(String(variant.id)) ? variant.id : undefined,
  name: variant.name,
  sku: variant.sku,
  quantity: String(parseCurrency(variant.quantity)),
  price: String(parseCurrency(variant.price)),
  cost_price: String(parseCurrency(variant.cost_price)),
  promo_price: variant.promo_price ? String(parseCurrency(variant.promo_price)) : '',
  exchange_value: String(parseCurrency(variant.exchange_value) || 1),
  attributes: variant.attributes,
  size: variant.size,
  color: variant.color,
  material: variant.material,
  date_start: variant.date_start || null,
  date_end: variant.date_end || null,
});

function PhotoBox({
  uri,
  fallbackUri,
  main = false,
  selected = false,
  onRemove,
}: {
  uri?: string;
  fallbackUri?: string;
  main?: boolean;
  selected?: boolean;
  onRemove?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const [displayUri, setDisplayUri] = useState(uri);

  useEffect(() => {
    setFailed(false);
    setDisplayUri(uri);
  }, [uri]);

  const handleImageError = () => {
    if (fallbackUri && displayUri !== fallbackUri) {
      setDisplayUri(fallbackUri);
      return;
    }

    setFailed(true);
  };

  return (
    <View style={[styles.photoBox, main && styles.photoMain, selected && styles.photoSelected]}>
      {displayUri && !failed && (
        <Image source={{ uri: displayUri }} style={styles.photoImage} resizeMode="cover" onError={handleImageError} />
      )}
      {selected && onRemove && (
        <TouchableOpacity style={styles.removePhotoButton} onPress={onRemove} activeOpacity={0.85}>
          <Ionicons name="close" size={14} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function makePhotoItem(uri: string, fallbackUri?: string): PhotoItem {
  return {
    id: `${uri}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    uri,
    fallbackUri,
  };
}

function photoItemFromAsset(asset: ImagePicker.ImagePickerAsset): PhotoItem | null {
  const fallbackUri = asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : undefined;
  const uri = asset.uri || fallbackUri;

  return uri ? makePhotoItem(uri, fallbackUri) : null;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

export function ProductEditScreen() {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'ProductEdit'>>();
  const editId = route.params?.id;
  const isEdit = Boolean(editId);

  const [product, setProduct] = useState<Product | null>(null);
  const [businessType, setBusinessType] = useState('');
  const [makeProducts, setMakeProducts] = useState<ProductMakeItem[]>([]);
  const [allMakeProducts, setAllMakeProducts] = useState<ProductMakeItem[]>([]);
  const [comboProductsCatalog, setComboProductsCatalog] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [brandId, setBrandId] = useState<number | undefined>();
  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [activeSupplierIngredientId, setActiveSupplierIngredientId] = useState<string | null>(null);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [backendUnits, setBackendUnits] = useState<StockUnit[]>([]);
  const [customUnits, setCustomUnits] = useState<string[]>([]);
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [productImages, setProductImages] = useState<PhotoItem[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragX = useMemo(() => new Animated.Value(0), []);
  const dragScale = useMemo(() => new Animated.Value(1), []);
  const dragHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragActiveRef = useRef(false);
  const dragIndexRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const recipeSheetTranslateY = useRef(new Animated.Value(32)).current;
  const variantSheetTranslateY = useRef(new Animated.Value(32)).current;

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [saleUnit, setSaleUnit] = useState('');
  const [unit, setUnit] = useState('');
  const [stock, setStock] = useState('');
  const [stockPaid, setStockPaid] = useState('');
  const [stockSupplier, setStockSupplier] = useState('');
  const [directSupplierSearch, setDirectSupplierSearch] = useState('');
  const [directSupplierPickerVisible, setDirectSupplierPickerVisible] = useState(false);
  const [inventoryMode, setInventoryMode] = useState<'direct' | 'recipe'>('direct');
  const [minStock, setMinStock] = useState('5');
  const [selectedIce, setSelectedIce] = useState<string[]>([]);
  const [selectedSugar, setSelectedSugar] = useState<string[]>([]);
  const [fnbSizeOptions, setFnbSizeOptions] = useState<ProductVariantOption[]>([]);
  const [fnbToppingOptions, setFnbToppingOptions] = useState<ProductVariantOption[]>([]);
  const [addedSizeOptions, setAddedSizeOptions] = useState<ProductVariantOption[]>([]);
  const [sizeSuggestModalVisible, setSizeSuggestModalVisible] = useState(false);
  const [sizeSuggestSearch, setSizeSuggestSearch] = useState('');
  const [selectedSizeSuggestions, setSelectedSizeSuggestions] = useState<string[]>([]);
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [variantSizeOptions, setVariantSizeOptions] = useState<ProductVariantOption[]>([]);
  const [variantColorOptions, setVariantColorOptions] = useState<ProductVariantOption[]>([]);
  const [variantMaterialOptions, setVariantMaterialOptions] = useState<ProductVariantOption[]>([]);
  const [draftVariants, setDraftVariants] = useState<DraftProductVariant[]>([]);
  const [newVariantSize, setNewVariantSize] = useState('');
  const [newVariantColor, setNewVariantColor] = useState('');
  const [newVariantMaterial, setNewVariantMaterial] = useState('');
  const [masterVariant, setMasterVariant] = useState({
    quantity: '',
    price: '',
    cost_price: '',
    promo_price: '',
  });
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [recipeStocks, setRecipeStocks] = useState<ProductStock[]>([]);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [activeRecipeIngredientId, setActiveRecipeIngredientId] = useState<string | null>(null);
  const [loadingRecipeStocks, setLoadingRecipeStocks] = useState(false);
  const [comboByProduct, setComboByProduct] = useState(false);
  const [comboProducts, setComboProducts] = useState<ComboProductDraft[]>([]);
  const [comboSearch, setComboSearch] = useState('');
  const [activeComboProductId, setActiveComboProductId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [allowOversell, setAllowOversell] = useState(false);
  const [vatApplied, setVatApplied] = useState(false);
  const variantSizeInputRef = useRef<TextInput | null>(null);
  const variantColorInputRef = useRef<TextInput | null>(null);
  const variantMaterialInputRef = useRef<TextInput | null>(null);

  const hydrateForm = useCallback((
    nextProduct: Product,
    nextMakeProducts: ProductMakeItem[],
    nextBusinessType = '',
    nextAllMakeProducts: ProductMakeItem[] = nextMakeProducts,
  ) => {
    const directStock = nextMakeProducts.length === 1 ? nextMakeProducts[0].stock : undefined;
    const isRecipeCostBusiness = isFnBBusiness(nextBusinessType);
    const recipeCostValue = nextMakeProducts.reduce((total, item) => {
      const itemCost = item.stock?.averagePrice || item.stock?.latestPrice || 0;
      return total + itemCost * item.count;
    }, 0);
    const costValue = isRecipeCostBusiness && recipeCostValue > 0
      ? recipeCostValue
      : directStock?.averagePrice || directStock?.latestPrice || nextProduct.cost;
    const stockValue = directStock?.count ?? nextProduct.stock;
    const images = Array.from(new Set([nextProduct.image, ...(nextProduct.images || [])].filter(Boolean))) as string[];

    setName(nextProduct.name);
    setSku(nextProduct.sku);
    setBarcode(nextProduct.barcode || '');
    setCategory(nextProduct.category);
    setCategoryId(nextProduct.categoryId);
    setBrand(nextProduct.brandName || '');
    setBrandId(nextProduct.brandId);
    setCost((current) => {
      const nextCost = formatNumberInput(costValue);
      return nextCost || current;
    });
    setPrice(formatNumberInput(nextProduct.price));
    setSalePrice(formatNumberInput(nextProduct.priceSale));
    setSaleUnit(nextProduct.saleUnit || (nextProduct as any).sale_unit || '');
    setUnit(directStock?.unit || '');
    setStock(formatNumberInput(stockValue));
    setStockPaid('');
    setStockSupplier('');
    setDirectSupplierSearch('');
    setDirectSupplierPickerVisible(false);
    setMinStock(formatNumberInput(nextProduct.minStock || 5));
    setSelectedIce((nextProduct.iceOptions || []).map(optionName).filter(Boolean));
    setSelectedSugar((nextProduct.sugarOptions || []).map(optionName).filter(Boolean));
    setFnbSizeOptions(isRecipeCostBusiness ? buildFnbSizeOptions(nextProduct.sizeOptions || []) : []);
    setFnbToppingOptions(isRecipeCostBusiness ? buildFnbToppingOptions(nextProduct.toppings || []) : []);
    setAddedSizeOptions([]);
    setSizeSuggestSearch('');
    setSelectedSizeSuggestions([]);
    setSizeSuggestModalVisible(false);
    setIsOnline(nextProduct.isOnline);
    setAllowOversell(nextProduct.allowOversell);
    setVatApplied(nextProduct.vatApplied);
    setProductImages(images.map((uri) => makePhotoItem(uri)));
    setSelectedPhotoId(null);
    setVariantSizeOptions(nextProduct.sizeOptions || []);
    setVariantColorOptions(nextProduct.colorOptions || []);
    setVariantMaterialOptions(nextProduct.materialOptions || []);
    setDraftVariants((nextProduct.variants || []).map(mapProductVariantToDraft));
    setRecipeIngredients((isRecipeCostBusiness || nextMakeProducts.length > 1)
      ? nextMakeProducts.map((item, index) => ({
          id: `recipe-${item.stock?.id || index}-${index}`,
          stock_id: item.stock?.id ?? null,
          stock_name: item.stock?.name || t('productEdit.ingredient'),
          unit: item.stock?.unit || '',
          quantity: String(item.count || 1),
          price: formatNumberInput(item.stock?.averagePrice || item.stock?.latestPrice || 0),
          is_new_stock: false,
          stock_count: formatNumberInput(item.stock?.count || 0),
        }))
      : []);
    const normalizedComboItems = (nextProduct.comboItems || []).map(mapComboItemToDraft);
    setComboProducts(normalizedComboItems);
    setComboByProduct(!isRecipeCostBusiness && normalizedComboItems.length > 0);
    setInventoryMode(
      isRecipeCostBusiness || normalizedComboItems.length > 0 || nextMakeProducts.length > 1
        ? 'recipe'
        : 'direct',
    );
    setComboSearch('');
    setActiveComboProductId(null);
    setAllMakeProducts(nextAllMakeProducts);
  }, []);

  const loadDetail = useCallback(
    async (showRefresh = false) => {
      if (!editId) return;

      setError(null);
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const detail = await getProductDetail(editId);
        setProduct(detail.product);
        setBusinessType(detail.businessType);
        setMakeProducts(detail.makeProducts);
        setAllMakeProducts(detail.allMakeProducts || detail.makeProducts);
        hydrateForm(detail.product, detail.makeProducts, detail.businessType, detail.allMakeProducts || detail.makeProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('productEdit.detailLoadError'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [editId, hydrateForm],
  );

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);
  useRealtimeRefresh(['products', 'inventory', 'orders'], () => {
    if (!editId) return;
    loadDetail(true);
  });

  useEffect(() => {
    if (!editId) {
      setSku((current) => current || generateProductSku());
    }
  }, [editId]);

  useEffect(() => {
    if (editId) return;

    let mounted = true;
    getBusinessType()
      .then((type) => {
        if (mounted) setBusinessType(type);
      })
      .catch(() => {
        if (mounted) setBusinessType('');
      });

    return () => {
      mounted = false;
    };
  }, [editId]);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const nextCategories = await listCategories();
      setCategories(nextCategories);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('productEdit.categoryLoadError'));
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadBrands = useCallback(async () => {
    setLoadingBrands(true);
    try {
      const nextBrands = await listBrands();
      setBrands((current) => mergeBrandOptions(current, nextBrands));
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('productEdit.brandLoadError'));
    } finally {
      setLoadingBrands(false);
    }
  }, []);

  const loadUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const nextUnits = await listStockUnits();
      setBackendUnits(nextUnits);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('productEdit.unitLoadError'));
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  const loadRecipeStocks = useCallback(async (search = '') => {
    setLoadingRecipeStocks(true);
    try {
      const nextStocks = await listStocks(search);
      setRecipeStocks(nextStocks);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('productEdit.stockLoadError'));
    } finally {
      setLoadingRecipeStocks(false);
    }
  }, []);

  const loadComboProductsCatalog = useCallback(async () => {
    try {
      const nextProducts = await listAllProducts();
      setComboProductsCatalog(
        nextProducts.filter((item) => (editId ? item.id !== editId : true)),
      );
    } catch (_err) {
      setComboProductsCatalog([]);
    }
  }, [editId]);

  const loadAllMakeProducts = useCallback(async () => {
    try {
      const nextMakeProducts = await listMakeProducts();
      setAllMakeProducts(nextMakeProducts);
    } catch (_err) {
      setAllMakeProducts([]);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadBrands();
    loadUnits();
    loadRecipeStocks();
    loadComboProductsCatalog();
    if (!editId) {
      loadAllMakeProducts();
    }
  }, [editId, loadAllMakeProducts, loadBrands, loadCategories, loadComboProductsCatalog, loadRecipeStocks, loadUnits]);

  useEffect(() => {
    let mounted = true;

    loadCustomUnitsForBusinessType(businessType)
      .then((units) => {
        if (mounted) setCustomUnits(units);
      })
      .catch(() => {
        if (mounted) setCustomUnits([]);
      });

    return () => {
      mounted = false;
    };
  }, [businessType]);

  useEffect(() => {
    if (!editId && businessType === 'cafe') {
      setSelectedIce((current) => (current.length > 0 ? current : FNB_PERCENT_OPTIONS));
      setSelectedSugar((current) => (current.length > 0 ? current : FNB_PERCENT_OPTIONS));
    }
  }, [businessType, editId]);

  useEffect(() => {
    if (!recipeModalVisible) {
      recipeSheetTranslateY.setValue(32);
      return;
    }
    Animated.timing(recipeSheetTranslateY, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [recipeModalVisible, recipeSheetTranslateY]);

  useEffect(() => {
    if (!variantModalVisible) {
      variantSheetTranslateY.setValue(32);
      return;
    }
    Animated.timing(variantSheetTranslateY, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [variantModalVisible, variantSheetTranslateY]);

  const profitMeta = useMemo(() => {
    const costNum = parseCurrency(cost);
    const priceNum = parseCurrency(price);
    const profit = priceNum - costNum;
    const percent = priceNum > 0 ? Math.round((profit / priceNum) * 100) : 0;
    return { profit, percent };
  }, [cost, price]);

  const photos = productImages;

  const isFnB = isFnBBusiness(businessType);
  const isCafe = businessType === 'cafe';
  const isRetail = isRetailBusiness(businessType);
  const comboExpansion = useMemo(
    () => expandComboProductsToIngredients(comboProducts, allMakeProducts),
    [allMakeProducts, comboProducts],
  );
  const effectiveRecipeIngredients = comboByProduct ? comboExpansion.ingredients : recipeIngredients;
  const hasComboConfig = effectiveRecipeIngredients.length > 0 || comboProducts.length > 0;
  const showBarcode = !isFnB;
  const variants: DisplayVariant[] = draftVariants.length > 0 ? draftVariants : product?.variants || [];
  const canUseDirectInventoryMode = !isFnB && variants.length === 0 && makeProducts.length <= 1;
  const useRecipeMode = isFnB || !canUseDirectInventoryMode || inventoryMode === 'recipe';
  const hasRecipeConfig = isFnB || (useRecipeMode && hasComboConfig);
  const showVariantBuilder = !isFnB;
  const showVariantCard = showVariantBuilder || variants.length > 0;
  const hasVariantPricing = variants.length > 0;
  const hasRecipeBasedInventory = !isFnB && useRecipeMode && hasComboConfig;
  const hasVariantInventory = !isFnB && !hasRecipeBasedInventory && variants.length > 0;
  const showDirectStock = !isFnB && canUseDirectInventoryMode && !useRecipeMode;
  const showRetailImportCard = isRetail && !isEdit && showDirectStock;
  const showRecipeInventoryNotice = !isFnB && hasRecipeBasedInventory;
  const isDirectStockReadOnly = isEdit && showDirectStock;
  const variantLabels = useMemo(() => {
    if (businessType === 'retail') {
      return {
        size: t('productEdit.specification'),
        color: t('productEdit.volumeWeight'),
        material: t('productEdit.flavor'),
      };
    }
    if (businessType === 'cosmetics') {
      return {
        size: t('productEdit.capacity'),
        color: t('productEdit.colorTone'),
        material: t('productEdit.productLine'),
      };
    }
    return {
      size: t('productEdit.size'),
      color: t('productEdit.color'),
      material: t('productEdit.material'),
    };
  }, [businessType, t]);
  const unitOptions = useMemo(
    () => getUnitsForBusinessType(businessType, backendUnits, unit, customUnits),
    [backendUnits, businessType, customUnits, unit],
  );
  const sizeOptions = useMemo(
    () => sortOptionsSmallToLarge([...(product?.sizeOptions || []), ...variantSizeOptions, ...addedSizeOptions]),
    [addedSizeOptions, product?.sizeOptions, variantSizeOptions],
  );
  const sizeSuggestions = useMemo(
    () => buildSizeSuggestions(sizeOptions).map(optionToSelectOption),
    [sizeOptions],
  );
  const draftRecipeCost = effectiveRecipeIngredients.reduce((total, item) => {
    const itemCost = parseCurrency(item.price || item.stock_cost_price || '');
    return total + itemCost * parseDecimalInput(item.quantity || '0');
  }, 0);
  const persistedRecipeCost = makeProducts.reduce((total, item) => {
    const itemCost = item.stock?.averagePrice || item.stock?.latestPrice || 0;
    return total + itemCost * item.count;
  }, 0);
  const recipeCost = draftRecipeCost || persistedRecipeCost;
  const variantInventorySummary = useMemo(() => {
    const threshold = parseCurrency(minStock);
    const summary = variants.reduce(
      (acc, variant) => {
        const quantity = Math.max(0, parseDecimalInput(getVariantQuantity(variant)));
        const costPerUnit = Math.max(0, getVariantCost(variant) || 0);
        acc.totalStock += quantity;
        acc.totalValue += quantity * costPerUnit;
        if (quantity <= 0) {
          acc.outOfStock += 1;
        } else if (threshold > 0 && quantity <= threshold) {
          acc.lowStock += 1;
        }
        return acc;
      },
      { totalStock: 0, totalValue: 0, outOfStock: 0, lowStock: 0 },
    );
    return summary;
  }, [minStock, variants]);
  const recipeInventorySummary = useMemo(() => {
    const rows = effectiveRecipeIngredients
      .filter((ingredient) => ingredient.stock_name.trim().length > 0)
      .map((ingredient) => {
        const usageQty = Math.max(0, parseDecimalInput(ingredient.quantity || '0'));
        const availableQty = Math.max(0, parseDecimalInput(ingredient.stock_count || ingredient.stock_quantity || '0'));
        const costPerUnit = Math.max(0, parseCurrency(ingredient.price || ingredient.stock_cost_price || '0'));
        const combosPossible = usageQty > 0 ? Math.floor(availableQty / usageQty) : 0;
        return {
          id: ingredient.id,
          name: ingredient.stock_name.trim(),
          unit: ingredient.unit.trim(),
          usageQty,
          usageDisplay: ingredient.quantity || '0',
          availableQty,
          availableDisplay: ingredient.stock_count || ingredient.stock_quantity || '0',
          combosPossible,
          inventoryValue: availableQty * costPerUnit,
          insufficient: usageQty > 0 && availableQty < usageQty,
        };
      });

    const totalValue = rows.reduce((sum, row) => sum + row.inventoryValue, 0);
    const trackedRows = rows.filter((row) => row.usageQty > 0);
    const maxComboByStock = trackedRows.length > 0
      ? Math.floor(Math.min(...trackedRows.map((row) => row.combosPossible)))
      : 0;
    const insufficientCount = rows.filter((row) => row.insufficient).length;

    return {
      rows,
      totalValue,
      maxComboByStock,
      insufficientCount,
    };
  }, [effectiveRecipeIngredients]);
  const stockValueNum = parseCurrency(stock);
  const costValueNum = parseCurrency(cost);
  const remainingStockValue = stockValueNum * costValueNum;
  const totalImportedValue = stockValueNum * costValueNum;

  useEffect(() => {
    if (hasRecipeConfig && recipeCost > 0) {
      setCost(formatNumberInput(recipeCost));
    }
  }, [hasRecipeConfig, recipeCost]);

  const handleSave = async () => {
    if (saving) return;

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedBrand = brand.trim();
    const trimmedUnit = unit.trim();
    const trimmedSaleUnit = saleUnit.trim();
    const trimmedBarcode = barcode.trim();
    const trimmedPromoPrice = salePrice.trim();
    const priceValue = parseCurrency(price);
    const salePriceValue = parseCurrency(salePrice);
    const hasPromoPrice = trimmedPromoPrice.length > 0 && salePriceValue > 0;
    const normalizedPriceSale = hasPromoPrice ? String(salePriceValue) : '0';
    const stockValue = hasVariantInventory
      ? Math.max(0, Math.round(variantInventorySummary.totalStock))
      : parseCurrency(stock);
    const costValue = parseCurrency(cost);
    const paidValue = parseCurrency(stockPaid);
    const normalizedStockSupplier = stockSupplier.trim() || brand.trim();
    const missing: string[] = [];
    const normalizedComboProducts = !isFnB && comboByProduct
      ? comboProducts
        .map((item) => ({
          product_id: item.product_id ? Number(item.product_id) : 0,
          product_name: item.product_name.trim(),
          quantity: normalizeDecimalInput(item.quantity || '1') || '1',
        }))
        .filter((item) => item.product_id > 0 && parseDecimalInput(item.quantity) > 0)
      : [];
    const normalizedIngredients = effectiveRecipeIngredients
      .map((ingredient) => {
        const { stock_count: _stockCount, ...rest } = ingredient;
        return {
          ...rest,
          stock_name: ingredient.stock_name.trim(),
          unit: ingredient.unit.trim(),
          quantity: normalizeDecimalInput(ingredient.quantity || '1') || '1',
          price: String(parseCurrency(ingredient.price || ingredient.stock_cost_price || '')),
          stock_cost_price: String(parseCurrency(ingredient.stock_cost_price || ingredient.price || '')),
          stock_quantity: String(parseCurrency(ingredient.stock_quantity || '')),
          stock_paid: String(parseCurrency(ingredient.stock_paid || '')),
          stock_supplier: ingredient.stock_supplier?.trim() || '',
        };
      })
      .filter((ingredient) => ingredient.stock_name.length > 0);
    const shouldUseRecipePayload = useRecipeMode;
    const usesRecipe = shouldUseRecipePayload && (isFnB || normalizedIngredients.length > 0 || normalizedComboProducts.length > 0);
    const payloadIngredients = shouldUseRecipePayload ? normalizedIngredients : [];
    const payloadComboProducts = shouldUseRecipePayload ? normalizedComboProducts : [];

    if (!trimmedName) missing.push(t('productEdit.productName'));
    if (!categoryId && !trimmedCategory) missing.push(t('productEdit.category'));
    if (!priceValue) missing.push(t('productEdit.salePrice'));
    if (shouldUseRecipePayload && normalizedIngredients.length === 0) missing.push(t('productEdit.recipe'));
    if (!isFnB && shouldUseRecipePayload && comboByProduct && normalizedComboProducts.length === 0) missing.push(t('productEdit.recipe'));
    if (!isFnB && !shouldUseRecipePayload) {
      if (!hasVariantInventory && !stockValue) missing.push(t('productEdit.importQuantity'));
      if (!costValue) missing.push(t('productEdit.costPrice'));
    }

    if (missing.length > 0) {
      Alert.alert(t('productEdit.missingInfo'), t('productEdit.missingFields', { fields: missing.join(', ') }));
      return;
    }

    if (!isFnB && !shouldUseRecipePayload && paidValue > totalImportedValue) {
      Alert.alert(t('productEdit.invalidPaidAmountTitle'), t('productEdit.invalidPaidAmountMessage'));
      return;
    }

    if (!isFnB && shouldUseRecipePayload && comboByProduct && comboExpansion.unresolved.length > 0) {
      const unresolvedNames = comboExpansion.unresolved
        .map((item) => item.productName || `#${item.productId || ''}`)
        .filter(Boolean)
        .join(', ');
      Alert.alert(
        t('productEdit.missingRecipe'),
        t('productEdit.comboMissingRecipeMessage', { products: unresolvedNames || t('productEdit.unknownReason') }),
      );
      return;
    }

    const invalidIngredient = payloadIngredients.find((ingredient) =>
      !ingredient.stock_name ||
      !parseDecimalInput(ingredient.quantity) ||
      !parseCurrency(ingredient.price) ||
      (ingredient.is_new_stock && (!ingredient.unit || !parseCurrency(ingredient.stock_cost_price || '') || !parseCurrency(ingredient.stock_quantity || ''))),
    );
    if (shouldUseRecipePayload && invalidIngredient) {
      Alert.alert(
        t('productEdit.missingRecipe'),
        t('productEdit.missingRecipeMessage'),
      );
      return;
    }

    const imageUris = productImages
      .map((photo) => photo.fallbackUri || photo.uri)
      .filter((uri): uri is string => Boolean(uri));
    const activeSale = hasPromoPrice && salePriceValue < priceValue;
    const normalizedFnbSizeOptions = fnbSizeOptions
      .map(normalizeFnbOption)
      .filter((option) => optionName(option).trim().length > 0);
    const normalizedFnbToppingOptions = fnbToppingOptions
      .map(normalizeFnbOption)
      .filter((option) => optionName(option).trim().length > 0);
    const sizePayload = (isFnB
      ? normalizedFnbSizeOptions.filter((option) => {
          const isDefaultSize = FNB_DEFAULT_SIZE_NAMES.some(
            (name) => name.toLowerCase() === optionName(option).trim().toLowerCase(),
          );
          const optionPrice = parseCurrency(String(option.value || '0'));
          return !(isDefaultSize && optionPrice === 0);
        })
      : sizeOptions
    ).map(toImportOption);
    const toppingPayload = (isFnB ? normalizedFnbToppingOptions : []).map(toImportOption);
    const icePayload = isCafe
      ? Array.from(new Set(selectedIce.map((value) => String(value).trim()).filter(Boolean)))
      : [];
    const sugarPayload = isCafe
      ? Array.from(new Set(selectedSugar.map((value) => String(value).trim()).filter(Boolean)))
      : [];
    const colorPayload = showVariantBuilder ? variantColorOptions.map(toImportOption) : [];
    const materialPayload = showVariantBuilder ? variantMaterialOptions.map(toImportOption) : [];
    const variantsPayload = showVariantBuilder ? draftVariants.map(toBackendVariant) : [];
    const generatedSku = sku.trim() || generateProductSku();
    const sizeTitlePayload = product?.sizeTitle || t('productEdit.size');
    const toppingTitlePayload = product?.toppingTitle || 'Topping';
    const iceTitlePayload = product?.iceTitle || t('productEdit.ice');
    const sugarTitlePayload = product?.sugarTitle || t('productEdit.sugar');
    const colorTitlePayload = product?.colorTitle || variantLabels.color;
    const materialTitlePayload = product?.materialTitle || variantLabels.material;
    const commonPayload = {
      name: trimmedName,
      sku: generatedSku,
      barcode: isFnB ? '' : trimmedBarcode,
      category_id: categoryId || null,
      category_name: categoryId ? category : trimmedCategory,
      brand_id: brandId || null,
      brand_name: trimmedBrand,
      price: String(priceValue),
      price_sale: normalizedPriceSale,
      active_sale: activeSale,
      unit: isFnB ? '' : trimmedUnit,
      sale_unit: isFnB ? trimmedSaleUnit : '',
      image: imageUris[0] || '',
      images: imageUris,
      sizes: sizePayload,
      size: sizePayload,
      toppings: toppingPayload,
      topping: toppingPayload,
      ice: icePayload,
      sugar: sugarPayload,
      color: colorPayload,
      material: materialPayload,
      variants: variantsPayload,
      sizeTitle: sizeTitlePayload,
      toppingTitle: toppingTitlePayload,
      iceTitle: iceTitlePayload,
      sugarTitle: sugarTitlePayload,
      colorTitle: colorTitlePayload,
      materialTitle: materialTitlePayload,
      bestter: product?.bestter || false,
      softHide: !isOnline,
    };

    if (isEdit) {
      if (!editId) return;
      const updatePayload = new FormData();
      const appendField = (key: string, value: string | number | boolean | null | undefined) => {
        if (value === undefined || value === null) return;
        updatePayload.append(key, String(value));
      };
      const imagesOld = Array.from(
        new Set(
          productImages
            .map((photo) => {
              if (isRemoteImageUri(photo.uri)) return photo.uri;
              if (isUploadableLocalUri(photo.uri)) return null;
              if (isDataImageUri(photo.uri)) return photo.uri;
              if (isRemoteImageUri(photo.fallbackUri)) return photo.fallbackUri;
              if (isDataImageUri(photo.fallbackUri)) return photo.fallbackUri;
              return null;
            })
            .filter((uri): uri is string => Boolean(uri)),
        ),
      );
      const uploadableImages = productImages.filter((photo) => isUploadableLocalUri(photo.uri));

      uploadableImages.forEach((photo, index) => {
        updatePayload.append('images', {
          uri: photo.uri,
          name: buildUploadFilename(photo.uri, index),
          type: guessUploadMimeType(photo.uri, photo.fallbackUri),
        } as any);
      });

      if (imagesOld.length > 0) {
        appendField('images_old', JSON.stringify(imagesOld));
      }

      appendField('id', editId);
      appendField('name', trimmedName);
      if (!isFnB && trimmedBarcode) appendField('barcode', trimmedBarcode);
      appendField('sku', generatedSku);
      appendField('price', String(priceValue));
      appendField('price_sale', normalizedPriceSale);
      appendField('active_sale', activeSale);
      appendField('category_id', categoryId || product?.categoryId || '');
      appendField('brand_id', brandId || product?.brandId || '');
      appendField('brand_name', trimmedBrand);
      appendField('unit', isFnB ? '' : trimmedUnit);
      appendField('sale_unit', isFnB ? trimmedSaleUnit : '');

      appendField('size', JSON.stringify(sizePayload));
      appendField('sizeOptions', JSON.stringify(sizePayload));
      appendField('colorOptions', JSON.stringify(colorPayload));
      appendField('materialOptions', JSON.stringify(materialPayload));
      appendField('topping', JSON.stringify(toppingPayload));
      appendField('ice', JSON.stringify(icePayload));
      appendField('sugar', JSON.stringify(sugarPayload));
      appendField('variants', JSON.stringify(variantsPayload));
      appendField('dynamic_form', JSON.stringify({}));

      appendField('sizeTitle', sizeTitlePayload);
      appendField('toppingTitle', toppingTitlePayload);
      appendField('iceTitle', iceTitlePayload);
      appendField('sugarTitle', sugarTitlePayload);
      appendField('colorTitle', colorTitlePayload);
      appendField('materialTitle', materialTitlePayload);
      if (!isFnB) {
        appendField('combo_items', JSON.stringify(payloadComboProducts));
      }

      if (usesRecipe) {
        appendField('ingredients', JSON.stringify(payloadIngredients));
      } else {
        appendField('stock_quantity', String(stockValue));
        appendField('stock_cost_price', String(costValue));
        appendField('stock_supplier', normalizedStockSupplier);
        appendField('stock_paid', String(parseCurrency(stockPaid)));
      }

      try {
        setSaving(true);
        const result = await updateProduct(updatePayload);
        Alert.alert(t('profile.successTitle'), result.responseText || result.message || t('productEdit.updated'), [
          { text: 'OK', onPress: () => loadDetail(true) },
        ]);
      } catch (err) {
        Alert.alert(t('common.error'), err instanceof Error ? err.message : t('productEdit.updateError'));
      } finally {
        setSaving(false);
      }
      return;
    }

    const payload = {
      ...commonPayload,
      ingredients: payloadIngredients,
      combo_items: payloadComboProducts,
      is_combo: !isFnB && (payloadIngredients.length > 0 || payloadComboProducts.length > 0),
      stock_quantity: usesRecipe ? undefined : String(stockValue),
      stock_cost_price: usesRecipe ? undefined : String(costValue),
      stock_supplier: usesRecipe ? undefined : normalizedStockSupplier,
      stock_paid: usesRecipe ? undefined : String(parseCurrency(stockPaid)),
      stock_remaining: usesRecipe ? undefined : String(stockValue),
    };

    const uploadableImages = productImages.filter((photo) => isUploadableLocalUri(photo.uri));

    try {
      setSaving(true);
      if (uploadableImages.length > 0 && !shouldUseRecipePayload) {
        const createPayload = new FormData();
        const appendField = (key: string, value: string | number | boolean | null | undefined) => {
          if (value === undefined || value === null) return;
          createPayload.append(key, String(value));
        };

        appendField('name', trimmedName);
        if (!isFnB && trimmedBarcode) appendField('barcode', trimmedBarcode);
        appendField('sku', generatedSku);
        appendField('price', String(priceValue));
        appendField('price_sale', normalizedPriceSale);
        appendField('active_sale', activeSale);
        appendField('category_id', categoryId || '');
        appendField('brand_id', brandId || '');
        appendField('brand_name', trimmedBrand);
        appendField('unit', isFnB ? '' : trimmedUnit);
        appendField('sale_unit', isFnB ? trimmedSaleUnit : '');
        appendField('size', JSON.stringify(sizePayload));
        appendField('sizeOptions', JSON.stringify(sizePayload));
        appendField('colorOptions', JSON.stringify(colorPayload));
        appendField('materialOptions', JSON.stringify(materialPayload));
        appendField('topping', JSON.stringify(toppingPayload));
        appendField('ice', JSON.stringify(icePayload));
        appendField('sugar', JSON.stringify(sugarPayload));
        appendField('variants', JSON.stringify(variantsPayload));
        appendField('dynamic_form', JSON.stringify({}));
        appendField('sizeTitle', sizeTitlePayload);
        appendField('toppingTitle', toppingTitlePayload);
        appendField('iceTitle', iceTitlePayload);
        appendField('sugarTitle', sugarTitlePayload);
        appendField('colorTitle', colorTitlePayload);
        appendField('materialTitle', materialTitlePayload);
        if (!isFnB) {
          appendField('combo_items', JSON.stringify(payloadComboProducts));
        }
        if (usesRecipe) {
          appendField('ingredients', JSON.stringify(payloadIngredients));
        } else {
          appendField('stock_quantity', String(stockValue));
          appendField('stock_cost_price', String(costValue));
          appendField('stock_supplier', normalizedStockSupplier);
          appendField('stock_paid', String(parseCurrency(stockPaid)));
        }

        uploadableImages.forEach((photo, index) => {
          createPayload.append('images', {
            uri: photo.uri,
            name: buildUploadFilename(photo.uri, index),
            type: guessUploadMimeType(photo.uri, photo.fallbackUri),
          } as any);
        });

        const result = await createProduct(createPayload);
        Alert.alert(t('profile.successTitle'), result.responseText || result.message || t('productEdit.created'), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      const result = await createProduct(payload);
      Alert.alert(t('profile.successTitle'), result.responseText || result.message || t('productEdit.created'), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('productEdit.createError'));
    } finally {
      setSaving(false);
    }
  };

  const handleNumericChange = useCallback((setter: (value: string) => void) => {
    return (value: string) => setter(formatNumberInput(value));
  }, []);

  const addVariantOption = useCallback((
    rawName: string,
    setter: React.Dispatch<React.SetStateAction<ProductVariantOption[]>>,
    reset: (value: string) => void,
  ) => {
    const nextName = rawName.trim();
    if (!nextName) return;

    setter((current) => {
      const exists = current.some((item) => optionName(item).toLowerCase() === nextName.toLowerCase());
      return exists ? current : [...current, makeOption(nextName)];
    });
    reset('');
  }, []);

  const removeVariantOption = useCallback((
    option: ProductVariantOption,
    setter: React.Dispatch<React.SetStateAction<ProductVariantOption[]>>,
  ) => {
    const removedName = optionName(option);
    setter((current) => current.filter((item) => optionName(item) !== removedName));
    setDraftVariants((current) =>
      current.filter((variant) =>
        optionName(variant.size) !== removedName &&
        optionName(variant.color) !== removedName &&
        optionName(variant.material) !== removedName,
      ),
    );
  }, []);

  const handleGenerateVariants = useCallback(() => {
    const hasAttributes = variantSizeOptions.length || variantColorOptions.length || variantMaterialOptions.length;
    if (!hasAttributes) {
      Alert.alert(t('productEdit.missingAttributes'), t('productEdit.missingAttributesMessage'));
      return;
    }

    const effectiveSizes = variantSizeOptions.length ? variantSizeOptions : [makeOption('')];
    const effectiveColors = variantColorOptions.length ? variantColorOptions : [makeOption('')];
    const effectiveMaterials = variantMaterialOptions.length ? variantMaterialOptions : [makeOption('')];
    const existingMap = new Map(draftVariants.map((variant) => {
      const key = `${optionName(variant.size) || 'no-size'}-${optionName(variant.color) || 'no-color'}-${optionName(variant.material) || 'no-material'}`;
      return [key, variant];
    }));
    const baseSku = sku || generateProductSku();
    const nextVariants: DraftProductVariant[] = [];

    effectiveSizes.forEach((sizeOption) => {
      effectiveColors.forEach((colorOption) => {
        effectiveMaterials.forEach((materialOption) => {
          const sizeName = optionName(sizeOption);
          const colorName = optionName(colorOption);
          const materialName = optionName(materialOption);
          const key = `${sizeName || 'no-size'}-${colorName || 'no-color'}-${materialName || 'no-material'}`;
          const existing = existingMap.get(key);
          const nameParts = [sizeName, colorName, materialName].filter(Boolean);

          nextVariants.push({
            id: existing?.id || key,
            name: nameParts.join(' - '),
            sku: existing?.sku || `${baseSku}.${nextVariants.length + 1}`,
            quantity: existing?.quantity || stock || '1',
            price: existing?.price || price || '0',
            cost_price: existing?.cost_price || cost || '',
            promo_price: existing?.promo_price || salePrice || '',
            exchange_value: existing?.exchange_value || '1',
            date_start: existing?.date_start || null,
            date_end: existing?.date_end || null,
            size: sizeName ? sizeOption : undefined,
            color: colorName ? colorOption : undefined,
            material: materialName ? materialOption : undefined,
            attributes: {
              size: sizeName ? sizeOption : undefined,
              color: colorName ? colorOption : undefined,
              material: materialName ? materialOption : undefined,
            },
          });
        });
      });
    });

    setDraftVariants(nextVariants.map((variant, index) => ({ ...variant, sku: `${baseSku}.${index + 1}` })));
  }, [
    cost,
    draftVariants,
    price,
    salePrice,
    sku,
    stock,
    variantColorOptions,
    variantMaterialOptions,
    variantSizeOptions,
  ]);

  const updateDraftVariant = useCallback((variantId: string, field: keyof DraftProductVariant, value: string) => {
    setDraftVariants((current) =>
      current.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              [field]: ['quantity', 'price', 'cost_price', 'promo_price', 'exchange_value'].includes(field)
                ? formatNumberInput(value)
                : value,
            }
          : variant,
      ),
    );
  }, []);

  const applyMasterVariant = useCallback(() => {
    setDraftVariants((current) =>
      current.map((variant) => ({
        ...variant,
        quantity: masterVariant.quantity || variant.quantity,
        price: masterVariant.price || variant.price,
        cost_price: masterVariant.cost_price || variant.cost_price,
        promo_price: masterVariant.promo_price || variant.promo_price,
      })),
    );
  }, [masterVariant]);

  const deleteDraftVariant = useCallback((variantId: string) => {
    setDraftVariants((current) => current.filter((variant) => variant.id !== variantId));
  }, []);

  const handleSaveVariantModal = useCallback(() => {
    const hasAttributes = variantSizeOptions.length || variantColorOptions.length || variantMaterialOptions.length;
    if (hasAttributes && draftVariants.length === 0) {
      Alert.alert(t('productEdit.noVariantsCreated'), t('productEdit.noVariantsCreatedMessage'));
      return;
    }

    const invalid = draftVariants.some((variant) =>
      !parseCurrency(variant.price) || !parseCurrency(variant.cost_price) || !parseCurrency(variant.quantity),
    );
    if (invalid) {
      Alert.alert(t('productEdit.missingInfo'), t('productEdit.missingVariantInfo'));
      return;
    }

    setVariantModalVisible(false);
  }, [draftVariants, variantColorOptions.length, variantMaterialOptions.length, variantSizeOptions.length]);

  const updateRecipeIngredient = useCallback((ingredientId: string, updates: Partial<RecipeIngredient>) => {
    setRecipeIngredients((current) =>
      current.map((ingredient) => (ingredient.id === ingredientId ? { ...ingredient, ...updates } : ingredient)),
    );
  }, []);

  const addRecipeIngredient = useCallback(() => {
    setRecipeIngredients((current) => [
      ...current,
      {
        id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        stock_id: null,
        stock_name: '',
        unit: unit || '',
        quantity: '1',
        price: '',
        is_new_stock: false,
        stock_count: '',
        stock_quantity: '',
        stock_cost_price: '',
        stock_supplier: '',
        stock_paid: '',
      },
    ]);
  }, [unit]);

  const removeRecipeIngredient = useCallback((ingredientId: string) => {
    setRecipeIngredients((current) => current.filter((ingredient) => ingredient.id !== ingredientId));
    setActiveRecipeIngredientId((current) => (current === ingredientId ? null : current));
    setRecipeSearch((current) => (current ? '' : current));
    setActiveSupplierIngredientId((current) => (current === ingredientId ? null : current));
    setSupplierSearch((current) => (current ? '' : current));
  }, []);

  const selectRecipeStock = useCallback((ingredientId: string, stockItem: ProductStock) => {
    updateRecipeIngredient(ingredientId, {
      stock_id: stockItem.id ?? null,
      stock_name: stockItem.name,
      unit: stockItem.unit || '',
      price: formatNumberInput(stockItem.averagePrice || stockItem.latestPrice || 0),
      stock_cost_price: formatNumberInput(stockItem.averagePrice || stockItem.latestPrice || 0),
      stock_count: formatNumberInput(stockItem.count || 0),
      is_new_stock: false,
    });
    setActiveRecipeIngredientId(null);
    setRecipeSearch('');
  }, [updateRecipeIngredient]);

  const updateComboProduct = useCallback((comboId: string, updates: Partial<ComboProductDraft>) => {
    setComboProducts((current) =>
      current.map((item) => (item.id === comboId ? { ...item, ...updates } : item)),
    );
  }, []);

  const addComboProduct = useCallback(() => {
    setComboProducts((current) => [
      ...current,
      {
        id: buildComboDraftId(),
        product_id: null,
        product_name: '',
        quantity: '1',
      },
    ]);
  }, []);

  const removeComboProduct = useCallback((comboId: string) => {
    setComboProducts((current) => current.filter((item) => item.id !== comboId));
    setActiveComboProductId((current) => (current === comboId ? null : current));
    setComboSearch((current) => (current ? '' : current));
  }, []);

  const selectComboProduct = useCallback((comboId: string, selectedProduct: Product) => {
    updateComboProduct(comboId, {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
    });
    setActiveComboProductId(null);
    setComboSearch('');
  }, [updateComboProduct]);

  const openComboProductSelect = useCallback((comboId: string) => {
    if (activeComboProductId === comboId) {
      setActiveComboProductId(null);
      setComboSearch('');
      return;
    }
    setActiveRecipeIngredientId(null);
    setRecipeSearch('');
    setActiveSupplierIngredientId(null);
    setSupplierSearch('');
    setActiveComboProductId(comboId);
    setComboSearch('');
  }, [activeComboProductId]);

  const openRecipeStockSelect = useCallback((ingredientId: string) => {
    if (activeRecipeIngredientId === ingredientId) {
      setActiveRecipeIngredientId(null);
      setRecipeSearch('');
      return;
    }

    setActiveComboProductId(null);
    setComboSearch('');
    setActiveSupplierIngredientId(null);
    setSupplierSearch('');
    setActiveRecipeIngredientId(ingredientId);
    setRecipeSearch('');
    loadRecipeStocks('');
  }, [activeRecipeIngredientId, loadRecipeStocks]);

  const handleChangeComboMode = useCallback((nextComboByProduct: boolean) => {
    if (isFnB) return;

    setActiveRecipeIngredientId(null);
    setRecipeSearch('');
    setActiveComboProductId(null);
    setComboSearch('');
    setActiveSupplierIngredientId(null);
    setSupplierSearch('');
    setComboByProduct(nextComboByProduct);

    if (nextComboByProduct) {
      if (comboProducts.length === 0) {
        addComboProduct();
      }
      return;
    }

    if (recipeIngredients.length === 0) {
      addRecipeIngredient();
    }
  }, [addComboProduct, addRecipeIngredient, comboProducts.length, isFnB, recipeIngredients.length]);

  const handleSaveRecipeModal = useCallback(() => {
    if (!isFnB && comboByProduct) {
      const invalidCombo = comboProducts.some((item) => !item.product_id || !parseDecimalInput(item.quantity || '0'));
      if (comboProducts.length === 0 || invalidCombo) {
        Alert.alert(
          t('productEdit.missingRecipe'),
          t('productEdit.missingComboProductsMessage'),
        );
        return;
      }
      setRecipeModalVisible(false);
      setActiveComboProductId(null);
      setComboSearch('');
      return;
    }

    const invalid = recipeIngredients.some((ingredient) =>
      !ingredient.stock_name.trim() ||
      !parseDecimalInput(ingredient.quantity) ||
      !parseCurrency(ingredient.price || ingredient.stock_cost_price || '') ||
      (ingredient.is_new_stock && (!ingredient.unit.trim() || !parseCurrency(ingredient.stock_quantity || '') || !parseCurrency(ingredient.stock_cost_price || ingredient.price || ''))),
    );

    if (invalid) {
      Alert.alert(
        t('productEdit.missingRecipe'),
        t('productEdit.missingRecipeMessageShort'),
      );
      return;
    }

    setRecipeModalVisible(false);
  }, [comboByProduct, comboProducts, isFnB, recipeIngredients]);

  const openRecipeModal = useCallback(() => {
    if (!isFnB && comboByProduct) {
      if (comboProducts.length === 0) {
        addComboProduct();
      }
      setRecipeModalVisible(true);
      return;
    }

    if (recipeIngredients.length === 0) {
      addRecipeIngredient();
    }
    setRecipeModalVisible(true);
  }, [addComboProduct, addRecipeIngredient, comboByProduct, comboProducts.length, isFnB, recipeIngredients.length]);

  const closeRecipeModal = useCallback(() => {
    if (!isFnB && comboByProduct) {
      const hasConfiguredCombo = comboProducts.some((item) => item.product_id && parseDecimalInput(item.quantity || '0'));
      if (!hasConfiguredCombo) {
        setComboProducts([]);
      }
      setActiveComboProductId(null);
      setComboSearch('');
      setRecipeModalVisible(false);
      return;
    }

    const hasConfiguredIngredient = recipeIngredients.some(isRecipeIngredientConfigured);

    if (!hasConfiguredIngredient) {
      setRecipeIngredients([]);
    }

    setActiveRecipeIngredientId(null);
    setRecipeSearch('');
    setActiveComboProductId(null);
    setComboSearch('');
    setActiveSupplierIngredientId(null);
    setSupplierSearch('');
    setRecipeModalVisible(false);
  }, [comboByProduct, comboProducts, isFnB, recipeIngredients]);

  const openSupplierModal = useCallback((ingredientId: string) => {
    setActiveRecipeIngredientId(null);
    setRecipeSearch('');
    setActiveComboProductId(null);
    setComboSearch('');
    if (!loadingBrands && brands.length === 0) {
      loadBrands();
    }
    setActiveSupplierIngredientId((current) => (current === ingredientId ? null : ingredientId));
    setSupplierSearch('');
  }, [brands.length, loadBrands, loadingBrands]);

  const closeSupplierModal = useCallback(() => {
    setSupplierSearch('');
    setActiveSupplierIngredientId(null);
  }, []);

  const handleSelectSupplier = useCallback(
    (nextSupplier: SelectOption) => {
      if (!activeSupplierIngredientId) return;
      updateRecipeIngredient(activeSupplierIngredientId, { stock_supplier: nextSupplier.name });
      closeSupplierModal();
    },
    [activeSupplierIngredientId, closeSupplierModal, updateRecipeIngredient],
  );

  const handleCreateSupplier = useCallback(
    async (supplierName: string) => {
      const normalizedName = supplierName.trim();
      if (!normalizedName || !activeSupplierIngredientId) return;

      setCreatingSupplier(true);
      try {
        const nextSupplier = await createBrand(normalizedName);
        setBrands((current) => {
          return mergeBrandOptions(current, [nextSupplier]);
        });
        updateRecipeIngredient(activeSupplierIngredientId, { stock_supplier: nextSupplier.name });
        closeSupplierModal();
      } catch (err) {
        Alert.alert(t('common.error'), err instanceof Error ? err.message : t('productEdit.createSupplierError'));
      } finally {
        setCreatingSupplier(false);
      }
    },
    [activeSupplierIngredientId, closeSupplierModal, t, updateRecipeIngredient],
  );

  const openDirectSupplierPicker = useCallback(() => {
    setActiveRecipeIngredientId(null);
    setRecipeSearch('');
    setActiveComboProductId(null);
    setComboSearch('');
    setActiveSupplierIngredientId(null);
    setSupplierSearch('');
    if (!loadingBrands && brands.length === 0) {
      loadBrands();
    }
    setDirectSupplierPickerVisible((current) => !current);
    setDirectSupplierSearch('');
  }, [brands.length, loadBrands, loadingBrands]);

  const closeDirectSupplierPicker = useCallback(() => {
    setDirectSupplierPickerVisible(false);
    setDirectSupplierSearch('');
  }, []);

  const handleSelectDirectSupplier = useCallback((nextSupplier: string) => {
    setStockSupplier(nextSupplier);
    closeDirectSupplierPicker();
  }, [closeDirectSupplierPicker]);

  const handleCreateDirectSupplier = useCallback(async (supplierName: string) => {
    const normalizedName = supplierName.trim();
    if (!normalizedName) return;

    setCreatingSupplier(true);
    try {
      const nextSupplier = await createBrand(normalizedName);
      setBrands((current) => {
        return mergeBrandOptions(current, [nextSupplier]);
      });
      setStockSupplier(nextSupplier.name);
      closeDirectSupplierPicker();
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('productEdit.createSupplierError'));
    } finally {
      setCreatingSupplier(false);
    }
  }, [closeDirectSupplierPicker, t]);

  const switchInventoryMode = useCallback((nextMode: 'direct' | 'recipe') => {
    if (isFnB || nextMode === inventoryMode || !canUseDirectInventoryMode) return;

    const hasDirectDraft = parseCurrency(stock) > 0 || parseCurrency(cost) > 0 || parseCurrency(stockPaid) > 0 || stockSupplier.trim().length > 0;
    const hasRecipeDraft = recipeIngredients.length > 0 || comboProducts.length > 0;

    const applySwitch = () => {
      if (nextMode === 'direct') {
        setRecipeIngredients([]);
        setComboProducts([]);
        setComboByProduct(false);
        setActiveRecipeIngredientId(null);
        setRecipeSearch('');
        setActiveComboProductId(null);
        setComboSearch('');
        setActiveSupplierIngredientId(null);
        setSupplierSearch('');
      } else {
        setStock('');
        setCost('');
        setStockPaid('');
        setStockSupplier('');
        setDirectSupplierSearch('');
        setDirectSupplierPickerVisible(false);
      }
      setInventoryMode(nextMode);
    };

    if ((nextMode === 'recipe' && hasDirectDraft) || (nextMode === 'direct' && hasRecipeDraft)) {
      Alert.alert(
        t('productEdit.switchModeTitle'),
        t('productEdit.switchModeMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: 'OK', style: 'destructive', onPress: applySwitch },
        ],
      );
      return;
    }

    applySwitch();
  }, [
    canUseDirectInventoryMode,
    comboProducts.length,
    cost,
    inventoryMode,
    isFnB,
    recipeIngredients.length,
    stock,
    stockPaid,
    stockSupplier,
    t,
  ]);

  const renderRecipeIngredientItem = useCallback(
    ({ item: ingredient, index }: { item: RecipeIngredient; index: number }) => {
      const itemCost = parseCurrency(ingredient.price || ingredient.stock_cost_price || '');
      const itemCount = parseDecimalInput(ingredient.quantity);
      const unitName = ingredient.unit?.trim();
      const stockImportPriceLabel = unitName
        ? `${t('productEdit.stockImportPrice')} (${unitName})`
        : t('productEdit.stockImportPrice');
      const stockImportTotal = parseCurrency(ingredient.stock_quantity || '') * parseCurrency(ingredient.stock_cost_price || '');

      return (
        <View style={styles.recipeEditCard}>
          <View style={styles.variantsHeader}>
            <Text style={styles.variantName}>{t('productEdit.ingredientNumber', { index: index + 1 })}</Text>
            <TouchableOpacity onPressIn={() => removeRecipeIngredient(ingredient.id)} activeOpacity={0.85}>
              <Ionicons name="trash-outline" size={17} color={Colors.danger} />
            </TouchableOpacity>
          </View>

          <FieldCard
            label={t('productEdit.ingredientName')}
            value={ingredient.stock_name}
            onPress={() => openRecipeStockSelect(ingredient.id)}
            placeholder={t('productEdit.ingredientNamePlaceholder')}
            dropdown
            editable={false}
          />

          {activeRecipeIngredientId === ingredient.id && (
            <View style={styles.recipeInlineSelect}>
              <View style={styles.recipeInlineSearchBox}>
                <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
                <TextInput
                  value={recipeSearch}
                  onChangeText={(value) => {
                    setRecipeSearch(value);
                    loadRecipeStocks(value);
                  }}
                  placeholder={t('productEdit.ingredientSearchPlaceholder')}
                  placeholderTextColor={Colors.textSecondary}
                  style={styles.recipeInlineSearchInput}
                  autoFocus
                />
                {loadingRecipeStocks && <ActivityIndicator size="small" color={Colors.primary} />}
              </View>
              <ScrollView
                style={styles.recipeInlineSelectList}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {recipeSearch.trim().length > 0 &&
                  !recipeStocks.some((stockItem) => stockItem.name.trim().toLowerCase() === recipeSearch.trim().toLowerCase()) && (
                    <TouchableOpacity
                      style={[styles.categoryCreateOption, styles.recipeCreateOption]}
                      onPress={() => {
                        updateRecipeIngredient(ingredient.id, {
                          stock_id: null,
                          stock_name: recipeSearch.trim(),
                          unit: '',
                          price: '',
                          stock_count: '',
                          stock_cost_price: '',
                          is_new_stock: true,
                        });
                        setActiveRecipeIngredientId(null);
                        setRecipeSearch('');
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                      <Text style={styles.categoryCreateText}>{t('productEdit.createIngredientNamed', { name: recipeSearch.trim() })}</Text>
                    </TouchableOpacity>
                  )}
                {loadingRecipeStocks ? (
                  <View style={styles.categoryLoading}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.categoryLoadingText}>{t('productEdit.loadingIngredients')}</Text>
                  </View>
                ) : recipeStocks.length > 0 ? (
                  recipeStocks.map((stockItem, stockIndex) => {
                    const selected = ingredient.stock_id
                      ? String(ingredient.stock_id) === String(stockItem.id)
                      : ingredient.stock_name.toLowerCase() === stockItem.name.toLowerCase();

                    return (
                      <TouchableOpacity
                        key={`${stockItem.id ?? 'no-id'}-${stockItem.name}-${stockIndex}`}
                        style={[styles.recipeInlineOption, selected && styles.categoryOptionActive]}
                        onPress={() => selectRecipeStock(ingredient.id, stockItem)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.extraInfo}>
                          <Text style={[styles.categoryOptionText, selected && styles.categoryOptionTextActive]}>
                            {stockItem.name}
                          </Text>
                          <Text style={styles.recipeSuggestionMeta}>
                            {stockItem.unit || 'ĐVT'} · {formatMoney(stockItem.averagePrice || stockItem.latestPrice)}
                          </Text>
                        </View>
                        {selected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.categoryEmptyText}>{t('productEdit.noIngredientMatch')}</Text>
                )}
              </ScrollView>
            </View>
          )}

          <View style={styles.twoCol}>
            <View style={styles.colItem}>
              <FieldCard
                label={t('productEdit.usedQuantity')}
                value={ingredient.quantity}
                onChangeText={(value) => updateRecipeIngredient(ingredient.id, { quantity: value })}
                keyboardType="numeric"
                mono
              />
            </View>
            <View style={styles.colItem}>
              <FieldCard
                label={t('productEdit.unit')}
                value={ingredient.unit}
                onChangeText={(value) => updateRecipeIngredient(ingredient.id, { unit: value })}
                placeholder={t('productEdit.unitExample')}
              />
            </View>
          </View>

          {ingredient.is_new_stock && !ingredient.stock_id && (
            <>
              <View style={styles.twoCol}>
                <View style={styles.colItem}>
                  <FieldCard
                    label={t('productEdit.stockImportQtyShort')}
                    value={ingredient.stock_quantity || ''}
                    onChangeText={handleNumericChange((value) => updateRecipeIngredient(ingredient.id, { stock_quantity: value }))}
                    keyboardType="numeric"
                    mono
                  />
                </View>
                <View style={styles.colItem}>
                  <FieldCard
                    label={stockImportPriceLabel}
                    value={ingredient.stock_cost_price || ''}
                    onChangeText={handleNumericChange((value) => updateRecipeIngredient(ingredient.id, { stock_cost_price: value, price: value }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.twoCol}>
                <View style={styles.colItem}>
                  <FieldCard
                    label={t('productEdit.paid')}
                    value={ingredient.stock_paid || ''}
                    onChangeText={handleNumericChange((value) => updateRecipeIngredient(ingredient.id, { stock_paid: value }))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.colItem}>
                  <FieldCard label={t('productEdit.stockImportTotal')} value={formatNumberInput(stockImportTotal)} mono disabled />
                </View>
              </View>
              <FieldCard
                label={t('suppliers.title')}
                value={ingredient.stock_supplier || ''}
                onPress={() => openSupplierModal(ingredient.id)}
                onClearPress={() => updateRecipeIngredient(ingredient.id, { stock_supplier: '' })}
                placeholder={t('productEdit.supplierNamePlaceholder')}
                dropdown
                clearable
                editable={false}
              />
              {activeSupplierIngredientId === ingredient.id && (
                <View style={styles.recipeInlineSelect}>
                  <View style={styles.recipeInlineSearchBox}>
                    <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
                    <TextInput
                      value={supplierSearch}
                      onChangeText={setSupplierSearch}
                      placeholder={t('productEdit.supplierSearchPlaceholder')}
                      placeholderTextColor={Colors.textSecondary}
                      style={styles.recipeInlineSearchInput}
                      autoFocus
                    />
                    {loadingBrands && <ActivityIndicator size="small" color={Colors.primary} />}
                  </View>
                  <ScrollView
                    style={styles.recipeInlineSelectList}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {supplierSearch.trim().length > 0 &&
                      !brands.some((brandItem) => brandItem.name.trim().toLowerCase() === supplierSearch.trim().toLowerCase()) && (
                        <TouchableOpacity
                          style={[styles.categoryCreateOption, styles.recipeCreateOption]}
                          onPress={() => handleCreateSupplier(supplierSearch.trim())}
                          disabled={creatingSupplier}
                          activeOpacity={0.85}
                        >
                          {creatingSupplier ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                          ) : (
                            <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                          )}
                          <Text style={styles.categoryCreateText}>{t('productEdit.createSupplier')} "{supplierSearch.trim()}"</Text>
                        </TouchableOpacity>
                      )}
                    {loadingBrands ? (
                      <View style={styles.categoryLoading}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.categoryLoadingText}>{t('productEdit.loadingSuppliers')}</Text>
                      </View>
                    ) : (
                      <>
                        {(supplierSearch.trim().length > 0
                          ? brands.filter((brandItem) =>
                              brandItem.name.trim().toLowerCase().includes(supplierSearch.trim().toLowerCase()),
                            )
                          : brands
                        ).map((brandItem) => {
                          const selected = ingredient.stock_supplier?.trim().toLowerCase() === brandItem.name.trim().toLowerCase();
                          return (
                            <TouchableOpacity
                              key={`supplier-${brandItem.id}-${brandItem.name}`}
                              style={[styles.recipeInlineOption, selected && styles.categoryOptionActive]}
                              onPress={() => handleSelectSupplier({ id: brandItem.id, name: brandItem.name })}
                              activeOpacity={0.85}
                            >
                              <Text style={[styles.categoryOptionText, selected && styles.categoryOptionTextActive]}>
                                {brandItem.name}
                              </Text>
                              {selected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                            </TouchableOpacity>
                          );
                        })}
                        {brands.length === 0 && supplierSearch.trim().length === 0 && (
                          <Text style={styles.categoryEmptyText}>{t('productEdit.noSupplierMatch')}</Text>
                        )}
                        {brands.length > 0 &&
                          supplierSearch.trim().length > 0 &&
                          !brands.some((brandItem) =>
                            brandItem.name.trim().toLowerCase().includes(supplierSearch.trim().toLowerCase()),
                          ) && (
                            <Text style={styles.categoryEmptyText}>{t('productEdit.noSupplierMatch')}</Text>
                          )}
                      </>
                    )}
                  </ScrollView>
                </View>
              )}
            </>
          )}

          <Text style={styles.extraTotalLine}>{t('productEdit.lineTotal', { value: formatMoney(itemCost * itemCount) })}</Text>
        </View>
      );
    },
    [
      activeRecipeIngredientId,
      activeSupplierIngredientId,
      brands,
      creatingSupplier,
      handleCreateSupplier,
      handleNumericChange,
      handleSelectSupplier,
      loadRecipeStocks,
      loadingBrands,
      loadingRecipeStocks,
      openRecipeStockSelect,
      openSupplierModal,
      recipeSearch,
      recipeStocks,
      removeRecipeIngredient,
      selectRecipeStock,
      supplierSearch,
      t,
      updateRecipeIngredient,
    ],
  );

  const renderComboProductItem = useCallback(
    ({ item, index }: { item: ComboProductDraft; index: number }) => {
      const filteredProducts = comboSearch.trim().length > 0
        ? comboProductsCatalog.filter((productItem) =>
          productItem.name.trim().toLowerCase().includes(comboSearch.trim().toLowerCase()))
        : comboProductsCatalog;
      const linkedIngredientsCount = item.product_id
        ? allMakeProducts.filter((makeProduct) => makeProduct.productId === item.product_id).length
        : 0;

      return (
        <View style={styles.recipeEditCard}>
          <View style={styles.variantsHeader}>
            <Text style={styles.variantName}>{t('productEdit.comboProductNumber', { index: index + 1 })}</Text>
            <TouchableOpacity onPressIn={() => removeComboProduct(item.id)} activeOpacity={0.85}>
              <Ionicons name="close-circle" size={20} color={Colors.danger} />
            </TouchableOpacity>
          </View>

          <FieldCard
            label={t('productEdit.comboProduct')}
            value={item.product_name}
            onPress={() => openComboProductSelect(item.id)}
            placeholder={t('productEdit.comboProductPlaceholder')}
            dropdown
            editable={false}
          />

          {activeComboProductId === item.id && (
            <View style={styles.recipeInlineSelect}>
              <View style={styles.recipeInlineSearchBox}>
                <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
                <TextInput
                  value={comboSearch}
                  onChangeText={setComboSearch}
                  placeholder={t('productEdit.comboProductSearchPlaceholder')}
                  placeholderTextColor={Colors.textSecondary}
                  style={styles.recipeInlineSearchInput}
                />
                {comboSearch.length > 0 && (
                  <TouchableOpacity onPressIn={() => setComboSearch('')} hitSlop={8} activeOpacity={0.85}>
                    <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView
                style={styles.recipeInlineSelectList}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((productItem) => {
                    const selected = item.product_id ? item.product_id === productItem.id : false;
                    return (
                      <TouchableOpacity
                        key={`combo-product-${productItem.id}`}
                        style={[styles.recipeInlineOption, selected && styles.categoryOptionActive]}
                        onPress={() => selectComboProduct(item.id, productItem)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.extraInfo}>
                          <Text style={[styles.recipeSuggestionName, selected && styles.categoryOptionTextActive]}>
                            {productItem.name}
                          </Text>
                          <Text style={styles.recipeSuggestionMeta}>
                            SKU: {productItem.sku || '--'} · {formatMoney(productItem.price)}
                          </Text>
                        </View>
                        {selected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.categoryEmptyText}>{t('productEdit.noComboProductMatch')}</Text>
                )}
              </ScrollView>
            </View>
          )}

          <FieldCard
            label={t('productEdit.usedQuantity')}
            value={item.quantity}
            onChangeText={handleNumericChange((value) => updateComboProduct(item.id, { quantity: value }))}
            keyboardType="numeric"
            placeholder="1"
          />
          <Text style={styles.extraMeta}>
            {t('productEdit.comboLinkedIngredients', { count: linkedIngredientsCount })}
          </Text>
        </View>
      );
    },
    [
      activeComboProductId,
      allMakeProducts,
      comboProductsCatalog,
      comboSearch,
      handleNumericChange,
      openComboProductSelect,
      removeComboProduct,
      selectComboProduct,
      t,
      updateComboProduct,
    ],
  );

  const renderRecipeFooter = useCallback(
    () => (
      <>
        <TouchableOpacity style={styles.recipeAddButton} onPress={addRecipeIngredient} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.variantGenerateText}>{t('productEdit.addIngredient')}</Text>
        </TouchableOpacity>
        <Text style={styles.extraTotalLine}>{t('productEdit.totalCost', { value: formatMoney(recipeCost) })}</Text>
      </>
    ),
    [addRecipeIngredient, recipeCost, t],
  );

  const renderComboFooter = useCallback(
    () => (
      <>
        <TouchableOpacity style={styles.recipeAddButton} onPress={addComboProduct} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.variantGenerateText}>{t('productEdit.addComboProduct')}</Text>
        </TouchableOpacity>
        <Text style={styles.extraTotalLine}>{t('productEdit.totalCost', { value: formatMoney(recipeCost) })}</Text>
      </>
    ),
    [addComboProduct, recipeCost, t],
  );

  const addImages = useCallback((items: PhotoItem[]) => {
    if (items.length === 0) return;

    setProductImages((current) => {
      const existingUris = new Set(current.map((item) => item.uri));
      const newItems = items.filter((item) => !existingUris.has(item.uri));
      const merged = [...current, ...newItems].slice(0, IMAGE_LIMIT);

      if (current.length + newItems.length > IMAGE_LIMIT) {
        Alert.alert(t('productEdit.imageLimitTitle'), t('productEdit.imageLimitMessage', { limit: IMAGE_LIMIT }));
      }

      return merged;
    });
  }, []);

  const removeImage = useCallback((photoId: string) => {
    setProductImages((current) => current.filter((item) => item.id !== photoId));
    setSelectedPhotoId((current) => (current === photoId ? null : current));
  }, []);

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('productEdit.permissionTitle'), t('productEdit.libraryPermissionMessage'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: IMAGE_LIMIT,
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled) {
      addImages(result.assets.map(photoItemFromAsset).filter((item): item is PhotoItem => Boolean(item)));
    }
  }, [addImages]);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('productEdit.permissionTitle'), t('productEdit.cameraPermissionMessage'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled) {
      addImages(result.assets.map(photoItemFromAsset).filter((item): item is PhotoItem => Boolean(item)));
    }
  }, [addImages]);

  const handleAddPhoto = useCallback(() => {
    Alert.alert(t('productEdit.addPhotoTitle'), t('productEdit.addPhotoMessage'), [
      { text: t('productEdit.takePhoto'), onPress: takePhoto },
      { text: t('productEdit.photoLibrary'), onPress: pickFromLibrary },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }, [pickFromLibrary, takePhoto]);

  const openBarcodeScanner = useCallback(async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert(t('scan.cameraPermissionTitle'), t('scan.cameraPermissionText'));
        return;
      }
    }

    setScannerPaused(false);
    setShowBarcodeScanner(true);
  }, [cameraPermission?.granted, requestCameraPermission, t]);

  const handleBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (scannerPaused) return;
      setScannerPaused(true);
      setBarcode(data || '');
      setShowBarcodeScanner(false);
    },
    [scannerPaused],
  );

  const handleSelectCategory = useCallback((nextCategory: SelectOption) => {
    setCategoryId(Number(nextCategory.id));
    setCategory(nextCategory.name);
    setCategorySearch('');
    setCategoryModalVisible(false);
  }, []);

  const handleCreateCategory = useCallback(
    async (categoryName: string) => {
      const normalizedName = categoryName.trim();
      if (!normalizedName) return;

      setCreatingCategory(true);
      try {
        const nextCategory = await createCategory(normalizedName);
        setCategories((current) => {
          const exists = current.some((item) => item.id === nextCategory.id);
          return exists ? current : [nextCategory, ...current];
        });
        handleSelectCategory(nextCategory);
      } catch (err) {
        Alert.alert(t('common.error'), err instanceof Error ? err.message : t('productEdit.createCategoryError'));
      } finally {
        setCreatingCategory(false);
      }
    },
    [handleSelectCategory],
  );

  const handleSelectBrand = useCallback((nextBrand: SelectOption) => {
    setBrandId(Number(nextBrand.id));
    setBrand(nextBrand.name);
    setBrandSearch('');
    setBrandModalVisible(false);
  }, []);

  const handleSelectUnit = useCallback((nextUnit: SelectOption) => {
    setUnit(nextUnit.name);
    setUnitSearch('');
    setUnitModalVisible(false);
  }, []);

  const handleCreateUnit = useCallback(
    async (unitName: string) => {
      const normalizedUnit = unitName.trim();
      if (!normalizedUnit) return;

      try {
        const nextCustomUnits = await saveCustomUnitForBusinessType(businessType, normalizedUnit);
        setCustomUnits(nextCustomUnits);
        setUnit(normalizedUnit);
        setUnitSearch('');
        setUnitModalVisible(false);
      } catch (err) {
        Alert.alert(t('common.error'), err instanceof Error ? err.message : t('productEdit.createUnitError'));
      }
    },
    [businessType],
  );

  const togglePercentOption = useCallback((value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value].sort((left, right) => Number(left) - Number(right)),
    );
  }, []);

  const handleFnbOptionChange = useCallback((
    type: 'size' | 'topping',
    optionId: string | number,
    field: 'name' | 'value' | 'promo_price',
    inputValue: string,
  ) => {
    const setter = type === 'size' ? setFnbSizeOptions : setFnbToppingOptions;
    setter((current) =>
      current.map((option, index) => {
        const id = String(option.id ?? index);
        if (id !== String(optionId)) return option;

        if (field === 'name') {
          return {
            ...option,
            name: inputValue,
            label: inputValue,
          };
        }

        if (field === 'promo_price') {
          return {
            ...option,
            promo_price: formatNumberInput(inputValue),
          };
        }

        return {
          ...option,
          value: formatNumberInput(inputValue),
        };
      }),
    );
  }, []);

  const handleAddFnbOption = useCallback((type: 'size' | 'topping') => {
    const setter = type === 'size' ? setFnbSizeOptions : setFnbToppingOptions;
    setter((current) => [...current, makeFnbOption('', '0', '0')]);
  }, []);

  const handleRemoveFnbOption = useCallback((type: 'size' | 'topping', optionId: string | number) => {
    const setter = type === 'size' ? setFnbSizeOptions : setFnbToppingOptions;
    setter((current) => current.filter((option, index) => String(option.id ?? index) !== String(optionId)));
  }, []);

  const handleAddSizeOption = useCallback((nextSize: SelectOption) => {
    const nextName = nextSize.name.trim();
    if (!nextName) return;

    setAddedSizeOptions((current) => {
      const existingNames = [...(product?.sizeOptions || []), ...current].map((item) =>
        normalizeSizeName(optionName(item)),
      );
      if (existingNames.includes(normalizeSizeName(nextName))) return current;

      return [...current, makeOption(nextName)];
    });
    setSizeSuggestSearch('');
    setSizeSuggestModalVisible(false);
  }, [product?.sizeOptions]);

  const toggleSizeSuggestion = useCallback((nextSize: SelectOption) => {
    const normalized = normalizeSizeName(nextSize.name);
    setSelectedSizeSuggestions((current) =>
      current.includes(normalized)
        ? current.filter((item) => item !== normalized)
        : [...current, normalized],
    );
  }, []);

  const handleAddSelectedSizeSuggestions = useCallback(() => {
    if (selectedSizeSuggestions.length === 0) return;

    const selectedOptions = sizeSuggestions.filter((item) =>
      selectedSizeSuggestions.includes(normalizeSizeName(item.name)),
    );

    setAddedSizeOptions((current) => {
      const existingNames = [...(product?.sizeOptions || []), ...current].map((item) =>
        normalizeSizeName(optionName(item)),
      );
      const nextOptions = selectedOptions
        .filter((item) => !existingNames.includes(normalizeSizeName(item.name)))
        .map((item) => makeOption(item.name));

      return [...current, ...nextOptions];
    });
    setSelectedSizeSuggestions([]);
    setSizeSuggestSearch('');
    setSizeSuggestModalVisible(false);
  }, [product?.sizeOptions, selectedSizeSuggestions, sizeSuggestions]);

  const handleCreateBrand = useCallback(
    async (brandName: string) => {
      const normalizedName = brandName.trim();
      if (!normalizedName) return;

      setCreatingBrand(true);
      try {
        const nextBrand = await createBrand(normalizedName);
        setBrands((current) => {
          return mergeBrandOptions(current, [nextBrand]);
        });
        handleSelectBrand(nextBrand);
      } catch (err) {
        Alert.alert(t('common.error'), err instanceof Error ? err.message : t('productEdit.createBrandError'));
      } finally {
        setCreatingBrand(false);
      }
    },
    [handleSelectBrand],
  );

  const clearDragHoldTimer = useCallback(() => {
    if (dragHoldTimer.current) {
      clearTimeout(dragHoldTimer.current);
      dragHoldTimer.current = null;
    }
  }, []);

  const finishPhotoDrag = useCallback(() => {
    clearDragHoldTimer();
    dragActiveRef.current = false;
    dragIndexRef.current = null;

    Animated.parallel([
      Animated.spring(dragX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(dragScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDraggingId(null);
      setDraggingIndex(null);
    });
  }, [clearDragHoldTimer, dragScale, dragX]);

  const createPhotoPanResponder = useCallback(
    (photoId: string, index: number) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => photos.length > 1,
        onMoveShouldSetPanResponder: () => photos.length > 1,
        onPanResponderGrant: () => {
          clearDragHoldTimer();
          dragActiveRef.current = false;
          dragIndexRef.current = index;
          dragX.setValue(0);
          dragScale.setValue(1);

          dragHoldTimer.current = setTimeout(() => {
            dragActiveRef.current = true;
            setDraggingId(photoId);
            setDraggingIndex(index);
            Animated.spring(dragScale, {
              toValue: 1.08,
              useNativeDriver: true,
            }).start();
          }, DRAG_HOLD_DELAY);
        },
        onPanResponderMove: (_, gestureState) => {
          if (!dragActiveRef.current) {
            if (Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
              clearDragHoldTimer();
            }
            return;
          }

          dragX.setValue(gestureState.dx);

          const currentIndex = dragIndexRef.current ?? index;
          const targetIndex = Math.max(
            0,
            Math.min(photos.length - 1, currentIndex + Math.round(gestureState.dx / PHOTO_STEP)),
          );

          if (targetIndex !== currentIndex) {
            setProductImages((current) => {
              const actualIndex = current.findIndex((item) => item.id === photoId);
              if (actualIndex < 0 || actualIndex === targetIndex) return current;

              dragIndexRef.current = targetIndex;
              setDraggingIndex(targetIndex);
              dragX.setValue(0);
              return moveItem(current, actualIndex, targetIndex);
            });
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (!dragActiveRef.current && Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
            clearDragHoldTimer();
            setSelectedPhotoId((current) => (current === photoId ? null : photoId));
            return;
          }

          finishPhotoDrag();
        },
        onPanResponderTerminate: finishPhotoDrag,
      }),
    [clearDragHoldTimer, dragScale, dragX, finishPhotoDrag, photos.length],
  );

  const handleDelete = () => {
    Alert.alert(t('productEdit.deleteTitle'), t('productEdit.deleteMessage', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('customers.deleteAction'), style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  const renderVariantAttributeEditor = (
    title: string,
    options: ProductVariantOption[],
    value: string,
    setValue: (text: string) => void,
    setOptions: React.Dispatch<React.SetStateAction<ProductVariantOption[]>>,
    placeholder: string,
    inputRef: React.RefObject<TextInput | null>,
  ) => (
    <View style={styles.variantEditorBlock}>
      <Text style={styles.optionTitle}>{title}</Text>
      <View style={styles.variantInputRow}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          style={styles.variantTagInput}
          ref={inputRef}
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={() => {
            addVariantOption(value, setOptions, setValue);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
        />
        <TouchableOpacity
          style={styles.variantTagAddButton}
          onPressIn={() => {
            addVariantOption(value, setOptions, setValue);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.optionChips}>
        {options.length > 0 ? (
          options.map((option) => (
            <TouchableOpacity
              key={`${title}-${optionName(option)}`}
              style={styles.variantTagChip}
              onPress={() => removeVariantOption(option, setOptions)}
              activeOpacity={0.85}
            >
              <Text style={styles.optionChipText}>{optionName(option)}</Text>
              <Ionicons name="close" size={13} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.extraEmpty}>{t('productEdit.noOption', { label: title.toLowerCase() })}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t(isEdit ? 'productEdit.editTitle' : 'productEdit.addTitle')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {(sku || (editId ? `SP-${editId}` : 'SP-0000')).toUpperCase()} · {t(product?.updatedAt ? 'productEdit.synced' : 'productEdit.unsaved')}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.savePill, saving && styles.savePillDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.savePillText}>{saving ? t('productEdit.saving') : t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.centerText}>{t('productEdit.loadingDetail')}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={28} color={Colors.danger} />
          <Text style={styles.centerText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadDetail()}>
            <Text style={styles.retryText}>{t('products.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadDetail(true)} tintColor={Colors.primary} />
          }
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📸 {t('productEdit.images')} · {photos.length || 0}/8</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={draggingIndex === null}
            >
              <View style={styles.photosRow}>
                {photos.map((photo, index) => {
                  const isSelected = selectedPhotoId === photo.id;
                  const panResponder = isSelected ? null : createPhotoPanResponder(photo.id, index);
                  const isDragging = draggingId === photo.id;
                  return (
                    <Animated.View
                      key={photo.id}
                      {...(panResponder?.panHandlers || {})}
                      style={[
                        isDragging && styles.photoDragging,
                        isDragging && { transform: [{ translateX: dragX }, { scale: dragScale }] },
                      ]}
                    >
                      <PhotoBox
                        uri={photo.uri}
                        fallbackUri={photo.fallbackUri}
                        main={index === 0}
                        selected={isSelected}
                        onRemove={() => removeImage(photo.id)}
                      />
                    </Animated.View>
                  );
                })}
                <TouchableOpacity style={styles.addPhotoBox} onPress={handleAddPhoto}>
                  <Ionicons name="add" size={20} color={Colors.textSecondary} />
                  <Text style={styles.addPhotoText}>{t('customers.addTag')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionMutedTitle}>{t('productEdit.basicInfo')}</Text>
            <FieldCard label={t('productEdit.productName')} value={name} onChangeText={setName} placeholder={t('productEdit.productNamePlaceholder')} />

            {showBarcode ? (
              <View style={styles.twoCol}>
                <View style={styles.colItem}>
                  <FieldCard label="SKU" value={sku} mono disabled />
                </View>
                <View style={styles.colItem}>
                  <FieldCard
                    label={t('productEdit.barcode')}
                    value={barcode}
                    onChangeText={setBarcode}
                    onScanPress={openBarcodeScanner}
                    mono
                    scan
                  />
                </View>
              </View>
            ) : (
              <FieldCard label="SKU" value={sku} mono disabled />
            )}

            {isFnB ? (
              <View style={styles.twoCol}>
                <View style={styles.colItem}>
                  <FieldCard
                    label={t('productEdit.category')}
                    value={category}
                    onPress={() => setCategoryModalVisible(true)}
                    placeholder={t('productEdit.categoryPlaceholder')}
                    dropdown
                    editable={false}
                  />
                </View>
                <View style={styles.colItem}>
                  <FieldCard
                    label={t('productEdit.saleUnit')}
                    value={saleUnit}
                    onChangeText={setSaleUnit}
                    placeholder={t('productEdit.saleUnitPlaceholder')}
                  />
                </View>
              </View>
            ) : (
              <FieldCard
                label={t('productEdit.category')}
                value={category}
                onPress={() => setCategoryModalVisible(true)}
                placeholder={t('productEdit.categoryPlaceholder')}
                dropdown
                editable={false}
              />
            )}
            <FieldCard
              label={t('productEdit.brand')}
              value={brand}
              onPress={() => setBrandModalVisible(true)}
              dropdown
              placeholder={t('productEdit.brandPlaceholder')}
              editable={false}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionMutedTitle}>💰 {t('productEdit.priceSection')}</Text>
            <View style={styles.twoCol}>
              <View style={styles.colItem}>
                <FieldCard
                  label={t('productEdit.salePrice')}
                  value={price}
                  onChangeText={handleNumericChange(setPrice)}
                  keyboardType="numeric"
                  placeholder="0"
                  highlight
                />
              </View>
              <View style={styles.colItem}>
                <FieldCard
                  label={t('productEdit.promoPrice')}
                  value={salePrice}
                  onChangeText={handleNumericChange(setSalePrice)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>

            {!isFnB && (
              <FieldCard
                label={t('productEdit.unit')}
                value={unit}
                onPress={() => setUnitModalVisible(true)}
                placeholder={t('productEdit.unitPlaceholder')}
                dropdown
                editable={false}
              />
            )}

            <View style={styles.profitHint}>
              <Text style={styles.profitHintText}>
                💡 {t('productEdit.profitPerProduct')}{' '}
                <Text style={styles.profitHintStrong}>
                  {profitMeta.profit.toLocaleString('vi-VN')} {t('home.currency')} ({profitMeta.percent}%)
                </Text>
              </Text>
              {hasVariantPricing ? (
                <Text style={styles.profitHintText}>
                  {t('productEdit.priceFromVariantNote')}
                </Text>
              ) : null}
            </View>
          </View>

          {!isFnB && canUseDirectInventoryMode && (
            <View style={styles.card}>
              <Text style={styles.sectionMutedTitle}>{t('productEdit.inventoryMode')}</Text>
              <View style={styles.modeToggleWrap}>
                <TouchableOpacity
                  style={[styles.modeToggleButton, !useRecipeMode && styles.modeToggleButtonActive]}
                  onPress={() => switchInventoryMode('direct')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.modeToggleText, !useRecipeMode && styles.modeToggleTextActive]}>
                    {t('productEdit.inventoryModeDirect')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeToggleButton, useRecipeMode && styles.modeToggleButtonActive]}
                  onPress={() => switchInventoryMode('recipe')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.modeToggleText, useRecipeMode && styles.modeToggleTextActive]}>
                    {t('productEdit.inventoryModeRecipe')}
                  </Text>
                </TouchableOpacity>
              </View>

              {!useRecipeMode ? (
                <>
                  <View style={styles.twoCol}>
                    <View style={styles.colItem}>
                      <FieldCard
                        label={t('productEdit.importQuantity')}
                        value={stock}
                        onChangeText={handleNumericChange(setStock)}
                        keyboardType="numeric"
                        mono
                      />
                    </View>
                    <View style={styles.colItem}>
                      <FieldCard
                        label={t('productEdit.costPrice')}
                        value={cost}
                        onChangeText={handleNumericChange(setCost)}
                        keyboardType="numeric"
                        mono
                        disabled={hasRecipeConfig}
                      />
                    </View>
                  </View>
                  <View style={styles.twoCol}>
                    <View style={styles.colItem}>
                      <FieldCard
                        label={t('productEdit.totalImportedValue')}
                        value={formatNumberInput(totalImportedValue)}
                        mono
                        disabled
                      />
                    </View>
                    <View style={styles.colItem}>
                      <FieldCard
                        label={t('productEdit.paid')}
                        value={stockPaid}
                        onChangeText={handleNumericChange(setStockPaid)}
                        keyboardType="numeric"
                        mono
                      />
                    </View>
                  </View>
                  <FieldCard
                    label={t('suppliers.title')}
                    value={stockSupplier}
                    onPress={openDirectSupplierPicker}
                    onClearPress={() => setStockSupplier('')}
                    placeholder={t('productEdit.supplierNamePlaceholder')}
                    dropdown
                    clearable
                    editable={false}
                  />
                  {directSupplierPickerVisible && (
                    <View style={styles.recipeInlineSelect}>
                      <View style={styles.recipeInlineSearchBox}>
                        <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
                        <TextInput
                          value={directSupplierSearch}
                          onChangeText={setDirectSupplierSearch}
                          placeholder={t('productEdit.supplierSearchPlaceholder')}
                          placeholderTextColor={Colors.textSecondary}
                          style={styles.recipeInlineSearchInput}
                          autoFocus
                        />
                        {loadingBrands && <ActivityIndicator size="small" color={Colors.primary} />}
                      </View>
                      <ScrollView
                        style={styles.recipeInlineSelectList}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                      >
                        {directSupplierSearch.trim().length > 0 &&
                          !brands.some((brandItem) => brandItem.name.trim().toLowerCase() === directSupplierSearch.trim().toLowerCase()) && (
                            <TouchableOpacity
                              style={[styles.categoryCreateOption, styles.recipeCreateOption]}
                              onPress={() => handleCreateDirectSupplier(directSupplierSearch.trim())}
                              disabled={creatingSupplier}
                              activeOpacity={0.85}
                            >
                              {creatingSupplier ? (
                                <ActivityIndicator size="small" color={Colors.primary} />
                              ) : (
                                <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                              )}
                              <Text style={styles.categoryCreateText}>{t('productEdit.createSupplier')} "{directSupplierSearch.trim()}"</Text>
                            </TouchableOpacity>
                          )}
                        {loadingBrands ? (
                          <View style={styles.categoryLoading}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.categoryLoadingText}>{t('productEdit.loadingSuppliers')}</Text>
                          </View>
                        ) : (
                          <>
                            {(directSupplierSearch.trim().length > 0
                              ? brands.filter((brandItem) =>
                                  brandItem.name.trim().toLowerCase().includes(directSupplierSearch.trim().toLowerCase()),
                                )
                              : brands
                            ).map((brandItem) => {
                              const selected = stockSupplier.trim().toLowerCase() === brandItem.name.trim().toLowerCase();
                              return (
                                <TouchableOpacity
                                  key={`direct-supplier-${brandItem.id}-${brandItem.name}`}
                                  style={[styles.recipeInlineOption, selected && styles.categoryOptionActive]}
                                  onPress={() => handleSelectDirectSupplier(brandItem.name)}
                                  activeOpacity={0.85}
                                >
                                  <Text style={[styles.categoryOptionText, selected && styles.categoryOptionTextActive]}>
                                    {brandItem.name}
                                  </Text>
                                  {selected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                                </TouchableOpacity>
                              );
                            })}
                            {brands.length === 0 && directSupplierSearch.trim().length === 0 && (
                              <Text style={styles.categoryEmptyText}>{t('productEdit.noSupplierMatch')}</Text>
                            )}
                            {brands.length > 0 &&
                              directSupplierSearch.trim().length > 0 &&
                              !brands.some((brandItem) =>
                                brandItem.name.trim().toLowerCase().includes(directSupplierSearch.trim().toLowerCase()),
                              ) && (
                                <Text style={styles.categoryEmptyText}>{t('productEdit.noSupplierMatch')}</Text>
                              )}
                          </>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.recipeCenteredAddButton} onPress={openRecipeModal} activeOpacity={0.85}>
                    <Text style={styles.recipeHeaderAddText}>+ {t('customers.addTag')}</Text>
                  </TouchableOpacity>
                  {comboByProduct && comboProducts.length > 0 ? (
                    <>
                      {comboProducts.slice(0, 3).map((comboItem, index) => (
                        <View key={comboItem.id} style={[styles.extraRow, index > 0 && styles.recipeCompactBorder]}>
                          <View style={styles.extraInfo}>
                            <Text style={styles.extraName}>{comboItem.product_name || t('productEdit.unnamedProduct')}</Text>
                            <Text style={styles.extraMeta}>
                              {t('productEdit.usedQuantity')}: {comboItem.quantity || '0'}
                            </Text>
                          </View>
                        </View>
                      ))}
                      {comboProducts.length > 3 && (
                        <Text style={styles.extraEmpty}>{t('productEdit.moreComboProducts', { count: comboProducts.length - 3 })}</Text>
                      )}
                      {comboExpansion.unresolved.length > 0 && (
                        <Text style={styles.extraMetaWarn}>
                          {t('productEdit.comboMissingRecipeMessage', {
                            products: comboExpansion.unresolved
                              .map((item) => item.productName || `#${item.productId || ''}`)
                              .filter(Boolean)
                              .join(', '),
                          })}
                        </Text>
                      )}
                      <Text style={styles.extraTotalLine}>{t('productEdit.totalCost', { value: formatMoney(recipeCost) })}</Text>
                    </>
                  ) : effectiveRecipeIngredients.length > 0 ? (
                    <>
                      {effectiveRecipeIngredients.slice(0, 3).map((ingredient, index) => {
                        const itemCost = parseCurrency(ingredient.price || ingredient.stock_cost_price || '');
                        const itemCount = parseDecimalInput(ingredient.quantity);
                        return (
                          <View key={ingredient.id} style={[styles.extraRow, index > 0 && styles.recipeCompactBorder]}>
                            <View style={styles.extraInfo}>
                              <Text style={styles.extraName}>{ingredient.stock_name || t('productEdit.unnamedIngredient')}</Text>
                              <Text style={styles.extraMeta}>
                                {ingredient.quantity || 0} {ingredient.unit || ''} x {formatMoney(itemCost)}
                              </Text>
                            </View>
                            <Text style={styles.extraTotal}>{formatMoney(itemCost * itemCount)}</Text>
                          </View>
                        );
                      })}
                      {effectiveRecipeIngredients.length > 3 && (
                        <Text style={styles.extraEmpty}>{t('productEdit.moreIngredients', { count: effectiveRecipeIngredients.length - 3 })}</Text>
                      )}
                      <Text style={styles.extraTotalLine}>{t('productEdit.totalCost', { value: formatMoney(recipeCost) })}</Text>
                    </>
                  ) : (
                    <Text style={styles.extraEmpty}>{t('productEdit.comboHint')}</Text>
                  )}
                </>
              )}
            </View>
          )}

          {(isFnB || !canUseDirectInventoryMode) && useRecipeMode && (
            <View style={styles.card}>
              <View style={styles.variantsHeader}>
                <Text style={styles.sectionMutedTitle}>{t(isFnB ? 'productEdit.recipe' : 'productEdit.recipeCombo')}</Text>
                <TouchableOpacity style={styles.recipeHeaderAddButton} onPress={openRecipeModal} activeOpacity={0.85}>
                  <Text style={styles.recipeHeaderAddText}>+ {t('customers.addTag')}</Text>
                </TouchableOpacity>
              </View>
              {comboByProduct && comboProducts.length > 0 ? (
                <>
                  {comboProducts.slice(0, 3).map((comboItem, index) => (
                    <View key={comboItem.id} style={[styles.extraRow, index > 0 && styles.recipeCompactBorder]}>
                      <View style={styles.extraInfo}>
                        <Text style={styles.extraName}>{comboItem.product_name || t('productEdit.unnamedProduct')}</Text>
                        <Text style={styles.extraMeta}>
                          {t('productEdit.usedQuantity')}: {comboItem.quantity || '0'}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {comboProducts.length > 3 && (
                    <Text style={styles.extraEmpty}>{t('productEdit.moreComboProducts', { count: comboProducts.length - 3 })}</Text>
                  )}
                  {comboExpansion.unresolved.length > 0 && (
                    <Text style={styles.extraMetaWarn}>
                      {t('productEdit.comboMissingRecipeMessage', {
                        products: comboExpansion.unresolved
                          .map((item) => item.productName || `#${item.productId || ''}`)
                          .filter(Boolean)
                          .join(', '),
                      })}
                    </Text>
                  )}
                  <Text style={styles.extraTotalLine}>{t('productEdit.totalCost', { value: formatMoney(recipeCost) })}</Text>
                </>
              ) : effectiveRecipeIngredients.length > 0 ? (
                <>
                  {effectiveRecipeIngredients.slice(0, 3).map((ingredient, index) => {
                    const itemCost = parseCurrency(ingredient.price || ingredient.stock_cost_price || '');
                    const itemCount = parseDecimalInput(ingredient.quantity);
                    return (
                      <View key={ingredient.id} style={[styles.extraRow, index > 0 && styles.recipeCompactBorder]}>
                        <View style={styles.extraInfo}>
                          <Text style={styles.extraName}>{ingredient.stock_name || t('productEdit.unnamedIngredient')}</Text>
                          <Text style={styles.extraMeta}>
                            {ingredient.quantity || 0} {ingredient.unit || ''} x {formatMoney(itemCost)}
                          </Text>
                        </View>
                        <Text style={styles.extraTotal}>{formatMoney(itemCost * itemCount)}</Text>
                      </View>
                    );
                  })}
                  {effectiveRecipeIngredients.length > 3 && (
                    <Text style={styles.extraEmpty}>{t('productEdit.moreIngredients', { count: effectiveRecipeIngredients.length - 3 })}</Text>
                  )}
                  <Text style={styles.extraTotalLine}>{t('productEdit.totalCost', { value: formatMoney(recipeCost) })}</Text>
                </>
              ) : (
                <Text style={styles.extraEmpty}>
                  {isFnB
                    ? t('productEdit.addIngredientHint')
                    : t('productEdit.comboHint')}
                </Text>
              )}
            </View>
          )}

          {showVariantCard && (
            <View style={styles.card}>
              <View style={styles.variantsHeader}>
                <Text style={styles.sectionMutedTitle}>🎨 {t('productEdit.variants')}</Text>
                {showVariantBuilder && (
                  <TouchableOpacity
                    style={styles.recipeHeaderAddButton}
                    onPress={() => setVariantModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.recipeHeaderAddText}>+ {t('customers.addTag')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {variants.length > 0 ? (
                variants.map((variant, index) => {
                  const promoActive = hasActivePromo(variant);
                  return (
                    <View key={variant.id || index} style={[styles.variantRow, index > 0 && styles.variantRowBorder]}>
                      <Text style={styles.variantName}>{formatVariantName(variant)}</Text>
                      <View style={styles.variantPriceWrap}>
                        <Text style={[styles.variantPrice, promoActive && styles.variantPriceOld]}>
                          {formatMoney(getVariantPrice(variant))}
                        </Text>
                        {promoActive && <Text style={styles.variantPromoPrice}>{formatMoney(getVariantPromoPrice(variant))}</Text>}
                      </View>
                      {!isFnB && <Text style={styles.variantStock}>·{getVariantQuantity(variant)}</Text>}
                    </View>
                  );
                })
              ) : (
                <Text style={styles.extraEmpty}>
                  {showVariantBuilder
                    ? t('productEdit.noAttributeVariants')
                    : t('productEdit.noDirectVariants')}
                </Text>
              )}
            </View>
          )}

          {hasVariantInventory && (
            <View style={styles.card}>
              <Text style={styles.sectionMutedTitle}>📦 {t('productEdit.inventory')}</Text>
              <View style={styles.twoCol}>
                <View style={styles.colItem}>
                  <FieldCard
                    label={t('productEdit.currentStock')}
                    value={formatNumberInput(variantInventorySummary.totalStock)}
                    mono
                    disabled
                  />
                </View>
                <View style={styles.colItem}>
                  <FieldCard
                    label={t('productEdit.lowStockAlert')}
                    value={minStock}
                    onChangeText={handleNumericChange(setMinStock)}
                    keyboardType="numeric"
                    mono
                  />
                </View>
              </View>
              <View style={styles.twoCol}>
                <View style={styles.colItem}>
                  <FieldCard
                    label={t('productEdit.variantOutOfStock')}
                    value={formatNumberInput(variantInventorySummary.outOfStock)}
                    mono
                    disabled
                  />
                </View>
                <View style={styles.colItem}>
                  <FieldCard
                    label={t('productEdit.variantLowStock')}
                    value={formatNumberInput(variantInventorySummary.lowStock)}
                    mono
                    disabled
                  />
                </View>
              </View>
              <FieldCard
                label={t('productEdit.variantInventoryValue')}
                value={formatNumberInput(variantInventorySummary.totalValue)}
                mono
                disabled
              />
            </View>
          )}

          {showRecipeInventoryNotice && (
            <View style={styles.card}>
              <Text style={styles.sectionMutedTitle}>📦 {t('productEdit.inventory')}</Text>
              <Text style={styles.extraMeta}>{t('productEdit.inventoryManagedByRecipe')}</Text>
              {recipeInventorySummary.rows.length > 0 ? (
                <>
                  {recipeInventorySummary.rows.map((row, index) => (
                    <View key={`${row.id}-${index}`} style={[styles.extraRow, index > 0 && styles.recipeCompactBorder]}>
                      <View style={styles.extraInfo}>
                        <Text style={styles.extraName}>{row.name}</Text>
                        <Text style={styles.extraMeta}>
                          {t('productEdit.availableStock')}: {row.availableDisplay} {row.unit || ''}
                        </Text>
                        <Text style={styles.extraMeta}>
                          {t('productEdit.usagePerCombo')}: {row.usageDisplay} {row.unit || ''} · {t('productEdit.comboCanMake')}:{' '}
                          {formatNumberInput(row.combosPossible)}
                        </Text>
                        {row.insufficient && (
                          <Text style={styles.extraMetaWarn}>{t('productEdit.insufficientForOneCombo')}</Text>
                        )}
                      </View>
                      <Text style={styles.extraTotal}>{formatMoney(row.inventoryValue)}</Text>
                    </View>
                  ))}
                  <Text style={styles.extraTotalLine}>
                    {t('productEdit.maxComboFromIngredients', { count: formatNumberInput(recipeInventorySummary.maxComboByStock) })}
                  </Text>
                  <Text style={styles.extraTotalLine}>
                    {t('productEdit.totalIngredientInventoryValue', { value: formatMoney(recipeInventorySummary.totalValue) })}
                  </Text>
                  {recipeInventorySummary.insufficientCount > 0 && (
                    <Text style={styles.extraMetaWarn}>
                      {t('productEdit.insufficientIngredientCount', { count: recipeInventorySummary.insufficientCount })}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.extraEmpty}>{t('productEdit.noIngredientInventory')}</Text>
              )}
            </View>
          )}

          {showDirectStock && !showRetailImportCard && (
            <View style={styles.card}>
              <Text style={styles.sectionMutedTitle}>📦 {t('productEdit.inventory')}</Text>
              <View style={styles.twoCol}>
                <View style={styles.colItem}>
                  <FieldCard
                    label={t('productEdit.currentStock')}
                    value={stock}
                    onChangeText={handleNumericChange(setStock)}
                    keyboardType="numeric"
                    mono
                    disabled={isDirectStockReadOnly}
                  />
                </View>
                <View style={styles.colItem}>
                  <FieldCard
                    label={t('productEdit.lowStockAlert')}
                    value={minStock}
                    onChangeText={handleNumericChange(setMinStock)}
                    keyboardType="numeric"
                    mono
                  />
                </View>
              </View>
              <View style={styles.twoCol}>
                <View style={styles.colItem}>
                  <FieldCard
                    label={t('productEdit.remainingStockValue')}
                    value={formatNumberInput(remainingStockValue)}
                    mono
                    disabled
                  />
                </View>
                <View style={styles.colItem}>
                  <FieldCard
                    label={t('productEdit.totalImportedValue')}
                    value={formatNumberInput(totalImportedValue)}
                    mono
                    disabled
                  />
                </View>
              </View>
              {isDirectStockReadOnly && (
                <Text style={styles.extraMeta}>{t('productEdit.currentStockSyncedHint')}</Text>
              )}
            </View>
          )}

          <View style={styles.card}>
            <ToggleItem
              label={t('productEdit.showOnline')}
              value={isOnline}
              onPress={() => setIsOnline(!isOnline)}
            />
            <ToggleItem
              label={t('productEdit.allowOversell')}
              value={allowOversell}
              onPress={() => setAllowOversell(!allowOversell)}
            />
            <ToggleItem
              label={t('productEdit.applyVat')}
              value={vatApplied}
              onPress={() => setVatApplied(!vatApplied)}
              last
            />
          </View>

          {isEdit && (
            <TouchableOpacity style={styles.dangerCard} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              <Text style={styles.dangerText}>{t('productEdit.deleteTitle')}</Text>
            </TouchableOpacity>
          )}

          <Modal
            visible={recipeModalVisible}
            transparent
            animationType="fade"
            onRequestClose={closeRecipeModal}
          >
            <View style={styles.modalBackdropStatic}>
              <Pressable style={styles.modalBackdropPressable} onPressIn={closeRecipeModal} />
              <KeyboardAvoidingView
                style={styles.recipeModalBackdrop}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
              >
              <Animated.View style={[styles.recipeModalSheet, { marginTop: insets.top + 56, paddingBottom: Math.max(insets.bottom, 12), transform: [{ translateY: recipeSheetTranslateY }] }]}>
                <View style={styles.categoryModalHeader}>
                  <View>
                    <Text style={styles.categoryModalTitle}>{t('productEdit.configureRecipe', { type: isFnB ? t('productEdit.recipeLower') : 'combo' })}</Text>
                    <Text style={styles.variantModalSubtitle}>{sku} · {businessType || t('productEdit.businessType')}</Text>
                  </View>
                  <TouchableOpacity style={styles.categoryCloseBtn} onPressIn={closeRecipeModal}>
                    <Ionicons name="close" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                {!isFnB && (
                  <View style={styles.modeToggleWrap}>
                    <TouchableOpacity
                      style={[styles.modeToggleButton, !comboByProduct && styles.modeToggleButtonActive]}
                      onPress={() => handleChangeComboMode(false)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.modeToggleText, !comboByProduct && styles.modeToggleTextActive]}>
                        {t('productEdit.comboByIngredientMode')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modeToggleButton, comboByProduct && styles.modeToggleButtonActive]}
                      onPress={() => handleChangeComboMode(true)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.modeToggleText, comboByProduct && styles.modeToggleTextActive]}>
                        {t('productEdit.comboByProductMode')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!isFnB && comboByProduct ? (
                  <FlatList<ComboProductDraft>
                    style={styles.recipeModalScroll}
                    contentContainerStyle={[styles.recipeModalScrollContent, { paddingBottom: Math.max(insets.bottom, 12) + 96 }]}
                    data={comboProducts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderComboProductItem}
                    ListFooterComponent={renderComboFooter}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                    automaticallyAdjustKeyboardInsets
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews
                    initialNumToRender={6}
                    maxToRenderPerBatch={8}
                    windowSize={8}
                    updateCellsBatchingPeriod={16}
                  />
                ) : (
                  <FlatList<RecipeIngredient>
                    style={styles.recipeModalScroll}
                    contentContainerStyle={[styles.recipeModalScrollContent, { paddingBottom: Math.max(insets.bottom, 12) + 96 }]}
                    data={recipeIngredients}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRecipeIngredientItem}
                    ListFooterComponent={renderRecipeFooter}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                    automaticallyAdjustKeyboardInsets
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews
                    initialNumToRender={6}
                    maxToRenderPerBatch={8}
                    windowSize={8}
                    updateCellsBatchingPeriod={16}
                  />
                )}

                <View style={styles.variantModalFooter}>
                  <TouchableOpacity
                    style={styles.variantCancelButton}
                    onPress={closeRecipeModal}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.variantCancelText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.variantSaveButton} onPress={handleSaveRecipeModal} activeOpacity={0.85}>
                    <Text style={styles.variantSaveText}>{t('productEdit.saveRecipe')}</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
            </View>
          </Modal>

          <Modal
            visible={variantModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setVariantModalVisible(false)}
          >
            <View style={styles.modalBackdropStatic}>
              <Pressable style={styles.modalBackdropPressable} onPressIn={() => setVariantModalVisible(false)} />
              <KeyboardAvoidingView
                style={styles.recipeModalBackdrop}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
              >
              <Animated.View style={[styles.variantModalSheet, { marginTop: insets.top + 56, paddingBottom: Math.max(insets.bottom, 12), transform: [{ translateY: variantSheetTranslateY }] }]}>
                <View style={styles.categoryModalHeader}>
                  <View>
                    <Text style={styles.categoryModalTitle}>{t('productEdit.configureVariants')}</Text>
                    <Text style={styles.variantModalSubtitle}>{sku} · {businessType || t('productEdit.businessType')}</Text>
                  </View>
                  <TouchableOpacity style={styles.categoryCloseBtn} onPressIn={() => setVariantModalVisible(false)}>
                    <Ionicons name="close" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
                  {renderVariantAttributeEditor(
                    variantLabels.size,
                    variantSizeOptions,
                    newVariantSize,
                    setNewVariantSize,
                    setVariantSizeOptions,
                    t('productEdit.addOptionPlaceholder', { label: variantLabels.size.toLowerCase() }),
                    variantSizeInputRef,
                  )}
                  {renderVariantAttributeEditor(
                    variantLabels.color,
                    variantColorOptions,
                    newVariantColor,
                    setNewVariantColor,
                    setVariantColorOptions,
                    t('productEdit.addOptionPlaceholder', { label: variantLabels.color.toLowerCase() }),
                    variantColorInputRef,
                  )}
                  {renderVariantAttributeEditor(
                    variantLabels.material,
                    variantMaterialOptions,
                    newVariantMaterial,
                    setNewVariantMaterial,
                    setVariantMaterialOptions,
                    t('productEdit.addOptionPlaceholder', { label: variantLabels.material.toLowerCase() }),
                    variantMaterialInputRef,
                  )}

                  <TouchableOpacity style={styles.variantGenerateButton} onPress={handleGenerateVariants} activeOpacity={0.85}>
                    <Ionicons name="git-branch-outline" size={16} color={Colors.primary} />
                    <Text style={styles.variantGenerateText}>{t('productEdit.generateVariants')}</Text>
                  </TouchableOpacity>

                  {draftVariants.length > 0 && (
                    <View style={styles.variantBulkCard}>
                      <Text style={styles.optionTitle}>{t('productEdit.bulkApply')}</Text>
                      <View style={styles.twoCol}>
                        <View style={styles.colItem}>
                          <FieldCard
                            label={t('productEdit.quantity')}
                            value={masterVariant.quantity}
                            onChangeText={handleNumericChange((value) => setMasterVariant((current) => ({ ...current, quantity: value })))}
                            keyboardType="numeric"
                            mono
                          />
                        </View>
                        <View style={styles.colItem}>
                          <FieldCard
                            label={t('productEdit.salePrice')}
                            value={masterVariant.price}
                            onChangeText={handleNumericChange((value) => setMasterVariant((current) => ({ ...current, price: value })))}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                      <View style={styles.twoCol}>
                        <View style={styles.colItem}>
                          <FieldCard
                            label={t('productEdit.costPrice')}
                            value={masterVariant.cost_price}
                            onChangeText={handleNumericChange((value) => setMasterVariant((current) => ({ ...current, cost_price: value })))}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.colItem}>
                          <FieldCard
                            label={t('productEdit.promoPrice')}
                            value={masterVariant.promo_price}
                            onChangeText={handleNumericChange((value) => setMasterVariant((current) => ({ ...current, promo_price: value })))}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                      <TouchableOpacity style={styles.variantApplyButton} onPress={applyMasterVariant} activeOpacity={0.85}>
                        <Text style={styles.variantApplyText}>{t('productEdit.applyAll')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <Text style={styles.sectionMutedTitle}>{t('productEdit.variantList', { count: draftVariants.length })}</Text>
                  {draftVariants.length > 0 ? (
                    draftVariants.map((variant) => (
                      <View key={variant.id} style={styles.variantEditCard}>
                        <View style={styles.variantsHeader}>
                          <View style={styles.variantEditTitleWrap}>
                            <Text style={styles.variantName}>{variant.name || formatVariantName(variant)}</Text>
                            <Text style={styles.variantSkuText}>SKU: {variant.sku}</Text>
                          </View>
                          <TouchableOpacity onPress={() => deleteDraftVariant(variant.id)} activeOpacity={0.85}>
                            <Ionicons name="trash-outline" size={17} color={Colors.danger} />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.twoCol}>
                          <View style={styles.colItem}>
                            <FieldCard
                              label={t('productEdit.quantity')}
                              value={variant.quantity}
                              onChangeText={(text) => updateDraftVariant(variant.id, 'quantity', text)}
                              keyboardType="numeric"
                              mono
                            />
                          </View>
                          <View style={styles.colItem}>
                            <FieldCard
                              label={t('productEdit.salePrice')}
                              value={variant.price}
                              onChangeText={(text) => updateDraftVariant(variant.id, 'price', text)}
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                        <View style={styles.twoCol}>
                          <View style={styles.colItem}>
                            <FieldCard
                              label={t('productEdit.costPrice')}
                              value={variant.cost_price}
                              onChangeText={(text) => updateDraftVariant(variant.id, 'cost_price', text)}
                              keyboardType="numeric"
                            />
                          </View>
                          <View style={styles.colItem}>
                            <FieldCard
                              label={t('productEdit.promoPrice')}
                              value={variant.promo_price}
                              onChangeText={(text) => updateDraftVariant(variant.id, 'promo_price', text)}
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                        {isRetail && unit ? (
                          <FieldCard
                            label={t('productEdit.exchangeRate', { unitName: optionName(variant.size) || t('productEdit.thisUnit'), unit })}
                            value={variant.exchange_value}
                            onChangeText={(text) => updateDraftVariant(variant.id, 'exchange_value', text)}
                            keyboardType="numeric"
                            mono
                          />
                        ) : null}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.extraEmpty}>{t('productEdit.addAttributesHint')}</Text>
                  )}
                </ScrollView>

                <View style={styles.variantModalFooter}>
                  <TouchableOpacity
                    style={styles.variantCancelButton}
                    onPress={() => setVariantModalVisible(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.variantCancelText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.variantSaveButton} onPress={handleSaveVariantModal} activeOpacity={0.85}>
                    <Text style={styles.variantSaveText}>{t('productEdit.saveVariants')}</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
              </KeyboardAvoidingView>
            </View>
          </Modal>

          <CategorySelectModal
            visible={categoryModalVisible}
            title={t('productEdit.chooseCategory')}
            placeholder={t('productEdit.categorySearchPlaceholder')}
            createPrefix={t('productEdit.createCategory')}
            emptyText={t('productEdit.noCategoryMatch')}
            options={categories}
            value={categoryId}
            search={categorySearch}
            loading={loadingCategories}
            loadingText={t('productEdit.loadingCategories')}
            footerFallbackLabel={t('customers.addTag')}
            creating={creatingCategory}
            onSearchChange={setCategorySearch}
            onSelect={handleSelectCategory}
            onCreate={handleCreateCategory}
            onClose={() => setCategoryModalVisible(false)}
          />
          <CategorySelectModal
            visible={brandModalVisible}
            title={t('productEdit.chooseBrand')}
            placeholder={t('productEdit.brandSearchPlaceholder')}
            createPrefix={t('productEdit.createBrand')}
            emptyText={t('productEdit.noBrandMatch')}
            options={brands}
            value={brandId}
            search={brandSearch}
            loading={loadingBrands}
            loadingText={t('productEdit.loadingBrands')}
            footerFallbackLabel={t('customers.addTag')}
            creating={creatingBrand}
            onSearchChange={setBrandSearch}
            onSelect={handleSelectBrand}
            onCreate={handleCreateBrand}
            onClose={() => setBrandModalVisible(false)}
          />
          <CategorySelectModal
            visible={unitModalVisible}
            title={t('productEdit.chooseUnit')}
            placeholder={t('productEdit.unitSearchPlaceholder')}
            createPrefix={t('productEdit.createUnit')}
            emptyText={t('productEdit.noUnitMatch')}
            options={unitOptions}
            value={unit}
            search={unitSearch}
            loading={loadingUnits}
            loadingText={t('productEdit.loadingUnits')}
            footerFallbackLabel={t('customers.addTag')}
            onSearchChange={setUnitSearch}
            onSelect={handleSelectUnit}
            onCreate={handleCreateUnit}
            onClose={() => setUnitModalVisible(false)}
          />
          <CategorySelectModal
            visible={sizeSuggestModalVisible}
            title={t('productEdit.addSize')}
            placeholder={t('productEdit.sizeSearchPlaceholder')}
            createPrefix={t('productEdit.createSize')}
            emptyText={t('productEdit.noSizeMatch')}
            options={sizeSuggestions}
            search={sizeSuggestSearch}
            loadingText={t('productEdit.loadingSizes')}
            footerFallbackLabel={t('customers.addTag')}
            onSearchChange={setSizeSuggestSearch}
            onSelect={toggleSizeSuggestion}
            onCreate={(name) => handleAddSizeOption({ id: name, name })}
            onClose={() => {
              setSelectedSizeSuggestions([]);
              setSizeSuggestModalVisible(false);
            }}
            selectedValues={selectedSizeSuggestions}
            footerActionLabel={t('productEdit.addSizeCount', { count: selectedSizeSuggestions.length })}
            onFooterAction={handleAddSelectedSizeSuggestions}
          />

          <Modal visible={showBarcodeScanner} animationType="slide" onRequestClose={() => setShowBarcodeScanner(false)}>
            <View style={styles.scannerScreen}>
              {!cameraPermission ? (
                <View style={styles.scannerCenter}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              ) : (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code128', 'itf14', 'codabar'],
                  }}
                  onBarcodeScanned={scannerPaused ? undefined : handleBarcodeScanned}
                />
              )}

              <View style={styles.scannerOverlay} pointerEvents="none">
                <View style={styles.scannerFrame}>
                  <View style={[styles.scannerCorner, styles.scannerCornerTl]} />
                  <View style={[styles.scannerCorner, styles.scannerCornerTr]} />
                  <View style={[styles.scannerCorner, styles.scannerCornerBl]} />
                  <View style={[styles.scannerCorner, styles.scannerCornerBr]} />
                  <View style={styles.scannerLine} />
                </View>
                <Text style={styles.scannerHintText}>{t('productEdit.scanBarcodeHint')}</Text>
              </View>

              <View style={[styles.scannerHeader, { paddingTop: insets.top + 6 }]}>
                <TouchableOpacity onPress={() => setShowBarcodeScanner(false)} style={styles.scannerHeaderBtn}>
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.scannerTitle}>{t('scan.title')}</Text>
                <View style={styles.scannerHeaderBtn} />
              </View>
            </View>
          </Modal>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
    fontFamily: 'monospace',
  },
  savePill: {
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  savePillDisabled: {
    opacity: 0.65,
  },
  savePillText: {
    ...Typography.bodyMd,
    color: '#fff',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 10,
    ...Shadow.sm,
  },
  sectionTitle: {
    ...Typography.bodyMd,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionMutedTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoBox: {
    width: 90,
    height: 90,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 4,
  },
  photoMain: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  photoSelected: {
    borderColor: Colors.danger,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  photoDragging: {
    zIndex: 10,
    opacity: 0.96,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  photoText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  addPhotoBox: {
    width: 90,
    height: 90,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8,
  },
  colItem: {
    flex: 1,
  },
  fieldWrap: {
    marginTop: 6,
  },
  fieldLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  fieldBox: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldBoxHighlight: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  fieldBoxDisabled: {
    opacity: 0.62,
    backgroundColor: Colors.background,
  },
  fieldInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 8,
  },
  fieldInputMono: {
    fontFamily: 'monospace',
  },
  fieldInputDisabled: {
    color: Colors.textSecondary,
  },
  fieldIconButton: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profitHint: {
    marginTop: 8,
    borderRadius: 10,
    padding: 8,
    backgroundColor: Colors.background,
  },
  profitHintText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  profitHintStrong: {
    color: Colors.primary,
    fontWeight: '700',
  },
  variantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recipeHeaderAddButton: {
    minHeight: 34,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeCenteredAddButton: {
    minHeight: 38,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '72%',
    marginTop: 10,
    marginBottom: 2,
  },
  recipeHeaderAddText: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '800',
  },
  modeToggleWrap: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  modeToggleButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  modeToggleButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  modeToggleText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  modeToggleTextActive: {
    color: Colors.primary,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  variantRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
  },
  variantName: {
    ...Typography.bodySm,
    color: Colors.text,
    flex: 1,
    fontWeight: '600',
  },
  variantPriceWrap: {
    alignItems: 'flex-end',
  },
  variantPrice: {
    ...Typography.bodySm,
    color: Colors.primary,
    fontWeight: '700',
  },
  variantPriceOld: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  variantPromoPrice: {
    ...Typography.captionMd,
    color: Colors.danger,
    fontWeight: '700',
  },
  variantStock: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    minWidth: 40,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  variantModal: {
    maxHeight: '88%',
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    ...Shadow.md,
  },
  variantModalSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  variantEditorBlock: {
    marginBottom: 12,
  },
  variantInputRow: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    overflow: 'hidden',
  },
  variantTagInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 8,
  },
  variantTagAddButton: {
    width: 42,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  variantTagChip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  variantGenerateButton: {
    minHeight: 42,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recipeAddButton: {
    minHeight: 46,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  variantGenerateText: {
    ...Typography.bodySm,
    color: Colors.primary,
    fontWeight: '800',
  },
  variantBulkCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 10,
    backgroundColor: Colors.background,
    marginBottom: 12,
  },
  variantApplyButton: {
    minHeight: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  variantApplyText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '800',
  },
  variantEditCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 10,
    backgroundColor: Colors.card,
  },
  variantEditTitleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  variantSkuText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  variantModalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
  },
  variantCancelButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantCancelText: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '800',
  },
  variantSaveButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantSaveText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '800',
  },
  recipeModalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  recipeModalSheet: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingTop: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  recipeModalScroll: {
    flex: 1,
  },
  recipeModalScrollContent: {
    paddingBottom: 12,
  },
  variantModalSheet: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingTop: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  recipeInlineSelect: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    marginTop: 6,
    marginBottom: 10,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  recipeInlineSearchBox: {
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
  },
  recipeInlineSearchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 8,
  },
  recipeInlineSelectList: {
    maxHeight: 292,
  },
  recipeInlineOption: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recipeCreateOption: {
    marginHorizontal: 8,
    marginVertical: 6,
  },
  recipeSearchBox: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: Colors.background,
  },
  recipeSearchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 8,
  },
  recipeEditCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 10,
    backgroundColor: Colors.card,
  },
  recipeSuggestionWrap: {
    gap: 6,
    marginTop: -4,
    marginBottom: 10,
  },
  recipeSuggestion: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  recipeSuggestionName: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '700',
  },
  recipeSuggestionMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recipeCompactBorder: {
    borderTopWidth: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  toggleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderStyle: 'dashed',
  },
  toggleLabel: {
    ...Typography.bodySm,
    color: Colors.text,
    flex: 1,
    paddingRight: 12,
  },
  toggleTrack: {
    width: 40,
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#cfcfcf',
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  extraLine: {
    ...Typography.bodySm,
    color: Colors.text,
    paddingVertical: 5,
  },
  extraEmpty: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    paddingVertical: 6,
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderStyle: 'dashed',
  },
  extraInfo: {
    flex: 1,
  },
  extraName: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '700',
  },
  extraMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  extraMetaWarn: {
    ...Typography.caption,
    color: Colors.danger,
    fontWeight: '700',
    marginTop: 2,
  },
  extraTotal: {
    ...Typography.bodySm,
    color: Colors.primary,
    fontWeight: '700',
  },
  extraTotalLine: {
    ...Typography.bodySm,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'right',
  },
  optionBlock: {
    marginTop: 8,
  },
  optionTitle: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  optionAddButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  optionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  fnbOptionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  fnbOptionHeadName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    fontWeight: '700',
  },
  fnbOptionHeadPrice: {
    ...Typography.caption,
    color: Colors.textSecondary,
    width: 80,
    textAlign: 'right',
    fontWeight: '700',
  },
  fnbOptionHeadPromo: {
    ...Typography.caption,
    color: Colors.textSecondary,
    width: 80,
    textAlign: 'right',
    fontWeight: '700',
  },
  fnbOptionHeadAction: {
    width: 28,
    height: 28,
  },
  fnbOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  fnbOptionNameInput: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fnbOptionPriceInput: {
    width: 80,
    minHeight: 40,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'right',
  },
  fnbOptionPromoInput: {
    width: 80,
    minHeight: 40,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'right',
  },
  fnbOptionRemoveButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#c97a7a',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3f3',
  },
  optionChip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  optionChipText: {
    ...Typography.captionMd,
    color: Colors.text,
    fontWeight: '600',
  },
  percentOptionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  percentOption: {
    flex: 1,
    minHeight: 36,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  percentOptionText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  percentOptionTextActive: {
    color: Colors.primary,
  },
  dangerCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#c97a7a',
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  dangerText: {
    ...Typography.bodyMd,
    color: Colors.danger,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  centerText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  scannerScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  scannerHeaderBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    ...Typography.bodyMd,
    color: '#fff',
    fontWeight: '700',
  },
  scannerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 18,
  },
  scannerFrame: {
    width: 220,
    height: 220,
    maxWidth: '78%',
    maxHeight: '42%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerCorner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#fff',
  },
  scannerCornerTl: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  scannerCornerTr: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  scannerCornerBl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  scannerCornerBr: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  scannerLine: {
    position: 'absolute',
    width: '80%',
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },
  scannerHintText: {
    ...Typography.bodySm,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  modalBackdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalBackdropStatic: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  categoryModal: {
    maxHeight: '72%',
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    ...Shadow.md,
  },
  categoryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryModalTitle: {
    ...Typography.bodyMd,
    color: Colors.text,
    fontWeight: '800',
  },
  categoryCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  categorySearchBox: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  categorySearchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 8,
  },
  categoryList: {
    maxHeight: 340,
  },
  categoryOption: {
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 42,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  categoryOptionActive: {
    backgroundColor: Colors.primaryLight,
    marginVertical: 3,
  },
  categoryOptionText: {
    ...Typography.bodySm,
    color: Colors.text,
    flex: 1,
    fontWeight: '600',
  },
  categoryOptionTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  categoryCreateOption: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 4,
  },
  categoryCreateText: {
    ...Typography.bodySm,
    color: Colors.primary,
    fontWeight: '800',
    flex: 1,
  },
  categoryLoading: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  categoryLoadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  categoryEmptyText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 18,
  },
  modalFooterButton: {
    minHeight: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalFooterButtonDisabled: {
    opacity: 0.45,
  },
  modalFooterButtonText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '800',
  },
  retryButton: {
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
});
