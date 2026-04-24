import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import { ChipRow, Card, SectionHeader, FAB } from '../../components';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

const PERIOD_CHIPS = [{ key: 'month', label: 'Tháng này' }, { key: 'quarter', label: 'Quý này' }, { key: 'year', label: 'Năm nay' }];

const LEDGERS = [
  { key: 'sales', label: 'Sổ bán hàng', icon: 'cart-outline', count: 124, color: Colors.primary },
  { key: 'purchase', label: 'Sổ mua hàng', icon: 'bag-handle-outline', count: 38, color: '#7c3aed' },
  { key: 'cash', label: 'Sổ tiền mặt', icon: 'cash-outline', count: 67, color: Colors.success },
  { key: 'bank', label: 'Sổ ngân hàng', icon: 'card-outline', count: 45, color: '#0891b2' },
  { key: 'tax', label: 'Tờ khai thuế', icon: 'document-text-outline', count: 4, color: Colors.warning },
  { key: 'invoice', label: 'Hóa đơn ĐT', icon: 'receipt-outline', count: 89, color: Colors.accent },
];

const RECENT = [
  { id: 1, type: 'income', desc: 'Bán hàng tại quầy', amount: 1250000, date: '24/04', cat: 'Doanh thu' },
  { id: 2, type: 'expense', desc: 'Nhập hàng từ NCC', amount: 3400000, date: '23/04', cat: 'Nhập hàng' },
  { id: 3, type: 'income', desc: 'Shopee — đơn #DH002', amount: 890000, date: '23/04', cat: 'Doanh thu' },
  { id: 4, type: 'expense', desc: 'Lương nhân viên', amount: 15000000, date: '22/04', cat: 'Lương' },
  { id: 5, type: 'income', desc: 'Lazada — đơn #DH003', amount: 450000, date: '22/04', cat: 'Doanh thu' },
];

export function BookkeepingScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [period, setPeriod] = useState('month');

  const income = 48250000, expense = 24800000, profit = income - expense;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sổ sách kế toán</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="download-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 14, paddingBottom: 80 }}>
        <ChipRow chips={PERIOD_CHIPS} selected={period} onSelect={setPeriod} />

        {/* P&L hero */}
        <View style={styles.plCard}>
          <Text style={styles.plTitle}>Kết quả kinh doanh</Text>
          <View style={styles.plRow}>
            <View style={styles.plStat}>
              <Text style={styles.plLabel}>Doanh thu</Text>
              <Text style={styles.plVal}>{(income / 1000000).toFixed(1)}M</Text>
            </View>
            <View style={styles.plDivider} />
            <View style={styles.plStat}>
              <Text style={styles.plLabel}>Chi phí</Text>
              <Text style={[styles.plVal, { color: 'rgba(255,255,255,0.8)' }]}>{(expense / 1000000).toFixed(1)}M</Text>
            </View>
            <View style={styles.plDivider} />
            <View style={styles.plStat}>
              <Text style={styles.plLabel}>Lợi nhuận</Text>
              <Text style={[styles.plVal, { fontSize: 22 }]}>{(profit / 1000000).toFixed(1)}M</Text>
            </View>
          </View>
        </View>

        {/* Ledger grid */}
        <Text style={styles.sectionTitle}>SỔ KẾ TOÁN</Text>
        <View style={styles.ledgerGrid}>
          {LEDGERS.map(l => (
            <TouchableOpacity key={l.key} style={styles.ledgerCard}>
              <View style={[styles.ledgerIcon, { backgroundColor: l.color + '22' }]}>
                <Ionicons name={l.icon as any} size={22} color={l.color} />
              </View>
              <Text style={styles.ledgerLabel}>{l.label}</Text>
              <Text style={styles.ledgerCount}>{l.count} mục</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent entries */}
        <SectionHeader title="GHI CHÉP GẦN ĐÂY" action="Xem tất cả" />
        <Card padding={0}>
          {RECENT.map((e, i) => (
            <View key={e.id} style={[styles.entryRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
              <View style={[styles.entryDot, { backgroundColor: e.type === 'income' ? Colors.successLight : Colors.dangerLight }]}>
                <Ionicons name={e.type === 'income' ? 'trending-up' : 'trending-down'} size={14} color={e.type === 'income' ? Colors.success : Colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryDesc}>{e.desc}</Text>
                <Text style={styles.entryCat}>{e.cat} · {e.date}</Text>
              </View>
              <Text style={[styles.entryAmt, { color: e.type === 'income' ? Colors.success : Colors.danger }]}>
                {e.type === 'income' ? '+' : '-'}{e.amount.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>
      <FAB onPress={() => nav.navigate('BookkeepingEntry')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3, flex: 1 },
  iconBtn: { padding: 4 },
  plCard: { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: 16 },
  plTitle: { ...Typography.captionMd, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  plRow: { flexDirection: 'row' },
  plStat: { flex: 1, alignItems: 'center' },
  plLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  plVal: { ...Typography.h3, color: '#fff', marginTop: 4 },
  plDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary, letterSpacing: 0.6 },
  ledgerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ledgerCard: { width: '30.5%', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 12, alignItems: 'center', ...Shadow.sm },
  ledgerIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ledgerLabel: { ...Typography.captionMd, textAlign: 'center' },
  ledgerCount: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  entryRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  entryDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  entryDesc: { ...Typography.bodyMd },
  entryCat: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  entryAmt: { ...Typography.bodyMd },
});
