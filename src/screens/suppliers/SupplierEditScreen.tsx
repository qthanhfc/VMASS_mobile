import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, useThemeMode } from '../../theme';
import { FormField, Card, SectionHeader } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';

type Route = RouteProp<ManageStackParamList, 'SupplierEdit'>;
const PAYMENT_TERMS: { value: string; labelKey: TranslationKey }[] = [
  { value: 'Thanh toán ngay', labelKey: 'suppliers.payment.immediate' },
  { value: 'Net 15', labelKey: 'suppliers.payment.net15' },
  { value: 'Net 30', labelKey: 'suppliers.payment.net30' },
  { value: 'Net 45', labelKey: 'suppliers.payment.net45' },
  { value: 'Net 60', labelKey: 'suppliers.payment.net60' },
];

export function SupplierEditScreen() {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const route = useRoute<Route>();
  const isEdit = !!route.params?.id;
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', contactPerson: '', paymentTerms: 'Net 30', creditLimit: '', category: '' });
  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t(isEdit ? 'suppliers.editTitle' : 'suppliers.addTitle')}</Text>
        <TouchableOpacity style={styles.saveBtn}><Text style={styles.saveTxt}>{t('common.save')}</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 16, paddingBottom: 40 }}>
        {/* Logo upload */}
        <TouchableOpacity style={styles.logoUpload}>
          <Ionicons name="cloud-upload-outline" size={28} color={Colors.textSecondary} />
          <Text style={styles.uploadLabel}>{t('suppliers.uploadLogo')}</Text>
        </TouchableOpacity>

        <Card padding={14}>
          <SectionHeader title={t('suppliers.generalInfo')} />
          <FormField label={t('suppliers.nameRequired')} value={form.name} onChangeText={set('name')} placeholder={t('suppliers.namePlaceholder')} />
          <FormField label={t('suppliers.category')} value={form.category} onChangeText={set('category')} placeholder={t('suppliers.categoryPlaceholder')} />
        </Card>

        <Card padding={14}>
          <SectionHeader title={t('suppliers.contact')} />
          <FormField label={t('profile.phone')} value={form.phone} onChangeText={set('phone')} placeholder="028 1234 5678" keyboardType="phone-pad" />
          <FormField label="Email" value={form.email} onChangeText={set('email')} placeholder="contact@supplier.vn" keyboardType="email-address" />
          <FormField label={t('profile.address')} value={form.address} onChangeText={set('address')} placeholder={t('suppliers.addressPlaceholder')} multiline />
          <FormField label={t('suppliers.contactPerson')} value={form.contactPerson} onChangeText={set('contactPerson')} placeholder={t('suppliers.contactPersonPlaceholder')} />
        </Card>

        <Card padding={14}>
          <SectionHeader title={t('suppliers.paymentTerms')} />
          <Text style={styles.fieldLabel}>{t('suppliers.term')}</Text>
          <View style={styles.termGrid}>
            {PAYMENT_TERMS.map(term => (
              <TouchableOpacity key={term.value} onPress={() => setForm(p => ({ ...p, paymentTerms: term.value }))}
                style={[styles.termChip, form.paymentTerms === term.value && styles.termChipActive]}>
                <Text style={[styles.termLabel, form.paymentTerms === term.value && { color: '#fff' }]}>{t(term.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormField label={t('suppliers.creditLimit')} value={form.creditLimit} onChangeText={set('creditLimit')} placeholder="50.000.000" keyboardType="numeric" />
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
