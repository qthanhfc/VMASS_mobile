import { request } from './http';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ApiStock = {
  id?: number | string;
  name?: string | null;
  sku?: string | null;
  unit?: string | null;
  count?: number | string | null;
  avarage_price?: number | string | null;
  price_new?: number | string | null;
  barcode?: string | null;
};

type ApiStocksResponse = {
  data?: ApiStock[];
};

type ApiProvider = {
  id?: number | string;
  name?: string | null;
  label?: string | null;
};

type ApiProvidersResponse = {
  data?: ApiProvider[];
};

type ApiWarehouseTransfer = {
  id?: string;
  stock?: string | null;
  receiving_warehouse?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
};

type ApiWarehouseTransferResponse = {
  data?: ApiWarehouseTransfer[];
};

type ApiWarehouseImport = {
  id?: string;
  createdAt?: string | null;
  code?: string | null;
};

type ApiWarehouseImportResponse = {
  data?: ApiWarehouseImport[];
};

export type InventoryStock = {
  id: number;
  name: string;
  sku: string;
  unit: string;
  count: number;
  averagePrice: number;
  latestPrice: number;
  barcode?: string;
  total?: number;
  alertDown20?: boolean;
  alertDown10?: boolean;
};

export type InventoryProvider = {
  id: string;
  name: string;
};

export type StockImportItemPayload = {
  id: number;
  count: number;
  unitPrice: number;
  providerName?: string;
  paidAmount?: number;
  expiryDate?: string | null;
};

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(/[,.](?=\d{3}(\D|$))/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapStock = (item: ApiStock): InventoryStock => ({
  id: toNumber(item.id),
  name: (item.name || '').trim() || 'Nguyên liệu',
  sku: (item.sku || '').trim(),
  unit: (item.unit || '').trim() || 'cái',
  count: toNumber(item.count),
  averagePrice: toNumber(item.avarage_price),
  latestPrice: toNumber(item.price_new),
  barcode: item.barcode || undefined,
  total: toNumber((item as any).total),
  alertDown20: Boolean((item as any).is_alert_down_20),
  alertDown10: Boolean((item as any).is_alert_down_10),
});

const mapProvider = (item: ApiProvider): InventoryProvider => ({
  id: String(item.id ?? '').trim(),
  name: (item.name || item.label || '').trim(),
});

export async function listInventoryStocks(search = '') {
  const query = [
    'pageSize=100',
    'currentPage=1',
    `search=${encodeURIComponent(search)}`,
  ].join('&');

  const response = await request<ApiStocksResponse>({
    method: 'GET',
    path: `/stock/json?${query}`,
  });

  return (response.data || []).map(mapStock).filter((item) => item.id > 0);
}

export async function listInventoryProviders() {
  const response = await request<ApiProvidersResponse>({
    method: 'GET',
    path: '/company-provider',
  });

  return (response.data || [])
    .map(mapProvider)
    .filter((item) => item.id.length > 0 && item.name.length > 0);
}

export async function createInventoryProvider(name: string) {
  const response = await request<{ data?: ApiProvider; provider?: ApiProvider; id?: string | number; name?: string }>({
    method: 'POST',
    path: '/company-provider',
    body: { name },
  });

  const raw = response.data || response.provider || response;
  return mapProvider(raw);
}

export async function createInventoryStock(payload: {
  name: string;
  sku?: string;
  barcode?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  providerName?: string;
  paidAmount?: number;
  expiryDate?: string | null;
}) {
  return request<{ status?: number; responseText?: string; message?: string; data?: unknown }>({
    method: 'POST',
    path: '/stock',
    body: {
      name: payload.name,
      barcode: payload.barcode || '',
      unit: payload.unit,
      count: payload.quantity,
      unit_price: String(payload.unitPrice),
      price_outcome: String(payload.paidAmount || 0),
      item_data: payload.providerName
        ? {
            id: payload.providerName,
            label: payload.providerName,
            value: payload.providerName,
          }
        : null,
      expiry_date: payload.expiryDate || null,
    },
  });
}

export async function updateInventoryStock(payload: {
  id: number;
  name: string;
  barcode?: string;
  unit: string;
  count?: number;
  priceNew?: number;
  isAlertDown20?: boolean;
  isAlertDown10?: boolean;
}) {
  return request<{ status?: number; responseText?: string; message?: string; data?: unknown }>({
    method: 'PUT',
    path: '/stock',
    body: {
      id: payload.id,
      name: payload.name,
      barcode: payload.barcode || '',
      unit: payload.unit,
      count: payload.count,
      price_new: String(payload.priceNew || 0),
      total: payload.count,
      is_alert_down_20: payload.isAlertDown20,
      is_alert_down_10: payload.isAlertDown10,
    },
  });
}

export type MinStockSetting = {
  mode: 'percent' | 'quantity';
  value: number;
};

const MIN_STOCK_SETTINGS_KEY = 'inventory_min_stock_settings_v1';

export async function getMinStockSettings(): Promise<Record<string, MinStockSetting>> {
  const raw = await AsyncStorage.getItem(MIN_STOCK_SETTINGS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function setMinStockSetting(stockId: number | string, setting: MinStockSetting) {
  const current = await getMinStockSettings();
  current[String(stockId)] = setting;
  await AsyncStorage.setItem(MIN_STOCK_SETTINGS_KEY, JSON.stringify(current));
}

export function computeMinStock(stock: InventoryStock, setting?: MinStockSetting) {
  const totalBase = Math.max(0, Number(stock.total || stock.count || 0));
  if (!setting) {
    return Math.max(0, Math.round(((totalBase || stock.count || 0) * 20) ) / 100);
  }
  if (setting.mode === 'quantity') return Math.max(0, setting.value);
  return Math.max(0, Math.round((totalBase * setting.value)) / 100);
}

export async function importStockItem(payload: StockImportItemPayload) {
  return request<{ status?: number; responseText?: string; message?: string; data?: unknown }>({
    method: 'PUT',
    path: '/stock/count',
    body: {
      id: payload.id,
      count: payload.count,
      unit_price: String(payload.unitPrice),
      item_data: payload.providerName
        ? {
            id: payload.providerName,
            label: payload.providerName,
            value: payload.providerName,
          }
        : null,
      price_outcome: String(payload.paidAmount || 0),
      expiry_date: payload.expiryDate || null,
    },
  });
}

export async function createWarehouseTransfer(payload: {
  stockName: string;
  quantity: number;
  unitPrice: number;
  sourceWarehouse?: string;
  destinationWarehouse?: string;
  notes?: string;
}) {
  return request<{ status?: number; responseText?: string; message?: string; data?: unknown }>({
    method: 'POST',
    path: '/warehouse-transfer',
    body: {
      name: payload.stockName,
      stock: payload.stockName,
      quantity: payload.quantity,
      price: payload.unitPrice * payload.quantity,
      description: payload.notes || '',
      receiving_warehouse: payload.destinationWarehouse || '',
      transportation: payload.sourceWarehouse || '',
    },
  });
}

export async function createInventoryAudit(payload?: { notes?: string }) {
  return request<{ data?: { id?: number | string } }>({
    method: 'POST',
    path: '/api/inventory-audit',
    body: {
      notes: payload?.notes || '',
    },
  });
}

export async function addInventoryAuditItems(
  auditId: number | string,
  items: Array<{ stock_id: number }>,
) {
  return request({
    method: 'POST',
    path: `/api/inventory-audit/${auditId}/items`,
    body: { items },
  });
}

export async function updateInventoryAuditItem(
  auditId: number | string,
  itemId: number | string,
  actualQuantity: number,
  reason?: string,
) {
  return request({
    method: 'PUT',
    path: `/api/inventory-audit/${auditId}/items/${itemId}`,
    body: {
      actual_quantity: actualQuantity,
      reason: reason || '',
    },
  });
}

export async function getInventoryAuditById(auditId: number | string) {
  return request<{
    data?: {
      items?: Array<{
        id?: number | string;
        stock_id?: number | string;
      }>;
    };
  }>({
    method: 'GET',
    path: `/api/inventory-audit/${auditId}`,
  });
}

export async function completeInventoryAudit(auditId: number | string) {
  return request({
    method: 'POST',
    path: `/api/inventory-audit/${auditId}/complete`,
  });
}

export async function listWarehouseTransfers() {
  const query = ['pageSize=200', 'currentPage=1', 'search='].join('&');
  const response = await request<ApiWarehouseTransferResponse>({
    method: 'GET',
    path: `/warehouse-transfer/json?${query}`,
  });

  return response.data || [];
}

export async function listWarehouseImports() {
  const query = ['pageSize=500', 'currentPage=1', 'search='].join('&');
  const response = await request<ApiWarehouseImportResponse>({
    method: 'GET',
    path: `/warehouse-import/json?${query}`,
  });

  return response.data || [];
}

export async function createWarehouseImportEntry(payload: {
  code: string;
  stockName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  supplierName?: string;
  dateText?: string;
}) {
  return request<{ status?: number; responseText?: string; message?: string; data?: unknown }>({
    method: 'POST',
    path: '/warehouse-import',
    body: {
      name: payload.supplierName || 'Nhà cung cấp',
      phone: '-',
      address: '-',
      stock: payload.stockName,
      code: payload.code,
      unit: payload.unit,
      quantity: String(payload.quantity),
      price: String(payload.unitPrice),
      time: payload.dateText || '',
      find_stock_equal: true,
    },
  });
}
