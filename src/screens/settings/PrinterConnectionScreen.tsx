import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, Header } from '../../components';
import type { SettingsStackParamList } from '../../navigation';
import {
  buildLabelTestPayload,
  buildReceiptTestPayload,
  getPrinterStore,
  removePrinter,
  savePrinter,
  setDefaultPrinter,
  setPrinterConnection,
  updatePrinterPreferences,
  type PrinterConnectionType,
  type PrinterDevice,
  type PrinterPaperSize,
  type PrinterPreferences,
  type PrinterStore,
} from '../../services';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;
type IconName = React.ComponentProps<typeof Ionicons>['name'];

type PrinterFormState = {
  id: string | null;
  name: string;
  model: string;
  connectionType: PrinterConnectionType;
  address: string;
  port: string;
  paperSize: PrinterPaperSize;
  supportsReceipt: boolean;
  supportsLabel: boolean;
};

type QuickPrinterTemplate = {
  name: string;
  model: string;
  connectionType: PrinterConnectionType;
  address: string;
  port: number | null;
  paperSize: PrinterPaperSize;
  supportsReceipt: boolean;
  supportsLabel: boolean;
  description: string;
};

const CONNECTION_OPTIONS: Array<{ key: PrinterConnectionType; label: string; icon: IconName }> = [
  { key: 'wifi', label: 'LAN/Wi-Fi', icon: 'wifi-outline' },
  { key: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth-outline' },
  { key: 'usb', label: 'USB', icon: 'hardware-chip-outline' },
];

const PAPER_OPTIONS: Array<{ key: PrinterPaperSize; label: string }> = [
  { key: '58mm', label: '58mm' },
  { key: '80mm', label: '80mm' },
  { key: '100x150', label: 'Tem 100x150' },
];

const QUICK_PRINTER_TEMPLATES: QuickPrinterTemplate[] = [
  {
    name: 'Xprinter XP-80',
    model: 'XP-80C',
    connectionType: 'wifi',
    address: '192.168.1.88',
    port: 9100,
    paperSize: '80mm',
    supportsReceipt: true,
    supportsLabel: false,
    description: 'Máy in bill nhiệt qua LAN, phổ biến cho quán/siêu thị mini.',
  },
  {
    name: 'Xprinter XP-Q80I',
    model: 'XP-Q80I',
    connectionType: 'bluetooth',
    address: 'BT:XP-Q80I',
    port: null,
    paperSize: '80mm',
    supportsReceipt: true,
    supportsLabel: false,
    description: 'Máy in bill Bluetooth di động, tiện cho ship và thu ngân linh hoạt.',
  },
  {
    name: 'Xprinter XP-350B',
    model: 'XP-350B',
    connectionType: 'usb',
    address: 'USB:XP-350B',
    port: null,
    paperSize: '80mm',
    supportsReceipt: true,
    supportsLabel: true,
    description: 'Máy in USB OTG đa năng bill/tem, phù hợp triển khai Android POS.',
  },
];

const createInitialForm = (): PrinterFormState => ({
  id: null,
  name: '',
  model: '',
  connectionType: 'wifi',
  address: '',
  port: '9100',
  paperSize: '80mm',
  supportsReceipt: true,
  supportsLabel: false,
});

const getConnectionLabel = (connectionType: PrinterConnectionType) =>
  CONNECTION_OPTIONS.find((item) => item.key === connectionType)?.label || 'Không rõ';

const getConnectionIcon = (connectionType: PrinterConnectionType): IconName => {
  if (connectionType === 'bluetooth') return 'bluetooth-outline';
  if (connectionType === 'usb') return 'hardware-chip-outline';
  return 'wifi-outline';
};

const resolveNextPort = (portText: string, connectionType: PrinterConnectionType) => {
  if (connectionType !== 'wifi') {
    return null;
  }

  const parsed = Number(portText);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) {
    return 9100;
  }

  return Math.floor(parsed);
};

export function PrinterConnectionScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useThemeMode();
  const [store, setStore] = useState<PrinterStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyPrinterId, setBusyPrinterId] = useState<string | null>(null);
  const [form, setForm] = useState<PrinterFormState>(createInitialForm);

  const loadPrinterStore = useCallback(async () => {
    const next = await getPrinterStore();
    setStore(next);
    return next;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const load = async () => {
        try {
          setIsLoading(true);
          const next = await getPrinterStore();
          if (isMounted) {
            setStore(next);
          }
        } catch {
          if (isMounted) {
            setStore({
              printers: [],
              defaultReceiptPrinterId: null,
              defaultLabelPrinterId: null,
              preferences: {
                autoReconnect: true,
                cutPaperAfterPrint: true,
                openDrawerAfterReceipt: false,
              },
            });
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      load();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const printers = store?.printers || [];
  const preferences = store?.preferences;

  const defaultReceiptPrinter = useMemo(
    () => printers.find((item) => item.id === store?.defaultReceiptPrinterId) || null,
    [printers, store?.defaultReceiptPrinterId]
  );

  const defaultLabelPrinter = useMemo(
    () => printers.find((item) => item.id === store?.defaultLabelPrinterId) || null,
    [printers, store?.defaultLabelPrinterId]
  );

  const connectedCount = useMemo(
    () => printers.filter((item) => item.isConnected).length,
    [printers]
  );

  const setFormValue = <K extends keyof PrinterFormState>(key: K, value: PrinterFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(createInitialForm());
  };

  const hydrateFormFromPrinter = (printer: PrinterDevice) => {
    setForm({
      id: printer.id,
      name: printer.name,
      model: printer.model,
      connectionType: printer.connectionType,
      address: printer.address,
      port: printer.port ? String(printer.port) : '9100',
      paperSize: printer.paperSize,
      supportsReceipt: printer.supportsReceipt,
      supportsLabel: printer.supportsLabel,
    });
  };

  const handleSaveManualPrinter = async () => {
    if (isSaving) return;

    const name = form.name.trim();
    const model = form.model.trim();
    const address = form.address.trim();

    if (!name || !model || !address) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên máy in, model và địa chỉ kết nối.');
      return;
    }

    if (!form.supportsReceipt && !form.supportsLabel) {
      Alert.alert('Thiếu chức năng', 'Hãy bật ít nhất một chức năng: in bill hoặc in tem.');
      return;
    }

    try {
      setIsSaving(true);
      const next = await savePrinter({
        id: form.id || undefined,
        name,
        model,
        connectionType: form.connectionType,
        address,
        port: resolveNextPort(form.port, form.connectionType),
        paperSize: form.paperSize,
        supportsReceipt: form.supportsReceipt,
        supportsLabel: form.supportsLabel,
      });
      setStore(next);
      Alert.alert('Máy in', form.id ? 'Đã cập nhật cấu hình máy in.' : 'Đã thêm máy in mới.');
      resetForm();
    } catch {
      Alert.alert('Máy in', 'Không thể lưu cấu hình máy in. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAdd = async (template: QuickPrinterTemplate) => {
    try {
      setIsSaving(true);
      const existing = printers.find(
        (item) =>
          item.model.trim().toLowerCase() === template.model.toLowerCase() &&
          item.address.trim().toLowerCase() === template.address.toLowerCase()
      );

      const next = await savePrinter({
        id: existing?.id,
        name: template.name,
        model: template.model,
        connectionType: template.connectionType,
        address: template.address,
        port: template.port,
        paperSize: template.paperSize,
        supportsReceipt: template.supportsReceipt,
        supportsLabel: template.supportsLabel,
      });
      setStore(next);
      Alert.alert('Máy in', existing ? 'Đã cập nhật máy in nhanh.' : 'Đã thêm máy in nhanh.');
    } catch {
      Alert.alert('Máy in', 'Không thể thêm máy in nhanh. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleConnection = async (printer: PrinterDevice) => {
    try {
      setBusyPrinterId(printer.id);
      const next = await setPrinterConnection(printer.id, !printer.isConnected);
      setStore(next);
    } catch {
      Alert.alert('Kết nối máy in', 'Không thể cập nhật trạng thái kết nối.');
    } finally {
      setBusyPrinterId(null);
    }
  };

  const handleSetDefault = async (printer: PrinterDevice, usage: 'receipt' | 'label') => {
    if (usage === 'receipt' && !printer.supportsReceipt) {
      Alert.alert('Máy in bill', 'Máy in này chưa bật chế độ in bill.');
      return;
    }
    if (usage === 'label' && !printer.supportsLabel) {
      Alert.alert('Máy in tem', 'Máy in này chưa bật chế độ in tem.');
      return;
    }

    try {
      const next = await setDefaultPrinter(printer.id, usage);
      setStore(next);
    } catch {
      Alert.alert('Máy in', 'Không thể đặt máy in mặc định.');
    }
  };

  const handleRemovePrinter = (printer: PrinterDevice) => {
    Alert.alert('Xoá máy in', `Bạn muốn xoá "${printer.name}" khỏi danh sách?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            const next = await removePrinter(printer.id);
            setStore(next);
            if (form.id === printer.id) {
              resetForm();
            }
          } catch {
            Alert.alert('Máy in', 'Không thể xoá máy in.');
          }
        },
      },
    ]);
  };

  const handlePreferenceChange = async (
    key: keyof PrinterPreferences,
    value: boolean
  ) => {
    try {
      const next = await updatePrinterPreferences({ [key]: value });
      setStore(next);
    } catch {
      Alert.alert('Máy in', 'Không thể cập nhật tuỳ chọn in.');
    }
  };

  const handleTestReceipt = (printer: PrinterDevice) => {
    if (!printer.supportsReceipt) {
      Alert.alert('In thử bill', 'Máy in này chưa được bật chức năng in bill.');
      return;
    }

    const payload = buildReceiptTestPayload(printer);
    Alert.alert(
      'Đã gửi lệnh in bill',
      [
        `Máy in: ${payload.printerName}`,
        `Khổ giấy: ${payload.paperSize}`,
        '',
        ...payload.lines.slice(0, 7),
      ].join('\n')
    );
  };

  const handleTestLabel = (printer: PrinterDevice) => {
    if (!printer.supportsLabel) {
      Alert.alert('In thử tem', 'Máy in này chưa được bật chức năng in tem.');
      return;
    }

    const payload = buildLabelTestPayload(printer);
    Alert.alert(
      'Đã gửi lệnh in tem',
      [
        `Máy in: ${payload.printerName}`,
        `SKU: ${payload.sku}`,
        `Tên SP: ${payload.productName}`,
        `Giá: ${payload.price}`,
      ].join('\n')
    );
  };

  const refreshStore = async () => {
    try {
      setIsLoading(true);
      await loadPrinterStore();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title="Kết nối máy in"
        subtitle="Cấu hình máy in bill, máy in tem và in thử"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="print-outline" size={18} color="#fff" />
            </View>
            <View style={styles.heroCopy}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Máy in đã kết nối</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                {connectedCount}/{printers.length} máy đang online
              </Text>
            </View>
            {isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          </View>
          <View style={[styles.heroRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Mặc định in bill</Text>
            <Text style={[styles.heroValue, { color: colors.text }]}>
              {defaultReceiptPrinter?.name || 'Chưa chọn'}
            </Text>
          </View>
          <View style={[styles.heroRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Mặc định in tem</Text>
            <Text style={[styles.heroValue, { color: colors.text }]}>
              {defaultLabelPrinter?.name || 'Chưa chọn'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.refreshButton, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={refreshStore}
          >
            <Ionicons name="refresh-outline" size={15} color={colors.textSecondary} />
            <Text style={[styles.refreshText, { color: colors.textSecondary }]}>Làm mới trạng thái</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionWrap}>
          <SectionTitle title="Tuỳ chọn in" icon="options-outline" />
          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SwitchRow
              label="Tự kết nối lại khi mở app"
              value={preferences?.autoReconnect ?? true}
              onValueChange={(value) => handlePreferenceChange('autoReconnect', value)}
            />
            <SwitchRow
              label="Cắt giấy tự động sau khi in bill"
              value={preferences?.cutPaperAfterPrint ?? true}
              onValueChange={(value) => handlePreferenceChange('cutPaperAfterPrint', value)}
            />
            <SwitchRow
              label="Mở két tiền sau khi in bill"
              value={preferences?.openDrawerAfterReceipt ?? false}
              onValueChange={(value) => handlePreferenceChange('openDrawerAfterReceipt', value)}
              isLast
            />
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <SectionTitle title="Thêm nhanh theo mẫu" icon="flash-outline" />
          <View style={styles.quickList}>
            {QUICK_PRINTER_TEMPLATES.map((item) => (
              <View key={`${item.model}:${item.address}`} style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.quickIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name={getConnectionIcon(item.connectionType)} size={16} color={colors.primary} />
                </View>
                <View style={styles.quickCopy}>
                  <Text style={[styles.quickName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.quickMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.model} · {getConnectionLabel(item.connectionType)}
                  </Text>
                  <Text style={[styles.quickDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.quickAction}
                  onPress={() => handleQuickAdd(item)}
                >
                  <Ionicons name="add" size={14} color="#fff" />
                  <Text style={styles.quickActionText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <SectionTitle title="Nhập thủ công" icon="create-outline" />
          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FormField
              label="Tên máy in"
              value={form.name}
              onChangeText={(value) => setFormValue('name', value)}
              placeholder="Ví dụ: Máy in quầy thu ngân"
            />
            <FormField
              label="Model"
              value={form.model}
              onChangeText={(value) => setFormValue('model', value)}
              placeholder="Ví dụ: XP-80C / XP-350B"
            />
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Kiểu kết nối</Text>
              <View style={styles.chipsRow}>
                {CONNECTION_OPTIONS.map((item) => (
                  <ChoiceChip
                    key={item.key}
                    active={form.connectionType === item.key}
                    label={item.label}
                    icon={item.icon}
                    onPress={() => setFormValue('connectionType', item.key)}
                  />
                ))}
              </View>
            </View>
            <FormField
              label={form.connectionType === 'wifi' ? 'IP / Host' : 'Địa chỉ thiết bị'}
              value={form.address}
              onChangeText={(value) => setFormValue('address', value)}
              placeholder={
                form.connectionType === 'wifi'
                  ? 'Ví dụ: 192.168.1.88'
                  : form.connectionType === 'bluetooth'
                    ? 'Ví dụ: BT:XP-Q80I'
                    : 'Ví dụ: USB:XP-350B'
              }
            />
            {form.connectionType === 'wifi' ? (
              <FormField
                label="Port"
                value={form.port}
                onChangeText={(value) => setFormValue('port', value.replace(/[^0-9]/g, ''))}
                placeholder="9100"
                keyboardType="numeric"
              />
            ) : null}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Khổ giấy / tem</Text>
              <View style={styles.chipsRow}>
                {PAPER_OPTIONS.map((item) => (
                  <ChoiceChip
                    key={item.key}
                    active={form.paperSize === item.key}
                    label={item.label}
                    onPress={() => setFormValue('paperSize', item.key)}
                  />
                ))}
              </View>
            </View>
            <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Dùng để in bill</Text>
              <Switch
                value={form.supportsReceipt}
                onValueChange={(value) => setFormValue('supportsReceipt', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
            <View style={[styles.switchRow, styles.lastRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Dùng để in tem</Text>
              <Switch
                value={form.supportsLabel}
                onValueChange={(value) => setFormValue('supportsLabel', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.82}
              style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={resetForm}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.text} />
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Làm mới form</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.86}
              style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
              onPress={handleSaveManualPrinter}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={16} color="#fff" />
                  <Text style={styles.primaryButtonText}>{form.id ? 'Cập nhật' : 'Lưu máy in'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <SectionTitle title="Danh sách máy in" icon="list-outline" />
          {printers.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <EmptyState
                icon="print-outline"
                title="Chưa có máy in"
                description="Thêm máy in nhanh hoặc nhập thủ công để bắt đầu in bill/in tem."
              />
            </View>
          ) : (
            <View style={styles.printerList}>
              {printers.map((printer) => {
                const isDefaultReceipt = store?.defaultReceiptPrinterId === printer.id;
                const isDefaultLabel = store?.defaultLabelPrinterId === printer.id;
                const isBusy = busyPrinterId === printer.id;

                return (
                  <View
                    key={printer.id}
                    style={[styles.printerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.printerTopRow}>
                      <View style={[styles.printerIcon, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons
                          name={getConnectionIcon(printer.connectionType)}
                          size={17}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.printerCopy}>
                        <Text style={[styles.printerName, { color: colors.text }]}>{printer.name}</Text>
                        <Text style={[styles.printerMeta, { color: colors.textSecondary }]} numberOfLines={2}>
                          {printer.model} · {getConnectionLabel(printer.connectionType)} · {printer.address}
                          {printer.port ? `:${printer.port}` : ''}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          printer.isConnected ? styles.statusOnline : styles.statusOffline,
                        ]}
                      >
                        <Text style={styles.statusText}>{printer.isConnected ? 'Online' : 'Offline'}</Text>
                      </View>
                    </View>

                    <View style={styles.tagRow}>
                      {printer.supportsReceipt ? <Tag text="In bill" color={Colors.success} /> : null}
                      {printer.supportsLabel ? <Tag text="In tem" color={Colors.warning} /> : null}
                      <Tag text={printer.paperSize} color={Colors.primary} />
                      {isDefaultReceipt ? <Tag text="Mặc định bill" color={Colors.success} /> : null}
                      {isDefaultLabel ? <Tag text="Mặc định tem" color={Colors.warning} /> : null}
                    </View>

                    <View style={styles.printerActions}>
                      <ActionButton
                        label={printer.isConnected ? 'Ngắt kết nối' : 'Kết nối'}
                        icon={printer.isConnected ? 'pause-circle-outline' : 'play-circle-outline'}
                        onPress={() => handleToggleConnection(printer)}
                        loading={isBusy}
                      />
                      <ActionButton
                        label="Mặc định bill"
                        icon="receipt-outline"
                        onPress={() => handleSetDefault(printer, 'receipt')}
                      />
                      <ActionButton
                        label="Mặc định tem"
                        icon="pricetag-outline"
                        onPress={() => handleSetDefault(printer, 'label')}
                      />
                      <ActionButton
                        label="In thử bill"
                        icon="print-outline"
                        onPress={() => handleTestReceipt(printer)}
                      />
                      <ActionButton
                        label="In thử tem"
                        icon="barcode-outline"
                        onPress={() => handleTestLabel(printer)}
                      />
                      <ActionButton
                        label="Sửa"
                        icon="create-outline"
                        onPress={() => hydrateFormFromPrinter(printer)}
                      />
                      <ActionButton
                        label="Xoá"
                        icon="trash-outline"
                        danger
                        onPress={() => handleRemovePrinter(printer)}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.footer} />
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
      <Text style={[styles.switchLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}) {
  const { colors } = useThemeMode();

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
      />
    </View>
  );
}

function ChoiceChip({
  label,
  active,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  icon?: IconName;
  onPress: () => void;
}) {
  const { colors } = useThemeMode();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.choiceChip,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primaryLight : colors.background,
        },
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={active ? colors.primary : colors.textSecondary} /> : null}
      <Text style={[styles.choiceChipText, { color: active ? colors.primary : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  danger,
  loading,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  danger?: boolean;
  loading?: boolean;
}) {
  const { colors } = useThemeMode();
  const textColor = danger ? Colors.danger : colors.textSecondary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.actionButton, { borderColor: colors.border, backgroundColor: colors.background }]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <>
          <Ionicons name={icon} size={14} color={textColor} />
          <Text style={[styles.actionButtonText, { color: textColor }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.tag, { borderColor: color, backgroundColor: `${color}1f` }]}>
      <Text style={[styles.tagText, { color }]}>{text}</Text>
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
  heroCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 10,
    ...Shadow.sm,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    ...Typography.bodyMd,
    fontWeight: '700',
    letterSpacing: 0,
  },
  heroSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  heroRow: {
    minHeight: 36,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroLabel: {
    ...Typography.captionMd,
  },
  heroValue: {
    ...Typography.captionMd,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  refreshButton: {
    minHeight: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  refreshText: {
    ...Typography.captionMd,
    fontWeight: '600',
    letterSpacing: 0,
  },
  sectionWrap: {
    gap: 6,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingTop: 2,
    paddingBottom: 2,
  },
  sectionTitleText: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  groupCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  switchRow: {
    minHeight: 56,
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    ...Typography.bodyMd,
    flex: 1,
    letterSpacing: 0,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  quickList: {
    gap: 8,
  },
  quickCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: 10,
    ...Shadow.sm,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCopy: {
    flex: 1,
  },
  quickName: {
    ...Typography.bodyMd,
    fontWeight: '700',
    letterSpacing: 0,
  },
  quickMeta: {
    ...Typography.caption,
    marginTop: 2,
  },
  quickDescription: {
    ...Typography.caption,
    marginTop: 3,
  },
  quickAction: {
    minWidth: 68,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
  quickActionText: {
    ...Typography.captionMd,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0,
  },
  fieldWrap: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  fieldLabel: {
    ...Typography.captionMd,
    marginBottom: 6,
    letterSpacing: 0,
  },
  input: {
    minHeight: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    ...Typography.bodyMd,
    letterSpacing: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  choiceChip: {
    minHeight: 34,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  choiceChipText: {
    ...Typography.captionMd,
    fontWeight: '700',
    letterSpacing: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  secondaryButtonText: {
    ...Typography.bodySm,
    fontWeight: '700',
    letterSpacing: 0,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  primaryButtonText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0,
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  emptyCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Shadow.sm,
  },
  printerList: {
    gap: 8,
  },
  printerCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 10,
    ...Shadow.sm,
  },
  printerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  printerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerCopy: {
    flex: 1,
  },
  printerName: {
    ...Typography.bodyMd,
    fontWeight: '700',
    letterSpacing: 0,
  },
  printerMeta: {
    ...Typography.caption,
    marginTop: 2,
  },
  statusPill: {
    minWidth: 62,
    minHeight: 26,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  statusOnline: {
    backgroundColor: Colors.success,
  },
  statusOffline: {
    backgroundColor: '#94a3b8',
  },
  statusText: {
    ...Typography.captionMd,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    minHeight: 26,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 0,
  },
  printerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionButton: {
    minHeight: 32,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionButtonText: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 0,
  },
  footer: {
    height: 16,
  },
});
