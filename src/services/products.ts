import { request } from './http';
import type {
  Product,
  ProductMakeItem,
  ProductStock,
  ProductVariant,
  ProductVariantAttributes,
  ProductVariantOption,
} from '../types';

type ApiCategory = {
  id?: number;
  name?: string;
  value?: number | string;
  label?: string;
};

type ApiVariant = {
  id?: number;
  product_id?: number;
  sku?: string | null;
  price?: string | number | null;
  cost_price?: string | number | null;
  promo_price?: string | number | null;
  quantity?: string | number | null;
  date_start?: string | null;
  date_end?: string | null;
  attributes?: ProductVariantAttributes | null;
};

type ApiProduct = {
  id?: number;
  name?: string | null;
  sku?: string | null;
  barcode?: string | null;
  image?: string | null;
  images?: string | string[] | null;
  price?: string | number | null;
  price_sale?: string | number | null;
  active_sale?: boolean | string | number | null;
  category_id?: number;
  category?: ApiCategory | null;
  softHide?: boolean | null;
  softDeleted?: boolean | null;
  bestter?: boolean | null;
  date?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  variant?: ApiVariant[];
  variants?: ApiVariant[];
  size?: ProductVariantOption[] | string | null;
  sizes?: ProductVariantOption[] | string | null;
  colors?: ProductVariantOption[] | string | null;
  materials?: ProductVariantOption[] | string | null;
  topping?: ProductVariantOption[] | string | null;
  toppings?: ProductVariantOption[] | string | null;
  ice?: ProductVariantOption[] | string | null;
  sugar?: ProductVariantOption[] | string | null;
  sizeTitle?: string | null;
  colorTitle?: string | null;
  materialTitle?: string | null;
  toppingTitle?: string | null;
  iceTitle?: string | null;
  sugarTitle?: string | null;
};

type ApiProductsResponse = {
  status?: number;
  responseText?: string;
  totalItem?: number;
  totalPage?: number;
  currentPage?: number;
  productLimit?: number | null;
  totalProduct?: number;
  data?: ApiProduct[];
};

type ApiCategoriesResponse = {
  data?: ApiCategory[];
};

type ApiCreateCategoryResponse = {
  data?: ApiCategory;
  category?: ApiCategory;
};

type ApiBusinessTypeResponse = {
  data?: string;
};

type ApiMakeProduct = {
  product_id?: number | string;
  count?: number | string;
  stock?: {
    id?: number | string;
    name?: string | null;
    unit?: string | null;
    count?: number | string | null;
    avarage_price?: number | string | null;
    price_new?: number | string | null;
  } | null;
};

type ApiStock = NonNullable<ApiMakeProduct['stock']>;

type ApiMakeProductsResponse = {
  data?: ApiMakeProduct[];
};

type ApiStocksResponse = {
  data?: ApiStock[];
};

type ApiProvider = {
  id?: number | string;
  name?: string | null;
  label?: string;
  value?: number | string;
};

type ApiProvidersResponse = {
  data?: ApiProvider[];
};

type ApiStockUnit = string | {
  id?: number | string;
  name?: string | null;
  unit?: string | null;
  label?: string;
  value?: string;
};

type ApiStockUnitsResponse = {
  data?: ApiStockUnit[];
};

type ApiCreateProviderResponse = {
  data?: ApiProvider;
  provider?: ApiProvider;
};

type ApiImportProductsResponse = {
  success?: boolean;
  message?: string;
  responseText?: string;
  successfulImports?: unknown[];
  failedImports?: Array<{ row?: number; name?: string; reason?: string; responseText?: string } | string>;
  data?: {
    successful?: unknown[];
    failed?: Array<{ row?: number; name?: string; reason?: string; responseText?: string } | string>;
  };
};

export type ProductListParams = {
  pageSize?: number;
  currentPage?: number;
  search?: string;
};

export type ProductListResult = {
  items: Product[];
  totalItem: number;
  totalPage: number;
  currentPage: number;
  productLimit?: number | null;
  totalProduct: number;
};

export type ProductDetailResult = {
  product: Product;
  businessType: string;
  makeProducts: ProductMakeItem[];
};

export type ProductCategory = {
  id: number;
  name: string;
};

export type ProductBrand = {
  id: number;
  name: string;
};

export type StockUnit = {
  id: string;
  name: string;
};

export type ImportProductPayload = Record<string, unknown>;
export type UpdateProductPayload = Record<string, unknown>;

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(/[,.](?=\d{3}(\D|$))/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toOptionalNumber = (value: unknown) => {
  const parsed = toNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === 'true' || value === '1';
  return false;
};

const parseImages = (images: ApiProduct['images']) => {
  if (!images) return [];
  if (Array.isArray(images)) return images.filter(Boolean);

  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return images ? [images] : [];
  }
};

const parseOptionList = (value: unknown): ProductVariantOption[] => {
  if (!value) return [];

  let raw = value;
  if (typeof value === 'string') {
    try {
      raw = JSON.parse(value);
    } catch {
      return value.trim() ? [{ name: value.trim() }] : [];
    }
  }

  if (!Array.isArray(raw)) return [];

  return raw.reduce<ProductVariantOption[]>((options, item) => {
      if (typeof item === 'string' || typeof item === 'number') {
        options.push({ name: String(item) });
        return options;
      }

      if (!item || typeof item !== 'object') return options;

      const option = item as ProductVariantOption;
      const name = option.name || option.label || option.value;
      if (name) {
        options.push({
          ...option,
          name: String(name),
        });
      }

      return options;
    }, []);
};

const mapVariant = (variant: ApiVariant): ProductVariant => ({
  id: toNumber(variant.id),
  productId: toOptionalNumber(variant.product_id),
  sku: variant.sku || undefined,
  price: toNumber(variant.price),
  costPrice: toNumber(variant.cost_price),
  promoPrice: toOptionalNumber(variant.promo_price),
  quantity: toNumber(variant.quantity),
  dateStart: variant.date_start || null,
  dateEnd: variant.date_end || null,
  attributes: variant.attributes || {},
});

const mapProduct = (product: ApiProduct): Product => {
  const variants = (product.variant || product.variants || []).map(mapVariant);
  const stock = variants.reduce((total, variant) => total + variant.quantity, 0);
  const firstCost = variants.find((variant) => variant.costPrice > 0)?.costPrice || 0;
  const images = parseImages(product.images);
  const image = product.image || images[0] || undefined;
  const isHidden = Boolean(product.softHide || product.softDeleted);

  return {
    id: toNumber(product.id),
    name: product.name || 'Sản phẩm chưa đặt tên',
    sku: product.sku || '',
    barcode: product.barcode || undefined,
    price: toNumber(product.price),
    cost: firstCost,
    stock,
    minStock: 5,
    categoryId: product.category_id,
    category: product.category?.name || 'Chưa phân loại',
    image,
    images,
    priceSale: toNumber(product.price_sale),
    activeSale: toBoolean(product.active_sale),
    bestter: Boolean(product.bestter),
    variantCount: variants.length,
    variants,
    sizeOptions: parseOptionList(product.sizes ?? product.size),
    colorOptions: parseOptionList(product.colors),
    materialOptions: parseOptionList(product.materials),
    toppings: parseOptionList(product.toppings ?? product.topping),
    iceOptions: parseOptionList(product.ice),
    sugarOptions: parseOptionList(product.sugar),
    sizeTitle: product.sizeTitle || undefined,
    colorTitle: product.colorTitle || undefined,
    materialTitle: product.materialTitle || undefined,
    toppingTitle: product.toppingTitle || undefined,
    iceTitle: product.iceTitle || undefined,
    sugarTitle: product.sugarTitle || undefined,
    status: isHidden ? 'inactive' : 'active',
    isOnline: !isHidden,
    allowOversell: false,
    vatApplied: false,
    createdAt: product.createdAt || product.date || '',
    updatedAt: product.updatedAt || undefined,
  };
};

async function listAllProducts() {
  const response = await request<ApiProductsResponse>({
    method: 'GET',
    path: '/product/all',
  });

  return (Array.isArray(response.data) ? response.data : []).map(mapProduct);
}

const mapMakeProduct = (item: ApiMakeProduct): ProductMakeItem => {
  const stock: ProductStock | undefined = item.stock ? mapStock(item.stock) : undefined;

  return {
    productId: toNumber(item.product_id),
    count: toNumber(item.count),
    stock,
  };
};

const mapStock = (stock: ApiStock): ProductStock => ({
  id: toOptionalNumber(stock.id),
  name: stock.name || 'Nguyên liệu',
  unit: stock.unit || undefined,
  count: toNumber(stock.count),
  averagePrice: toOptionalNumber(stock.avarage_price),
  latestPrice: toOptionalNumber(stock.price_new),
});

const mapCategory = (category: ApiCategory): ProductCategory => ({
  id: toNumber(category.id ?? category.value),
  name: category.name || category.label || 'Danh mục chưa đặt tên',
});

const mapProvider = (provider: ApiProvider): ProductBrand => ({
  id: toNumber(provider.id ?? provider.value),
  name: provider.name || provider.label || 'Thương hiệu chưa đặt tên',
});

const mapStockUnit = (unit: ApiStockUnit): StockUnit => {
  if (typeof unit === 'string') {
    return { id: unit, name: unit };
  }

  const name = unit.name || unit.unit || unit.label || unit.value || '';
  return {
    id: String(unit.id ?? unit.value ?? name),
    name,
  };
};

export async function listProducts({
  pageSize = 20,
  currentPage = 1,
  search = '',
}: ProductListParams = {}): Promise<ProductListResult> {
  const query = [
    `pageSize=${encodeURIComponent(String(pageSize))}`,
    `currentPage=${encodeURIComponent(String(currentPage))}`,
    `search=${encodeURIComponent(search)}`,
  ].join('&');

  const response = await request<ApiProductsResponse>({
    method: 'GET',
    path: `/product/json?${query}`,
  });

  const rawItems = Array.isArray(response.data) ? response.data : [];

  return {
    items: rawItems.map(mapProduct),
    totalItem: response.totalItem ?? rawItems.length,
    totalPage: response.totalPage ?? 1,
    currentPage: response.currentPage ?? currentPage,
    productLimit: response.productLimit,
    totalProduct: response.totalProduct ?? response.totalItem ?? rawItems.length,
  };
}

export async function getBusinessType() {
  const response = await request<ApiBusinessTypeResponse>({
    method: 'GET',
    path: '/user/business-type',
  });

  return (response.data || '').toLowerCase();
}

export async function listMakeProducts() {
  const response = await request<ApiMakeProductsResponse>({
    method: 'GET',
    path: '/make-product/all',
  });

  return (response.data || []).map(mapMakeProduct);
}

export async function listStocks(search = '') {
  const query = [
    'pageSize=100',
    'currentPage=1',
    `search=${encodeURIComponent(search)}`,
  ].join('&');

  const response = await request<ApiStocksResponse>({
    method: 'GET',
    path: `/stock/json?${query}`,
  });

  return (response.data || [])
    .map(mapStock)
    .filter((item) => item.name.trim().length > 0);
}

export async function listCategories(search = '') {
  const query = [
    'pageSize=100',
    'currentPage=1',
    `search=${encodeURIComponent(search)}`,
  ].join('&');

  const response = await request<ApiCategoriesResponse>({
    method: 'GET',
    path: `/category/json?${query}`,
  });

  return (response.data || []).map(mapCategory).filter((item) => item.id > 0);
}

export async function createCategory(name: string) {
  const response = await request<ApiCreateCategoryResponse | ApiCategory>({
    method: 'POST',
    path: '/category',
    body: { name },
  });

  const responseObject = response as ApiCreateCategoryResponse;
  const rawCategory = responseObject.data || responseObject.category || (response as ApiCategory);

  return mapCategory(rawCategory);
}

export async function listBrands() {
  const response = await request<ApiProvidersResponse>({
    method: 'GET',
    path: '/company-provider',
  });

  return (response.data || []).map(mapProvider).filter((item) => item.id > 0);
}

export async function createBrand(name: string) {
  const response = await request<ApiCreateProviderResponse | ApiProvider>({
    method: 'POST',
    path: '/company-provider',
    body: { name },
  });

  const responseObject = response as ApiCreateProviderResponse;
  const rawProvider = responseObject.data || responseObject.provider || (response as ApiProvider);

  return mapProvider(rawProvider);
}

export async function listStockUnits() {
  const response = await request<ApiStockUnitsResponse>({
    method: 'GET',
    path: '/stock/all-unit',
  });

  return (response.data || [])
    .map(mapStockUnit)
    .filter((item) => item.name.trim().length > 0);
}

export async function importProducts(productData: ImportProductPayload[], businessType?: string) {
  return request<ApiImportProductsResponse>({
    method: 'POST',
    path: '/product/import-product',
    body: {
      data: productData,
      business_type: businessType,
    },
  });
}

export async function updateProduct(productData: UpdateProductPayload) {
  return request<{ status?: number; responseText?: string; message?: string; data?: unknown }>({
    method: 'PUT',
    path: '/product',
    body: productData,
  });
}

export async function getProductDetail(id: number): Promise<ProductDetailResult> {
  const [products, makeProducts, businessType] = await Promise.all([
    listAllProducts(),
    listMakeProducts(),
    getBusinessType(),
  ]);

  const product = products.find((item) => item.id === id);

  if (!product) {
    throw new Error('Không tìm thấy sản phẩm');
  }

  return {
    product,
    businessType,
    makeProducts: makeProducts.filter((item) => item.productId === id),
  };
}
