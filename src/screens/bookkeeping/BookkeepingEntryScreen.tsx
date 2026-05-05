import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, useThemeMode } from '../../theme';
import { FormField, Card } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';

const INCOME_CATS = [
  { key: 'sales', icon: 'cart-outline', labelKey: 'bookkeeping.entry.cat.sales', color: Colors.success },
  { key: 'refund', icon: 'refresh-outline', labelKey: 'bookkeeping.entry.cat.refund', color: '#6b8cae' },
  { key: 'collectDebt', icon: 'wallet-outline', labelKey: 'bookkeeping.entry.cat.collectDebt', color: '#d4a574' },
  { key: 'commission', icon: 'gift-outline', labelKey: 'bookkeeping.entry.cat.commission', color: '#8a6a9e' },
  { key: 'otherRevenue', icon: 'cube-outline', labelKey: 'bookkeeping.entry.cat.otherRevenue', color: '#b08968' },
  { key: 'other', icon: 'add-outline', labelKey: 'bookkeeping.entry.cat.other', color: Colors.textSecondary },
] as const;

const EXPENSE_CATS = [
  { key: 'purchase', icon: 'bag-handle-outline', labelKey: 'bookkeeping.entry.cat.purchase', color: Colors.danger },
  { key: 'salary', icon: 'people-outline', labelKey: 'bookkeeping.entry.cat.salary', color: '#6b8cae' },
  { key: 'rent', icon: 'home-outline', labelKey: 'bookkeeping.entry.cat.rent', color: '#d4a574' },
  { key: 'utilities', icon: 'flash-outline', labelKey: 'bookkeeping.entry.cat.utilities', color: '#8a6a9e' },
  { key: 'shipping', icon: 'car-outline', labelKey: 'bookkeeping.entry.cat.shipping', color: '#b08968' },
  { key: 'other', icon: 'remove-outline', labelKey: 'bookkeeping.entry.cat.other', color: Colors.textSecondary },
] as const;

const ACCOUNTS = [
  { key: 'cash', labelKey: 'bookkeeping.entry.account.cash' },
  { key: 'bank', labelKey: 'bookkeeping.entry.account.bank' },
  { key: 'creditCard', labelKey: 'bookkeeping.entry.account.creditCard' },
] as const;

function moneyFromInput(value: string, locale: string) {
  const raw = Number(value.replace(/\D/g, ''));
  return raw ? raw.toLocaleString(locale) : '0';
}

export function BookkeepingEntryScreen() {
  const { colors } = useThemeMode();
  const { locale, dateLocale, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const isVi = locale === 'vi';
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('2500000');
  const [category, setCategory] = useState('sales');
  const [desc, setDesc] = useState(isVi ? 'Thu tiền bán ca sáng 12/12' : 'Morning shift sales 12/12');
  const [partner, setPartner] = useState(isVi ? 'Khách lẻ (tổng hợp ca)' : 'Walk-in (shift summary)');
  const [linkedOrder, setLinkedOrder] = useState('DH-2412-0842, DH-2412-0843, DH-2412-0844');
  const [account, setAccount] = useState('cash');
  const [invoice, setInvoice] = useState(true);
  const [taxable, setTaxable] = useState(true);
  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;
  const tone = type === 'income' ? Colors.success : Colors.danger;

  const amountText = useMemo(() => {
    const sign = type === 'income' ? '+' : '-';
    return `${sign}${moneyFromInput(amount, dateLocale)} ${t('home.currency')}`;
  }, [amount, dateLocale, t, type]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{isVi ? 'Ghi sổ kế toán' : 'New ledger entry'}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>PT-2512-108 · {isVi ? 'Sổ thu chi' : 'Cash book'}</Text>
        </View>
        <TouchableOpacity style={[styles.recordBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.recordText}>{isVi ? 'Ghi sổ' : 'Record'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card padding={6} style={styles.segmentCard}>
          <View style={styles.typeRow}>
            <TouchableOpacity
              onPress={() => {
                setType('income');
                setCategory('sales');
              }}
              style={[
                styles.typeBtn,
                { borderColor: colors.border },
                type === 'income' && { backgroundColor: Colors.success, borderColor: Colors.success },
              ]}
            >
              <Ionicons name="arrow-down" size={18} color={type === 'income' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.typeLabel, { color: colors.textSecondary }, type === 'income' && styles.typeLabelActive]}>
                {isVi ? 'Phiếu thu' : 'Income'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setType('expense');
                setCategory('purchase');
              }}
              style={[
                styles.typeBtn,
                { borderColor: colors.border },
                type === 'expense' && { backgroundColor: Colors.danger, borderColor: Colors.danger },
              ]}
            >
              <Ionicons name="arrow-up" size={18} color={type === 'expense' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.typeLabel, { color: colors.textSecondary }, type === 'expense' && styles.typeLabelActive]}>
                {isVi ? 'Phiếu chi' : 'Expense'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card padding={16} style={[styles.amountCard, { backgroundColor: tone }]}>
          <Text style={styles.amountLabel}>{isVi ? 'SỐ TIỀN' : 'AMOUNT'}</Text>
          <Text style={styles.amountVal}>{amountText}</Text>
          <Text style={styles.amountHint}>
            {isVi ? 'Hai triệu năm trăm nghìn đồng' : 'Two million five hundred thousand VND'}
          </Text>
        </Card>

        <Card padding={12}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {isVi ? (type === 'income' ? 'LOẠI KHOẢN THU' : 'LOẠI KHOẢN CHI') : type === 'income' ? 'INCOME CATEGORY' : 'EXPENSE CATEGORY'}
          </Text>
          <View style={styles.catGrid}>
            {cats.map((c) => {
              const selected = category === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  style={[
                    styles.catItem,
                    { borderColor: colors.border },
                    selected && { borderColor: c.color, backgroundColor: `${c.color}22` },
                  ]}
                >
                  <Ionicons name={c.icon as never} size={20} color={selected ? c.color : colors.textSecondary} />
                  <Text style={[styles.catLabel, { color: selected ? c.color : colors.text }]} numberOfLines={2}>
                    {t(c.labelKey as TranslationKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card padding={14}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{isVi ? 'CHI TIẾT' : 'DETAILS'}</Text>
          <FormField
            label={t('bookkeeping.entry.amountLabel')}
            value={amount}
            onChangeText={setAmount}
            placeholder="1.000.000"
            keyboardType="numeric"
          />
          <FormField
            label={t('bookkeeping.entry.description')}
            value={desc}
            onChangeText={setDesc}
            placeholder={t('bookkeeping.entry.descriptionPlaceholder')}
          />
          <View style={styles.twoCols}>
            <View style={styles.col}>
              <FormField label={isVi ? 'Ngày' : 'Date'} value="12/12/2025" onChangeText={() => {}} style={styles.monoInput} />
            </View>
            <View style={styles.col}>
              <FormField label={isVi ? 'Hình thức' : 'Method'} value={isVi ? 'Tiền mặt' : 'Cash'} onChangeText={() => {}} />
            </View>
          </View>
          <FormField
            label={isVi ? 'Liên kết đơn hàng' : 'Linked order'}
            value={linkedOrder}
            onChangeText={setLinkedOrder}
          />
        </Card>

        <Card padding={14}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{isVi ? 'ĐỐI TƯỢNG & TÀI KHOẢN' : 'PARTY & ACCOUNT'}</Text>
          <FormField
            label={type === 'income' ? (isVi ? 'Người nộp' : 'Payer') : isVi ? 'Người nhận' : 'Payee'}
            value={partner}
            onChangeText={setPartner}
            placeholder={t('bookkeeping.entry.partnerPlaceholder')}
          />
          <View style={styles.accountRow}>
            {ACCOUNTS.map((a) => (
              <TouchableOpacity
                key={a.key}
                onPress={() => setAccount(a.key)}
                style={[
                  styles.accountChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  account === a.key && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.accountLabel, { color: colors.textSecondary }, account === a.key && styles.accountLabelActive]}>
                  {t(a.labelKey as TranslationKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormField label={isVi ? 'Ca làm việc' : 'Shift'} value={isVi ? 'Ca sáng - NV Linh' : 'AM - Linh'} onChangeText={() => {}} />
        </Card>

        <Card padding={14}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{isVi ? 'HÓA ĐƠN & THUẾ' : 'INVOICE & TAX'}</Text>
          <ToggleRow
            label={isVi ? 'Xuất hóa đơn điện tử' : 'Issue e-invoice'}
            value={invoice}
            onValueChange={setInvoice}
            color={colors.primary}
          />
          <ToggleRow
            label={isVi ? 'Tính vào doanh thu chịu thuế' : 'Include in taxable revenue'}
            value={taxable}
            onValueChange={setTaxable}
            color={colors.primary}
            last
          />
          <View style={styles.attachRow}>
            <TouchableOpacity style={[styles.attachBox, { borderColor: colors.border }]}>
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={[styles.attachText, { color: colors.text }]}>{isVi ? 'Chụp phiếu' : 'Snap receipt'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.attachBox, { borderColor: colors.border }]}>
              <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
              <Text style={[styles.attachText, { color: colors.text }]}>{isVi ? 'Tải file' : 'Upload'}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  color,
  last,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  color: string;
  last?: boolean;
}) {
  const { colors } = useThemeMode();

  return (
    <View style={[styles.toggleRow, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: `${color}66` }} thumbColor={value ? color : '#f4f3f4'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  iconBtn: { padding: 2 },
  headerCopy: { flex: 1 },
  headerTitle: { ...Typography.h3, fontWeight: '700' },
  headerSub: { ...Typography.label, marginTop: 2, fontFamily: 'monospace' },
  recordBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full },
  recordText: { ...Typography.bodyMd, color: '#fff', fontWeight: '700' },
  scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: 40, gap: 10 },
  segmentCard: { marginTop: 2 },
  typeRow: { flexDirection: 'row', gap: 4 },
  typeBtn: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  typeLabel: { ...Typography.bodyMd, fontWeight: '800' },
  typeLabelActive: { color: '#fff' },
  amountCard: { alignItems: 'center', borderRadius: Radius.lg },
  amountLabel: { ...Typography.label, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  amountVal: { ...Typography.h1, color: '#fff', fontSize: 32, letterSpacing: -0.5, fontFamily: 'monospace' },
  amountHint: { ...Typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: 3, fontStyle: 'italic', textAlign: 'center' },
  sectionLabel: { ...Typography.label, marginBottom: 8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catItem: {
    width: '31.9%',
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  catLabel: { ...Typography.caption, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  twoCols: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },
  monoInput: { fontFamily: 'monospace' },
  accountRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  accountChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  accountLabel: { ...Typography.captionMd, textAlign: 'center' },
  accountLabelActive: { color: '#fff', fontWeight: '700' },
  toggleRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { ...Typography.bodyMd, flex: 1, paddingRight: 12 },
  attachRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  attachBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
  },
  attachText: { ...Typography.captionMd, fontWeight: '700', marginTop: 4 },
});
