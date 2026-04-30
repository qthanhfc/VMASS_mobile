import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, useThemeMode } from '../../theme';
import { FormField, Card } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';

const INCOME_CATS = [
  { key: 'sales', icon: 'cart-outline', labelKey: 'bookkeeping.entry.cat.sales' },
  { key: 'otherRevenue', icon: 'trending-up-outline', labelKey: 'bookkeeping.entry.cat.otherRevenue' },
  { key: 'commission', icon: 'gift-outline', labelKey: 'bookkeeping.entry.cat.commission' },
  { key: 'collectDebt', icon: 'wallet-outline', labelKey: 'bookkeeping.entry.cat.collectDebt' },
  { key: 'refund', icon: 'refresh-outline', labelKey: 'bookkeeping.entry.cat.refund' },
  { key: 'other', icon: 'add-circle-outline', labelKey: 'bookkeeping.entry.cat.other' },
] as const;
const EXPENSE_CATS = [
  { key: 'purchase', icon: 'bag-handle-outline', labelKey: 'bookkeeping.entry.cat.purchase' },
  { key: 'salary', icon: 'people-outline', labelKey: 'bookkeeping.entry.cat.salary' },
  { key: 'rent', icon: 'home-outline', labelKey: 'bookkeeping.entry.cat.rent' },
  { key: 'utilities', icon: 'flash-outline', labelKey: 'bookkeeping.entry.cat.utilities' },
  { key: 'shipping', icon: 'car-outline', labelKey: 'bookkeeping.entry.cat.shipping' },
  { key: 'other', icon: 'remove-circle-outline', labelKey: 'bookkeeping.entry.cat.other' },
] as const;
const ACCOUNTS = [
  { key: 'cash', labelKey: 'bookkeeping.entry.account.cash' },
  { key: 'bank', labelKey: 'bookkeeping.entry.account.bank' },
  { key: 'creditCard', labelKey: 'bookkeeping.entry.account.creditCard' },
] as const;

export function BookkeepingEntryScreen() {
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [account, setAccount] = useState('cash');
  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('bookkeeping.entry.title')}</Text>
        <TouchableOpacity style={styles.saveBtn}><Text style={styles.saveTxt}>{t('common.save')}</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Type toggle */}
        <View style={styles.typeRow}>
          <TouchableOpacity onPress={() => setType('income')} style={[styles.typeBtn, { backgroundColor: colors.card, borderColor: colors.border }, type === 'income' && styles.typeBtnActiveIncome]}>
            <Ionicons name="trending-up" size={18} color={type === 'income' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.typeLabel, { color: colors.text }, type === 'income' && { color: '#fff' }]}>{t('bookkeeping.entry.income')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setType('expense')} style={[styles.typeBtn, { backgroundColor: colors.card, borderColor: colors.border }, type === 'expense' && styles.typeBtnActiveExpense]}>
            <Ionicons name="trending-down" size={18} color={type === 'expense' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.typeLabel, { color: colors.text }, type === 'expense' && { color: '#fff' }]}>{t('bookkeeping.entry.expense')}</Text>
          </TouchableOpacity>
        </View>

        {/* Amount display */}
        <View style={[styles.amountDisplay, { backgroundColor: type === 'income' ? Colors.success : Colors.danger }]}>
          <Text style={styles.amountLabel}>{t(type === 'income' ? 'bookkeeping.entry.incomeAmount' : 'bookkeeping.entry.expenseAmount')}</Text>
          <Text style={styles.amountVal}>{amount ? Number(amount.replace(/\D/g, '')).toLocaleString(dateLocale) : '0'} {t('home.currency')}</Text>
        </View>

        <View style={{ padding: Spacing.lg, gap: 16 }}>
          <View>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('bookkeeping.entry.category')}</Text>
            <View style={styles.catGrid}>
              {cats.map(c => (
                <TouchableOpacity key={c.key} onPress={() => setCategory(c.key)}
                  style={[styles.catItem, { backgroundColor: colors.card, borderColor: colors.border }, category === c.key && styles.catItemActive]}>
                  <Ionicons name={c.icon as any} size={22} color={category === c.key ? Colors.primary : colors.textSecondary} />
                  <Text style={[styles.catLabel, { color: colors.textSecondary }, category === c.key && { color: Colors.primary }]}>{t(c.labelKey as TranslationKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Card padding={14}>
            <FormField label={t('bookkeeping.entry.amountLabel')} value={amount} onChangeText={setAmount} placeholder="1.000.000" keyboardType="numeric" />
            <FormField label={t('bookkeeping.entry.description')} value={desc} onChangeText={setDesc} placeholder={t('bookkeeping.entry.descriptionPlaceholder')} />
            <FormField label={t('bookkeeping.entry.partner')} value="" onChangeText={() => {}} placeholder={t('bookkeeping.entry.partnerPlaceholder')} />
          </Card>

          <View>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('bookkeeping.entry.account')}</Text>
            <View style={styles.accountRow}>
              {ACCOUNTS.map(a => (
                <TouchableOpacity key={a.key} onPress={() => setAccount(a.key)}
                  style={[styles.accountChip, { backgroundColor: colors.card, borderColor: colors.border }, account === a.key && styles.accountActive]}>
                  <Text style={[styles.accountLabel, { color: colors.textSecondary }, account === a.key && { color: '#fff' }]}>{t(a.labelKey as TranslationKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
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
  typeRow: { flexDirection: 'row', margin: Spacing.lg, gap: 8 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  typeBtnActiveIncome: { backgroundColor: Colors.success, borderColor: Colors.success },
  typeBtnActiveExpense: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  typeLabel: { ...Typography.bodyMd, color: Colors.textSecondary },
  amountDisplay: { alignItems: 'center', paddingVertical: 24, marginHorizontal: Spacing.lg, borderRadius: Radius.lg },
  amountLabel: { ...Typography.captionMd, color: 'rgba(255,255,255,0.8)' },
  amountVal: { ...Typography.h1, color: '#fff', marginTop: 4 },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, letterSpacing: 0.6, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catItem: { alignItems: 'center', width: '28%', padding: 12, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  catItemActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  catLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  accountRow: { flexDirection: 'row', gap: 8 },
  accountChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  accountActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  accountLabel: { ...Typography.captionMd, color: Colors.textSecondary },
});
