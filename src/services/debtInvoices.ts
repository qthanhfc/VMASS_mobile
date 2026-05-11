import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedCustomers, listCustomers } from './customers';
import { getCachedOrders, listOrders, type OrderListItem } from './orders';
import { listSuppliers } from './suppliers';
import { request } from './http';

export type DebtInvoiceKind = 'receivable' | 'payable';
export type DebtInvoiceStatus = 'open' | 'partial' | 'overdue' | 'settled' | 'cancelled';
export type DebtInvoiceFilter = 'all' | 'receivable' | 'payable' | 'overdue' | 'open' | 'settled';

export type DebtInvoiceListItem = {
  id: string;
  code: string;
  sourceType: 'order' | 'supplier';
  sourceId: string;
  kind: DebtInvoiceKind;
  status: DebtInvoiceStatus;
  partyName: string;
  partyPhone?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  issueDate: string;
  dueDate: string;
  updatedAt: string;
  note?: string;
};

export type DebtInvoiceTransaction = {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'cash' | 'bank' | 'card' | 'other';
  paidAt: string;
  note?: string;
  createdAt: string;
};

export type DebtInvoiceDetail = DebtInvoiceListItem & {
  transactions: DebtInvoiceTransaction[];
};

export type DebtInvoiceListResult = {
  items: DebtInvoiceListItem[];
  totalItem: number;
  totalPage: number;
  currentPage: number;
  fromCache?: boolean;
};

export type DebtInvoiceSummary = {
  totalReceivable: number;
  totalPayable: number;
  overdueReceivable: number;
  overduePayable: number;
  dueToday: number;
  totalOpen: number;
  totalSettled: number;
};

export type DebtInvoiceListParams = {
  pageSize?: number;
  currentPage?: number;
  search?: string;
  filter?: DebtInvoiceFilter;
};

const DEBT_INVOICES_CACHE_KEY = 'debt_invoices_cache_v1';
const DEBT_INVOICE_TX_KEY = 'debt_invoice_transactions_v1';

const DEFAULT_ORDER_DEBT_RATIO = 0.35;
const DEFAULT_DUE_DAYS_RECEIVABLE = 14;
const DEFAULT_DUE_DAYS_PAYABLE = 21;
const ENABLE_DEBT_INVOICE_API = true;

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(/[,.](?=\d{3}(\D|$))/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeText = (value: unknown) => String(value || '').trim();

const toIsoDate = (value: string) => {
  const normalized = value.replace(' - ', ' ').trim();
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return new Date().toISOString();
};

const addDaysIso = (isoDate: string, days: number) => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString();
};

const compareByUpdatedAt = (a: DebtInvoiceListItem, b: DebtInvoiceListItem) =>
  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

function computeStatus(item: Pick<DebtInvoiceListItem, 'remainingAmount' | 'dueDate' | 'paidAmount'>): DebtInvoiceStatus {
  if (item.remainingAmount <= 0) return 'settled';
  const isOverdue = new Date(item.dueDate).getTime() < Date.now();
  if (isOverdue) return 'overdue';
  if (item.paidAmount > 0) return 'partial';
  return 'open';
}

async function getPersistedTransactions(): Promise<DebtInvoiceTransaction[]> {
  const raw = await AsyncStorage.getItem(DEBT_INVOICE_TX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as DebtInvoiceTransaction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function savePersistedTransactions(transactions: DebtInvoiceTransaction[]) {
  await AsyncStorage.setItem(DEBT_INVOICE_TX_KEY, JSON.stringify(transactions));
}

async function cacheDebtInvoices(result: DebtInvoiceListResult) {
  try {
    await AsyncStorage.setItem(DEBT_INVOICES_CACHE_KEY, JSON.stringify({ ...result, cachedAt: Date.now() }));
  } catch {
    // Fallback cache only.
  }
}

export async function getCachedDebtInvoices(): Promise<DebtInvoiceListResult | null> {
  const raw = await AsyncStorage.getItem(DEBT_INVOICES_CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DebtInvoiceListResult;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      totalItem: toNumber(parsed.totalItem),
      totalPage: Math.max(1, toNumber(parsed.totalPage, 1)),
      currentPage: Math.max(1, toNumber(parsed.currentPage, 1)),
      fromCache: true,
    };
  } catch {
    return null;
  }
}

async function buildBaseInvoices(): Promise<DebtInvoiceListItem[]> {
  const [ordersResult, suppliersResult, customersResult] = await Promise.all([
    listOrders({ pageSize: 120, currentPage: 1, search: '' }).catch(() => getCachedOrders()),
    listSuppliers({ pageSize: 120, currentPage: 1, search: '' }),
    listCustomers({ pageSize: 200, currentPage: 1, search: '' }).catch(() => getCachedCustomers()),
  ]);

  const customerByPhone = new Map<string, { debt: number }>();
  (customersResult?.items || []).forEach((customer) => {
    const phone = normalizeText((customer as { phone?: string }).phone).replace(/[^\d+]/g, '');
    if (!phone) return;
    customerByPhone.set(phone, { debt: toNumber((customer as { debt?: number }).debt) });
  });

  // Build receivable invoices only for customers that still have debt > 0.
  // Debt is distributed from newest orders backward so fully settled invoices do not appear.
  const ordersByCustomerPhone = (ordersResult?.items || []).reduce<Record<string, OrderListItem[]>>((acc, order) => {
    const phone = normalizeText(order.customerPhone).replace(/[^\d+]/g, '');
    if (!phone) return acc;
    if (!acc[phone]) acc[phone] = [];
    acc[phone].push(order);
    return acc;
  }, {});

  const orderInvoices: DebtInvoiceListItem[] = [];

  Object.entries(ordersByCustomerPhone).forEach(([phone, orders]) => {
    let remainingCustomerDebt = Math.max(0, Math.round(customerByPhone.get(phone)?.debt || 0));
    if (remainingCustomerDebt <= 0) return;

    const sortedOrders = [...orders].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );

    for (const order of sortedOrders) {
      if (remainingCustomerDebt <= 0) break;

      const orderTotal = Math.max(0, Math.round(order.total));
      if (orderTotal <= 0) continue;

      const remainingAmount = Math.min(orderTotal, remainingCustomerDebt);
      if (remainingAmount <= 0) continue;

      const paidAmount = Math.max(0, orderTotal - remainingAmount);
      const issueDate = toIsoDate(order.createdAt);
      const dueDate = addDaysIso(issueDate, DEFAULT_DUE_DAYS_RECEIVABLE);
      const item: DebtInvoiceListItem = {
        id: `AR-${order.detailId || order.id}`,
        code: order.orderNumber || `HD-${order.id}`,
        sourceType: 'order',
        sourceId: order.detailId || order.id,
        kind: 'receivable',
        status: 'open',
        partyName: order.customerName || 'Khach le',
        partyPhone: order.customerPhone || '',
        totalAmount: orderTotal,
        paidAmount,
        remainingAmount,
        issueDate,
        dueDate,
        updatedAt: toIsoDate(order.updatedAt || order.createdAt),
        note: 'Cong no tu don ban',
      };
      orderInvoices.push({ ...item, status: computeStatus(item) });
      remainingCustomerDebt -= remainingAmount;
    }
  });

  const supplierInvoices: DebtInvoiceListItem[] = suppliersResult.items
    .filter((supplier) => Math.max(0, Math.round(supplier.currentDebt)) > 0)
    .map((supplier) => {
    const issueDate = toIsoDate(new Date().toISOString());
    const dueDate = addDaysIso(issueDate, DEFAULT_DUE_DAYS_PAYABLE);
    const totalAmount = Math.max(Math.round(supplier.totalIncome), Math.round(supplier.currentDebt));
    const paidAmount = Math.max(0, Math.round(supplier.totalPaid));
    const remainingAmount = Math.max(0, Math.round(supplier.currentDebt));
    const item: DebtInvoiceListItem = {
      id: `AP-${supplier.id}`,
      code: supplier.code || `NCC-${supplier.id}`,
      sourceType: 'supplier',
      sourceId: supplier.id,
      kind: 'payable',
      status: 'open',
      partyName: supplier.name,
      partyPhone: supplier.phone,
      totalAmount,
      paidAmount,
      remainingAmount,
      issueDate,
      dueDate,
      updatedAt: issueDate,
      note: 'Cong no nha cung cap',
    };
    return { ...item, status: computeStatus(item) };
  });

  return [...orderInvoices, ...supplierInvoices]
    .filter((item) => item.remainingAmount > 0)
    .sort(compareByUpdatedAt);
}

function applyTransactions(items: DebtInvoiceListItem[], transactions: DebtInvoiceTransaction[]): DebtInvoiceListItem[] {
  const txByInvoiceId = transactions.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.invoiceId] = (acc[tx.invoiceId] || 0) + Math.max(0, Math.round(tx.amount));
    return acc;
  }, {});

  return items.map((item) => {
    const txAmount = txByInvoiceId[item.id] || 0;
    if (txAmount <= 0) return item;
    const paidAmount = item.paidAmount + txAmount;
    const remainingAmount = Math.max(0, item.totalAmount - paidAmount);
    const next = {
      ...item,
      paidAmount,
      remainingAmount,
      updatedAt: new Date().toISOString(),
    };
    return {
      ...next,
      status: computeStatus(next),
    };
  });
}

function matchFilter(item: DebtInvoiceListItem, filter: DebtInvoiceFilter) {
  if (filter === 'all') return true;
  if (filter === 'receivable') return item.kind === 'receivable';
  if (filter === 'payable') return item.kind === 'payable';
  if (filter === 'overdue') return item.status === 'overdue';
  if (filter === 'open') return item.status === 'open' || item.status === 'partial';
  if (filter === 'settled') return item.status === 'settled';
  return true;
}

function matchSearch(item: DebtInvoiceListItem, search: string) {
  if (!search.trim()) return true;
  const q = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const haystack = [item.code, item.partyName, item.partyPhone, item.note]
    .map((value) => normalizeText(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
    .join(' ');
  return haystack.includes(q);
}

type ApiDebtInvoiceItem = {
  id?: string | number;
  code?: string | null;
  source_type?: 'order' | 'supplier' | null;
  source_id?: string | number | null;
  kind?: DebtInvoiceKind | null;
  status?: DebtInvoiceStatus | null;
  party_name?: string | null;
  party_phone?: string | null;
  total_amount?: string | number | null;
  paid_amount?: string | number | null;
  remaining_amount?: string | number | null;
  issue_date?: string | null;
  due_date?: string | null;
  updated_at?: string | null;
  note?: string | null;
};

type ApiDebtInvoiceListResponse = {
  data?: ApiDebtInvoiceItem[];
  totalItem?: number;
  totalPage?: number;
  currentPage?: number;
};

type ApiDebtInvoiceSummaryResponse = {
  data?: Partial<DebtInvoiceSummary>;
};

const mapApiItem = (raw: ApiDebtInvoiceItem): DebtInvoiceListItem | null => {
  const id = normalizeText(raw.id);
  if (!id) return null;
  const totalAmount = toNumber(raw.total_amount);
  const paidAmount = toNumber(raw.paid_amount);
  const remainingAmount = Math.max(0, toNumber(raw.remaining_amount, totalAmount - paidAmount));
  const issueDate = normalizeText(raw.issue_date) || new Date().toISOString();
  const dueDate = normalizeText(raw.due_date) || issueDate;
  const item: DebtInvoiceListItem = {
    id,
    code: normalizeText(raw.code) || id,
    sourceType: raw.source_type === 'supplier' ? 'supplier' : 'order',
    sourceId: normalizeText(raw.source_id) || id,
    kind: raw.kind === 'payable' ? 'payable' : 'receivable',
    status: raw.status || 'open',
    partyName: normalizeText(raw.party_name) || 'Khach/NCC',
    partyPhone: normalizeText(raw.party_phone),
    totalAmount,
    paidAmount,
    remainingAmount,
    issueDate,
    dueDate,
    updatedAt: normalizeText(raw.updated_at) || issueDate,
    note: normalizeText(raw.note),
  };
  return { ...item, status: computeStatus(item) };
};

async function tryListDebtInvoicesFromApi(params: DebtInvoiceListParams): Promise<DebtInvoiceListResult | null> {
  if (!ENABLE_DEBT_INVOICE_API) return null;
  try {
    const query = [
      `pageSize=${encodeURIComponent(String(params.pageSize || 20))}`,
      `currentPage=${encodeURIComponent(String(params.currentPage || 1))}`,
      `search=${encodeURIComponent(params.search || '')}`,
      `filter=${encodeURIComponent(params.filter || 'all')}`,
    ].join('&');
    const response = await request<ApiDebtInvoiceListResponse>({
      method: 'GET',
      path: `/debt-invoice/json?${query}`,
    });
    const items = (response.data || []).map(mapApiItem).filter(Boolean) as DebtInvoiceListItem[];
    return {
      items,
      totalItem: toNumber(response.totalItem, items.length),
      totalPage: Math.max(1, toNumber(response.totalPage, 1)),
      currentPage: Math.max(1, toNumber(response.currentPage, 1)),
    };
  } catch {
    return null;
  }
}

async function tryGetDebtInvoiceSummaryFromApi(search = ''): Promise<DebtInvoiceSummary | null> {
  if (!ENABLE_DEBT_INVOICE_API) return null;
  try {
    const response = await request<ApiDebtInvoiceSummaryResponse>({
      method: 'GET',
      path: `/debt-invoice/summary?search=${encodeURIComponent(search)}`,
    });
    const data = response.data || {};
    return {
      totalReceivable: toNumber(data.totalReceivable),
      totalPayable: toNumber(data.totalPayable),
      overdueReceivable: toNumber(data.overdueReceivable),
      overduePayable: toNumber(data.overduePayable),
      dueToday: toNumber(data.dueToday),
      totalOpen: toNumber(data.totalOpen),
      totalSettled: toNumber(data.totalSettled),
    };
  } catch {
    return null;
  }
}

export async function listDebtInvoices(params: DebtInvoiceListParams = {}): Promise<DebtInvoiceListResult> {
  const apiResult = await tryListDebtInvoicesFromApi(params);
  if (apiResult) {
    const outstandingApiItems = apiResult.items.filter((item) => item.remainingAmount > 0);
    const normalizedApiResult: DebtInvoiceListResult = {
      items: outstandingApiItems,
      totalItem: outstandingApiItems.length,
      totalPage: Math.max(1, Math.ceil(outstandingApiItems.length / Math.max(1, params.pageSize || 20))),
      currentPage: 1,
    };
    await cacheDebtInvoices(normalizedApiResult);
    return normalizedApiResult;
  }

  const pageSize = Math.max(1, params.pageSize || 20);
  const currentPage = Math.max(1, params.currentPage || 1);
  const filter = params.filter || 'all';
  const search = params.search || '';

  const baseItems = await buildBaseInvoices();
  const transactions = await getPersistedTransactions();
  const mergedItems = applyTransactions(baseItems, transactions);
  const filteredItems = mergedItems
    .filter((item) => item.remainingAmount > 0)
    .filter((item) => matchFilter(item, filter) && matchSearch(item, search));

  const totalItem = filteredItems.length;
  const totalPage = Math.max(1, Math.ceil(totalItem / pageSize));
  const start = (currentPage - 1) * pageSize;
  const items = filteredItems.slice(start, start + pageSize);

  const result: DebtInvoiceListResult = {
    items,
    totalItem,
    totalPage,
    currentPage: Math.min(currentPage, totalPage),
  };
  await cacheDebtInvoices(result);
  return result;
}

export async function getDebtInvoiceSummary(search = ''): Promise<DebtInvoiceSummary> {
  const apiResult = await tryGetDebtInvoiceSummaryFromApi(search);
  if (apiResult) return apiResult;

  const baseItems = await buildBaseInvoices();
  const mergedItems = applyTransactions(baseItems, await getPersistedTransactions());
  const filteredItems = mergedItems.filter((item) => matchSearch(item, search));
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  return filteredItems.reduce<DebtInvoiceSummary>(
    (sum, item) => {
      if (item.kind === 'receivable') sum.totalReceivable += item.remainingAmount;
      if (item.kind === 'payable') sum.totalPayable += item.remainingAmount;
      if (item.kind === 'receivable' && item.status === 'overdue') sum.overdueReceivable += item.remainingAmount;
      if (item.kind === 'payable' && item.status === 'overdue') sum.overduePayable += item.remainingAmount;
      if (item.status === 'open' || item.status === 'partial' || item.status === 'overdue') sum.totalOpen += 1;
      if (item.status === 'settled') sum.totalSettled += 1;
      const due = new Date(item.dueDate);
      const dueKey = `${due.getFullYear()}-${due.getMonth()}-${due.getDate()}`;
      if (item.remainingAmount > 0 && dueKey === todayKey) sum.dueToday += item.remainingAmount;
      return sum;
    },
    {
      totalReceivable: 0,
      totalPayable: 0,
      overdueReceivable: 0,
      overduePayable: 0,
      dueToday: 0,
      totalOpen: 0,
      totalSettled: 0,
    },
  );
}

export async function getDebtInvoiceDetail(invoiceId: string): Promise<DebtInvoiceDetail> {
  const mergedItems = applyTransactions(await buildBaseInvoices(), await getPersistedTransactions());
  const item = mergedItems.find((invoice) => invoice.id === invoiceId);
  if (!item) {
    throw new Error('Khong tim thay chung tu cong no.');
  }
  const transactions = (await getPersistedTransactions())
    .filter((tx) => tx.invoiceId === invoiceId)
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  return { ...item, transactions };
}

export async function createDebtInvoicePayment(payload: {
  invoiceId: string;
  amount: number;
  method: DebtInvoiceTransaction['method'];
  paidAt?: string;
  note?: string;
}) {
  const amount = Math.max(0, Math.round(payload.amount));
  if (!amount) {
    throw new Error('So tien thanh toan khong hop le.');
  }
  const payment: DebtInvoiceTransaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    invoiceId: payload.invoiceId,
    amount,
    method: payload.method,
    paidAt: payload.paidAt || new Date().toISOString(),
    note: normalizeText(payload.note),
    createdAt: new Date().toISOString(),
  };
  const transactions = await getPersistedTransactions();
  transactions.push(payment);
  await savePersistedTransactions(transactions);

  if (ENABLE_DEBT_INVOICE_API) {
    try {
      await request({
        method: 'POST',
        path: '/debt-invoice/payment',
        body: {
          invoice_id: payload.invoiceId,
          amount,
          method: payload.method,
          paid_at: payment.paidAt,
          note: payment.note || '',
        },
      });
    } catch {
      // Keep local persistence as fallback when backend endpoint is unavailable.
    }
  }
  return payment;
}
