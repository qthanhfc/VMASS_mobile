import {
  createDefaultRule,
  type Promotion,
  type PromotionKind,
  type PromotionRule,
  type PromotionRuleType,
} from '../../services';
import type { TranslationKey } from '../../i18n';

export type RuleTypeOption = {
  key: PromotionRuleType;
  kind: PromotionKind;
  labelKey: TranslationKey;
};

export type PromotionFieldErrors = Record<string, string>;

export const RULE_TYPES: RuleTypeOption[] = [
  { key: 'total-order-value', kind: 'DISCOUNT', labelKey: 'promotions.type.totalOrderValue' },
  { key: 'one-product', kind: 'DISCOUNT', labelKey: 'promotions.type.oneProduct' },
  { key: 'quantity-product', kind: 'DISCOUNT', labelKey: 'promotions.type.quantityProduct' },
  { key: 'one-type-product', kind: 'DISCOUNT', labelKey: 'promotions.type.oneCategory' },
  { key: 'quantity-type-product', kind: 'DISCOUNT', labelKey: 'promotions.type.quantityCategory' },
  { key: 'customer-accrual-points', kind: 'DISCOUNT', labelKey: 'promotions.type.customerPoints' },
  { key: 'customer-group-discount', kind: 'DISCOUNT', labelKey: 'promotions.type.customerGroup' },
  { key: 'first-order-discount', kind: 'DISCOUNT', labelKey: 'promotions.type.firstOrder' },
  { key: 'product-get-product', kind: 'GIFT', labelKey: 'promotions.type.productGift' },
  { key: 'total-order-value-get-product', kind: 'GIFT', labelKey: 'promotions.type.orderGift' },
  { key: 'customer-accrual-points-get-product', kind: 'GIFT', labelKey: 'promotions.type.pointsGift' },
];

export const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const DISCOUNT_RULE_TYPES: PromotionRuleType[] = RULE_TYPES
  .filter((option) => option.kind === 'DISCOUNT')
  .map((option) => option.key);

export const GIFT_RULE_TYPES: PromotionRuleType[] = RULE_TYPES
  .filter((option) => option.kind === 'GIFT')
  .map((option) => option.key);

export function isGiftRule(ruleType: PromotionRuleType) {
  return GIFT_RULE_TYPES.includes(ruleType);
}

export function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('vi-VN') : '';
}

export function formatDateTimeInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDateTimeInput(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
  if (!match) return trimmed;
  const [, dd, mm, yyyy, hh = '0', min = '0'] = match;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min)).toISOString();
}

export function parseNumberText(value?: string) {
  if (!value) return 0;
  const parsed = Number(value.replace(/\D/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function discountPreview(rule: PromotionRule, ruleType: PromotionRuleType) {
  if (isGiftRule(ruleType)) return 'GIFT';
  if (rule.discount_type === 2) return `${rule.discount_value || '?'}%`;
  return `${rule.discount_value || '?'}đ`;
}

export function normalizePromotionForForm(promotion: Promotion) {
  return {
    name: promotion.name,
    code: promotion.code,
    description: promotion.description,
    usageLimit: promotion.usageLimit > 0 ? String(promotion.usageLimit) : '0',
    perCustomer: String(promotion.maxUsagePerCustomer || 1),
    startDate: formatDateTimeInput(promotion.startDate),
    endDate: formatDateTimeInput(promotion.endDate),
    isAutoUse: promotion.isAutoUse,
    isStackable: promotion.isStackable,
    activeDays: promotion.activeDays,
    activeTimeStart: promotion.activeTimeStart,
    activeTimeEnd: promotion.activeTimeEnd,
    promotionType: promotion.promotionType,
    ruleType: promotion.ruleType,
    rules: promotion.rules,
  };
}

const hasItems = (items?: unknown[]) => Boolean(items && items.length > 0);

export function validatePromotionForm(input: {
  name: string;
  usageLimit: string;
  perCustomer: string;
  startDate: string;
  endDate: string;
  ruleType: PromotionRuleType;
  rules: PromotionRule[];
}) {
  const errors: PromotionFieldErrors = {};

  if (!input.name.trim()) errors.name = 'promotions.validation.name';
  if (!input.usageLimit.trim()) errors.usageLimit = 'promotions.validation.usageLimit';
  if (!input.perCustomer.trim()) errors.perCustomer = 'promotions.validation.perCustomer';
  if (!input.startDate.trim()) errors.startDate = 'promotions.validation.startDate';
  if (!input.endDate.trim()) errors.endDate = 'promotions.validation.endDate';

  const parsedStart = Date.parse(parseDateTimeInput(input.startDate));
  const parsedEnd = Date.parse(parseDateTimeInput(input.endDate));
  if (input.startDate.trim() && !Number.isFinite(parsedStart)) errors.startDate = 'promotions.validation.dateFormat';
  if (input.endDate.trim() && !Number.isFinite(parsedEnd)) errors.endDate = 'promotions.validation.dateFormat';
  if (Number.isFinite(parsedStart) && Number.isFinite(parsedEnd) && parsedEnd <= parsedStart) {
    errors.endDate = 'promotions.validation.endAfterStart';
  }

  input.rules.forEach((rule) => {
    const prefix = `rule.${rule.id}`;

    if (input.ruleType === 'total-order-value' || input.ruleType === 'total-order-value-get-product') {
      if (parseNumberText(rule.price_start) < 0) errors[`${prefix}.price_start`] = 'promotions.validation.priceFrom';
    }
    if (input.ruleType === 'quantity-product') {
      if (parseNumberText(rule.quantity) <= 0) errors[`${prefix}.quantity`] = 'promotions.validation.quantity';
    }
    if (input.ruleType === 'quantity-type-product') {
      if (parseNumberText(rule.quantity_type_product) <= 0) errors[`${prefix}.quantity_type_product`] = 'promotions.validation.quantity';
      if (!hasItems(rule.category)) errors[`${prefix}.category`] = 'promotions.validation.category';
    }
    if (input.ruleType === 'customer-accrual-points' || input.ruleType === 'customer-accrual-points-get-product') {
      if (parseNumberText(rule.customer_point) < 0) errors[`${prefix}.customer_point`] = 'promotions.validation.points';
    }
    if (input.ruleType === 'customer-group-discount') {
      const group = typeof rule.customer_group === 'object' ? rule.customer_group?.label : rule.customer_group;
      if (!String(group || '').trim()) errors[`${prefix}.customer_group`] = 'promotions.validation.customerGroup';
    }
    if (input.ruleType === 'one-product' && !hasItems(rule.product)) {
      errors[`${prefix}.product`] = 'promotions.validation.product';
    }
    if (input.ruleType === 'one-type-product' && !hasItems(rule.category)) {
      errors[`${prefix}.category`] = 'promotions.validation.category';
    }
    if (input.ruleType === 'product-get-product') {
      if (!hasItems(rule.pgp_buy)) errors[`${prefix}.pgp_buy`] = 'promotions.validation.buyItems';
      if (!hasItems(rule.pgp_gift)) errors[`${prefix}.pgp_gift`] = 'promotions.validation.giftItems';
    }
    if (input.ruleType === 'total-order-value-get-product' && !hasItems(rule.ogp_gift)) {
      errors[`${prefix}.ogp_gift`] = 'promotions.validation.giftItems';
    }
    if (input.ruleType === 'customer-accrual-points-get-product' && !hasItems(rule.cpgp_gift)) {
      errors[`${prefix}.cpgp_gift`] = 'promotions.validation.giftItems';
    }

    if (!isGiftRule(input.ruleType)) {
      const discount = parseNumberText(rule.discount_value);
      if (discount <= 0) errors[`${prefix}.discount_value`] = 'promotions.validation.discountValue';
      if (rule.discount_type === 2 && discount > 100) errors[`${prefix}.discount_value`] = 'promotions.validation.percentValue';
    }
  });

  return errors;
}

export function firstErrorKey(errors: PromotionFieldErrors) {
  return Object.keys(errors)[0];
}

export function getDefaultRules(ruleType: PromotionRuleType) {
  return [createDefaultRule(ruleType)];
}
