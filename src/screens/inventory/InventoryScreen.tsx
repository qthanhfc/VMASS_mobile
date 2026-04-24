import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { SearchBar } from '../../components/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';

const BRANCHES = [
  { key: 'main', label: 'Cửa hàng chính' },
  { key: 'center', label: 'Kho trung tâm' },
  { key: 'q3', label: 'CN Quận 3' },
];

const QUICK_ACTIONS = [
  { key: 'import', label: 'Nhập hàng', icon: 'arrow-down-circle' as const, color: Colors.success },
  { key: 'export', label: 'Xuất hàng', icon: 'arrow-up-circle' as const, color: Colors.warning },
  { key: 'transfer', label: 'Chuyển kho', icon: 'swap-horizontal' as const, color: Colors.primary },
  { key: 'audit', label: 'Kiểm kê', icon: 'clipboard' as const, color: '#7c3aed' },
];

const ITEMS = [
  { id: '1', name: 'Áo thun nam basic', sku: 'ATN-001', qty: 0, minStock: 10, cost: 120000, unit: 'cái' },
  { id: '2', name: 'Quần jean nữ slim', sku: 'QJN-002', qty: 5, minStock: 10, cost: 280000, unit: 'cái' },
  { id: '3', name: 'Áo khoác dù unisex', sku: 'AKD-003', qty: 32, minStock: 10, cost: 450000, unit: 'cái' },
  { id: '4', name: 'Giày thể thao nam', sku: 'GTT-004', qty: 8, minStock: 10, cost: 650000, unit: 'đôi' },
  { id: '5', name: 'Túi xách nữ mini', sku: 'TXN-005', qty: 15, minStock: 5, cost: 320000, unit: 'cái' },
  { id: '6', name: 'Mũ lưỡi trai', sku: 'MLT-006', qty: 0, minStock: 5, cost: 85000, unit: 'cái' },
  { id: '7', name: 'Dây lưng da nam', sku: 'DLD-007', qty: 22, minStock: 8, cost: 195000, unit: 'cái' },
  { id: '8', name: 'Ví da nữ', sku: 'VDN-008', qty: 3, minStock: 5, cost: 240000, unit: 'cái' },
];

function stockColor(qty: number, minStock: number) {
  if (qty === 0) return Colors.danger;
  if (qty <= minStock) return Colors.warning;
  return Colors.success;
}

export function InventoryScreen({ navigation }: any) {
  const [branch, setBranch] = useState('main');
  const [search, setSearch] = useState('');

  const filtered = ITEMS.filter(
    i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.screen}>
      <Header
        title="Tồn kho"
        rightActions={
          <>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="filter" size={20} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="refresh" size={20} color={Colors.text} />
            </TouchableOpacity>
          </>
        }
      />

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        ListHeaderComponent={
          <>
            {/* Stat cards */}
            <View style={styles.statsRow}>
              <StatCard label="Giá trị kho" value="248.000.000 đ" style={{ flex: 1 }} />
              <StatCard label="Cần nhập thêm" value="3 SP" color={Colors.danger} style={{ flex: 1 }} />
            </View>

            {/* Branch tabs */}
            <View style={styles.branchTabs}>
              {BRANCHES.map(b => (
                <TouchableOpacity
                  key={b.key}
                  style={[styles.branchTab, branch === b.key && styles.branchTabActive]}
                  onPress={() => setBranch(b.key)}
                >
                  <Text style={[styles.branchTabText, branch === b.key && styles.branchTabTextActive]}>
                    {b.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick actions */}
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map(a => (
                <TouchableOpacity
                  key={a.key}
                  style={styles.quickBtn}
                  onPress={() => navigation?.navigate('InventoryEdit')}
                >
                  <View style={[styles.quickIcon, { backgroundColor: a.color + '1a' }]}>
                    <Ionicons name={a.icon} size={22} color={a.color} />
                  </View>
                  <Text style={styles.quickLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search */}
            <SearchBar value={search} onChangeText={setSearch} placeholder="Tìm sản phẩm, SKU..." />

            <Text style={styles.sectionLabel}>{filtered.length} sản phẩm</Text>
          </>
        }
        renderItem={({ item }) => {
          const isLow = item.qty > 0 && item.qty <= item.minStock;
          const isOut = item.qty === 0;
          const color = stockColor(item.qty, item.minStock);
          return (
            <View style={styles.itemCard}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemSku}>{item.sku}</Text>
                <Text style={styles.itemCost}>{item.cost.toLocaleString('vi-VN')} đ/{item.unit}</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={[styles.itemQty, { color }]}>{item.qty} {item.unit}</Text>
                {(isLow || isOut) && (
                  <View style={[styles.warnBadge, { backgroundColor: color + '1a' }]}>
                    <Text style={[styles.warnText, { color }]}>
                      {isOut ? '⚠ Hết hàng' : '⚠ Sắp hết'}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation?.navigate('InventoryEdit')}
                >
                  <Ionicons name="pencil" size={14} color={Colors.primary} />
                  <Text style={styles.editBtnText}>Điều chỉnh</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  iconBtn: {
    padding: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  branchTabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 3,
    ...Shadow.sm,
    marginBottom: Spacing.sm,
  },
  branchTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  branchTabActive: {
    backgroundColor: Colors.primary,
  },
  branchTabText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  branchTabTextActive: {
    color: '#fff',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  quickBtn: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  sectionLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  listContent: {
    paddingBottom: 32,
  },
  itemCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    ...Shadow.sm,
  },
  itemLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemName: {
    ...Typography.bodyMd,
    color: Colors.text,
    marginBottom: 2,
  },
  itemSku: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemCost: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemQty: {
    ...Typography.h4,
  },
  warnBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  warnText: {
    ...Typography.label,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    marginTop: 2,
  },
  editBtnText: {
    ...Typography.label,
    color: Colors.primary,
  },
  separator: {
    height: Spacing.sm,
  },
});
