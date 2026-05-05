import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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

const templates = [
  {
    key: 'minimal',
    name: 'Tối giản',
    description: 'Logo nhỏ, QR thanh toán, bố cục gọn cho giấy 80mm',
  },
  {
    key: 'classic',
    name: 'Cổ điển',
    description: 'Viền rõ, tiêu đề đậm, dễ đọc khi in nhiệt',
  },
  {
    key: 'brand',
    name: 'Thương hiệu nổi bật',
    description: 'Logo lớn, nhấn màu thương hiệu ở đầu hóa đơn',
  },
  {
    key: 'restaurant',
    name: 'Dài cho nhà hàng',
    description: 'Có bàn, khu vực, ghi chú món và phục vụ',
  },
] as const;

const options = [
  { key: 'storeLogo', label: 'In logo cửa hàng', value: true },
  { key: 'paymentQr', label: 'In mã QR thanh toán', value: true },
  { key: 'staffShift', label: 'In tên nhân viên / ca', value: true },
  { key: 'customerInfo', label: 'In thông tin khách hàng', value: false },
  { key: 'loyaltyPoint', label: 'In số điểm tích lũy', value: true },
  { key: 'twoCopies', label: 'In 2 liên (KH + nội bộ)', value: false },
] as const;

const initialOptions = options.reduce<Record<string, boolean>>((acc, item) => {
  acc[item.key] = item.value;
  return acc;
}, {});

const receiptItems = [
  { name: 'Cà phê G7 3in1', qty: 2, price: '25.000', total: '50.000' },
  { name: 'Mì Hảo Hảo tôm', qty: 5, price: '4.500', total: '22.500' },
  { name: 'Sữa TH 1L', qty: 1, price: '32.000', total: '32.000' },
];

export function PrintSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useThemeMode();
  const [template, setTemplate] = useState<(typeof templates)[number]['key']>('minimal');
  const [enabledOptions, setEnabledOptions] = useState(initialOptions);
  const [footerMessage, setFooterMessage] = useState('Cảm ơn quý khách! - Hotline CSKH: 1900.6868');

  const setOption = (key: string) => (value: boolean) => {
    setEnabledOptions((current) => ({ ...current, [key]: value }));
  };

  const handleTestPrint = () => {
    Alert.alert('In thử hóa đơn', 'Đã gửi bản in thử tới máy in mặc định.');
  };

  const handleApply = () => {
    Alert.alert('Mẫu hóa đơn', 'Đã áp dụng mẫu hóa đơn mới.');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title="Mẫu hóa đơn"
        subtitle="Xem trước, chọn mẫu và tuỳ chỉnh nội dung in"
        onBack={() => navigation.goBack()}
        rightActions={
          <TouchableOpacity activeOpacity={0.82} style={styles.saveButton} onPress={handleApply}>
            <Text style={styles.saveButtonText}>Áp dụng</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Xem trước hóa đơn" icon="receipt-outline" />
        <ReceiptPreview footerMessage={footerMessage} options={enabledOptions} />

        <SettingsGroup title="Chọn mẫu" icon="color-palette-outline">
          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {templates.map((item, index) => (
              <TemplateRow
                key={item.key}
                item={item}
                selected={template === item.key}
                onPress={() => setTemplate(item.key)}
                isLast={index === templates.length - 1}
              />
            ))}
          </View>
        </SettingsGroup>

        <SettingsGroup title="Tùy chỉnh" icon="options-outline">
          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {options.map((item, index) => (
              <SwitchRow
                key={item.key}
                label={item.label}
                value={enabledOptions[item.key]}
                onValueChange={setOption(item.key)}
                isLast={index === options.length - 1}
              />
            ))}
          </View>
        </SettingsGroup>

        <SettingsGroup title="Lời cảm ơn" icon="chatbox-ellipses-outline">
          <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.messageLabel, { color: colors.textSecondary }]}>Nội dung cuối hóa đơn</Text>
            <TextInput
              value={footerMessage}
              onChangeText={setFooterMessage}
              multiline
              textAlignVertical="top"
              placeholder="Nhập lời cảm ơn..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.messageInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />
          </View>
        </SettingsGroup>

        <View style={styles.actionRow}>
          <TouchableOpacity activeOpacity={0.82} style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={handleTestPrint}>
            <Ionicons name="print-outline" size={17} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>In thử</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.86} style={styles.primaryButton} onPress={handleApply}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Áp dụng</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: IconName }) {
  const { colors } = useThemeMode();

  return (
    <View style={styles.sectionTitle}>
      <Ionicons name={icon} size={15} color={colors.textSecondary} />
      <Text style={[styles.sectionTitleText, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );
}

function SettingsGroup({ title, icon, children }: { title: string; icon: IconName; children: React.ReactNode }) {
  return (
    <View>
      <SectionTitle title={title} icon={icon} />
      {children}
    </View>
  );
}

function ReceiptPreview({
  footerMessage,
  options,
}: {
  footerMessage: string;
  options: Record<string, boolean>;
}) {
  return (
    <View style={styles.receiptShadow}>
      <View style={styles.receipt}>
        <View style={styles.receiptTopRow}>
          {options.storeLogo ? (
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>VM</Text>
            </View>
          ) : null}
          <View style={styles.companyBlock}>
            <Text style={styles.storeName}>HKD MINH NGUYEN</Text>
            <Text style={styles.receiptTiny}>123 Nguyen Hue, Q.1, TP.HCM</Text>
            <Text style={styles.receiptTiny}>vmass.vn</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaBox}>
            <Text style={styles.metaText}>Thu ngân: Linh</Text>
            <Text style={styles.metaText}>Hotline: 0903.456.789</Text>
            {options.staffShift ? <Text style={styles.metaText}>Ca: Sáng</Text> : null}
          </View>
          <View style={[styles.metaBox, styles.metaBoxRight]}>
            <Text style={styles.metaText}>Hóa đơn: #25120842</Text>
            <Text style={styles.metaText}>12/12/2025</Text>
            <Text style={styles.metaText}>14:00 - 14:23</Text>
          </View>
        </View>

        {options.customerInfo ? (
          <View style={styles.customerBox}>
            <Text style={styles.metaText}>Khách hàng: Nguyễn An</Text>
            <Text style={styles.metaText}>SĐT: 0912.345.678</Text>
          </View>
        ) : null}

        <View style={styles.itemsBox}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemQty, styles.itemHeaderText]}>#</Text>
            <Text style={[styles.itemName, styles.itemHeaderText]}>Tên món</Text>
            <Text style={[styles.itemPrice, styles.itemHeaderText]}>Đơn giá</Text>
            <Text style={[styles.itemTotal, styles.itemHeaderText]}>T.tiền</Text>
          </View>
          {receiptItems.map((item) => (
            <View key={item.name} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.qty}x</Text>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemPrice}>{item.price}</Text>
              <Text style={styles.itemTotal}>{item.total}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalBox}>
          <ReceiptTotal label="Tổng tiền:" value="104.500" strong />
          <ReceiptTotal label="Giảm giá:" value="-10.000" />
          <ReceiptTotal label="Thuế:" value="0" />
          <ReceiptTotal label="Phí khác:" value="0" />
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalText}>Phải thanh toán:</Text>
            <Text style={styles.grandTotalText}>94.500</Text>
          </View>
          {options.loyaltyPoint ? <ReceiptTotal label="Điểm tích lũy:" value="+9 điểm" /> : null}
        </View>

        {options.paymentQr ? (
          <View style={styles.paymentBox}>
            <QrMock />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>MINH NGUYEN</Text>
              <Text style={styles.paymentText}>0123456789</Text>
              <Text style={styles.paymentText}>Ngân hàng VMASS</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.receiptFooter}>
          <Text style={styles.footerMessage}>{footerMessage}</Text>
          {options.twoCopies ? <Text style={styles.receiptMuted}>Liên 1: Khách hàng - Liên 2: Nội bộ</Text> : null}
          <Text style={styles.receiptMuted}>Bản quyền VMASS</Text>
        </View>
      </View>
    </View>
  );
}

function ReceiptTotal({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalText, strong && styles.totalStrong]}>{label}</Text>
      <Text style={[styles.totalText, strong && styles.totalStrong]}>{value}</Text>
    </View>
  );
}

function QrMock() {
  return (
    <View style={styles.qrMock}>
      <View style={styles.qrFinder} />
      <View style={[styles.qrFinder, styles.qrFinderRight]} />
      <View style={[styles.qrFinder, styles.qrFinderBottom]} />
      <View style={styles.qrDotGrid}>
        {Array.from({ length: 16 }).map((_, index) => (
          <View key={index} style={[styles.qrDot, index % 3 === 0 && styles.qrDotLarge]} />
        ))}
      </View>
    </View>
  );
}

function TemplateRow({
  item,
  selected,
  onPress,
  isLast,
}: {
  item: (typeof templates)[number];
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
}) {
  const { colors } = useThemeMode();

  return (
    <TouchableOpacity
      activeOpacity={0.76}
      onPress={onPress}
      style={[
        styles.templateRow,
        { borderBottomColor: colors.border, backgroundColor: selected ? colors.primaryLight : colors.card },
        isLast && styles.lastRow,
      ]}
    >
      <View style={[styles.radioOuter, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent' }]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <View style={styles.templateCopy}>
        <Text style={[styles.templateName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.templateDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      <View style={styles.miniReceipt}>
        <View style={styles.miniLineStrong} />
        <View style={styles.miniLine} />
        <View style={styles.miniLine} />
        <View style={styles.miniBox} />
      </View>
    </TouchableOpacity>
  );
}

function SwitchRow({
  label,
  value,
  onValueChange,
  isLast,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}) {
  const { colors } = useThemeMode();

  return (
    <View style={[styles.switchRow, { borderBottomColor: colors.border }, isLast && styles.lastRow]}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
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
    minWidth: 72,
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
  receiptShadow: {
    borderRadius: Radius.sm,
    ...Shadow.md,
  },
  receipt: {
    backgroundColor: '#fff',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#d9dde3',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  receiptTopRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e5ea',
  },
  companyBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logoMark: {
    width: 46,
    height: 46,
    borderRadius: 7,
    backgroundColor: '#e6f5fc',
    borderWidth: 1,
    borderColor: '#b8e2f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkText: {
    ...Typography.mono,
    color: Colors.primary,
    fontWeight: '800',
  },
  storeName: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0,
    textAlign: 'right',
  },
  receiptTiny: {
    fontSize: 11,
    color: '#444',
    fontFamily: 'monospace',
    letterSpacing: 0,
    textAlign: 'center',
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  metaBox: {
    flex: 1,
    minHeight: 50,
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#f3f5f7',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metaBoxRight: {
    alignItems: 'flex-end',
  },
  metaText: {
    fontSize: 11,
    color: '#31343a',
    fontFamily: 'monospace',
    letterSpacing: 0,
    lineHeight: 13,
  },
  customerBox: {
    borderRadius: 6,
    backgroundColor: '#f8fbfd',
    borderWidth: 1,
    borderColor: '#dfeef7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 10,
  },
  itemsBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#d9dde3',
    paddingVertical: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  itemHeaderText: {
    fontWeight: '800',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  itemName: {
    flex: 1,
    fontSize: 11,
    color: '#1a1a1a',
    fontFamily: 'monospace',
  },
  itemQty: {
    width: 24,
    fontSize: 11,
    color: '#1a1a1a',
    fontFamily: 'monospace',
    textAlign: 'left',
  },
  itemPrice: {
    width: 62,
    fontSize: 11,
    color: '#1a1a1a',
    fontFamily: 'monospace',
    textAlign: 'right',
  },
  itemTotal: {
    width: 66,
    fontSize: 11,
    color: '#1a1a1a',
    fontFamily: 'monospace',
    textAlign: 'right',
  },
  totalBox: {
    paddingVertical: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1,
    gap: 16,
  },
  totalText: {
    fontSize: 12,
    color: '#1a1a1a',
    fontFamily: 'monospace',
  },
  totalStrong: {
    fontWeight: '800',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#d9dde3',
    marginTop: 4,
    paddingTop: 4,
    gap: 16,
  },
  grandTotalText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  paymentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    marginTop: 2,
    borderTopWidth: 1,
    borderColor: '#e2e5ea',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 12,
    color: '#1a1a1a',
    fontFamily: 'monospace',
    fontWeight: '800',
    letterSpacing: 0,
  },
  paymentText: {
    fontSize: 11,
    color: '#31343a',
    fontFamily: 'monospace',
    letterSpacing: 0,
    marginTop: 1,
  },
  receiptFooter: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#e2e5ea',
    paddingTop: 8,
    marginTop: 8,
  },
  qrMock: {
    width: 58,
    height: 58,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    backgroundColor: '#fff',
    padding: 4,
    position: 'relative',
  },
  qrFinder: {
    position: 'absolute',
    width: 14,
    height: 14,
    top: 5,
    left: 5,
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  qrFinderRight: {
    left: undefined,
    right: 5,
  },
  qrFinderBottom: {
    top: undefined,
    bottom: 5,
  },
  qrDotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingLeft: 20,
    paddingTop: 20,
  },
  qrDot: {
    width: 4,
    height: 4,
    backgroundColor: '#1a1a1a',
  },
  qrDotLarge: {
    width: 8,
  },
  footerMessage: {
    fontSize: 11,
    color: '#1a1a1a',
    fontFamily: 'monospace',
    fontWeight: '700',
    textAlign: 'center',
  },
  receiptMuted: {
    fontSize: 10,
    color: '#777',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  groupCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  templateRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: '#fff',
  },
  templateCopy: {
    flex: 1,
  },
  templateName: {
    ...Typography.bodyMd,
    fontWeight: '700',
    letterSpacing: 0,
  },
  templateDescription: {
    ...Typography.caption,
    marginTop: 2,
    lineHeight: 16,
    letterSpacing: 0,
  },
  miniReceipt: {
    width: 38,
    height: 52,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ded7c7',
    backgroundColor: '#fefdf8',
    padding: 5,
    gap: 4,
  },
  miniLineStrong: {
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: '#9b9384',
  },
  miniLine: {
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: '#cfc7b8',
  },
  miniBox: {
    width: 14,
    height: 14,
    alignSelf: 'center',
    marginTop: 2,
    backgroundColor: '#9b9384',
  },
  switchRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  rowLabel: {
    ...Typography.bodyMd,
    flex: 1,
    letterSpacing: 0,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  messageCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  messageLabel: {
    ...Typography.captionMd,
    marginBottom: 8,
    letterSpacing: 0,
  },
  messageInput: {
    minHeight: 78,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...Typography.bodySm,
    letterSpacing: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 2,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  secondaryButtonText: {
    ...Typography.bodyMd,
    fontWeight: '700',
    letterSpacing: 0,
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  primaryButtonText: {
    ...Typography.bodyMd,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0,
  },
});
