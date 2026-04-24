import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { FormField, Card, SectionHeader } from '../../components';
import { ManageStackParamList } from '../../navigation';

type Route = RouteProp<ManageStackParamList, 'SupplierEdit'>;
const PAYMENT_TERMS = ['Thanh toán ngay', 'Net 15', 'Net 30', 'Net 45', 'Net 60'];

export function SupplierEditScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute<Route>();
  const isEdit = !!route.params?.id;
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', contactPerson: '', paymentTerms: 'Net 30', creditLimit: '', category: '' });
  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</Text>
        <TouchableOpacity style={styles.saveBtn}><Text style={styles.saveTxt}>Lưu</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 16, paddingBottom: 40 }}>
        {/* Logo upload */}
        <TouchableOpacity style={styles.logoUpload}>
          <Ionicons name="cloud-upload-outline" size={28} color={Colors.textSecondary} />
          <Text style={styles.uploadLabel}>Tải lên logo</Text>
        </TouchableOpacity>

        <Card padding={14}>
          <SectionHeader title="THÔNG TIN CHUNG" />
          <FormField label="Tên nhà cung cấp *" value={form.name} onChangeText={set('name')} placeholder="VD: Công ty CP ABC" />
          <FormField label="Ngành hàng" value={form.category} onChangeText={set('category')} placeholder="VD: Thời trang, Thực phẩm..." />
        </Card>

        <Card padding={14}>
          <SectionHeader title="LIÊN HỆ" />
          <FormField label="Số điện thoại" value={form.phone} onChangeText={set('phone')} placeholder="028 1234 5678" keyboardType="phone-pad" />
          <FormField label="Email" value={form.email} onChangeText={set('email')} placeholder="contact@supplier.vn" keyboardType="email-address" />
          <FormField label="Địa chỉ" value={form.address} onChangeText={set('address')} placeholder="Địa chỉ nhà cung cấp" multiline />
          <FormField label="Người liên hệ" value={form.contactPerson} onChangeText={set('contactPerson')} placeholder="Tên người đại diện" />
        </Card>

        <Card padding={14}>
          <SectionHeader title="ĐIỀU KHOẢN THANH TOÁN" />
          <Text style={styles.fieldLabel}>Kỳ hạn</Text>
          <View style={styles.termGrid}>
            {PAYMENT_TERMS.map(t => (
              <TouchableOpacity key={t} onPress={() => setForm(p => ({ ...p, paymentTerms: t }))}
                style={[styles.termChip, form.paymentTerms === t && styles.termChipActive]}>
                <Text style={[styles.termLabel, form.paymentTerms === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormField label="Hạn mức tín dụng (đ)" value={form.creditLimit} onChangeText={set('creditLimit')} placeholder="50.000.000" keyboardType="numeric" />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3, flex: 1 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.primary, borderRadius: Radius.md },
  saveTxt: { ...Typography.bodyMd, color: '#fff' },
  logoUpload: { alignItems: 'center', justifyContent: 'center', height: 100, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', gap: 8 },
  uploadLabel: { ...Typography.body, color: Colors.textSecondary },
  fieldLabel: { ...Typography.captionMd, color: Colors.textSecondary, marginBottom: 8 },
  termGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  termChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  termChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  termLabel: { ...Typography.captionMd, color: Colors.textSecondary },
});
