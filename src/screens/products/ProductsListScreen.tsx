import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import { Header, SearchBar, ChipRow, StatCard, FAB, StatusBadge } from '../../components';
import { Product } from '../../types';

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Áo thun nam basic', sku: 'AT-001', price: 189000, cost: 90000, stock: 52, minStock: 10, category: 'Thời trang', status: 'active', isOnline: true, allowOversell: false, vatApplied: false, createdAt: '2024-01-01' },
  { id: 2, name: 'Quần jean slim fit', sku: 'QJ-002', price: 450000, cost: 200000, stock: 3, minStock: 5, category: 'Thời trang', status: 'active', isOnline: true, allowOversell: false, vatApplied: false, createdAt: '2024-01-02' },
  { id: 3, name: 'Bánh mì sandwich', sku: 'BM-001', price: 25000, cost: 10000, stock: 0, minStock: 20, category: 'Thực phẩm', status: 'active', isOnline: false, allowOversell: false, vatApplied: false, createdAt: '2024-01-03' },
  { id: 4, name: 'Kem dưỡng da mặt', sku: 'KD-003', price: 320000, cost: 120000, stock: 18, minStock: 5, category: 'Mỹ phẩm', status: 'active', isOnline: true, allowOversell: false, vatApplied: true, createdAt: '2024-01-04' },
  { id: 5, name: 'Tai nghe bluetooth', sku: 'TN-005', price: 890000, cost: 400000, stock: 7, minStock: 3, category: 'Điện tử', status: 'active', isOnline: true, allowOversell: false, vatApplied: true, createdAt: '2024-01-05' },
  { id: 6, name: 'Nước hoa hồng', sku: 'NH-002', price: 150000, cost: 60000, stock: 4, minStock: 10, category: 'Mỹ phẩm', status: 'active', isOnline: true, allowOversell: false, vatApplied: false, createdAt: '2024-01-06' },
  { id: 7, name: 'Đầm maxi hoa nhí', sku: 'DM-007', price: 380000, cost: 150000, stock: 22, minStock: 5, category: 'Thời trang', status: 'active', isOnline: true, allowOversell: false, vatApplied: false, createdAt: '2024-01-07' },
  { id: 8, name: 'Sạc dự phòng 20000mAh', sku: 'SD-008', price: 650000, cost: 280000, stock: 0, minStock: 5, category: 'Điện tử', status: 'inactive', isOnline: false, allowOversell: false, vatApplied: true, createdAt: '2024-01-08' },
];

const MOCK_SOLD: Record<number, number> = { 1: 120, 2: 45, 3: 200, 4: 88, 5: 32, 6: 67, 7: 95, 8: 10 };
const HOT_THRESHOLD = 80;

const CATEGORIES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'Thời trang', label: 'Thời trang' },
  { key: 'Thực phẩm', label: 'Thực phẩm' },
  { key: 'Mỹ phẩm', label: 'Mỹ phẩm' },
  { key: 'Điện tử', label: 'Điện tử' },
  { key: 'Khác', label: 'Khác' },
];

const AVATAR_COLORS = ['#008ecc', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#f57c00', '#c62828'];

export function ProductsListScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = MOCK_PRODUCTS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || p.category === category;
    return matchSearch && matchCat;
  });

  const totalProducts = MOCK_PRODUCTS.length;
  const selling = MOCK_PRODUCTS.filter(p => p.status === 'active' && p.stock > 0).length;
  const lowStock = MOCK_PRODUCTS.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStock = MOCK_PRODUCTS.filter(p => p.stock === 0).length;

  const getStockColor = (p: Product) => {
    if (p.stock === 0) return Colors.danger;
    if (p.stock <= p.minStock) return Colors.warning;
    return Colors.success;
  };

  const renderProduct = ({ item, index }: { item: Product; index: number }) => {
    const sold = MOCK_SOLD[item.id] || 0;
    const isHot = sold > HOT_THRESHOLD;
    const isLow = item.stock > 0 && item.stock <= item.minStock;
    const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];

    return (
      <View style={styles.productRow}>
        {/* Image placeholder */}
        <View style={[styles.productImage, { backgroundColor: avatarBg }]}>
          <Text style={styles.productImageLetter}>{item.name[0]}</Text>
        </View>

        {/* Info */}
        <View style={styles.productInfo}>
          <View style={styles.productNameRow}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.badges}>
              {isHot && (
                <View style={styles.hotBadge}>
                  <Text style={styles.hotBadgeText}>HOT</Text>
                </View>
              )}
              {isLow && (
                <View style={styles.lowBadge}>
                  <Text style={styles.lowBadgeText}>Sắp hết</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.skuText}>{item.sku}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{item.price.toLocaleString('vi-VN')} đ</Text>
            <Text style={styles.costText}> · {item.cost.toLocaleString('vi-VN')} đ</Text>
          </View>
        </View>

        {/* Stock + Actions */}
        <View style={styles.productRight}>
          <Text style={[styles.stockText, { color: getStockColor(item) }]}>
            {item.stock === 0 ? 'Hết' : `${item.stock}`}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('ProductEdit', { id: item.id })}
            >
              <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Sản phẩm"
        rightActions={
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="filter-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        }
      />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm sản phẩm, SKU..."
        onQrPress={() => {}}
      />

      <ChipRow chips={CATEGORIES} selected={category} onSelect={setCategory} />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard label="Tổng SP" value={String(totalProducts)} style={styles.statItem} />
        <StatCard label="Đang bán" value={String(selling)} color={Colors.success} style={styles.statItem} />
        <StatCard label="Sắp hết" value={String(lowStock)} color={Colors.warning} style={styles.statItem} />
        <StatCard label="Hết hàng" value={String(outOfStock)} color={Colors.danger} style={styles.statItem} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <FAB onPress={() => navigation.navigate('ProductEdit')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBtn: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  statItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginVertical: 4,
    ...Shadow.sm,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  productImageLetter: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  productInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  productName: {
    ...Typography.bodyMd,
    color: Colors.text,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  hotBadge: {
    backgroundColor: '#ff7043',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  hotBadgeText: {
    ...Typography.label,
    color: '#fff',
    fontSize: 9,
  },
  lowBadge: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  lowBadgeText: {
    ...Typography.label,
    color: Colors.warning,
    fontSize: 9,
  },
  skuText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  priceText: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '600',
  },
  costText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  productRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  stockText: {
    ...Typography.bodyMd,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
