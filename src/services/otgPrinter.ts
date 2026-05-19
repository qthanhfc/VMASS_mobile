import { NativeModules, Platform } from 'react-native';
import {
  getPrinterStore,
  type PrinterDevice,
  type PrinterPreferences,
  type PrinterStore,
} from './printer';

// Expected Android native bridge methods:
// - requestPermission(params) (optional)
// - connectUsb/connectLan/connectTcp/connect/open(params)
// - printEscPosBytes(bytes) or printRawBytes(bytes) or printRaw(bytes) or write(bytes)
// - disconnect/close()
type AndroidPrinterBridgeModule = {
  isSupported?: () => boolean | Promise<boolean>;
  requestPermission?: (params?: Record<string, unknown>) => boolean | Promise<boolean>;
  connectUsb?: (params?: Record<string, unknown>) => boolean | Promise<boolean>;
  connectLan?: (params?: Record<string, unknown>) => boolean | Promise<boolean>;
  connectTcp?: (params?: Record<string, unknown>) => boolean | Promise<boolean>;
  openLan?: (params?: Record<string, unknown>) => boolean | Promise<boolean>;
  openTcp?: (params?: Record<string, unknown>) => boolean | Promise<boolean>;
  connect?: (params?: Record<string, unknown>) => boolean | Promise<boolean>;
  open?: (params?: Record<string, unknown>) => boolean | Promise<boolean>;
  printEscPosBytes?: (bytes: number[]) => void | Promise<void>;
  printRawBytes?: (bytes: number[]) => void | Promise<void>;
  printRaw?: (bytes: number[] | string) => void | Promise<void>;
  write?: (bytes: number[] | string) => void | Promise<void>;
  disconnect?: () => void | Promise<void>;
  close?: () => void | Promise<void>;
};

type NetPrinterModule = {
  init: () => void | Promise<void>;
  connectPrinter: (host: string, port: number, timeout?: number) => void | Promise<void>;
  printBill: (
    text: string,
    options?: {
      cut?: boolean;
      beep?: boolean;
      tailingLine?: boolean;
    }
  ) => void;
  closeConn: () => void | Promise<void>;
};

export type PosReceiptLineItem = {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type PosReceiptPrintData = {
  billId: string;
  storeName: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethodLabel: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  feeOtherAmount: number;
  shippingAmount: number;
  totalAmount: number;
  items: PosReceiptLineItem[];
  printedAt?: Date;
};

export type OtpPrintReceiptResult = {
  attempted: boolean;
  success: boolean;
  message: string;
  printerName?: string;
};

export type PosPrintReceiptResult = OtpPrintReceiptResult;

const BRIDGE_MODULE_NAMES = ['VmassUsbPrinterOtg', 'VmassUsbPrinter', 'RNUSBPrinter'] as const;
const XPRINTER_350B_SIGNATURES = ['xp-350b', 'xprinter 350b', '350b'];
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const RECEIPT_WIDTH = 42;

let isPrinting = false;

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

const toAscii = (value: string) => normalizeText(value).replace(/[^\x20-\x7E]/g, ' ');

const formatMoney = (value: number) =>
  `${Math.round(Number.isFinite(value) ? value : 0).toLocaleString('vi-VN')}d`;

const truncate = (value: string, max: number) => {
  if (value.length <= max) return value;
  if (max <= 3) return value.slice(0, max);
  return `${value.slice(0, max - 3)}...`;
};

const padRight = (value: string, width: number) =>
  value.length >= width ? value : `${value}${' '.repeat(width - value.length)}`;

const padLeft = (value: string, width: number) =>
  value.length >= width ? value : `${' '.repeat(width - value.length)}${value}`;

const rowPair = (leftRaw: string, rightRaw: string, width = RECEIPT_WIDTH) => {
  const left = toAscii(leftRaw);
  const right = toAscii(rightRaw);
  const maxLeft = Math.max(0, width - right.length - 1);
  const slicedLeft = truncate(left, maxLeft);
  return `${padRight(slicedLeft, maxLeft)} ${padLeft(right, right.length)}`.trimEnd();
};

const drawLine = (width = RECEIPT_WIDTH) => '-'.repeat(width);

const printerMatches350B = (printer: PrinterDevice) => {
  const haystack = `${printer.name} ${printer.model}`.toLowerCase();
  return XPRINTER_350B_SIGNATURES.some((signature) => haystack.includes(signature));
};

const resolvePreferredReceiptPrinter = (store: PrinterStore): PrinterDevice | null => {
  const byId = new Map(store.printers.map((item) => [item.id, item]));
  const defaultReceipt = store.defaultReceiptPrinterId
    ? byId.get(store.defaultReceiptPrinterId) || null
    : null;

  if (defaultReceipt?.supportsReceipt) {
    return defaultReceipt;
  }

  return (
    store.printers.find((item) => item.supportsReceipt && item.isConnected) ||
    store.printers.find((item) => item.supportsReceipt) ||
    null
  );
};

const resolve350BReceiptPrinter = (store: PrinterStore): PrinterDevice | null => {
  const preferred = resolvePreferredReceiptPrinter(store);
  if (
    preferred &&
    preferred.connectionType === 'usb' &&
    preferred.supportsReceipt &&
    printerMatches350B(preferred)
  ) {
    return preferred;
  }

  return (
    store.printers.find(
      (item) =>
        item.connectionType === 'usb' &&
        item.supportsReceipt &&
        item.isConnected &&
        printerMatches350B(item)
    ) || null
  );
};

const getPrinterBridge = (): AndroidPrinterBridgeModule | null => {
  for (const moduleName of BRIDGE_MODULE_NAMES) {
    const module = (NativeModules as Record<string, AndroidPrinterBridgeModule | undefined>)[moduleName];
    if (module) return module;
  }
  return null;
};

const getNetPrinter = (): NetPrinterModule | null => {
  try {
    const nativePrinter = require('react-native-thermal-receipt-printer-image-qr') as {
      NetPrinter?: NetPrinterModule;
    };
    return nativePrinter?.NetPrinter || null;
  } catch {
    return null;
  }
};

const callMaybe = async <T>(
  module: AndroidPrinterBridgeModule,
  methodNames: Array<keyof AndroidPrinterBridgeModule>,
  arg?: Record<string, unknown>
): Promise<T | undefined> => {
  for (const methodName of methodNames) {
    const fn = module[methodName] as unknown as ((payload?: unknown) => unknown) | undefined;
    if (typeof fn !== 'function') continue;
    const result = arg !== undefined ? fn(arg) : fn();
    return await Promise.resolve(result as T);
  }
  return undefined;
};

const callPrintBytes = async (module: AndroidPrinterBridgeModule, bytes: number[]) => {
  if (typeof module.printEscPosBytes === 'function') {
    await Promise.resolve(module.printEscPosBytes(bytes));
    return;
  }
  if (typeof module.printRawBytes === 'function') {
    await Promise.resolve(module.printRawBytes(bytes));
    return;
  }
  if (typeof module.printRaw === 'function') {
    await Promise.resolve(module.printRaw(bytes));
    return;
  }
  if (typeof module.write === 'function') {
    await Promise.resolve(module.write(bytes));
    return;
  }

  throw new Error('Native printer bridge has no print method.');
};

const buildReceiptBytes = (
  data: PosReceiptPrintData,
  preferences: PrinterPreferences
): number[] => {
  const bytes: number[] = [];
  const lines: string[] = [];
  const printedAt = data.printedAt || new Date();
  const timestamp = `${printedAt.toLocaleDateString('vi-VN')} ${printedAt.toLocaleTimeString('vi-VN')}`;

  lines.push(toAscii(data.storeName || 'VMASS'));
  lines.push('PHIEU THANH TOAN');
  lines.push(drawLine());
  lines.push(rowPair('So HD', data.billId));
  lines.push(rowPair('Thoi gian', timestamp));
  lines.push(rowPair('Thanh toan', data.paymentMethodLabel));
  if (data.customerName) {
    lines.push(rowPair('Khach', data.customerName));
  }
  if (data.customerPhone) {
    lines.push(rowPair('SDT', data.customerPhone));
  }
  lines.push(drawLine());
  lines.push(rowPair('SL  San pham', 'Thanh tien'));

  data.items.forEach((item) => {
    const qty = `${Math.max(1, item.qty)}x`;
    const totalText = formatMoney(item.lineTotal);
    const itemPrefix = `${qty} ${toAscii(item.name)}`;
    lines.push(rowPair(itemPrefix, totalText));
  });

  lines.push(drawLine());
  lines.push(rowPair('Tam tinh', formatMoney(data.subtotal)));
  if (data.discountAmount > 0) {
    lines.push(rowPair('Giam gia', `-${formatMoney(data.discountAmount)}`));
  }
  if (data.taxAmount > 0) {
    lines.push(rowPair('Thue/Phi', formatMoney(data.taxAmount)));
  }
  if (data.feeOtherAmount > 0) {
    lines.push(rowPair('Phi khac', formatMoney(data.feeOtherAmount)));
  }
  if (data.shippingAmount > 0) {
    lines.push(rowPair('Phi ship', formatMoney(data.shippingAmount)));
  }
  lines.push(drawLine());
  lines.push(rowPair('TONG CONG', formatMoney(data.totalAmount)));
  lines.push(drawLine());
  lines.push('Cam on quy khach!');
  lines.push('');
  lines.push('');

  const push = (...numbers: number[]) => {
    numbers.forEach((number) => bytes.push(number & 0xff));
  };

  const pushTextLine = (text: string) => {
    const line = toAscii(text);
    for (let index = 0; index < line.length; index += 1) {
      push(line.charCodeAt(index));
    }
    push(LF);
  };

  push(ESC, 0x40);
  push(ESC, 0x61, 0x01);
  push(ESC, 0x45, 0x01);
  pushTextLine(lines[0] || 'VMASS');
  push(ESC, 0x45, 0x00);
  push(ESC, 0x61, 0x00);

  for (let index = 1; index < lines.length; index += 1) {
    pushTextLine(lines[index]);
  }

  if (preferences.cutPaperAfterPrint) {
    push(GS, 0x56, 0x41, 0x00);
  }

  if (preferences.openDrawerAfterReceipt) {
    push(ESC, 0x70, 0x00, 0x32, 0x32);
  }

  return bytes;
};

const buildReceiptText = (data: PosReceiptPrintData): string => {
  const lines: string[] = [];
  const printedAt = data.printedAt || new Date();
  const timestamp = `${printedAt.toLocaleDateString('vi-VN')} ${printedAt.toLocaleTimeString('vi-VN')}`;

  lines.push(toAscii(data.storeName || 'VMASS'));
  lines.push('PHIEU THANH TOAN');
  lines.push(drawLine());
  lines.push(rowPair('So HD', data.billId));
  lines.push(rowPair('Thoi gian', timestamp));
  lines.push(rowPair('Thanh toan', data.paymentMethodLabel));
  if (data.customerName) {
    lines.push(rowPair('Khach', data.customerName));
  }
  if (data.customerPhone) {
    lines.push(rowPair('SDT', data.customerPhone));
  }
  lines.push(drawLine());
  lines.push(rowPair('SL  San pham', 'Thanh tien'));

  data.items.forEach((item) => {
    const qty = `${Math.max(1, item.qty)}x`;
    const totalText = formatMoney(item.lineTotal);
    const itemPrefix = `${qty} ${toAscii(item.name)}`;
    lines.push(rowPair(itemPrefix, totalText));
  });

  lines.push(drawLine());
  lines.push(rowPair('Tam tinh', formatMoney(data.subtotal)));
  if (data.discountAmount > 0) {
    lines.push(rowPair('Giam gia', `-${formatMoney(data.discountAmount)}`));
  }
  if (data.taxAmount > 0) {
    lines.push(rowPair('Thue/Phi', formatMoney(data.taxAmount)));
  }
  if (data.feeOtherAmount > 0) {
    lines.push(rowPair('Phi khac', formatMoney(data.feeOtherAmount)));
  }
  if (data.shippingAmount > 0) {
    lines.push(rowPair('Phi ship', formatMoney(data.shippingAmount)));
  }
  lines.push(drawLine());
  lines.push(rowPair('TONG CONG', formatMoney(data.totalAmount)));
  lines.push(drawLine());
  lines.push('Cam on quy khach!');
  lines.push('');
  lines.push('');

  return `${lines.join('\n')}\n`;
};

const buildConnectParams = (printer: PrinterDevice): Record<string, unknown> => ({
  model: printer.model,
  name: printer.name,
  address: printer.address,
  host: printer.address,
  ip: printer.address,
  port: printer.port || 9100,
  connectionType: printer.connectionType,
});

const executeAndroidPrint = async (
  printer: PrinterDevice,
  data: PosReceiptPrintData,
  preferences: PrinterPreferences,
  connectMethods: Array<keyof AndroidPrinterBridgeModule>,
  successPrefix: string
): Promise<PosPrintReceiptResult> => {
  const module = getPrinterBridge();
  if (!module) {
    return {
      attempted: true,
      success: false,
      message: 'Thieu native printer bridge. Can build app voi module Android in nhiet.',
      printerName: printer.name,
    };
  }

  const supported = await callMaybe<boolean>(module, ['isSupported']);
  if (supported === false) {
    return {
      attempted: true,
      success: false,
      message: 'Thiet bi khong ho tro ket noi may in theo cau hinh hien tai.',
      printerName: printer.name,
    };
  }

  const connectParams = buildConnectParams(printer);
  let hasConnected = false;

  try {
    const permissionResult = await callMaybe<boolean>(module, ['requestPermission'], connectParams);
    if (permissionResult === false) {
      return {
        attempted: true,
        success: false,
        message: 'Khong duoc cap quyen ket noi may in.',
        printerName: printer.name,
      };
    }

    const connectResult = await callMaybe<boolean>(module, connectMethods, connectParams);
    if (connectResult === false) {
      return {
        attempted: true,
        success: false,
        message: 'Khong the mo kenh ket noi toi may in.',
        printerName: printer.name,
      };
    }
    hasConnected = true;

    const bytes = buildReceiptBytes(data, preferences);
    await callPrintBytes(module, bytes);

    return {
      attempted: true,
      success: true,
      message: `${successPrefix} (${printer.name}).`,
      printerName: printer.name,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : 'Lenh in that bai.';

    return {
      attempted: true,
      success: false,
      message: `In that bai: ${message}`,
      printerName: printer.name,
    };
  } finally {
    if (hasConnected) {
      await callMaybe(module, ['disconnect', 'close']);
    }
  }
};

const printViaUsb350B = async (
  printer: PrinterDevice,
  data: PosReceiptPrintData,
  preferences: PrinterPreferences
): Promise<PosPrintReceiptResult> => {
  if (!printerMatches350B(printer)) {
    return {
      attempted: false,
      success: false,
      message: 'Nhanh USB OTG hien tai chi bat profile XPrinter 350B.',
      printerName: printer.name,
    };
  }

  return executeAndroidPrint(
    printer,
    data,
    preferences,
    ['connectUsb', 'connect', 'open'],
    'Da gui lenh in OTG'
  );
};

const printViaLanWifi = async (
  printer: PrinterDevice,
  data: PosReceiptPrintData,
  preferences: PrinterPreferences
): Promise<PosPrintReceiptResult> => {
  const address = (printer.address || '').trim();
  if (!address) {
    return {
      attempted: false,
      success: false,
      message: 'Thieu IP/Host may in LAN-WiFi.',
      printerName: printer.name,
    };
  }

  const parseHostAndPort = (): { host: string; port: number } => {
    const defaultPort = printer.port || 9100;
    const match = address.match(/^(.+):(\d{2,5})$/);
    if (!match) {
      return { host: address, port: defaultPort };
    }

    const parsedPort = Number(match[2]);
    if (!Number.isFinite(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      return { host: match[1], port: defaultPort };
    }

    return { host: match[1], port: parsedPort };
  };

  const { host, port } = parseHostAndPort();
  const receiptText = buildReceiptText(data);
  const netPrinter = getNetPrinter();
  let hasNetConn = false;

  try {
    if (netPrinter) {
      await Promise.resolve(netPrinter.init());
      await Promise.resolve(netPrinter.connectPrinter(host, port, 5000));
      hasNetConn = true;
      netPrinter.printBill(receiptText, {
        cut: preferences.cutPaperAfterPrint,
        beep: false,
        tailingLine: true,
      });

      return {
        attempted: true,
        success: true,
        message: `Da gui lenh in LAN/WiFi (${printer.name})`,
        printerName: printer.name,
      };
    }

    throw new Error('THIET_BI_CHUA_TICH_HOP_NET_PRINTER');
  } catch (error) {
    const fallback = await executeAndroidPrint(
      printer,
      data,
      preferences,
      ['connectLan', 'openLan', 'connectTcp', 'openTcp', 'connect', 'open'],
      'Da gui lenh in LAN/WiFi'
    );
    if (fallback.success) {
      return fallback;
    }

    if (!netPrinter) {
      return {
        attempted: true,
        success: false,
        message:
          'Ban dang chay Expo Go nen chua co native module in LAN/WiFi. Hay tao development build de su dung chuc nang nay.',
        printerName: printer.name,
      };
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Khong ket noi duoc may in LAN/WiFi.';
    return {
      attempted: true,
      success: false,
      message: `In LAN/WiFi that bai: ${message}`,
      printerName: printer.name,
    };
  } finally {
    if (hasNetConn && netPrinter) {
      await Promise.resolve(netPrinter.closeConn()).catch(() => null);
    }
  }
};

export async function printPosReceiptViaConfiguredPrinter(
  data: PosReceiptPrintData
): Promise<PosPrintReceiptResult> {
  if (Platform.OS !== 'android') {
    return {
      attempted: false,
      success: false,
      message: 'Tu dong in nhiet hien chi ho tro Android.',
    };
  }

  if (isPrinting) {
    return {
      attempted: true,
      success: false,
      message: 'Dang co lenh in khac. Vui long thu lai sau.',
    };
  }

  const store = await getPrinterStore();
  const printer = resolvePreferredReceiptPrinter(store);
  if (!printer) {
    return {
      attempted: false,
      success: false,
      message: 'Chua cau hinh may in bill mac dinh.',
    };
  }

  isPrinting = true;
  try {
    if (printer.connectionType === 'wifi') {
      return await printViaLanWifi(printer, data, store.preferences);
    }
    if (printer.connectionType === 'usb') {
      return await printViaUsb350B(printer, data, store.preferences);
    }
    if (printer.connectionType === 'bluetooth') {
      return {
        attempted: false,
        success: false,
        message: 'Nhanh Bluetooth chua duoc bat trong build nay.',
        printerName: printer.name,
      };
    }

    return {
      attempted: false,
      success: false,
      message: 'Kieu ket noi may in khong hop le.',
      printerName: printer.name,
    };
  } finally {
    isPrinting = false;
  }
}

export async function printPosReceiptViaAndroidOtg350B(
  data: PosReceiptPrintData
): Promise<OtpPrintReceiptResult> {
  if (Platform.OS !== 'android') {
    return {
      attempted: false,
      success: false,
      message: 'In OTG chi ho tro Android.',
    };
  }

  if (isPrinting) {
    return {
      attempted: true,
      success: false,
      message: 'Dang co lenh in khac. Vui long thu lai sau.',
    };
  }

  const store = await getPrinterStore();
  const printer = resolve350BReceiptPrinter(store);
  if (!printer) {
    return {
      attempted: false,
      success: false,
      message: 'Chua thay may in USB XPrinter 350B hop le.',
    };
  }

  isPrinting = true;
  try {
    return await printViaUsb350B(printer, data, store.preferences);
  } finally {
    isPrinting = false;
  }
}
