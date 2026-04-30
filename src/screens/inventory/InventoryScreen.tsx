import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Header } from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';

const WAREHOUSES = [
  { key: 'all', label: 'Tất cả kho' },
  { key: 'q1', label: 'CH Q1' },
  { key: 'q7', label: 'CH Q7' },
  { key: 'total', label: 'Kho tổng' },
  { key: 'consign', label: 'Ký gửi' },
];

const QUICK_ACTIONS = [
  {
    key: 'stock-in',
    title: 'Nhập kho',
    subtitle: 'Tạo phiếu',
    icon: 'arrow-up' as const,
    iconColor: Colors.primary,
    iconBg: '#c4e4f2',
    iconBorder: Colors.primary,
  },
  {
    key: 'stock-out',
    title: 'Xuất kho',
    subtitle: 'Tạo phiếu',
    icon: 'arrow-down' as const,
    iconColor: '#c97a7a',
    iconBg: '#f0d4d4',
    iconBorder: '#c97a7a',
  },
  {
    key: 'transfer',
    title: 'Chuyển kho',
    subtitle: 'Giữa các kho',
    icon: 'repeat' as const,
    iconColor: '#c4a274',
    iconBg: '#f4e5c4',
    iconBorder: '#c4a274',
  },
  {
    key: 'stocktake',
    title: 'Kiểm kê',
    subtitle: 'So sánh',
    icon: 'checkmark' as const,
    iconColor: '#7a9e7a',
    iconBg: '#d4e4c4',
    iconBorder: '#7a9e7a',
  },
];

const ITEMS = [
  {
    id: '1',
    name: 'Cà phê G7 (3 trong 1)',
    sku: 'SP-0421',
    qty: 124,
    minStock: 20,
    unit: 'gói',
    location: 'Kệ A3-02',
    warehouse: 'q1',
  },
  {
    id: '2',
    name: 'Coca-Cola lon 330ml',
    sku: 'SP-0305',
    qty: 88,
    minStock: 30,
    unit: 'lon',
    location: 'Kệ B1-14',
    warehouse: 'q7',
  },
  {
    id: '3',
    name: 'Pepsi 330ml',
    sku: 'SP-0307',
    qty: 3,
    minStock: 30,
    unit: 'lon',
    location: 'Kệ B1-15',
    warehouse: 'q7',
  },
  {
    id: '4',
    name: 'Dầu ăn Neptune 1L',
    sku: 'SP-0502',
    qty: 2,
    minStock: 10,
    unit: 'chai',
    location: 'Kệ C2-04',
    warehouse: 'total',
  },
  {
    id: '5',
    name: 'Bột giặt Omo 800g',
    sku: 'SP-0701',
    qty: 1,
    minStock: 8,
    unit: 'gói',
    location: 'Kệ D4-11',
    warehouse: 'total',
  },
  {
    id: '6',
    name: 'Mì Hảo Hảo tôm chua',
    sku: 'SP-0118',
    qty: 42,
    minStock: 20,
    unit: 'gói',
    location: 'Kệ A2-08',
    warehouse: 'q1',
  },
];

function isLowStock(qty: number, minStock: number) {
  return qty <= minStock;
}

export function InventoryScreen({ navigation }: any) {
  const { colors } = useThemeMode();
  const [warehouse, setWarehouse] = useState('all');

  const filteredItems = useMemo(() => {
    if (warehouse === 'all') return ITEMS;
    return ITEMS.filter(item => item.warehouse === warehouse);
  }, [warehouse]);

  const lowStockCount = useMemo(
    () => filteredItems.filter(item => isLowStock(item.qty, item.minStock)).length,
    [filteredItems]
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title="Tồn kho"
        onBack={() => navigation?.goBack?.()}
        rightActions={
          <>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="filter-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="qr-code-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.primaryStatCard}>
            <Text style={[styles.primaryStatLabel, { color: 'rgba(255,255,255,0.9)' }]}>Tổng giá trị</Text>
            <Text style={[styles.primaryStatValue, { color: '#fff' }]}>248M đ</Text>
            <Text style={[styles.primaryStatSub, { color: 'rgba(255,255,255,0.85)' }]}>1,284 SKU</Text>
          </View>

          <View style={[styles.secondaryStatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.secondaryStatLabel, { color: colors.textSecondary }]}>Cần nhập</Text>
            <Text style={styles.secondaryStatValue}>{lowStockCount}</Text>
            <Text style={[styles.secondaryStatSub, { color: colors.textSecondary }]}>SP sắp hết</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.warehouseTabs}
        >
          {WAREHOUSES.map(tab => {
            const active = warehouse === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.warehouseChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  active && styles.warehouseChipActive,
                ]}
                onPress={() => setWarehouse(tab.key)}
              >
                <Text style={[styles.warehouseText, { color: colors.textSecondary }, active && styles.warehouseTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.key}
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation?.navigate?.('InventoryEdit')}
            >
              <View
                style={[
                  styles.quickIcon,
                  {
                    backgroundColor: action.iconBg,
                    borderColor: action.iconBorder,
                  },
                ]}
              >
                <Ionicons name={action.icon} size={16} color={action.iconColor} />
              </View>

              <View>
                <Text style={[styles.quickTitle, { color: colors.text }]}>{action.title}</Text>
                <Text style={[styles.quickSub, { color: colors.textSecondary }]}>{action.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: colors.text }]}>Danh sách tồn</Text>
          <Text style={[styles.listSort, { color: colors.textSecondary }]}>Sắp xếp: A-Z ↓</Text>
        </View>

        <View style={[styles.stockCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {filteredItems.map((item, index) => {
            const low = isLowStock(item.qty, item.minStock);

            return (
              <View key={item.id}>
                {index > 0 && (
                  <View style={styles.stockSeparator}>
                    {Array.from({ length: 28 }).map((_, dashIdx) => (
                      <View key={`${item.id}-dash-${dashIdx}`} style={[styles.stockSeparatorDash, { backgroundColor: colors.border }]} />
                    ))}
                  </View>
                )}
                <View
                  style={[
                    styles.stockRow,
                    low && styles.stockRowLow,
                    { backgroundColor: low ? colors.dangerLight : colors.card },
                  ]}
                >
                  <View style={[styles.thumb, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="cube-outline" size={18} color={colors.textSecondary} />
                  </View>

                  <View style={styles.stockInfo}>
                    <Text style={[styles.stockName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.stockMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.sku} · {item.location}
                    </Text>
                  </View>

                  <View style={styles.stockQtyWrap}>
                    <Text style={[styles.stockQty, { color: colors.text }, low && styles.stockQtyLow]}>
                      {item.qty} <Text style={[styles.stockUnit, { color: colors.textSecondary }]}>{item.unit}</Text>
                    </Text>
                    <Text style={[styles.stockMin, { color: colors.textSecondary }]}>min {item.minStock}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 20,
  },
  iconBtn: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  primaryStatCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    ...Shadow.sm,
  },
  primaryStatLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.9)',
  },
  primaryStatValue: {
    ...Typography.h2,
    fontSize: 28,
    color: '#fff',
    marginTop: 2,
  },
  primaryStatSub: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  secondaryStatCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  secondaryStatLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  secondaryStatValue: {
    ...Typography.h2,
    fontSize: 28,
    color: '#c97a7a',
    marginTop: 2,
  },
  secondaryStatSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  warehouseTabs: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  warehouseChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  warehouseChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  warehouseText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  warehouseTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  quickBtn: {
    width: '48.7%',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    ...Typography.captionMd,
    color: Colors.text,
    fontWeight: '700',
  },
  quickSub: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0,
  },
  listHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    ...Typography.bodyMd,
    color: Colors.text,
    fontWeight: '700',
  },
  listSort: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0,
  },
  stockCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    ...Shadow.sm,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  stockSeparator: {
    marginHorizontal: Spacing.md,
    paddingVertical: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockSeparatorDash: {
    width: 6,
    height: 1.5,
    borderRadius: Radius.full,
    backgroundColor: '#d2cec4',
  },
  stockRowLow: {
    backgroundColor: '#fcf2ee',
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#f8f7f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockInfo: {
    flex: 1,
    minWidth: 0,
  },
  stockName: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '700',
  },
  stockMeta: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0,
  },
  stockQtyWrap: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  stockQty: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '800',
  },
  stockQtyLow: {
    color: '#c97a7a',
  },
  stockUnit: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0,
  },
  stockMin: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0,
    marginTop: 1,
  },
});
