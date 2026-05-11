import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DashboardStats, RecentOrder } from '../types';
import { listAllCustomers } from './customers';
import { request } from './http';
import {
  computeMinStock,
  getMinStockSettings,
  listInventoryStocks,
  type InventoryStock,
} from './inventory';
import { listOrders, type OrderListItem } from './orders';

export type HomeRevenuePeriod = '7N' | '30N' | '12T';

export type HomeDashboardData = {
  stats: DashboardStats;
  hourlyRevenue: number[];
  hourlyCost: number[];
  costToday: number;
  costYesterday: number;
  periodRevenue: Record<HomeRevenuePeriod, number[]>;
  periodLabels: Record<HomeRevenuePeriod, string[]>;
};

export type HomeDashboardDateRange = {
  dateStart?: Date;
  dateEnd?: Date;
};

type BreakevenAutoData = {
  currentRevenue?: unknown;
  totalSoldQuantity?: unknown;
  rentCost?: unknown;
  fixedSalaryCost?: unknown;
  equipmentDepreciation?: unknown;
  managementCost?: unknown;
  otherFixedCost?: unknown;
  unitPrice?: unknown;
  unitVariableCost?: unknown;
};

type ApiOrderLine = {
  id?: number | string | null;
  bill_id?: number | string | null;
  phone?: string | null;
  date?: string | null;
  time?: string | null;
  count?: number | string | null;
  quantity?: number | string | null;
  qty?: number | string | null;
  price?: number | string | null;
  total?: number | string | null;
  total_price?: number | string | null;
  product_id?: number | string | null;
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

type ApiOrdersResponse = {
  data?: ApiOrderLine[];
};

type ApiBill = {
  id?: number | string | null;
  date?: string | null;
  time?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  softDeleted?: boolean | number | string | null;
  softHide?: boolean | number | string | null;
};

type ApiBillsResponse = {
  data?: ApiBill[];
};

type ApiBookkeepingEntry = {
  type?: string | null;
  amount?: number | string | null;
  total?: number | string | null;
  date?: string | null;
  createdAt?: string | null;
  note?: string | null;
};

type ApiBookkeepingResponse = {
  data?: ApiBookkeepingEntry[];
};

type ApiDashboardStatsResponse = {
  revenueToday?: number;
  revenueYesterday?: number;
  ordersToday?: number;
  newCustomers?: number;
  itemsSold?: number;
  profitToday?: number;
  monthlyGoal?: number;
  monthlyRevenue?: number;
  weeklyRevenue?: number[];
  topProducts?: Array<{ id?: number; name?: string; sold?: number; revenue?: number }>;
  lowStockProducts?: Array<{ id?: number; name?: string; stock?: number; minStock?: number; unit?: string }>;
  recentOrders?: Array<{
    id?: number;
    orderNumber?: string;
    customerName?: string;
    total?: number;
    status?: string;
    channel?: string;
    createdAt?: string;
  }>;
};

type AnalyticsMetric = {
  totalPrice: number;
  totalCount: number;
  compareTotal: number;
};

type AnalyticsChart = {
  labels: string[];
  income: number[];
  outcome: number[];
};

const HOME_CACHE_KEY = 'home_dashboard_cache_v1';
const DASHBOARD_MONTHLY_GOAL_FALLBACK = 300000000;
const HOME_REQUEST_TIMEOUT_MS = 5000;

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(/[,.](?=\d{3}(\D|$))/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeText = (value: unknown) => String(value || '').trim();

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const isSameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const parseOrderDate = (value?: string | null, time?: string | null) => {
  const dateText = normalizeText(value);
  if (!dateText) return null;

  const timeText = normalizeText(time) || '00:00:00';
  const normalized = /\d{4}-\d{2}-\d{2}/.test(dateText)
    ? `${dateText}T${timeText}`
    : `${dateText.replace(' ', 'T')}`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const ensureLength = (values: number[], length: number) => {
  if (values.length === length) return values;
  if (values.length > length) return values.slice(values.length - length);
  return [...Array.from({ length: length - values.length }, () => 0), ...values];
};

const formatYmdLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseChartDateLabel = (value: string) => {
  const text = normalizeText(value);
  const matched = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!matched) return null;
  return `${matched[1]}-${matched[2]}-${matched[3]}`;
};

const buildContinuousDailySeries = (
  chart: AnalyticsChart | null,
  days: number,
  endDate = new Date(),
) => {
  const labels: string[] = [];
  const values: number[] = [];
  const incomeMap = new Map<string, number>();

  if (chart) {
    chart.labels.forEach((label, idx) => {
      const ymd = parseChartDateLabel(label);
      if (!ymd) return;
      incomeMap.set(ymd, toNumber(chart.income[idx]));
    });
  }

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - offset);
    const ymd = formatYmdLocal(date);
    labels.push(ymd);
    values.push(toNumber(incomeMap.get(ymd), 0));
  }

  return { labels, values };
};

const buildMonthlySeriesFromDaily = (
  dailyLabels: string[],
  dailyValues: number[],
  months = 12,
  endDate = new Date(),
) => {
  const monthMap = new Map<string, number>();
  for (let i = 0; i < dailyLabels.length; i += 1) {
    const key = dailyLabels[i].slice(0, 7);
    monthMap.set(key, (monthMap.get(key) || 0) + toNumber(dailyValues[i]));
  }

  const labels: string[] = [];
  const values: number[] = [];
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(endDate.getFullYear(), endDate.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    labels.push(key);
    values.push(toNumber(monthMap.get(key), 0));
  }
  return { labels, values };
};

const withTimeout = async <T>(promise: Promise<T>, fallback: T, timeoutMs = HOME_REQUEST_TIMEOUT_MS): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    const result = await Promise.race<T>([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
    return result;
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const extractAnalyticsMetric = (payload: unknown): AnalyticsMetric => {
  if (!payload || typeof payload !== 'object') {
    return { totalPrice: 0, totalCount: 0, compareTotal: 0 };
  }

  const raw = payload as {
    total_price?: unknown;
    total_count?: unknown;
    compare_total?: unknown;
    data?: {
      total_price?: unknown;
      total_count?: unknown;
      compare_total?: unknown;
    };
  };
  const source = raw.data && typeof raw.data === 'object' ? raw.data : raw;

  return {
    totalPrice: toNumber(source.total_price),
    totalCount: toNumber(source.total_count),
    compareTotal: toNumber(source.compare_total),
  };
};

const extractAnalyticsChart = (payload: unknown): AnalyticsChart | null => {
  if (!payload || typeof payload !== 'object') return null;

  const raw = payload as {
    labels?: unknown;
    income?: unknown;
    outcome?: unknown;
    data?: {
      labels?: unknown;
      income?: unknown;
      outcome?: unknown;
    };
  };
  const source = raw.data && typeof raw.data === 'object' ? raw.data : raw;
  const labels = Array.isArray(source.labels) ? source.labels.map((item) => String(item || '')) : [];
  const income = Array.isArray(source.income) ? source.income.map((item) => toNumber(item)) : [];
  const outcome = Array.isArray(source.outcome) ? source.outcome.map((item) => toNumber(item)) : [];

  if (!income.length && !outcome.length) return null;
  return { labels, income, outcome };
};

const extractBreakevenAutoData = (payload: unknown): BreakevenAutoData | null => {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as { data?: BreakevenAutoData };
  const source = raw.data && typeof raw.data === 'object' ? raw.data : (payload as BreakevenAutoData);
  return source;
};

const computeBreakEvenRevenue = (source: BreakevenAutoData | null) => {
  if (!source) return 0;
  const totalFixedCost =
    toNumber(source.rentCost) +
    toNumber(source.fixedSalaryCost) +
    toNumber(source.equipmentDepreciation) +
    toNumber(source.managementCost) +
    toNumber(source.otherFixedCost);
  const unitPrice = toNumber(source.unitPrice);
  const unitVariableCost = toNumber(source.unitVariableCost);
  const contribution = unitPrice - unitVariableCost;
  if (totalFixedCost <= 0 || unitPrice <= 0 || contribution <= 0) return 0;
  return Math.round((totalFixedCost / contribution) * unitPrice);
};

const computeBreakEvenUnits = (source: BreakevenAutoData | null) => {
  if (!source) return 0;
  const totalFixedCost =
    toNumber(source.rentCost) +
    toNumber(source.fixedSalaryCost) +
    toNumber(source.equipmentDepreciation) +
    toNumber(source.managementCost) +
    toNumber(source.otherFixedCost);
  const unitPrice = toNumber(source.unitPrice);
  const unitVariableCost = toNumber(source.unitVariableCost);
  const contribution = unitPrice - unitVariableCost;
  if (totalFixedCost <= 0 || unitPrice <= 0 || contribution <= 0) return 0;
  return Math.ceil(totalFixedCost / contribution);
};

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return false;
};

const parseBillDate = (bill: ApiBill) => {
  const fromDateField = parseOrderDate(bill.date, bill.time);
  if (fromDateField) return fromDateField;
  const created = normalizeText(bill.createdAt || bill.updatedAt);
  if (!created) return null;
  const parsed = new Date(created);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isBillNotDeleted = (bill: ApiBill) => !toBoolean(bill.softDeleted) && !toBoolean(bill.softHide);

const countOrdersByBills = (bills: ApiBill[], now = new Date()) => {
  const today = startOfDay(now);
  const yesterday = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  let todayCount = 0;
  let yesterdayCount = 0;

  bills.forEach((bill) => {
    if (!isBillNotDeleted(bill)) return;
    const billDate = parseBillDate(bill);
    if (!billDate) return;

    if (isSameDay(billDate, today)) {
      todayCount += 1;
      return;
    }
    if (isSameDay(billDate, yesterday)) {
      yesterdayCount += 1;
    }
  });

  return { todayCount, yesterdayCount };
};

const countOrdersByBillsInRange = (bills: ApiBill[], dateStart: Date, dateEnd: Date) => {
  const from = startOfDay(dateStart);
  const to = new Date(dateEnd);
  to.setHours(23, 59, 59, 999);
  let count = 0;

  bills.forEach((bill) => {
    if (!isBillNotDeleted(bill)) return;
    const billDate = parseBillDate(bill);
    if (!billDate) return;
    if (billDate >= from && billDate <= to) count += 1;
  });

  return count;
};

const endOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const sumRevenueInRange = (rows: ApiOrderLine[], dateStart: Date, dateEnd: Date) => {
  const from = startOfDay(dateStart);
  const to = endOfDay(dateEnd);
  let total = 0;
  rows.forEach((row) => {
    const createdAt = parseOrderDate(row.date, row.time);
    if (!createdAt || createdAt < from || createdAt > to) return;
    const qty = Math.max(1, toNumber(row.count ?? row.quantity ?? row.qty, 1));
    const lineTotal = toNumber(
      row.total ?? row.total_price,
      toNumber(row.price ?? row.product?.price) * qty,
    );
    total += lineTotal;
  });
  return Math.round(total);
};

const sumItemsSoldInRange = (rows: ApiOrderLine[], dateStart: Date, dateEnd: Date) => {
  const from = startOfDay(dateStart);
  const to = endOfDay(dateEnd);
  let total = 0;
  rows.forEach((row) => {
    const createdAt = parseOrderDate(row.date, row.time);
    if (!createdAt || createdAt < from || createdAt > to) return;
    const qty = Math.max(1, toNumber(row.count ?? row.quantity ?? row.qty, 1));
    total += qty;
  });
  return Math.round(total);
};

const mapRecentOrders = (orders: OrderListItem[]): RecentOrder[] =>
  orders.slice(0, 8).map((item, index) => ({
    id: index + 1,
    orderNumber: item.orderNumber.startsWith('#') ? item.orderNumber : `#${item.orderNumber}`,
    customerName: item.customerName,
    total: item.total,
    status: item.status,
    channel: item.channel,
    createdAt: item.createdAt,
  }));

const mapLowStock = async (stocks: InventoryStock[]) => {
  const minSettings = await getMinStockSettings();

  return stocks
    .map((stock) => {
      const minStock = computeMinStock(stock, minSettings[String(stock.id)]);
      return {
        id: stock.id,
        name: stock.name,
        stock: stock.count,
        minStock,
        unit: stock.unit,
      };
    })
    .filter((stock) => stock.stock <= stock.minStock)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8);
};

const aggregateFromOrders = (rows: ApiOrderLine[], now = new Date()) => {
  const today = startOfDay(now);
  const yesterday = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const topProductsFromDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));
  const hourBuckets = Array.from({ length: 24 }, () => 0);
  const dayBuckets = new Map<string, number>();
  const monthBuckets = Array.from({ length: 12 }, () => 0);
  const topProductsMap = new Map<string, { id: number; name: string; sold: number; revenue: number }>();
  const todayCustomerPhones = new Set<string>();

  let revenueToday = 0;
  let revenueYesterday = 0;
  let itemsSoldToday = 0;
  const todayOrderKeys = new Set<string>();

  rows.forEach((row) => {
    const createdAt = parseOrderDate(row.date, row.time);
    if (!createdAt) return;

    const qty = Math.max(1, toNumber(row.count ?? row.quantity ?? row.qty, 1));
    const lineTotal = toNumber(
      row.total ?? row.total_price,
      toNumber(row.price ?? row.product?.price) * qty,
    );

    const dayKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;
    dayBuckets.set(dayKey, (dayBuckets.get(dayKey) || 0) + lineTotal);
    monthBuckets[createdAt.getMonth()] += lineTotal;
    hourBuckets[createdAt.getHours()] += lineTotal;

    if (isSameDay(createdAt, today)) {
      revenueToday += lineTotal;
      itemsSoldToday += qty;
      const orderKey =
        normalizeText(row.bill_id) ||
        normalizeText(row.bill?.id) ||
        normalizeText(row.id) ||
        `${createdAt.getTime()}:${normalizeText(row.phone)}`;
      todayOrderKeys.add(orderKey);
      const phone = normalizeText(row.phone);
      if (phone) todayCustomerPhones.add(phone);
    } else if (isSameDay(createdAt, yesterday)) {
      revenueYesterday += lineTotal;
    }

    if (createdAt >= topProductsFromDate && createdAt <= now) {
      const productId = toNumber(row.product_id ?? row.product?.id, 0);
      const productName = normalizeText(row.product_name || row.product?.name) || 'Sản phẩm';
      const productKey = productId > 0 ? `id:${productId}` : `name:${productName.toLowerCase()}`;
      if (!topProductsMap.has(productKey)) {
        topProductsMap.set(productKey, {
          id: productId || topProductsMap.size + 1,
          name: productName,
          sold: 0,
          revenue: 0,
        });
      }

      const item = topProductsMap.get(productKey)!;
      item.sold += qty;
      item.revenue += lineTotal;
    }
  });

  const orderedDays = Array.from(dayBuckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map((entry) => entry[1]);
  const revenue7d = ensureLength(orderedDays.slice(-7), 7);
  const revenue30d = ensureLength(orderedDays.slice(-30), 30);
  const revenue12m = monthBuckets;
  const topProducts = Array.from(topProductsMap.values())
    .sort((a, b) => (b.sold - a.sold) || (b.revenue - a.revenue))
    .slice(0, 8);

  return {
    revenueToday,
    revenueYesterday,
    ordersToday: todayOrderKeys.size,
    itemsSoldToday,
    newCustomersToday: todayCustomerPhones.size,
    hourlyRevenue: hourBuckets,
    revenue7d,
    revenue30d,
    revenue12m,
    topProducts,
  };
};

function mapApiDashboard(apiData: ApiDashboardStatsResponse): HomeDashboardData | null {
  if (!apiData || typeof apiData !== 'object') return null;
  const revenueToday = toNumber(apiData.revenueToday);
  const revenueYesterday = toNumber(apiData.revenueYesterday);
  const derivedCostToday = Math.max(0, revenueToday - toNumber(apiData.profitToday));
  const derivedCostYesterday = Math.max(0, revenueYesterday - Math.round(toNumber(apiData.profitToday) * 0.9));

  return {
    stats: {
      revenueToday,
      revenueYesterday,
      ordersToday: toNumber(apiData.ordersToday),
      ordersPrevious: 0,
      newCustomers: toNumber(apiData.newCustomers),
      itemsSold: toNumber(apiData.itemsSold),
      itemsSoldPrevious: 0,
      profitToday: revenueToday - derivedCostToday,
      profitPrevious: revenueYesterday - derivedCostYesterday,
      monthlyGoal: toNumber(apiData.monthlyGoal, DASHBOARD_MONTHLY_GOAL_FALLBACK),
      monthlyRevenue: toNumber(apiData.monthlyRevenue),
      dailyGoal: 0,
      dailyRevenue: revenueToday,
      dailyProductGoal: 0,
      dailyProductsSold: toNumber(apiData.itemsSold),
      monthlyProductGoal: 0,
      monthlyProductsSold: 0,
      weeklyRevenue: ensureLength(Array.isArray(apiData.weeklyRevenue) ? apiData.weeklyRevenue.map((item) => toNumber(item)) : [], 7),
      topProducts: (apiData.topProducts || []).map((p, index) => ({
        id: toNumber(p.id, index + 1),
        name: normalizeText(p.name) || `SP-${index + 1}`,
        sold: toNumber(p.sold),
        revenue: toNumber(p.revenue),
      })),
      lowStockProducts: (apiData.lowStockProducts || []).map((p, index) => ({
        id: toNumber(p.id, index + 1),
        name: normalizeText(p.name) || `Kho-${index + 1}`,
        stock: toNumber(p.stock),
        minStock: toNumber(p.minStock, 1),
        unit: normalizeText((p as { unit?: unknown }).unit),
      })),
      recentOrders: (apiData.recentOrders || []).map((o, index) => ({
        id: toNumber(o.id, index + 1),
        orderNumber: normalizeText(o.orderNumber),
        customerName: normalizeText(o.customerName),
        total: toNumber(o.total),
        status: normalizeText(o.status) || 'done',
        channel: normalizeText(o.channel) || 'pos',
        createdAt: normalizeText(o.createdAt),
      })),
    },
    hourlyRevenue: Array.from({ length: 24 }, () => 0),
    periodRevenue: {
      '7N': ensureLength(Array.isArray(apiData.weeklyRevenue) ? apiData.weeklyRevenue.map((v) => toNumber(v)) : [], 7),
      '30N': Array.from({ length: 30 }, () => 0),
      '12T': Array.from({ length: 12 }, () => 0),
    },
    periodLabels: {
      '7N': Array.from({ length: 7 }, (_, i) => String(i + 1)),
      '30N': Array.from({ length: 30 }, (_, i) => String(i + 1)),
      '12T': Array.from({ length: 12 }, (_, i) => String(i + 1)),
    },
    hourlyCost: Array.from({ length: 24 }, () => 0),
    costToday: derivedCostToday,
    costYesterday: derivedCostYesterday,
  };
}

async function cacheHomeDashboard(payload: HomeDashboardData) {
  try {
    await AsyncStorage.setItem(HOME_CACHE_KEY, JSON.stringify({ ...payload, cachedAt: Date.now() }));
  } catch {
    // Cache should not block UX when storage temporarily fails.
  }
}

export async function getCachedHomeDashboard(): Promise<HomeDashboardData | null> {
  const raw = await AsyncStorage.getItem(HOME_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as HomeDashboardData;
    if (!parsed?.stats) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getHomeDashboard(range?: HomeDashboardDateRange): Promise<HomeDashboardData> {
  try {
    const apiStats = await request<ApiDashboardStatsResponse>({
      method: 'GET',
      path: '/dashboard/stats',
    });
    const mapped = mapApiDashboard(apiStats);
    if (mapped) {
      await cacheHomeDashboard(mapped);
      return mapped;
    }
  } catch {
    // Fallback to local aggregation from existing APIs.
  }

  const endBase = range?.dateEnd ? new Date(range.dateEnd) : range?.dateStart ? new Date(range.dateStart) : new Date();
  const startBase = range?.dateStart ? new Date(range.dateStart) : new Date(endBase);
  if (startBase > endBase) {
    const tmp = new Date(startBase);
    startBase.setTime(endBase.getTime());
    endBase.setTime(tmp.getTime());
  }
  startBase.setHours(12, 0, 0, 0);
  endBase.setHours(12, 0, 0, 0);

  const todayIso = formatYmdLocal(endBase);
  const rangeStartIso = formatYmdLocal(startBase);
  const rangeEndIso = formatYmdLocal(endBase);
  const start7Iso = formatYmdLocal(new Date(endBase.getFullYear(), endBase.getMonth(), endBase.getDate() - 6));
  const start30Iso = formatYmdLocal(new Date(endBase.getFullYear(), endBase.getMonth(), endBase.getDate() - 29));
  const start365Iso = formatYmdLocal(new Date(endBase.getFullYear(), endBase.getMonth(), endBase.getDate() - 364));
  const analyticsQuery = `all=false&compare=true&date_start=${rangeStartIso}&date_end=${rangeEndIso}&company_uuid=null`;

  const [
    orderSummary,
    stocks,
    allCustomers,
    orderRowsResponse,
    bookkeepingResponse,
    billsResponse,
    incomeAnalytics,
    outcomeAnalytics,
    orderAnalytics,
    chartAnalytics,
    chart7Analytics,
    chart30Analytics,
    chart365Analytics,
    breakevenDay,
    breakevenMonth,
  ] = await Promise.all([
    withTimeout(listOrders({ pageSize: 100, currentPage: 1 }), { items: [], totalItem: 0, totalPage: 0, currentPage: 1 }),
    withTimeout(listInventoryStocks(), []),
    withTimeout(listAllCustomers(), []),
    withTimeout(request<ApiOrdersResponse>({ method: 'GET', path: '/order/all' }), { data: [] }),
    withTimeout(request<ApiBookkeepingResponse>({ method: 'GET', path: '/bookkeeping/json?pageSize=500&currentPage=1&search=' }), { data: [] }),
    withTimeout(request<ApiBillsResponse>({ method: 'GET', path: '/bill/json?pageSize=500&currentPage=1&search=' }), { data: [] }),
    withTimeout(request<unknown>({ method: 'GET', path: `/analytics/income?${analyticsQuery}` }), null),
    withTimeout(request<unknown>({ method: 'GET', path: `/analytics/outcome?${analyticsQuery}` }), null),
    withTimeout(request<unknown>({ method: 'GET', path: `/analytics/order?${analyticsQuery}` }), null),
    withTimeout(request<unknown>({ method: 'GET', path: `/analytics/chart?all=false&date_start=${rangeStartIso}&date_end=${rangeEndIso}&company_uuid=null` }), null),
    withTimeout(request<unknown>({
      method: 'GET',
      path: `/analytics/chart?all=false&date_start=${start7Iso}&date_end=${todayIso}&company_uuid=null`,
    }), null),
    withTimeout(request<unknown>({
      method: 'GET',
      path: `/analytics/chart?all=false&date_start=${start30Iso}&date_end=${todayIso}&company_uuid=null`,
    }), null),
    withTimeout(request<unknown>({
      method: 'GET',
      path: `/analytics/chart?all=false&date_start=${start365Iso}&date_end=${todayIso}&company_uuid=null`,
    }), null),
    withTimeout(request<unknown>({ method: 'GET', path: `/breakeven/auto-data?period=day&date=${rangeEndIso}&useFallback=true` }), null),
    withTimeout(request<unknown>({ method: 'GET', path: `/breakeven/auto-data?period=month&date=${rangeEndIso}&useFallback=true` }), null),
  ]);

  const aggregate = aggregateFromOrders(orderRowsResponse.data || [], endBase);
  const billOrderCount = countOrdersByBillsInRange(billsResponse.data || [], startBase, endBase);
  const incomeMetric = extractAnalyticsMetric(incomeAnalytics);
  const outcomeMetric = extractAnalyticsMetric(outcomeAnalytics);
  const orderMetric = extractAnalyticsMetric(orderAnalytics);
  const chartMetric = extractAnalyticsChart(chartAnalytics);
  const chart7Metric = extractAnalyticsChart(chart7Analytics);
  const chart30Metric = extractAnalyticsChart(chart30Analytics);
  const chart365Metric = extractAnalyticsChart(chart365Analytics);
  const recentOrders = mapRecentOrders(orderSummary.items);
  const lowStockProducts = await mapLowStock(stocks);
  const revenueToday = incomeMetric.totalPrice > 0 ? incomeMetric.totalPrice : aggregate.revenueToday;
  const totalDays = Math.max(1, Math.floor((startOfDay(endBase).getTime() - startOfDay(startBase).getTime()) / (24 * 60 * 60 * 1000)) + 1);
  const previousEnd = new Date(startBase);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - (totalDays - 1));
  const prevRevenueFallback = sumRevenueInRange(orderRowsResponse.data || [], previousStart, previousEnd);
  const revenueYesterday = incomeMetric.compareTotal > 0 ? incomeMetric.compareTotal : prevRevenueFallback;
  const period7 = buildContinuousDailySeries(chart7Metric, 7, endBase);
  const period30 = buildContinuousDailySeries(chart30Metric, 30, endBase);
  const period365 = buildContinuousDailySeries(chart365Metric, 365, endBase);
  const period12 = buildMonthlySeriesFromDaily(period365.labels, period365.values, 12, endBase);
  const period7Values = period7.values.some((item) => item > 0) ? period7.values : aggregate.revenue7d;
  const period30Values = period30.values.some((item) => item > 0) ? period30.values : aggregate.revenue30d;
  const period12Values = period12.values.some((item) => item > 0) ? period12.values : aggregate.revenue12m;
  const monthlyRevenue = period12Values[period12Values.length - 1] || revenueToday;
  const dayBreakevenData = extractBreakevenAutoData(breakevenDay);
  const monthBreakevenData = extractBreakevenAutoData(breakevenMonth);
  const dailyGoal = computeBreakEvenRevenue(dayBreakevenData);
  const monthlyGoalByBreakeven = computeBreakEvenRevenue(monthBreakevenData);
  const dailyProductGoal = computeBreakEvenUnits(dayBreakevenData);
  const monthlyProductGoal = computeBreakEvenUnits(monthBreakevenData);
  const dailyRevenue = toNumber(dayBreakevenData?.currentRevenue, revenueToday);
  const monthlyRevenueByBreakeven = toNumber(monthBreakevenData?.currentRevenue, monthlyRevenue);
  const itemsSoldToday = orderMetric.totalCount > 0 ? orderMetric.totalCount : aggregate.itemsSoldToday;
  const itemsSoldPrevious = sumItemsSoldInRange(orderRowsResponse.data || [], previousStart, previousEnd);
  const unitVariableCost = toNumber(dayBreakevenData?.unitVariableCost, 0);
  const cogsTodayByBreakeven = unitVariableCost > 0 ? Math.round(unitVariableCost * itemsSoldToday) : 0;
  const cogsPreviousByBreakeven = unitVariableCost > 0 ? Math.round(unitVariableCost * itemsSoldPrevious) : 0;
  const dailyProductsSold = toNumber(dayBreakevenData?.totalSoldQuantity, itemsSoldToday);
  const monthlyProductsSold = toNumber(monthBreakevenData?.totalSoldQuantity, itemsSoldToday);
  const monthlyGoal = monthlyGoalByBreakeven > 0
    ? monthlyGoalByBreakeven
    : Math.max(DASHBOARD_MONTHLY_GOAL_FALLBACK, Math.round(monthlyRevenue * 1.2));
  const estimatedCogsToday = Math.max(0, revenueToday - Math.round(revenueToday * 0.2));
  const estimatedCogsYesterday = Math.max(0, revenueYesterday - Math.round(revenueYesterday * 0.2));
  const otherExpenseBucketsToday = Array.from({ length: 24 }, () => 0);
  const otherExpenseBucketsYesterday = Array.from({ length: 24 }, () => 0);

  (bookkeepingResponse.data || []).forEach((entry) => {
    const typeText = normalizeText(entry.type).toLowerCase();
    if (!typeText.includes('expense') && !typeText.includes('chi')) return;

    const amount = toNumber(entry.amount ?? entry.total);
    if (amount <= 0) return;

    const parsedDate = parseOrderDate(entry.date, null) || (entry.createdAt ? new Date(entry.createdAt) : null);
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) return;

    if (isSameDay(parsedDate, endBase)) {
      otherExpenseBucketsToday[parsedDate.getHours()] += amount;
      return;
    }

    const yesterday = new Date(endBase);
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSameDay(parsedDate, yesterday)) {
      otherExpenseBucketsYesterday[parsedDate.getHours()] += amount;
    }
  });

  const scaledHourlyRevenue = aggregate.revenueToday > 0 && revenueToday > 0
    ? aggregate.hourlyRevenue.map((value) => Math.round((value / aggregate.revenueToday) * revenueToday))
    : aggregate.hourlyRevenue;
  const hourlyRevenue = chartMetric?.income?.length ? ensureLength(chartMetric.income, 24) : scaledHourlyRevenue;
  const cogsByHour = hourlyRevenue.map((value) => Math.round(value * 0.8));
  const derivedHourlyCost = cogsByHour.map((value, hour) => value + otherExpenseBucketsToday[hour]);
  const hourlyCost = chartMetric?.outcome?.length ? ensureLength(chartMetric.outcome, 24) : derivedHourlyCost;
  const costTodayFallback = hourlyCost.reduce((sum, value) => sum + value, 0);
  const costYesterdayFallback = estimatedCogsYesterday + otherExpenseBucketsYesterday.reduce((sum, value) => sum + value, 0);
  const costToday = outcomeMetric.totalPrice > 0
    ? outcomeMetric.totalPrice + cogsTodayByBreakeven
    : costTodayFallback;
  const costYesterday = outcomeMetric.compareTotal > 0
    ? outcomeMetric.compareTotal + cogsPreviousByBreakeven
    : costYesterdayFallback;
  const ordersPrevious = countOrdersByBillsInRange(billsResponse.data || [], previousStart, previousEnd);
  const profitPrevious = revenueYesterday - costYesterday;
  const data: HomeDashboardData = {
    stats: {
      revenueToday,
      revenueYesterday,
      ordersToday: billOrderCount || aggregate.ordersToday,
      ordersPrevious,
      newCustomers: aggregate.newCustomersToday || allCustomers.filter((item) => isSameDay(new Date(item.createdAt || ''), endBase)).length,
      itemsSold: itemsSoldToday,
      itemsSoldPrevious,
      profitToday: revenueToday - costToday,
      profitPrevious,
      monthlyGoal,
      monthlyRevenue: monthlyRevenueByBreakeven > 0 ? monthlyRevenueByBreakeven : monthlyRevenue,
      dailyGoal,
      dailyRevenue,
      dailyProductGoal,
      dailyProductsSold,
      monthlyProductGoal,
      monthlyProductsSold,
      weeklyRevenue: ensureLength(period7Values, 7),
      topProducts: aggregate.topProducts,
      lowStockProducts,
      recentOrders,
    },
    hourlyRevenue,
    hourlyCost,
    costToday: costToday || estimatedCogsToday,
    costYesterday: costYesterday || estimatedCogsYesterday,
    periodRevenue: {
      '7N': ensureLength(period7Values, 7),
      '30N': ensureLength(period30Values, 30),
      '12T': ensureLength(period12Values, 12),
    },
    periodLabels: {
      '7N': period7.labels,
      '30N': period30.labels,
      '12T': period12.labels,
    },
  };

  await cacheHomeDashboard(data);
  return data;
}
