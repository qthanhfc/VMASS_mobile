import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, Header } from '../../components';
import { useLanguage } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import { Colors, Radius, Spacing, Typography, useThemeMode } from '../../theme';
import { getDebtInvoiceDetail, type DebtInvoiceDetail } from '../../services';
import { useRealtimeRefresh } from '../../realtime';

type Route = RouteProp<ManageStackParamList, 'DebtInvoiceDetail'>;
type Nav = NativeStackNavigationProp<ManageStackParamList, 'DebtInvoiceDetail'>;

function formatDate(iso: string, locale: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '--';
  return `${parsed.toLocaleDateString(locale)} ${parsed.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
}

export function DebtInvoiceDetailScreen() {
  const { colors } = useThemeMode();
  const { t, dateLocale } = useLanguage();
  const route = useRoute<Route>();
  const nav = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<DebtInvoiceDetail | null>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getDebtInvoiceDetail(route.params.id);
      setDetail(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('debtInvoice.error.loadDetail' as never));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [route.params.id, t]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useRealtimeRefresh(
    ['orders', 'customers', 'inventory'],
    loadDetail,
    { debounceMs: 500 },
  );

  const statusColor = useMemo(() => {
    if (!detail) return Colors.primary;
    if (detail.status === 'settled') return Colors.success;
    if (detail.status === 'overdue') return Colors.warning;
    return Colors.primary;
  }, [detail]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title={t('debtInvoice.detailTitle' as never)} onBack={() => nav.goBack()} />
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: Colors.danger }]}>{error || t('debtInvoice.empty' as never)}</Text>
          <TouchableOpacity onPress={loadDetail}>
            <Text style={styles.retryText}>{t('products.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={t('debtInvoice.detailTitle' as never)}
        subtitle={`${detail.code} · ${t(`debtInvoice.status.${detail.status}` as never)}`}
        onBack={() => nav.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card padding={Spacing.md}>
          <Text style={styles.sectionTitle}>{t('debtInvoice.sourceDocument' as never)}</Text>
          <TouchableOpacity
            style={[styles.sourceBtn, { borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => {
              if (detail.sourceType === 'order') {
                nav.navigate('OrderDetail', { id: detail.sourceId });
                return;
              }
              nav.navigate('SupplierEdit', { id: detail.sourceId });
            }}
          >
            <View style={styles.sourceBtnLeft}>
              <Ionicons
                name={detail.sourceType === 'order' ? 'receipt-outline' : 'business-outline'}
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.sourceBtnText}>
                {detail.sourceType === 'order'
                  ? t('debtInvoice.openOrder' as never)
                  : t('debtInvoice.openSupplier' as never)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        <Card padding={Spacing.md}>
          <View style={styles.rowBetween}>
            <Text style={styles.labelText}>{t('debtInvoice.party' as never)}</Text>
            <Text style={styles.valueText}>{detail.partyName}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.labelText}>{t('debtInvoice.kindLabel' as never)}</Text>
            <Text style={[styles.valueText, { color: detail.kind === 'receivable' ? Colors.success : Colors.danger }]}>
              {t(`debtInvoice.kind.${detail.kind}` as never)}
            </Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.labelText}>{t('debtInvoice.statusLabel' as never)}</Text>
            <Text style={[styles.valueText, { color: statusColor }]}>{t(`debtInvoice.status.${detail.status}` as never)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.labelText}>{t('debtInvoice.issueLabel' as never)}</Text>
            <Text style={styles.valueText}>{formatDate(detail.issueDate, dateLocale)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.labelText}>{t('debtInvoice.dueLabel' as never)}</Text>
            <Text style={styles.valueText}>{formatDate(detail.dueDate, dateLocale)}</Text>
          </View>
        </Card>

        <Card padding={Spacing.md}>
          <View style={styles.rowBetween}>
            <Text style={styles.labelText}>{t('debtInvoice.totalAmount' as never)}</Text>
            <Text style={styles.valueText}>{detail.totalAmount.toLocaleString(dateLocale)} {t('home.currency')}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.labelText}>{t('debtInvoice.paidAmount' as never)}</Text>
            <Text style={[styles.valueText, { color: Colors.success }]}>{detail.paidAmount.toLocaleString(dateLocale)} {t('home.currency')}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.labelText}>{t('debtInvoice.remainingAmount' as never)}</Text>
            <Text style={[styles.valueText, { color: detail.kind === 'receivable' ? Colors.success : Colors.danger }]}>
              {detail.remainingAmount.toLocaleString(dateLocale)} {t('home.currency')}
            </Text>
          </View>
        </Card>

        <Card padding={Spacing.md}>
          <Text style={styles.sectionTitle}>{t('debtInvoice.transactions' as never)}</Text>
          {detail.transactions.length === 0 ? (
            <Text style={styles.emptyNote}>{t('debtInvoice.noTransactions' as never)}</Text>
          ) : (
            detail.transactions.map((tx, index) => (
              <View
                key={tx.id}
                style={[styles.txRow, index < detail.transactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <View>
                  <Text style={styles.txTitle}>{tx.amount.toLocaleString(dateLocale)} {t('home.currency')}</Text>
                  <Text style={styles.txMeta}>{t(`debtInvoice.paymentMethod.${tx.method}` as never)} · {formatDate(tx.paidAt, dateLocale)}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {detail.remainingAmount > 0 ? (
        <TouchableOpacity
          style={styles.fabPill}
          onPress={() => nav.navigate('DebtInvoicePayment', { id: detail.id })}
        >
          <Ionicons name="wallet-outline" size={17} color="#fff" />
          <Text style={styles.fabText}>{t('debtInvoice.recordPayment' as never)}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  content: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 100 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 34 },
  labelText: { ...Typography.captionMd, color: Colors.textSecondary },
  valueText: { ...Typography.bodyMd, color: Colors.text, fontWeight: '700' },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: 4 },
  emptyNote: { ...Typography.caption, color: Colors.textSecondary, fontStyle: 'italic' },
  txRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txTitle: { ...Typography.bodyMd, color: Colors.text, fontWeight: '700' },
  txMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  sourceBtn: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  sourceBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceBtnText: {
    ...Typography.bodyMd,
    color: Colors.text,
    fontWeight: '700',
  },
  errorText: { ...Typography.bodySm, textAlign: 'center' },
  retryText: { ...Typography.captionMd, color: Colors.primary, marginTop: 8, fontWeight: '700' },
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
