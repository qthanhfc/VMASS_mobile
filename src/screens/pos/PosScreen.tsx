import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { ManageStackParamList, ScanActionItem } from '../../navigation';

const PRODUCTS = [
  { id: 1, name: 'Áo thun nam basic', price: 199000, sku: 'AT001', category: 'Thời trang' },
  { id: 2, name: 'Quần jean slim fit', price: 450000, sku: 'QJ002', category: 'Thời trang' },
  { id: 3, name: 'Giày thể thao', price: 890000, sku: 'GT003', category: 'Thời trang' },
  { id: 4, name: 'Cà phê hòa tan', price: 85000, sku: 'CF004', category: 'Đồ uống' },
  { id: 5, name: 'Bánh quy xốp', price: 35000, sku: 'BQ005', category: 'Bánh kẹo' },
  { id: 6, name: 'Nước hoa hồng', price: 320000, sku: 'NH006', category: 'Mỹ phẩm' },
];

interface CartItem { id: number; name: string; price: number; qty: number; }
type PosRoute = RouteProp<ManageStackParamList, 'PosScreen'>;

const PAY_METHODS = [
  { key: 'cash', label: 'Tiền mặt', icon: 'cash-outline' as const },
  { key: 'transfer', label: 'Chuyển khoản', icon: 'swap-horizontal-outline' as const },
  { key: 'card', label: 'Thẻ', icon: 'card-outline' as const },
];
const CATEGORIES = ['Tất cả', 'Đồ uống', 'Bánh kẹo', 'Thời trang', 'Mỹ phẩm'] as const;

const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

const buildCartFromScanItems = (scanItems: ScanActionItem[] = []): CartItem[] => {
  return scanItems.map((scanItem, index) => {
    const match = PRODUCTS.find(product =>
      product.sku === scanItem.sku ||
      product.sku === scanItem.code ||
      scanItem.code.includes(product.sku) ||
      scanItem.name.includes(product.sku)
    );

    return {
      id: match?.id ?? -(index + 1),
      name: match?.name ?? scanItem.name,
      price: match?.price ?? 0,
      qty: scanItem.qty,
    };
  });
};

export function PosScreen() {
  const { colors } = useThemeMode();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute<PosRoute>();
  const [cart, setCart] = useState<CartItem[]>(() => buildCartFromScanItems(route.params?.scanItems));
  const [discount, setDiscount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Tất cả');

  const addToCart = (p: typeof PRODUCTS[0]) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  };
  const adjustQty = (id: number, delta: number) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = Number(discount.replace(/\D/g, '')) || 0;
  const total = Math.max(0, subtotal - discountAmt);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter(item => {
      const matchQuery = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
      const matchCategory = category === 'Tất cả' || item.category === category;
      return matchQuery && matchCategory;
    });
  }, [query, category]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Bán POS nhanh</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="person-outline" size={22} color={colors.text} />
          <Text style={[styles.iconLabel, { color: colors.textSecondary }]}>Chọn KH</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="qr-code-outline" size={18} color={Colors.primary} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Quét mã hoặc nhập tên sản phẩm..."
              placeholderTextColor={Colors.textSecondary}
            />
            <Ionicons name="camera-outline" size={18} color={Colors.primary} />
          </View>
        </View>

        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          style={styles.categoryList}
          contentContainerStyle={styles.categoryWrap}
          renderItem={({ item, index }) => {
            const active = category === item;
            const isLast = index === CATEGORIES.length - 1;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                  !isLast && styles.categoryChipSpacing,
                ]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />

        <FlatList
          data={filteredProducts}
          numColumns={3}
          keyExtractor={i => String(i.id)}
          style={styles.productList}
          contentContainerStyle={styles.productListContent}
          columnWrapperStyle={styles.columnWrap}
          renderItem={({ item }) => {
            const inCart = cart.find(c => c.id === item.id);
            return (
              <View style={styles.productCol}>
                <TouchableOpacity
                  style={[styles.productCard, inCart && styles.productCardActive]}
                  onPress={() => addToCart(item)}
                >
                  <View style={styles.productThumb}>
                    <Text style={styles.productThumbText}>{item.name[0]}</Text>
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.productPrice}>{`${Math.round(item.price / 1000)}K`}</Text>
                  {inCart && (
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyBadgeText}>{inCart.qty}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyProducts}>
              <Ionicons name="cube-outline" size={24} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>Không tìm thấy sản phẩm phù hợp</Text>
            </View>
          }
        />

        <View style={[styles.checkoutPanel, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
          <View style={styles.panelTop}>
            <Text style={styles.panelTitle}>Giỏ hàng ({totalItems})</Text>
            <View style={styles.cartBadge}>
              <Ionicons name="cart-outline" size={16} color={Colors.primary} />
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={24} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>Chạm sản phẩm để thêm vào giỏ</Text>
            </View>
          ) : (
            <ScrollView style={styles.cartList} contentContainerStyle={styles.cartListContent}>
              {cart.map(item => (
                <View key={item.id} style={styles.cartRow}>
                  <View style={styles.cartMeta}>
                    <Text style={styles.cartName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.cartUnitPrice}>{`Đơn giá ${formatMoney(item.price)}`}</Text>
                  </View>
                  <View style={styles.qtyStepper}>
                    <TouchableOpacity onPress={() => adjustQty(item.id, -1)} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity onPress={() => adjustQty(item.id, 1)} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemTotal}>{formatMoney(item.price * item.qty)}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.summary}>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Tạm tính</Text>
              <Text style={styles.sumVal}>{formatMoney(subtotal)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Giảm giá</Text>
              <TextInput
                style={styles.discountInput}
                value={discount}
                onChangeText={setDiscount}
                placeholder="0đ"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.sumRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>TỔNG</Text>
              <Text style={styles.totalVal}>{formatMoney(total)}</Text>
            </View>
          </View>

          <View style={styles.payRow}>
            {PAY_METHODS.map(method => (
              <TouchableOpacity
                key={method.key}
                onPress={() => setPayMethod(method.key)}
                style={[styles.payBtn, payMethod === method.key && styles.payBtnActive]}
              >
                <Ionicons
                  name={method.icon}
                  size={16}
                  color={payMethod === method.key ? '#fff' : Colors.textSecondary}
                />
                <Text style={[styles.payLabel, payMethod === method.key && styles.payLabelActive]}>
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.createBtn, cart.length === 0 && styles.createBtnDisabled]}
            disabled={cart.length === 0}
          >
            <Text style={styles.createBtnText}>Tạo đơn {formatMoney(total)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3, flex: 1 },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  iconLabel: { ...Typography.caption, color: Colors.textSecondary },
  content: { flex: 1 },
  searchRow: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  searchInputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 44 },
  searchInput: { flex: 1, ...Typography.body },
  cartBadge: { minWidth: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', gap: 1, paddingHorizontal: 6 },
  cartBadgeText: { ...Typography.captionMd, color: Colors.primary },
  categoryList: { maxHeight: 40 },
  categoryWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  categoryChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card, flexShrink: 0 },
  categoryChipSpacing: { marginRight: 6 },
  categoryChipActive: { borderColor: Colors.text, backgroundColor: Colors.text },
  categoryText: { ...Typography.captionMd, color: Colors.text },
  categoryTextActive: { color: Colors.card },
  productList: { flex: 1 },
  productListContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.sm },
  columnWrap: { gap: Spacing.sm },
  productCol: { flex: 1 },
  productCard: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: 8, alignItems: 'center', position: 'relative', borderWidth: 1.5, borderColor: 'transparent', minHeight: 122 },
  productCardActive: { borderColor: Colors.primary },
  productThumb: { width: '100%', height: 50, borderRadius: Radius.sm, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  productThumbText: { ...Typography.h4, color: Colors.primary },
  productName: { ...Typography.label, textAlign: 'center', minHeight: 28 },
  productPrice: { ...Typography.captionMd, color: Colors.primary, marginTop: 'auto' },
  qtyBadge: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  qtyBadgeText: { ...Typography.label, color: '#fff', fontSize: 10 },
  checkoutPanel: { backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, ...Shadow.md },
  panelTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  panelTitle: { ...Typography.bodyMd },
  emptyCart: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md },
  emptyProducts: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl, gap: 6 },
  emptyText: { ...Typography.caption, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
  cartList: { maxHeight: 148 },
  cartListContent: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  cartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: Colors.border, gap: 4, backgroundColor: Colors.card },
  cartMeta: { flex: 1, paddingRight: 4 },
  cartName: { ...Typography.captionMd },
  cartUnitPrice: { ...Typography.caption, color: Colors.textSecondary },
  qtyStepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, borderRadius: 11, borderWidth: 1.5, borderColor: Colors.border },
  stepBtnText: { fontSize: 16, color: Colors.text, lineHeight: 20 },
  qtyText: { ...Typography.captionMd, paddingHorizontal: 4 },
  cartItemTotal: { ...Typography.caption, color: Colors.primary, minWidth: 64, textAlign: 'right' },
  summary: { paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, gap: 6, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumLabel: { ...Typography.caption, color: Colors.textSecondary },
  sumVal: { ...Typography.captionMd },
  discountInput: { ...Typography.captionMd, textAlign: 'right', width: 90, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 2 },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, borderStyle: 'dashed', paddingTop: 6 },
  totalLabel: { ...Typography.bodyMd },
  totalVal: { ...Typography.h4, color: Colors.primary },
  payRow: { flexDirection: 'row', paddingTop: Spacing.sm, gap: Spacing.sm },
  payBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, gap: 4 },
  payBtnActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  payLabel: { ...Typography.label, color: Colors.textSecondary },
  payLabelActive: { color: '#fff' },
  createBtn: { marginTop: Spacing.md, paddingVertical: 13, borderRadius: Radius.full, backgroundColor: Colors.primary, alignItems: 'center', ...Shadow.sm },
  createBtnDisabled: { backgroundColor: Colors.border },
  createBtnText: { ...Typography.bodyMd, color: '#fff' },
});
