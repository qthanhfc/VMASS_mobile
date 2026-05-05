import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from './http';
import type { Customer } from '../types';

export type CustomerListParams = {
  pageSize?: number;
  currentPage?: number;
  search?: string;
};

export type CustomerListResult = {
  items: CustomerRow[];
  totalItem: number;
  totalPage: number;
  currentPage: number;
  fromCache?: boolean;
};

export type CustomerRow = Customer & {
  debt: number;
  productCount: number;
  tags: string[];
  hasDebt: boolean;
  birthday?: string;
};

type ApiCustomer = {
  id?: number | string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  birthday?: string | null;
  birth_day?: string | null;
  dob?: string | null;
  armorial?: string | null;
  tier?: string | null;
  customer_tier?: string | null;
  point?: number | string | null;
  points?: number | string | null;
  used?: number | string | null;
  productCount?: number | string | null;
  product_count?: number | string | null;
  totalProduct?: number | string | null;
  total_product?: number | string | null;
  products?: number | string | null;
  totalSpent?: number | string | null;
  total_spent?: number | string | null;
  orderCount?: number | string | null;
  order_count?: number | string | null;
  debt?: number | string | null;
  tags?: string | string[] | null;
  createdAt?: string | null;
  created_at?: string | null;
  updatedAt?: string | null;
  dynamic_form?: unknown;
};

type ApiOrder = {
  id?: number | string | null;
  phone?: string | null;
  customer_name?: string | null;
  date?: string | null;
  time?: string | null;
  pin?: string | null;
  pin_print?: string | null;
  status_id?: number | string | null;
  product_id?: number | string | null;
  count?: number | string | null;
  quantity?: number | string | null;
  qty?: number | string | null;
  price?: number | string | null;
  total?: number | string | null;
  total_price?: number | string | null;
  product_name?: string | null;
  product?: {
    id?: number | string | null;
    name?: string | null;
    price?: number | string | null;
  } | null;
  bill?: {
    id?: number | string | null;
    date?: string | null;
    time?: string | null;
  } | null;
};

type ApiCustomerTag = {
  customer_id?: number | string | null;
  label?: string | null;
  name?: string | null;
  value?: string | null;
};

type ApiCustomerListResponse = {
  data?: ApiCustomer[];
  dataDynamicForm?: unknown[];
  totalItem?: number;
  totalPage?: number;
  currentPage?: number | string;
  responseText?: string;
};

type ApiCustomerTagsResponse = {
  data?: ApiCustomerTag[];
};

type ApiOrdersResponse = {
  data?: ApiOrder[];
};

type CustomerOrderStats = {
  productCount: number;
  totalSpent: number;
};

export type CustomerOrderHistory = {
  id: number | string;
  orderNumber: string;
  channel: 'pos';
  total: number;
  createdAt: string;
  itemCount: number;
};

export type CustomerDetail = {
  customer: CustomerRow;
  tags: string[];
  code: string;
  orders: CustomerOrderHistory[];
  topProducts: CustomerTopProduct[];
};

export type CustomerTopProduct = {
  productId: number;
  productName: string;
  quantity: number;
  totalSpent: number;
  orderCount: number;
  avgPrice: number;
};

const CUSTOMERS_CACHE_KEY = 'customers_list_cache_v1';

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(/[,.](?=\d{3}(\D|$))/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeText = (value: unknown) => String(value || '').trim();

const normalizePhone = (value: unknown) => normalizeText(value).replace(/[^\d+]/g, '');

const normalizeSearchText = (value: unknown) =>
  normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const parseTags = (value: ApiCustomer['tags']) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(normalizeText).filter(Boolean);

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((tag) => {
        if (typeof tag === 'string') return normalizeText(tag);
        if (tag && typeof tag === 'object') {
          const tagObject = tag as { label?: string; name?: string; value?: string };
          return normalizeText(tagObject.label || tagObject.name || tagObject.value);
        }
        return '';
      }).filter(Boolean);
    }
  } catch {
    // Some stores keep tags as comma-separated text instead of JSON.
  }

  return value
    .split(',')
    .map(normalizeText)
    .filter(Boolean);
};

const tierFromCustomer = (customer: ApiCustomer, tags: string[]): Customer['tier'] => {
  const tierSources = [
    customer.tier,
    customer.customer_tier,
    customer.armorial,
    ...tags,
  ].map(normalizeSearchText);

  if (tierSources.some((tag) => tag.includes('vip') || tag.includes('kim cuong') || tag.includes('diamond'))) return 'VIP';
  if (tierSources.some((tag) => tag.includes('gold') || tag.includes('vang'))) return 'Gold';
  if (tierSources.some((tag) => tag.includes('silver') || tag.includes('bac'))) return 'Silver';
  if (tierSources.some((tag) => tag.includes('normal') || tag.includes('thuong') || tag.includes('dong') || tag.includes('bronze'))) return 'Normal';

  const spent = toNumber(customer.totalSpent ?? customer.total_spent ?? customer.debt);
  const points = toNumber(customer.point ?? customer.points);
  const score = Math.max(spent, points * 10000);

  if (score >= 10000000) return 'VIP';
  if (score >= 5000000) return 'Gold';
  if (score >= 1000000) return 'Silver';
  return 'Normal';
};

const buildTagsByCustomerId = (tags: ApiCustomerTag[] = []) =>
  tags.reduce<Record<number, string[]>>((acc, tag) => {
    const customerId = toNumber(tag.customer_id, Number.NaN);
    const label = normalizeText(tag.label || tag.name || tag.value);
    if (!Number.isFinite(customerId) || !label) return acc;

    if (!acc[customerId]) {
      acc[customerId] = [];
    }
    acc[customerId].push(label);
    return acc;
  }, {});

const buildOrderStatsByPhone = (orders: ApiOrder[] = []) =>
  orders.reduce<Record<string, CustomerOrderStats>>((acc, order) => {
    const phone = normalizePhone(order.phone);
    if (!phone) return acc;

    const quantity = Math.max(1, toNumber(order.count ?? order.quantity ?? order.qty, 1));
    const lineTotal = toNumber(
      order.total ?? order.total_price,
      toNumber(order.price) * quantity,
    );

    if (!acc[phone]) {
      acc[phone] = { productCount: 0, totalSpent: 0 };
    }

    acc[phone].productCount += quantity;
    acc[phone].totalSpent += lineTotal;
    return acc;
  }, {});

const mapOrderCreatedAt = (order: ApiOrder) => {
  const dateValue = normalizeText(order.bill?.date || order.date);
  const timeValue = normalizeText(order.bill?.time || order.time);

  if (dateValue && timeValue) {
    return `${dateValue} ${timeValue}`;
  }

  return dateValue || timeValue || '';
};

const mapOrderHistoryByPhone = (orders: ApiOrder[] = []) => {
  const grouped = orders.reduce<Record<string, CustomerOrderHistory>>((acc, order) => {
    const phone = normalizePhone(order.phone);
    if (!phone) return acc;

    const orderId = normalizeText(order.bill?.id || order.id || order.pin || order.pin_print);
    const key = `${phone}:${orderId || normalizeText(order.id)}`;
    const quantity = Math.max(1, toNumber(order.count ?? order.quantity ?? order.qty, 1));
    const lineTotal = toNumber(
      order.total ?? order.total_price,
      toNumber(order.price) * quantity,
    );
    const orderNumber =
      normalizeText(order.pin_print) ||
      normalizeText(order.pin) ||
      normalizeText(order.bill?.id) ||
      normalizeText(order.id) ||
      'N/A';
    const createdAt = mapOrderCreatedAt(order);

    if (!acc[key]) {
      acc[key] = {
        id: orderId || key,
        orderNumber,
        channel: 'pos',
        total: 0,
        createdAt,
        itemCount: 0,
      };
    }

    acc[key].total += lineTotal;
    acc[key].itemCount += quantity;
    return acc;
  }, {});

  return Object.entries(grouped).reduce<Record<string, CustomerOrderHistory[]>>((acc, [key, item]) => {
    const [phone] = key.split(':');
    if (!acc[phone]) {
      acc[phone] = [];
    }
    acc[phone].push(item);
    return acc;
  }, {});
};

const buildTopProductsByPhone = (orders: ApiOrder[] = []) => {
  const groupedByPhone: Record<string, Record<string, CustomerTopProduct>> = {};

  orders.forEach((order) => {
    const phone = normalizePhone(order.phone);
    if (!phone) return;

    const quantity = Math.max(1, toNumber(order.count ?? order.quantity ?? order.qty, 1));
    const lineTotal = toNumber(order.total ?? order.total_price, toNumber(order.price ?? order.product?.price) * quantity);
    const productId = toNumber(order.product_id ?? order.product?.id, 0);
    const productName = normalizeText(order.product_name || order.product?.name) || `SP-${productId || 'N/A'}`;
    const productKey = productId > 0 ? `id:${productId}` : `name:${normalizeSearchText(productName)}`;
    const orderKey = normalizeText(order.bill?.id || order.id || order.pin || order.pin_print) || `${productKey}:${lineTotal}:${quantity}`;

    if (!groupedByPhone[phone]) groupedByPhone[phone] = {};
    if (!groupedByPhone[phone][productKey]) {
      groupedByPhone[phone][productKey] = {
        productId,
        productName,
        quantity: 0,
        totalSpent: 0,
        orderCount: 0,
        avgPrice: 0,
      };
    }

    const item = groupedByPhone[phone][productKey];
    item.quantity += quantity;
    item.totalSpent += lineTotal;
    if (!('__orders' in item)) {
      (item as CustomerTopProduct & { __orders?: Set<string> }).__orders = new Set<string>();
    }
    const orderSet = (item as CustomerTopProduct & { __orders?: Set<string> }).__orders!;
    if (!orderSet.has(orderKey)) {
      orderSet.add(orderKey);
      item.orderCount += 1;
    }
  });

  return Object.entries(groupedByPhone).reduce<Record<string, CustomerTopProduct[]>>((acc, [phone, productsMap]) => {
    const products = Object.values(productsMap)
      .map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        totalSpent: item.totalSpent,
        orderCount: item.orderCount,
        avgPrice: item.quantity > 0 ? Math.round(item.totalSpent / item.quantity) : 0,
      }))
      .sort((a, b) => (b.quantity - a.quantity) || (b.totalSpent - a.totalSpent))
      .slice(0, 5);

    acc[phone] = products;
    return acc;
  }, {});
};

const customerKey = (customer: CustomerRow) => {
  if (customer.id > 0) return `id:${customer.id}`;
  const phone = normalizePhone(customer.phone);
  if (phone) return `phone:${phone}`;
  if (customer.email) return `email:${customer.email.toLowerCase()}`;
  return `name:${normalizeSearchText(customer.name)}`;
};

const uniqueCustomers = (customers: CustomerRow[]) => {
  const seen = new Set<string>();

  return customers.filter((customer) => {
    const key = customerKey(customer);
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const mapCustomer = (
  customer: ApiCustomer,
  tagsByCustomerId: Record<number, string[]>,
  orderStatsByPhone: Record<string, CustomerOrderStats>,
): CustomerRow => {
  const id = toNumber(customer.id);
  const tags = Array.from(new Set([...parseTags(customer.tags), ...(tagsByCustomerId[id] || [])]));
  const orderStats = orderStatsByPhone[normalizePhone(customer.phone)];
  const totalSpent = orderStats?.totalSpent ?? toNumber(customer.totalSpent ?? customer.total_spent ?? customer.debt);
  const debt = toNumber(customer.debt);
  const orderCount = toNumber(customer.used ?? customer.orderCount ?? customer.order_count);
  const productCount =
    orderStats?.productCount ??
    toNumber(
      customer.productCount ??
        customer.product_count ??
        customer.totalProduct ??
        customer.total_product ??
        customer.products ??
        customer.orderCount ??
        customer.order_count,
    );

  return {
    id,
    name: normalizeText(customer.name) || 'Khách hàng chưa đặt tên',
    phone: normalizeText(customer.phone),
    email: normalizeText(customer.email) || undefined,
    address: normalizeText(customer.address) || undefined,
    totalSpent,
    orderCount,
    points: toNumber(customer.point ?? customer.points),
    tier: tierFromCustomer(customer, tags),
    createdAt: normalizeText(customer.createdAt || customer.created_at),
    notes: tags.join(', ') || undefined,
    birthday: normalizeText(customer.birthday || customer.birth_day || customer.dob) || undefined,
    productCount,
    tags,
    debt,
    hasDebt: debt !== 0,
  };
};

async function listCustomerTags() {
  const response = await request<ApiCustomerTagsResponse>({
    method: 'GET',
    path: '/customer/tags',
  });

  return response.data || [];
}

async function listCustomerOrderStats() {
  try {
    const response = await request<ApiOrdersResponse>({
      method: 'GET',
      path: '/order/all',
    });

    return buildOrderStatsByPhone(response.data || []);
  } catch {
    // If order statistics are temporarily unavailable, keep the customer list usable.
    return {};
  }
}

async function fetchCustomerBaseData() {
  const [customersResponse, tags, ordersResponse] = await Promise.all([
    request<{ data?: ApiCustomer[] }>({
      method: 'GET',
      path: '/customer',
    }),
    listCustomerTags(),
    request<ApiOrdersResponse>({
      method: 'GET',
      path: '/order/all',
    }),
  ]);

  const rawCustomers = customersResponse.data || [];
  const rawOrders = ordersResponse.data || [];
  const tagsByCustomerId = buildTagsByCustomerId(tags);
  const orderStatsByPhone = buildOrderStatsByPhone(rawOrders);
  const orderHistoryByPhone = mapOrderHistoryByPhone(rawOrders);
  const topProductsByPhone = buildTopProductsByPhone(rawOrders);

  return {
    customers: uniqueCustomers(rawCustomers.map((item) => mapCustomer(item, tagsByCustomerId, orderStatsByPhone))),
    orderHistoryByPhone,
    topProductsByPhone,
    tagsByCustomerId,
  };
}

async function cacheCustomers(result: CustomerListResult) {
  try {
    await AsyncStorage.setItem(CUSTOMERS_CACHE_KEY, JSON.stringify({ ...result, cachedAt: Date.now() }));
  } catch {
    // Cache is a resilience layer only; fresh API data remains the source of truth.
  }
}

export async function getCachedCustomers(): Promise<CustomerListResult | null> {
  const raw = await AsyncStorage.getItem(CUSTOMERS_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CustomerListResult;
    const items = uniqueCustomers(Array.isArray(parsed.items) ? parsed.items : []);

    return {
      items,
      totalItem: toNumber(parsed.totalItem, items.length),
      totalPage: toNumber(parsed.totalPage, 1),
      currentPage: toNumber(parsed.currentPage, 1),
      fromCache: true,
    };
  } catch {
    return null;
  }
}

export async function listCustomers({
  pageSize = 12,
  currentPage = 1,
  search = '',
}: CustomerListParams = {}): Promise<CustomerListResult> {
  const query = [
    `pageSize=${encodeURIComponent(String(pageSize))}`,
    `currentPage=${encodeURIComponent(String(currentPage))}`,
    `search=${encodeURIComponent(search)}`,
  ].join('&');

  const [response, tags, orderStatsByPhone] = await Promise.all([
    request<ApiCustomerListResponse>({
      method: 'GET',
      path: `/customer/json?${query}`,
    }),
    listCustomerTags(),
    listCustomerOrderStats(),
  ]);

  const rawItems = Array.isArray(response.data) ? response.data : [];
  const tagsByCustomerId = buildTagsByCustomerId(tags);
  const items = uniqueCustomers(rawItems.map((item) => mapCustomer(item, tagsByCustomerId, orderStatsByPhone)));
  const result = {
    items,
    totalItem: response.totalItem ?? items.length,
    totalPage: response.totalPage ?? 1,
    currentPage: toNumber(response.currentPage, currentPage),
  };

  if (currentPage === 1) {
    await cacheCustomers(result);
  }

  return result;
}

export async function listAllCustomers(): Promise<CustomerRow[]> {
  const { customers } = await fetchCustomerBaseData();
  return customers;
}

export async function getCustomerDetail(identity: { id?: number; phone?: string }): Promise<CustomerDetail> {
  const { customers, orderHistoryByPhone, topProductsByPhone } = await fetchCustomerBaseData();
  const normalizedPhone = normalizePhone(identity.phone);
  const validId = Number.isFinite(identity.id) ? Number(identity.id) : 0;
  const customer =
    customers.find((item) => validId > 0 && item.id === validId) ||
    customers.find((item) => normalizedPhone.length > 0 && normalizePhone(item.phone) === normalizedPhone);

  if (!customer) {
    throw new Error('Không tìm thấy khách hàng');
  }

  const phoneKey = normalizePhone(customer.phone);
  const orders = (orderHistoryByPhone[phoneKey] || [])
    .sort((a, b) => normalizeText(b.createdAt).localeCompare(normalizeText(a.createdAt)))
    .slice(0, 10);

  return {
    customer,
    tags: customer.tags,
    code: `KH-${String(customer.id).padStart(4, '0')}`,
    orders,
    topProducts: topProductsByPhone[phoneKey] || [],
  };
}
