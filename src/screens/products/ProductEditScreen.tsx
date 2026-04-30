import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import {
  createBrand,
  createCategory,
  getBusinessType,
  getProductDetail,
  importProducts,
  listBrands,
  listCategories,
  listStocks,
  listStockUnits,
  updateProduct,
} from '../../services/products';
import type { ProductBrand, ProductCategory, StockUnit } from '../../services/products';
import type { Product, ProductMakeItem, ProductStock, ProductVariant, ProductVariantOption } from '../../types';
import {
  getUnitsForBusinessType,
  loadCustomUnitsForBusinessType,
  saveCustomUnitForBusinessType,
} from '../../utils/productUnits';
import { useLanguage } from '../../i18n';

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
  placeholder?: string;
  mono?: boolean;
  highlight?: boolean;
  dropdown?: boolean;
  scan?: boolean;
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
  stock_quantity?: string;
  stock_cost_price?: string;
  stock_supplier?: string;
  stock_paid?: string;
};

function FieldCard({
  label,
  value,
  onChangeText,
  onPress,
  placeholder,
  mono = false,
  highlight = false,
  dropdown = false,
  scan = false,
  editable = true,
  disabled = false,
  keyboardType = 'default',
}: FieldCardProps) {
  const fieldContent = (
    <>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        style={[styles.fieldInput, mono && styles.fieldInputMono]}
        keyboardType={keyboardType}
        editable={!disabled && editable && !onPress}
        pointerEvents={onPress ? 'none' : 'auto'}
      />
      {scan && <Ionicons name="qr-code" size={16} color={Colors.primary} />}
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

const isFashionBusiness = (businessType: string) => businessType === 'fashion';

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

const toImportOption = (option: ProductVariantOption | string): ProductVariantOption => {
  const name = typeof option === 'string' ? option : optionName(option);
  return {
    ...(typeof option === 'string' ? {} : option),
    name,
    label: name,
    value: name,
  };
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

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [unit, setUnit] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [warehouse, setWarehouse] = useState('');
  const [selectedIce, setSelectedIce] = useState<string[]>([]);
  const [selectedSugar, setSelectedSugar] = useState<string[]>([]);
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
  const [isCombo, setIsCombo] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [allowOversell, setAllowOversell] = useState(false);
  const [vatApplied, setVatApplied] = useState(false);

  const hydrateForm = useCallback((nextProduct: Product, nextMakeProducts: ProductMakeItem[], nextBusinessType = '') => {
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
    setBrand('');
    setCost(formatNumberInput(costValue));
    setPrice(formatNumberInput(nextProduct.price));
    setSalePrice(formatNumberInput(nextProduct.priceSale));
    setUnit(directStock?.unit || '');
    setStock(formatNumberInput(stockValue));
    setMinStock(formatNumberInput(nextProduct.minStock || 5));
    setWarehouse(directStock?.name || '');
    setSelectedIce((nextProduct.iceOptions || []).map(optionName).filter(Boolean));
    setSelectedSugar((nextProduct.sugarOptions || []).map(optionName).filter(Boolean));
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
        }))
      : []);
    setIsCombo(!isRecipeCostBusiness && nextMakeProducts.length > 1);
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
        hydrateForm(detail.product, detail.makeProducts, detail.businessType);
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
      setBrands(nextBrands);
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

  useEffect(() => {
    loadCategories();
    loadBrands();
    loadUnits();
    loadRecipeStocks();
  }, [loadBrands, loadCategories, loadRecipeStocks, loadUnits]);

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
  const isFashion = isFashionBusiness(businessType);
  const isRetail = isRetailBusiness(businessType);
  const showBarcode = !isFnB;
  const hasRecipeConfig = isFnB || isCombo || recipeIngredients.length > 0;
  const showDirectStock = !isFnB && !isCombo && recipeIngredients.length === 0 && makeProducts.length <= 1;
  const showVariantBuilder = !isFnB;
  const variants: DisplayVariant[] = draftVariants.length > 0 ? draftVariants : product?.variants || [];
  const showVariantCard = showVariantBuilder || variants.length > 0;
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
  const recipeStockOptions = useMemo(
    () => recipeStocks.map((stockItem) => ({
      id: stockItem.id ?? stockItem.name,
      name: stockItem.name,
    })),
    [recipeStocks],
  );
  const activeRecipeIngredient = useMemo(
    () => recipeIngredients.find((ingredient) => ingredient.id === activeRecipeIngredientId),
    [activeRecipeIngredientId, recipeIngredients],
  );
  const draftRecipeCost = recipeIngredients.reduce((total, item) => {
    const itemCost = parseCurrency(item.price || item.stock_cost_price || '');
    return total + itemCost * parseDecimalInput(item.quantity || '0');
  }, 0);
  const persistedRecipeCost = makeProducts.reduce((total, item) => {
    const itemCost = item.stock?.averagePrice || item.stock?.latestPrice || 0;
    return total + itemCost * item.count;
  }, 0);
  const recipeCost = draftRecipeCost || persistedRecipeCost;

  useEffect(() => {
    if (hasRecipeConfig && recipeCost > 0) {
      setCost(formatNumberInput(recipeCost));
    }
  }, [hasRecipeConfig, recipeCost]);

  const handleSave = async () => {
    if (saving) return;

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedUnit = unit.trim();
    const trimmedBarcode = barcode.trim();
    const priceValue = parseCurrency(price);
    const salePriceValue = parseCurrency(salePrice);
    const stockValue = parseCurrency(stock);
    const costValue = parseCurrency(cost);
    const missing: string[] = [];
    const normalizedIngredients = recipeIngredients
      .map((ingredient) => ({
        ...ingredient,
        stock_name: ingredient.stock_name.trim(),
        unit: ingredient.unit.trim(),
        quantity: normalizeDecimalInput(ingredient.quantity || '1') || '1',
        price: String(parseCurrency(ingredient.price || ingredient.stock_cost_price || '')),
        stock_cost_price: String(parseCurrency(ingredient.stock_cost_price || ingredient.price || '')),
        stock_quantity: String(parseCurrency(ingredient.stock_quantity || '')),
        stock_paid: String(parseCurrency(ingredient.stock_paid || '')),
        stock_supplier: ingredient.stock_supplier?.trim() || '',
      }))
      .filter((ingredient) => ingredient.stock_name.length > 0);
    const usesRecipe = isFnB || isCombo || normalizedIngredients.length > 0;

    if (!trimmedName) missing.push(t('productEdit.productName'));
    if (!categoryId && !trimmedCategory) missing.push(t('productEdit.category'));
    if (!priceValue) missing.push(t('productEdit.salePrice'));
    if (!isFnB && !trimmedUnit) missing.push(t('productEdit.unit'));
    if (usesRecipe && normalizedIngredients.length === 0) missing.push(t('productEdit.recipe'));
    if (!isFnB && !usesRecipe) {
      if (!stockValue) missing.push(t('productEdit.importQuantity'));
      if (!costValue) missing.push(t('productEdit.costPrice'));
    }

    if (missing.length > 0) {
      Alert.alert(t('productEdit.missingInfo'), t('productEdit.missingFields', { fields: missing.join(', ') }));
      return;
    }

    const invalidIngredient = normalizedIngredients.find((ingredient) =>
      !ingredient.stock_name ||
      !parseDecimalInput(ingredient.quantity) ||
      !parseCurrency(ingredient.price) ||
      (ingredient.is_new_stock && (!ingredient.unit || !parseCurrency(ingredient.stock_cost_price || '') || !parseCurrency(ingredient.stock_quantity || ''))),
    );
    if (invalidIngredient) {
      Alert.alert(
        t('productEdit.missingRecipe'),
        t('productEdit.missingRecipeMessage'),
      );
      return;
    }

    const imageUris = productImages
      .map((photo) => photo.fallbackUri || photo.uri)
      .filter((uri): uri is string => Boolean(uri));
    const activeSale = salePriceValue > 0 && salePriceValue < priceValue;
    const sizePayload = sizeOptions.map(toImportOption);
    const generatedSku = sku.trim() || generateProductSku();
    const commonPayload = {
      name: trimmedName,
      sku: generatedSku,
      barcode: isFnB ? '' : trimmedBarcode,
      category_id: categoryId || null,
      category_name: categoryId ? category : trimmedCategory,
      price: String(priceValue),
      price_sale: salePriceValue > 0 ? String(salePriceValue) : '',
      active_sale: activeSale,
      unit: isFnB ? '' : trimmedUnit,
      image: imageUris[0] || '',
      images: imageUris,
      sizes: sizePayload,
      size: sizePayload,
      toppings: isFnB ? (product?.toppings || []).map(toImportOption) : [],
      topping: isFnB ? (product?.toppings || []).map(toImportOption) : [],
      ice: isCafe ? selectedIce.map(toImportOption) : [],
      sugar: isCafe ? selectedSugar.map(toImportOption) : [],
      color: showVariantBuilder ? variantColorOptions.map(toImportOption) : [],
      material: showVariantBuilder ? variantMaterialOptions.map(toImportOption) : [],
      variants: showVariantBuilder ? draftVariants.map(toBackendVariant) : [],
      bestter: product?.bestter || false,
      softHide: !isOnline,
    };

    if (isEdit) {
      if (!editId) return;

      const updatePayload = {
        ...commonPayload,
        id: editId,
        images_old: JSON.stringify(imageUris),
        sizeOptions: JSON.stringify(sizePayload),
        colorOptions: JSON.stringify(showVariantBuilder ? variantColorOptions.map(toImportOption) : []),
        materialOptions: JSON.stringify(showVariantBuilder ? variantMaterialOptions.map(toImportOption) : []),
        size: JSON.stringify(sizePayload),
        topping: JSON.stringify(isFnB ? (product?.toppings || []).map(toImportOption) : []),
        ice: JSON.stringify(isCafe ? selectedIce.map(toImportOption) : []),
        sugar: JSON.stringify(isCafe ? selectedSugar.map(toImportOption) : []),
        variants: JSON.stringify(showVariantBuilder ? draftVariants.map(toBackendVariant) : []),
        ingredients: usesRecipe ? JSON.stringify(normalizedIngredients) : undefined,
        is_combo: !isFnB && normalizedIngredients.length > 0,
        stock_quantity: usesRecipe ? undefined : String(stockValue),
        stock_cost_price: usesRecipe ? undefined : String(costValue),
        stock_supplier: usesRecipe ? undefined : brand.trim(),
        stock_paid: usesRecipe ? undefined : '',
        stock_remaining: usesRecipe ? undefined : String(stockValue),
      };

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
      ingredients: normalizedIngredients,
      is_combo: !isFnB && normalizedIngredients.length > 0,
      stock_quantity: usesRecipe ? undefined : String(stockValue),
      stock_cost_price: usesRecipe ? undefined : String(costValue),
      stock_supplier: usesRecipe ? undefined : brand.trim(),
      stock_paid: usesRecipe ? undefined : '',
      stock_remaining: usesRecipe ? undefined : String(stockValue),
    };

    try {
      setSaving(true);
      const result = await importProducts([payload], businessType);
      const failedImports = result.failedImports || result.data?.failed || [];

      if (failedImports.length > 0) {
        const message = failedImports
          .map((item) => (typeof item === 'string' ? item : item.responseText || item.reason || item.name || t('productEdit.unknownReason')))
          .join('\n');
        Alert.alert(t('productEdit.createFailed'), message || t('productEdit.backendRejected'));
        return;
      }

      Alert.alert(t('profile.successTitle'), result.message || result.responseText || t('productEdit.created'), [
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
        stock_quantity: '',
        stock_cost_price: '',
        stock_supplier: '',
        stock_paid: '',
      },
    ]);
  }, [unit]);

  const removeRecipeIngredient = useCallback((ingredientId: string) => {
    setRecipeIngredients((current) => current.filter((ingredient) => ingredient.id !== ingredientId));
  }, []);

  const selectRecipeStock = useCallback((ingredientId: string, stockItem: ProductStock) => {
    updateRecipeIngredient(ingredientId, {
      stock_id: stockItem.id ?? null,
      stock_name: stockItem.name,
      unit: stockItem.unit || '',
      price: formatNumberInput(stockItem.averagePrice || stockItem.latestPrice || 0),
      stock_cost_price: formatNumberInput(stockItem.averagePrice || stockItem.latestPrice || 0),
      is_new_stock: false,
    });
    setActiveRecipeIngredientId(null);
    setRecipeSearch('');
  }, [updateRecipeIngredient]);

  const openRecipeStockSelect = useCallback((ingredientId: string) => {
    if (activeRecipeIngredientId === ingredientId) {
      setActiveRecipeIngredientId(null);
      setRecipeSearch('');
      return;
    }

    setActiveRecipeIngredientId(ingredientId);
    setRecipeSearch('');
    loadRecipeStocks('');
  }, [activeRecipeIngredientId, loadRecipeStocks]);

  const handleSelectRecipeStock = useCallback((option: SelectOption) => {
    if (!activeRecipeIngredientId) return;

    const selectedStock = recipeStocks.find((stockItem) =>
      String(stockItem.id ?? stockItem.name) === String(option.id) ||
      stockItem.name.toLowerCase() === option.name.toLowerCase(),
    );

    if (selectedStock) {
      selectRecipeStock(activeRecipeIngredientId, selectedStock);
    } else {
      updateRecipeIngredient(activeRecipeIngredientId, {
        stock_id: null,
        stock_name: option.name,
        unit: '',
        price: '',
        stock_cost_price: '',
        is_new_stock: true,
      });
    }

    setActiveRecipeIngredientId(null);
    setRecipeSearch('');
  }, [activeRecipeIngredientId, recipeStocks, selectRecipeStock, updateRecipeIngredient]);

  const handleCreateRecipeStockName = useCallback((name: string) => {
    const nextName = name.trim();
    if (!activeRecipeIngredientId || !nextName) return;

    updateRecipeIngredient(activeRecipeIngredientId, {
      stock_id: null,
      stock_name: nextName,
      unit: '',
      price: '',
      stock_cost_price: '',
      is_new_stock: true,
    });
    setActiveRecipeIngredientId(null);
    setRecipeSearch('');
  }, [activeRecipeIngredientId, updateRecipeIngredient]);

  const handleSaveRecipeModal = useCallback(() => {
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

    if (!isFnB && recipeIngredients.length > 0) {
      setIsCombo(true);
    }
    setRecipeModalVisible(false);
  }, [isFnB, recipeIngredients]);

  const openRecipeModal = useCallback(() => {
    if (recipeIngredients.length === 0) {
      addRecipeIngredient();
    }
    setRecipeModalVisible(true);
  }, [addRecipeIngredient, recipeIngredients.length]);

  const closeRecipeModal = useCallback(() => {
    const hasConfiguredIngredient = recipeIngredients.some(isRecipeIngredientConfigured);

    if (!hasConfiguredIngredient) {
      setRecipeIngredients([]);
      if (!isFnB) {
        setIsCombo(false);
      }
    }

    setActiveRecipeIngredientId(null);
    setRecipeSearch('');
    setRecipeModalVisible(false);
  }, [isFnB, recipeIngredients]);

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

  const handleAddFnbOption = useCallback((label: string) => {
    Alert.alert(t('productEdit.comingSoon'), t('productEdit.optionFlowComingSoon', { label: label.toLowerCase() }));
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
          const exists = current.some((item) => item.id === nextBrand.id);
          return exists ? current : [nextBrand, ...current];
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

  const renderExtraSections = () => {
    if (!product) return null;

    return (
      <>
        <View style={styles.card}>
          <Text style={styles.sectionMutedTitle}>{t('productEdit.linkedRecipeInventory')}</Text>
          {makeProducts.length === 0 ? (
            <Text style={styles.extraEmpty}>{t('productEdit.noMakeProduct')}</Text>
          ) : !isFnB && makeProducts.length === 1 ? (
            <>
              <Text style={styles.extraLine}>{t('productEdit.warehouse')}: {makeProducts[0].stock?.name || t('common.updatedNotAvailable')}</Text>
              <Text style={styles.extraLine}>
                {t('productEdit.inventory')}: {(makeProducts[0].stock?.count || 0).toLocaleString('vi-VN')}{' '}
                {makeProducts[0].stock?.unit || ''}
              </Text>
              <Text style={styles.extraLine}>
                {t('productEdit.stockCost')}: {formatMoney(makeProducts[0].stock?.averagePrice || makeProducts[0].stock?.latestPrice)}
              </Text>
            </>
          ) : (
            <>
              {makeProducts.map((item, index) => {
                const itemCost = item.stock?.averagePrice || item.stock?.latestPrice || 0;
                return (
                  <View key={`${item.stock?.id || index}-${item.stock?.name || 'stock'}`} style={styles.extraRow}>
                    <View style={styles.extraInfo}>
                      <Text style={styles.extraName}>{item.stock?.name || t('productEdit.ingredient')}</Text>
                      <Text style={styles.extraMeta}>
                        {item.count.toLocaleString('vi-VN')} {item.stock?.unit || ''} x {formatMoney(itemCost)}
                      </Text>
                    </View>
                    <Text style={styles.extraTotal}>{formatMoney(item.count * itemCost)}</Text>
                  </View>
                );
              })}
              <Text style={styles.extraTotalLine}>{t('productEdit.totalCost', { value: formatMoney(recipeCost) })}</Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionMutedTitle}>{t('productEdit.industryOptions')}</Text>
          {(() => {
            if (isFnB) {
              const fnbGroups: Array<[string, ProductVariantOption[] | undefined, () => void]> = [
                [product.sizeTitle || t('productEdit.size'), sizeOptions, () => setSizeSuggestModalVisible(true)],
                [product.toppingTitle || 'Topping', product.toppings, () => handleAddFnbOption('Topping')],
              ];
              const hasFnbOptions = fnbGroups.some(([, options]) => options?.length) || isCafe;

              return hasFnbOptions ? (
                <>
                  {fnbGroups.map(([title, options, onAdd]) => (
                    <View key={title} style={styles.optionBlock}>
                      <View style={styles.optionHeaderRow}>
                        <Text style={styles.optionTitle}>{title}</Text>
                        <TouchableOpacity style={styles.optionAddButton} onPress={onAdd} activeOpacity={0.85}>
                          <Ionicons name="add" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                      {options?.length ? (
                        <View style={styles.optionChips}>
                          {sortOptionsSmallToLarge(options).map((option, index) => (
                            <View key={`${title}-${optionName(option)}-${index}`} style={styles.optionChip}>
                              <Text style={styles.optionChipText}>{optionName(option)}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.extraEmpty}>{t('productEdit.noOption', { label: title.toLowerCase() })}</Text>
                      )}
                    </View>
                  ))}

                  {isCafe && (
                    <>
                      <View style={styles.optionBlock}>
                        <Text style={styles.optionTitle}>{product.iceTitle || t('productEdit.ice')}</Text>
                        <View style={styles.percentOptionRow}>
                          {FNB_PERCENT_OPTIONS.map((value) => {
                            const selected = selectedIce.includes(value);
                            return (
                              <TouchableOpacity
                                key={`ice-${value}`}
                                style={[styles.percentOption, selected && styles.percentOptionActive]}
                                onPress={() => togglePercentOption(value, setSelectedIce)}
                                activeOpacity={0.85}
                              >
                                <Text style={[styles.percentOptionText, selected && styles.percentOptionTextActive]}>
                                  {value}%
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      <View style={styles.optionBlock}>
                        <Text style={styles.optionTitle}>{product.sugarTitle || t('productEdit.sugar')}</Text>
                        <View style={styles.percentOptionRow}>
                          {FNB_PERCENT_OPTIONS.map((value) => {
                            const selected = selectedSugar.includes(value);
                            return (
                              <TouchableOpacity
                                key={`sugar-${value}`}
                                style={[styles.percentOption, selected && styles.percentOptionActive]}
                                onPress={() => togglePercentOption(value, setSelectedSugar)}
                                activeOpacity={0.85}
                              >
                                <Text style={[styles.percentOptionText, selected && styles.percentOptionTextActive]}>
                                  {value}%
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </>
                  )}
                </>
              ) : (
                <Text style={styles.extraEmpty}>{t('productEdit.noIndustryOption')}</Text>
              );
            }

            const optionGroups: Array<[string, ProductVariantOption[] | undefined]> = [];

            optionGroups.push([product.sizeTitle || t('productEdit.size'), product.sizeOptions]);
            if (isFashion) {
              optionGroups.push([product.colorTitle || t('productEdit.color'), product.colorOptions]);
            }
            if (isFashion || isRetail) {
              optionGroups.push([product.materialTitle || t('productEdit.material'), product.materialOptions]);
            }

            const visibleGroups = optionGroups.filter(([, options]) => Array.isArray(options) && options.length > 0);

            return visibleGroups.length > 0 ? (
              <>
                {visibleGroups.map(([title, options]) => (
                  <View key={String(title)} style={styles.optionBlock}>
                    <Text style={styles.optionTitle}>{String(title)}</Text>
                    <View style={styles.optionChips}>
                      {(options || []).map((option, index) => (
                        <View key={`${String(title)}-${optionName(option)}-${index}`} style={styles.optionChip}>
                          <Text style={styles.optionChipText}>{optionName(option)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.extraEmpty}>{t('productEdit.noIndustryOption')}</Text>
            );
          })()}
        </View>
      </>
    );
  };

  const renderVariantAttributeEditor = (
    title: string,
    options: ProductVariantOption[],
    value: string,
    setValue: (text: string) => void,
    setOptions: React.Dispatch<React.SetStateAction<ProductVariantOption[]>>,
    placeholder: string,
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
          returnKeyType="done"
          onSubmitEditing={() => addVariantOption(value, setOptions, setValue)}
        />
        <TouchableOpacity
          style={styles.variantTagAddButton}
          onPress={() => addVariantOption(value, setOptions, setValue)}
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
                  <FieldCard label={t('productEdit.barcode')} value={barcode} onChangeText={setBarcode} mono scan />
                </View>
              </View>
            ) : (
              <FieldCard label="SKU" value={sku} mono disabled />
            )}

            <FieldCard
              label={t('productEdit.category')}
              value={category}
              onPress={() => setCategoryModalVisible(true)}
              placeholder={t('productEdit.categoryPlaceholder')}
              dropdown
              editable={false}
            />
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

            <View style={styles.twoCol}>
              <View style={styles.colItem}>
                <FieldCard
                  label={t(isFnB ? 'productEdit.recipeCostPrice' : 'productEdit.costPrice')}
                  value={cost}
                  onChangeText={handleNumericChange(setCost)}
                  keyboardType="numeric"
                  placeholder="0"
                  mono={isFnB}
                />
              </View>
              <View style={styles.colItem}>
                <FieldCard
                  label={t('productEdit.unit')}
                  value={unit}
                  onPress={() => setUnitModalVisible(true)}
                  placeholder={t('productEdit.unitPlaceholder')}
                  dropdown
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.profitHint}>
              <Text style={styles.profitHintText}>
                💡 {t('productEdit.profitPerProduct')}{' '}
                <Text style={styles.profitHintStrong}>
                  {profitMeta.profit.toLocaleString('vi-VN')} {t('home.currency')} ({profitMeta.percent}%)
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.variantsHeader}>
              <Text style={styles.sectionMutedTitle}>{t(isFnB ? 'productEdit.recipe' : 'productEdit.recipeCombo')}</Text>
              <TouchableOpacity onPress={openRecipeModal} activeOpacity={0.85}>
                <Text style={styles.variantsAdd}>+ {t('customers.addTag')}</Text>
              </TouchableOpacity>
            </View>
            {!isFnB && (
              <ToggleItem
                label={t('productEdit.comboRecipeProduct')}
                value={isCombo || recipeIngredients.length > 0}
                onPress={() => {
                  const nextActive = !(isCombo || recipeIngredients.length > 0);
                  setIsCombo(nextActive);
                  if (nextActive) {
                    openRecipeModal();
                  } else {
                    setRecipeIngredients([]);
                  }
                }}
                last
              />
            )}
            {recipeIngredients.length > 0 ? (
              <>
                {recipeIngredients.slice(0, 3).map((ingredient, index) => {
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
                {recipeIngredients.length > 3 && (
                  <Text style={styles.extraEmpty}>{t('productEdit.moreIngredients', { count: recipeIngredients.length - 3 })}</Text>
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

          {showVariantCard && (
            <View style={styles.card}>
              <View style={styles.variantsHeader}>
                <Text style={styles.sectionMutedTitle}>🎨 {t('productEdit.variants')}</Text>
                {showVariantBuilder && (
                  <TouchableOpacity onPress={() => setVariantModalVisible(true)} activeOpacity={0.85}>
                    <Text style={styles.variantsAdd}>+ {t('customers.addTag')}</Text>
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

          {showDirectStock && (
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
              <FieldCard label={t('productEdit.warehouse')} value={warehouse} onChangeText={setWarehouse} dropdown placeholder={t('products.stock.noLink')} />
            </View>
          )}

          {renderExtraSections()}

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
            animationType="slide"
            onRequestClose={closeRecipeModal}
          >
            <View style={styles.recipeModalBackdrop}>
              <View style={[styles.recipeModalSheet, { marginTop: insets.top + 56, paddingBottom: Math.max(insets.bottom, 12) }]}>
                <View style={styles.categoryModalHeader}>
                  <View>
                    <Text style={styles.categoryModalTitle}>{t('productEdit.configureRecipe', { type: isFnB ? t('productEdit.recipeLower') : 'combo' })}</Text>
                    <Text style={styles.variantModalSubtitle}>{sku} · {businessType || t('productEdit.businessType')}</Text>
                  </View>
                  <TouchableOpacity style={styles.categoryCloseBtn} onPressIn={closeRecipeModal}>
                    <Ionicons name="close" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.recipeModalScroll}
                  contentContainerStyle={styles.recipeModalScrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {recipeIngredients.map((ingredient, index) => {
                    const itemCost = parseCurrency(ingredient.price || ingredient.stock_cost_price || '');
                    const itemCount = parseDecimalInput(ingredient.quantity);

                    return (
                      <View key={ingredient.id} style={styles.recipeEditCard}>
                        <View style={styles.variantsHeader}>
                          <Text style={styles.variantName}>{t('productEdit.ingredientNumber', { index: index + 1 })}</Text>
                          <TouchableOpacity onPress={() => removeRecipeIngredient(ingredient.id)} activeOpacity={0.85}>
                            <Ionicons name="trash-outline" size={17} color={Colors.danger} />
                          </TouchableOpacity>
                        </View>

                        {ingredient.is_new_stock && !ingredient.stock_id ? (
                          <FieldCard
                            label={t('productEdit.newIngredientName')}
                            value={ingredient.stock_name}
                            onChangeText={(value) => updateRecipeIngredient(ingredient.id, { stock_name: value })}
                            placeholder={t('productEdit.newIngredientNamePlaceholder')}
                          />
                        ) : (
                          <FieldCard
                            label={t('productEdit.ingredientName')}
                            value={ingredient.stock_name}
                            onPress={() => openRecipeStockSelect(ingredient.id)}
                            placeholder={t('productEdit.ingredientNamePlaceholder')}
                            dropdown
                            editable={false}
                          />
                        )}

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
                                recipeStocks.map((stockItem) => {
                                  const selected = ingredient.stock_id
                                    ? String(ingredient.stock_id) === String(stockItem.id)
                                    : ingredient.stock_name.toLowerCase() === stockItem.name.toLowerCase();

                                  return (
                                    <TouchableOpacity
                                      key={`${stockItem.id || stockItem.name}`}
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
                        <FieldCard
                          label={t('productEdit.costPerUnit')}
                          value={ingredient.price}
                          onChangeText={handleNumericChange((value) =>
                            updateRecipeIngredient(ingredient.id, { price: value, stock_cost_price: value }),
                          )}
                          keyboardType="numeric"
                        />

                        {!ingredient.stock_id && (
                          <TouchableOpacity
                            style={styles.recipeNewStockRow}
                            onPress={() => updateRecipeIngredient(ingredient.id, { is_new_stock: !ingredient.is_new_stock })}
                            activeOpacity={0.85}
                          >
                            <Ionicons
                              name={ingredient.is_new_stock ? 'checkbox' : 'square-outline'}
                              size={18}
                              color={ingredient.is_new_stock ? Colors.primary : Colors.textSecondary}
                            />
                            <Text style={styles.recipeNewStockText}>{t('productEdit.createNewStock')}</Text>
                          </TouchableOpacity>
                        )}

                        {ingredient.is_new_stock && (
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
                                  label={t('productEdit.stockImportPrice')}
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
                                <FieldCard
                                  label={t('suppliers.title')}
                                  value={ingredient.stock_supplier || ''}
                                  onChangeText={(value) => updateRecipeIngredient(ingredient.id, { stock_supplier: value })}
                                  placeholder={t('productEdit.supplierNamePlaceholder')}
                                />
                              </View>
                            </View>
                          </>
                        )}

                        <Text style={styles.extraTotalLine}>{t('productEdit.lineTotal', { value: formatMoney(itemCost * itemCount) })}</Text>
                      </View>
                    );
                  })}

                  <TouchableOpacity style={styles.variantGenerateButton} onPress={addRecipeIngredient} activeOpacity={0.85}>
                    <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
                    <Text style={styles.variantGenerateText}>{t('productEdit.addIngredient')}</Text>
                  </TouchableOpacity>
                  <Text style={styles.extraTotalLine}>{t('productEdit.totalCost', { value: formatMoney(recipeCost) })}</Text>
                </ScrollView>

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
              </View>
            </View>
          </Modal>

          <Modal
            visible={variantModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setVariantModalVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <Pressable style={styles.modalBackdropPressable} onPressIn={() => setVariantModalVisible(false)} />
              <View style={styles.variantModal}>
                <View style={styles.categoryModalHeader}>
                  <View>
                    <Text style={styles.categoryModalTitle}>{t('productEdit.configureVariants')}</Text>
                    <Text style={styles.variantModalSubtitle}>{sku} · {businessType || t('productEdit.businessType')}</Text>
                  </View>
                  <TouchableOpacity style={styles.categoryCloseBtn} onPressIn={() => setVariantModalVisible(false)}>
                    <Ionicons name="close" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {renderVariantAttributeEditor(
                    variantLabels.size,
                    variantSizeOptions,
                    newVariantSize,
                    setNewVariantSize,
                    setVariantSizeOptions,
                    t('productEdit.addOptionPlaceholder', { label: variantLabels.size.toLowerCase() }),
                  )}
                  {renderVariantAttributeEditor(
                    variantLabels.color,
                    variantColorOptions,
                    newVariantColor,
                    setNewVariantColor,
                    setVariantColorOptions,
                    t('productEdit.addOptionPlaceholder', { label: variantLabels.color.toLowerCase() }),
                  )}
                  {renderVariantAttributeEditor(
                    variantLabels.material,
                    variantMaterialOptions,
                    newVariantMaterial,
                    setNewVariantMaterial,
                    setVariantMaterialOptions,
                    t('productEdit.addOptionPlaceholder', { label: variantLabels.material.toLowerCase() }),
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
              </View>
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
  variantsAdd: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '700',
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
    backgroundColor: 'rgba(0,0,0,0.18)',
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
  recipeNewStockRow: {
    minHeight: 38,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.background,
    marginTop: 4,
    marginBottom: 8,
  },
  recipeNewStockText: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
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
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: Spacing.xl,
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
  modalBackdropPressable: {
    ...StyleSheet.absoluteFillObject,
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
