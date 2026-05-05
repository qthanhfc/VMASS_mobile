import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type Route = RouteProp<ManageStackParamList, 'SupplierEdit'>;

type SupplierProfile = {
  id: number;
  name: string;
  code: string;
  taxId: string;
  category: TranslationKey;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  creditLimit: string;
  bankAccount: string;
  currentDebt: number;
  totalOrders: number;
  purchaseValue: number;
  lastOrderDays: number;
  status: 'active' | 'paused';
  color: string;
};

const PAYMENT_TERMS: { value: string; labelKey: TranslationKey }[] = [
  { value: 'Thanh toán ngay', labelKey: 'suppliers.payment.immediate' },
  { value: 'Net 15', labelKey: 'suppliers.payment.net15' },
  { value: 'Net 30', labelKey: 'suppliers.payment.net30' },
  { value: 'Net 45', labelKey: 'suppliers.payment.net45' },
  { value: 'Net 60', labelKey: 'suppliers.payment.net60' },
];

const MOCK_SUPPLIERS: Record<number, SupplierProfile> = {
  1: {
    id: 1,
    name: 'Công ty TNHH Trung Nguyên',
    code: 'NCC-001',
    taxId: '0301234567',
    category: 'suppliers.category.beverage',
    contactPerson: 'Anh Nguyễn Văn Hùng',
    phone: '0903 456 789',
    email: 'sales@trungnguyen.com',
    address: '82 Bùi Thị Xuân, Q.1, TP.HCM',
    paymentTerms: 'Net 30',
    creditLimit: '50.000.000',
    bankAccount: 'Vietcombank · 0071 0000 123456',
    currentDebt: 12400000,
    totalOrders: 42,
    purchaseValue: 186000000,
    lastOrderDays: 3,
    status: 'active',
    color: '#d97757',
  },
};

const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

const compactMoney = (value: number) => {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(word => word[0]?.toUpperCase())
    .join('') || 'NCC';

export function SupplierEditScreen() {
  const { colors } = useThemeMode();
  const { locale, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const existing = route.params?.id ? MOCK_SUPPLIERS[route.params.id] : undefined;
  const isEdit = Boolean(existing);
  const vi = locale === 'vi';

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    code: existing?.code ?? 'NCC-MOI',
    taxId: existing?.taxId ?? '',
    category: existing ? t(existing.category) : '',
    contactPerson: existing?.contactPerson ?? '',
    phone: existing?.phone ?? '',
    email: existing?.email ?? '',
    address: existing?.address ?? '',
    paymentTerms: existing?.paymentTerms ?? 'Net 30',
    creditLimit: existing?.creditLimit ?? '',
    bankAccount: existing?.bankAccount ?? '',
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const supplierColor = existing?.color ?? Colors.accent;
  const statusLabel = existing?.status === 'paused'
    ? (vi ? 'Tạm dừng' : 'Paused')
    : (vi ? 'Hoạt động' : 'Active');
  const debt = existing?.currentDebt ?? 0;

  const historyStats = useMemo(
    () => [
      { label: vi ? 'Tổng đơn' : 'Total POs', value: String(existing?.totalOrders ?? 0), color: colors.text },
      { label: vi ? 'Giá trị' : 'Value', value: compactMoney(existing?.purchaseValue ?? 0), color: Colors.primary },
      { label: vi ? 'Đơn gần nhất' : 'Last PO', value: existing ? `${existing.lastOrderDays}d` : '-', color: colors.textSecondary },
    ],
    [colors.text, colors.textSecondary, existing, vi]
  );

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert(t('common.error'), t('suppliers.nameRequired'));
      return;
    }

    Alert.alert(
      vi ? 'Đã lưu' : 'Saved',
      vi ? 'Thông tin nhà cung cấp đã được cập nhật.' : 'Supplier profile has been updated.',
      [{ text: 'OK', onPress: () => nav.goBack() }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isEdit ? (vi ? 'Hồ sơ nhà cung cấp' : 'Supplier profile') : t('suppliers.addTitle')}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {form.code || 'NCC-MOI'} · {statusLabel}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveTxt}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.logoRow}>
            <TouchableOpacity style={[styles.logoBox, { backgroundColor: `${supplierColor}22`, borderColor: supplierColor }]}>
              <Text style={[styles.logoText, { color: supplierColor }]}>{initials(form.name)}</Text>
            </TouchableOpacity>
            <View style={styles.logoInfo}>
              <Text style={[styles.supplierName, { color: colors.text }]} numberOfLines={2}>
                {form.name || t('suppliers.namePlaceholder')}
              </Text>
              <Text style={[styles.uploadLabel, { color: colors.textSecondary }]}>{t('suppliers.uploadLogo')}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{t('suppliers.generalInfo')}</Text>
          <Field label={t('suppliers.nameRequired')} value={form.name} onChangeText={set('name')} placeholder={t('suppliers.namePlaceholder')} />
          <View style={styles.twoCol}>
            <Field label={vi ? 'Mã NCC' : 'Code'} value={form.code} onChangeText={set('code')} placeholder="NCC-001" mono />
            <Field label={vi ? 'Mã số thuế' : 'Tax ID'} value={form.taxId} onChangeText={set('taxId')} placeholder="0301234567" keyboardType="numeric" mono />
          </View>
          <Field label={t('suppliers.category')} value={form.category} onChangeText={set('category')} placeholder={t('suppliers.categoryPlaceholder')} rightIcon="chevron-down" />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>☎ {t('suppliers.contact')}</Text>
          <Field label={t('suppliers.contactPerson')} value={form.contactPerson} onChangeText={set('contactPerson')} placeholder={t('suppliers.contactPersonPlaceholder')} />
          <View style={styles.twoCol}>
            <Field label={t('profile.phone')} value={form.phone} onChangeText={set('phone')} placeholder="0903 456 789" keyboardType="phone-pad" mono />
            <Field label="Email" value={form.email} onChangeText={set('email')} placeholder="sales@supplier.vn" keyboardType="email-address" autoCapitalize="none" mono />
          </View>
          <Field label={t('profile.address')} value={form.address} onChangeText={set('address')} placeholder={t('suppliers.addressPlaceholder')} multiline numberOfLines={2} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>▣ {vi ? 'Thanh toán & công nợ' : 'Payment & credit'}</Text>
          <View style={styles.twoCol}>
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('suppliers.term')}</Text>
              <View style={styles.termGrid}>
                {PAYMENT_TERMS.map(term => {
                  const selected = form.paymentTerms === term.value;
                  return (
                    <TouchableOpacity
                      key={term.value}
                      onPress={() => setForm(prev => ({ ...prev, paymentTerms: term.value }))}
                      style={[styles.termChip, { borderColor: colors.border }, selected && styles.termChipActive]}
                    >
                      <Text style={[styles.termLabel, { color: colors.textSecondary }, selected && styles.termLabelActive]}>
                        {t(term.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <Field label={t('suppliers.creditLimit')} value={form.creditLimit} onChangeText={set('creditLimit')} placeholder="50.000.000" keyboardType="numeric" />
          </View>
          <Field label={vi ? 'Số tài khoản ngân hàng' : 'Bank account'} value={form.bankAccount} onChangeText={set('bankAccount')} placeholder="Vietcombank · 0071..." mono />

          <View style={[styles.debtBox, { backgroundColor: `${supplierColor}1F`, borderColor: supplierColor }]}>
            <View>
              <Text style={[styles.debtLabel, { color: colors.textSecondary }]}>{vi ? 'Công nợ hiện tại' : 'Current debt'}</Text>
              <Text style={[styles.debtValue, { color: supplierColor }]}>{formatMoney(debt)}</Text>
            </View>
            <TouchableOpacity style={[styles.payBtn, { backgroundColor: supplierColor }]}>
              <Text style={styles.payBtnText}>{vi ? 'Thanh toán' : 'Pay now'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>▦ {vi ? 'Lịch sử giao dịch' : 'Purchase history'}</Text>
          <View style={styles.historyGrid}>
            {historyStats.map(stat => (
              <View key={stat.label} style={[styles.historyStat, { backgroundColor: colors.background }]}>
                <Text style={[styles.historyValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={[styles.historyLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>{vi ? 'Xem tất cả đơn nhập →' : 'See all POs →'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  mono?: boolean;
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
};

function Field({ label, mono, rightIcon, multiline, numberOfLines, style, ...props }: FieldProps) {
  const { colors } = useThemeMode();

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          {...props}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.fieldInput,
            mono && styles.fieldInputMono,
            multiline && styles.fieldInputMultiline,
            rightIcon && styles.fieldInputWithIcon,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
        />
        {rightIcon && (
          <Ionicons name={rightIcon} size={16} color={colors.textSecondary} style={styles.inputIcon} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 8,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerMain: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
  },
  headerSub: {
    ...Typography.caption,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
  saveTxt: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
    gap: 10,
  },
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...Typography.h2,
    fontWeight: '800',
  },
  logoInfo: {
    flex: 1,
  },
  supplierName: {
    ...Typography.bodyMd,
    fontWeight: '700',
  },
  uploadLabel: {
    ...Typography.caption,
    marginTop: 3,
  },
  cardTitle: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldWrap: {
    flex: 1,
    marginTop: 6,
  },
  fieldLabel: {
    ...Typography.captionMd,
    marginBottom: 5,
  },
  inputWrap: {
    position: 'relative',
  },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: Colors.text,
    backgroundColor: Colors.card,
    fontSize: 13,
    fontWeight: '600',
  },
  fieldInputWithIcon: {
    paddingRight: 34,
  },
  fieldInputMono: {
    fontFamily: 'monospace',
  },
  fieldInputMultiline: {
    minHeight: 64,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 13,
  },
  termGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  termChip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  termChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termLabel: {
    ...Typography.captionMd,
  },
  termLabelActive: {
    color: '#fff',
  },
  debtBox: {
    marginTop: 10,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  debtLabel: {
    ...Typography.captionMd,
  },
  debtValue: {
    ...Typography.h3,
    marginTop: 2,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  payBtn: {
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  payBtnText: {
    ...Typography.captionMd,
    color: '#fff',
    fontWeight: '700',
  },
  historyGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  historyStat: {
    flex: 1,
    borderRadius: Radius.sm,
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  historyValue: {
    ...Typography.h4,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  historyLabel: {
    ...Typography.caption,
    fontSize: 10,
    marginTop: 1,
    textAlign: 'center',
  },
  viewAllBtn: {
    marginTop: 9,
    alignItems: 'center',
  },
  viewAllText: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '700',
  },
});
