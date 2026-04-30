import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { FAB } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

const PERIOD_CHIPS = [
  { key: 'month', labelKey: 'bookkeeping.period.month' },
  { key: 'quarter', labelKey: 'bookkeeping.period.quarter' },
  { key: 'year', labelKey: 'bookkeeping.period.year' },
];

const LEDGERS = [
  { key: 'sales', labelKey: 'bookkeeping.ledger.sales', countKey: 'bookkeeping.ledger.salesCount', icon: 'cart-outline', amount: '420M', color: Colors.success },
  { key: 'purchase', labelKey: 'bookkeeping.ledger.purchase', countKey: 'bookkeeping.ledger.purchaseCount', icon: 'bag-handle-outline', amount: '268M', color: '#5c83b2' },
  { key: 'cash', labelKey: 'bookkeeping.ledger.cash', countKey: 'bookkeeping.ledger.cashCount', icon: 'wallet-outline', amount: '+152M', color: '#b0855e' },
  { key: 'debt', labelKey: 'bookkeeping.ledger.debt', countKey: 'bookkeeping.ledger.debtCount', icon: 'cash-outline', amount: '15M', color: Colors.accent },
  { key: 'stock', labelKey: 'bookkeeping.ledger.stock', countKey: 'bookkeeping.ledger.stockCount', icon: 'cube-outline', amount: '248M', color: '#99765f' },
  { key: 'payroll', labelKey: 'bookkeeping.ledger.payroll', countKey: 'bookkeeping.ledger.payrollCount', icon: 'people-outline', amount: '86M', color: '#8a6a9e' },
];

export function BookkeepingScreen() {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [period, setPeriod] = useState('quarter');

  const isQuarter = period === 'quarter';
  const periodRange = isQuarter ? '01/10 — 31/12/2025' : period === 'month' ? '01/12 — 31/12/2025' : '01/01 — 31/12/2025';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('bookkeeping.title')}</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="download-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.periodCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.periodLeft}>
            <View style={styles.periodIconWrap}>
              <Ionicons name="calendar-outline" size={16} color={Colors.accent} />
            </View>
            <View>
              <Text style={[styles.periodTitle, { color: colors.text }]}>{t('bookkeeping.reportPeriod')}</Text>
              <Text style={[styles.periodRange, { color: colors.textSecondary }]}>{periodRange}</Text>
            </View>
          </View>
          <View style={styles.periodSwitch}>
            {PERIOD_CHIPS.map((chip) => {
              const active = chip.key === period;
              return (
                <TouchableOpacity
                  key={chip.key}
                  style={[styles.periodChip, { backgroundColor: colors.card, borderColor: colors.border }, active && styles.periodChipActive]}
                  onPress={() => setPeriod(chip.key)}
                >
                  <Text style={[styles.periodChipLabel, { color: colors.textSecondary }, active && styles.periodChipLabelActive]}>{t(chip.labelKey as TranslationKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.plCard}>
          <Text style={[styles.plTitle, { color: 'rgba(255,255,255,0.88)' }]}>{t('bookkeeping.plTitle')}</Text>
          <View style={styles.profitRow}>
            <View>
              <Text style={[styles.profitLabel, { color: 'rgba(255,255,255,0.85)' }]}>{t('bookkeeping.netProfit')}</Text>
              <Text style={[styles.profitValue, { color: '#fff' }]}>+62.4M</Text>
            </View>
            <Text style={styles.profitTrend}>▲ 18.2%</Text>
          </View>
          <View style={styles.plGrid}>
            {[
              { label: t('bookkeeping.revenue'), value: '420M' },
              { label: t('bookkeeping.costOfGoods'), value: '268M' },
              { label: t('bookkeeping.expense'), value: '89.6M' },
              { label: t('tax.personalIncome'), value: '6.3M' },
            ].map((item) => (
              <View key={item.label} style={styles.plGridItem}>
                <Text style={[styles.plGridLabel, { color: 'rgba(255,255,255,0.85)' }]}>{item.label}</Text>
                <Text style={[styles.plGridValue, { color: '#fff' }]}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('bookkeeping.detailLedgers')}</Text>
          <View style={styles.ledgerGrid}>
            {LEDGERS.map((ledger) => (
              <TouchableOpacity key={ledger.key} style={[styles.ledgerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.ledgerIcon, { backgroundColor: ledger.color + '22', borderColor: ledger.color }]}>
                  <Ionicons name={ledger.icon as any} size={18} color={ledger.color} />
                </View>
                <Text style={[styles.ledgerLabel, { color: colors.text }]}>{t(ledger.labelKey as TranslationKey)}</Text>
                <Text style={[styles.ledgerCount, { color: colors.textSecondary }]}>{t(ledger.countKey as TranslationKey)}</Text>
                <Text style={[styles.ledgerAmount, { color: ledger.color }]}>{ledger.amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actionRow}>
          {[
            { key: 'excel', icon: 'download-outline', labelKey: 'bookkeeping.action.exportExcel' as TranslationKey },
            { key: 'print', icon: 'print-outline', labelKey: 'bookkeeping.action.printReport' as TranslationKey },
            { key: 'tax', icon: 'cloud-upload-outline', labelKey: 'bookkeeping.action.submitTax' as TranslationKey },
          ].map((action) => (
            <TouchableOpacity key={action.key} style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={action.icon as any} size={20} color={Colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>{t(action.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <FAB onPress={() => nav.navigate('BookkeepingEntry')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3, flex: 1 },
  iconBtn: { padding: 4 },
  content: { padding: Spacing.lg, gap: 14, paddingBottom: 96 },
  periodCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  periodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  periodIconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.md,
    backgroundColor: Colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTitle: { ...Typography.captionMd },
  periodRange: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  periodSwitch: { flexDirection: 'row', gap: 6 },
  periodChip: {
    flex: 1,
    height: 30,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  periodChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodChipLabel: { ...Typography.captionMd, color: Colors.textSecondary },
  periodChipLabelActive: { color: '#fff' },
  plCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: 14,
    ...Shadow.md,
  },
  plTitle: { ...Typography.label, color: 'rgba(255,255,255,0.84)', marginBottom: 8 },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  profitLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.85)' },
  profitValue: { ...Typography.h1, color: '#fff', marginTop: 2 },
  profitTrend: { ...Typography.bodyMd, color: '#ffd968', marginBottom: 4 },
  plGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  plGridItem: {
    width: '48.8%',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: 'rgba(255,255,255,0.16)',
    padding: 8,
  },
  plGridLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.85)' },
  plGridValue: { ...Typography.h4, color: '#fff', marginTop: 1 },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: 8 },
  ledgerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ledgerCard: {
    width: '48.3%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    ...Shadow.sm,
  },
  ledgerIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  ledgerLabel: { ...Typography.captionMd, color: Colors.text },
  ledgerCount: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  ledgerAmount: { ...Typography.h4, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  actionLabel: { ...Typography.captionMd, marginTop: 4 },
});
