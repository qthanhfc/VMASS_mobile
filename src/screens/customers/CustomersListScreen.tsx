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
import { Header, SearchBar, ChipRow, FAB, Avatar, StatusBadge } from '../../components';
import { Customer } from '../../types';

const MOCK_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Nguyễn Thị Lan', phone: '0901234567', email: 'lan@gmail.com', address: '123 Nguyễn Huệ, Q1, TP.HCM', totalSpent: 12500000, orderCount: 18, points: 1250, tier: 'VIP', createdAt: '2023-06-15' },
  { id: 2, name: 'Trần Văn Minh', phone: '0912345678', email: 'minh@gmail.com', address: '45 Lê Lợi, Q3, TP.HCM', totalSpent: 7200000, orderCount: 11, points: 720, tier: 'Gold', createdAt: '2023-08-20' },
  { id: 3, name: 'Lê Thị Hoa', phone: '0923456789', totalSpent: 3400000, orderCount: 6, points: 340, tier: 'Silver', createdAt: '2023-10-05' },
  { id: 4, name: 'Phạm Quốc Bảo', phone: '0934567890', email: 'bao@gmail.com', totalSpent: 890000, orderCount: 3, points: 89, tier: 'Normal', createdAt: '2024-01-10' },
  { id: 5, name: 'Võ Thị Thanh', phone: '0945678901', address: '78 Trần Hưng Đạo, Q5, TP.HCM', totalSpent: 15600000, orderCount: 24, points: 1560, tier: 'VIP', createdAt: '2023-04-01' },
  { id: 6, name: 'Đặng Minh Tuấn', phone: '0956789012', email: 'tuan@gmail.com', totalSpent: 4100000, orderCount: 8, points: 410, tier: 'Gold', createdAt: '2023-12-18' },
  { id: 7, name: 'Hoàng Thị Mai', phone: '0967890123', totalSpent: 2200000, orderCount: 5, points: 220, tier: 'Silver', createdAt: '2024-02-14' },
  { id: 8, name: 'Bùi Văn Khoa', phone: '0978901234', totalSpent: 450000, orderCount: 2, points: 45, tier: 'Normal', createdAt: '2024-03-22' },
];

const TIER_CHIPS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'VIP', label: '🔴 VIP' },
  { key: 'Gold', label: '🟡 Gold' },
  { key: 'Silver', label: '⚪ Silver' },
  { key: 'Normal', label: 'Thường' },
];

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

export function CustomersListScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('all');

  const filtered = MOCK_CUSTOMERS.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
      || c.phone.includes(search);
    const matchTier = tier === 'all' || c.tier === tier;
    return matchSearch && matchTier;
  });

  const totalSpent = MOCK_CUSTOMERS.reduce((s, c) => s + c.totalSpent, 0);
  const avgSpent = MOCK_CUSTOMERS.length ? Math.round(totalSpent / MOCK_CUSTOMERS.length) : 0;
  const newThisMonth = MOCK_CUSTOMERS.filter(c => c.createdAt >= '2024-03-01').length;

  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.customerRow}
      onPress={() => navigation.navigate('CustomerEdit', { id: item.id })}
      activeOpacity={0.75}
    >
      <Avatar name={item.name} size={46} />
      <View style={styles.customerInfo}>
        <View style={styles.customerNameRow}>
          <Text style={styles.customerName}>{item.name}</Text>
          <View style={[styles.tierBadge, { backgroundColor: tierBg(item.tier) }]}>
            <Text style={[styles.tierText, { color: tierColor(item.tier) }]}>{item.tier}</Text>
          </View>
        </View>
        <Text style={styles.customerPhone}>{item.phone}</Text>
        <View style={styles.customerStats}>
          <Text style={styles.spentText}>{item.totalSpent.toLocaleString('vi-VN')} đ</Text>
          <Text style={styles.orderCountText}> · {item.orderCount} đơn</Text>
        </View>
      </View>
      <View style={styles.pointsBadge}>
        <Ionicons name="star" size={10} color={Colors.warning} />
        <Text style={styles.pointsText}>{item.points.toLocaleString('vi-VN')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <Header
        title="Khách hàng"
        rightActions={
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="filter-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        }
      />

      {/* Stats hero card */}
      <View style={styles.heroCard}>
        <View style={styles.heroStat}>
          <Text style={styles.heroValue}>{totalSpent.toLocaleString('vi-VN')} đ</Text>
          <Text style={styles.heroLabel}>Tổng chi tiêu</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroStat}>
          <Text style={styles.heroValue}>{avgSpent.toLocaleString('vi-VN')} đ</Text>
          <Text style={styles.heroLabel}>TB/khách</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroStat}>
          <Text style={styles.heroValue}>{newThisMonth}</Text>
          <Text style={styles.heroLabel}>Khách mới tháng</Text>
        </View>
      </View>

      <ChipRow chips={TIER_CHIPS} selected={tier} onSelect={setTier} />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm tên, số điện thoại..."
      />

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={renderCustomer}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Không tìm thấy khách hàng</Text>
          </View>
        }
      />

      <FAB onPress={() => navigation.navigate('CustomerEdit')} />
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
  heroCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroValue: {
    ...Typography.h4,
    color: '#fff',
    fontSize: 15,
  },
  heroLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    textAlign: 'center',
  },
  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: Spacing.sm,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
    paddingTop: Spacing.xs,
  },
  separator: {
    height: 8,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  customerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  tierText: {
    ...Typography.label,
    fontSize: 10,
  },
  customerPhone: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  customerStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  spentText: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '600',
  },
  orderCountText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pointsText: {
    ...Typography.captionMd,
    color: Colors.warning,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
