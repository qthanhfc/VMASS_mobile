import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import { Card, StatusBadge } from '../../components';

const HISTORY = [
  { id: 1, period: 'Q4/2025', type: 'GTGT', amount: 2400000, dueDate: '31/01/2026', status: 'pending' },
  { id: 2, period: 'Q4/2025', type: 'TNCN', amount: 800000, dueDate: '31/01/2026', status: 'pending' },
  { id: 3, period: 'Q3/2025', type: 'GTGT', amount: 1850000, dueDate: '31/10/2025', status: 'done' },
  { id: 4, period: 'Q3/2025', type: 'TNCN', amount: 620000, dueDate: '31/10/2025', status: 'done' },
  { id: 5, period: 'Q2/2025', type: 'GTGT', amount: 2100000, dueDate: '31/07/2025', status: 'done' },
];

export function TaxScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kê khai thuế</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 14, paddingBottom: 40 }}>
        {/* Alert card */}
        <View style={styles.alertCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="warning" size={20} color={Colors.warning} />
            <Text style={styles.alertTitle}>Q4/2025 — Hạn nộp: 31/01/2026</Text>
          </View>
          <View style={styles.alertRow}>
            <View style={styles.alertStat}>
              <Text style={styles.alertLabel}>Thuế GTGT</Text>
              <Text style={styles.alertVal}>2.400.000 đ</Text>
            </View>
            <View style={styles.alertDivider} />
            <View style={styles.alertStat}>
              <Text style={styles.alertLabel}>Thuế TNCN</Text>
              <Text style={styles.alertVal}>800.000 đ</Text>
            </View>
            <View style={styles.alertDivider} />
            <View style={styles.alertStat}>
              <Text style={styles.alertLabel}>Tổng nộp</Text>
              <Text style={[styles.alertVal, { color: Colors.warning, fontWeight: '700' }]}>3.200.000 đ</Text>
            </View>
          </View>
        </View>

        {/* Summary */}
        <Card padding={14}>
          <Text style={styles.sectionLabel}>TỔNG QUAN THUẾ</Text>
          {[
            { label: 'Doanh thu chịu thuế (Q4)', value: '48.250.000 đ' },
            { label: 'Thuế GTGT phải nộp (10%)', value: '2.400.000 đ' },
            { label: 'Thu nhập chịu thuế TNCN', value: '32.000.000 đ' },
            { label: 'Thuế TNCN phải nộp', value: '800.000 đ' },
          ].map(r => (
            <View key={r.label} style={styles.sumRow}>
              <Text style={styles.sumLabel}>{r.label}</Text>
              <Text style={styles.sumVal}>{r.value}</Text>
            </View>
          ))}
        </Card>

        {/* Quick actions */}
        <View style={styles.actionGrid}>
          {[
            { icon: 'document-text-outline', label: 'Tạo tờ khai', color: Colors.primary },
            { icon: 'time-outline', label: 'Lịch sử', color: Colors.success },
            { icon: 'download-outline', label: 'Tải mẫu', color: Colors.warning },
          ].map(a => (
            <TouchableOpacity key={a.label} style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: a.color + '22' }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filing history */}
        <Text style={styles.sectionLabel}>LỊCH SỬ KÊ KHAI</Text>
        <Card padding={0}>
          {HISTORY.map((h, i) => (
            <View key={h.id} style={[styles.histRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.histPeriod}>{h.period} — Thuế {h.type}</Text>
                <Text style={styles.histDate}>Hạn: {h.dueDate}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.histAmt}>{h.amount.toLocaleString('vi-VN')}đ</Text>
                <StatusBadge status={h.status} label={h.status === 'done' ? 'Đã nộp' : 'Chưa nộp'} />
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3 },
  alertCard: { backgroundColor: Colors.warningLight, borderRadius: Radius.lg, padding: 14, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  alertTitle: { ...Typography.bodyMd, color: Colors.warning },
  alertRow: { flexDirection: 'row' },
  alertStat: { flex: 1, alignItems: 'center' },
  alertLabel: { ...Typography.caption, color: Colors.textSecondary },
  alertVal: { ...Typography.bodyMd, marginTop: 2 },
  alertDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8 },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, letterSpacing: 0.6 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sumLabel: { ...Typography.body, color: Colors.textSecondary },
  sumVal: { ...Typography.bodyMd },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, alignItems: 'center', ...Shadow.sm },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { ...Typography.captionMd, textAlign: 'center' },
  histRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  histPeriod: { ...Typography.bodyMd },
  histDate: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  histAmt: { ...Typography.bodyMd, color: Colors.primary },
});
