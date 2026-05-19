export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  categoryId?: number;
  category: string;
  brandId?: number;
  brandName?: string;
  saleUnit?: string;
  image?: string;
  images?: string[];
  priceSale?: number;
  activeSale?: boolean;
  bestter?: boolean;
  variantCount?: number;
  variants?: ProductVariant[];
  sizeOptions?: ProductVariantOption[];
  colorOptions?: ProductVariantOption[];
  materialOptions?: ProductVariantOption[];
  toppings?: ProductVariantOption[];
  iceOptions?: ProductVariantOption[];
  sugarOptions?: ProductVariantOption[];
  sizeTitle?: string;
  colorTitle?: string;
  materialTitle?: string;
  toppingTitle?: string;
  iceTitle?: string;
  sugarTitle?: string;
  comboItems?: ProductComboItem[];
  status: 'active' | 'inactive';
  isOnline: boolean;
  allowOversell: boolean;
  vatApplied: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductComboItem {
  productId: number;
  productName?: string;
  quantity: number;
}

export interface ProductVariantOption {
  id?: number | string;
  name?: string;
  label?: string;
  value?: string;
  promo_price?: string | number | null;
}

export interface ProductVariantAttributes {
  size?: ProductVariantOption;
  color?: ProductVariantOption;
  material?: ProductVariantOption;
  [key: string]: ProductVariantOption | undefined;
}

export interface ProductVariant {
  id: number;
  productId?: number;
  sku?: string;
  price: number;
  costPrice: number;
  promoPrice?: number;
  quantity: number;
  dateStart?: string | null;
  dateEnd?: string | null;
  attributes: ProductVariantAttributes;
}

export interface ProductStock {
  id?: number;
  name: string;
  unit?: string;
  count: number;
  averagePrice?: number;
  latestPrice?: number;
}

export interface ProductMakeItem {
  productId: number;
  count: number;
  stock?: ProductStock;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalSpent: number;
  orderCount: number;
  points: number;
  tier: 'VIP' | 'Gold' | 'Silver' | 'Normal';
  notes?: string;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId?: number;
  customerName: string;
  status: 'pending' | 'paid' | 'packing' | 'shipping' | 'done' | 'cancelled' | 'returned';
  channel: 'pos' | 'shopee' | 'lazada' | 'tiktok' | 'tiki' | 'website';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  createdAt: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  sku: string;
  qty: number;
  price: number;
  total: number;
}

export type StaffSalaryBy = 'h' | 'd' | 'm';
export type StaffWorkingStatus = 'on' | 'off';
export type StaffId = number | string;

export interface StaffWorkingHour {
  hash: string;
  start: string;
  end: string;
}

export type StaffDynamicFormValues = Record<string, string | number | boolean | null | undefined>;

export interface StaffSalaryArchive {
  month: number | string;
  year: number | string;
}

export interface StaffPendingSetting {
  date_get_salary?: string | number | null;
  salary_by?: StaffSalaryBy | string | null;
  salary_value?: string | number | null;
  hour_working_on_day?: string | number | null;
  working_hours?: string | null;
  date_start_pending_setting?: string | null;
}

export interface Staff {
  id: StaffId;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  birthday?: string;
  permission_name: string;
  date_join: string;
  date_get_salary: string;
  salary_by: StaffSalaryBy;
  salary_value: string;
  hour_working_on_day: string;
  working_hours: StaffWorkingHour[];
  status_working: StaffWorkingStatus;
  dynamic_form: StaffDynamicFormValues;
  current_commission: number;
  current_bonus: number;
  current_overtime: number;
  current_advence: number;
  current_fined: number;
  current_dayoff: number;
  current_day_working: number;
  current_salary: number;
  total_day_working: number;
  total_salary: number;
  pending_date: StaffPendingSetting | null;
  pending_hour: StaffPendingSetting | null;
  lst_6_month: StaffSalaryArchive[];
  overtime_hour: number;
  day_off_hour: number;
  avatar?: string;
  status: 'active' | 'inactive';
}

export interface StaffPermissions {
  canSell: boolean;
  canViewRevenue: boolean;
  canManageInventory: boolean;
  canManageCustomers: boolean;
  canManageStaff: boolean;
  canManagePromotions: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contactPerson: string;
  paymentTerms: string;
  creditLimit: number;
  currentDebt: number;
  totalOrders: number;
  category: string;
  status: 'active' | 'inactive';
}

export interface InventoryItem {
  productId: number;
  productName: string;
  sku: string;
  stock: number;
  minStock: number;
  value: number;
  branch: string;
}

export interface Return {
  id: number;
  orderNumber: string;
  customerName: string;
  reason: string;
  items: ReturnItem[];
  refundAmount: number;
  refundMethod: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
}

export interface ReturnItem {
  productName: string;
  qty: number;
  price: number;
}

export interface Promotion {
  id: number;
  name: string;
  type: string;
  value?: number;
  code?: string;
  usageLimit: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'ended' | 'paused';
}

export interface BookkeepingEntry {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  party?: string;
}

export interface Message {
  id: number;
  channel: 'facebook' | 'zalo' | 'instagram' | 'sms' | 'internal' | 'system';
  customerId?: number;
  senderName: string;
  preview: string;
  timestamp: string;
  unread: number;
  avatar?: string;
  isPinned?: boolean;
  replyStatus?: 'unreplied' | 'replied';
  customerSegment?: CustomerSegment;
  customerTags?: CustomerTag[];
}

export type CustomerSegment =
  | 'new'
  | 'returning'
  | 'purchased'
  | 'callback'
  | 'potential'
  | 'unclear_need'
  | 'vip'
  | 'needs_followup'
  | 'complaint'
  | 'internal';
export type CustomerTag =
  | 'price_sensitive'
  | 'easy_to_close'
  | 'high_value'
  | 'needs_consult'
  | 'refund_risk';

export interface DashboardStats {
  revenueToday: number;
  revenueYesterday: number;
  ordersToday: number;
  ordersPrevious: number;
  newCustomers: number;
  itemsSold: number;
  itemsSoldPrevious: number;
  profitToday: number;
  profitPrevious: number;
  monthlyGoal: number;
  monthlyRevenue: number;
  dailyGoal: number;
  dailyRevenue: number;
  dailyProductGoal: number;
  dailyProductsSold: number;
  monthlyProductGoal: number;
  monthlyProductsSold: number;
  weeklyRevenue: number[];
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
  recentOrders: RecentOrder[];
}

export interface TopProduct {
  id: number;
  name: string;
  sold: number;
  revenue: number;
}

export interface LowStockProduct {
  id: number;
  name: string;
  stock: number;
  minStock: number;
  unit?: string;
}

export interface RecentOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  channel: string;
  createdAt: string;
}

export * from './tax';
