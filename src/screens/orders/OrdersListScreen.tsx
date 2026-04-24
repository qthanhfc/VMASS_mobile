import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import { ChipRow, SearchBar, StatusBadge, FAB } from '../../components';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

const CHANNELS: Record<string, string> = {
  pos: '🏪', shopee: '🛒', lazada: '🔵', tiktok: '🎵', tiki: '🔷', website: '🌐',
};

const STATUS_CHIPS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xử lý', count: 4 },
  { key: 'paid', label: 'Đã TT', count: 7 },
  { key: 'packing', label: 'Đóng gói', count: 3 },
  { key: 'shipping', label: 'Đang giao', count: 5 },
  { key: 'done', label: 'Xong' },
  { key: 'cancelled', label: 'Đã hủy' },
];

const MOCK_ORDERS = [
  { id: 1, orderNumber: 'DH00000001', customerName: 'Nguyễn Thị Lan', total: 650000, status: 'pending', channel: 'pos', createdAt: '2 phút trước' },
  { id: 2, orderNumber: 'DH00000002', customerName: 'Trần Văn Nam', total: 1250000, status: 'paid', channel: 'shopee', createdAt: '15 phút trước' },
  { id: 3, orderNumber: 'DH00000003', customerName: 'Lê Thu Hương', total: 320000, status: 'packing', channel: 'pos', createdAt: '1 giờ trước' },
  { id: 4, orderNumber: 'DH00000004', customerName: 'Phạm Đức Minh', total: 890000, status: 'shipping', channel: 'lazada', createdAt: '2 giờ trước' },
  { id: 5, orderNumber: 'DH00000005', customerName: 'Hoàng Thị Mai', total: 450000, status: 'done', channel: 'tiktok', createdAt: '3 giờ trước' },
  { id: 6, orderNumber: 'DH00000006', customerName: 'Vũ Thành Long', total: 1800000, status: 'pending', channel: 'shopee', createdAt: '4 giờ trước' },
  { id: 7, orderNumber: 'DH00000007', customerName: 'Đặng Văn Hùng', total: 235000, status: 'cancelled', channel: 'pos', createdAt: 'Hôm qua' },
];

export function OrdersListScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');

  const filtered = MOCK_ORDERS.filter(o =>
    (statusFilter === 'all' || o.status === statusFilter) &&
    (channelFilter === 'all' || o.channel === channelFilter) &&
    (!search || o.orderNumber.includes(search) || o.customerName.toLowerCase().includes(search.toLowerCase()))
  );

  const todayRevenue = MOCK_ORDERS.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="filter-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="refresh-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Hôm nay', value: (todayRevenue / 1000000).toFixed(1) + 'M', color: Colors.primary },
          { label: 'Chờ xử lý', value: '4', color: Colors.warning },
          { label: 'Đóng gói', value: '3', color: Colors.primary },
          { label: 'Đang giao', value: '5', color: Colors.success },
        ].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Tìm đơn hàng..." />
      <ChipRow chips={STATUS_CHIPS} selected={statusFilter} onSelect={setStatusFilter} />

      {/* Channel filter */}
      <View style={styles.channelRow}>
        {['all', 'pos', 'shopee', 'lazada', 'tiktok', 'tiki'].map(ch => (
          <TouchableOpacity key={ch} onPress={() => setChannelFilter(ch)}
            style={[styles.channelChip, channelFilter === ch && styles.channelChipActive]}>
            <Text style={[styles.channelLabel, channelFilter === ch && { color: '#fff' }]}>
              {ch === 'all' ? 'Tất cả' : CHANNELS[ch] + ' ' + ch.charAt(0).toUpperCase() + ch.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.orderRow} onPress={() => nav.navigate('OrderDetail', { id: item.id })}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.orderNum}>{CHANNELS[item.channel]} {item.orderNumber}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.customerName}>{item.customerName}</Text>
              <Text style={styles.orderTime}>{item.createdAt}</Text>
            </View>
            <Text style={styles.orderTotal}>{item.total.toLocaleString('vi-VN')}đ</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
      />
      <FAB onPress={() => {}} icon="add" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3, flex: 1 },
  iconBtn: { padding: 4 },
  statsRow: { flexDirection: 'row', gap: 8, padding: Spacing.lg, backgroundColor: Colors.card },
  statCard: { flex: 1, alignItems: 'center', padding: 8, borderRadius: Radius.md, backgroundColor: Colors.background },
  statVal: { ...Typography.h3, fontSize: 18 },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  channelRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: 6, flexWrap: 'wrap' },
  channelChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  channelChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  channelLabel: { ...Typography.caption, color: Colors.textSecondary },
  orderRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.card },
  orderNum: { ...Typography.bodyMd, color: Colors.text },
  customerName: { ...Typography.body, color: Colors.textSecondary, marginTop: 2 },
  orderTime: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  orderTotal: { ...Typography.h4, color: Colors.primary },
});
