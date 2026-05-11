import { request } from './http';

export type ReturnRequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export type ReturnRequestItemPayload = {
  order_id: number;
  product_id?: number | null;
  product_name?: string | null;
  product_sku?: string | null;
  quantity: number;
  unit_price: number;
};

export type ReturnRequestPayload = {
  source_order_code?: string;
  reason_key?: string;
  reason_text?: string;
  notes?: string;
  refund_method?: 'cash' | 'bankTransfer' | 'exchange';
  auto_submit?: boolean;
  items: ReturnRequestItemPayload[];
};

export type ReturnRequest = {
  id: string;
  return_code: string;
  source_order_code?: string | null;
  status: ReturnRequestStatus;
  reason_key?: string | null;
  reason_text?: string | null;
  notes?: string | null;
  refund_method?: string | null;
  reject_reason?: string | null;
  requested_by?: number | null;
  approved_by?: number | null;
  rejected_by?: number | null;
  executed_by?: number | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  executed_at?: string | null;
  total_amount: number;
  createdAt?: string;
  items?: Array<{
    id: string;
    order_id: number;
    product_id?: number | null;
    product_name?: string | null;
    product_sku?: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
};

type ApiResponse<T> = {
  status?: number;
  responseText?: string;
  data?: T;
};

type ApiOrderHistoryLine = {
  id: number;
  price?: number | string | null;
  count?: number | string | null;
  date?: string | null;
  time?: string | null;
  pin_print?: string | null;
  product?: {
    id?: number | null;
    sku?: string | null;
    name?: string | null;
    image?: string | null;
  } | null;
};

export type ReturnableHistoryItem = {
  itemKey: string;
  orderId: number;
  sourceOrderCode: string;
  productId?: number | null;
  productName: string;
  productSku: string;
  productImage?: string | null;
  quantity: number;
  unitPrice: number;
  date: string;
  time: string;
};

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asText = (value: unknown) => String(value || '').trim();

export async function listReturnRequests(params?: {
  status?: ReturnRequestStatus | 'all';
  search?: string;
}): Promise<ReturnRequest[]> {
  const query: string[] = [];
  if (params?.status && params.status !== 'all') query.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.search?.trim()) query.push(`search=${encodeURIComponent(params.search.trim())}`);
  const path = `/return-request${query.length ? `?${query.join('&')}` : ''}`;

  const response = await request<ApiResponse<ReturnRequest[]>>({
    method: 'GET',
    path,
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function getReturnRequestDetail(id: string): Promise<ReturnRequest> {
  const response = await request<ApiResponse<ReturnRequest>>({
    method: 'GET',
    path: `/return-request/${encodeURIComponent(id)}`,
  });
  if (!response.data) {
    throw new Error(response.responseText || 'Không tìm thấy phiếu trả hàng.');
  }
  return response.data;
}

export async function createReturnRequest(payload: ReturnRequestPayload): Promise<ReturnRequest> {
  const response = await request<ApiResponse<ReturnRequest>>({
    method: 'POST',
    path: '/return-request',
    body: payload,
  });

  if (!response.data) {
    throw new Error(response.responseText || 'Không thể tạo phiếu trả hàng.');
  }
  return response.data;
}

export async function approveReturnRequest(id: string): Promise<void> {
  await request<ApiResponse<unknown>>({
    method: 'POST',
    path: `/return-request/${encodeURIComponent(id)}/approve`,
    body: {},
  });
}

export async function rejectReturnRequest(id: string, rejectReason: string): Promise<void> {
  await request<ApiResponse<unknown>>({
    method: 'POST',
    path: `/return-request/${encodeURIComponent(id)}/reject`,
    body: { reject_reason: rejectReason },
  });
}

export async function executeReturnRequest(id: string): Promise<void> {
  await request<ApiResponse<unknown>>({
    method: 'POST',
    path: `/return-request/${encodeURIComponent(id)}/execute`,
    body: {},
  });
}

export async function listReturnableOrderHistory(startDate: string, endDate: string): Promise<ReturnableHistoryItem[]> {
  const response = await request<ApiResponse<Record<string, ApiOrderHistoryLine[]>>>({
    method: 'GET',
    path: `/order/order-history?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
  });
  return mapHistoryPayload(response.data || {});
}

export async function listReturnableOrderHistoryByPhone(phone: string): Promise<ReturnableHistoryItem[]> {
  const normalized = String(phone || '').replace(/[^\d+]/g, '');
  if (!normalized) return [];
  const response = await request<ApiResponse<Record<string, ApiOrderHistoryLine[]>>>({
    method: 'GET',
    path: `/order/order-history-by-phone?phone=${encodeURIComponent(normalized)}`,
  });
  return mapHistoryPayload(response.data || {});
}

const mapHistoryPayload = (raw: Record<string, ApiOrderHistoryLine[]>) => {
  const items: ReturnableHistoryItem[] = [];

  Object.keys(raw).forEach((sourceOrderCode) => {
    const rows = Array.isArray(raw[sourceOrderCode]) ? raw[sourceOrderCode] : [];
    rows.forEach((row) => {
      items.push({
        itemKey: `${toNumber(row.id)}:${toNumber(row.product?.id)}:${asText(sourceOrderCode)}`,
        orderId: toNumber(row.id),
        sourceOrderCode: asText(sourceOrderCode) || asText(row.pin_print) || 'N/A',
        productId: row.product?.id ?? null,
        productName: asText(row.product?.name) || 'Sản phẩm',
        productSku: asText(row.product?.sku) || 'N/A',
        productImage: row.product?.image || null,
        quantity: Math.max(1, toNumber(row.count, 1)),
        unitPrice: toNumber(row.price),
        date: asText(row.date),
        time: asText(row.time),
      });
    });
  });

  return items.filter((item) => item.orderId > 0);
};
