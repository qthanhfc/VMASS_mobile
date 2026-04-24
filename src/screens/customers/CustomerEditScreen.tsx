import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import {
  Header,
  FormField,
  SectionHeader,
  Card,
  Avatar,
  StatusBadge,
} from '../../components';
import { Customer, Order } from '../../types';

type RouteParams = {
  CustomerEdit: { id?: number };
};

const MOCK_CUSTOMERS: Record<number, Customer> = {
  1: { id: 1, name: 'Nguyễn Thị Lan', phone: '0901234567', email: 'lan@gmail.com', address: '123 Nguyễn Huệ, Q1, TP.HCM', totalSpent: 12500000, orderCount: 18, points: 1250, tier: 'VIP', notes: 'Khách VIP, thích sản phẩm cao cấp', createdAt: '2023-06-15' },
  2: { id: 2, name: 'Trần Văn Minh', phone: '0912345678', email: 'minh@gmail.com', totalSpent: 7200000, orderCount: 11, points: 720, tier: 'Gold', createdAt: '2023-08-20' },
};

const MOCK_ORDERS: Order[] = [
  { id: 101, orderNumber: 'ORD-1001', customerId: 1, customerName: 'Nguyễn Thị Lan', status: 'done', channel: 'pos', items: [], subtotal: 1500000, discount: 0, shipping: 0, total: 1500000, createdAt: '2024-03-15' },
  { id: 102, orderNumber: 'ORD-1002', customerId: 1, customerName: 'Nguyễn Thị Lan', status: 'shipping', channel: 'shopee', items: [], subtotal: 890000, discount: 50000, shipping: 30000, total: 870000, createdAt: '2024-03-22' },
  { id: 103, orderNumber: 'ORD-0980', customerId: 1, customerName: 'Nguyễn Thị Lan', status: 'done', channel: 'pos', items: [], subtotal: 2100000, discount: 100000, shipping: 0, total: 2000000, createdAt: '2024-02-10' },
];

const TIERS: Customer['tier'][] = ['VIP', 'Gold', 'Silver', 'Normal'];

function tierColor(tier: Customer['tier']): string {
  switch (tier) {
    case 'VIP': return Colors.danger;
    case 'Gold': return '#f59e0b';
    case 'Silver': return '#6b7280';
    default: return Colors.textSecondary;
  }
}

function tierBg(tier: Customer['tier']): string {
  switch (tier) {
    case 'VIP': return Colors.dangerLight;
    case 'Gold': return '#fef3c7';
    case 'Silver': return '#f3f4f6';
    default: return Colors.border;
  }
}

function channelLabel(ch: string): string {
  const map: Record<string, string> = {
    pos: '🏪 POS', shopee: '🛒 Shopee', lazada: '📦 Lazada',
    tiktok: '🎵 TikTok', tiki: '🔵 Tiki', website: '🌐 Web',
  };
  return map[ch] || ch;
}

function relativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 30) return `${diffDays} ngày trước`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)} tháng trước`;
  return `${Math.round(diffDays / 365)} năm trước`;
}

export function CustomerEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'CustomerEdit'>>();
  const editId = route.params?.id;
  const existing = editId ? MOCK_CUSTOMERS[editId] : null;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [tier, setTier] = useState<Customer['tier']>(existing?.tier ?? 'Normal');
  const [points, setPoints] = useState(String(existing?.points ?? '0'));
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const customerOrders = isEdit ? MOCK_ORDERS.filter(o => o.customerId === editId).slice(0, 3) : [];

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên khách hàng');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }
    Alert.alert('Thành công', isEdit ? 'Đã cập nhật khách hàng' : 'Đã thêm khách hàng mới', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Xóa khách hàng', `Bạn có chắc muốn xóa khách hàng "${name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.screen}>
      <Header
        title={isEdit ? 'Chỉnh sửa KH' : 'Khách hàng'}
        onBack={() => navigation.goBack()}
        rightActions={
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Lưu</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero info card */}
        {isEdit && existing && (
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <Avatar name={existing.name} size={56} />
              <View style={styles.heroInfo}>
                <View style={styles.heroNameRow}>
                  <Text style={styles.heroName}>{existing.name}</Text>
                  <View style={[styles.tierBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                    <Text style={styles.tierText}>{existing.tier}</Text>
                  </View>
                </View>
                <Text style={styles.heroPhone}>{existing.phone}</Text>
              </View>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{existing.totalSpent.toLocaleString('vi-VN')} đ</Text>
                <Text style={styles.heroStatLabel}>Tổng chi tiêu</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{existing.orderCount}</Text>
                <Text style={styles.heroStatLabel}>Đơn hàng</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <View style={styles.pointsRow}>
                  <Ionicons name="star" size={13} color="#fcd34d" />
                  <Text style={styles.heroStatValue}>{existing.points.toLocaleString('vi-VN')}</Text>
                </View>
                <Text style={styles.heroStatLabel}>Điểm tích lũy</Text>
              </View>
            </View>
          </View>
        )}

        {/* Form fields */}
        <SectionHeader title="Thông tin cá nhân" />
        <Card style={styles.sectionCard}>
          <FormField
            label="Tên khách hàng *"
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên đầy đủ"
          />
          <FormField
            label="Số điện thoại *"
            value={phone}
            onChangeText={setPhone}
            placeholder="09xxxxxxxx"
            keyboardType="phone-pad"
          />
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label="Địa chỉ"
            value={address}
            onChangeText={setAddress}
            placeholder="Địa chỉ giao hàng"
            multiline
            numberOfLines={2}
          />
        </Card>

        {/* Tier selector */}
        <SectionHeader title="Hạng khách hàng" />
        <Card style={styles.sectionCard}>
          <View style={styles.tierRow}>
            {TIERS.map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setTier(t)}
                style={[
                  styles.tierChip,
                  { borderColor: tierColor(t) },
                  tier === t && { backgroundColor: tierBg(t) },
                ]}>
                <Text style={[styles.tierChipText, { color: tier === t ? tierColor(t) : Colors.textSecondary }]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Points */}
        <SectionHeader title="Điểm tích lũy" />
        <Card style={styles.sectionCard}>
          <View style={styles.pointsEditRow}>
            <View style={styles.pointsCurrent}>
              <Ionicons name="star" size={18} color={Colors.warning} />
              <Text style={styles.pointsCurrentText}>
                Hiện tại: {(existing?.points ?? 0).toLocaleString('vi-VN')} điểm
              </Text>
            </View>
            <FormField
              label="Điều chỉnh điểm"
              value={points}
              onChangeText={setPoints}
              placeholder="0"
              keyboardType="numeric"
              hint="Nhập số điểm mới để thay thế"
            />
          </View>
        </Card>

        {/* Notes */}
        <SectionHeader title="Ghi chú" />
        <Card style={styles.sectionCard}>
          <Text style={styles.notesLabel}>Ghi chú nội bộ</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Nhập ghi chú về khách hàng..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        {/* Purchase history */}
        {isEdit && customerOrders.length > 0 && (
          <>
            <SectionHeader title="Lịch sử mua hàng" action="Xem tất cả" />
            <Card style={styles.sectionCard} padding={0}>
              {customerOrders.map((order, idx) => (
                <TouchableOpacity
                  key={order.id}
                  style={[styles.orderRow, idx < customerOrders.length - 1 && styles.orderRowBorder]}
                  onPress={() => navigation.navigate('OrderDetail', { id: order.id })}
                >
                  <View style={styles.orderLeft}>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <Text style={styles.orderMeta}>
                      {channelLabel(order.channel)} · {relativeDate(order.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderTotal}>{order.total.toLocaleString('vi-VN')} đ</Text>
                    <StatusBadge status={order.status} />
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          </>
        )}

        {/* Danger zone */}
        {isEdit && (
          <>
            <SectionHeader title="Vùng nguy hiểm" />
            <Card style={styles.dangerCard}>
              <View style={styles.dangerRow}>
                <View style={styles.dangerInfo}>
                  <Text style={styles.dangerTitle}>Xóa khách hàng</Text>
                  <Text style={styles.dangerDesc}>Toàn bộ dữ liệu sẽ bị xóa vĩnh viễn</Text>
                </View>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                  <Text style={styles.deleteBtnText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </>
        )}

        {/* Bottom save */}
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleSave} style={styles.bottomSaveBtn}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.bottomSaveBtnText}>{isEdit ? 'Cập nhật khách hàng' : 'Thêm khách hàng'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  saveBtnText: {
    ...Typography.bodyMd,
    color: '#fff',
  },
  heroCard: {
    backgroundColor: Colors.primary,
    margin: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroName: {
    ...Typography.h4,
    color: '#fff',
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  tierText: {
    ...Typography.label,
    color: '#fff',
  },
  heroPhone: {
    ...Typography.bodySm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  heroStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: Spacing.md,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    ...Typography.bodyMd,
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  heroStatLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    textAlign: 'center',
  },
  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: Spacing.xs,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  tierRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tierChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tierChipText: {
    ...Typography.bodyMd,
  },
  pointsEditRow: {
    gap: Spacing.sm,
  },
  pointsCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  pointsCurrentText: {
    ...Typography.bodyMd,
    color: Colors.warning,
  },
  notesLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  notesInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 90,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  orderRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderLeft: {
    flex: 1,
  },
  orderNumber: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  orderMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderTotal: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '700',
  },
  dangerCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dangerInfo: {
    flex: 1,
  },
  dangerTitle: {
    ...Typography.bodyMd,
    color: Colors.danger,
  },
  dangerDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },
  deleteBtnText: {
    ...Typography.bodyMd,
    color: Colors.danger,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  bottomSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    ...Shadow.md,
  },
  bottomSaveBtnText: {
    ...Typography.h4,
    color: '#fff',
  },
});
