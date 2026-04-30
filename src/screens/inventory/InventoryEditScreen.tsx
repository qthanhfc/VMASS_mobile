import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Header } from '../../components/Header';
import { ChipRow } from '../../components/ChipRow';
import { FormField } from '../../components/FormField';
import { SearchBar } from '../../components/SearchBar';
import { SectionHeader } from '../../components/SectionHeader';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { ManageStackParamList, ScanActionItem } from '../../navigation';

type InventoryMode = 'import' | 'export' | 'transfer' | 'audit';

const MODES: Array<{ key: InventoryMode; label: string }> = [
  { key: 'import', label: 'Nhập hàng' },
  { key: 'export', label: 'Xuất hàng' },
  { key: 'transfer', label: 'Chuyển kho' },
  { key: 'audit', label: 'Kiểm kê' },
];

const BRANCHES = [
  { key: 'main', label: 'Cửa hàng chính' },
  { key: 'center', label: 'Kho trung tâm' },
  { key: 'q3', label: 'CN Quận 3' },
];

interface CartItem {
  id: string;
  name: string;
  sku: string;
  qty: number;
  cost: number;
}
type InventoryEditRoute = RouteProp<ManageStackParamList, 'InventoryEdit'>;

const MOCK_PRODUCTS: CartItem[] = [
  { id: '1', name: 'Áo thun nam basic', sku: 'ATN-001', qty: 1, cost: 120000 },
  { id: '3', name: 'Áo khoác dù unisex', sku: 'AKD-003', qty: 2, cost: 450000 },
];

const buildItemsFromScanItems = (scanItems: ScanActionItem[] = []): CartItem[] => {
  return scanItems.map((scanItem, index) => ({
    id: scanItem.sku || scanItem.code || `scan-${index}`,
    name: scanItem.name,
    sku: scanItem.sku || scanItem.code,
    qty: scanItem.qty,
    cost: 0,
  }));
};

export function InventoryEditScreen({ navigation }: any) {
  const { colors } = useThemeMode();
  const route = useRoute<InventoryEditRoute>();
  const [mode, setMode] = useState<InventoryMode>(route.params?.mode ?? 'import');
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('main');
  const [toBranch, setToBranch] = useState('center');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CartItem[]>(() => {
    const scanItems = buildItemsFromScanItems(route.params?.scanItems);
    return scanItems.length > 0 ? scanItems : MOCK_PRODUCTS;
  });
  const [showBranchPicker, setShowBranchPicker] = useState(false);

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const total = items.reduce((sum, i) => sum + i.qty * i.cost, 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title="Điều chỉnh tồn kho"
        onBack={() => navigation?.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Mode selector */}
        <View style={styles.section}>
          <ChipRow chips={MODES} selected={mode} onSelect={(key) => setMode(key as InventoryMode)} />
        </View>

        {/* Product search */}
        <View style={styles.section}>
          <SectionHeader title="Sản phẩm" />
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm hoặc quét mã sản phẩm..."
            onQrPress={() => navigation?.navigate('QrScan')}
          />
        </View>

        {/* Items list */}
        {items.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={`Danh sách (${items.length} SP)`} />
            {items.map(item => (
              <View key={item.id} style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.itemSku, { color: colors.textSecondary }]}>{item.sku} · {item.cost.toLocaleString('vi-VN')} đ</Text>
                </View>
                <View style={styles.stepper}>
                  <TouchableOpacity style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => updateQty(item.id, -1)}>
                    <Ionicons name="remove" size={16} color={Colors.danger} />
                  </TouchableOpacity>
                  <Text style={[styles.stepQty, { color: colors.text }]}>{item.qty}</Text>
                  <TouchableOpacity style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => updateQty(item.id, 1)}>
                    <Ionicons name="add" size={16} color={Colors.success} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Branch selector */}
        <View style={styles.section}>
          <SectionHeader title={mode === 'transfer' ? 'Kho xuất' : 'Chi nhánh'} />
          <TouchableOpacity
            style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowBranchPicker(!showBranchPicker)}
          >
            <Text style={[styles.pickerText, { color: colors.text }]}>
              {BRANCHES.find(b => b.key === branch)?.label || 'Chọn chi nhánh'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          {showBranchPicker && (
            <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {BRANCHES.map(b => (
                <TouchableOpacity
                  key={b.key}
                  style={[styles.pickerOption, { borderBottomColor: colors.border }]}
                  onPress={() => { setBranch(b.key); setShowBranchPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, { color: colors.text }, b.key === branch && styles.pickerOptionActive]}>
                    {b.label}
                  </Text>
                  {b.key === branch && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {mode === 'transfer' && (
            <>
              <Text style={[styles.transferLabel, { color: colors.textSecondary }]}>Kho nhập</Text>
              <TouchableOpacity style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.pickerText, { color: colors.text }]}>
                  {BRANCHES.find(b => b.key === toBranch)?.label}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <SectionHeader title="Ghi chú" />
          <View style={[styles.notesWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.notes, { color: colors.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Nhập ghi chú (tùy chọn)..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Tổng kết</Text>
          <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Số loại sản phẩm</Text>
            <Text style={[styles.summaryVal, { color: colors.text }]}>{items.length} SP</Text>
          </View>
          <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tổng số lượng</Text>
            <Text style={[styles.summaryVal, { color: colors.text }]}>{items.reduce((s, i) => s + i.qty, 0)} cái</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>Tổng giá trị</Text>
            <Text style={[styles.summaryTotalVal, { color: colors.primary }]}>{total.toLocaleString('vi-VN')} đ</Text>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity style={styles.saveBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>Xác nhận {MODES.find(m => m.key === mode)?.label}</Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  itemRow: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    ...Shadow.sm,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemName: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  itemSku: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepQty: {
    ...Typography.h4,
    color: Colors.text,
    minWidth: 28,
    textAlign: 'center',
  },
  picker: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pickerText: {
    ...Typography.body,
    color: Colors.text,
  },
  pickerDropdown: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    ...Shadow.md,
    marginTop: 2,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerOptionText: {
    ...Typography.body,
    color: Colors.text,
  },
  pickerOptionActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  transferLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  notesWrap: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  notes: {
    ...Typography.body,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  summaryVal: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  summaryTotalRow: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  summaryTotalLabel: {
    ...Typography.h4,
    color: Colors.text,
  },
  summaryTotalVal: {
    ...Typography.h4,
    color: Colors.primary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },
  saveBtnText: {
    ...Typography.h4,
    color: '#fff',
  },
});
