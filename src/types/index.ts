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
  status: 'active' | 'inactive';
  isOnline: boolean;
  allowOversell: boolean;
  vatApplied: boolean;
  createdAt: string;
  updatedAt?: string;
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

export interface Staff {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
  branch: string;
  salary: number;
  commission: number;
  permissions: StaffPermissions;
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
  type: 'percent' | 'flat' | 'bogo' | 'combo';
  value: number;
  code?: string;
  usageLimit: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'ended';
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
  newCustomers: number;
  itemsSold: number;
  profitToday: number;
  monthlyGoal: number;
  monthlyRevenue: number;
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
