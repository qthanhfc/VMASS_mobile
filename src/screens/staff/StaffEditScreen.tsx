import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { FormField, ToggleRow, Card, SectionHeader, Avatar } from '../../components';
import { ManageStackParamList } from '../../navigation';

type Route = RouteProp<ManageStackParamList, 'StaffEdit'>;

const ROLES = ['Nhân viên bán hàng', 'Thu ngân', 'Quản lý kho', 'Quản lý'];

export function StaffEditScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute<Route>();
  const isEdit = !!route.params?.id;

  const [form, setForm] = useState({ name: '', phone: '', email: '', role: ROLES[0], branch: 'CN Quận 1', salary: '', commission: '' });
  const [perms, setPerms] = useState({ canSell: true, canViewRevenue: false, canManageInventory: false, canManageCustomers: true, canManageStaff: false, canManagePromotions: false });

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const setPerm = (k: keyof typeof perms) => (v: boolean) => setPerms(p => ({ ...p, [k]: v }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Hồ sơ nhân viên' : 'Thêm nhân viên'}</Text>
        <TouchableOpacity style={styles.saveBtn}><Text style={styles.saveTxt}>Lưu</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 16, paddingBottom: 40 }}>
        {/* Avatar */}
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <View style={{ position: 'relative' }}>
            <Avatar name={form.name || 'NV'} size={80} />
            <TouchableOpacity style={styles.cameraBtn}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic info */}
        <Card padding={14}>
          <SectionHeader title="THÔNG TIN CƠ BẢN" />
          <FormField label="Họ và tên *" value={form.name} onChangeText={set('name')} placeholder="Nhập họ tên" />
          <FormField label="Số điện thoại" value={form.phone} onChangeText={set('phone')} placeholder="0901234567" keyboardType="phone-pad" />
          <FormField label="Email" value={form.email} onChangeText={set('email')} placeholder="email@vmass.vn" keyboardType="email-address" />
        </Card>

        {/* Role & branch */}
        <Card padding={14}>
          <SectionHeader title="VAI TRÒ & CHI NHÁNH" />
          <Text style={styles.fieldLabel}>Vai trò</Text>
          <View style={styles.roleGrid}>
            {ROLES.map(r => (
              <TouchableOpacity key={r} onPress={() => setForm(p => ({ ...p, role: r }))}
                style={[styles.roleChip, form.role === r && styles.roleChipActive]}>
                <Text style={[styles.roleLabel, form.role === r && { color: '#fff' }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormField label="Chi nhánh" value={form.branch} onChangeText={set('branch')} />
        </Card>

        {/* Permissions */}
        <Card padding={14}>
          <SectionHeader title="PHÂN QUYỀN" />
          <ToggleRow label="Được bán hàng" value={perms.canSell} onValueChange={setPerm('canSell')} />
          <ToggleRow label="Xem doanh thu" value={perms.canViewRevenue} onValueChange={setPerm('canViewRevenue')} />
          <ToggleRow label="Quản lý kho" value={perms.canManageInventory} onValueChange={setPerm('canManageInventory')} />
          <ToggleRow label="Quản lý khách hàng" value={perms.canManageCustomers} onValueChange={setPerm('canManageCustomers')} />
          <ToggleRow label="Quản lý nhân viên" value={perms.canManageStaff} onValueChange={setPerm('canManageStaff')} />
          <ToggleRow label="Tạo khuyến mãi" value={perms.canManagePromotions} onValueChange={setPerm('canManagePromotions')} />
        </Card>

        {/* Payroll */}
        <Card padding={14}>
          <SectionHeader title="LƯƠNG & HOA HỒNG" />
          <FormField label="Lương cơ bản (đ)" value={form.salary} onChangeText={set('salary')} placeholder="8.000.000" keyboardType="numeric" />
          <FormField label="Hoa hồng (%)" value={form.commission} onChangeText={set('commission')} placeholder="2" keyboardType="numeric" />
        </Card>

        {isEdit && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>CHẤM CÔNG THÁNG NÀY</Text>
            <Text style={styles.infoText}>✅ Đã chấm: 18/22 ngày &nbsp;·&nbsp; ⚠️ Đi muộn: 1 lần</Text>
          </View>
        )}
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
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  fieldLabel: { ...Typography.captionMd, color: Colors.textSecondary, marginBottom: 8 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  roleChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  roleChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleLabel: { ...Typography.captionMd, color: Colors.textSecondary },
  infoCard: { backgroundColor: Colors.warningLight, borderRadius: Radius.lg, padding: 14 },
  infoLabel: { ...Typography.label, color: Colors.warning, marginBottom: 6 },
  infoText: { ...Typography.body, color: Colors.text },
});
