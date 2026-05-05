import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { Header } from '../../components/Header';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import { useLanguage } from '../../i18n';
import {
  createInventoryProvider,
  createInventoryStock,
  getMinStockSettings,
  listInventoryStocks,
  listInventoryProviders,
  setMinStockSetting,
  updateInventoryStock,
  type InventoryProvider,
} from '../../services';

const formatDate = (value: Date) => {
  const day = String(value.getDate()).padStart(2, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const year = value.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatIsoDate = (value: Date) => {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const normalizeQtyText = (value: string) => {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  if (!normalized) return '';
  const [intPart = '', decPart = ''] = normalized.split('.');
  return decPart.length > 0 ? `${intPart}.${decPart.slice(0, 2)}` : intPart;
};

const formatRoundedUp = (value: number) => String(Math.ceil(value));
const formatQtyValue = (value: number) => {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return String(rounded).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
};

export function InventoryStockFormScreen({ navigation }: any) {
  const { colors } = useThemeMode();
  useLanguage();
  const route = useRoute<any>();
  const editingStockId = Number(route?.params?.stockId || 0);
  const isEditMode = Number.isFinite(editingStockId) && editingStockId > 0;
  const [providers, setProviders] = useState<InventoryProvider[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerOpen, setProviderOpen] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  const [creatingProvider, setCreatingProvider] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedExpiryDate, setSelectedExpiryDate] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [form, setForm] = useState(() => {
    const seed = `${Date.now().toString().slice(-6)}`;
    return {
      name: '',
      sku: `NL-${seed}`,
      barcode: '',
      unit: '',
      unitPrice: '',
      quantity: '',
      paidAmount: '',
      minMode: 'percent' as 'percent' | 'quantity',
      minValue: '20',
    };
  });

  useEffect(() => {
    listInventoryProviders()
      .then(setProviders)
      .catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    listInventoryStocks()
      .then((stocks) => {
        const found = stocks.find((s) => s.id === editingStockId);
        if (!found) return;
        setForm((prev) => ({
          ...prev,
          name: found.name || '',
          sku: found.sku || prev.sku,
          barcode: found.barcode || '',
          unit: found.unit || '',
          unitPrice: String(found.latestPrice || found.averagePrice || 0),
          quantity: formatQtyValue(Number(found.count || 0)),
          paidAmount: '',
        }));
      })
      .catch(() => {});
  }, [editingStockId, isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;
    getMinStockSettings()
      .then((settings) => {
        const setting = settings[String(editingStockId)];
        if (!setting) return;
        setForm((prev) => ({
          ...prev,
          minMode: setting.mode,
          minValue: String(setting.value),
        }));
      })
      .catch(() => {});
  }, [editingStockId, isEditMode]);

  const filteredProviders = useMemo(() => {
    const keyword = providerSearch.trim().toLowerCase();
    if (!keyword) return providers;
    return providers.filter((p) => p.name.toLowerCase().includes(keyword));
  }, [providerSearch, providers]);

  const canCreateProvider = useMemo(() => {
    const keyword = providerSearch.trim().toLowerCase();
    return keyword.length > 0 && !providers.some((p) => p.name.toLowerCase() === keyword);
  }, [providerSearch, providers]);

  const paidValue = useMemo(() => Number(form.paidAmount.replace(/[^\d.]/g, '') || 0), [form.paidAmount]);
  const totalValue = useMemo(
    () => Number(form.unitPrice.replace(/[^\d.]/g, '') || 0) * Number(form.quantity.replace(',', '.') || 0),
    [form.quantity, form.unitPrice],
  );
  const remainingValue = useMemo(() => Math.max(0, totalValue - paidValue), [paidValue, totalValue]);

  const handleCreateProvider = useCallback(async () => {
    const name = providerSearch.trim();
    if (!name || creatingProvider) return;
    try {
      setCreatingProvider(true);
      const created = await createInventoryProvider(name);
      setProviders((prev) => [...prev, created]);
      setProviderId(created.id);
      setProviderSearch('');
      setProviderOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không tạo được nhà cung cấp';
      Alert.alert('Lỗi', message);
    } finally {
      setCreatingProvider(false);
    }
  }, [creatingProvider, providerSearch]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const slots: Array<Date | null> = [];
    for (let i = 0; i < startWeekday; i += 1) slots.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) slots.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d));
    while (slots.length % 7 !== 0) slots.push(null);
    return slots;
  }, [calendarMonth]);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return Alert.alert('Thiếu dữ liệu', 'Vui lòng nhập tên nguyên liệu');
    if (!form.unit.trim()) return Alert.alert('Thiếu dữ liệu', 'Vui lòng nhập đơn vị tính');
    const unitPrice = Number(form.unitPrice.replace(/[^\d.]/g, '') || 0);
    const quantity = Number(form.quantity.replace(',', '.') || 0);
    if (unitPrice <= 0) return Alert.alert('Thiếu dữ liệu', 'Vui lòng nhập giá vốn hợp lệ');
    if (quantity <= 0) return Alert.alert('Thiếu dữ liệu', 'Vui lòng nhập số lượng nhập hợp lệ');

    try {
      setSaving(true);
      if (isEditMode) {
        const updatePayload: any = {
          id: editingStockId,
          name: form.name.trim(),
          barcode: form.barcode.trim(),
          unit: form.unit.trim(),
          count: quantity,
          priceNew: unitPrice,
        };
        const minMode = form.minMode;
        const minValue = Number(form.minValue || 0);
        if (minMode === 'percent') {
          updatePayload.isAlertDown20 = minValue <= 20;
          updatePayload.isAlertDown10 = minValue <= 10;
        }
        await updateInventoryStock(updatePayload);
      } else {
        const created: any = await createInventoryStock({
          name: form.name.trim(),
          sku: form.sku,
          barcode: form.barcode.trim(),
          unit: form.unit.trim(),
          quantity,
          unitPrice,
          providerName: providers.find((p) => p.id === providerId)?.name,
          paidAmount: paidValue,
          expiryDate: selectedExpiryDate ? formatIsoDate(selectedExpiryDate) : null,
        });
        const stockId = created?.data?.id;
        if (stockId) {
          await setMinStockSetting(stockId, {
            mode: form.minMode,
            value: Number(form.minValue || 0),
          });
        }
      }
      if (isEditMode) {
        await setMinStockSetting(editingStockId, {
          mode: form.minMode,
          value: Number(form.minValue || 0),
        });
      }
      navigation?.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lưu thất bại';
      Alert.alert('Lỗi', message);
    } finally {
      setSaving(false);
    }
  }, [editingStockId, form, isEditMode, navigation, paidValue, providerId, providers, selectedExpiryDate]);

  const openBarcodeScanner = useCallback(async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Cần quyền camera', 'Vui lòng cấp quyền camera để quét barcode.');
        return;
      }
    }
    setScannerPaused(false);
    setShowBarcodeScanner(true);
  }, [cameraPermission?.granted, requestCameraPermission]);

  const handleBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (scannerPaused) return;
      setScannerPaused(true);
      setForm((prev) => ({ ...prev, barcode: data || '' }));
      setShowBarcodeScanner(false);
    },
    [scannerPaused],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header title={isEditMode ? 'Cập nhật nguyên liệu' : 'Thêm nguyên liệu'} onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.twoCols}>
            <View style={styles.colWide}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Tên nguyên liệu *</Text>
              <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
            </View>
            <View style={styles.colNarrow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Mã SKU</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.textSecondary,
                    backgroundColor: colors.background,
                  },
                ]}
                value={form.sku}
                editable={false}
              />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Barcode</Text>
          <View style={styles.barcodeRow}>
            <TextInput
              style={[styles.input, styles.barcodeInput, { borderColor: colors.border, color: colors.text }]}
              value={form.barcode}
              onChangeText={(v) => setForm((p) => ({ ...p, barcode: v }))}
            />
            <TouchableOpacity
              style={[styles.scanBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={openBarcodeScanner}
            >
              <Ionicons name="barcode-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Đơn vị tính *</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={form.unit} onChangeText={(v) => setForm((p) => ({ ...p, unit: v }))} />

          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Nhà cung cấp</Text>
            <TouchableOpacity
              style={[styles.selectTrigger, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={() => setProviderOpen((o) => !o)}
            >
              <Text style={[styles.selectTriggerText, { color: providers.find((p) => p.id === providerId)?.name ? colors.text : colors.textSecondary }]}>
                {providers.find((p) => p.id === providerId)?.name || 'Chọn nhà cung cấp'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            {providerOpen && (
              <View style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, marginBottom: 8 }]}
                  placeholder="Tìm / tạo nhà cung cấp"
                  placeholderTextColor={colors.textSecondary}
                  value={providerSearch}
                  onChangeText={setProviderSearch}
                />
                {filteredProviders.map((p) => (
                  <TouchableOpacity key={p.id} style={styles.dropdownItem} onPress={() => { setProviderId(p.id); setProviderOpen(false); }}>
                    <Text style={{ color: colors.text }}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
                {canCreateProvider && (
                  <TouchableOpacity style={styles.dropdownItem} onPress={handleCreateProvider} disabled={creatingProvider}>
                    <Text style={{ color: Colors.primary }}>{creatingProvider ? 'Đang tạo...' : `Tạo mới: "${providerSearch.trim()}"`}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Giá vốn *</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} keyboardType="numeric" value={form.unitPrice} onChangeText={(v) => setForm((p) => ({ ...p, unitPrice: v }))} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Số lượng nhập *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            keyboardType="decimal-pad"
            value={form.quantity}
            onChangeText={(v) => setForm((p) => ({ ...p, quantity: normalizeQtyText(v) }))}
            onBlur={() => {
              const qty = Number(form.quantity || 0);
              if (!Number.isFinite(qty)) return;
              setForm((p) => ({ ...p, quantity: String(Math.round((qty + Number.EPSILON) * 100) / 100) }));
            }}
          />

          {providerId ? (
            <View style={styles.twoCols}>
              <View style={styles.colWide}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Đã trả</Text>
                <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} keyboardType="numeric" value={form.paidAmount} onChangeText={(v) => setForm((p) => ({ ...p, paidAmount: v }))} />
              </View>
              <View style={styles.colNarrow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Còn lại</Text>
                <View style={[styles.input, { borderColor: colors.border, justifyContent: 'center' }]}>
                  <Text style={{ color: colors.textSecondary }}>{remainingValue.toLocaleString('vi-VN')}</Text>
                </View>
              </View>
            </View>
          ) : null}

          <Text style={[styles.label, { color: colors.textSecondary }]}>Ngưỡng cảnh báo tồn</Text>
          <View style={styles.thresholdRow}>
            <TouchableOpacity
              style={[
                styles.modeChip,
                styles.modeChipCompact,
                { borderColor: colors.border, backgroundColor: form.minMode === 'percent' ? Colors.primaryLight : colors.background },
              ]}
              onPress={() => setForm((p) => ({ ...p, minMode: 'percent', minValue: p.minValue || '20' }))}
            >
              <Text style={{ color: form.minMode === 'percent' ? Colors.primary : colors.textSecondary }}>Phần trăm (%)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeChip,
                styles.modeChipWide,
                { borderColor: colors.border, backgroundColor: form.minMode === 'quantity' ? Colors.primaryLight : colors.background },
              ]}
              onPress={() =>
                setForm((p) => {
                  const qty = Number(p.quantity.replace(',', '.') || 0);
                  if (!Number.isFinite(qty) || qty <= 0) {
                    return { ...p, minMode: 'quantity', minValue: '0' };
                  }
                  return {
                    ...p,
                    minMode: 'quantity',
                    minValue: formatRoundedUp((qty * 20) / 100),
                  };
                })
              }
            >
              <Text style={{ color: form.minMode === 'quantity' ? Colors.primary : colors.textSecondary }}>SL tối thiểu</Text>
            </TouchableOpacity>
            <TextInput
              style={[
                styles.input,
                styles.thresholdInput,
                {
                  borderColor: form.minMode === 'percent' ? Colors.primary : colors.border,
                  color: colors.text,
                  backgroundColor: form.minMode === 'percent' ? Colors.primaryLight : colors.background,
                },
              ]}
              keyboardType="numeric"
              placeholder={form.minMode === 'percent' ? '20' : '10'}
              placeholderTextColor={colors.textSecondary}
              value={form.minValue}
              onChangeText={(v) => setForm((p) => ({ ...p, minValue: v.replace(/[^\d.]/g, '') }))}
            />
          </View>

          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Hạn sử dụng (nếu có)</Text>
            <TouchableOpacity
              style={[styles.selectTrigger, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={() => {
                const base = selectedExpiryDate || new Date();
                setCalendarMonth(new Date(base.getFullYear(), base.getMonth(), 1));
                setShowDatePicker(true);
              }}
            >
              <Text style={[styles.selectTriggerText, { color: selectedExpiryDate ? colors.text : colors.textSecondary }]}>
                {selectedExpiryDate ? formatDate(selectedExpiryDate) : 'DD/MM/YYYY'}
              </Text>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Thêm mới'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowDatePicker(false)} />
          <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>{calendarMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</Text>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.weekRow}>
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                <Text key={d} style={[styles.weekLabel, { color: colors.textSecondary }]}>{d}</Text>
              ))}
            </View>
            <View style={styles.grid}>
              {calendarDays.map((cell, idx) => {
                if (!cell) return <View key={`e-${idx}`} style={styles.dayCell} />;
                const active = selectedExpiryDate && formatIsoDate(selectedExpiryDate) === formatIsoDate(cell);
                return (
                  <TouchableOpacity
                    key={cell.toISOString()}
                    style={[styles.dayCell, active && styles.dayCellActive]}
                    onPress={() => { setSelectedExpiryDate(cell); setShowDatePicker(false); }}
                  >
                    <Text style={{ color: active ? '#fff' : colors.text }}>{cell.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showBarcodeScanner} animationType="slide" onRequestClose={() => setShowBarcodeScanner(false)}>
        <View style={[styles.scannerScreen, { backgroundColor: '#000' }]}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setShowBarcodeScanner(false)} style={styles.scannerHeaderBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Quét barcode</Text>
            <View style={styles.scannerHeaderBtn} />
          </View>

          {!cameraPermission ? (
            <View style={styles.scannerCenter}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : (
            <CameraView
              style={styles.scannerCamera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code128', 'itf14', 'codabar'],
              }}
              onBarcodeScanned={scannerPaused ? undefined : handleBarcodeScanned}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 24 },
  card: { borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  label: { ...Typography.captionMd, marginBottom: 4, marginTop: 6 },
  input: {
    minHeight: 42,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    ...Typography.bodySm,
    marginBottom: 4,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  barcodeInput: {
    flex: 1,
  },
  scanBtn: {
    width: 42,
    height: 42,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  twoCols: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 4 },
  thresholdRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  colWide: { flex: 1.2 },
  colNarrow: { flex: 0.8 },
  modeChip: {
    minHeight: 36,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChipCompact: {
    minWidth: 42,
    paddingHorizontal: 8,
  },
  modeChipWide: {
    minWidth: 108,
    paddingHorizontal: 10,
  },
  thresholdInput: {
    width: 78,
    minWidth: 78,
    maxWidth: 90,
    marginBottom: 0,
  },
  dropdown: { borderWidth: 1, borderRadius: Radius.md, padding: 8, marginBottom: 8 },
  dropdownItem: { minHeight: 34, justifyContent: 'center' },
  selectTrigger: {
    minHeight: 42,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectTriggerText: {
    ...Typography.bodySm,
    flex: 1,
  },
  saveBtn: {
    minHeight: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  saveBtnText: { ...Typography.bodyMd, color: '#fff', fontWeight: '800' },
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  calendarCard: { borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.md },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calendarTitle: { ...Typography.bodyMd, fontWeight: '800', textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekLabel: { flex: 1, textAlign: 'center', ...Typography.captionMd },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.285%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm },
  dayCellActive: { backgroundColor: Colors.primary },
  scannerScreen: {
    flex: 1,
  },
  scannerHeader: {
    paddingTop: 48,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scannerHeaderBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    ...Typography.bodyMd,
    color: '#fff',
    fontWeight: '700',
  },
  scannerCamera: {
    flex: 1,
  },
  scannerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
