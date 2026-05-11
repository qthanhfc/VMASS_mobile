import { request } from './http';

export type PosChargeForm = {
  orders_id: Array<number | string>;
  user_id: string;
  note: string;
  value: string | number;
  type: 'percent' | 'price';
  saved: boolean;
  isManual?: boolean;
};

export type PosCheckoutItem = {
  id?: number | string;
  product_id: number;
  name: string;
  product: {
    name: string;
    price: number;
    category_id?: number;
  };
  price: number;
  count: number;
  id_variant?: number | null;
  size?: string;
  topping?: string;
  ice?: string;
  sugar?: string;
  sizeSelectedId?: Array<number | string>;
  toppingSelectedId?: Array<number | string>;
  selectedAttributes?: Record<string, { label?: string; value?: string }>;
  note?: string;
};

export type CreateGuestOrderPayload = {
  deleted_orders?: Array<number | string>;
  pin?: string;
  pin_print?: string;
  data: PosCheckoutItem[];
  store?: string;
  phone?: string;
  name?: string;
  hash?: string;
  table_id?: string | number;
  paid?: string;
  payment_method?: string;
  staff_id?: string | number | null;
  discount?: PosChargeForm;
  tax_fee?: PosChargeForm;
  fee_other?: PosChargeForm;
  date?: string;
};

export type GuestOrderResponse = {
  status?: number;
  responseText?: string;
  bill_id?: string | number;
  data?: unknown;
};

type ShippingProviderResponse = {
  data?: Array<{
    provider?: string;
    active?: boolean;
    connected?: boolean;
  }>;
};

type ShippingNode = {
  label?: string;
  name?: string;
  value?: string | number;
  id?: string | number;
  DistrictID?: string | number;
  WardCode?: string | number;
  ProvinceID?: string | number;
};

type ShippingNodesResponse = {
  success?: boolean;
  message?: string;
  data?: ShippingNode[];
};

type ShippingFeeResponse = {
  success?: boolean;
  message?: string;
  data?: {
    fee?: number;
  };
};

type CreateShippingOrderResponse = {
  success?: boolean;
  message?: string;
  data?: {
    tracking_code?: string;
    order_code?: string;
  };
};

type EInvoiceConfigResponse = {
  data?: {
    is_active?: boolean;
    auto_issue?: boolean;
    vat_rate?: number;
    create_draft_when_not_issue?: boolean;
  } | null;
};

type EInvoiceIssueResponse = {
  message?: string;
  responseText?: string;
  data?: unknown;
};

type PromotionValidateResponse = {
  valid?: boolean;
  invalidPromotions?: Array<{
    id?: number | string;
    name?: string;
    message?: string;
  }>;
  responseText?: string;
};

type AvailablePromotionResponse = {
  status?: number;
  responseText?: string;
  message?: string;
  data?: Array<{
    id?: number | string;
    name?: string;
    code?: string;
    benefit?: {
      actualDiscount?: number;
      gifts?: Array<{ productId?: number | string; productName?: string; quantity?: number }>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
};

type PromotionUsageResponse = {
  status?: number;
  responseText?: string;
  message?: string;
};

type ProvisionalOrderRow = {
  id?: number | string;
  pin?: string;
  pin_print?: string;
  product_id?: number | string;
  count?: number | string;
  price?: number | string;
  size?: string | null;
  topping?: string | null;
  ice?: string | null;
  sugar?: string | null;
  note?: string | null;
  product?: {
    id?: number | string;
    name?: string | null;
  } | null;
  discount?: { value?: string | number; type?: string; note?: string } | null;
  tax_fee?: { value?: string | number; type?: string; note?: string } | null;
  fee_other?: { value?: string | number; type?: string; note?: string } | null;
};

type ProvisionalInvoiceItem = {
  orders?: ProvisionalOrderRow[];
  data?: ProvisionalOrderRow[];
  pin?: string;
};

type ProvisionalInvoicesResponse = {
  status?: number;
  responseText?: string;
  data?: ProvisionalInvoiceItem[];
};

export async function createGuestOrderDone(payload: CreateGuestOrderPayload) {
  return request<GuestOrderResponse>({
    method: 'POST',
    path: '/bill/guest_order_done',
    body: payload,
  });
}

export async function createGuestPending(payload: CreateGuestOrderPayload) {
  return request<GuestOrderResponse>({
    method: 'POST',
    path: '/bill/guest-pending',
    body: payload,
  });
}

export async function listConnectedShippingProviders() {
  const response = await request<ShippingProviderResponse>({
    method: 'GET',
    path: '/shipping/connected',
  });

  return (response.data || []).filter(
    (item) => item.connected !== false && item.active !== false && item.provider,
  );
}

export async function getShippingProvinces(provider: string) {
  const response = await request<ShippingNodesResponse>({
    method: 'GET',
    path: `/shipping/provinces/${encodeURIComponent(provider)}`,
  });
  return response.data || [];
}

export async function getShippingDistricts(provider: string, provinceId: string | number) {
  const response = await request<ShippingNodesResponse>({
    method: 'GET',
    path: `/shipping/districts/${encodeURIComponent(provider)}/${encodeURIComponent(String(provinceId))}`,
  });
  return response.data || [];
}

export async function getShippingWards(provider: string, districtId: string | number) {
  const response = await request<ShippingNodesResponse>({
    method: 'GET',
    path: `/shipping/wards/${encodeURIComponent(provider)}/${encodeURIComponent(String(districtId))}`,
  });
  return response.data || [];
}

export async function calculateShippingFee(payload: {
  provider: string;
  to_district_id: string | number;
  to_ward_code?: string | number | null;
  weight: number;
  cod_value: number;
}) {
  return request<ShippingFeeResponse>({
    method: 'POST',
    path: '/shipping/calculate-fee',
    body: payload,
  });
}

export async function createShippingOrder(payload: {
  provider: string;
  bill_id: string | number;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  receiver_province_id?: string | number | null;
  receiver_district_id?: string | number | null;
  receiver_ward_code?: string | number | null;
  weight: number;
  cod_amount: number;
  note?: string;
  items: Array<{ name: string; quantity: number; weight?: number }>;
}) {
  return request<CreateShippingOrderResponse>({
    method: 'POST',
    path: '/shipping/create-order',
    body: payload,
  });
}

export async function getEInvoiceConfig(userId: string | number) {
  return request<EInvoiceConfigResponse>({
    method: 'GET',
    path: `/api/einvoice/config?user_id=${encodeURIComponent(String(userId))}`,
  });
}

export async function issueEInvoice(payload: {
  user_id: string | number;
  bill_id: string | number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_email: string;
  customer_tax_id: string;
  subtotal: number;
  discount_amount: number;
  vat_rate: number;
  payment_method: string;
  items: Array<{ name: string; quantity: number; unit_price: number; amount: number }>;
  note: string;
  is_draft: boolean;
}) {
  return request<EInvoiceIssueResponse>({
    method: 'POST',
    path: '/api/einvoice/issue',
    body: payload,
  });
}

export async function validateCheckoutPromotions(payload: {
  promotionIds: Array<number | string>;
  cartData: Array<{ id: number; quantity: number; price: number; category_id?: number | null }>;
  customerPhone?: string | null;
}) {
  return request<PromotionValidateResponse>({
    method: 'POST',
    path: '/promotion/validate-checkout',
    body: payload,
  });
}

export async function getAvailablePromotions(payload: {
  cartData: Array<{ id: number; quantity: number; price: number; category_id?: number | null; isGift?: boolean }>;
  customerPhone?: string | null;
}) {
  return request<AvailablePromotionResponse>({
    method: 'POST',
    path: '/promotion/available',
    body: payload,
  });
}

export async function recordPromotionUsage(payload: {
  promotionId: number | string;
  customerPhone?: string | null;
  billId: number | string;
  discountAmount?: number;
  giftItems?: unknown;
  orderTotal?: number;
}) {
  return request<PromotionUsageResponse>({
    method: 'POST',
    path: '/promotion/record-usage',
    body: payload,
  });
}

export async function getProvisionalInvoices() {
  const response = await request<ProvisionalInvoicesResponse>({
    method: 'GET',
    path: '/order/order_provision_invoice',
  });
  return response.data || [];
}
