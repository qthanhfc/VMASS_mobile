import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { Header, Card } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import { useRealtimeRefresh } from '../../realtime';
import { getCachedOrderDetail, getOrderDetail, type OrderDetail } from '../../services';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type Route = RouteProp<ManageStackParamList, 'OrderDetail'>;
type TimelineStatus = 'pending' | 'paid' | 'packing' | 'shipping' | 'done';

const STATUS_STEPS: TimelineStatus[] = ['pending', 'paid', 'packing', 'shipping', 'done'];
const STEP_LABEL_KEYS: TranslationKey[] = ['orders.step.order', 'orders.step.payment', 'orders.step.packing', 'orders.step.shipping', 'orders.step.done'];

const STATUS_BADGE: Record<TimelineStatus, { labelKey: TranslationKey; bg: string; color: string }> = {
  pending: { labelKey: 'orders.status.pending', bg: Colors.warningLight, color: Colors.warning },
  paid: { labelKey: 'orders.status.paid', bg: Colors.primaryLight, color: Colors.primary },
  packing: { labelKey: 'orders.status.packing', bg: Colors.primaryLight, color: Colors.primary },
  shipping: { labelKey: 'orders.status.shipping', bg: '#efedf7', color: '#6f5f96' },
  done: { labelKey: 'orders.status.delivered', bg: Colors.successLight, color: Colors.success },
};

function initials(name: string): string {
  const value = name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
  return value || 'K';
}

function compactMoney(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return `${value}`;
}

export function OrderDetailScreen() {
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const orderId = route.params?.id;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDetail = useCallback(async () => {
    if (!orderId) {
      setError('Không tìm thấy mã hóa đơn.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const detail = await getOrderDetail(orderId);
      setOrder(detail);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải chi tiết hóa đơn.';
      setError(message);

      const cached = await getCachedOrderDetail(orderId);
      if (cached) {
        setOrder(cached);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);
  useRealtimeRefresh(['orders', 'inventory', 'products'], loadDetail);

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : 0;
  const progressPercent = `${(Math.max(0, currentStep) / (STATUS_STEPS.length - 1)) * 100}%` as `${number}%`;
  const statusBadge = order ? STATUS_BADGE[order.status] : STATUS_BADGE.pending;
  const shouldShowStatus = Boolean(order && order.channel !== 'pos');
  const money = (value: number) => `${value.toLocaleString(dateLocale)} ${t('home.currency')}`;
  const customerMeta = order
    ? [order.tableLabel, order.channelLabel, order.paymentLabel].filter(Boolean).join(' · ')
    : '';

  if (loading && !order) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title={t('orders.title')} onBack={() => nav.goBack()} />
        <View style={styles.emptyWrap}>
          <Ionicons name="receipt-outline" size={44} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error || 'Không tìm thấy hóa đơn.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadDetail}>
            <Text style={styles.retryText}>Tải lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={`#${order.orderNumber}`}
        subtitle={order.fromCache ? `${order.createdAt} · dữ liệu đã lưu` : order.createdAt}
        onBack={() => nav.goBack()}
        rightActions={
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="print-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {shouldShowStatus ? (
          <Card style={styles.card}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardTitle}>{t('orders.detail.statusTitle')}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>● {t(statusBadge.labelKey)}</Text>
              </View>
            </View>

            <View style={styles.timelineWrap}>
              <View style={styles.timelineBaseLine} />
              <View style={[styles.timelineActiveLine, { width: progressPercent }]} />

              <View style={styles.timelineStepsRow}>
                {STEP_LABEL_KEYS.map((labelKey, index) => {
                  const active = index <= currentStep;
                  return (
                    <View key={labelKey} style={styles.timelineStep}>
                      <View style={[styles.timelineDot, active && styles.timelineDotActive]}>
                        <Text style={[styles.timelineDotText, active && styles.timelineDotTextActive]}>
                          {active ? '✓' : `${index + 1}`}
                        </Text>
                      </View>
                      <Text style={styles.timelineLabel}>{t(labelKey)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <View style={styles.customerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials(order.customerName)}</Text>
            </View>

            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{order.customerName}</Text>
              <Text style={styles.customerMeta}>{customerMeta || order.customerPhone || order.channelLabel}</Text>
            </View>

            <TouchableOpacity style={styles.messageBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.card}>
          <TouchableOpacity
            style={[styles.linkDebtBtn, { borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() =>
              nav.navigate('DebtInvoiceMain', {
                search: order.orderNumber || order.customerPhone || order.customerName,
                filter: 'receivable',
              })
            }
          >
            <View style={styles.linkDebtLeft}>
              <Ionicons name="document-text-outline" size={17} color={Colors.primary} />
              <Text style={styles.linkDebtText}>{t('debtInvoice.viewRelated' as never)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        <View>
          <Text style={styles.sectionTitle}>{t('orders.detail.products', { count: order.items.length })}</Text>
          <Card style={styles.listCard} padding={0}>
            {order.items.map((item, index) => (
              <View key={`${item.productName}-${index}`}>
                <View style={styles.itemRow}>
                  <View style={styles.itemThumb}>
                    <Text style={styles.itemThumbText}>{item.productName[0]}</Text>
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                    <Text style={styles.itemMeta}>{compactMoney(item.price)} × {item.qty}</Text>
                  </View>

                  <Text style={styles.itemTotal}>{compactMoney(item.price * item.qty)}</Text>
                </View>
                {index < order.items.length - 1 && <DashedSeparator />}
              </View>
            ))}
          </Card>
        </View>

        <Card style={styles.card}>
          <View style={styles.summaryRows}>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>{t('orders.detail.subtotal')}</Text>
              <Text style={styles.sumValue}>{money(order.subtotal)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>
                {t('orders.detail.discount')}{order.discountLabel ? ` (${order.discountLabel})` : ''}
              </Text>
              <Text style={[styles.sumValue, order.discount > 0 && styles.sumValueDiscount]}>
                {order.discount > 0 ? `- ${money(order.discount)}` : money(0)}
              </Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Thuế{order.taxFeeLabel ? ` (${order.taxFeeLabel})` : ''}</Text>
              <Text style={styles.sumValue}>{money(order.taxFee)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Phí khác{order.feeOtherLabel ? ` (${order.feeOtherLabel})` : ''}</Text>
              <Text style={styles.sumValue}>{money(order.feeOther)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>{t('orders.detail.shippingFee')}</Text>
              <Text style={styles.sumValue}>{money(order.shipping)}</Text>
            </View>
          </View>

          <View style={styles.totalDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('orders.detail.total')}</Text>
            <Text style={styles.totalValue}>{money(order.total)}</Text>
          </View>
          <Text style={styles.paymentText}>Thanh toán: {order.paymentLabel}</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

function DashedSeparator() {
  return (
    <View style={styles.separatorWrap}>
      {Array.from({ length: 24 }).map((_, index) => (
        <View key={index} style={styles.separatorDash} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    letterSpacing: 0.4,
  },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusBadgeText: {
    ...Typography.label,
    fontSize: 10,
    fontWeight: '800',
  },
  timelineWrap: {
    position: 'relative',
    paddingTop: 6,
  },
  timelineBaseLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 16,
    height: 2,
    backgroundColor: Colors.border,
  },
  timelineActiveLine: {
    position: 'absolute',
    left: 10,
    top: 16,
    height: 2,
    backgroundColor: Colors.primary,
  },
  timelineStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineStep: {
    width: 40,
    alignItems: 'center',
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
  },
  timelineDotActive: {
    backgroundColor: Colors.primary,
  },
  timelineDotText: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '800',
  },
  timelineDotTextActive: {
    color: '#fff',
  },
  timelineLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    fontSize: 10,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.bodyMd,
    color: Colors.primary,
    fontWeight: '800',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...Typography.bodyMd,
    color: Colors.text,
    fontWeight: '700',
  },
  customerMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  messageBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkDebtBtn: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkDebtLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkDebtText: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '700',
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  listCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  separatorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 62,
    marginRight: 12,
    marginTop: 1,
    marginBottom: 1,
  },
  separatorDash: {
    width: 6,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: Colors.textSecondary,
    opacity: 0.28,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemThumb: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemThumbText: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '700',
  },
  itemMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  itemTotal: {
    ...Typography.bodyMd,
    color: Colors.text,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRows: {
    gap: 8,
    marginBottom: 10,
  },
  sumLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  sumValue: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '700',
  },
  sumValueDiscount: {
    color: Colors.accent,
  },
  totalDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '800',
  },
  totalValue: {
    ...Typography.h2,
    color: Colors.primary,
    fontWeight: '800',
  },
  paymentText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 10,
  },
  emptyText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  retryText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
});
