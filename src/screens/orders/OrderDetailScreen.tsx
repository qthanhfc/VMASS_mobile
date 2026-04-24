import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import { StatusBadge, Avatar, Card } from '../../components';
import { ManageStackParamList } from '../../navigation';

type Route = RouteProp<ManageStackParamList, 'OrderDetail'>;

const STATUS_STEPS = ['pending', 'paid', 'packing', 'shipping', 'done'];
const STEP_LABELS = ['Đặt hàng', 'Thanh toán', 'Đóng gói', 'Đang giao', 'Hoàn thành'];

const MOCK_ORDER = {
  id: 1, orderNumber: 'DH00000001', customerName: 'Nguyễn Thị Lan', customerPhone: '0901234567',
  customerAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
  status: 'packing', channel: 'shopee',
  items: [
    { productName: 'Áo thun nam basic', qty: 2, price: 199000 },
    { productName: 'Quần jean slim fit', qty: 1, price: 450000 },
  ],
  subtotal: 848000, discount: 50000, shipping: 30000, total: 828000,
  createdAt: '24/04/2026 09:41',
};

export function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute<Route>();
  const order = MOCK_ORDER;
  const stepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{order.orderNumber}</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="print-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 12, paddingBottom: 100 }}>
        {/* Status timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionLabel}>TRẠNG THÁI ĐƠN HÀNG</Text>
          <View style={styles.timeline}>
            {STATUS_STEPS.map((s, i) => (
              <View key={s} style={styles.stepWrap}>
                <View style={[styles.stepCircle, i <= stepIdx && styles.stepActive, i === stepIdx && styles.stepCurrent]}>
                  {i < stepIdx ? <Ionicons name="checkmark" size={14} color="#fff" /> :
                    <Text style={[styles.stepNum, i <= stepIdx && { color: '#fff' }]}>{i + 1}</Text>}
                </View>
                {i < STATUS_STEPS.length - 1 && (
                  <View style={[styles.stepLine, i < stepIdx && styles.stepLineActive]} />
                )}
                <Text style={[styles.stepLabel, i <= stepIdx && { color: Colors.primary }]} numberOfLines={1}>
                  {STEP_LABELS[i]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Customer */}
        <Card padding={14}>
          <Text style={styles.sectionLabel}>KHÁCH HÀNG</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 }}>
            <Avatar name={order.customerName} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={Typography.h4}>{order.customerName}</Text>
              <Text style={{ ...Typography.body, color: Colors.textSecondary }}>{order.customerPhone}</Text>
              <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginTop: 2 }}>{order.customerAddress}</Text>
            </View>
          </View>
        </Card>

        {/* Items */}
        <Card padding={14}>
          <Text style={styles.sectionLabel}>SẢN PHẨM</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemThumb}><Text style={styles.itemThumbText}>{item.productName[0]}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>x{item.qty} × {item.price.toLocaleString('vi-VN')}đ</Text>
              </View>
              <Text style={styles.itemTotal}>{(item.qty * item.price).toLocaleString('vi-VN')}đ</Text>
            </View>
          ))}
        </Card>

        {/* Summary */}
        <Card padding={14}>
          <Text style={styles.sectionLabel}>TỔNG KẾT</Text>
          <View style={{ gap: 8, marginTop: 8 }}>
            {[
              { label: 'Tạm tính', value: order.subtotal },
              { label: 'Giảm giá', value: -order.discount, color: Colors.success },
              { label: 'Phí vận chuyển', value: order.shipping },
            ].map(r => (
              <View key={r.label} style={styles.sumRow}>
                <Text style={{ ...Typography.body, color: Colors.textSecondary }}>{r.label}</Text>
                <Text style={{ ...Typography.bodyMd, color: r.color || Colors.text }}>
                  {r.value < 0 ? '-' : ''}{Math.abs(r.value).toLocaleString('vi-VN')}đ
                </Text>
              </View>
            ))}
            <View style={[styles.sumRow, styles.totalRow]}>
              <Text style={{ ...Typography.h4 }}>Tổng cộng</Text>
              <Text style={{ ...Typography.h3, color: Colors.primary }}>{order.total.toLocaleString('vi-VN')}đ</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Action buttons */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 8 }]}>
        {order.status === 'pending' && (
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>✓ Xác nhận đơn</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionBtn, styles.printBtn]}>
          <Ionicons name="print-outline" size={18} color={Colors.primary} />
          <Text style={[styles.actionBtnText, { color: Colors.primary }]}>In hóa đơn</Text>
        </TouchableOpacity>
        {order.status !== 'done' && order.status !== 'cancelled' && (
          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]}>
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Hủy đơn</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h4, flex: 1 },
  iconBtn: { padding: 4 },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, letterSpacing: 0.6 },
  timelineCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, ...Shadow.sm },
  timeline: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 },
  stepWrap: { flex: 1, alignItems: 'center' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  stepActive: { backgroundColor: Colors.primary },
  stepCurrent: { borderWidth: 2, borderColor: Colors.primaryDark },
  stepNum: { ...Typography.captionMd, color: Colors.textSecondary },
  stepLine: { position: 'absolute', top: 14, left: '50%', width: '100%', height: 2, backgroundColor: Colors.border },
  stepLineActive: { backgroundColor: Colors.primary },
  stepLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  itemThumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  itemThumbText: { ...Typography.h4, color: Colors.primary },
  itemName: { ...Typography.bodyMd },
  itemTotal: { ...Typography.bodyMd, color: Colors.primary },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: Radius.lg, backgroundColor: Colors.primary },
  actionBtnText: { ...Typography.bodyMd, color: '#fff' },
  printBtn: { backgroundColor: Colors.primaryLight },
  cancelBtn: { backgroundColor: Colors.dangerLight },
});
