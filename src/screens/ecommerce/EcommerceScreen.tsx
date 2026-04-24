import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import { Card } from '../../components';

const PLATFORMS = [
  { key: 'shopee', name: 'Shopee', emoji: '🛒', connected: true, orders: 18, pending: 3, revenue: 12500000, color: '#ee4d2d' },
  { key: 'lazada', name: 'Lazada', emoji: '🔵', connected: true, orders: 7, pending: 1, revenue: 5800000, color: '#1a0dab' },
  { key: 'tiktok', name: 'TikTok Shop', emoji: '🎵', connected: true, orders: 12, pending: 4, revenue: 9200000, color: '#010101' },
  { key: 'tiki', name: 'Tiki', emoji: '🔷', connected: false, orders: 0, pending: 0, revenue: 0, color: '#1a94ff' },
  { key: 'sendo', name: 'Sendo', emoji: '🟡', connected: false, orders: 0, pending: 0, revenue: 0, color: '#f7a600' },
  { key: 'facebook', name: 'Facebook Shop', emoji: '📘', connected: true, orders: 5, pending: 0, revenue: 3400000, color: '#1877f2' },
];

export function EcommerceScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();

  const connectedPlatforms = PLATFORMS.filter(p => p.connected);
  const totalOrders = connectedPlatforms.reduce((s, p) => s + p.orders, 0);
  const totalPending = connectedPlatforms.reduce((s, p) => s + p.pending, 0);
  const totalRevenue = connectedPlatforms.reduce((s, p) => s + p.revenue, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thương mại điện tử</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="refresh-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 14, paddingBottom: 100 }}>
        {/* Summary bar */}
        <View style={styles.summaryCard}>
          {[
            { label: 'Đơn hôm nay', value: String(totalOrders), color: Colors.primary },
            { label: 'Cần xử lý', value: String(totalPending), color: totalPending > 0 ? Colors.warning : Colors.success },
            { label: 'Doanh thu', value: (totalRevenue / 1000000).toFixed(1) + 'M', color: Colors.text },
          ].map(s => (
            <View key={s.label} style={styles.summaryStat}>
              <Text style={[styles.summaryVal, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Platform cards */}
        {PLATFORMS.map(p => (
          <Card key={p.key} padding={14}>
            <View style={styles.platformHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.platformIcon, { backgroundColor: p.color + '22' }]}>
                  <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                </View>
                <View>
                  <Text style={styles.platformName}>{p.name}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: p.connected ? Colors.success : Colors.textSecondary }]} />
                    <Text style={[styles.statusLabel, { color: p.connected ? Colors.success : Colors.textSecondary }]}>
                      {p.connected ? 'Đã kết nối' : 'Chưa kết nối'}
                    </Text>
                  </View>
                </View>
              </View>
              {!p.connected && (
                <TouchableOpacity style={styles.connectBtn}>
                  <Text style={styles.connectLabel}>Kết nối</Text>
                </TouchableOpacity>
              )}
            </View>

            {p.connected && (
              <View style={styles.platformStats}>
                <View style={styles.platformStat}>
                  <Text style={styles.platformStatVal}>{p.orders}</Text>
                  <Text style={styles.platformStatLabel}>Đơn hôm nay</Text>
                </View>
                <View style={[styles.platformStat, p.pending > 0 && styles.pendingHighlight]}>
                  <Text style={[styles.platformStatVal, p.pending > 0 && { color: Colors.warning }]}>{p.pending}</Text>
                  <Text style={styles.platformStatLabel}>Cần xử lý</Text>
                </View>
                <View style={styles.platformStat}>
                  <Text style={styles.platformStatVal}>{(p.revenue / 1000000).toFixed(1)}M</Text>
                  <Text style={styles.platformStatLabel}>Doanh thu</Text>
                </View>
              </View>
            )}
          </Card>
        ))}

        <TouchableOpacity style={styles.syncBtn}>
          <Ionicons name="sync-outline" size={18} color="#fff" />
          <Text style={styles.syncLabel}>Đồng bộ tất cả</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3, flex: 1 },
  iconBtn: { padding: 4 },
  summaryCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 16, ...Shadow.sm },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryVal: { ...Typography.h2, fontSize: 22 },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  platformHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  platformIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  platformName: { ...Typography.h4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { ...Typography.caption },
  connectBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.primary },
  connectLabel: { ...Typography.captionMd, color: '#fff' },
  platformStats: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  platformStat: { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: Radius.sm },
  pendingHighlight: { backgroundColor: Colors.warningLight },
  platformStatVal: { ...Typography.h4, fontSize: 18 },
  platformStatLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: Radius.lg, backgroundColor: Colors.primary, ...Shadow.md },
  syncLabel: { ...Typography.bodyMd, color: '#fff' },
});
