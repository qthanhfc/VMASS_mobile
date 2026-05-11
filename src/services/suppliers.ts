import { request } from './http';

type ApiSupplierItem = {
  id?: string | number;
  name?: string | null;
  quantity?: string | number | null;
  price_income?: string | number | null;
  price_outcome?: string | number | null;
  price_pending?: string | number | null;
  stock?: {
    sku?: string | null;
    unit?: string | null;
    category?: string | null;
  } | null;
  company_provider_item_log?: Array<{
    id?: string | number;
    price_outcome?: string | number | null;
    date?: string | null;
    time?: string | null;
    type?: string | null;
    createdAt?: string | null;
  }> | null;
};

type ApiSupplier = {
  id?: string | number;
  code?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  beneficiary_name?: string | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
  categories?: unknown;
  total_price_income?: string | number | null;
  total_price_outcome?: string | number | null;
  total_price_pending?: string | number | null;
  company_provider_item?: ApiSupplierItem[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ApiSuppliersResponse = {
  data?: ApiSupplier[];
  totalItem?: number;
  totalPage?: number;
  currentPage?: number;
};

type ApiSupplierSingleResponse = {
  data?: ApiSupplier;
  responseText?: string;
  status?: number;
};

export type SupplierListItem = {
  id: string;
  name: string;
  code: string;
  category: string;
  categories: string[];
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  currentDebt: number;
  totalOrders: number;
  totalIncome: number;
  totalPaid: number;
  status: 'active' | 'paused';
  color: string;
};

export type SupplierListResult = {
  items: SupplierListItem[];
  totalItem: number;
  totalPage: number;
  currentPage: number;
};

export type SupplierDetail = {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  beneficiaryName: string;
  bankAccountNumber: string;
  bankName: string;
  currentDebt: number;
  totalOrders: number;
  totalIncome: number;
  totalPaid: number;
  lastImportAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    amount: number;
    paid: number;
    pending: number;
  }>;
};

export type SupplierImportEntry = {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  totalIncome: number;
  paidAtImport: number;
  logType: string;
  date: string;
  time: string;
  createdAt: string;
};

const SUPPLIER_COLORS = ['#d97757', '#4a9f4a', '#6b8cae', '#8a6a9e', '#d4a574', '#b08968'];

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(/[,.](?=\d{3}(\D|$))/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const cleanText = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value.trim() || fallback : fallback;

const inferCategory = (items: ApiSupplierItem[] = []) => {
  const explicitCategory = items.find((item) => item.stock?.category)?.stock?.category;
  if (explicitCategory) return explicitCategory;

  const firstItemName = cleanText(items[0]?.name);
  return firstItemName || 'Nhà cung cấp';
};

const normalizeCategories = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  const dedup = new Set<string>();
  value.forEach((item) => {
    const text = typeof item === 'string' ? item.trim() : '';
    if (text.length > 0) dedup.add(text);
  });

  return Array.from(dedup);
};

const getPendingDebt = (supplier: ApiSupplier) => {
  const totalPending = toNumber(supplier.total_price_pending);
  if (totalPending > 0) return totalPending;

  const income = toNumber(supplier.total_price_income);
  const outcome = toNumber(supplier.total_price_outcome);
  return Math.max(0, income - outcome);
};

const mapSupplier = (supplier: ApiSupplier, index: number): SupplierListItem => {
  const id = String(supplier.id ?? '').trim();
  const items = supplier.company_provider_item || [];
  const debt = getPendingDebt(supplier);
  const categories = normalizeCategories(supplier.categories);
  const category = categories[0] || inferCategory(items);

  return {
    id,
    name: cleanText(supplier.name, 'Nhà cung cấp'),
    code: cleanText(supplier.code) || (id ? `NCC-${id.slice(0, 8).toUpperCase()}` : `NCC-${index + 1}`),
    category,
    categories,
    contactPerson: cleanText(supplier.email) || cleanText(supplier.address) || '-',
    phone: cleanText(supplier.phone, '-'),
    email: cleanText(supplier.email),
    address: cleanText(supplier.address),
    currentDebt: debt,
    totalOrders: items.length,
    totalIncome: toNumber(supplier.total_price_income),
    totalPaid: toNumber(supplier.total_price_outcome),
    status: 'active',
    color: SUPPLIER_COLORS[index % SUPPLIER_COLORS.length],
  };
};

const mapSupplierDetail = (supplier: ApiSupplier): SupplierDetail => {
  const id = String(supplier.id ?? '').trim();
  const items = supplier.company_provider_item || [];
  const datedCandidates = items
    .map((item) => ({
      dateText: cleanText((item as any).date),
      createdAt: cleanText((item as any).createdAt),
    }))
    .filter((item) => item.dateText.length > 0 || item.createdAt.length > 0);

  const sortedCandidates = [...datedCandidates].sort((a, b) => {
    const ta = Date.parse(a.createdAt || a.dateText) || 0;
    const tb = Date.parse(b.createdAt || b.dateText) || 0;
    return tb - ta;
  });
  const lastImportAt =
    sortedCandidates.length > 0
      ? sortedCandidates[0].dateText || sortedCandidates[0].createdAt
      : '';
  return {
    id,
    code: cleanText(supplier.code) || (id ? `NCC-${id.slice(0, 8).toUpperCase()}` : 'NCC-MOI'),
    name: cleanText(supplier.name, 'Nhà cung cấp'),
    phone: cleanText(supplier.phone),
    email: cleanText(supplier.email),
    address: cleanText(supplier.address),
    beneficiaryName: cleanText(supplier.beneficiary_name),
    bankAccountNumber: cleanText(supplier.bank_account_number),
    bankName: cleanText(supplier.bank_name),
    currentDebt: getPendingDebt(supplier),
    totalOrders: items.length,
    totalIncome: toNumber(supplier.total_price_income),
    totalPaid: toNumber(supplier.total_price_outcome),
    lastImportAt,
    items: items.map((item, index) => ({
      id: String(item.id ?? index),
      name: cleanText(item.name, 'Mặt hàng'),
      quantity: toNumber(item.quantity),
      unit: cleanText(item.stock?.unit, ''),
      amount: toNumber(item.price_income),
      paid: toNumber(item.price_outcome),
      pending: toNumber(item.price_pending),
    })),
  };
};

const mapImportEntry = (entry: any, index: number): SupplierImportEntry => ({
  id: String(entry?.id ?? index),
  itemId: cleanText(entry?.company_provider_item_id),
  itemName: cleanText(entry?.item_name, 'Mặt hàng'),
  quantity: toNumber(entry?.item_quantity),
  unit: cleanText(entry?.item_unit),
  totalIncome: toNumber(entry?.item_total_income),
  paidAtImport: toNumber(entry?.paid_at_import),
  logType: cleanText(entry?.log_type),
  date: cleanText(entry?.date),
  time: cleanText(entry?.time),
  createdAt: cleanText(entry?.createdAt),
});

export async function paySupplierItemDebt(payload: { itemId: string; amount: number }) {
  return request({
    method: 'POST',
    path: '/company-provider/log',
    body: {
      id: payload.itemId,
      price_outcome: String(Math.max(0, Math.round(payload.amount))),
    },
  });
}

export async function deleteSupplier(id: string) {
  return request({
    method: 'DELETE',
    path: '/company-provider',
    body: {
      arrayId: [id],
    },
  });
}

export async function listSuppliers({
  pageSize = 20,
  currentPage = 1,
  search = '',
}: {
  pageSize?: number;
  currentPage?: number;
  search?: string;
} = {}): Promise<SupplierListResult> {
  const query = [
    `pageSize=${pageSize}`,
    `currentPage=${currentPage}`,
    `search=${encodeURIComponent(search)}`,
  ].join('&');

  const response = await request<ApiSuppliersResponse>({
    method: 'GET',
    path: `/company-provider/json?${query}`,
  });

  const items = (response.data || [])
    .map(mapSupplier)
    .filter((supplier) => supplier.id.length > 0);

  return {
    items,
    totalItem: response.totalItem ?? items.length,
    totalPage: response.totalPage ?? 1,
    currentPage: response.currentPage ?? currentPage,
  };
}

export async function getSupplierDetail(id: string): Promise<SupplierDetail> {
  const response = await request<{ data?: ApiSupplier[] }>({
    method: 'GET',
    path: '/company-provider',
  });

  const match = (response.data || []).find((item) => String(item.id ?? '').trim() === id.trim());
  if (!match) {
    throw new Error('Không tìm thấy nhà cung cấp.');
  }

  return mapSupplierDetail(match);
}

export async function getSupplierImportLogs(id: string): Promise<SupplierImportEntry[]> {
  const response = await request<{ data?: any[] }>({
    method: 'GET',
    path: `/company-provider/import-logs?id=${encodeURIComponent(id)}`,
  });

  return (response.data || []).map(mapImportEntry);
}

export async function createSupplier(payload: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  beneficiaryName?: string;
  bankAccountNumber?: string;
  bankName?: string;
}) {
  const response = await request<ApiSupplierSingleResponse>({
    method: 'POST',
    path: '/company-provider',
    body: {
      name: payload.name.trim(),
      phone: payload.phone?.trim() || '',
      email: payload.email?.trim() || '',
      address: payload.address?.trim() || '',
      beneficiary_name: payload.beneficiaryName?.trim() || '',
      bank_account_number: payload.bankAccountNumber?.trim() || '',
      bank_name: payload.bankName?.trim() || '',
      dynamic_form: {},
      items_to_create: [],
    },
  });

  return response.data ? mapSupplierDetail(response.data) : null;
}

export async function updateSupplier(payload: {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  beneficiaryName?: string;
  bankAccountNumber?: string;
  bankName?: string;
}) {
  const response = await request<ApiSupplierSingleResponse>({
    method: 'PUT',
    path: '/company-provider',
    body: {
      id: payload.id,
      name: payload.name.trim(),
      phone: payload.phone?.trim() || '',
      email: payload.email?.trim() || '',
      address: payload.address?.trim() || '',
      beneficiary_name: payload.beneficiaryName?.trim() || '',
      bank_account_number: payload.bankAccountNumber?.trim() || '',
      bank_name: payload.bankName?.trim() || '',
      dynamic_form: {},
      items_to_create: [],
    },
  });

  return response.data ? mapSupplierDetail(response.data) : null;
}
