import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import { useLanguage } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import { createSupplier, deleteSupplier, getSupplierDetail, getSupplierImportLogs, paySupplierItemDebt, updateSupplier } from '../../services';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type Route = RouteProp<ManageStackParamList, 'SupplierEdit'>;

const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

const compactMoney = (value: number) => {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
};

const formatShortDate = (value: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = `${d.getDate()}`.padStart(2, '0');
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(word => word[0]?.toUpperCase())
    .join('') || 'NCC';

const toSupplierCode = (code?: string, id?: string) =>
  (code && code.trim()) || (id ? `NCC-${id.slice(0, 8).toUpperCase()}` : 'NCC-MOI');

const generateDraftSupplierCode = () => {
  const seed = Date.now().toString(36).toUpperCase().slice(-8);
  return `NCC-${seed}`;
};

export function SupplierEditScreen() {
  const { colors } = useThemeMode();
  const { locale, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const supplierId = String(route.params?.id || '').trim();
  const isEdit = supplierId.length > 0;
  const vi = locale === 'vi';
  const placeholderColor =
    colors.text === Colors.textDark ? 'rgba(244,241,232,0.6)' : 'rgba(26,26,26,0.45)';
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [currentDebt, setCurrentDebt] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [purchaseValue, setPurchaseValue] = useState(0);
  const [lastImportAt, setLastImportAt] = useState('');
  const [showAllImportsModal, setShowAllImportsModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payItem, setPayItem] = useState<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    amount: number;
    paid: number;
    pending: number;
  } | null>(null);
  const [suppliedItems, setSuppliedItems] = useState<Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    amount: number;
    paid: number;
    pending: number;
  }>>([]);
  const [importEntries, setImportEntries] = useState<Array<{
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    totalIncome: number;
    paidAtImport: number;
    logType: string;
    date: string;
    time: string;
    createdAt: string;
  }>>([]);

  const [form, setForm] = useState({
    name: '',
    code: '',
    taxId: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    beneficiaryName: '',
    bankAccountNumber: '',
    bankName: '',
  });

  const loadDetail = async () => {
    const [detail, logs] = await Promise.all([getSupplierDetail(supplierId), getSupplierImportLogs(supplierId)]);
    setForm((prev) => ({
      ...prev,
      name: detail.name,
      code: toSupplierCode(detail.code, detail.id),
      phone: detail.phone,
      email: detail.email,
      address: detail.address,
      beneficiaryName: detail.beneficiaryName,
      bankAccountNumber: detail.bankAccountNumber,
      bankName: detail.bankName,
      contactPerson: detail.name || '',
    }));
    setCurrentDebt(detail.currentDebt);
    setTotalOrders(detail.totalOrders);
    setPurchaseValue(detail.totalIncome);
    setSuppliedItems(detail.items || []);
    setImportEntries((logs || []).filter((x) => x.logType.toLowerCase() !== 'payment'));
  };

  useEffect(() => {
    let isMounted = true;
    if (!isEdit) {
      setForm((prev) => ({ ...prev, code: generateDraftSupplierCode() }));
      return;
    }

    (async () => {
      try {
        const [detail, logs] = await Promise.all([getSupplierDetail(supplierId), getSupplierImportLogs(supplierId)]);
        if (!isMounted) return;

        setForm((prev) => ({
          ...prev,
          name: detail.name,
          code: toSupplierCode(detail.code, detail.id),
          phone: detail.phone,
          email: detail.email,
          address: detail.address,
          beneficiaryName: detail.beneficiaryName,
          bankAccountNumber: detail.bankAccountNumber,
          bankName: detail.bankName,
          contactPerson: detail.name || '',
        }));
        setCurrentDebt(detail.currentDebt);
        setTotalOrders(detail.totalOrders);
        setPurchaseValue(detail.totalIncome);
        setLastImportAt(detail.lastImportAt || '');
        setSuppliedItems(detail.items || []);
        setImportEntries((logs || []).filter((x) => x.logType.toLowerCase() !== 'payment'));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể tải dữ liệu nhà cung cấp.';
        Alert.alert(t('common.error'), message, [{ text: 'OK', onPress: () => nav.goBack() }]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isEdit, nav, supplierId, t]);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const supplierColor = Colors.accent;
  const statusLabel = vi ? 'Hoạt động' : 'Active';

  const historyStats = useMemo(
    () => [
      { label: vi ? 'Tổng đơn' : 'Total POs', value: String(totalOrders), color: colors.text },
      { label: vi ? 'Giá trị' : 'Value', value: compactMoney(purchaseValue), color: Colors.primary },
      { label: vi ? 'Lần nhập gần nhất' : 'Last import', value: formatShortDate(lastImportAt), color: colors.textSecondary },
    ],
    [colors.text, colors.textSecondary, lastImportAt, purchaseValue, totalOrders, vi]
  );

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert(t('common.error'), t('suppliers.nameRequired'));
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await updateSupplier({
          id: supplierId,
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          beneficiaryName: form.beneficiaryName,
          bankAccountNumber: form.bankAccountNumber,
          bankName: form.bankName,
        });
      } else {
        const created = await createSupplier({
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          beneficiaryName: form.beneficiaryName,
          bankAccountNumber: form.bankAccountNumber,
          bankName: form.bankName,
        });

        const generatedCode = toSupplierCode(created?.code, created?.id);
        setForm((prev) => ({ ...prev, code: generatedCode }));
        Alert.alert(
          vi ? 'Đã tạo' : 'Created',
          vi
            ? `Đã tạo nhà cung cấp thành công.\nMã NCC: ${generatedCode}`
            : `Supplier created successfully.\nCode: ${generatedCode}`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (created?.id) {
                  nav.replace('SupplierEdit', { id: created.id });
                  return;
                }
                nav.goBack();
              },
            },
          ],
        );
        return;
      }

      Alert.alert(
        vi ? 'Đã lưu' : 'Saved',
        vi ? 'Thông tin nhà cung cấp đã được cập nhật.' : 'Supplier profile has been updated.',
        [{ text: 'OK', onPress: () => nav.goBack() }]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu nhà cung cấp.';
      Alert.alert(t('common.error'), message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPayModal = (item: typeof suppliedItems[number]) => {
    setPayItem(item);
    setPayAmount(String(item.pending > 0 ? item.pending : ''));
    setShowPayModal(true);
  };

  const handlePayDebt = async () => {
    if (!payItem) return;
    const amount = Number(String(payAmount).replace(/[^\d]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert(t('common.error'), vi ? 'Số tiền thanh toán không hợp lệ.' : 'Invalid payment amount.');
      return;
    }
    if (amount > payItem.pending) {
      Alert.alert(t('common.error'), vi ? 'Số tiền vượt quá công nợ còn lại.' : 'Payment exceeds pending debt.');
      return;
    }

    try {
      setPaying(true);
      await paySupplierItemDebt({ itemId: payItem.id, amount });
      await loadDetail();
      setShowPayModal(false);
      setPayItem(null);
      setPayAmount('');
      Alert.alert(vi ? 'Thành công' : 'Success', vi ? 'Đã ghi nhận thanh toán.' : 'Payment recorded.');
    } catch (error) {
      const message = error instanceof Error ? error.message : (vi ? 'Không thể thanh toán.' : 'Payment failed.');
      Alert.alert(t('common.error'), message);
    } finally {
      setPaying(false);
    }
  };

  const handleDeleteSupplier = () => {
    if (!isEdit) return;

    Alert.alert(
      vi ? 'Xóa nhà cung cấp' : 'Delete supplier',
      vi ? 'Bạn có chắc muốn xóa nhà cung cấp này?' : 'Are you sure you want to delete this supplier?',
      [
        { text: vi ? 'Hủy' : 'Cancel', style: 'cancel' },
        {
          text: vi ? 'Xóa' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSupplier(supplierId);
              Alert.alert(vi ? 'Đã xóa' : 'Deleted', vi ? 'Nhà cung cấp đã được xóa.' : 'Supplier has been deleted.', [
                { text: 'OK', onPress: () => nav.goBack() },
              ]);
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : vi
                    ? 'Không thể xóa nhà cung cấp.'
                    : 'Unable to delete supplier.';
              Alert.alert(t('common.error'), message);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10, color: colors.textSecondary }}>
          {vi ? 'Đang tải nhà cung cấp...' : 'Loading supplier...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isEdit ? (vi ? 'Hồ sơ nhà cung cấp' : 'Supplier profile') : t('suppliers.addTitle')}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {(form.code || 'NCC-MOI')} · {statusLabel}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, saving && styles.saveBtnDisabled]} disabled={saving}>
          <Text style={styles.saveTxt}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.logoRow}>
            <TouchableOpacity style={[styles.logoBox, { backgroundColor: `${supplierColor}22`, borderColor: supplierColor }]}>
              <Text style={[styles.logoText, { color: supplierColor }]}>{initials(form.name)}</Text>
            </TouchableOpacity>
            <View style={styles.logoInfo}>
              <Text style={[styles.supplierName, { color: colors.text }]} numberOfLines={2}>
                {form.name || t('suppliers.namePlaceholder')}
              </Text>
              <Text style={[styles.uploadLabel, { color: colors.textSecondary }]}>{t('suppliers.uploadLogo')}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{t('suppliers.generalInfo')}</Text>
          <Field label={t('suppliers.nameRequired')} value={form.name} onChangeText={set('name')} placeholder={t('suppliers.namePlaceholder')} />
          <View style={styles.twoCol}>
            <Field
              label={vi ? 'Mã NCC' : 'Code'}
              value={form.code}
              onChangeText={set('code')}
              placeholder="NCC-001"
              mono
              editable={false}
              style={styles.readonlyInput}
            />
            <Field label={vi ? 'Mã số thuế' : 'Tax ID'} value={form.taxId} onChangeText={set('taxId')} placeholder="0301234567" keyboardType="numeric" mono />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>☎ {t('suppliers.contact')}</Text>
          <Field label={t('suppliers.contactPerson')} value={form.contactPerson} onChangeText={set('contactPerson')} placeholder={t('suppliers.contactPersonPlaceholder')} />
          <View style={styles.twoCol}>
            <Field label={t('profile.phone')} value={form.phone} onChangeText={set('phone')} placeholder="0903 456 789" keyboardType="phone-pad" mono />
            <Field label="Email" value={form.email} onChangeText={set('email')} placeholder="sales@supplier.vn" keyboardType="email-address" autoCapitalize="none" mono />
          </View>
          <Field label={t('profile.address')} value={form.address} onChangeText={set('address')} placeholder={t('suppliers.addressPlaceholder')} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>▣ {vi ? 'Thanh toán & công nợ' : 'Payment & credit'}</Text>
          <Field
            label={vi ? 'Tên người thụ hưởng' : 'Beneficiary name'}
            value={form.beneficiaryName}
            onChangeText={set('beneficiaryName')}
            placeholder={vi ? 'Nguyễn Văn A' : 'John Doe'}
          />
          <View style={styles.twoCol}>
            <Field
              label={vi ? 'Số tài khoản' : 'Account number'}
              value={form.bankAccountNumber}
              onChangeText={set('bankAccountNumber')}
              placeholder="0071..."
              keyboardType="numeric"
              mono
            />
            <Field
              label={vi ? 'Tên ngân hàng' : 'Bank name'}
              value={form.bankName}
              onChangeText={set('bankName')}
              placeholder="Vietcombank"
            />
          </View>

          <View style={[styles.debtBox, { backgroundColor: `${supplierColor}1F`, borderColor: supplierColor }]}>
            <View>
              <Text style={[styles.debtLabel, { color: colors.textSecondary }]}>{vi ? 'Công nợ hiện tại' : 'Current debt'}</Text>
              <Text style={[styles.debtValue, { color: supplierColor }]}>{formatMoney(currentDebt)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.payBtn, { backgroundColor: supplierColor }]}
              onPress={() =>
                nav.navigate('DebtInvoiceMain', {
                  search: form.name || form.phone || supplierId,
                  filter: 'payable',
                })
              }
            >
              <Text style={styles.payBtnText}>{vi ? 'Thanh toán' : 'Pay now'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.relatedDebtBtn, { borderColor: colors.border }]}
            onPress={() =>
              nav.navigate('DebtInvoiceMain', {
                search: form.name || form.phone || supplierId,
                filter: 'payable',
              })
            }
          >
            <Text style={styles.relatedDebtText}>{vi ? 'Xem công nợ liên quan' : 'View related debts'}</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>▦ {vi ? 'Lịch sử giao dịch' : 'Purchase history'}</Text>
          <View style={styles.historyGrid}>
            {historyStats.map(stat => (
              <View key={stat.label} style={[styles.historyStat, { backgroundColor: colors.background }]}>
                <Text style={[styles.historyValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={[styles.historyLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.viewAllBtn} onPress={() => setShowAllImportsModal(true)}>
            <Text style={styles.viewAllText}>
              {vi ? 'Xem tất cả đơn nhập →' : 'See all POs →'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            {vi ? 'Mặt hàng cung cấp' : 'Supplied items'}
          </Text>

          {suppliedItems.length === 0 ? (
            <Text style={[styles.emptyItemsText, { color: colors.textSecondary }]}>
              {vi ? 'Chưa có mặt hàng nào.' : 'No supplied items yet.'}
            </Text>
          ) : (
            suppliedItems.map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? <View style={styles.itemSeparator} /> : null}
                <View style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                      {vi ? 'SL nhập' : 'Qty'}: {item.quantity}
                      {item.unit ? ` ${item.unit}` : ''}
                    </Text>
                    <Text style={[styles.itemMeta, { color: item.pending > 0 ? Colors.danger : Colors.success }]}>
                      {vi ? 'Còn nợ' : 'Pending'}: {formatMoney(item.pending)}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={[styles.itemAmount, { color: Colors.primary }]}>
                      {formatMoney(item.amount)}
                    </Text>
                    {item.pending > 0 ? (
                      <TouchableOpacity style={styles.payItemBtn} onPress={() => handleOpenPayModal(item)}>
                        <Text style={styles.payItemBtnText}>{vi ? 'Thanh toán' : 'Pay'}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {isEdit ? (
          <TouchableOpacity style={styles.deleteSupplierBtn} onPress={handleDeleteSupplier}>
            <Text style={styles.deleteSupplierText}>{vi ? 'Xóa nhà cung cấp' : 'Delete supplier'}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <Modal transparent animationType="fade" visible={showPayModal} onRequestClose={() => setShowPayModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowPayModal(false)}>
          <Pressable style={[styles.payModal, { backgroundColor: colors.card }]} onPress={() => {}}>
            <Text style={[styles.payModalTitle, { color: colors.text }]}>
              {vi ? 'Thanh toán công nợ' : 'Pay supplier debt'}
            </Text>
            <Text style={[styles.payModalSub, { color: colors.textSecondary }]}>
              {payItem?.name || ''}
            </Text>
            <TextInput
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="numeric"
              placeholder={vi ? 'Nhập số tiền' : 'Enter amount'}
              placeholderTextColor={placeholderColor}
              style={[styles.payInput, { borderColor: colors.border, color: colors.text }]}
            />
            <View style={styles.payActions}>
              <TouchableOpacity style={styles.payCancelBtn} onPress={() => setShowPayModal(false)} disabled={paying}>
                <Text style={[styles.payCancelText, { color: colors.textSecondary }]}>{vi ? 'Hủy' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.payConfirmBtn, paying && styles.saveBtnDisabled]} onPress={handlePayDebt} disabled={paying}>
                <Text style={styles.payConfirmText}>{vi ? 'Xác nhận' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent animationType="fade" visible={showAllImportsModal} onRequestClose={() => setShowAllImportsModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAllImportsModal(false)}>
          <Pressable style={[styles.allImportsModal, { backgroundColor: colors.card }]} onPress={() => {}}>
            <View style={styles.allImportsHeader}>
              <Text style={[styles.allImportsTitle, { color: colors.text }]}>
                {vi ? 'Tất cả đơn nhập' : 'All purchase entries'}
              </Text>
              <TouchableOpacity onPress={() => setShowAllImportsModal(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.allImportsList} showsVerticalScrollIndicator={false}>
              {importEntries.length === 0 ? (
                <Text style={[styles.emptyItemsText, { color: colors.textSecondary }]}>
                  {vi ? 'Chưa có dữ liệu đơn nhập.' : 'No purchase entries yet.'}
                </Text>
              ) : (
                importEntries.map((entry, index) => (
                  <View key={`all-${entry.id}`}>
                    {index > 0 ? <View style={styles.itemSeparator} /> : null}
                    <View style={styles.importRow}>
                      <View style={styles.itemMain}>
                        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                          {entry.itemName}
                        </Text>
                        <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                          {vi ? 'Ngày nhập' : 'Import date'}: {formatShortDate(entry.date || entry.createdAt)}
                          {entry.time ? ` • ${entry.time}` : ''}
                        </Text>
                      </View>
                      <View style={styles.importRight}>
                        <Text style={[styles.importAmount, { color: Colors.primary }]}>
                          {formatMoney(entry.totalIncome)}
                        </Text>
                        <Text style={[styles.importMeta, { color: colors.textSecondary }]}>
                          {vi ? 'Thanh toán lúc nhập' : 'Paid at import'}: {formatMoney(entry.paidAtImport)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  mono?: boolean;
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
};

function Field({ label, mono, rightIcon, multiline, numberOfLines, style, ...props }: FieldProps) {
  const { colors } = useThemeMode();
  const placeholderColor =
    colors.text === Colors.textDark ? 'rgba(244,241,232,0.6)' : 'rgba(26,26,26,0.45)';

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          {...props}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.fieldInput,
            mono && styles.fieldInputMono,
            multiline && styles.fieldInputMultiline,
            rightIcon && styles.fieldInputWithIcon,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
            style,
          ]}
          placeholderTextColor={placeholderColor}
        />
        {rightIcon && (
          <Ionicons name={rightIcon} size={16} color={colors.textSecondary} style={styles.inputIcon} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 8,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerMain: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
  },
  headerSub: {
    ...Typography.caption,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveTxt: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
    gap: 10,
  },
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...Typography.h2,
    fontWeight: '800',
  },
  logoInfo: {
    flex: 1,
  },
  supplierName: {
    ...Typography.bodyMd,
    fontWeight: '700',
  },
  uploadLabel: {
    ...Typography.caption,
    marginTop: 3,
  },
  cardTitle: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldWrap: {
    flex: 1,
    marginTop: 6,
  },
  fieldLabel: {
    ...Typography.captionMd,
    marginBottom: 5,
  },
  inputWrap: {
    position: 'relative',
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
  fieldInputWithIcon: {
    paddingRight: 34,
  },
  fieldInputMono: {
    fontFamily: 'monospace',
  },
  fieldInputMultiline: {
    minHeight: 64,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  readonlyInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 13,
  },
  debtBox: {
    marginTop: 10,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  debtLabel: {
    ...Typography.captionMd,
  },
  debtValue: {
    ...Typography.h3,
    marginTop: 2,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  payBtn: {
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  payBtnText: {
    ...Typography.captionMd,
    color: '#fff',
    fontWeight: '700',
  },
  relatedDebtBtn: {
    marginTop: 10,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relatedDebtText: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '700',
  },
  historyGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  historyStat: {
    flex: 1,
    borderRadius: Radius.sm,
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  historyValue: {
    ...Typography.h4,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  historyLabel: {
    ...Typography.caption,
    fontSize: 10,
    marginTop: 1,
    textAlign: 'center',
  },
  viewAllBtn: {
    marginTop: 9,
    alignItems: 'center',
  },
  viewAllText: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyItemsText: {
    ...Typography.bodySm,
  },
  itemSeparator: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    ...Typography.bodySm,
    fontWeight: '700',
  },
  itemMeta: {
    ...Typography.caption,
    marginTop: 2,
  },
  itemAmount: {
    ...Typography.bodySm,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  payItemBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  payItemBtnText: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  payModal: {
    borderRadius: Radius.lg,
    padding: 14,
    ...Shadow.md,
  },
  payModalTitle: {
    ...Typography.bodyMd,
    fontWeight: '800',
  },
  payModalSub: {
    ...Typography.caption,
    marginTop: 4,
    marginBottom: 10,
  },
  payInput: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: '700',
  },
  payActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  payCancelBtn: {
    minWidth: 72,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payCancelText: {
    ...Typography.bodySm,
    fontWeight: '700',
  },
  payConfirmBtn: {
    minWidth: 96,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
  },
  payConfirmText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
  allImportsModal: {
    borderRadius: Radius.lg,
    padding: 14,
    maxHeight: '80%',
    ...Shadow.md,
  },
  allImportsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  allImportsTitle: {
    ...Typography.bodyMd,
    fontWeight: '800',
  },
  allImportsList: {
    marginTop: 4,
  },
  importRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
  },
  importRight: {
    alignItems: 'flex-end',
    minWidth: 120,
    gap: 2,
  },
  importAmount: {
    ...Typography.bodySm,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  importMeta: {
    ...Typography.caption,
  },
  deleteSupplierBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginTop: 2,
    marginBottom: 8,
  },
  deleteSupplierText: {
    ...Typography.bodySm,
    color: Colors.danger,
    fontWeight: '700',
  },
});
