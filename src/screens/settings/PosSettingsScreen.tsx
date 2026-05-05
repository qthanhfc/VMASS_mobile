import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components';
import type { SettingsStackParamList } from '../../navigation';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const categoryItems = ['Cà phê', 'Trà', 'Nước ngọt', 'Bánh mì', 'Mì tôm', 'Sữa', 'Bia', '+ Tạo'];

const layoutOptions = ['4 cột', '5 cột', '6 cột', 'Danh sách'];
const vatOptions = ['0%', '5%', '8%', '10%'];

const displaySettings = [
  { key: 'showImages', label: 'Hiển thị ảnh sản phẩm', description: 'Ảnh thu nhỏ trên ô bán hàng', value: true },
  { key: 'showStock', label: 'Hiển thị tồn kho', description: 'Cảnh báo nhanh khi gần hết hàng', value: true },
  { key: 'showCost', label: 'Hiển thị giá vốn (chỉ chủ)', description: 'Ẩn với nhân viên bán hàng', value: false },
] as const;

const behaviorSettings = [
  { key: 'autoPrint', label: 'Tự động in hóa đơn khi thanh toán', value: true },
  { key: 'cashDrawer', label: 'Mở ngăn kéo tiền tự động', value: true },
  { key: 'customerDisplay', label: 'Hiển thị màn hình khách hàng', value: false },
  { key: 'requireCustomer', label: 'Yêu cầu chọn khách trước khi tính', value: false },
  { key: 'manualDiscount', label: 'Cho phép giảm giá thủ công', value: true },
  { key: 'negativeStock', label: 'Cho phép bán âm tồn kho', value: false },
] as const;

const paymentMethods: Array<{
  key: string;
  name: string;
  subtitle: string;
  icon: IconName;
  color: string;
  value: boolean;
  locked?: boolean;
}> = [
  {
    key: 'cash',
    name: 'Tiền mặt',
    subtitle: 'Mặc định · luôn bật',
    icon: 'cash-outline',
    color: Colors.success,
    value: true,
    locked: true,
  },
  {
    key: 'momo',
    name: 'MoMo',
    subtitle: 'QR · 0903 456 789',
    icon: 'qr-code-outline',
    color: '#d82d8b',
    value: true,
  },
  {
    key: 'vnpay',
    name: 'VNPay QR',
    subtitle: 'Liên kết Vietcombank',
    icon: 'qr-code-outline',
    color: '#005baa',
    value: true,
  },
  {
    key: 'creditCard',
    name: 'Thẻ tín dụng',
    subtitle: 'POS Sumup · Visa/Master',
    icon: 'card-outline',
    color: '#1f2937',
    value: true,
  },
  {
    key: 'bankTransfer',
    name: 'Chuyển khoản',
    subtitle: 'VCB · 0071 0000 123456',
    icon: 'business-outline',
    color: '#6b8cae',
    value: false,
  },
];

const initialSwitches = [...displaySettings, ...behaviorSettings].reduce<Record<string, boolean>>(
  (acc, item) => {
    acc[item.key] = item.value;
    return acc;
  },
  {}
);

const initialPayments = paymentMethods.reduce<Record<string, boolean>>((acc, item) => {
  acc[item.key] = item.value;
  return acc;
}, {});

export function PosSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useThemeMode();
  const [layout, setLayout] = useState('4 cột');
  const [vat, setVat] = useState('8%');
  const [switches, setSwitches] = useState(initialSwitches);
  const [payments, setPayments] = useState(initialPayments);
  const [pricesIncludeVat, setPricesIncludeVat] = useState(true);
  const [autoInvoice, setAutoInvoice] = useState(true);

  const setSwitch = (key: string) => (value: boolean) => {
    setSwitches((current) => ({ ...current, [key]: value }));
  };

  const setPayment = (key: string, locked?: boolean) => (value: boolean) => {
    if (locked) return;
    setPayments((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    Alert.alert('Cấu hình POS', 'Đã lưu cấu hình POS.');
  };

  const handleReset = () => {
    Alert.alert('Khôi phục cấu hình', 'Bạn muốn khôi phục cấu hình POS mặc định?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Khôi phục',
        style: 'destructive',
        onPress: () => {
          setLayout('4 cột');
          setVat('8%');
          setSwitches(initialSwitches);
          setPayments(initialPayments);
          setPricesIncludeVat(true);
          setAutoInvoice(true);
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title="Cấu hình POS"
        subtitle="Bố cục, thanh toán và hóa đơn bán hàng"
        onBack={() => navigation.goBack()}
        rightActions={
          <TouchableOpacity activeOpacity={0.82} style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Lưu</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Bố cục bàn phím POS" icon="apps-outline" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.categoryGrid}>
            {categoryItems.map((item, index) => {
              const isActive = index === 0;
              const isCreate = index === categoryItems.length - 1;
              return (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.75}
                  style={[
                    styles.categoryTile,
                    {
                      backgroundColor: isActive ? colors.primary : colors.card,
                      borderColor: isCreate ? colors.border : isActive ? colors.primary : colors.border,
                      borderStyle: isCreate ? 'dashed' : 'solid',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryTileText,
                      { color: isActive ? '#fff' : isCreate ? colors.textSecondary : colors.text },
                    ]}
                    numberOfLines={2}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.previewHint, { color: colors.textSecondary }]}>Kéo thả để sắp xếp · Bấm để sửa</Text>
        </View>

        <SettingsGroup title="Hiển thị" icon="color-palette-outline">
          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.rowBlock, { borderBottomColor: colors.border }]}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Bố cục danh mục</Text>
              <View style={styles.segmentRow}>
                {layoutOptions.map((option) => (
                  <SegmentButton key={option} label={option} active={layout === option} onPress={() => setLayout(option)} />
                ))}
              </View>
            </View>
            {displaySettings.map((item, index) => (
              <SwitchRow
                key={item.key}
                label={item.label}
                description={item.description}
                value={switches[item.key]}
                onValueChange={setSwitch(item.key)}
                isLast={index === displaySettings.length - 1}
              />
            ))}
          </View>
        </SettingsGroup>

        <SettingsGroup title="Hành vi bán hàng" icon="options-outline">
          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {behaviorSettings.map((item, index) => (
              <SwitchRow
                key={item.key}
                label={item.label}
                value={switches[item.key]}
                onValueChange={setSwitch(item.key)}
                isLast={index === behaviorSettings.length - 1}
              />
            ))}
          </View>
        </SettingsGroup>

        <View style={styles.paymentHeader}>
          <SectionTitle title="Phương thức thanh toán" icon="wallet-outline" style={styles.paymentTitle} />
          <TouchableOpacity activeOpacity={0.75} style={styles.addPaymentButton}>
            <Ionicons name="add" size={16} color={Colors.primary} />
            <Text style={styles.addPaymentText}>Thêm</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {paymentMethods.map((item, index) => (
            <PaymentRow
              key={item.key}
              item={item}
              value={payments[item.key]}
              onValueChange={setPayment(item.key, item.locked)}
              isLast={index === paymentMethods.length - 1}
            />
          ))}
        </View>

        <SettingsGroup title="Thuế & Hóa đơn" icon="receipt-outline">
          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.taxRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>VAT mặc định</Text>
              <View style={styles.vatOptions}>
                {vatOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    activeOpacity={0.78}
                    onPress={() => setVat(option)}
                    style={[
                      styles.vatChip,
                      {
                        backgroundColor: vat === option ? colors.primary : colors.card,
                        borderColor: vat === option ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.vatChipText, { color: vat === option ? '#fff' : colors.text }]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <SwitchRow label="Giá đã bao gồm VAT" value={pricesIncludeVat} onValueChange={setPricesIncludeVat} />
            <SwitchRow label="Tự xuất hóa đơn điện tử" value={autoInvoice} onValueChange={setAutoInvoice} isLast />
          </View>
        </SettingsGroup>

        <TouchableOpacity activeOpacity={0.8} style={styles.resetButton} onPress={handleReset}>
          <Ionicons name="refresh-outline" size={17} color={Colors.danger} />
          <Text style={styles.resetButtonText}>Khôi phục cấu hình mặc định</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SectionTitle({
  title,
  icon,
  style,
}: {
  title: string;
  icon: IconName;
  style?: object;
}) {
  const { colors } = useThemeMode();

  return (
    <View style={[styles.sectionTitle, style]}>
      <Ionicons name={icon} size={15} color={colors.textSecondary} />
      <Text style={[styles.sectionTitleText, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );
}

function SettingsGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <View>
      <SectionTitle title={title} icon={icon} />
      {children}
    </View>
  );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useThemeMode();

  return (
    <TouchableOpacity
      activeOpacity={0.76}
      onPress={onPress}
      style={[
        styles.segmentButton,
        {
          backgroundColor: active ? colors.primaryLight : colors.card,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[styles.segmentText, { color: active ? colors.primary : colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SwitchRow({
  label,
  description,
  value,
  onValueChange,
  isLast,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}) {
  const { colors } = useThemeMode();

  return (
    <View style={[styles.switchRow, { borderBottomColor: colors.border }, isLast && styles.lastRow]}>
      <View style={styles.switchCopy}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {description ? <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

function PaymentRow({
  item,
  value,
  onValueChange,
  isLast,
}: {
  item: (typeof paymentMethods)[number];
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}) {
  const { colors } = useThemeMode();

  return (
    <View style={[styles.paymentRow, { borderBottomColor: colors.border }, isLast && styles.lastRow]}>
      <View style={[styles.paymentIcon, { backgroundColor: `${item.color}1f`, borderColor: item.color }]}>
        <Ionicons name={item.icon} size={17} color={item.color} />
      </View>
      <View style={styles.paymentCopy}>
        <View style={styles.paymentNameRow}>
          <Text style={[styles.paymentName, { color: colors.text }]}>{item.name}</Text>
          {item.locked ? <Ionicons name="lock-closed" size={12} color={colors.textSecondary} /> : null}
        </View>
        <Text style={[styles.paymentSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={item.locked}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 28,
    gap: 10,
  },
  saveButton: {
    minWidth: 58,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  saveButtonText: {
    ...Typography.captionMd,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingTop: 2,
    paddingBottom: 6,
  },
  sectionTitleText: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 10,
    ...Shadow.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryTile: {
    width: '23.6%',
    aspectRatio: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  categoryTileText: {
    ...Typography.captionMd,
    textAlign: 'center',
    letterSpacing: 0,
  },
  previewHint: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: 9,
    fontStyle: 'italic',
  },
  groupCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  rowBlock: {
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  rowTitle: {
    ...Typography.bodyMd,
    marginBottom: 9,
    letterSpacing: 0,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  segmentText: {
    ...Typography.captionMd,
    fontWeight: '700',
    letterSpacing: 0,
  },
  switchRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  switchCopy: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  rowLabel: {
    ...Typography.bodyMd,
    letterSpacing: 0,
  },
  rowDescription: {
    ...Typography.caption,
    marginTop: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentTitle: {
    flex: 1,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingRight: Spacing.sm,
    paddingBottom: 6,
  },
  addPaymentText: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0,
  },
  paymentRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  paymentIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCopy: {
    flex: 1,
  },
  paymentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  paymentName: {
    ...Typography.bodyMd,
    fontWeight: '700',
    letterSpacing: 0,
  },
  paymentSubtitle: {
    ...Typography.caption,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  taxRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    gap: 8,
  },
  vatOptions: {
    flexDirection: 'row',
    gap: 4,
  },
  vatChip: {
    minWidth: 42,
    height: 30,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  vatChipText: {
    ...Typography.captionMd,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0,
  },
  resetButton: {
    minHeight: 46,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 2,
  },
  resetButtonText: {
    ...Typography.bodySm,
    color: Colors.danger,
    fontWeight: '700',
    letterSpacing: 0,
  },
});
