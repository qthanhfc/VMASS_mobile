import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, FormField, Header } from '../../components';
import { useLanguage } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import { Colors, Radius, Spacing, Typography, useThemeMode } from '../../theme';
import { createDebtInvoicePayment, getDebtInvoiceDetail, type DebtInvoiceTransaction } from '../../services';

type Route = RouteProp<ManageStackParamList, 'DebtInvoicePayment'>;
type Nav = NativeStackNavigationProp<ManageStackParamList, 'DebtInvoicePayment'>;

const METHODS: DebtInvoiceTransaction['method'][] = ['cash', 'bank', 'card', 'other'];

export function DebtInvoicePaymentScreen() {
  const { colors } = useThemeMode();
  const { t, dateLocale } = useLanguage();
  const route = useRoute<Route>();
  const nav = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<DebtInvoiceTransaction['method']>('cash');
  const [note, setNote] = useState('');
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const detail = await getDebtInvoiceDetail(route.params.id);
        setRemaining(detail.remainingAmount);
        setAmount(String(detail.remainingAmount));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [route.params.id]);

  const save = async () => {
    const value = Number(amount.replace(/[^\d]/g, ''));
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert(t('common.error'), t('debtInvoice.error.invalidAmount' as never));
      return;
    }
    if (value > remaining) {
      Alert.alert(t('common.error'), t('debtInvoice.error.exceedAmount' as never));
      return;
    }

    setSaving(true);
    try {
      await createDebtInvoicePayment({
        invoiceId: route.params.id,
        amount: value,
        method,
        note,
      });
      Alert.alert(t('debtInvoice.paymentSuccessTitle' as never), t('debtInvoice.paymentSuccessMessage' as never));
      nav.replace('DebtInvoiceDetail', { id: route.params.id });
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('debtInvoice.error.payment' as never));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('debtInvoice.paymentTitle' as never)} onBack={() => nav.goBack()} />
      {loading ? (
        <View style={styles.center}>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('products.loading')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Card padding={Spacing.md}>
            <Text style={styles.outstandingLabel}>{t('debtInvoice.remainingAmount' as never)}</Text>
            <Text style={styles.outstandingValue}>{remaining.toLocaleString(dateLocale)} {t('home.currency')}</Text>
          </Card>

          <Card padding={Spacing.md}>
            <FormField
              label={t('debtInvoice.paymentAmount' as never)}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
            />
            <Text style={styles.methodsLabel}>{t('debtInvoice.paymentMethodTitle' as never)}</Text>
            <View style={styles.methodsRow}>
              {METHODS.map((item) => {
                const selected = method === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.methodChip,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      selected && styles.methodChipActive,
                    ]}
                    onPress={() => setMethod(item)}
                  >
                    <Text style={[styles.methodLabel, { color: colors.textSecondary }, selected && styles.methodLabelActive]}>
                      {t(`debtInvoice.paymentMethod.${item}` as never)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <FormField
              label={t('debtInvoice.note' as never)}
              value={note}
              onChangeText={setNote}
              placeholder={t('debtInvoice.notePlaceholder' as never)}
            />
          </Card>
        </ScrollView>
      )}

      <TouchableOpacity style={[styles.fabPill, saving && { opacity: 0.7 }]} disabled={saving} onPress={save}>
        <Ionicons name="save-outline" size={17} color="#fff" />
        <Text style={styles.fabText}>{saving ? t('productEdit.saving') : t('common.save')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { ...Typography.captionMd },
  content: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 100 },
  outstandingLabel: { ...Typography.captionMd, color: Colors.textSecondary },
  outstandingValue: { ...Typography.h3, color: Colors.primary, marginTop: 4 },
  methodsLabel: { ...Typography.captionMd, color: Colors.textSecondary, marginBottom: 8 },
  methodsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  methodChip: {
    minWidth: 88,
    height: 34,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodLabel: { ...Typography.captionMd },
  methodLabelActive: { color: '#fff', fontWeight: '700' },
  fabPill: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  fabText: { ...Typography.bodySm, color: '#fff', fontWeight: '700' },
});
