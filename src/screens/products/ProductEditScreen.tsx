import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import {
  Header,
  FormField,
  ToggleRow,
  SectionHeader,
  Card,
} from '../../components';
import { Product } from '../../types';

type RouteParams = {
  ProductEdit: { id?: number };
};

const MOCK_PRODUCTS: Record<number, Product> = {
  1: { id: 1, name: 'Áo thun nam basic', sku: 'AT-001', price: 189000, cost: 90000, stock: 52, minStock: 10, category: 'Thời trang', status: 'active', isOnline: true, allowOversell: false, vatApplied: false, createdAt: '2024-01-01' },
  2: { id: 2, name: 'Quần jean slim fit', sku: 'QJ-002', price: 450000, cost: 200000, stock: 3, minStock: 5, category: 'Thời trang', status: 'active', isOnline: true, allowOversell: false, vatApplied: false, createdAt: '2024-01-02' },
};

export function ProductEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'ProductEdit'>>();
  const editId = route.params?.id;
  const existingProduct = editId ? MOCK_PRODUCTS[editId] : null;
  const isEdit = !!existingProduct;

  const [name, setName] = useState(existingProduct?.name ?? '');
  const [sku, setSku] = useState(existingProduct?.sku ?? '');
  const [category, setCategory] = useState(existingProduct?.category ?? '');
  const [price, setPrice] = useState(existingProduct ? String(existingProduct.price) : '');
  const [cost, setCost] = useState(existingProduct ? String(existingProduct.cost) : '');
  const [stock, setStock] = useState(existingProduct ? String(existingProduct.stock) : '');
  const [minStock, setMinStock] = useState(existingProduct ? String(existingProduct.minStock) : '');
  const [isOnline, setIsOnline] = useState(existingProduct?.isOnline ?? false);
  const [allowOversell, setAllowOversell] = useState(existingProduct?.allowOversell ?? false);
  const [vatApplied, setVatApplied] = useState(existingProduct?.vatApplied ?? false);

  const priceNum = parseFloat(price.replace(/\D/g, '')) || 0;
  const costNum = parseFloat(cost.replace(/\D/g, '')) || 0;
  const profit = priceNum - costNum;
  const profitPercent = priceNum > 0 ? Math.round((profit / priceNum) * 100) : 0;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên sản phẩm');
      return;
    }
    Alert.alert('Thành công', isEdit ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm mới', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Xóa sản phẩm', `Bạn có chắc muốn xóa "${name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.screen}>
      <Header
        title={isEdit ? 'Sửa sản phẩm' : 'Tạo sản phẩm'}
        onBack={() => navigation.goBack()}
        rightActions={
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Lưu</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Image section */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.imagePlaceholder}>
            <View style={styles.imageInner}>
              <Ionicons name="camera-outline" size={32} color={Colors.textSecondary} />
              <Text style={styles.imageText}>Thêm ảnh</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.imageHint}>Tối đa 5 ảnh, mỗi ảnh không quá 5MB</Text>
        </View>

        {/* Basic Info */}
        <SectionHeader title="Thông tin cơ bản" />
        <Card style={styles.sectionCard}>
          <FormField
            label="Tên sản phẩm *"
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên sản phẩm"
          />
          <FormField
            label="SKU / Mã sản phẩm"
            value={sku}
            onChangeText={setSku}
            placeholder="VD: SP-001"
            autoCapitalize="characters"
          />
          <FormField
            label="Danh mục"
            value={category}
            onChangeText={setCategory}
            placeholder="VD: Thời trang, Điện tử..."
          />
        </Card>

        {/* Pricing */}
        <SectionHeader title="Giá bán" />
        <Card style={styles.sectionCard}>
          <FormField
            label="Giá bán (VND)"
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            keyboardType="numeric"
            hint="Giá hiển thị cho khách hàng"
          />
          <FormField
            label="Giá nhập (VND)"
            value={cost}
            onChangeText={setCost}
            placeholder="0"
            keyboardType="numeric"
            hint="Giá nhập từ nhà cung cấp"
          />
          {/* Profit (read-only) */}
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>Lợi nhuận</Text>
            <View style={styles.profitValues}>
              <Text style={[styles.profitAmount, { color: profit >= 0 ? Colors.success : Colors.danger }]}>
                {profit.toLocaleString('vi-VN')} đ
              </Text>
              <View style={[styles.profitBadge, { backgroundColor: profit >= 0 ? Colors.successLight : Colors.dangerLight }]}>
                <Text style={[styles.profitPercent, { color: profit >= 0 ? Colors.success : Colors.danger }]}>
                  {profitPercent}%
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Inventory */}
        <SectionHeader title="Tồn kho" />
        <Card style={styles.sectionCard}>
          <FormField
            label="Số lượng hiện tại"
            value={stock}
            onChangeText={setStock}
            placeholder="0"
            keyboardType="numeric"
          />
          <FormField
            label="Cảnh báo tồn kho tối thiểu"
            value={minStock}
            onChangeText={setMinStock}
            placeholder="5"
            keyboardType="numeric"
            hint="Hệ thống sẽ cảnh báo khi tồn kho xuống dưới mức này"
          />
        </Card>

        {/* Toggles */}
        <SectionHeader title="Tùy chọn" />
        <Card style={styles.sectionCard}>
          <ToggleRow
            label="Bán online"
            description="Hiển thị trên các kênh bán hàng online"
            value={isOnline}
            onValueChange={setIsOnline}
          />
          <ToggleRow
            label="Cho phép bán vượt tồn kho"
            description="Vẫn cho phép đặt hàng khi hết hàng"
            value={allowOversell}
            onValueChange={setAllowOversell}
          />
          <ToggleRow
            label="Áp dụng VAT (10%)"
            description="Tự động tính thuế VAT 10% vào giá bán"
            value={vatApplied}
            onValueChange={setVatApplied}
          />
        </Card>

        {/* Danger zone */}
        {isEdit && (
          <>
            <SectionHeader title="Vùng nguy hiểm" />
            <Card style={styles.dangerCard}>
              <View style={styles.dangerRow}>
                <View style={styles.dangerInfo}>
                  <Text style={styles.dangerTitle}>Xóa sản phẩm</Text>
                  <Text style={styles.dangerDesc}>Thao tác này không thể hoàn tác</Text>
                </View>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                  <Text style={styles.deleteBtnText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </>
        )}

        {/* Bottom save button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleSave} style={styles.bottomSaveBtn}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.bottomSaveBtnText}>{isEdit ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  saveBtnText: {
    ...Typography.bodyMd,
    color: '#fff',
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageInner: {
    alignItems: 'center',
    gap: 8,
  },
  imageText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  imageHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  profitLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  profitValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profitAmount: {
    ...Typography.bodyMd,
    fontWeight: '700',
  },
  profitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  profitPercent: {
    ...Typography.captionMd,
    fontWeight: '700',
  },
  dangerCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dangerInfo: {
    flex: 1,
  },
  dangerTitle: {
    ...Typography.bodyMd,
    color: Colors.danger,
  },
  dangerDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },
  deleteBtnText: {
    ...Typography.bodyMd,
    color: Colors.danger,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  bottomSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    ...Shadow.md,
  },
  bottomSaveBtnText: {
    ...Typography.h4,
    color: '#fff',
  },
});
