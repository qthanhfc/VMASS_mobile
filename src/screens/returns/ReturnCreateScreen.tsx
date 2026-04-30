import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, useThemeMode } from '../../theme';
import { FormField, Card, SectionHeader } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';

const REASONS = [
  { key: 'defective', labelKey: 'returns.reason.defective' },
  { key: 'wrongSize', labelKey: 'returns.reason.wrongSize' },
  { key: 'expired', labelKey: 'returns.reason.expired' },
  { key: 'wrongItem', labelKey: 'returns.reason.wrongItem' },
  { key: 'notAsDescribed', labelKey: 'returns.reason.notAsDescribed' },
  { key: 'other', labelKey: 'returns.reason.other' },
] as const;
const REFUND_METHODS = [
  { key: 'cash', labelKey: 'bookkeeping.entry.account.cash' },
  { key: 'bankTransfer', labelKey: 'returns.refund.bankTransfer' },
  { key: 'loyaltyPoints', labelKey: 'returns.refund.loyaltyPoints' },
] as const;

export function ReturnCreateScreen() {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [orderNum, setOrderNum] = useState('');
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('returns.createTitle')}</Text>
        <TouchableOpacity style={styles.saveBtn}><Text style={styles.saveTxt}>{t('returns.createAction')}</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 16, paddingBottom: 40 }}>
        <Card padding={14}>
          <SectionHeader title={t('returns.originalOrder')} />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <FormField label={t('returns.orderCode')} value={orderNum} onChangeText={setOrderNum} placeholder="DH00000001" />
            </View>
            <TouchableOpacity style={styles.searchBtn}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </Card>

        <Card padding={14}>
          <SectionHeader title={t('returns.reasonTitle')} />
          <View style={styles.reasonGrid}>
            {REASONS.map(r => (
              <TouchableOpacity key={r.key} onPress={() => setReason(r.key)}
                style={[styles.reasonChip, reason === r.key && styles.reasonActive]}>
                <Text style={[styles.reasonLabel, reason === r.key && { color: '#fff' }]}>{t(r.labelKey as TranslationKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card padding={14}>
          <SectionHeader title={t('returns.refundMethodTitle')} />
          <View style={styles.methodRow}>
            {REFUND_METHODS.map(m => (
              <TouchableOpacity key={m.key} onPress={() => setRefundMethod(m.key)}
                style={[styles.methodChip, refundMethod === m.key && styles.methodActive]}>
                <Text style={[styles.methodLabel, refundMethod === m.key && { color: '#fff' }]}>{t(m.labelKey as TranslationKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card padding={14}>
          <FormField label={t('returns.notes')} value={notes} onChangeText={setNotes} placeholder={t('returns.notesPlaceholder')} multiline numberOfLines={3} />
        </Card>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('returns.refundAmount')}</Text>
          <Text style={styles.summaryVal}>0 {t('home.currency')}</Text>
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
  searchBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  reasonChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  reasonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  reasonLabel: { ...Typography.captionMd, color: Colors.textSecondary },
  methodRow: { flexDirection: 'column', gap: 8, marginTop: 8 },
  methodChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  methodActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodLabel: { ...Typography.bodyMd, color: Colors.textSecondary },
  summaryCard: { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: 16, alignItems: 'center' },
  summaryLabel: { ...Typography.captionMd, color: Colors.primary },
  summaryVal: { ...Typography.h2, color: Colors.primary, marginTop: 4 },
});
