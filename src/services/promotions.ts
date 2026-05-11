import { request } from './http';

export type PromotionKind = 'DISCOUNT' | 'GIFT';
export type PromotionStatus = 'active' | 'scheduled' | 'ended' | 'paused';
export type PromotionRuleType =
  | 'total-order-value'
  | 'one-product'
  | 'quantity-product'
  | 'one-type-product'
  | 'quantity-type-product'
  | 'customer-accrual-points'
  | 'customer-group-discount'
  | 'first-order-discount'
  | 'product-get-product'
  | 'total-order-value-get-product'
  | 'customer-accrual-points-get-product';

export type PromotionOptionItem = {
  id?: number | string;
  value?: number | string;
  label?: string;
  name?: string;
  quantity?: string | number;
  [key: string]: unknown;
};

export type PromotionRule = {
  id: string;
  price_start?: string;
  price_end?: string;
  discount_value?: string;
  discount_type?: 1 | 2;
  max_discount?: string;
  quantity?: string;
  quantity_type_product?: string;
  customer_point?: string;
  customer_group?: string | PromotionOptionItem;
  product?: PromotionOptionItem[];
  category?: PromotionOptionItem[];
  pgp_buy?: PromotionOptionItem[];
  pgp_gift?: PromotionOptionItem[];
  ogp_gift?: PromotionOptionItem[];
  cpgp_gift?: PromotionOptionItem[];
};

export type Promotion = {
  id: number;
  name: string;
  code: string;
  description: string;
  promotionType: PromotionKind;
  ruleType: PromotionRuleType;
  usageLimit: number;
  usageCount: number;
  maxUsagePerCustomer: number;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  isActive: boolean;
  isAutoUse: boolean;
  isStackable: boolean;
  activeDays: number[];
  activeTimeStart: string;
  activeTimeEnd: string;
  rules: PromotionRule[];
  raw: ApiPromotion;
};

export type PromotionListParams = {
  pageSize?: number;
  currentPage?: number;
  search?: string;
};

export type PromotionListResult = {
  items: Promotion[];
  totalItem: number;
  totalPage: number;
  currentPage: number;
  dataDynamicForm: unknown[];
};

export type PromotionUpsertPayload = {
  id?: number;
  name: string;
  quantity: string | number;
  description?: string;
  date_start: string;
  date_end: string;
  promotionType: PromotionKind;
  type: PromotionRuleType;
  optionDiscount: Array<Record<string, unknown>>;
  isAutoUse: boolean;
  isStackable: boolean;
  maxUsagePerCustomer: string | number;
  activeDays: number[];
  activeTimeStart?: string | null;
  activeTimeEnd?: string | null;
  dynamic_form?: Record<string, unknown>;
};

type ApiPromotionCondition = {
  conditionType?: string;
  minValue?: string | number | null;
  maxValue?: string | number | null;
  itemList?: unknown;
};

type ApiPromotionAction = {
  actionType?: string;
  discountValue?: string | number | null;
  discountUnit?: 'PERCENT' | 'FIXED_AMOUNT' | string | null;
  maxDiscountAmount?: string | number | null;
  actionItems?: unknown;
};

type ApiPromotion = {
  id?: number;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  promotionType?: PromotionKind | string | null;
  startDate?: string | null;
  endDate?: string | null;
  date_start?: string | null;
  date_end?: string | null;
  usageCount?: number | string | null;
  maxUsageTotal?: number | string | null;
  quantity?: number | string | null;
  maxUsagePerCustomer?: number | string | null;
  isActive?: boolean | null;
  isAutoUse?: boolean | null;
  isStackable?: boolean | null;
  activeDays?: number[] | string | null;
  activeTimeStart?: string | null;
  activeTimeEnd?: string | null;
  conditions?: ApiPromotionCondition[];
  actions?: ApiPromotionAction[];
  dynamic_form?: Record<string, unknown>;
};

type ApiPromotionsResponse = {
  status?: number;
  responseText?: string;
  totalItem?: number;
  totalPage?: number;
  currentPage?: number;
  data?: ApiPromotion[];
  dataDynamicForm?: unknown[];
};

const RULE_TYPE_BY_BACKEND: Record<string, PromotionRuleType> = {
  'MIN_ORDER_VALUE+ORDER_DISCOUNT': 'total-order-value',
  'CONTAINS_PRODUCTS+ITEM_DISCOUNT': 'one-product',
  'MIN_PRODUCT_QUANTITY+ITEM_DISCOUNT': 'quantity-product',
  'CONTAINS_CATEGORIES+ITEM_DISCOUNT': 'one-type-product',
  'MIN_CATEGORY_QUANTITY+ITEM_DISCOUNT': 'quantity-type-product',
  'CUSTOMER_POINTS+ORDER_DISCOUNT': 'customer-accrual-points',
  'CUSTOMER_GROUP+ORDER_DISCOUNT': 'customer-group-discount',
  'FIRST_ORDER+ORDER_DISCOUNT': 'first-order-discount',
  'CONTAINS_PRODUCTS+GIVE_GIFT': 'product-get-product',
  'MIN_ORDER_VALUE+GIVE_GIFT': 'total-order-value-get-product',
  'CUSTOMER_POINTS+GIVE_GIFT': 'customer-accrual-points-get-product',
};

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(/\./g, '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toStringValue = (value: unknown) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const parseActiveDays = (value: ApiPromotion['activeDays']) => {
  if (Array.isArray(value)) return value.filter((day) => Number.isFinite(day));
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((day) => Number.isFinite(day)) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const getPromotionStatus = (promotion: {
  isActive?: boolean | null;
  startDate?: string | null;
  endDate?: string | null;
  usageCount?: number | string | null;
  maxUsageTotal?: number | string | null;
  quantity?: number | string | null;
}): PromotionStatus => {
  if (promotion.isActive === false) return 'paused';

  const now = Date.now();
  const start = promotion.startDate ? new Date(promotion.startDate).getTime() : 0;
  const end = promotion.endDate ? new Date(promotion.endDate).getTime() : 0;
  const usageLimit = toNumber(promotion.maxUsageTotal ?? promotion.quantity, -1);
  const usageCount = toNumber(promotion.usageCount);

  if (start && Number.isFinite(start) && start > now) return 'scheduled';
  if ((end && Number.isFinite(end) && end < now) || (usageLimit > 0 && usageCount >= usageLimit)) {
    return 'ended';
  }

  return 'active';
};

export const derivePromotionRuleType = (promotion: Pick<ApiPromotion, 'conditions' | 'actions'>): PromotionRuleType => {
  const condition = promotion.conditions?.[0];
  const action = promotion.actions?.[0];
  const key = `${condition?.conditionType || ''}+${action?.actionType || ''}`;
  return RULE_TYPE_BY_BACKEND[key] || 'total-order-value';
};

const asArray = (value: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(value)) return value as Array<Record<string, unknown>>;
  return [];
};

const mapOptionItem = (item: unknown): PromotionOptionItem => {
  if (!item || typeof item !== 'object') return { label: toStringValue(item), value: toStringValue(item) };
  const raw = item as PromotionOptionItem;
  const id = raw.id ?? raw.value ?? raw.productId ?? raw.categoryId;
  const label = raw.label || raw.name || (id ? String(id) : '');
  return {
    ...raw,
    id: id === undefined ? undefined : id as string | number,
    value: (raw.value ?? id) === undefined ? undefined : (raw.value ?? id) as string | number,
    label,
  };
};

const normalizeDiscountRule = (rule: Record<string, unknown>, index: number): PromotionRule => ({
  id: `${Date.now()}-${index}`,
  price_start: toStringValue(rule.price_start ?? rule.fromValue),
  price_end: toStringValue(rule.price_end ?? rule.toValue),
  discount_value: toStringValue(rule.discount_value ?? rule.discountValue),
  discount_type: (rule.discount_type === 2 || rule.discountUnit === 'PERCENT' ? 2 : 1) as 1 | 2,
  max_discount: toStringValue(rule.max_discount ?? rule.maxDiscount ?? rule.maxDiscountAmount),
  quantity: toStringValue(rule.quantity ?? rule.fromQuantity),
  quantity_type_product: toStringValue(rule.quantity_type_product ?? rule.fromQuantity),
  customer_point: toStringValue(rule.customer_point ?? rule.fromPoints),
  customer_group:
    typeof rule.customer_group === 'object'
      ? rule.customer_group as PromotionOptionItem
      : toStringValue(rule.customer_group ?? rule.customerGroup),
  product: asArray(rule.product).map(mapOptionItem),
  category: asArray(rule.category).map(mapOptionItem),
  pgp_buy: asArray(rule.pgp_buy).map(mapOptionItem),
  pgp_gift: asArray(rule.pgp_gift).map(mapOptionItem),
  ogp_gift: asArray(rule.ogp_gift ?? rule.gifts).map(mapOptionItem),
  cpgp_gift: asArray(rule.cpgp_gift ?? rule.gifts).map(mapOptionItem),
});

export const extractPromotionRules = (promotion: ApiPromotion): PromotionRule[] => {
  const action = promotion.actions?.[0];
  const ruleType = derivePromotionRuleType(promotion);

  if (!action) return [createDefaultRule(ruleType)];

  if (ruleType === 'first-order-discount') {
    return [{
      id: `${Date.now()}-first`,
      discount_value: toStringValue(action.discountValue),
      discount_type: action.discountUnit === 'PERCENT' ? 2 : 1,
      max_discount: toStringValue(action.maxDiscountAmount),
    }];
  }

  const items = action.actionItems;
  const rawRules = Array.isArray(items)
    ? items
    : items && typeof items === 'object' && Array.isArray((items as { rules?: unknown[] }).rules)
      ? (items as { rules: Array<Record<string, unknown>> }).rules
      : [];

  const rules = rawRules.map((rule, index) => normalizeDiscountRule(rule as Record<string, unknown>, index));
  return rules.length ? rules : [createDefaultRule(ruleType)];
};

export const createDefaultRule = (ruleType: PromotionRuleType): PromotionRule => {
  const base: PromotionRule = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    discount_value: ruleType.includes('get-product') || ruleType === 'product-get-product' ? undefined : '10',
    discount_type: 2,
    max_discount: '',
  };

  if (ruleType === 'total-order-value-get-product') return { ...base, price_start: '0', price_end: '', ogp_gift: [] };
  if (ruleType === 'customer-accrual-points-get-product') return { ...base, customer_point: '0', cpgp_gift: [] };
  if (ruleType === 'total-order-value') return { ...base, price_start: '0', price_end: '' };
  if (ruleType === 'quantity-product') return { ...base, quantity: '1' };
  if (ruleType === 'quantity-type-product') return { ...base, quantity_type_product: '1', category: [] };
  if (ruleType === 'customer-accrual-points') return { ...base, customer_point: '0' };
  if (ruleType === 'customer-group-discount') return { ...base, customer_group: 'VIP' };
  if (ruleType === 'one-product') return { ...base, product: [] };
  if (ruleType === 'one-type-product') return { ...base, category: [] };
  if (ruleType === 'product-get-product') return { ...base, pgp_buy: [], pgp_gift: [] };
  return base;
};

export const mapPromotion = (item: ApiPromotion): Promotion => {
  const startDate = item.startDate || item.date_start || '';
  const endDate = item.endDate || item.date_end || '';
  const maxUsageTotal = item.maxUsageTotal ?? item.quantity;
  const ruleType = derivePromotionRuleType(item);

  return {
    id: toNumber(item.id),
    name: item.name || 'Khuyến mãi chưa đặt tên',
    code: item.code || '',
    description: item.description || '',
    promotionType: item.promotionType === 'GIFT' ? 'GIFT' : 'DISCOUNT',
    ruleType,
    usageLimit: toNumber(maxUsageTotal, -1),
    usageCount: toNumber(item.usageCount),
    maxUsagePerCustomer: toNumber(item.maxUsagePerCustomer, 1),
    startDate,
    endDate,
    status: getPromotionStatus({ ...item, startDate, endDate, maxUsageTotal }),
    isActive: item.isActive !== false,
    isAutoUse: Boolean(item.isAutoUse),
    isStackable: Boolean(item.isStackable),
    activeDays: parseActiveDays(item.activeDays),
    activeTimeStart: item.activeTimeStart || '',
    activeTimeEnd: item.activeTimeEnd || '',
    rules: extractPromotionRules(item),
    raw: item,
  };
};

export const serializePromotionRules = (ruleType: PromotionRuleType, rules: PromotionRule[]) => {
  const normalizedRules = rules.length ? rules : [createDefaultRule(ruleType)];

  return normalizedRules.map((rule) => {
    const discountFields = {
      discount_value: rule.discount_value || '0',
      discount_type: rule.discount_type || 1,
      max_discount: rule.max_discount || '',
    };

    if (ruleType === 'total-order-value') {
      return { price_start: rule.price_start || '0', price_end: rule.price_end || '', ...discountFields };
    }
    if (ruleType === 'one-product') {
      return { product: rule.product || [], ...discountFields };
    }
    if (ruleType === 'one-type-product') {
      return { category: rule.category || [], ...discountFields };
    }
    if (ruleType === 'quantity-product') {
      return { quantity: rule.quantity || '1', ...discountFields };
    }
    if (ruleType === 'quantity-type-product') {
      return { quantity_type_product: rule.quantity_type_product || '1', category: rule.category || [], ...discountFields };
    }
    if (ruleType === 'customer-accrual-points') {
      return { customer_point: rule.customer_point || '0', ...discountFields };
    }
    if (ruleType === 'customer-group-discount') {
      const group = rule.customer_group;
      return {
        customer_group: typeof group === 'object'
          ? group
          : { label: String(group || 'VIP'), value: String(group || 'VIP') },
        ...discountFields,
      };
    }
    if (ruleType === 'first-order-discount') {
      return discountFields;
    }
    if (ruleType === 'product-get-product') {
      return { pgp_buy: rule.pgp_buy || [], pgp_gift: rule.pgp_gift || [] };
    }
    if (ruleType === 'total-order-value-get-product') {
      return { price_start: rule.price_start || '0', price_end: rule.price_end || '', ogp_gift: rule.ogp_gift || [] };
    }
    return { customer_point: rule.customer_point || '0', cpgp_gift: rule.cpgp_gift || [] };
  });
};

export async function listPromotions({
  pageSize = 20,
  currentPage = 1,
  search = '',
}: PromotionListParams = {}): Promise<PromotionListResult> {
  const query = [
    `pageSize=${encodeURIComponent(String(pageSize))}`,
    `currentPage=${encodeURIComponent(String(currentPage))}`,
    `search=${encodeURIComponent(search)}`,
  ].join('&');

  const response = await request<ApiPromotionsResponse>({
    method: 'GET',
    path: `/promotion/json?${query}`,
  });

  const rawItems = Array.isArray(response.data) ? response.data : [];

  return {
    items: rawItems.map(mapPromotion),
    totalItem: response.totalItem ?? rawItems.length,
    totalPage: Math.max(response.totalPage ?? 1, 1),
    currentPage: response.currentPage ?? currentPage,
    dataDynamicForm: response.dataDynamicForm || [],
  };
}

export async function createPromotion(payload: PromotionUpsertPayload) {
  return request<{ id?: number; responseText?: string }>({
    method: 'POST',
    path: '/promotion',
    body: payload,
  });
}

export async function updatePromotion(payload: PromotionUpsertPayload & { id: number }) {
  return request<{ status?: number; responseText?: string; data?: unknown }>({
    method: 'PUT',
    path: '/promotion',
    body: payload,
  });
}

export async function togglePromotionStatus(id: number) {
  return request<{ status?: number; responseText?: string; data?: unknown }>({
    method: 'PUT',
    path: '/promotion/update_status',
    body: { id },
  });
}

export async function deletePromotions(arrayId: number[]) {
  return request<{ status?: number; responseText?: string }>({
    method: 'DELETE',
    path: '/promotion',
    body: { arrayId },
  });
}
