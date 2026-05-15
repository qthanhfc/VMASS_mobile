import AsyncStorage from '@react-native-async-storage/async-storage';

export type PrinterConnectionType = 'bluetooth' | 'wifi' | 'usb';
export type PrinterPaperSize = '58mm' | '80mm' | '100x150';
export type PrinterUsageType = 'receipt' | 'label';

export type PrinterDevice = {
  id: string;
  name: string;
  model: string;
  connectionType: PrinterConnectionType;
  address: string;
  port: number | null;
  paperSize: PrinterPaperSize;
  supportsReceipt: boolean;
  supportsLabel: boolean;
  isConnected: boolean;
  createdAt: string;
  updatedAt: string;
  lastConnectedAt: string | null;
};

export type PrinterPreferences = {
  autoReconnect: boolean;
  cutPaperAfterPrint: boolean;
  openDrawerAfterReceipt: boolean;
};

export type PrinterStore = {
  printers: PrinterDevice[];
  defaultReceiptPrinterId: string | null;
  defaultLabelPrinterId: string | null;
  preferences: PrinterPreferences;
};

type SavedPrinterData = Partial<Omit<PrinterDevice, 'createdAt' | 'updatedAt' | 'lastConnectedAt'>> &
  Pick<PrinterDevice, 'name' | 'model' | 'connectionType' | 'address'>;

type RawPrinterStore = Partial<PrinterStore>;

const PRINTER_STORE_KEY = 'vmass_printer_store_v1';

const DEFAULT_PREFERENCES: PrinterPreferences = {
  autoReconnect: true,
  cutPaperAfterPrint: true,
  openDrawerAfterReceipt: false,
};

const EMPTY_STORE: PrinterStore = {
  printers: [],
  defaultReceiptPrinterId: null,
  defaultLabelPrinterId: null,
  preferences: DEFAULT_PREFERENCES,
};

const buildPrinterId = () =>
  `printer_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const isPaperSize = (value: unknown): value is PrinterPaperSize =>
  value === '58mm' || value === '80mm' || value === '100x150';

const isConnectionType = (value: unknown): value is PrinterConnectionType =>
  value === 'bluetooth' || value === 'wifi' || value === 'usb';

const normalizePaperSize = (value: unknown): PrinterPaperSize => {
  if (isPaperSize(value)) return value;
  return '80mm';
};

const normalizeConnectionType = (value: unknown): PrinterConnectionType => {
  if (isConnectionType(value)) return value;
  return 'wifi';
};

const normalizePrinter = (raw: Partial<PrinterDevice>): PrinterDevice | null => {
  const name = (raw.name || '').trim();
  const model = (raw.model || '').trim();
  const address = (raw.address || '').trim();

  if (!name || !model || !address) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: raw.id || buildPrinterId(),
    name,
    model,
    connectionType: normalizeConnectionType(raw.connectionType),
    address,
    port: typeof raw.port === 'number' && Number.isFinite(raw.port) ? raw.port : null,
    paperSize: normalizePaperSize(raw.paperSize),
    supportsReceipt: Boolean(raw.supportsReceipt ?? true),
    supportsLabel: Boolean(raw.supportsLabel ?? false),
    isConnected: Boolean(raw.isConnected),
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    lastConnectedAt: raw.lastConnectedAt || null,
  };
};

const sanitizeStore = (raw: RawPrinterStore | null | undefined): PrinterStore => {
  if (!raw) {
    return { ...EMPTY_STORE, preferences: { ...DEFAULT_PREFERENCES } };
  }

  const printers = Array.isArray(raw.printers)
    ? raw.printers
        .map((item) => normalizePrinter(item))
        .filter((item): item is PrinterDevice => Boolean(item))
    : [];

  const printerIds = new Set(printers.map((item) => item.id));

  return {
    printers,
    defaultReceiptPrinterId:
      raw.defaultReceiptPrinterId && printerIds.has(raw.defaultReceiptPrinterId)
        ? raw.defaultReceiptPrinterId
        : null,
    defaultLabelPrinterId:
      raw.defaultLabelPrinterId && printerIds.has(raw.defaultLabelPrinterId)
        ? raw.defaultLabelPrinterId
        : null,
    preferences: {
      autoReconnect: raw.preferences?.autoReconnect ?? DEFAULT_PREFERENCES.autoReconnect,
      cutPaperAfterPrint: raw.preferences?.cutPaperAfterPrint ?? DEFAULT_PREFERENCES.cutPaperAfterPrint,
      openDrawerAfterReceipt:
        raw.preferences?.openDrawerAfterReceipt ?? DEFAULT_PREFERENCES.openDrawerAfterReceipt,
    },
  };
};

const sortPrinters = (printers: PrinterDevice[]) =>
  [...printers].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

async function readStore(): Promise<PrinterStore> {
  const raw = await AsyncStorage.getItem(PRINTER_STORE_KEY);
  if (!raw) {
    return { ...EMPTY_STORE, preferences: { ...DEFAULT_PREFERENCES } };
  }

  try {
    const parsed = JSON.parse(raw) as RawPrinterStore;
    return sanitizeStore(parsed);
  } catch {
    return { ...EMPTY_STORE, preferences: { ...DEFAULT_PREFERENCES } };
  }
}

async function writeStore(store: PrinterStore): Promise<PrinterStore> {
  const sanitized = sanitizeStore(store);
  await AsyncStorage.setItem(PRINTER_STORE_KEY, JSON.stringify(sanitized));
  return sanitized;
}

export async function getPrinterStore(): Promise<PrinterStore> {
  const store = await readStore();
  return { ...store, printers: sortPrinters(store.printers) };
}

export async function listPrinters(): Promise<PrinterDevice[]> {
  const store = await getPrinterStore();
  return store.printers;
}

export async function savePrinter(data: SavedPrinterData): Promise<PrinterStore> {
  const store = await readStore();
  const now = new Date().toISOString();
  const normalized = normalizePrinter({
    ...data,
    isConnected: Boolean(data.isConnected),
    updatedAt: now,
  });

  if (!normalized) {
    return getPrinterStore();
  }

  const existingIndex = store.printers.findIndex((item) => item.id === normalized.id);
  const previous = existingIndex >= 0 ? store.printers[existingIndex] : null;

  const nextPrinter: PrinterDevice = {
    ...normalized,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
    lastConnectedAt: normalized.isConnected ? normalized.lastConnectedAt || now : previous?.lastConnectedAt || null,
  };

  const nextPrinters =
    existingIndex >= 0
      ? store.printers.map((item, index) => (index === existingIndex ? nextPrinter : item))
      : [nextPrinter, ...store.printers];

  let defaultReceiptPrinterId = store.defaultReceiptPrinterId;
  let defaultLabelPrinterId = store.defaultLabelPrinterId;

  if (!defaultReceiptPrinterId && nextPrinter.supportsReceipt) {
    defaultReceiptPrinterId = nextPrinter.id;
  }
  if (!defaultLabelPrinterId && nextPrinter.supportsLabel) {
    defaultLabelPrinterId = nextPrinter.id;
  }
  if (defaultReceiptPrinterId === nextPrinter.id && !nextPrinter.supportsReceipt) {
    defaultReceiptPrinterId =
      nextPrinters.find((item) => item.supportsReceipt)?.id || null;
  }
  if (defaultLabelPrinterId === nextPrinter.id && !nextPrinter.supportsLabel) {
    defaultLabelPrinterId =
      nextPrinters.find((item) => item.supportsLabel)?.id || null;
  }

  return writeStore({
    ...store,
    printers: nextPrinters,
    defaultReceiptPrinterId,
    defaultLabelPrinterId,
  });
}

export async function setPrinterConnection(
  printerId: string,
  isConnected: boolean
): Promise<PrinterStore> {
  const store = await readStore();
  const now = new Date().toISOString();

  const nextPrinters = store.printers.map((item) => {
    if (item.id !== printerId) return item;
    return {
      ...item,
      isConnected,
      updatedAt: now,
      lastConnectedAt: isConnected ? now : item.lastConnectedAt,
    };
  });

  return writeStore({ ...store, printers: nextPrinters });
}

export async function setDefaultPrinter(
  printerId: string,
  usage: PrinterUsageType
): Promise<PrinterStore> {
  const store = await readStore();
  const printer = store.printers.find((item) => item.id === printerId);
  if (!printer) {
    return getPrinterStore();
  }

  if (usage === 'receipt' && !printer.supportsReceipt) {
    return getPrinterStore();
  }

  if (usage === 'label' && !printer.supportsLabel) {
    return getPrinterStore();
  }

  return writeStore({
    ...store,
    defaultReceiptPrinterId:
      usage === 'receipt' ? printerId : store.defaultReceiptPrinterId,
    defaultLabelPrinterId: usage === 'label' ? printerId : store.defaultLabelPrinterId,
  });
}

export async function removePrinter(printerId: string): Promise<PrinterStore> {
  const store = await readStore();
  const nextPrinters = store.printers.filter((item) => item.id !== printerId);
  const receiptFallback = nextPrinters.find((item) => item.supportsReceipt)?.id || null;
  const labelFallback = nextPrinters.find((item) => item.supportsLabel)?.id || null;

  return writeStore({
    ...store,
    printers: nextPrinters,
    defaultReceiptPrinterId:
      store.defaultReceiptPrinterId === printerId
        ? receiptFallback
        : store.defaultReceiptPrinterId,
    defaultLabelPrinterId:
      store.defaultLabelPrinterId === printerId
        ? labelFallback
        : store.defaultLabelPrinterId,
  });
}

export async function updatePrinterPreferences(
  patch: Partial<PrinterPreferences>
): Promise<PrinterStore> {
  const store = await readStore();

  return writeStore({
    ...store,
    preferences: {
      ...store.preferences,
      ...patch,
    },
  });
}

export async function getPrinterConnectionSummary(): Promise<string> {
  const store = await readStore();

  if (!store.printers.length) {
    return 'Chưa kết nối';
  }

  const defaultReceipt = store.printers.find(
    (item) => item.id === store.defaultReceiptPrinterId
  );
  const connectedDefaultReceipt =
    defaultReceipt && defaultReceipt.isConnected ? defaultReceipt : null;
  const firstConnected = store.printers.find((item) => item.isConnected) || null;
  const target = connectedDefaultReceipt || firstConnected || defaultReceipt || store.printers[0];

  if (!target) {
    return 'Chưa kết nối';
  }

  const status = target.isConnected ? 'Online' : 'Offline';
  return `${target.name} · ${status}`;
}

export function buildReceiptTestPayload(printer: PrinterDevice) {
  const now = new Date();
  const timestamp = `${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN')}`;
  return {
    jobType: 'receipt' as const,
    printerId: printer.id,
    printerName: printer.name,
    paperSize: printer.paperSize,
    generatedAt: now.toISOString(),
    lines: [
      'VMASS MOBILE - TEST PRINT',
      `Printer: ${printer.model}`,
      `Time: ${timestamp}`,
      '--------------------------------',
      'Ca phe den x2        50.000',
      'Banh mi x1           22.000',
      '--------------------------------',
      'Tong cong            72.000',
      'Thanh toan tien mat  80.000',
      'Tien thua             8.000',
      'Cam on quy khach!',
    ],
  };
}

export function buildLabelTestPayload(printer: PrinterDevice) {
  const now = new Date();
  return {
    jobType: 'label' as const,
    printerId: printer.id,
    printerName: printer.name,
    paperSize: printer.paperSize,
    generatedAt: now.toISOString(),
    sku: 'VMASS-CAFE-G7',
    productName: 'Ca phe G7 3in1',
    price: '25.000 VND',
    qrValue: `vmass://product/VMASS-CAFE-G7?t=${now.getTime()}`,
  };
}
