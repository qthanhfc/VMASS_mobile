import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import {
  Card,
  StatCard,
  SectionHeader,
  ProgressBar,
  StatusBadge,
  Avatar,
} from '../../components';
import { DashboardStats } from '../../types';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_STATS: DashboardStats = {
  revenueToday: 12450000,
  revenueYesterday: 10830000,
  ordersToday: 34,
  newCustomers: 5,
  itemsSold: 87,
  profitToday: 3120000,
  monthlyGoal: 100000000,
  monthlyRevenue: 45000000,
  weeklyRevenue: [8200000, 9500000, 7800000, 11200000, 10100000, 13400000, 12450000],
  topProducts: [
    { id: 1, name: 'Áo thun basic trắng', sold: 24, revenue: 2880000 },
    { id: 2, name: 'Quần jean slim fit', sold: 18, revenue: 3960000 },
    { id: 3, name: 'Giày sneaker trắng', sold: 12, revenue: 5040000 },
  ],
  lowStockProducts: [
    { id: 4, name: 'Áo polo xanh navy', stock: 2, minStock: 10 },
    { id: 5, name: 'Váy hoa mùa hè', stock: 1, minStock: 5 },
    { id: 6, name: 'Túi tote canvas', stock: 3, minStock: 8 },
  ],
  recentOrders: [
    { id: 1, orderNumber: 'DH-0234', customerName: 'Nguyễn Thị Lan', total: 650000, status: 'pending', channel: 'pos', createdAt: '2 phút trước' },
    { id: 2, orderNumber: 'DH-0233', customerName: 'Trần Văn Minh', total: 1200000, status: 'packing', channel: 'shopee', createdAt: '18 phút trước' },
    { id: 3, orderNumber: 'DH-0232', customerName: 'Lê Thị Hoa', total: 880000, status: 'shipping', channel: 'lazada', createdAt: '45 phút trước' },
    { id: 4, orderNumber: 'DH-0231', customerName: 'Phạm Quốc Bảo', total: 2100000, status: 'done', channel: 'tiktok', createdAt: '1 giờ trước' },
    { id: 5, orderNumber: 'DH-0230', customerName: 'Hoàng Thị Mai', total: 430000, status: 'cancelled', channel: 'pos', createdAt: '2 giờ trước' },
  ],
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function vnd(n: number) {
  return n.toLocaleString('vi-VN') + ' đ';
}

function revenuePctChange(today: number, yesterday: number) {
  if (yesterday === 0) return '+0%';
  const pct = ((today - yesterday) / yesterday) * 100;
  const sign = pct >= 0 ? '▲ +' : '▼ ';
  return `${sign}${Math.abs(pct).toFixed(0)}% so với hôm qua`;
}

const CHANNEL_LABEL: Record<string, string> = {
  pos: 'POS',
  shopee: 'Shopee',
  lazada: 'Lazada',
  tiktok: 'TikTok',
  tiki: 'Tiki',
  website: 'Web',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SparklineBar({ values }: { values: number[] }) {
  const max = Math.max(...values);
  return (
    <View style={spark.container}>
      {values.map((v, i) => {
        const height = Math.round((v / max) * 32);
        const isLast = i === values.length - 1;
        return (
          <View
            key={i}
            style={[
              spark.bar,
              { height, backgroundColor: isLast ? '#fff' : 'rgba(255,255,255,0.4)' },
            ]}
          />
        );
      })}
    </View>
  );
}

const spark = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 36,
  },
  bar: {
    width: 8,
    borderRadius: 3,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [loading] = useState(false);
  const stats = MOCK_STATS;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const monthlyProgress = stats.monthlyRevenue / stats.monthlyGoal;

  return (
    <View style={[styles.screen, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Xin chào! ☀️</Text>
          <Text style={styles.storeMeta}>Cửa hàng VMASS · 24/04/2026</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Avatar name="Quản lý" size={34} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Revenue Today Card ── */}
        <View style={styles.px}>
          <View style={[styles.revenueCard]}>
            <View style={styles.revenueTop}>
              <View style={styles.revenueLeft}>
                <Text style={styles.revenueLabel}>Doanh thu hôm nay</Text>
                <Text style={styles.revenueAmount}>{vnd(stats.revenueToday)}</Text>
                <Text style={styles.revenueChange}>
                  {revenuePctChange(stats.revenueToday, stats.revenueYesterday)}
                </Text>
              </View>
              <SparklineBar values={stats.weeklyRevenue} />
            </View>
          </View>
        </View>

        {/* ── KPI Grid ── */}
        <View style={styles.kpiGrid}>
          <StatCard
            label="Đơn hàng hôm nay"
            value={String(stats.ordersToday)}
            sub="đơn"
            style={styles.kpiCard}
          />
          <StatCard
            label="Khách hàng mới"
            value={String(stats.newCustomers)}
            sub="khách"
            style={styles.kpiCard}
          />
          <StatCard
            label="Sản phẩm bán"
            value={String(stats.itemsSold)}
            sub="sản phẩm"
            style={styles.kpiCard}
          />
          <StatCard
            label="Lợi nhuận"
            value={vnd(stats.profitToday)}
            color={Colors.success}
            style={styles.kpiCard}
          />
        </View>

        {/* ── Monthly Goal ── */}
        <View style={styles.px}>
          <Card style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>Mục tiêu tháng</Text>
              <Text style={styles.goalPct}>{Math.round(monthlyProgress * 100)}%</Text>
            </View>
            <Text style={styles.goalNumbers}>
              {vnd(stats.monthlyRevenue)} / {vnd(stats.monthlyGoal)}
            </Text>
            <View style={{ marginTop: Spacing.sm }}>
              <ProgressBar progress={monthlyProgress} height={8} />
            </View>
            <Text style={styles.goalHint}>
              Còn {vnd(stats.monthlyGoal - stats.monthlyRevenue)} để đạt mục tiêu
            </Text>
          </Card>
        </View>

        {/* ── Top Products ── */}
        <SectionHeader title="Top sản phẩm" action="Xem tất cả" />
        <View style={styles.px}>
          <Card padding={0} style={styles.tableCard}>
            {stats.topProducts.map((p, i) => (
              <View
                key={p.id}
                style={[
                  styles.tableRow,
                  i < stats.topProducts.length - 1 && styles.tableRowBorder,
                ]}
              >
                <View style={[styles.rankBadge, i === 0 && styles.rankGold, i === 1 && styles.rankSilver, i === 2 && styles.rankBronze]}>
                  <Text style={styles.rankText}>{i + 1}</Text>
                </View>
                <Text style={styles.tableProductName} numberOfLines={1}>
                  {p.name}
                </Text>
                <View style={styles.tableRight}>
                  <Text style={styles.tableSold}>{p.sold} cái</Text>
                  <Text style={styles.tableRevenue}>{vnd(p.revenue)}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>

        {/* ── Low Stock ── */}
        <SectionHeader title="Tồn kho thấp" action="Nhập hàng" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.lowStockScroll}
        >
          {stats.lowStockProducts.map(p => (
            <View key={p.id} style={styles.lowStockCard}>
              <View style={styles.lowStockIcon}>
                <Ionicons name="warning" size={18} color={Colors.warning} />
              </View>
              <Text style={styles.lowStockName} numberOfLines={2}>{p.name}</Text>
              <Text style={styles.lowStockQty}>
                <Text style={{ color: Colors.danger, fontWeight: '700' }}>{p.stock}</Text>
                /{p.minStock} tối thiểu
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* ── Recent Orders ── */}
        <SectionHeader title="Đơn hàng gần đây" action="Xem tất cả" />
        <View style={styles.px}>
          <Card padding={0} style={styles.tableCard}>
            {stats.recentOrders.map((order, i) => (
              <TouchableOpacity
                key={order.id}
                style={[
                  styles.orderRow,
                  i < stats.recentOrders.length - 1 && styles.tableRowBorder,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.orderLeft}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderCustomer}>{order.customerName}</Text>
                  <View style={styles.orderMeta}>
                    <View style={styles.channelPill}>
                      <Text style={styles.channelText}>{CHANNEL_LABEL[order.channel] || order.channel}</Text>
                    </View>
                    <Text style={styles.orderTime}>{order.createdAt}</Text>
                  </View>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderTotal}>{vnd(order.total)}</Text>
                  <StatusBadge status={order.status} />
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...Typography.h3,
    color: Colors.text,
  },
  storeMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  px: {
    paddingHorizontal: Spacing.lg,
  },
  // Revenue card
  revenueCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  revenueTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  revenueLeft: {
    flex: 1,
  },
  revenueLabel: {
    ...Typography.captionMd,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.xs,
  },
  revenueAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  revenueChange: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  kpiCard: {
    width: '47.5%',
    flex: undefined,
  },
  // Goal card
  goalCard: {
    gap: 0,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  goalTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  goalPct: {
    ...Typography.h4,
    color: Colors.primary,
  },
  goalNumbers: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  goalHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  // Table
  tableCard: {
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankGold: { backgroundColor: '#ffd700' },
  rankSilver: { backgroundColor: '#c0c0c0' },
  rankBronze: { backgroundColor: '#cd7f32' },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  tableProductName: {
    ...Typography.bodyMd,
    color: Colors.text,
    flex: 1,
  },
  tableRight: {
    alignItems: 'flex-end',
  },
  tableSold: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  tableRevenue: {
    ...Typography.captionMd,
    color: Colors.primary,
  },
  // Low stock
  lowStockScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  lowStockCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    width: 140,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  lowStockIcon: {
    marginBottom: Spacing.xs,
  },
  lowStockName: {
    ...Typography.bodyMd,
    color: Colors.text,
    marginBottom: 4,
  },
  lowStockQty: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  // Orders
  orderRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  orderLeft: {
    flex: 1,
    gap: 3,
  },
  orderNumber: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  orderCustomer: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  channelPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  channelText: {
    ...Typography.label,
    color: Colors.primary,
    fontSize: 10,
  },
  orderTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  orderTotal: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
});
