import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, BarcodeType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import { products as productsApi } from '../../api/client';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ScanActionItem } from '../../navigation';
import { Colors, Typography, Radius, Spacing, useThemeMode } from '../../theme';

type ScanMode = 'Barcode' | 'QR Code' | 'Hình ảnh';
type ScanStatus = 'pending' | 'processed';
type RecentScan = { id: number; text: string; scannedAt: number; type: string; qty: number; status: ScanStatus };
type LastScan = { data: string; type: string; scannedAt: number };
type ImageSearchProduct = { id?: number; name?: string; sku?: string; confidence?: number };
type PaymentQrInfo = { raw: string; amount?: string; note?: string; merchantName?: string; merchantCity?: string };
type ImageSearchResponse = {
  product?: ImageSearchProduct;
  match?: ImageSearchProduct;
  items?: ImageSearchProduct[];
  matches?: ImageSearchProduct[];
};

const MODES: ScanMode[] = ['Barcode', 'QR Code', 'Hình ảnh'];
const MODE_LABEL_KEYS: Record<ScanMode, TranslationKey> = {
  Barcode: 'scan.mode.barcode',
  'QR Code': 'scan.mode.qr',
  'Hình ảnh': 'scan.mode.image',
};
const DUPLICATE_SCAN_WINDOW_MS = 1800;
const RESULT_VISIBLE_MS = 1400;
const BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code39',
  'code93',
  'code128',
  'codabar',
  'itf14',
  'pdf417',
  'datamatrix',
  'aztec',
];
const SCANNABLE_TYPES: BarcodeType[] = ['qr', ...BARCODE_TYPES];
const INITIAL_RECENT_SCANS: RecentScan[] = [];

const getStartOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const URL_PATTERN = /^(https?:\/\/|www\.)\S+$/i;
const BARE_DOMAIN_PATTERN = /^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i;
const PAYMENT_SCHEME_PATTERN = /^(vietqr|bank|momo|zalopay|vnpay|shopeepay|deeplink):/i;

const normalizeUrl = (value: string) => {
  const trimmed = value.trim().replace(/^URL:/i, '').trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.toLowerCase().startsWith('www.') || BARE_DOMAIN_PATTERN.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
};

const isWebUrl = (value: string) => {
  const normalized = normalizeUrl(value);
  return URL_PATTERN.test(normalized) || BARE_DOMAIN_PATTERN.test(normalized.replace(/^https?:\/\//i, ''));
};
const isPaymentDeepLink = (value: string) => PAYMENT_SCHEME_PATTERN.test(value.trim());
const isQrType = (type: string) => type.toLowerCase().includes('qr');

const parseEmvFields = (payload: string) => {
  const fields: Record<string, string[]> = {};
  let index = 0;

  while (index + 4 <= payload.length) {
    const id = payload.slice(index, index + 2);
    const length = Number(payload.slice(index + 2, index + 4));

    if (!Number.isFinite(length) || length < 0) {
      break;
    }

    const start = index + 4;
    const end = start + length;

    if (end > payload.length) {
      break;
    }

    fields[id] = [...(fields[id] ?? []), payload.slice(start, end)];
    index = end;
  }

  return fields;
};

const parsePaymentQr = (payload: string): PaymentQrInfo | null => {
  const raw = payload.trim();
  const fields = parseEmvFields(raw);
  const isEmvQr = fields['00']?.[0] === '01' && Boolean(fields['53'] || fields['38'] || fields['54']);

  if (!isEmvQr && !isPaymentDeepLink(raw)) {
    return null;
  }

  return {
    raw,
    amount: fields['54']?.[0],
    note: fields['62']?.[0] ? parseEmvFields(fields['62'][0])['08']?.[0] : undefined,
    merchantName: fields['59']?.[0],
    merchantCity: fields['60']?.[0],
  };
};

const formatScanTime = (
  scannedAt: number,
  now: number,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
) => {
  const elapsedSeconds = Math.max(0, Math.floor((now - scannedAt) / 1000));

  if (elapsedSeconds < 10) {
    return t('scan.justNow');
  }

  if (elapsedSeconds < 60) {
    return t('scan.secondsAgo', { count: elapsedSeconds });
  }

  return t('scan.minutesAgo', { count: Math.floor(elapsedSeconds / 60) });
};

export function QrScanScreen() {
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('Barcode');
  const [flash, setFlash] = useState(false);
  const [lastResult, setLastResult] = useState<RecentScan | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>(INITIAL_RECENT_SCANS);
  const [selectedScanIds, setSelectedScanIds] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [imageSearchStatus, setImageSearchStatus] = useState<'idle' | 'searching' | 'found' | 'notFound' | 'error'>('idle');
  const [imageSearchMessage, setImageSearchMessage] = useState(t('scan.imageInitial'));
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [paymentQrInfo, setPaymentQrInfo] = useState<PaymentQrInfo | null>(null);
  const lastScanRef = useRef<LastScan | null>(null);
  const scanIdRef = useRef(INITIAL_RECENT_SCANS.length);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setCurrentTime(now);
      setRecentScans(current => current.filter(scan => scan.scannedAt >= getStartOfDay(now)));
    }, 30000);

    return () => {
      clearInterval(interval);

      if (resultTimerRef.current) {
        clearTimeout(resultTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (imageSearchStatus === 'idle') {
      setImageSearchMessage(t('scan.imageInitial'));
    }
  }, [imageSearchStatus, t]);

  const barcodeTypes = useMemo<BarcodeType[]>(() => SCANNABLE_TYPES, []);

  const visibleRecentScans = useMemo(
    () => recentScans.filter(scan => {
      const withinWindow = scan.scannedAt >= getStartOfDay(currentTime);

      if (!withinWindow) {
        return false;
      }

      if (mode === 'QR Code') {
        return scan.type === 'qr';
      }

      if (mode === 'Hình ảnh') {
        return scan.type === 'image';
      }

      return scan.type !== 'qr' && scan.type !== 'image';
    }),
    [currentTime, mode, recentScans],
  );
  const pendingVisibleScans = useMemo(
    () => visibleRecentScans.filter(scan => scan.status === 'pending'),
    [visibleRecentScans],
  );
  const selectedScans = useMemo(
    () => visibleRecentScans.filter(scan => selectedScanIds.includes(scan.id) && scan.status === 'pending'),
    [selectedScanIds, visibleRecentScans],
  );
  const actionableScans = selectedScans.length > 0 ? selectedScans : pendingVisibleScans;
  const actionableQty = actionableScans.reduce((sum, scan) => sum + scan.qty, 0);
  const scannerPaused = Boolean(webViewUrl || paymentQrInfo);
  const recentScopeLabel = mode === 'QR Code' ? 'QR' : mode === 'Hình ảnh' ? t('scan.imageScope') : t('scan.barcodeScope');

  const handleModePress = (nextMode: ScanMode) => {
    setMode(nextMode);
    lastScanRef.current = null;
    setSelectedScanIds([]);
    setWebViewUrl(null);
    setPaymentQrInfo(null);
  };

  const showTransientResult = () => {
    setResultVisible(true);

    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
    }

    resultTimerRef.current = setTimeout(() => {
      setResultVisible(false);
    }, RESULT_VISIBLE_MS);
  };

  const addRecentScan = (text: string, type: string, now = Date.now()) => {
    const nextId = scanIdRef.current + 1;
    scanIdRef.current = nextId;

    const nextResult = {
      id: nextId,
      text,
      scannedAt: now,
      type,
      qty: 1,
      status: 'pending' as const,
    };

    setCurrentTime(now);
    setLastResult(nextResult);
    setRecentScans(current => {
      const recent = current.filter(scan => scan.scannedAt >= getStartOfDay(now));
      const existing = recent.find(scan => scan.text === text && scan.type === type && scan.status === 'pending');

      if (existing) {
        return recent.map(scan =>
          scan.id === existing.id
            ? { ...scan, qty: scan.qty + 1, scannedAt: now }
            : scan,
        );
      }

      return [nextResult, ...recent];
    });
    showTransientResult();
  };

  const toggleScanSelection = (id: number) => {
    const scan = recentScans.find(item => item.id === id);
    if (scan?.status === 'processed') {
      return;
    }

    setSelectedScanIds(current =>
      current.includes(id) ? current.filter(item => item !== id) : [...current, id],
    );
  };

  const openQrPayload = (payload: string) => {
    const paymentInfo = parsePaymentQr(payload);

    if (paymentInfo) {
      setWebViewUrl(null);
      setPaymentQrInfo(paymentInfo);
      return;
    }

    if (isWebUrl(payload)) {
      setPaymentQrInfo(null);
      setWebViewUrl(normalizeUrl(payload));
    }
  };

  const handleRecentScanPress = (scan: RecentScan) => {
    if (mode === 'QR Code') {
      openQrPayload(scan.text);
      return;
    }

    toggleScanSelection(scan.id);
  };

  const toActionItems = (scans: RecentScan[]): ScanActionItem[] => {
    return scans.map(scan => ({
      code: scan.text,
      name: scan.text,
      sku: scan.text.split(' - ')[0] || scan.text,
      qty: scan.qty,
      source: scan.type === 'image' ? 'image' : scan.type === 'qr' ? 'qr' : 'barcode',
    }));
  };

  const markActioned = (scans: RecentScan[]) => {
    const ids = scans.map(scan => scan.id);
    setRecentScans(current =>
      current.map(scan => ids.includes(scan.id) ? { ...scan, status: 'processed' } : scan),
    );
    setSelectedScanIds([]);
  };

  const handleScanAction = (action: 'sale' | 'import' | 'transfer' | 'audit') => {
    if (actionableScans.length === 0) {
      return;
    }

    const scanItems = toActionItems(actionableScans);
    markActioned(actionableScans);

    if (action === 'sale') {
      nav.navigate('Manage', { screen: 'PosScreen', params: { scanItems } });
      return;
    }

    nav.navigate('Manage', {
      screen: 'InventoryEdit',
      params: {
        mode: action === 'audit' ? 'audit' : action,
        scanItems,
      },
    });
  };

  const getBestImageMatch = (response: ImageSearchResponse) => {
    return response.product ?? response.match ?? response.items?.[0] ?? response.matches?.[0] ?? null;
  };

  const formatImageMatchText = (product: ImageSearchProduct) => {
    const name = product.name?.trim() || t('scan.unnamedProduct');
    const sku = product.sku?.trim();

    return sku ? `${sku} - ${name}` : name;
  };

  const formatConfidence = (confidence: number) => {
    return Math.round(confidence <= 1 ? confidence * 100 : confidence);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setImageSearchStatus('error');
      setImageSearchMessage(t('scan.imagePermissionError'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setSelectedImageUri(asset.uri);
    setImageSearchStatus('searching');
    setImageSearchMessage(t('scan.imageSearching'));

    try {
      const response = await productsApi.imageSearch(asset.uri, asset.fileName ?? 'product-image.jpg') as unknown as ImageSearchResponse;
      const bestMatch = getBestImageMatch(response);

      if (!bestMatch) {
        setImageSearchStatus('notFound');
        setImageSearchMessage(t('scan.imageNotFound'));
        return;
      }

      const text = formatImageMatchText(bestMatch);
      addRecentScan(text, 'image');
      setImageSearchStatus('found');
      setImageSearchMessage(
        typeof bestMatch.confidence === 'number'
          ? t('scan.imageFoundWithConfidence', { confidence: formatConfidence(bestMatch.confidence) })
          : t('scan.imageFound'),
      );
    } catch {
      setImageSearchStatus('error');
      setImageSearchMessage(t('scan.imageBackendError'));
    }
  };

  const handleBarcodeScanned = ({ data, type }: BarcodeScanningResult) => {
    const now = Date.now();
    const normalizedType = isQrType(type) ? 'qr' : type;

    if (mode === 'Barcode' && normalizedType === 'qr') {
      return;
    }

    if (mode === 'QR Code' && normalizedType !== 'qr') {
      return;
    }

    const lastScan = lastScanRef.current;
    const isDuplicate =
      lastScan?.data === data &&
      lastScan.type === normalizedType &&
      now - lastScan.scannedAt < DUPLICATE_SCAN_WINDOW_MS;

    if (isDuplicate) {
      return;
    }

    lastScanRef.current = { data, type: normalizedType, scannedAt: now };

    addRecentScan(data, normalizedType, now);
  };

  const handleOpenPayment = async () => {
    if (!paymentQrInfo) {
      return;
    }

    if (isWebUrl(paymentQrInfo.raw) || isPaymentDeepLink(paymentQrInfo.raw)) {
      await Linking.openURL(normalizeUrl(paymentQrInfo.raw));
    }
  };

  const renderCameraContent = () => {
    if (mode === 'Hình ảnh') {
      return (
        <View style={styles.imageSearchPanel}>
          <View style={styles.imagePreview}>
            {selectedImageUri ? (
              <Image source={{ uri: selectedImageUri }} style={styles.imagePreviewPhoto} />
            ) : (
              <>
                <Ionicons name="image-outline" size={52} color="rgba(255,255,255,0.42)" />
                <Text style={styles.imagePreviewText}>{t('scan.noImageSelected')}</Text>
              </>
            )}
          </View>
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={imageSearchStatus === 'searching'}
            style={[styles.imagePickBtn, imageSearchStatus === 'searching' && styles.imagePickBtnDisabled]}
          >
            {imageSearchStatus === 'searching' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            )}
            <Text style={styles.imagePickBtnText}>
              {selectedImageUri ? t('scan.pickAnotherImage') : t('scan.uploadImage')}
            </Text>
          </TouchableOpacity>
          <Text style={[
            styles.imageSearchMessage,
            imageSearchStatus === 'found' && styles.imageSearchMessageFound,
            imageSearchStatus === 'error' && styles.imageSearchMessageError,
          ]}>
            {imageSearchMessage}
          </Text>
        </View>
      );
    }

    if (!permission) {
      return (
        <View style={styles.cameraFallback}>
          <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.35)" />
          <Text style={styles.cameraHint}>{t('scan.cameraChecking')}</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.cameraFallback}>
          <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.35)" />
          <Text style={styles.permissionTitle}>{t('scan.cameraPermissionTitle')}</Text>
          <Text style={styles.permissionText}>{t('scan.cameraPermissionText')}</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
            <Text style={styles.permissionBtnText}>{t('scan.cameraPermissionButton')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flash}
        active={isFocused && !scannerPaused}
        barcodeScannerSettings={{ barcodeTypes }}
        onBarcodeScanned={scannerPaused ? undefined : handleBarcodeScanned}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Dark header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (nav.canGoBack?.() ? nav.goBack() : nav.navigate('Manage'))} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('scan.title')}</Text>
        <TouchableOpacity onPress={() => setFlash(f => !f)} style={styles.iconBtn}>
          <Ionicons name={flash ? 'flash' : 'flash-outline'} size={22} color={flash ? '#FFD700' : '#fff'} />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraArea}>
        {renderCameraContent()}

        {mode !== 'Hình ảnh' && (
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            <View style={styles.scanLine} />
          </View>
        )}
        {resultVisible && lastResult && (
          <View style={styles.scanResult}>
            <Ionicons name={lastResult.type === 'qr' ? 'qr-code-outline' : lastResult.type === 'image' ? 'image-outline' : 'barcode-outline'} size={24} color="#fff" />
            <View style={styles.scanResultTextWrap}>
              <Text style={styles.scanResultLabel}>{t('scan.scanned', { type: lastResult.type })}</Text>
              <Text numberOfLines={1} style={styles.scanResultValue}>{lastResult.text}</Text>
            </View>
          </View>
        )}
      </View>

      {paymentQrInfo && (
        <View style={styles.qrActionPanel}>
          <View style={styles.qrActionHeader}>
            <Ionicons name="card-outline" size={20} color={Colors.primary} />
            <Text style={styles.qrActionTitle}>{t('scan.paymentQrTitle')}</Text>
            <TouchableOpacity onPress={() => setPaymentQrInfo(null)} style={styles.qrActionClose}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text numberOfLines={1} style={styles.qrActionText}>
            {paymentQrInfo.merchantName || paymentQrInfo.note || t('scan.paymentDetected')}
          </Text>
          <View style={styles.qrActionMetaRow}>
            <Text style={styles.qrActionMeta}>
              {t('scan.amount')}: {paymentQrInfo.amount ? `${Number(paymentQrInfo.amount).toLocaleString(dateLocale)} ${t('home.currency')}` : t('scan.amountFromQr')}
            </Text>
            {paymentQrInfo.merchantCity && <Text style={styles.qrActionMeta}>{paymentQrInfo.merchantCity}</Text>}
          </View>
          <TouchableOpacity
            onPress={handleOpenPayment}
            disabled={!isWebUrl(paymentQrInfo.raw) && !isPaymentDeepLink(paymentQrInfo.raw)}
            style={[styles.qrActionPrimary, !isWebUrl(paymentQrInfo.raw) && !isPaymentDeepLink(paymentQrInfo.raw) && styles.qrActionPrimaryDisabled]}
          >
            <Ionicons name="open-outline" size={17} color="#fff" />
            <Text style={styles.qrActionPrimaryText}>
              {isWebUrl(paymentQrInfo.raw) || isPaymentDeepLink(paymentQrInfo.raw) ? t('scan.openPaymentApp') : t('scan.payWithBankApp')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mode selector */}
      <View style={styles.modeBar}>
        {MODES.map(m => (
          <TouchableOpacity key={m} onPress={() => handleModePress(m)} style={[styles.modeBtn, mode === m && styles.modeBtnActive]}>
            <Text style={[styles.modeLabel, mode === m && { color: '#fff' }]}>{t(MODE_LABEL_KEYS[m])}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent scans */}
      <View style={[styles.recentSection, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.recentHeader}>
          <Text style={[styles.recentTitle, { color: colors.textSecondary }]}>{t('scan.historyToday')}</Text>
          <Text style={[styles.recentCount, { color: colors.textSecondary }]}>
            {t('scan.historySummary', { count: visibleRecentScans.length, scope: recentScopeLabel, qty: actionableQty })}
          </Text>
        </View>
        {visibleRecentScans.length > 0 && mode !== 'QR Code' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scanActionsScroll}
            contentContainerStyle={styles.scanActions}
          >
            {[
              { key: 'sale', labelKey: 'scan.action.sale' as TranslationKey, icon: 'cart-outline' as const },
              { key: 'import', labelKey: 'scan.action.import' as TranslationKey, icon: 'arrow-down-circle-outline' as const },
              { key: 'transfer', labelKey: 'scan.action.transfer' as TranslationKey, icon: 'swap-horizontal-outline' as const },
              { key: 'audit', labelKey: 'scan.action.audit' as TranslationKey, icon: 'checkbox-outline' as const },
            ].map(action => (
              <TouchableOpacity
                key={action.key}
                onPress={() => handleScanAction(action.key as 'sale' | 'import' | 'transfer' | 'audit')}
                disabled={actionableScans.length === 0}
                style={[styles.scanActionBtn, actionableScans.length === 0 && styles.scanActionBtnDisabled]}
              >
                <Ionicons name={action.icon} size={15} color="#fff" />
                <Text style={styles.scanActionText}>{t(action.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        {visibleRecentScans.length > 0 ? (
          <ScrollView style={styles.recentList} showsVerticalScrollIndicator>
            {visibleRecentScans.map(s => (
              <TouchableOpacity
                key={s.id}
                onPress={() => handleRecentScanPress(s)}
                style={[
                  styles.recentRow,
                  { borderBottomColor: colors.border },
                  mode !== 'QR Code' && selectedScanIds.includes(s.id) && { backgroundColor: colors.primaryLight },
                  s.status === 'processed' && styles.recentRowProcessed,
                ]}
              >
                <Ionicons
                  name={mode !== 'QR Code' && selectedScanIds.includes(s.id) ? 'checkmark-circle' : s.type === 'qr' ? 'qr-code-outline' : s.type === 'image' ? 'image-outline' : 'barcode-outline'}
                  size={20}
                  color={mode !== 'QR Code' && selectedScanIds.includes(s.id) ? colors.primary : colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={[styles.recentText, { color: colors.text }]}>{s.text}</Text>
                  <Text style={[styles.recentTime, { color: colors.textSecondary }]}>
                    {mode === 'QR Code'
                      ? `${parsePaymentQr(s.text) ? t('scan.qrPaymentType') : isWebUrl(s.text) ? t('scan.qrWebType') : t('scan.qrContentType')} · ${formatScanTime(s.scannedAt, currentTime, t)}`
                      : t('scan.qtyStatus', {
                          qty: s.qty,
                          status: s.status === 'processed' ? t('scan.statusProcessed') : t('scan.statusPending'),
                          time: formatScanTime(s.scannedAt, currentTime, t),
                        })}
                  </Text>
                </View>
                <View style={[styles.qtyPill, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {mode === 'QR Code' ? (
                    <Ionicons name="open-outline" size={15} color={colors.text} />
                  ) : (
                    <Text style={[styles.qtyPillText, { color: colors.text }]}>x{s.qty}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.recentEmpty}>
            <Ionicons name="scan-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.recentEmptyText, { color: colors.textSecondary }]}>{t('scan.emptyToday', { scope: recentScopeLabel })}</Text>
            <Text style={[styles.recentEmptyHint, { color: colors.textSecondary }]}>{t('scan.emptyHint')}</Text>
          </View>
        )}
      </View>

      {webViewUrl && (
        <View style={[styles.webOverlay, { paddingTop: insets.top }]}>
          <View style={styles.webHeader}>
            <TouchableOpacity onPress={() => setWebViewUrl(null)} style={styles.webHeaderBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text numberOfLines={1} style={styles.webTitle}>{webViewUrl}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(webViewUrl)} style={styles.webHeaderBtn}>
              <Ionicons name="open-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <WebView source={{ uri: webViewUrl }} style={styles.webView} />
        </View>
      )}
    </View>
  );
}

const CORNER_SIZE = 22;
const CORNER_W = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12 },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3, color: '#fff', flex: 1 },
  iconBtn: { padding: 4 },
  cameraArea: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cameraFallback: { ...StyleSheet.absoluteFillObject, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  cameraHint: { ...Typography.caption, color: 'rgba(255,255,255,0.3)', marginTop: 8 },
  permissionTitle: { ...Typography.h3, color: '#fff', marginTop: 12, textAlign: 'center' },
  permissionText: { ...Typography.bodyMd, color: 'rgba(255,255,255,0.65)', marginTop: 8, textAlign: 'center' },
  permissionBtn: { marginTop: 16, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 18, paddingVertical: 10 },
  permissionBtnText: { ...Typography.label, color: '#fff' },
  imageSearchPanel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#181818',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  imagePreview: {
    width: '78%',
    maxWidth: 280,
    aspectRatio: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePreviewPhoto: { width: '100%', height: '100%' },
  imagePreviewText: { ...Typography.captionMd, color: 'rgba(255,255,255,0.48)', marginTop: 8 },
  imagePickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 16,
    minWidth: 150,
  },
  imagePickBtnDisabled: { opacity: 0.72 },
  imagePickBtnText: { ...Typography.bodyMd, color: '#fff' },
  imageSearchMessage: { ...Typography.captionMd, color: 'rgba(255,255,255,0.58)', marginTop: 12, textAlign: 'center' },
  imageSearchMessageFound: { color: Colors.success },
  imageSearchMessageError: { color: Colors.warning },
  scanFrame: { width: 220, height: 220, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  scanResult: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 12,
  },
  scanResultTextWrap: { flex: 1 },
  scanResultLabel: { ...Typography.captionMd, color: 'rgba(255,255,255,0.7)' },
  scanResultValue: { ...Typography.bodyMd, color: '#fff', marginTop: 2 },
  qrActionPanel: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#202020',
    padding: Spacing.md,
  },
  qrActionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qrActionTitle: { ...Typography.bodyMd, color: '#fff', flex: 1 },
  qrActionClose: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  qrActionText: { ...Typography.bodySm, color: 'rgba(255,255,255,0.82)', marginTop: 8 },
  qrActionMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  qrActionMeta: { ...Typography.captionMd, color: 'rgba(255,255,255,0.56)' },
  qrActionPrimary: {
    marginTop: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  qrActionPrimaryDisabled: { backgroundColor: 'rgba(255,255,255,0.14)' },
  qrActionPrimaryText: { ...Typography.captionMd, color: '#fff' },
  webOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
    zIndex: 20,
    elevation: 20,
  },
  webHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  webHeaderBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  webTitle: { ...Typography.captionMd, color: '#fff', flex: 1 },
  webView: { flex: 1, backgroundColor: '#fff' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderTopWidth: CORNER_W, borderRightWidth: CORNER_W, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W, borderBottomRightRadius: 4 },
  scanLine: { position: 'absolute', width: '80%', height: 2, backgroundColor: Colors.primary, opacity: 0.8 },
  modeBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', margin: Spacing.lg, borderRadius: Radius.full, padding: 3 },
  modeBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.full },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeLabel: { ...Typography.captionMd, color: 'rgba(255,255,255,0.6)' },
  recentSection: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, padding: Spacing.lg, maxHeight: 320 },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  recentTitle: { ...Typography.label, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.6 },
  recentCount: { ...Typography.captionMd, color: 'rgba(255,255,255,0.42)' },
  scanActionsScroll: { marginBottom: 10, maxHeight: 34 },
  scanActions: { flexDirection: 'row', gap: 6, paddingRight: Spacing.md },
  scanActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexShrink: 0,
  },
  scanActionBtnDisabled: { opacity: 0.4 },
  scanActionText: { ...Typography.label, color: '#fff', letterSpacing: 0 },
  recentList: { maxHeight: 196 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  recentRowSelected: { backgroundColor: 'rgba(0,142,204,0.14)' },
  recentRowProcessed: { opacity: 0.55 },
  recentText: { ...Typography.bodyMd, color: '#fff' },
  recentTime: { ...Typography.caption, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  qtyPill: { minWidth: 34, height: 24, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  qtyPillText: { ...Typography.captionMd, color: '#fff' },
  recentEmpty: { minHeight: 86, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md },
  recentEmptyText: { ...Typography.captionMd, color: 'rgba(255,255,255,0.52)', marginTop: 6, textAlign: 'center' },
  recentEmptyHint: { ...Typography.caption, color: 'rgba(255,255,255,0.34)', marginTop: 4, textAlign: 'center' },
});
