import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Header } from '../../components/Header';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { useLanguage, type TranslationKey } from '../../i18n';
import {
  computeMinStock,
  getMinStockSettings,
  listInventoryStocks,
  listWarehouseTransfers,
  type InventoryStock,
} from '../../services';

type WarehouseTab = {
  key: string;
  label: string;
};

type StockStatusFilter = 'all' | 'low' | 'in-stock' | 'out' | 'negative';

type StockStatusTab = {
  key: StockStatusFilter;
  label: string;
};

type SortKey = 'name-asc' | 'name-desc' | 'qty-asc' | 'qty-desc';

const QUICK_ACTIONS = [
  {
    key: 'stock-in',
    mode: 'import' as const,
    titleKey: 'inventory.action.stockIn',
    subtitleKey: 'inventory.action.createSlip',
    icon: 'arrow-up' as const,
    iconColor: Colors.primary,
    iconBg: '#c4e4f2',
    iconBorder: Colors.primary,
  },
  {
    key: 'stock-out',
    mode: 'export' as const,
    titleKey: 'inventory.action.stockOut',
    subtitleKey: 'inventory.action.createSlip',
    icon: 'arrow-down' as const,
    iconColor: '#c97a7a',
    iconBg: '#f0d4d4',
    iconBorder: '#c97a7a',
  },
  {
    key: 'transfer',
    mode: 'transfer' as const,
    titleKey: 'inventory.action.transfer',
    subtitleKey: 'inventory.action.betweenWarehouses',
    icon: 'repeat' as const,
    iconColor: '#c4a274',
    iconBg: '#f4e5c4',
    iconBorder: '#c4a274',
  },
  {
    key: 'stocktake',
    mode: 'audit' as const,
    titleKey: 'inventory.action.stocktake',
    subtitleKey: 'inventory.action.compare',
    icon: 'checkmark' as const,
    iconColor: '#7a9e7a',
    iconBg: '#d4e4c4',
    iconBorder: '#7a9e7a',
  },
];

type InventoryListItem = {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  qty: number;
  minStock: number;
  unit: string;
  location: string;
  warehouse: string;
  averagePrice: number;
};

function isLowStock(qty: number, minStock: number) {
  return qty <= minStock;
}

const formatDecimal = (value: number) => {
  const rounded = Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);
};

export function InventoryScreen({ navigation }: any) {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const [warehouse, setWarehouse] = useState('all');
  const [warehouseTabs, setWarehouseTabs] = useState<WarehouseTab[]>([
    { key: 'all', label: t('inventory.warehouse.all') },
  ]);
  const [items, setItems] = useState<InventoryListItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name-asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannerPaused, setScannerPaused] = useState(false);

  const statusTabs = useMemo<StockStatusTab[]>(
    () => [
      { key: 'all', label: 'Tất cả' },
      { key: 'low', label: 'Sắp thiếu' },
      { key: 'in-stock', label: 'Còn hàng' },
      { key: 'out', label: 'Hết hàng' },
      { key: 'negative', label: 'Âm kho' },
    ],
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [minStockSettings, setMinStockSettings] = useState<Record<string, { mode: 'percent' | 'quantity'; value: number }>>({});

  const mapStockToItem = useCallback((stock: InventoryStock): InventoryListItem => {
    const minSetting = minStockSettings[String(stock.id)];
    return {
      id: String(stock.id),
      name: stock.name,
      sku: stock.sku || `STK-${stock.id}`,
      barcode: stock.barcode || '',
      qty: stock.count,
      minStock: computeMinStock(stock, minSetting),
      unit: stock.unit || 'cái',
      location: 'Kho tổng',
      warehouse: 'total',
      averagePrice: stock.averagePrice || stock.latestPrice || 0,
    };
  }, [minStockSettings]);

  const loadInventory = useCallback(async () => {
    const [stocks, transfers] = await Promise.all([
      listInventoryStocks(),
      listWarehouseTransfers(),
    ]);
    const minSettings = await getMinStockSettings();
    setMinStockSettings(minSettings);

    const stockWarehouseMap = new Map<string, { warehouse: string; at: number }>();
    const warehouseSet = new Set<string>();

    transfers.forEach((transfer) => {
      const stockName = (transfer.stock || '').trim().toLowerCase();
      const receivingWarehouse = (transfer.receiving_warehouse || '').trim();
      if (!stockName || !receivingWarehouse) return;

      const at = new Date(transfer.updatedAt || transfer.createdAt || 0).getTime() || 0;
      const current = stockWarehouseMap.get(stockName);
      if (!current || at >= current.at) {
        stockWarehouseMap.set(stockName, { warehouse: receivingWarehouse, at });
      }
      warehouseSet.add(receivingWarehouse);
    });

    const mapped = stocks.map((stock) => {
      const base = mapStockToItem(stock);
      const warehouseInfo = stockWarehouseMap.get(stock.name.trim().toLowerCase());
      return {
        ...base,
        warehouse: warehouseInfo?.warehouse || 'Kho tổng',
        location: warehouseInfo?.warehouse || 'Kho tổng',
      };
    });

    setItems(mapped);
    const dynamicTabs = Array.from(warehouseSet).map((name) => ({ key: name, label: name }));
    const hasMain = dynamicTabs.some((tab) => tab.key === 'Kho tổng');
    setWarehouseTabs([
      { key: 'all', label: t('inventory.warehouse.all') },
      ...dynamicTabs,
      ...(hasMain ? [] : [{ key: 'Kho tổng', label: t('inventory.warehouse.total') }]),
    ]);
  }, [mapStockToItem, t]);

  useEffect(() => {
    if (!warehouseTabs.some((tab) => tab.key === warehouse)) {
      setWarehouse('all');
    }
  }, [warehouse, warehouseTabs]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadInventory();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadInventory]);

  useFocusEffect(
    useCallback(() => {
      loadInventory();
    }, [loadInventory]),
  );

  const openCreateModal = useCallback(() => {
    navigation?.navigate?.('InventoryStockForm');
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInventory();
    } finally {
      setRefreshing(false);
    }
  }, [loadInventory]);

  const openSearchBarcodeScanner = useCallback(async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) return;
    }
    setScannerPaused(false);
    setShowBarcodeScanner(true);
  }, [cameraPermission?.granted, requestCameraPermission]);

  const handleSearchBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (scannerPaused) return;
      setScannerPaused(true);
      setSearchKeyword(data || '');
      setShowBarcodeScanner(false);
    },
    [scannerPaused],
  );

  const filteredItems = useMemo(() => {
    const byWarehouse = warehouse === 'all'
      ? items
      : items.filter((item) => item.warehouse === warehouse);
    const keyword = searchKeyword.trim().toLowerCase();
    const bySearch = !keyword
      ? byWarehouse
      : byWarehouse.filter((item) => {
      const name = item.name.toLowerCase();
      const sku = item.sku.toLowerCase();
      const barcode = (item.barcode || '').toLowerCase();
      return name.includes(keyword) || sku.includes(keyword) || barcode.includes(keyword);
    });
    if (statusFilter === 'all') return bySearch;
    if (statusFilter === 'low') return bySearch.filter((item) => item.qty > 0 && item.qty <= item.minStock);
    if (statusFilter === 'in-stock') return bySearch.filter((item) => item.qty > item.minStock);
    if (statusFilter === 'out') return bySearch.filter((item) => item.qty === 0);
    return bySearch.filter((item) => item.qty < 0);
  }, [items, searchKeyword, statusFilter, warehouse]);

  const sortedItems = useMemo(() => {
    const next = [...filteredItems];
    if (sortKey === 'name-asc') return next.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    if (sortKey === 'name-desc') return next.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
    if (sortKey === 'qty-asc') return next.sort((a, b) => a.qty - b.qty);
    return next.sort((a, b) => b.qty - a.qty);
  }, [filteredItems, sortKey]);

  const sortLabel = useMemo(() => {
    if (sortKey === 'name-asc') return 'A-Z';
    if (sortKey === 'name-desc') return 'Z-A';
    if (sortKey === 'qty-asc') return 'SL tăng';
    return 'SL giảm';
  }, [sortKey]);
  const shouldShowWarehouseFilter = useMemo(() => {
    const realWarehouses = new Set(items.map((item) => item.warehouse).filter(Boolean));
    return realWarehouses.size >= 2;
  }, [items]);

  const lowStockCount = useMemo(
    () => filteredItems.filter(item => isLowStock(item.qty, item.minStock)).length,
    [filteredItems]
  );

  const totalValue = useMemo(
    () => filteredItems.reduce((sum, item) => sum + item.qty * item.averagePrice, 0),
    [filteredItems],
  );

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title={t('inventory.title')}
        onBack={() => navigation?.goBack?.()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.searchBarWrap}>
          <View style={[styles.searchInputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              placeholder="Tìm theo tên, SKU, barcode"
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
            />
            <TouchableOpacity
              style={[styles.searchScanBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={openSearchBarcodeScanner}
            >
              <Ionicons name="barcode-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.primaryStatCard}>
            <Text style={[styles.primaryStatLabel, { color: 'rgba(255,255,255,0.9)' }]}>{t('inventory.totalValue')}</Text>
            <Text style={[styles.primaryStatValue, { color: '#fff' }]}>{totalValue.toLocaleString('vi-VN')} {t('home.currency')}</Text>
            <Text style={[styles.primaryStatSub, { color: 'rgba(255,255,255,0.85)' }]}>{filteredItems.length} SKU</Text>
          </View>

          <View style={[styles.secondaryStatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.secondaryStatLabel, { color: colors.textSecondary }]}>{t('inventory.needImport')}</Text>
            <Text style={styles.secondaryStatValue}>{lowStockCount}</Text>
            <Text style={[styles.secondaryStatSub, { color: colors.textSecondary }]}>{t('inventory.lowStockProducts')}</Text>
          </View>
        </View>

        {shouldShowWarehouseFilter && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.warehouseTabs}
          >
            {warehouseTabs.map(tab => {
              const active = warehouse === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.warehouseChip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    active && styles.warehouseChipActive,
                  ]}
                  onPress={() => setWarehouse(tab.key)}
                >
                  <Text style={[styles.warehouseText, { color: colors.textSecondary }, active && styles.warehouseTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.key}
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation?.navigate?.('InventoryEdit', { mode: action.mode })}
            >
              <View
                style={[
                  styles.quickIcon,
                  {
                    backgroundColor: action.iconBg,
                    borderColor: action.iconBorder,
                  },
                ]}
              >
                <Ionicons name={action.icon} size={16} color={action.iconColor} />
              </View>

              <View>
                <Text style={[styles.quickTitle, { color: colors.text }]}>{t(action.titleKey as TranslationKey)}</Text>
                <Text style={[styles.quickSub, { color: colors.textSecondary }]}>{t(action.subtitleKey as TranslationKey)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusTabs}
        >
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.statusChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  active && styles.statusChipActive,
                ]}
                onPress={() => setStatusFilter(tab.key)}
              >
                <Text style={[styles.statusText, { color: colors.textSecondary }, active && styles.statusTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: colors.text }]}>{t('inventory.stockList')}</Text>
          <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortMenu((v) => !v)}>
            <Text style={[styles.listSort, { color: colors.textSecondary }]}>{sortLabel}</Text>
            <Ionicons name={showSortMenu ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {showSortMenu && (
          <View style={[styles.sortMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { key: 'name-asc', label: 'Tên A-Z' },
              { key: 'name-desc', label: 'Tên Z-A' },
              { key: 'qty-asc', label: 'Số lượng tăng dần' },
              { key: 'qty-desc', label: 'Số lượng giảm dần' },
            ].map((option) => {
              const active = sortKey === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={styles.sortMenuItem}
                  onPress={() => {
                    setSortKey(option.key as SortKey);
                    setShowSortMenu(false);
                  }}
                >
                  <Text style={[styles.sortMenuText, { color: active ? Colors.primary : colors.text }]}>{option.label}</Text>
                  {active ? <Ionicons name="checkmark" size={16} color={Colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={[styles.stockCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {sortedItems.map((item, index) => {
            const low = isLowStock(item.qty, item.minStock);

            return (
              <View key={item.id}>
                {index > 0 && (
                  <View style={styles.stockSeparator}>
                    {Array.from({ length: 28 }).map((_, dashIdx) => (
                      <View key={`${item.id}-dash-${dashIdx}`} style={[styles.stockSeparatorDash, { backgroundColor: colors.border }]} />
                    ))}
                  </View>
                )}
                <View
                  style={[
                    styles.stockRow,
                    low && styles.stockRowLow,
                    { backgroundColor: low ? colors.dangerLight : colors.card },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.stockRowTouch}
                    onPress={() => navigation?.navigate?.('InventoryStockForm', { stockId: Number(item.id) })}
                  >
                    <View style={[styles.thumb, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Ionicons name="cube-outline" size={18} color={colors.textSecondary} />
                    </View>

                    <View style={styles.stockInfo}>
                      <Text style={[styles.stockName, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.stockMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.sku} · {item.location}
                      </Text>
                    </View>

                    <View style={styles.stockQtyWrap}>
                      <Text style={[styles.stockQty, { color: colors.text }, low && styles.stockQtyLow]}>
                        {formatDecimal(item.qty)} <Text style={[styles.stockUnit, { color: colors.textSecondary }]}>{item.unit}</Text>
                      </Text>
                      <Text style={[styles.stockMin, { color: colors.textSecondary }]}>{t('inventory.minStock', { count: formatDecimal(item.minStock) })}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <TouchableOpacity activeOpacity={0.86} style={styles.fabPill} onPress={openCreateModal}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.fabPillText}>Thêm nguyên liệu mới</Text>
      </TouchableOpacity>

      <Modal visible={showBarcodeScanner} animationType="slide" onRequestClose={() => setShowBarcodeScanner(false)}>
        <View style={styles.scannerScreen}>
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
              onBarcodeScanned={scannerPaused ? undefined : handleSearchBarcodeScanned}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 20,
  },
  iconBtn: {
    padding: 4,
  },
  searchBarWrap: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  searchInputWrap: {
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodySm,
  },
  searchScanBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  primaryStatCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    ...Shadow.sm,
  },
  primaryStatLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.9)',
  },
  primaryStatValue: {
    ...Typography.h2,
    fontSize: 28,
    color: '#fff',
    marginTop: 2,
  },
  primaryStatSub: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  secondaryStatCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  secondaryStatLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  secondaryStatValue: {
    ...Typography.h2,
    fontSize: 28,
    color: '#c97a7a',
    marginTop: 2,
  },
  secondaryStatSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  warehouseTabs: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  warehouseChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  warehouseChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  warehouseText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  warehouseTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  quickBtn: {
    width: '48.7%',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    ...Typography.captionMd,
    color: Colors.text,
    fontWeight: '700',
  },
  quickSub: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0,
  },
  listHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    ...Typography.bodyMd,
    color: Colors.text,
    fontWeight: '700',
  },
  listSort: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortMenu: {
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  sortMenuItem: {
    minHeight: 38,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortMenuText: {
    ...Typography.bodySm,
  },
  statusTabs: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  statusChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  statusText: {
    ...Typography.captionMd,
    fontWeight: '600',
  },
  statusTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  stockCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    ...Shadow.sm,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  stockRowTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  stockSeparator: {
    marginHorizontal: Spacing.md,
    paddingVertical: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockSeparatorDash: {
    width: 6,
    height: 1.5,
    borderRadius: Radius.full,
    backgroundColor: '#d2cec4',
  },
  stockRowLow: {
    backgroundColor: '#fcf2ee',
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#f8f7f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockInfo: {
    flex: 1,
    minWidth: 0,
  },
  stockName: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '700',
  },
  stockMeta: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0,
  },
  stockQtyWrap: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  stockQty: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '800',
  },
  stockQtyLow: {
    color: '#c97a7a',
  },
  stockUnit: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0,
  },
  stockMin: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0,
    marginTop: 1,
  },
  fabPill: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadow.md,
  },
  fabPillText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
  scannerScreen: {
    flex: 1,
    backgroundColor: '#000',
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
