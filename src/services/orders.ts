import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from './http';

export type OrderStatus = 'pending' | 'packing' | 'shipping' | 'done' | 'cancelled';
export type OrderChannel = 'pos' | 'shopee' | 'lazada' | 'tiktok' | 'tiki';

export type OrderListItem = {
  id: string;
  detailId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: number;
  total: number;
  status: OrderStatus;
  channel: OrderChannel;
  channelLabel: string;
  createdAt: string;
  updatedAt?: string;
};

export type OrderListParams = {
  pageSize?: number;
  currentPage?: number;
  search?: string;
};

export type OrderListResult = {
  items: OrderListItem[];
  totalItem: number;
  totalPage: number;
  currentPage: number;
  fromCache?: boolean;
};

export type OrderDetailItem = {
  productId: number;
  productName: string;
  qty: number;
  price: number;
  total: number;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  tableLabel: string;
  status: 'pending' | 'paid' | 'packing' | 'shipping' | 'done';
  channel: OrderChannel;
  channelLabel: string;
  paymentLabel: string;
  createdAt: string;
  items: OrderDetailItem[];
  subtotal: number;
  discount: number;
  discountLabel?: string;
  taxFee: number;
  taxFeeLabel?: string;
  feeOther: number;
  feeOtherLabel?: string;
  shipping: number;
  total: number;
  shippingInfo?: {
    trackingCode?: string;
    statusText?: string;
    provider?: string;
    receiverName?: string;
    receiverPhone?: string;
    receiverAddress?: string;
  };
  fromCache?: boolean;
};

type ApiCharge = {
  type?: string | null;
  value?: string | number | null;
};

type ApiOrder = {
  id?: number | string;
  bill_id?: number | string | null;
  date?: string | null;
  time?: string | null;
  count?: number | string | null;
  price?: number | string | null;
  product_id?: number | string | null;
  status_id?: number | string | null;
  payment_method?: string | null;
  phone?: string | null;
  customer_name?: string | null;
  user_identify?: string | null;
  table_id?: string | number | null;
  pin?: string | null;
  pin_print?: string | null;
  updatedAt?: string | null;
  bill?: {
    id?: string | null;
    date?: string | null;
    time?: string | null;
    shippingOrder?: {
      tracking_code?: string | null;
      status?: string | null;
      provider?: string | null;
      status_text?: string | null;
      receiver_name?: string | null;
      receiver_phone?: string | null;
      receiver_address?: string | null;
    } | null;
  } | null;
  product?: {
    name?: string | null;
    price?: number | string | null;
  } | null;
  status?: {
    uuid?: string | null;
    name?: string | null;
  } | null;
  discount?: ApiCharge | null;
  tax_fee?: ApiCharge | null;
  fee_other?: ApiCharge | null;
};

type ApiInvoiceGroup = {
  pin?: string;
  data?: ApiOrder[];
};

type ApiOrdersResponse = {
  status?: number;
  responseText?: string;
  totalItem?: number;
  totalPage?: number;
  currentPage?: number | string;
  data?: ApiInvoiceGroup[];
};

type ApiOrderDetailResponse = {
  status?: number;
  responseText?: string;
  data?: ApiOrder[];
};

const ORDERS_CACHE_KEY = 'orders_list_cache_v1';
const ORDER_DETAIL_CACHE_PREFIX = 'order_detail_cache_v1:';

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(/[,.](?=\d{3}(\D|$))/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeText = (value: unknown) => String(value || '').trim();

const calcCharge = (charge: ApiCharge | null | undefined, base: number) => {
  if (!charge) return 0;
  const value = toNumber(charge.value);
  return charge.type === 'percent' ? Math.round((base * value) / 100) : value;
};

const percentLabel = (charges: Array<ApiCharge | null | undefined>) => {
  const values = Array.from(
    new Set(
      charges
        .filter((charge) => charge?.type === 'percent')
        .map((charge) => toNumber(charge?.value, Number.NaN))
        .filter(Number.isFinite),
    ),
  );

  if (!values.length) return undefined;
  return values.map((value) => `${value}%`).join(', ');
};

const mapStatus = (name?: string | null, statusId?: number | string | null): OrderStatus => {
  const id = toNumber(statusId, Number.NaN);
  if (id === 111) return 'pending';
  if (id === 222) return 'packing';
  if (id === 333) return 'shipping';
  if (id === 444) return 'done';

  const raw = normalizeText(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (raw.includes('huy') || raw.includes('cancel')) return 'cancelled';
  if (raw.includes('giao') || raw.includes('ship')) return 'shipping';
  if (raw.includes('goi') || raw.includes('pack')) return 'packing';
  if (raw.includes('cho') || raw.includes('pending') || raw.includes('created')) return 'pending';
  return 'done';
};

const formatCreatedAt = (order?: ApiOrder) => {
  if (!order) return '';

  const date = normalizeText(order.date || order.bill?.date);
  const time = normalizeText(order.time || order.bill?.time).slice(0, 5);
  if (date && time) {
    const [year, month, day] = date.split('-');
    const formattedDate = year && month && day ? `${day}/${month}/${year}` : date;
    return `${formattedDate} - ${time}`;
  }

  const parsed = new Date(order.updatedAt || date);
  if (Number.isNaN(parsed.getTime())) return date;

  const formattedDate = parsed.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = parsed.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formattedDate} - ${formattedTime}`;
};

const mapInvoiceGroup = (group: ApiInvoiceGroup): OrderListItem => {
  const orders = group.data || [];
  const latestOrder = [...orders].sort((a, b) => {
    const aTime = new Date(a.updatedAt || `${a.date || ''}T${a.time || ''}`).getTime() || 0;
    const bTime = new Date(b.updatedAt || `${b.date || ''}T${b.time || ''}`).getTime() || 0;
    return bTime - aTime;
  })[0];

  const totals = orders.reduce(
    (sum, order) => {
      const qty = Math.max(1, toNumber(order.count, 1));
      const line = toNumber(order.price || order.product?.price) * qty;
      return {
        items: sum.items + qty,
        subtotal: sum.subtotal + line,
        discount: sum.discount + calcCharge(order.discount, line),
        taxFee: sum.taxFee + calcCharge(order.tax_fee, line),
        feeOther: sum.feeOther + calcCharge(order.fee_other, line),
      };
    },
    { items: 0, subtotal: 0, discount: 0, taxFee: 0, feeOther: 0 },
  );

  const pinPrint = normalizeText(latestOrder?.pin_print);
  const pin = normalizeText(group.pin || latestOrder?.pin);
  const billId = normalizeText(latestOrder?.bill?.id);
  const customer = normalizeText(latestOrder?.customer_name);
  const phone = normalizeText(latestOrder?.phone);
  const table = normalizeText(latestOrder?.user_identify || latestOrder?.table_id);
  const customerName = customer
    ? [customer, phone].filter(Boolean).join(' - ')
    : table
      ? `Khách POS - Bàn ${table}`
      : 'Khách POS';

  const orderNumber = pinPrint || pin || billId || String(latestOrder?.id || '');

  return {
    id: [billId || 'bill', orderNumber].filter(Boolean).join(':'),
    detailId: billId || String(latestOrder?.bill_id || latestOrder?.id || pin || ''),
    orderNumber,
    customerName,
    customerPhone: phone,
    items: totals.items,
    total: Math.max(0, totals.subtotal - totals.discount + totals.taxFee + totals.feeOther),
    status: mapStatus(latestOrder?.status?.name, latestOrder?.status_id),
    channel: 'pos',
    channelLabel: 'POS',
    createdAt: formatCreatedAt(latestOrder),
    updatedAt: latestOrder?.updatedAt || undefined,
  };
};

const mapTimelineStatus = (status: OrderStatus): OrderDetail['status'] => {
  if (status === 'pending') return 'pending';
  if (status === 'packing') return 'packing';
  if (status === 'shipping') return 'shipping';
  return 'done';
};

const paymentLabel = (method?: string | null) => {
  const raw = normalizeText(method).toLowerCase();
  if (raw === 'transfer') return 'Chuyển khoản';
  if (raw === 'card') return 'Thẻ';
  if (raw === 'credit') return 'Công nợ';
  return 'Tiền mặt';
};

const buildCustomerDisplay = (order?: ApiOrder) => {
  const customer = normalizeText(order?.customer_name);
  const phone = normalizeText(order?.phone);
  const table = normalizeText(order?.user_identify || order?.table_id);

  if (customer) {
    return {
      name: [customer, phone].filter(Boolean).join(' - '),
      phone,
      tableLabel: table ? `Bàn ${table}` : '',
    };
  }

  return {
    name: table ? `Khách POS - Bàn ${table}` : 'Khách POS',
    phone,
    tableLabel: table ? `Bàn ${table}` : '',
  };
};

const mapOrderDetail = (rows: ApiOrder[], billId: string): OrderDetail => {
  const latestOrder = [...rows].sort((a, b) => {
    const aTime = new Date(a.updatedAt || `${a.date || ''}T${a.time || ''}`).getTime() || 0;
    const bTime = new Date(b.updatedAt || `${b.date || ''}T${b.time || ''}`).getTime() || 0;
    return bTime - aTime;
  })[0];
  const customer = buildCustomerDisplay(latestOrder);
  const pinPrint = normalizeText(latestOrder?.pin_print);
  const pin = normalizeText(latestOrder?.pin);
  const status = mapStatus(latestOrder?.status?.name, latestOrder?.status_id);

  const items = rows.map<OrderDetailItem>((order) => {
    const qty = Math.max(1, toNumber(order.count, 1));
    const price = toNumber(order.price || order.product?.price);
    return {
      productId: toNumber(order.product_id),
      productName: normalizeText(order.product?.name) || 'Sản phẩm',
      qty,
      price,
      total: price * qty,
    };
  });

  const totals = rows.reduce(
    (sum, order) => {
      const qty = Math.max(1, toNumber(order.count, 1));
      const line = toNumber(order.price || order.product?.price) * qty;
      return {
        subtotal: sum.subtotal + line,
        discount: sum.discount + calcCharge(order.discount, line),
        taxFee: sum.taxFee + calcCharge(order.tax_fee, line),
        feeOther: sum.feeOther + calcCharge(order.fee_other, line),
      };
    },
    { subtotal: 0, discount: 0, taxFee: 0, feeOther: 0 },
  );
  const shipping = latestOrder?.bill?.shippingOrder;

  return {
    id: normalizeText(latestOrder?.bill?.id) || billId,
    orderNumber: pinPrint || pin || billId,
    customerName: customer.name,
    customerPhone: customer.phone,
    tableLabel: customer.tableLabel,
    status: mapTimelineStatus(status),
    channel: 'pos',
    channelLabel: 'POS',
    paymentLabel: paymentLabel(latestOrder?.payment_method),
    createdAt: formatCreatedAt(latestOrder),
    items,
    subtotal: totals.subtotal,
    discount: totals.discount,
    discountLabel: percentLabel(rows.map((order) => order.discount)),
    taxFee: totals.taxFee,
    taxFeeLabel: percentLabel(rows.map((order) => order.tax_fee)),
    feeOther: totals.feeOther,
    feeOtherLabel: percentLabel(rows.map((order) => order.fee_other)),
    shipping: 0,
    total: Math.max(0, totals.subtotal - totals.discount + totals.taxFee + totals.feeOther),
    shippingInfo: shipping
      ? {
          trackingCode: normalizeText(shipping.tracking_code),
          statusText: normalizeText(shipping.status_text || shipping.status),
          provider: normalizeText(shipping.provider),
          receiverName: normalizeText(shipping.receiver_name),
          receiverPhone: normalizeText(shipping.receiver_phone),
          receiverAddress: normalizeText(shipping.receiver_address),
        }
      : undefined,
  };
};

const normalizeResponse = (response: ApiOrdersResponse): OrderListResult => ({
  items: Array.from(
    (response.data || [])
      .map(mapInvoiceGroup)
      .filter((item) => item.id && item.detailId)
      .reduce((map, item) => map.set(item.detailId || item.id, item), new Map<string, OrderListItem>())
      .values(),
  ),
  totalItem: toNumber(response.totalItem),
  totalPage: toNumber(response.totalPage, 1),
  currentPage: toNumber(response.currentPage, 1),
});

async function cacheOrders(result: OrderListResult) {
  try {
    await AsyncStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify({ ...result, cachedAt: Date.now() }));
  } catch {
    // Cache is only a fallback; a storage failure should not hide fresh API data.
  }
}

export async function getCachedOrders(): Promise<OrderListResult | null> {
  const raw = await AsyncStorage.getItem(ORDERS_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as OrderListResult;
    const items = (Array.isArray(parsed.items) ? parsed.items : [])
      .map((item) => ({ ...item, detailId: item.detailId || item.id, customerPhone: item.customerPhone || '' }))
      .filter((item) => item.id && item.detailId)
      .reduce((map, item) => map.set(item.detailId || item.id, item), new Map<string, OrderListItem>());

    return {
      items: Array.from(items.values()),
      totalItem: toNumber(parsed.totalItem),
      totalPage: toNumber(parsed.totalPage, 1),
      currentPage: toNumber(parsed.currentPage, 1),
      fromCache: true,
    };
  } catch {
    return null;
  }
}

async function cacheOrderDetail(detail: OrderDetail) {
  try {
    await AsyncStorage.setItem(`${ORDER_DETAIL_CACHE_PREFIX}${detail.id}`, JSON.stringify({ ...detail, cachedAt: Date.now() }));
  } catch {
    // Cache is only a fallback; a storage failure should not hide fresh API data.
  }
}

export async function getCachedOrderDetail(id: number | string): Promise<OrderDetail | null> {
  const raw = await AsyncStorage.getItem(`${ORDER_DETAIL_CACHE_PREFIX}${id}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as OrderDetail;
    return parsed && parsed.id ? { ...parsed, fromCache: true } : null;
  } catch {
    return null;
  }
}

export async function listOrders(params: OrderListParams = {}): Promise<OrderListResult> {
  const pageSize = params.pageSize || 12;
  const currentPage = params.currentPage || 1;
  const search = params.search || '';
  const query = [
    `pageSize=${encodeURIComponent(String(pageSize))}`,
    `currentPage=${encodeURIComponent(String(currentPage))}`,
    `search=${encodeURIComponent(search)}`,
  ].join('&');

  const response = await request<ApiOrdersResponse>({
    method: 'GET',
    path: `/bill/invoice?${query}`,
  });
  const result = normalizeResponse(response);

  if (currentPage === 1) {
    await cacheOrders(result);
  }

  return result;
}

export async function getOrderDetail(id: number | string): Promise<OrderDetail> {
  const billId = String(id);
  const response = await request<ApiOrderDetailResponse>({
    method: 'POST',
    path: '/bill/invoice_by_id',
    body: {
      bill_id: billId,
      with_paymented: true,
    },
  });

  const rows = response.data || [];
  if (!rows.length) {
    throw new Error(response.responseText || 'Không tìm thấy hóa đơn.');
  }

  const detail = mapOrderDetail(rows, billId);
  await cacheOrderDetail(detail);
  return detail;
}
