import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { FormField, ToggleRow } from '../../components';
import { ManageStackParamList } from '../../navigation';

type Route = RouteProp<ManageStackParamList, 'StaffEdit'>;
type Nav = NativeStackNavigationProp<ManageStackParamList>;

const POSITIONS = ['Thu ngân', 'Nhân viên bán hàng', 'Quản lý kho', 'Quản lý'];
const BRANCHES = ['CH Quận 1', 'CH Quận 3', 'Kho trung tâm'];
const SHIFTS = ['Sáng · 7h-15h', 'Chiều · 14h-22h', 'Full-time'];

export function StaffEditScreen() {
  const { colors } = useThemeMode();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const isEdit = !!route.params?.id;

  const [form, setForm] = useState({
    name: isEdit ? 'Nguyễn Thị Thu Hà' : '',
    phone: isEdit ? '0912 345 678' : '',
    email: isEdit ? 'thuha@vmass.vn' : '',
    birthDate: isEdit ? '12/08/1998' : '',
    code: isEdit ? 'NV-0012' : 'NV-MOI',
    startDate: isEdit ? '01/03/2024' : '26/04/2026',
    position: isEdit ? POSITIONS[0] : POSITIONS[1],
    branch: BRANCHES[0],
    shift: SHIFTS[0],
    salary: isEdit ? '6.500.000' : '',
    commission: isEdit ? '2' : '',
  });

  const [perms, setPerms] = useState({
    canSell: true,
    canViewRevenue: false,
    canManageInventory: true,
    canEditProducts: false,
    canApproveReturns: false,
  });

  const initials = useMemo(() => {
    if (!form.name.trim()) return 'NV';
    return form.name
      .trim()
      .split(' ')
      .slice(-2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  }, [form.name]);

  const set = (k: keyof typeof form) => (v: string) => setForm((p) => ({ ...p, [k]: v }));
  const setPerm = (k: keyof typeof perms) => (v: boolean) => setPerms((p) => ({ ...p, [k]: v }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{isEdit ? 'Hồ sơ nhân viên' : 'Thêm nhân viên'}</Text>
        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveTxt}>Lưu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <TouchableOpacity style={styles.cameraBtn}>
              <Ionicons name="camera" size={12} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileBody}>
            <Text style={styles.profileName}>{form.name || 'Nhập tên nhân viên'}</Text>
            <Text style={styles.profileMeta}>{form.code} · Bắt đầu {form.startDate}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badgePill, styles.activeBadge]}>
                <Text style={styles.activeBadgeText}>● Đang làm</Text>
              </View>
              <View style={[styles.badgePill, styles.roleBadge]}>
                <Text style={styles.roleBadgeText}>{form.position}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>LIÊN HỆ</Text>
          <FormField label="Họ tên" value={form.name} onChangeText={set('name')} placeholder="Nhập họ tên" />
          <FormField label="Số điện thoại" value={form.phone} onChangeText={set('phone')} placeholder="0912 345 678" keyboardType="phone-pad" />
          <FormField label="Email" value={form.email} onChangeText={set('email')} placeholder="name@vmass.vn" keyboardType="email-address" autoCapitalize="none" />
          <FormField label="Ngày sinh" value={form.birthDate} onChangeText={set('birthDate')} placeholder="dd/mm/yyyy" />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>VỊ TRÍ & CHI NHÁNH</Text>

          <Text style={styles.inlineLabel}>Chức vụ</Text>
          <View style={styles.chipWrap}>
            {POSITIONS.map((item) => {
              const active = form.position === item;
              return (
                <TouchableOpacity key={item} style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={() => setForm((p) => ({ ...p, position: item }))}>
                  <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inlineLabel}>Chi nhánh</Text>
          <View style={styles.chipWrap}>
            {BRANCHES.map((item) => {
              const active = form.branch === item;
              return (
                <TouchableOpacity key={item} style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={() => setForm((p) => ({ ...p, branch: item }))}>
                  <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inlineLabel}>Ca làm việc</Text>
          <View style={styles.chipWrap}>
            {SHIFTS.map((item) => {
              const active = form.shift === item;
              return (
                <TouchableOpacity key={item} style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={() => setForm((p) => ({ ...p, shift: item }))}>
                  <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>PHÂN QUYỀN</Text>
          <ToggleRow label="Bán hàng (POS)" value={perms.canSell} onValueChange={setPerm('canSell')} />
          <ToggleRow label="Xem doanh thu" value={perms.canViewRevenue} onValueChange={setPerm('canViewRevenue')} />
          <ToggleRow label="Quản lý tồn kho" value={perms.canManageInventory} onValueChange={setPerm('canManageInventory')} />
          <ToggleRow label="Thêm/sửa sản phẩm" value={perms.canEditProducts} onValueChange={setPerm('canEditProducts')} />
          <ToggleRow label="Duyệt trả hàng" value={perms.canApproveReturns} onValueChange={setPerm('canApproveReturns')} />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>LƯƠNG & HOA HỒNG</Text>
          <View style={styles.salaryRow}>
            <View style={styles.salaryCol}>
              <FormField label="Lương cơ bản" value={form.salary} onChangeText={set('salary')} placeholder="6.500.000" keyboardType="numeric" />
            </View>
            <View style={styles.salaryCol}>
              <FormField label="% hoa hồng" value={form.commission} onChangeText={set('commission')} placeholder="2" keyboardType="numeric" />
            </View>
          </View>
        </View>

        {isEdit && (
          <View style={styles.sectionCard}>
            <View style={styles.attTitleRow}>
              <Text style={styles.sectionTitle}>CHẤM CÔNG THÁNG NÀY</Text>
              <TouchableOpacity>
                <Text style={styles.detailLink}>Chi tiết {'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.attGrid}>
              <View style={styles.attItem}>
                <Text style={styles.attValue}>22</Text>
                <Text style={styles.attLabel}>Ngày làm</Text>
              </View>
              <View style={styles.attItem}>
                <Text style={[styles.attValue, { color: '#b08762' }]}>2</Text>
                <Text style={styles.attLabel}>Đi trễ</Text>
              </View>
              <View style={styles.attItem}>
                <Text style={[styles.attValue, { color: '#c26b6b' }]}>1</Text>
                <Text style={styles.attLabel}>Nghỉ</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 10,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: { ...Typography.h3, flex: 1 },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  saveTxt: { ...Typography.bodySm, color: '#fff', fontWeight: '700' },
  content: { padding: Spacing.lg, gap: 10, paddingBottom: 32 },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadow.sm,
  },
  avatarWrap: { position: 'relative' },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...Typography.h2, color: Colors.primary, fontWeight: '800' },
  cameraBtn: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBody: { flex: 1 },
  profileName: { ...Typography.h4, fontSize: 17 },
  profileMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badgePill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: Radius.full },
  activeBadge: { backgroundColor: Colors.successLight },
  activeBadgeText: { ...Typography.caption, color: Colors.success, fontWeight: '700' },
  roleBadge: { backgroundColor: Colors.primaryLight },
  roleBadgeText: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    ...Shadow.sm,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inlineLabel: { ...Typography.captionMd, color: Colors.textSecondary, marginBottom: 6, marginTop: 2 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  choiceChip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: Colors.card,
  },
  choiceChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  choiceChipText: { ...Typography.captionMd, color: Colors.textSecondary },
  choiceChipTextActive: { color: '#fff' },
  salaryRow: { flexDirection: 'row', gap: 8 },
  salaryCol: { flex: 1 },
  attTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  detailLink: { ...Typography.captionMd, color: Colors.primary, fontWeight: '700' },
  attGrid: { flexDirection: 'row', gap: 8 },
  attItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    alignItems: 'center',
    paddingVertical: 10,
  },
  attValue: { ...Typography.h2, fontSize: 22, fontWeight: '800' },
  attLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
