import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { Header } from '../../components';
import { useLanguage } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import { useRealtimeRefresh } from '../../realtime';
import { Customer, Order } from '../../types';
import { getCustomerDetail, type CustomerDetail, type CustomerOrderHistory, type CustomerTopProduct } from '../../services';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type RouteParams = {
  CustomerEdit: { id?: number; phone?: string };
};

const TIERS: Customer['tier'][] = ['VIP', 'Gold', 'Silver', 'Normal'];

function compactMoney(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  return `${value}`;
}

function formatVnd(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function channelLabel(channel: Order['channel'] | 'pos'): string {
  const map: Record<Order['channel'], string> = {
    pos: 'POS',
    shopee: 'Shopee',
    lazada: 'Lazada',
    tiktok: 'TikTok',
    tiki: 'Tiki',
    website: 'Web',
  };
  return map[channel];
}

function shortDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const day = `${d.getDate()}`.padStart(2, '0');
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${day}/${month}`;
}

export function CustomerEditScreen() {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RouteParams, 'CustomerEdit'>>();
  const editId = route.params?.id;
  const editPhone = route.params?.phone;
  const hasIdentity = editId !== undefined || Boolean(editPhone);
  const isEdit = hasIdentity;
  const [loading, setLoading] = useState(isEdit);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);

  const loadDetail = useCallback(async () => {
    if (!hasIdentity) return;
    try {
      const data = await getCustomerDetail({ id: editId, phone: editPhone });
      setDetail(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải dữ liệu khách hàng.';
      Alert.alert(t('common.error'), message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally {
      setLoading(false);
    }
  }, [editId, editPhone, hasIdentity, navigation, t]);

  useEffect(() => {
    let isMounted = true;
    if (!hasIdentity) return;

    (async () => {
      try {
        const data = await getCustomerDetail({ id: editId, phone: editPhone });
        if (!isMounted) return;
        setDetail(data);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Không thể tải dữ liệu khách hàng.';
        Alert.alert(t('common.error'), message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [editId, editPhone, hasIdentity, navigation, t]);
  useRealtimeRefresh(['customers', 'orders'], () => {
    if (!hasIdentity) return;
    void loadDetail();
  });

  const existing = detail?.customer ?? null;

  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [birthday, setBirthday] = useState(existing?.birthday ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [tier, setTier] = useState<Customer['tier']>(existing?.tier ?? 'Normal');
  const [points, setPoints] = useState(String(existing?.points ?? '0'));
  const [notes, setNotes] = useState(existing?.notes ?? '');

  useEffect(() => {
    if (!existing) return;
    setName(existing.name || '');
    setPhone(existing.phone || '');
    setEmail(existing.email || '');
    setAddress(existing.address || '');
    setTier(existing.tier || 'Normal');
    setPoints(String(existing.points || 0));
    setNotes(existing.notes || '');
  }, [existing]);

  const customerOrders = useMemo(() => (detail?.orders || []).slice(0, 3), [detail]);
  const topProducts = useMemo(() => (detail?.topProducts || []).slice(0, 5), [detail]);

  const tags = detail?.tags ?? [];

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('customers.error.nameRequired'));
      return;
    }
    if (!phone.trim()) {
      Alert.alert(t('common.error'), t('customers.error.phoneRequired'));
      return;
    }

    Alert.alert(t('profile.successTitle'), t(isEdit ? 'customers.updated' : 'customers.created'), [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(t('customers.deleteTitle'), t('customers.deleteMessage', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('customers.deleteAction'), style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="person-circle-outline" size={36} color={colors.textSecondary} />
        <Text style={{ marginTop: 8, color: colors.textSecondary }}>{t('products.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title={t(isEdit ? 'customers.customer' : 'customers.addTitle')}
        subtitle={isEdit && detail ? t('customers.updatedAgo', { code: detail.code }) : undefined}
        onBack={() => navigation.goBack()}
        rightActions={
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.messageBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroAvatarWrap}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarText}>{initials(name || 'KH')}</Text>
              </View>
            </View>

            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, { color: '#fff' }]} numberOfLines={1}>{name || t('customers.newCustomer')}</Text>
              <Text style={[styles.heroSubline, { color: 'rgba(255,255,255,0.85)' }]}>
                {detail?.code ?? 'KH-MOI'} · {tier === 'VIP' ? t('customers.vipCustomer') : t('customers.tierLabel', { tier })}
              </Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatLabel, { color: 'rgba(255,255,255,0.8)' }]}>{t('customers.totalSpendShort')}</Text>
              <Text style={[styles.heroStatValue, { color: '#fff' }]}>{compactMoney(existing?.totalSpent ?? 0)}</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatLabel, { color: 'rgba(255,255,255,0.8)' }]}>{t('orders.title')}</Text>
              <Text style={[styles.heroStatValue, { color: '#fff' }]}>{existing?.orderCount ?? 0}</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatLabel, { color: 'rgba(255,255,255,0.8)' }]}>{t('customers.points')}</Text>
              <Text style={[styles.heroStatValue, { color: '#fff' }]}>{points}</Text>
            </View>
            <TouchableOpacity
              style={styles.heroStatItem}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('DebtInvoiceMain', {
                  search: existing?.phone || phone || existing?.name || name,
                  filter: 'receivable',
                })
              }
            >
              <Text style={[styles.heroStatLabel, { color: 'rgba(255,255,255,0.8)' }]}>Công nợ</Text>
              <Text style={[styles.heroStatValue, { color: '#fff' }]}>{compactMoney(existing?.debt ?? 0)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{t('customers.contactInfo')}</Text>

          <Field label={t('profile.fullname')} value={name} onChangeText={setName} placeholder="Nguyễn Văn A" />
          <Field label={t('customers.phoneShort')} value={phone} onChangeText={setPhone} placeholder="09xxxxxxxx" keyboardType="phone-pad" mono />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label={t('profile.birthDate')} value={birthday} onChangeText={setBirthday} placeholder="dd/mm/yyyy" />
          <Field label={t('profile.address')} value={address} onChangeText={setAddress} placeholder="123 Nguyễn Huệ, Q.1, TP.HCM" multiline numberOfLines={2} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{t('customers.tags')}</Text>
          <View style={styles.tagWrap}>
            {tags.map((tag, idx) => {
              const active = idx === 0;
              return (
                <View key={tag} style={[styles.tagChip, { backgroundColor: colors.background, borderColor: colors.border }, active && styles.tagChipPrimary]}>
                  <Text style={[styles.tagText, { color: colors.text }, active && styles.tagTextPrimary]}>{tag}</Text>
                </View>
              );
            })}
            <View style={[styles.tagAddChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.tagAddText, { color: colors.textSecondary }]}>+ {t('customers.addTag')}</Text>
            </View>
          </View>

          <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{t('customers.customerTier')}</Text>
          <View style={styles.tierWrap}>
            {TIERS.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setTier(item)}
                style={[styles.tierChip, { backgroundColor: colors.card, borderColor: colors.border }, tier === item && styles.tierChipActive]}
              >
                <Text style={[styles.tierChipText, { color: colors.textSecondary }, tier === item && styles.tierChipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {customerOrders.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{t('customers.purchaseHistory')}</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('OrdersList', {
                    customerPhone: existing?.phone || phone,
                    customerName: existing?.name || name,
                  })
                }
              >
                <Text style={styles.cardAction}>{t('manage.viewAll')} →</Text>
              </TouchableOpacity>
            </View>

            {customerOrders.map((order, index) => (
              <View key={order.id}>
                {index > 0 && <View style={styles.orderSeparator} />}
                <TouchableOpacity
                  style={styles.orderRow}
                  onPress={() => navigation.navigate('OrderDetail', { id: order.id })}
                >
                  <Text style={[styles.orderCode, { color: colors.text }]}>#{order.orderNumber}</Text>
                  <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{shortDate(order.createdAt)}</Text>
                  <Text style={[styles.orderItems, { color: colors.textSecondary }]}>{t('customers.productCountShort', { count: order.itemCount || 1 })} · {channelLabel(order.channel)}</Text>
                  <Text style={[styles.orderAmount, { color: colors.text }]}>{compactMoney(order.total)}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {topProducts.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Top 5 sản phẩm đã mua</Text>
            </View>

            {topProducts.map((product: CustomerTopProduct, index: number) => (
              <View key={`${product.productId}:${product.productName}`}>
                {index > 0 && <View style={styles.orderSeparator} />}
                <View style={styles.topProductRow}>
                  <View style={styles.topProductMain}>
                    <Text style={[styles.topProductName, { color: colors.text }]} numberOfLines={1}>
                      {index + 1}. {product.productName}
                    </Text>
                    <Text style={[styles.topProductMeta, { color: colors.textSecondary }]}>
                      {product.quantity} SP · {product.orderCount} đơn · TB {formatVnd(product.avgPrice)}
                    </Text>
                  </View>
                  <Text style={[styles.topProductSpent, { color: colors.primary }]}>{formatVnd(product.totalSpent)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{t('returns.notes')}</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('customers.notesPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {isEdit && (
          <TouchableOpacity onPress={handleDelete} style={styles.dangerBox}>
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
            <Text style={styles.dangerText}>{t('customers.deleteTitle')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  mono?: boolean;
};

function Field({ label, mono, multiline, numberOfLines, style, ...props }: FieldProps) {
  const { colors } = useThemeMode();

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.fieldInput,
          mono && styles.fieldInputMono,
          multiline && styles.fieldInputMultiline,
          { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 14,
    ...Shadow.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: '#fff',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,142,204,0.12)',
  },
  heroAvatarText: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '800',
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    ...Typography.h4,
    color: '#fff',
    fontWeight: '800',
  },
  heroSubline: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  heroStats: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  heroStatItem: {
    flex: 1,
  },
  heroStatLabel: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    letterSpacing: 0.2,
  },
  heroStatValue: {
    ...Typography.h4,
    color: '#fff',
    fontWeight: '800',
    marginTop: 1,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardAction: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '700',
  },
  fieldWrap: {
    marginTop: 6,
  },
  fieldLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginBottom: 5,
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
  fieldInputMono: {
    fontFamily: 'monospace',
  },
  fieldInputMultiline: {
    minHeight: 64,
    paddingTop: 10,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tagChipPrimary: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  tagText: {
    ...Typography.captionMd,
    color: Colors.text,
    fontWeight: '700',
  },
  tagTextPrimary: {
    color: '#fff',
  },
  tagAddChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tagAddText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  subLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  tierWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tierChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tierChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tierChipText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  tierChipTextActive: {
    color: '#fff',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  orderSeparator: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
  },
  orderCode: {
    ...Typography.captionMd,
    color: Colors.text,
    fontFamily: 'monospace',
    fontWeight: '700',
    minWidth: 72,
  },
  orderDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    minWidth: 38,
  },
  orderItems: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  orderAmount: {
    ...Typography.bodySm,
    fontWeight: '800',
  },
  topProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
  },
  topProductMain: {
    flex: 1,
  },
  topProductName: {
    ...Typography.captionMd,
    fontWeight: '700',
  },
  topProductMeta: {
    ...Typography.caption,
    marginTop: 2,
  },
  topProductSpent: {
    ...Typography.bodySm,
    fontWeight: '800',
  },
  notesInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    minHeight: 72,
    padding: 10,
    color: Colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  dangerBox: {
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dangerText: {
    ...Typography.bodyMd,
    color: Colors.danger,
    fontWeight: '700',
  },
});
