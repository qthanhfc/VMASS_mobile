import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { FormField, Card } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import {
  createReturnRequest,
  listReturnRequests,
  listReturnableOrderHistory,
  listReturnableOrderHistoryByPhone,
  type ReturnableHistoryItem,
} from '../../services';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const REASONS = [
  { key: 'defective', labelKey: 'returns.reason.defective' },
  { key: 'notSatisfied', labelKey: 'returns.reason.notSatisfied' },
  { key: 'wrongSize', labelKey: 'returns.reason.wrongSize' },
  { key: 'expired', labelKey: 'returns.reason.expired' },
  { key: 'other', labelKey: 'returns.reason.other' },
] as const;

const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`;
const toYmd = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const formatDisplayDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
const orderCodePlaceholder = (date: Date) => {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `#${yy}${mm}${dd}02`;
};
const returnTicketPrefix = (date: Date) => {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `#TH-${yy}${mm}${dd}-`;
};

export function ReturnCreateScreen() {
  const { colors } = useThemeMode();
  const { locale, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [orderNum, setOrderNum] = useState('');
  const [debouncedOrderNum, setDebouncedOrderNum] = useState('');
  const [reason, setReason] = useState<(typeof REASONS)[number]['key']>('defective');
  const [notes, setNotes] = useState('');
  const [defectPhotos, setDefectPhotos] = useState<string[]>([]);
  const [historyItems, setHistoryItems] = useState<ReturnableHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketSequence, setTicketSequence] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [isPhoneSearchMode, setIsPhoneSearchMode] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [showDefectCamera, setShowDefectCamera] = useState(false);
  const [capturingDefectPhoto, setCapturingDefectPhoto] = useState(false);
  const defectCameraRef = useRef<CameraView | null>(null);
  const [dateMode, setDateMode] = useState<'single' | 'range'>('single');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [rangeSelectingStart, setRangeSelectingStart] = useState(true);
  const searchPlaceholder = useMemo(() => orderCodePlaceholder(new Date()), []);
  const returnTicketCode = useMemo(() => {
    const prefix = returnTicketPrefix(new Date());
    return `${prefix}${String(ticketSequence).padStart(3, '0')}`;
  }, [ticketSequence]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedOrderNum(orderNum.trim()), 350);
    return () => clearTimeout(timer);
  }, [orderNum]);

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

  const loadHistory = async (sDate: Date, eDate: Date) => {
    try {
      setLoadingHistory(true);
      const rows = await listReturnableOrderHistory(toYmd(sDate), toYmd(eDate));
      setHistoryItems(rows);
      setSelectedItems({});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tải được lịch sử đơn hàng';
      Alert.alert('Lỗi', message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const today = new Date();
        setStartDate(today);
        setEndDate(today);
        await loadHistory(today, today);
      } catch {
        // handled in loadHistory
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const rows = await listReturnRequests();
        const todayYmd = toYmd(new Date());
        const countToday = rows.filter((row) => {
          const created = String(row.createdAt || '');
          return created.slice(0, 10) === todayYmd;
        }).length;
        setTicketSequence(countToday + 1);
      } catch {
        setTicketSequence(1);
      }
    };
    run();
  }, []);

  const filteredItems = useMemo(() => {
    const query = orderNum.trim().toLowerCase();
    if (isPhoneSearchMode) return historyItems;
    if (!query) return historyItems;
    return historyItems.filter(
      (item) =>
        item.sourceOrderCode.toLowerCase().includes(query) ||
        item.productName.toLowerCase().includes(query) ||
        item.productSku.toLowerCase().includes(query),
    );
  }, [historyItems, isPhoneSearchMode, orderNum]);

  useEffect(() => {
    const query = debouncedOrderNum.replace(/[^\d+]/g, '');
    const isPhoneQuery = /^(\+?\d{9,13})$/.test(query);

    const run = async () => {
      if (!isPhoneQuery) {
        if (isPhoneSearchMode) {
          setIsPhoneSearchMode(false);
          const from = dateMode === 'single' ? startDate : startDate;
          const to = dateMode === 'single' ? startDate : endDate;
          await loadHistory(from, to);
        }
        return;
      }

      try {
        setLoadingHistory(true);
        setIsPhoneSearchMode(true);
        const rows = await listReturnableOrderHistoryByPhone(query);
        setHistoryItems(rows);
        setSelectedItems({});
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không tải được đơn theo số điện thoại';
        Alert.alert('Lỗi', message);
      } finally {
        setLoadingHistory(false);
      }
    };

    run();
  }, [dateMode, debouncedOrderNum, endDate, isPhoneSearchMode, startDate]);

  const selectedCount = useMemo(
    () => filteredItems.filter(item => selectedItems[item.itemKey]).length,
    [filteredItems, selectedItems]
  );
  const refundTotal = useMemo(
    () =>
      filteredItems.reduce(
        (sum, item) => (selectedItems[item.itemKey] ? sum + item.unitPrice * item.quantity : sum),
        0,
      ),
    [filteredItems, selectedItems]
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

  const onCreate = async () => {
    const selectedRows = filteredItems.filter(item => selectedItems[item.itemKey]);
    if (!selectedRows.length) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng chọn ít nhất 1 sản phẩm cần trả');
      return;
    }

    try {
      setSubmitting(true);
      const dedupByOrderId = Array.from(
        selectedRows.reduce((map, item) => map.set(item.orderId, item), new Map<number, ReturnableHistoryItem>()).values(),
      );
      await createReturnRequest({
        source_order_code: dedupByOrderId[0]?.sourceOrderCode,
        reason_key: reason,
        reason_text: t(REASONS.find(r => r.key === reason)?.labelKey || 'returns.reason.other'),
        notes,
        refund_method: 'cash',
        auto_submit: true,
        items: dedupByOrderId.map(item => ({
          order_id: item.orderId,
          product_id: item.productId ?? undefined,
          product_name: item.productName,
          product_sku: item.productSku,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      });

      Alert.alert('Thành công', 'Đã tạo phiếu trả hàng chờ duyệt', [
        { text: 'OK', onPress: () => nav.navigate('ReturnsList' as never) },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tạo được phiếu trả hàng';
      Alert.alert('Lỗi', message);
    } finally {
      setSubmitting(false);
    }
  };

  const onPickDate = (date: Date) => {
    if (dateMode === 'single') {
      setStartDate(date);
      setEndDate(date);
      return;
    }

    if (rangeSelectingStart) {
      setStartDate(date);
      setEndDate(date);
      setRangeSelectingStart(false);
      return;
    }

    if (date < startDate) {
      setEndDate(startDate);
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setRangeSelectingStart(true);
  };

  const onApplyDateFilter = async () => {
    const from = dateMode === 'single' ? startDate : startDate;
    const to = dateMode === 'single' ? startDate : endDate;
    setShowDatePicker(false);
    await loadHistory(from, to);
  };

  const openScanner = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Cần quyền camera', 'Vui lòng cấp quyền camera để quét mã.');
        return;
      }
    }
    setScannerPaused(false);
    setShowScanner(true);
  };

  const onBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scannerPaused) return;
    setScannerPaused(true);
    setOrderNum(String(data || '').trim());
    setShowScanner(false);
  };

  const onCaptureDefectPhoto = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Cần quyền camera', 'Vui lòng cấp quyền camera để chụp ảnh sản phẩm lỗi.');
        return;
      }
    }
    setShowDefectCamera(true);
  };

  const takeDefectPhoto = async () => {
    if (!defectCameraRef.current || capturingDefectPhoto) return;
    try {
      setCapturingDefectPhoto(true);
      const photo = await defectCameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      if (photo?.uri) {
        setDefectPhotos(current => [...current, photo.uri]);
      }
      setShowDefectCamera(false);
    } catch {
      Alert.alert('Cần quyền camera', 'Vui lòng cấp quyền camera để chụp ảnh sản phẩm lỗi.');
    } finally {
      setCapturingDefectPhoto(false);
    }
  };

  const dateFilterLabel =
    dateMode === 'single'
      ? `${formatDisplayDate(startDate)}`
      : `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('returns.createTitle')}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{returnTicketCode}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.createBtn,
            { backgroundColor: colors.primary },
            (submitting || selectedCount === 0) && styles.createBtnDisabled,
          ]}
          onPress={onCreate}
          disabled={submitting || selectedCount === 0}
        >
          <Text style={styles.createTxt}>{submitting ? '...' : t('returns.createAction')}</Text>
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
                placeholder={searchPlaceholder}
                style={[styles.monoInput, { borderColor: colors.primary }]}
              />
            </View>
            <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.primary }]} onPress={openScanner}>
              <Ionicons name="qr-code-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {showScanner && (
            <View style={[styles.inlineScannerWrap, { borderColor: mutedBorder, backgroundColor: paperDim }]}>
              <View style={styles.inlineScannerHeader}>
                <Text style={[styles.inlineScannerTitle, { color: colors.text }]}>
                  {locale === 'vi' ? 'Quét mã đơn hàng' : 'Scan order code'}
                </Text>
                <TouchableOpacity onPress={() => setShowScanner(false)} style={styles.inlineScannerCloseBtn}>
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {!cameraPermission?.granted ? (
                <View style={styles.inlineScannerEmpty}>
                  <Text style={[styles.inlineScannerEmptyText, { color: colors.textSecondary }]}>
                    {locale === 'vi' ? 'Không có quyền camera' : 'No camera permission'}
                  </Text>
                </View>
              ) : (
                <CameraView
                  style={styles.inlineScannerCamera}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code128', 'itf14', 'codabar'],
                  }}
                  onBarcodeScanned={scannerPaused ? undefined : onBarcodeScanned}
                />
              )}
            </View>
          )}
          <View style={[styles.customerCard, { backgroundColor: paperDim }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>OR</Text>
            </View>
            <View style={styles.customerMain}>
              <Text style={[styles.customerName, { color: colors.text }]}>
                {isPhoneSearchMode ? 'Đơn hàng theo số điện thoại' : 'Đơn bán trong ngày'}
              </Text>
              <Text style={[styles.customerMeta, { color: colors.textSecondary }]}>
                {filteredItems.length} dòng sản phẩm có thể trả hàng
              </Text>
            </View>
            <Text style={[styles.orderTotal, { color: colors.primary }]}>{Math.round(refundTotal / 1000)}K</Text>
          </View>
        </Card>

        <Card padding={0} style={styles.card}>
          <View style={[styles.cardHeader, { borderBottomColor: mutedBorder }]}>
            <View style={styles.returnHeaderTop}>
              <View style={styles.sectionTitleWrap}>
                {sectionTitle('bag-handle-outline', locale === 'vi' ? 'CHỌN SẢN PHẨM TRẢ' : 'ITEMS TO RETURN')}
              </View>
              {!isPhoneSearchMode && (
                <TouchableOpacity
                  style={[styles.dateFilterBtn, { borderColor: colors.border, backgroundColor: paperDim }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.dateFilterText, { color: colors.textSecondary }]} numberOfLines={1}>{dateFilterLabel}</Text>
                </TouchableOpacity>
              )}
              {isPhoneSearchMode && (
                <View style={[styles.phoneModeBadge, { borderColor: colors.border, backgroundColor: paperDim }]}>
                  <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.dateFilterText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {locale === 'vi' ? 'Theo số điện thoại' : 'By phone'}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {loadingHistory && (
            <View style={styles.historyLoading}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          )}
          <View style={styles.returnItemsViewport}>
            {filteredItems.length === 0 ? (
              <View style={[styles.emptyStateWrap, { borderColor: mutedBorder, backgroundColor: paperDim }]}>
                <Ionicons name="file-tray-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  {locale === 'vi' ? 'Không có đơn hàng trong khoảng ngày đã chọn' : 'No orders found for the selected date range'}
                </Text>
              </View>
            ) : (
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator
                contentContainerStyle={styles.returnItemsScrollContent}
              >
                {filteredItems.map((item, index) => {
                  const itemId = item.itemKey;
                  const selected = selectedItems[itemId];
                  return (
                    <TouchableOpacity
                      key={itemId}
                      onPress={() => toggleItem(itemId)}
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
                        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.productName}</Text>
                        <Text style={[styles.itemSku, { color: colors.textSecondary }]}>{item.productSku} · #{item.sourceOrderCode}</Text>
                        <View style={styles.itemMetaRow}>
                          <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                            SL: <Text style={[styles.itemMetaStrong, { color: colors.text }]}>{item.quantity}</Text>
                          </Text>
                          <Text style={[styles.itemReason, { color: colors.danger }]} numberOfLines={1}>
                            {item.date} {item.time?.slice(0, 5)}
                          </Text>
                          <Text style={[styles.itemPrice, { color: colors.primary }]}>{Math.round(item.unitPrice / 1000)}K</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
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
            {defectPhotos.map((uri) => (
              <View key={uri} style={[styles.photoBox, { borderColor: mutedBorder }]}>
                <Image source={{ uri }} style={styles.photoPreview} resizeMode="cover" />
              </View>
            ))}
            <TouchableOpacity style={[styles.addPhotoBox, { borderColor: colors.border }]} onPress={onCaptureDefectPhoto}>
              <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
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

      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowDatePicker(false)} />
          <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, dateMode === 'single' && styles.modeBtnActive]}
                onPress={() => {
                  setDateMode('single');
                  setRangeSelectingStart(true);
                }}
              >
                <Text style={[styles.modeText, dateMode === 'single' && styles.modeTextActive]}>{locale === 'vi' ? 'Theo ngày' : 'Single day'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, dateMode === 'range' && styles.modeBtnActive]}
                onPress={() => {
                  setDateMode('range');
                  setRangeSelectingStart(true);
                }}
              >
                <Text style={[styles.modeText, dateMode === 'range' && styles.modeTextActive]}>{locale === 'vi' ? 'Khoảng ngày' : 'Date range'}</Text>
              </TouchableOpacity>
            </View>

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
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label) => (
                <Text key={label} style={[styles.weekLabel, { color: colors.textSecondary }]}>{label}</Text>
              ))}
            </View>
            <View style={styles.grid}>
              {calendarDays.map((cell, idx) => {
                if (!cell) return <View key={`e-${idx}`} style={styles.dayCell} />;
                const today = new Date();
                const isFuture =
                  cell.getFullYear() > today.getFullYear() ||
                  (cell.getFullYear() === today.getFullYear() && cell.getMonth() > today.getMonth()) ||
                  (cell.getFullYear() === today.getFullYear() &&
                    cell.getMonth() === today.getMonth() &&
                    cell.getDate() > today.getDate());
                const selectedStart = toYmd(cell) === toYmd(startDate);
                const selectedEnd = toYmd(cell) === toYmd(endDate);
                const inRange =
                  dateMode === 'range' &&
                  cell.getTime() > startDate.getTime() &&
                  cell.getTime() < endDate.getTime();
                const active = dateMode === 'single' ? selectedStart : (selectedStart || selectedEnd);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dayCell,
                      isFuture && styles.dayCellDisabled,
                      inRange && styles.dayCellInRange,
                      active && styles.dayCellActive,
                    ]}
                    onPress={() => onPickDate(cell)}
                    disabled={isFuture}
                  >
                    <Text
                      style={{
                        color: active ? '#fff' : isFuture ? colors.textSecondary : colors.text,
                        opacity: isFuture ? 0.45 : 1,
                      }}
                    >
                      {cell.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={onApplyDateFilter}>
              <Text style={styles.applyBtnText}>{locale === 'vi' ? 'Áp dụng' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showDefectCamera} animationType="slide" onRequestClose={() => setShowDefectCamera(false)}>
        <View style={styles.captureScreen}>
          <View style={styles.captureHeader}>
            <TouchableOpacity onPress={() => setShowDefectCamera(false)} style={styles.captureHeaderBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.captureTitle}>{locale === 'vi' ? 'Chụp ảnh sản phẩm lỗi' : 'Capture defect photo'}</Text>
            <View style={styles.captureHeaderBtn} />
          </View>
          <CameraView ref={defectCameraRef} style={styles.captureCamera} facing="back" />
          <View style={styles.captureFooter}>
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={takeDefectPhoto}
              disabled={capturingDefectPhoto}
            >
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  createBtnDisabled: { opacity: 0.45 },
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
  returnHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitleWrap: { flex: 1, minWidth: 0 },
  dateFilterBtn: {
    minHeight: 30,
    maxWidth: '52%',
    borderWidth: 1,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  dateFilterText: { ...Typography.caption, flex: 1 },
  phoneModeBadge: {
    minHeight: 30,
    maxWidth: '52%',
    borderWidth: 1,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  historyLoading: { paddingVertical: 8, alignItems: 'center' },
  returnItemsViewport: {
    maxHeight: 440,
  },
  returnItemsScrollContent: {
    paddingBottom: 2,
  },
  emptyStateWrap: {
    minHeight: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginVertical: 10,
  },
  emptyStateText: {
    ...Typography.captionMd,
    textAlign: 'center',
  },
  returnItem: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderStyle: 'dashed' },
  firstReturnItem: { borderTopWidth: 0 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  thumb: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
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
  photoBox: { width: 60, height: 60, borderRadius: Radius.md, borderWidth: 1, borderStyle: 'dashed', overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  addPhotoBox: { width: 60, height: 60, borderRadius: Radius.md, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  summaryCard: { borderRadius: Radius.lg, padding: 14, backgroundColor: Colors.primary, ...Shadow.md },
  summaryLabel: { ...Typography.label, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  summaryVal: { fontSize: 26, fontWeight: '800', color: '#fff', fontFamily: 'monospace' },
  summaryCount: { ...Typography.captionMd, color: 'rgba(255,255,255,0.85)' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', padding: 18 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  calendarCard: { borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.md },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  modeBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, alignItems: 'center', paddingVertical: 8 },
  modeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  modeText: { ...Typography.captionMd, color: Colors.textSecondary, fontWeight: '700' },
  modeTextActive: { color: Colors.primary },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calendarTitle: { ...Typography.bodyMd, fontWeight: '800', textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekLabel: { flex: 1, textAlign: 'center', ...Typography.captionMd },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm },
  dayCellDisabled: { opacity: 0.55 },
  dayCellInRange: { backgroundColor: 'rgba(0, 142, 204, 0.18)' },
  dayCellActive: { backgroundColor: Colors.primary },
  applyBtn: { marginTop: 10, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', paddingVertical: 10 },
  applyBtnText: { ...Typography.bodySm, color: '#fff', fontWeight: '700' },
  inlineScannerWrap: {
    marginTop: -2,
    marginBottom: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    padding: 8,
    gap: 8,
  },
  inlineScannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inlineScannerTitle: { ...Typography.captionMd, fontWeight: '700' },
  inlineScannerCloseBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  inlineScannerCamera: { width: '100%', height: 180, borderRadius: Radius.sm, overflow: 'hidden' },
  inlineScannerEmpty: { width: '100%', height: 120, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  inlineScannerEmptyText: { ...Typography.captionMd },
  captureScreen: { flex: 1, backgroundColor: '#000' },
  captureHeader: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  captureHeaderBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  captureTitle: { ...Typography.bodySm, color: '#fff', fontWeight: '700' },
  captureCamera: { flex: 1 },
  captureFooter: { paddingVertical: 18, alignItems: 'center' },
  captureBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff' },
});
