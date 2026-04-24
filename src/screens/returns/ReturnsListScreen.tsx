import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { ChipRow, StatusBadge, FAB } from '../../components';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

const MOCK_RETURNS = [
  { id: 1, orderNumber: 'DH00000002', customerName: 'Trần Văn Nam', reason: 'Sản phẩm bị lỗi', refundAmount: 450000, status: 'pending', createdAt: '1 giờ trước' },
  { id: 2, orderNumber: 'DH00000004', customerName: 'Phạm Đức Minh', reason: 'Giao sai hàng', refundAmount: 320000, status: 'approved', createdAt: '3 giờ trước' },
  { id: 3, orderNumber: 'DH00000001', customerName: 'Nguyễn Thị Lan', reason: 'Không vừa size', refundAmount: 199000, status: 'rejected', createdAt: 'Hôm qua' },
];

const STATUS_CHIPS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt', count: 1 },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
];

export function ReturnsListScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [filter, setFilter] = useState('all');

  const filtered = MOCK_RETURNS.filter(r => filter === 'all' || r.status === filter);

  const stats = { pending: MOCK_RETURNS.filter(r => r.status === 'pending').length, approved: MOCK_RETURNS.filter(r => r.status === 'approved').length, rejected: MOCK_RETURNS.filter(r => r.status === 'rejected').length };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trả hàng / Hoàn tiền</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Chờ duyệt', value: stats.pending, color: Colors.warning },
          { label: 'Đã duyệt', value: stats.approved, color: Colors.success },
          { label: 'Từ chối', value: stats.rejected, color: Colors.danger },
        ].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ChipRow chips={STATUS_CHIPS} selected={filter} onSelect={setFilter} />

      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={{ paddingBottom: 80, padding: Spacing.lg, gap: 10 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.ordNum}>{item.orderNumber}</Text>
                <Text style={styles.custName}>{item.customerName}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.reason}>{item.reason}</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.refund}>Hoàn: {item.refundAmount.toLocaleString('vi-VN')}đ</Text>
              <Text style={styles.time}>{item.createdAt}</Text>
            </View>
            {item.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]}>
                  <Text style={styles.approveTxt}>✓ Duyệt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]}>
                  <Text style={styles.rejectTxt}>✗ Từ chối</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
      <FAB onPress={() => nav.navigate('ReturnCreate')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3 },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statVal: { ...Typography.h2 },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ordNum: { ...Typography.bodyMd },
  custName: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  reason: { ...Typography.body, color: Colors.text, marginTop: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  refund: { ...Typography.bodyMd, color: Colors.primary },
  time: { ...Typography.caption, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: Radius.md },
  approveBtn: { backgroundColor: Colors.successLight },
  rejectBtn: { backgroundColor: Colors.dangerLight },
  approveTxt: { ...Typography.bodyMd, color: Colors.success },
  rejectTxt: { ...Typography.bodyMd, color: Colors.danger },
});
