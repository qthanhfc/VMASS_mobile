import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { Card, StatusBadge } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';

const HISTORY = [
  { id: 1, period: 'Q4/2025', type: 'GTGT', amount: 2400000, dueDate: '31/01/2026', status: 'pending' },
  { id: 2, period: 'Q4/2025', type: 'TNCN', amount: 800000, dueDate: '31/01/2026', status: 'pending' },
  { id: 3, period: 'Q3/2025', type: 'GTGT', amount: 1850000, dueDate: '31/10/2025', status: 'done' },
  { id: 4, period: 'Q3/2025', type: 'TNCN', amount: 620000, dueDate: '31/10/2025', status: 'done' },
  { id: 5, period: 'Q2/2025', type: 'GTGT', amount: 2100000, dueDate: '31/07/2025', status: 'done' },
];

export function TaxScreen() {
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const currency = t('home.currency');
  const money = (amount: number) => `${amount.toLocaleString(dateLocale)} ${currency}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('tax.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 14, paddingBottom: 40 }}>
        {/* Alert card */}
        <View style={styles.alertCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="warning" size={20} color={Colors.warning} />
            <Text style={styles.alertTitle}>{t('tax.dueTitle', { period: 'Q4/2025', date: '31/01/2026' })}</Text>
          </View>
          <View style={styles.alertRow}>
            <View style={styles.alertStat}>
              <Text style={styles.alertLabel}>{t('tax.vat')}</Text>
              <Text style={styles.alertVal}>{money(2400000)}</Text>
            </View>
            <View style={styles.alertDivider} />
            <View style={styles.alertStat}>
              <Text style={styles.alertLabel}>{t('tax.personalIncome')}</Text>
              <Text style={styles.alertVal}>{money(800000)}</Text>
            </View>
            <View style={styles.alertDivider} />
            <View style={styles.alertStat}>
              <Text style={styles.alertLabel}>{t('tax.totalPayable')}</Text>
              <Text style={[styles.alertVal, { color: Colors.warning, fontWeight: '700' }]}>{money(3200000)}</Text>
            </View>
          </View>
        </View>

        {/* Summary */}
        <Card padding={14}>
          <Text style={styles.sectionLabel}>{t('tax.summaryTitle')}</Text>
          {[
            { label: t('tax.taxableRevenue'), value: money(48250000) },
            { label: t('tax.vatDue'), value: money(2400000) },
            { label: t('tax.personalTaxableIncome'), value: money(32000000) },
            { label: t('tax.personalIncomeDue'), value: money(800000) },
          ].map(r => (
            <View key={r.label} style={styles.sumRow}>
              <Text style={styles.sumLabel}>{r.label}</Text>
              <Text style={styles.sumVal}>{r.value}</Text>
            </View>
          ))}
        </Card>

        {/* Quick actions */}
        <View style={styles.actionGrid}>
          {[
            { icon: 'document-text-outline', labelKey: 'tax.action.create' as TranslationKey, color: Colors.primary },
            { icon: 'time-outline', labelKey: 'tax.action.history' as TranslationKey, color: Colors.success },
            { icon: 'download-outline', labelKey: 'tax.action.downloadTemplate' as TranslationKey, color: Colors.warning },
          ].map(a => (
            <TouchableOpacity key={a.labelKey} style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: a.color + '22' }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{t(a.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filing history */}
        <Text style={styles.sectionLabel}>{t('tax.historyTitle')}</Text>
        <Card padding={0}>
          {HISTORY.map((h, i) => (
            <View key={h.id} style={[styles.histRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.histPeriod}>{t('tax.historyPeriod', { period: h.period, type: h.type })}</Text>
                <Text style={styles.histDate}>{t('tax.dueDate', { date: h.dueDate })}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.histAmt}>{money(h.amount)}</Text>
                <StatusBadge status={h.status} label={t(h.status === 'done' ? 'tax.status.done' : 'tax.status.pending')} />
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3 },
  alertCard: { backgroundColor: Colors.warningLight, borderRadius: Radius.lg, padding: 14, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  alertTitle: { ...Typography.bodyMd, color: Colors.warning },
  alertRow: { flexDirection: 'row' },
  alertStat: { flex: 1, alignItems: 'center' },
  alertLabel: { ...Typography.caption, color: Colors.textSecondary },
  alertVal: { ...Typography.bodyMd, marginTop: 2 },
  alertDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8 },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, letterSpacing: 0.6 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sumLabel: { ...Typography.body, color: Colors.textSecondary },
  sumVal: { ...Typography.bodyMd },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, alignItems: 'center', ...Shadow.sm },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { ...Typography.captionMd, textAlign: 'center' },
  histRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  histPeriod: { ...Typography.bodyMd },
  histDate: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  histAmt: { ...Typography.bodyMd, color: Colors.primary },
});
