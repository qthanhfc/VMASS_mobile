import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { ChipRow, StatusBadge, ProgressBar, FAB } from '../../components';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

const MOCK_PROMOTIONS = [
  { id: 1, name: 'Giảm 10% cuối tuần', type: 'percent', value: 10, code: 'WEEKEND10', usageLimit: 200, usageCount: 127, startDate: '20/04', endDate: '30/04', status: 'active' },
  { id: 2, name: 'Giảm 50k đơn từ 500k', type: 'flat', value: 50000, code: 'SAVE50', usageLimit: 100, usageCount: 43, startDate: '01/04', endDate: '30/04', status: 'active' },
  { id: 3, name: 'Tháng 5 - Mua 2 tặng 1', type: 'bogo', value: 0, code: null, usageLimit: 0, usageCount: 0, startDate: '01/05', endDate: '31/05', status: 'scheduled' },
  { id: 4, name: 'Khai trương tháng 3', type: 'percent', value: 20, code: 'GRAND20', usageLimit: 500, usageCount: 487, startDate: '01/03', endDate: '31/03', status: 'ended' },
];

const STATUS_CHIPS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang chạy' },
  { key: 'scheduled', label: 'Lên lịch' },
  { key: 'ended', label: 'Kết thúc' },
];

function discountLabel(p: typeof MOCK_PROMOTIONS[0]) {
  if (p.type === 'percent') return `Giảm ${p.value}%`;
  if (p.type === 'flat') return `Giảm ${(p.value / 1000).toFixed(0)}k đ`;
  if (p.type === 'bogo') return 'Mua 2 tặng 1';
  return 'Combo';
}

export function PromotionsListScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [filter, setFilter] = useState('all');

  const filtered = MOCK_PROMOTIONS.filter(p => filter === 'all' || p.status === filter);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Khuyến mãi</Text>
        <TouchableOpacity onPress={() => nav.navigate('PromotionEdit', {})} style={styles.iconBtn}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ChipRow chips={STATUS_CHIPS} selected={filter} onSelect={setFilter} />

      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={{ padding: Spacing.lg, gap: 10, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => nav.navigate('PromotionEdit', { id: item.id })}>
            <View style={styles.cardTop}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountLabel}>{discountLabel(item)}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.promoName}>{item.name}</Text>
            {item.code && <Text style={styles.promoCode}>Mã: {item.code}</Text>}
            {item.usageLimit > 0 && (
              <View style={{ marginTop: 8 }}>
                <View style={styles.usageRow}>
                  <Text style={styles.usageText}>{item.usageCount}/{item.usageLimit} lượt dùng</Text>
                  <Text style={styles.usageText}>{Math.round(item.usageCount / item.usageLimit * 100)}%</Text>
                </View>
                <ProgressBar progress={item.usageCount / item.usageLimit} height={5} />
              </View>
            )}
            <Text style={styles.dateRange}>{item.startDate} → {item.endDate}</Text>
          </TouchableOpacity>
        )}
      />
      <FAB onPress={() => nav.navigate('PromotionEdit', {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3, flex: 1 },
  iconBtn: { padding: 4 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  discountBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.primaryLight },
  discountLabel: { ...Typography.bodyMd, color: Colors.primary },
  promoName: { ...Typography.h4, marginTop: 8 },
  promoCode: { ...Typography.captionMd, color: Colors.textSecondary, marginTop: 3 },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  usageText: { ...Typography.caption, color: Colors.textSecondary },
  dateRange: { ...Typography.caption, color: Colors.textSecondary, marginTop: 8 },
});
