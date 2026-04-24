import React, { useState } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';

const PRODUCTS = [
  { id: 1, name: 'Áo thun nam basic', price: 199000, sku: 'AT001' },
  { id: 2, name: 'Quần jean slim fit', price: 450000, sku: 'QJ002' },
  { id: 3, name: 'Giày thể thao', price: 890000, sku: 'GT003' },
  { id: 4, name: 'Cà phê hòa tan', price: 85000, sku: 'CF004' },
  { id: 5, name: 'Bánh quy xốp', price: 35000, sku: 'BQ005' },
  { id: 6, name: 'Nước hoa hồng', price: 320000, sku: 'NH006' },
];

interface CartItem { id: number; name: string; price: number; qty: number; }

export function PosScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bán POS nhanh</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="person-outline" size={22} color={Colors.text} />
          <Text style={styles.iconLabel}>Chọn KH</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Product grid */}
        <View style={styles.productSection}>
          <FlatList
            data={PRODUCTS}
            numColumns={2}
            keyExtractor={i => String(i.id)}
            columnWrapperStyle={{ gap: 8 }}
            contentContainerStyle={{ gap: 8, padding: Spacing.lg }}
            renderItem={({ item }) => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <TouchableOpacity style={[styles.productCard, inCart && styles.productCardActive]} onPress={() => addToCart(item)}>
                  <View style={styles.productThumb}>
                    <Text style={styles.productThumbText}>{item.name[0]}</Text>
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.productPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                  {inCart && <View style={styles.qtyBadge}><Text style={styles.qtyBadgeText}>{inCart.qty}</Text></View>}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Cart & payment */}
        <View style={styles.cartSection}>
          {/* Cart items */}
          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={36} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>Chưa có sản phẩm</Text>
            </View>
          ) : (
            <ScrollView style={styles.cartList}>
              {cart.map(item => (
                <View key={item.id} style={styles.cartRow}>
                  <Text style={styles.cartName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.qtyStepper}>
                    <TouchableOpacity onPress={() => adjustQty(item.id, -1)} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity onPress={() => adjustQty(item.id, 1)} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemTotal}>{(item.price * item.qty).toLocaleString('vi-VN')}đ</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.sumRow}><Text style={styles.sumLabel}>Tạm tính</Text><Text style={styles.sumVal}>{subtotal.toLocaleString('vi-VN')}đ</Text></View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Giảm giá</Text>
              <TextInput style={styles.discountInput} value={discount} onChangeText={setDiscount} placeholder="0đ" keyboardType="numeric" />
            </View>
            <View style={[styles.sumRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalVal}>{total.toLocaleString('vi-VN')}đ</Text>
            </View>
          </View>

          {/* Payment method */}
          <View style={styles.payRow}>
            {[{ key: 'cash', label: '💵 Tiền mặt' }, { key: 'transfer', label: '🏦 CK' }, { key: 'card', label: '💳 Thẻ' }].map(m => (
              <TouchableOpacity key={m.key} onPress={() => setPayMethod(m.key)}
                style={[styles.payBtn, payMethod === m.key && styles.payBtnActive]}>
                <Text style={[styles.payLabel, payMethod === m.key && { color: '#fff' }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.createBtn, cart.length === 0 && styles.createBtnDisabled]} disabled={cart.length === 0}>
            <Text style={styles.createBtnText}>Tạo đơn — {total.toLocaleString('vi-VN')}đ</Text>
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
  content: { flex: 1, flexDirection: 'row' },
  productSection: { flex: 1 },
  productCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 10, alignItems: 'center', position: 'relative', borderWidth: 1.5, borderColor: 'transparent' },
  productCardActive: { borderColor: Colors.primary },
  productThumb: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  productThumbText: { ...Typography.h4, color: Colors.primary },
  productName: { ...Typography.caption, textAlign: 'center' },
  productPrice: { ...Typography.captionMd, color: Colors.primary, marginTop: 2 },
  qtyBadge: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  qtyBadgeText: { ...Typography.label, color: '#fff', fontSize: 10 },
  cartSection: { width: 200, backgroundColor: Colors.card, borderLeftWidth: 1, borderLeftColor: Colors.border },
  emptyCart: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  emptyText: { ...Typography.caption, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
  cartList: { flex: 1 },
  cartRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 4 },
  cartName: { flex: 1, ...Typography.caption },
  qtyStepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, borderRadius: 11 },
  stepBtnText: { fontSize: 16, color: Colors.text, lineHeight: 20 },
  qtyText: { ...Typography.captionMd, paddingHorizontal: 4 },
  cartItemTotal: { ...Typography.caption, color: Colors.primary, minWidth: 50, textAlign: 'right' },
  summary: { padding: 10, borderTopWidth: 1, borderTopColor: Colors.border, gap: 6 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumLabel: { ...Typography.caption, color: Colors.textSecondary },
  sumVal: { ...Typography.captionMd },
  discountInput: { ...Typography.captionMd, textAlign: 'right', width: 70, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 2 },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 6 },
  totalLabel: { ...Typography.bodyMd },
  totalVal: { ...Typography.h4, color: Colors.primary },
  payRow: { flexDirection: 'row', padding: 8, gap: 4 },
  payBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  payBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  payLabel: { ...Typography.label, color: Colors.textSecondary },
  createBtn: { margin: 8, paddingVertical: 12, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: 'center', ...Shadow.sm },
  createBtnDisabled: { backgroundColor: Colors.border },
  createBtnText: { ...Typography.bodyMd, color: '#fff' },
});
