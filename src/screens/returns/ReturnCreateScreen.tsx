import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { FormField, Card } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const REASONS = [
  { key: 'defective', labelKey: 'returns.reason.defective' },
  { key: 'notSatisfied', labelKey: 'returns.reason.notSatisfied' },
  { key: 'wrongSize', labelKey: 'returns.reason.wrongSize' },
  { key: 'expired', labelKey: 'returns.reason.expired' },
  { key: 'other', labelKey: 'returns.reason.other' },
] as const;

const REFUND_METHODS: Array<{
  key: 'cash' | 'bankTransfer' | 'exchange';
  icon: IoniconName;
  labelKey?: TranslationKey;
}> = [
  { key: 'cash', icon: 'cash-outline', labelKey: 'bookkeeping.entry.account.cash' },
  { key: 'bankTransfer', icon: 'card-outline', labelKey: 'returns.refund.bankTransfer' },
  { key: 'exchange', icon: 'swap-horizontal-outline' },
];

const RETURN_ITEMS = [
  {
    id: 'SP-1120',
    name: 'Áo thun unisex size M',
    sku: 'SP-1120',
    qty: 1,
    price: 285000,
    reason: 'Lỗi đường may',
    selected: true,
  },
  {
    id: 'SP-1145',
    name: 'Quần jeans slim fit',
    sku: 'SP-1145',
    qty: 1,
    price: 420000,
    reason: '',
    selected: false,
  },
];

const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

export function ReturnCreateScreen() {
  const { colors } = useThemeMode();
  const { locale, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [orderNum, setOrderNum] = useState('DH-2412-0842');
  const [reason, setReason] = useState<(typeof REASONS)[number]['key']>('defective');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'bankTransfer' | 'exchange'>('cash');
  const [notes, setNotes] = useState('Đường may gấu áo bị bung, khách yêu cầu trả.');
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    Object.fromEntries(RETURN_ITEMS.map(item => [item.id, item.selected]))
  );

  const selectedCount = useMemo(
    () => RETURN_ITEMS.filter(item => selectedItems[item.id]).length,
    [selectedItems]
  );
  const refundTotal = useMemo(
    () => RETURN_ITEMS.reduce((sum, item) => (selectedItems[item.id] ? sum + item.price : sum), 0),
    [selectedItems]
  );

  const paperDim = colors.background === Colors.background ? '#f8f7f3' : 'rgba(255,255,255,0.06)';
  const accentDim = colors.background === Colors.background ? Colors.primaryLight : 'rgba(0,142,204,0.16)';
  const mutedBorder = colors.background === Colors.background ? '#d2cec4' : colors.border;

  const sectionTitle = (icon: IoniconName, title: string) => (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={15} color={colors.textSecondary} />
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );

  const toggleItem = (id: string) => {
    setSelectedItems(current => ({ ...current, [id]: !current[id] }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('returns.createTitle')}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>#TH-2412-009 · {t('returns.status.pending')}</Text>
        </View>
        <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.createTxt}>{t('returns.createAction')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card padding={14} style={styles.card}>
          {sectionTitle('receipt-outline', t('returns.originalOrder'))}
          <View style={styles.orderSearchRow}>
            <View style={styles.orderInputWrap}>
              <FormField
                label={locale === 'vi' ? 'Tìm đơn gốc (mã / SĐT khách)' : 'Find order'}
                value={orderNum}
                onChangeText={setOrderNum}
                placeholder="DH-2412-0842"
                style={[styles.monoInput, { borderColor: colors.primary }]}
              />
            </View>
            <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="scan-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={[styles.customerCard, { backgroundColor: paperDim }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>NL</Text>
            </View>
            <View style={styles.customerMain}>
              <Text style={[styles.customerName, { color: colors.text }]}>Nguyễn Thị Lan</Text>
              <Text style={[styles.customerMeta, { color: colors.textSecondary }]}>
                0908 123 456 · {locale === 'vi' ? 'mua 3 ngày trước' : '3 days ago'}
              </Text>
            </View>
            <Text style={[styles.orderTotal, { color: colors.primary }]}>705K</Text>
          </View>
        </Card>

        <Card padding={0} style={styles.card}>
          <View style={[styles.cardHeader, { borderBottomColor: mutedBorder }]}>
            {sectionTitle('bag-handle-outline', locale === 'vi' ? 'CHỌN SẢN PHẨM TRẢ' : 'ITEMS TO RETURN')}
          </View>
          {RETURN_ITEMS.map((item, index) => {
            const selected = selectedItems[item.id];
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.78}
                style={[
                  styles.returnItem,
                  { borderTopColor: mutedBorder, opacity: selected ? 1 : 0.55 },
                  index === 0 && styles.firstReturnItem,
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {selected && <Ionicons name="checkmark" size={15} color="#fff" />}
                </View>
                <View style={[styles.thumb, { backgroundColor: paperDim, borderColor: mutedBorder }]}>
                  <Text style={[styles.thumbTxt, { color: colors.textSecondary }]}>img</Text>
                </View>
                <View style={styles.itemMain}>
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.itemSku, { color: colors.textSecondary }]}>{item.sku}</Text>
                  <View style={styles.itemMetaRow}>
                    <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                      SL: <Text style={[styles.itemMetaStrong, { color: colors.text }]}>{item.qty}</Text>
                    </Text>
                    {item.reason ? (
                      <Text style={[styles.itemReason, { color: colors.danger }]} numberOfLines={1}>{item.reason}</Text>
                    ) : null}
                    <Text style={[styles.itemPrice, { color: colors.primary }]}>{Math.round(item.price / 1000)}K</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </Card>

        <Card padding={14} style={styles.card}>
          {sectionTitle('help-circle-outline', t('returns.reasonTitle'))}
          <View style={styles.reasonGrid}>
            {REASONS.map(r => {
              const selected = reason === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  onPress={() => setReason(r.key)}
                  style={[
                    styles.reasonChip,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? accentDim : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.reasonLabel, { color: selected ? colors.primary : colors.text }]}>{t(r.labelKey as TranslationKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <FormField
            label={locale === 'vi' ? 'Mô tả chi tiết' : 'Details'}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('returns.notesPlaceholder')}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />
          <View style={styles.photoRow}>
            {['photo 1', 'photo 2'].map(label => (
              <View key={label} style={[styles.photoBox, { backgroundColor: paperDim, borderColor: mutedBorder }]}>
                <Text style={[styles.photoText, { color: colors.textSecondary }]}>{label}</Text>
              </View>
            ))}
            <TouchableOpacity style={[styles.addPhotoBox, { borderColor: colors.border }]}>
              <Ionicons name="add" size={20} color={colors.textSecondary} />
              <Text style={[styles.addPhotoText, { color: colors.textSecondary }]}>{locale === 'vi' ? 'Ảnh' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card padding={14} style={styles.card}>
          {sectionTitle('wallet-outline', t('returns.refundMethodTitle'))}
          <View style={styles.methodRow}>
            {REFUND_METHODS.map(method => {
              const selected = refundMethod === method.key;
              const label = method.labelKey ? t(method.labelKey) : locale === 'vi' ? 'Đổi hàng' : 'Exchange';
              return (
                <TouchableOpacity
                  key={method.key}
                  onPress={() => setRefundMethod(method.key)}
                  style={[
                    styles.methodCard,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? accentDim : 'transparent',
                    },
                  ]}
                >
                  <Ionicons name={method.icon} size={20} color={selected ? colors.primary : colors.text} />
                  <Text style={[styles.methodLabel, { color: selected ? colors.primary : colors.text }]} numberOfLines={2}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.summaryLabel}>{locale === 'vi' ? 'TỔNG HOÀN KHÁCH' : 'TOTAL REFUND'}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryVal}>{money(refundTotal)}</Text>
            <Text style={styles.summaryCount}>
              {selectedCount} {locale === 'vi' ? 'sản phẩm' : 'item'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
  },
  closeBtn: { padding: 2 },
  headerMain: { flex: 1 },
  headerTitle: { ...Typography.h3, fontWeight: '700' },
  headerSub: { ...Typography.caption, fontFamily: 'monospace', marginTop: 1 },
  createBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.primary, borderRadius: Radius.full },
  createTxt: { ...Typography.bodyMd, color: '#fff', fontWeight: '700' },
  content: { paddingHorizontal: 12, paddingBottom: 40, gap: 10 },
  card: { borderRadius: Radius.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle: { ...Typography.label, textTransform: 'uppercase', color: Colors.textSecondary },
  orderSearchRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  orderInputWrap: { flex: 1 },
  monoInput: { fontFamily: 'monospace', fontWeight: '600' },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  customerCard: { marginTop: -2, padding: 10, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...Typography.bodyMd, color: '#fff', fontWeight: '800' },
  customerMain: { flex: 1 },
  customerName: { ...Typography.bodyMd, fontWeight: '700' },
  customerMeta: { ...Typography.caption, marginTop: 1 },
  orderTotal: { ...Typography.h4, fontFamily: 'monospace', fontWeight: '800' },
  cardHeader: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 2, borderBottomWidth: 1, borderStyle: 'dashed' },
  returnItem: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderStyle: 'dashed' },
  firstReturnItem: { borderTopWidth: 0 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  thumb: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  thumbTxt: { ...Typography.caption, fontFamily: 'monospace' },
  itemMain: { flex: 1, minWidth: 0 },
  itemName: { ...Typography.bodySm, fontWeight: '700' },
  itemSku: { ...Typography.caption, fontFamily: 'monospace', marginTop: 1 },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  itemMeta: { ...Typography.caption },
  itemMetaStrong: { fontFamily: 'monospace', fontWeight: '700' },
  itemReason: { ...Typography.caption, flex: 1, fontStyle: 'italic' },
  itemPrice: { ...Typography.bodySm, fontFamily: 'monospace', fontWeight: '800', marginLeft: 'auto' },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  reasonChip: {
    width: '48.9%',
    minHeight: 36,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  reasonLabel: { ...Typography.captionMd, fontWeight: '700', textAlign: 'center' },
  notesInput: { minHeight: 68, textAlignVertical: 'top' },
  photoRow: { flexDirection: 'row', gap: 6, marginTop: -4 },
  photoBox: { width: 60, height: 60, borderRadius: Radius.md, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  photoText: { ...Typography.caption, fontFamily: 'monospace' },
  addPhotoBox: { width: 60, height: 60, borderRadius: Radius.md, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 3 },
  addPhotoText: { ...Typography.caption, fontWeight: '700' },
  methodRow: { flexDirection: 'row', gap: 6 },
  methodCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  methodLabel: { ...Typography.captionMd, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  summaryCard: { borderRadius: Radius.lg, padding: 14, backgroundColor: Colors.primary, ...Shadow.md },
  summaryLabel: { ...Typography.label, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  summaryVal: { fontSize: 26, fontWeight: '800', color: '#fff', fontFamily: 'monospace' },
  summaryCount: { ...Typography.captionMd, color: 'rgba(255,255,255,0.85)' },
});
