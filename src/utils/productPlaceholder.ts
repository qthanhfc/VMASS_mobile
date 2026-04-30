import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export type ProductPlaceholderConfig = {
  icon: IoniconsName;
  label: string;
  backgroundColor: string;
  iconColor: string;
};

const PLACEHOLDERS: Record<string, ProductPlaceholderConfig> = {
  cafe: {
    icon: 'cafe',
    label: 'Cafe',
    backgroundColor: '#f5f0e8',
    iconColor: '#8B4513',
  },
  restaurant: {
    icon: 'fast-food-outline',
    label: 'Nhà hàng',
    backgroundColor: '#faf8f5',
    iconColor: '#666666',
  },
  fashion: {
    icon: 'shirt-outline',
    label: 'Thời trang',
    backgroundColor: '#f8f4f9',
    iconColor: '#6B8E9F',
  },
  retail: {
    icon: 'cart-outline',
    label: 'Bán lẻ',
    backgroundColor: '#f0f5f0',
    iconColor: '#4CAF50',
  },
  cosmetics: {
    icon: 'bag-handle-outline',
    label: 'Mỹ phẩm',
    backgroundColor: '#fff4f8',
    iconColor: '#db2777',
  },
  grocery: {
    icon: 'cart-outline',
    label: 'Tạp hóa',
    backgroundColor: '#fff8e7',
    iconColor: '#FF9800',
  },
  shop: {
    icon: 'cart-outline',
    label: 'Cửa hàng',
    backgroundColor: '#f0f5f0',
    iconColor: '#4CAF50',
  },
};

const DEFAULT_PLACEHOLDER: ProductPlaceholderConfig = {
  icon: 'images-outline',
  label: 'Chưa có ảnh',
  backgroundColor: '#f0f0f0',
  iconColor: '#888888',
};

export function getProductPlaceholderConfig(businessType?: string) {
  const normalized = (businessType || '').trim().toLowerCase();
  return PLACEHOLDERS[normalized] || DEFAULT_PLACEHOLDER;
}
