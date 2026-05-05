import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Header } from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList, ScanActionItem } from '../../navigation';
import {
  addInventoryAuditItems,
  completeInventoryAudit,
  createInventoryProvider,
  createWarehouseImportEntry,
  createInventoryAudit,
  createWarehouseTransfer,
  getInventoryAuditById,
  importStockItem,
  listWarehouseImports,
  listInventoryProviders,
  listInventoryStocks,
  updateInventoryAuditItem,
  type InventoryProvider,
} from '../../services';

type InventoryMode = 'import' | 'export' | 'transfer' | 'audit';
type VisibleInventoryMode = 'import' | 'transfer' | 'audit';

type ModeConfig = {
  key: VisibleInventoryMode;
  labelKey: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
};

const MODES: ModeConfig[] = [
  { key: 'import', labelKey: 'inventory.action.stockIn', icon: 'download-outline' },
  { key: 'transfer', labelKey: 'inventory.action.transfer', icon: 'swap-horizontal-outline' },
  { key: 'audit', labelKey: 'inventory.action.stocktake', icon: 'clipboard-outline' },
];

const BRANCHES = [
  { key: 'main', labelKey: 'inventory.branch.main' },
  { key: 'center', labelKey: 'inventory.branch.center' },
  { key: 'q3', labelKey: 'inventory.branch.q3' },
] as const;

interface CartItem {
  id: string;
  stockId?: number;
  name: string;
  sku: string;
  qty: number;
  qtyText?: string;
  cost: number;
  averageCost: number;
  latestCost: number;
  currentQty: number;
  unit: string;
  expiryDate?: string | null;
  note?: string;
}

type InventoryEditRoute = RouteProp<ManageStackParamList, 'InventoryEdit'>;

const formatDecimal = (value: number) => {
  const rounded = Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);
};

const formatDate = (value: Date) => {
  const day = String(value.getDate()).padStart(2, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const year = value.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateCode = (value: Date) => {
  const yy = String(value.getFullYear()).slice(-2);
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const dd = String(value.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
};

const formatDateTimeText = (value: Date) => {
  const hh = String(value.getHours()).padStart(2, '0');
  const mm = String(value.getMinutes()).padStart(2, '0');
  return `${formatDate(value)} ${hh}:${mm}`;
};

const formatIsoDate = (value: Date) => {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseIsoDate = (value?: string | null) => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const formatPrice = (value: number, locale: string) =>
  new Intl.NumberFormat(locale).format(Math.max(0, Math.round(value || 0)));

const parseQtyInput = (value?: string) => {
  if (!value) return 0;
  const normalized = value.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const getItemQty = (item: CartItem) =>
  item.qtyText !== undefined ? parseQtyInput(item.qtyText) : item.qty;

const buildItemsFromScanItems = (scanItems: ScanActionItem[] = []): CartItem[] => {
  return scanItems.map((scanItem, index) => ({
    id: scanItem.sku || scanItem.code || `scan-${index}`,
    name: scanItem.name,
    sku: scanItem.sku || scanItem.code,
    qty: scanItem.qty,
    cost: 0,
    averageCost: 0,
    latestCost: 0,
    currentQty: 0,
    unit: 'cái',
    expiryDate: null,
  }));
};

const getVisibleMode = (mode?: InventoryMode): VisibleInventoryMode => {
  if (mode === 'transfer' || mode === 'audit') return mode;
  return 'import';
};

export function InventoryEditScreen({ navigation }: any) {
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const route = useRoute<InventoryEditRoute>();
  const [mode, setMode] = useState<VisibleInventoryMode>(getVisibleMode(route.params?.mode));
  const [branch, setBranch] = useState('center');
  const [toBranch, setToBranch] = useState('main');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<{ type: 'document' | 'expiry'; itemId?: string }>({ type: 'document' });
  const [importSequence, setImportSequence] = useState(1);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [items, setItems] = useState<CartItem[]>([]);
  const [allStocks, setAllStocks] = useState<Array<{
    id: number;
    name: string;
    sku: string;
    unit: string;
    count: number;
    averagePrice: number;
    latestPrice: number;
    barcode?: string;
  }>>([]);
  const [providers, setProviders] = useState<InventoryProvider[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerSearch, setProviderSearch] = useState('');
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [showToBranchPicker, setShowToBranchPicker] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadImportSequence = async () => {
      if (mode !== 'import') return;
      try {
        const imports = await listWarehouseImports();
        if (!mounted) return;

        const dateCode = formatDateCode(selectedDate);
        const codePrefix = `PN-${dateCode}-`;
        const sequences = imports
          .map((item) => String(item.code || '').trim())
          .filter((code) => code.startsWith(codePrefix))
          .map((code) => {
            const parts = code.split('-');
            const seq = Number(parts[parts.length - 1]);
            return Number.isFinite(seq) ? seq : 0;
          });

        const next = sequences.length > 0 ? Math.max(...sequences) + 1 : 1;
        setImportSequence(next);
      } catch {
        if (mounted) setImportSequence(1);
      }
    };

    loadImportSequence();
    return () => {
      mounted = false;
    };
  }, [mode, selectedDate]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [stocks, providerList] = await Promise.all([
          listInventoryStocks(),
          listInventoryProviders(),
        ]);
        if (!mounted) return;

        setAllStocks(stocks);
        setProviders(providerList);
        setProviderId(null);

        const scanItems = buildItemsFromScanItems(route.params?.scanItems);
        if (scanItems.length > 0) {
          const normalized = scanItems.map((scanItem) => {
              const found = stocks.find((stock) => {
                const sku = (stock.sku || '').trim().toLowerCase();
                const barcode = (stock.barcode || '').trim().toLowerCase();
                const key = (scanItem.sku || scanItem.code || '').trim().toLowerCase();
                return (sku && sku === key) || (barcode && barcode === key);
              });

            return {
              ...scanItem,
              id: String(found?.id || scanItem.id),
              stockId: found?.id,
              name: found?.name || scanItem.name,
              sku: found?.sku || scanItem.sku,
              unit: found?.unit || scanItem.unit,
              currentQty: found?.count || scanItem.currentQty,
              cost: found?.latestPrice || found?.averagePrice || 0,
              averageCost: found?.averagePrice || 0,
              latestCost: found?.latestPrice || found?.averagePrice || 0,
              expiryDate: null,
            };
          });
          setItems(normalized);
          return;
        }

        setItems([]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không tải được dữ liệu tồn kho';
        Alert.alert('Lỗi', message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [route.params?.scanItems]);

  const submitInventory = async () => {
    if (!items.length) {
      Alert.alert('Thông báo', 'Chưa có nguyên liệu để xử lý');
      return;
    }

    const providerName = providers.find((item) => item.id === providerId)?.name;

    setSaving(true);
    try {
      if (mode === 'import') {
        const totalValue = items.reduce((sum, item) => sum + Math.max(0, getItemQty(item) * item.cost), 0);
        for (const item of items) {
          const qty = getItemQty(item);
          if (qty <= 0) continue;
          await createWarehouseImportEntry({
            code: documentCode,
            stockName: item.name,
            unit: item.unit,
            quantity: qty,
            unitPrice: item.cost,
            supplierName: providerName,
            dateText: formatDateTimeText(selectedDate),
          });
        }

        for (const item of items) {
          const qty = getItemQty(item);
          if (!item.stockId || qty <= 0) continue;
          const itemTotal = Math.max(0, qty * item.cost);
          const allocationRatio = totalValue > 0 ? itemTotal / totalValue : 0;
          const itemPaidAmount = Math.round(paidAmountValue * allocationRatio);
          await importStockItem({
            id: item.stockId,
            count: qty,
            unitPrice: item.cost,
            providerName,
            paidAmount: itemPaidAmount,
            expiryDate: item.expiryDate || null,
          });
        }
      } else if (mode === 'transfer') {
        for (const item of items) {
          const qty = getItemQty(item);
          if (qty <= 0) continue;
          await createWarehouseTransfer({
            stockName: item.name,
            quantity: qty,
            unitPrice: item.cost,
            sourceWarehouse: branch,
            destinationWarehouse: toBranch,
            notes,
          });
        }
      } else {
        const audit = await createInventoryAudit({ notes });
        const auditId = audit.data?.id;
        if (!auditId) throw new Error('Không tạo được phiên kiểm kho');

        const auditableItems = items
          .filter((item) => item.stockId && getItemQty(item) >= 0)
          .map((item) => ({ stock_id: Number(item.stockId) }));

        if (auditableItems.length === 0) {
          throw new Error('Không có nguyên liệu hợp lệ để kiểm kho');
        }

        await addInventoryAuditItems(auditId, auditableItems);
        const detail = await getInventoryAuditById(auditId);
        const itemMap = new Map(
          (detail.data?.items || []).map((auditItem) => [
            Number(auditItem.stock_id),
            auditItem.id,
          ]),
        );

        for (const item of items) {
          if (!item.stockId) continue;
          const auditItemId = itemMap.get(item.stockId);
          if (!auditItemId) continue;
          const actualQuantity = Math.max(0, item.currentQty + getItemQty(item));
          await updateInventoryAuditItem(auditId, auditItemId, actualQuantity, item.note);
        }

        await completeInventoryAudit(auditId);
      }

      Alert.alert('Thành công', 'Đã lưu phiếu kho');
      navigation?.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lưu phiếu thất bại';
      Alert.alert('Lỗi', message);
    } finally {
      setSaving(false);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const current = getItemQty(i);
      return { ...i, qty: Math.max(0, current + delta), qtyText: undefined };
    }));
  };

  const totalQty = useMemo(() => items.reduce((sum, item) => sum + getItemQty(item), 0), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + getItemQty(item) * item.cost, 0), [items]);
  const paidAmountValue = useMemo(() => {
    const normalized = paidAmount.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [paidAmount]);
  const remainingAmount = useMemo(() => Math.max(0, total - paidAmountValue), [paidAmountValue, total]);
  const filteredProviders = useMemo(() => {
    const keyword = providerSearch.trim().toLowerCase();
    if (!keyword) return providers;
    return providers.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [providerSearch, providers]);
  const canCreateProvider = useMemo(() => {
    const keyword = providerSearch.trim();
    if (!keyword) return false;
    return !providers.some((item) => item.name.trim().toLowerCase() === keyword.toLowerCase());
  }, [providerSearch, providers]);
  const filteredStocks = useMemo(() => {
    const keyword = productSearch.trim().toLowerCase();
    const selectedIds = new Set(items.map((item) => item.stockId).filter(Boolean));
    const availableStocks = allStocks.filter((item) => !selectedIds.has(item.id));
    if (!keyword) return availableStocks;
    return availableStocks.filter((item) =>
      item.name.toLowerCase().includes(keyword) ||
      (item.sku || '').toLowerCase().includes(keyword) ||
      (item.barcode || '').toLowerCase().includes(keyword),
    );
  }, [allStocks, items, productSearch]);

  const addStockToItems = (stock: {
    id: number;
    name: string;
    sku: string;
    unit: string;
    count: number;
    averagePrice: number;
    latestPrice: number;
  }) => {
    setItems((prev) => {
      const existed = prev.find((item) => item.stockId === stock.id);
      if (existed) {
        return prev.map((item) =>
          item.stockId === stock.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [
        ...prev,
        {
          id: String(stock.id),
          stockId: stock.id,
          name: stock.name,
          sku: stock.sku || `STK-${stock.id}`,
          qty: 1,
          cost: stock.latestPrice || stock.averagePrice || 0,
          averageCost: stock.averagePrice || 0,
          latestCost: stock.latestPrice || stock.averagePrice || 0,
          currentQty: stock.count,
          unit: stock.unit || 'cái',
          expiryDate: null,
        },
      ];
    });
  };

  const handleCreateProvider = async () => {
    const name = providerSearch.trim();
    if (!name || isCreatingProvider) return;
    try {
      setIsCreatingProvider(true);
      const created = await createInventoryProvider(name);
      setProviders((prev) => [...prev, { id: created.id, name: created.name }]);
      setProviderId(created.id);
      setProviderSearch('');
      setShowProviderPicker(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không tạo được nhà cung cấp';
      Alert.alert('Lỗi', message);
    } finally {
      setIsCreatingProvider(false);
    }
  };
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const slots: Array<Date | null> = [];

    for (let i = 0; i < startWeekday; i += 1) {
      slots.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      slots.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
    }
    while (slots.length % 7 !== 0) {
      slots.push(null);
    }
    return slots;
  }, [calendarMonth]);

  const modeTitle = useMemo(() => {
    const selectedMode = MODES.find(item => item.key === mode) || MODES[0];
    return t(selectedMode.labelKey);
  }, [mode, t]);

  const documentCode = useMemo(() => {
    const dateCode = formatDateCode(selectedDate);
    if (mode === 'transfer') return `PC-${dateCode}-001`;
    if (mode === 'audit') return `KK-${dateCode}-001`;
    return `PN-${dateCode}-${String(importSequence).padStart(3, '0')}`;
  }, [importSequence, mode, selectedDate]);
  const reasonLabel = mode === 'audit' ? 'Kiểm kê cuối tháng' : 'Bổ sung hàng bán';
  const branchLabel = (key: string) =>
    t((BRANCHES.find(item => item.key === key)?.labelKey || 'inventory.chooseBranch') as TranslationKey);

  const renderPicker = (
    value: string,
    onValueChange: (value: string) => void,
    open: boolean,
    setOpen: (open: boolean) => void,
  ) => (
    <View>
      <TouchableOpacity
        style={[styles.fieldBox, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => setOpen(!open)}
      >
        <Text style={[styles.fieldValue, { color: colors.text }]}>{branchLabel(value)}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      {open && (
        <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {BRANCHES.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.dropdownOption, { borderBottomColor: colors.border }]}
              onPress={() => {
                onValueChange(item.key);
                setOpen(false);
              }}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>{t(item.labelKey as TranslationKey)}</Text>
              {item.key === value && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
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
        title={modeTitle}
        subtitle={`${documentCode} · Nháp`}
        onBack={() => navigation?.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.modeTabs}>
          {MODES.map(item => {
            const active = mode === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.modeTab,
                  { borderColor: colors.border },
                  active && styles.modeTabActive,
                ]}
                onPress={() => setMode(item.key)}
              >
                <Ionicons name={item.icon} size={16} color={active ? '#fff' : colors.textSecondary} />
                <Text style={[styles.modeTabText, { color: colors.text }, active && styles.modeTabTextActive]}>
                  {t(item.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Thông tin phiếu</Text>
          <View style={styles.twoColumns}>
            <InfoField
              label="Ngày"
              value={formatDate(selectedDate)}
              colors={colors}
              trailing="calendar-outline"
              onPress={() => {
                setDatePickerTarget({ type: 'document' });
                setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
                setShowDatePicker(true);
              }}
            />
            <InfoField label="Mã phiếu" value={documentCode} colors={colors} mono />
          </View>

          {mode === 'import' && (
            <>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nhà cung cấp</Text>
                <TouchableOpacity
                  style={[styles.fieldBox, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowProviderPicker((prev) => !prev)}
                >
                  <Text style={[styles.fieldValue, { color: colors.text }]}>
                    {providers.find((item) => item.id === providerId)?.name || 'Chọn hoặc tạo mới nhà cung cấp'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                {showProviderPicker && (
                  <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.providerSearchWrap, { borderBottomColor: colors.border }]}>
                      <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
                      <TextInput
                        value={providerSearch}
                        onChangeText={setProviderSearch}
                        placeholder="Tìm hoặc nhập NCC mới"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.providerSearchInput, { color: colors.text }]}
                      />
                    </View>
                    {filteredProviders.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.dropdownOption, { borderBottomColor: colors.border }]}
                        onPress={() => {
                          setProviderId(item.id);
                          setShowProviderPicker(false);
                        }}
                      >
                        <Text style={[styles.dropdownText, { color: colors.text }]}>{item.name}</Text>
                        {item.id === providerId && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                      </TouchableOpacity>
                    ))}
                    {canCreateProvider && (
                      <TouchableOpacity
                        style={[styles.dropdownOption, { borderBottomColor: colors.border }]}
                        onPress={handleCreateProvider}
                        disabled={isCreatingProvider}
                      >
                        <Text style={[styles.dropdownText, { color: Colors.primary }]}>
                          {isCreatingProvider ? 'Đang tạo...' : `Tạo mới: "${providerSearch.trim()}"`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </>
          )}

          {mode === 'transfer' && (
            <View style={styles.twoColumns}>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('inventory.sourceWarehouse')}</Text>
                {renderPicker(branch, setBranch, showBranchPicker, setShowBranchPicker)}
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('inventory.destinationWarehouse')}</Text>
                {renderPicker(toBranch, setToBranch, showToBranchPicker, setShowToBranchPicker)}
              </View>
            </View>
          )}

          {mode === 'audit' && (
            <>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('inventory.branch')}</Text>
                {renderPicker(branch, setBranch, showBranchPicker, setShowBranchPicker)}
              </View>
              <InfoField label="Lý do" value={reasonLabel} colors={colors} trailing="chevron-down" />
            </>
          )}
        </View>

        <View style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.actionTile, { borderRightColor: colors.border }]} onPress={() => navigation?.navigate('QrScan')}>
            <Ionicons name="qr-code-outline" size={24} color={Colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>Quét mã vạch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionTile} onPress={() => setShowProductPicker(true)}>
            <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>Chọn sản phẩm</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.listTitleWrap}>
              <Ionicons name="cube-outline" size={16} color={colors.text} />
              <Text style={[styles.listTitle, { color: colors.text }]}>
                {t('inventory.itemListTitle', { count: items.length })}
              </Text>
            </View>
            <Text style={styles.totalQtyText}>
              {t('inventory.totalQuantity')}: {formatDecimal(totalQty)}
            </Text>
          </View>

          {items.length === 0 ? (
            <View style={[styles.emptyItemsCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Ionicons name="cube-outline" size={28} color={colors.textSecondary} />
              <Text style={[styles.emptyItemsText, { color: colors.textSecondary }]}>
                Chưa có sản phẩm nào được chọn
              </Text>
            </View>
          ) : items.map((item, index) => {
            const qtyValue = getItemQty(item);
            const signedQty = mode === 'audit' && item.note ? -qtyValue : qtyValue;
            const nextQty = mode === 'audit' ? item.currentQty + signedQty : item.currentQty + qtyValue;

            return (
              <View key={item.id} style={[styles.itemBlock, index > 0 && { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                <View style={styles.itemTop}>
                  <View style={[styles.thumb, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="cube-outline" size={18} color={colors.textSecondary} />
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.itemSku, { color: colors.textSecondary }]}>
                      {item.sku} · tồn {formatDecimal(item.currentQty)}
                    </Text>
                    {item.note && <Text style={styles.itemNote} numberOfLines={1}>{item.note}</Text>}
                  </View>

                  <TouchableOpacity onPress={() => setItems(prev => prev.filter(i => i.id !== item.id))}>
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.qtyRow}>
                  <Text style={[styles.qtyLabel, { color: colors.textSecondary }]}>
                    {mode === 'audit' ? 'Chênh lệch' : 'Số lượng'}
                  </Text>

                  <View style={[styles.stepper, { borderColor: colors.border }]}>
                    <TouchableOpacity
                      style={[styles.stepBtn, { borderRightColor: colors.border }, getItemQty(item) <= 1 && styles.stepBtnDisabled]}
                      onPress={() => updateQty(item.id, -1)}
                      disabled={getItemQty(item) <= 1}
                    >
                      <Ionicons name="remove" size={15} color={mode === 'audit' ? Colors.danger : colors.text} />
                    </TouchableOpacity>
                    <TextInput
                      value={item.qtyText ?? String(item.qty ?? '')}
                      onChangeText={(text) => {
                        const normalized = text.replace(',', '.');
                        if (!/^\d*(\.\d*)?$/.test(normalized)) return;
                        setItems((prev) =>
                          prev.map((it) =>
                            it.id === item.id ? { ...it, qtyText: normalized } : it,
                          ),
                        );
                      }}
                      onBlur={() => {
                        setItems((prev) =>
                          prev.map((it) =>
                            it.id === item.id
                              ? { ...it, qty: parseQtyInput(it.qtyText), qtyText: undefined }
                              : it,
                          ),
                        );
                      }}
                      keyboardType="decimal-pad"
                      style={[styles.stepQtyInput, { color: signedQty < 0 ? Colors.danger : Colors.primary }]}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <TouchableOpacity style={[styles.stepBtn, { borderLeftColor: colors.border }]} onPress={() => updateQty(item.id, 1)}>
                      <Ionicons name="add" size={15} color={Colors.success} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.unitText, { color: colors.textSecondary }]}>{item.unit}</Text>
                  <Text style={[styles.nextQty, { color: nextQty < 0 ? Colors.danger : Colors.success }]}>
                    → {formatDecimal(nextQty)}
                  </Text>
                </View>

                {mode === 'import' && (
                  <View style={styles.itemMetaWrap}>
                    <View style={styles.itemMetaRow}>
                      <Text style={[styles.itemMetaLabel, { color: colors.textSecondary }]}>Giá mua TB</Text>
                      <Text style={[styles.itemMetaValue, { color: colors.text }]}>
                        {formatPrice(item.averageCost, dateLocale)} {t('home.currency')}
                      </Text>
                    </View>
                    <View style={styles.itemMetaRow}>
                      <Text style={[styles.itemMetaLabel, { color: colors.textSecondary }]}>Giá mua mới</Text>
                      <View style={[styles.itemPriceInputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <TextInput
                          value={String(item.cost || '')}
                          onChangeText={(text) => {
                            const numeric = Number(String(text).replace(/[^\d.]/g, ''));
                            setItems((prev) =>
                              prev.map((it) =>
                                it.id === item.id
                                  ? {
                                      ...it,
                                      cost: Number.isFinite(numeric) ? numeric : 0,
                                      latestCost: Number.isFinite(numeric) ? numeric : 0,
                                    }
                                  : it,
                              ),
                            );
                          }}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={colors.textSecondary}
                          style={[styles.itemPriceInput, { color: Colors.primary }]}
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.expiryBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                      onPress={() => {
                        const base = parseIsoDate(item.expiryDate) || new Date();
                        setDatePickerTarget({ type: 'expiry', itemId: item.id });
                        setCalendarMonth(new Date(base.getFullYear(), base.getMonth(), 1));
                        setShowDatePicker(true);
                      }}
                    >
                      <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
                      <Text style={[styles.expiryText, { color: item.expiryDate ? colors.text : colors.textSecondary }]}>
                        {item.expiryDate ? `HSD: ${formatDate(parseIsoDate(item.expiryDate) || new Date())}` : 'Hạn sử dụng (nếu có)'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {mode === 'import' && (
          <>
            <View style={styles.totalCard}>
              <View>
                <Text style={styles.totalCardLabel}>Tổng tiền nhập</Text>
                <Text style={styles.totalCardValue}>{total.toLocaleString(dateLocale)} {t('home.currency')}</Text>
              </View>
              <View style={styles.totalCardSide}>
                <Text style={styles.totalCardSideText}>{items.length} SP · {formatDecimal(totalQty)} đơn vị</Text>
                <Text style={styles.totalCardSideText}>VAT 8% · {(total * 0.08).toLocaleString(dateLocale)} {t('home.currency')}</Text>
              </View>
            </View>

            {providerId ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.twoColumns}>
                  <View style={styles.fieldWrap}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Đã trả</Text>
                    <View style={[styles.fieldBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <TextInput
                        value={paidAmount}
                        onChangeText={setPaidAmount}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.fieldValue, { color: colors.text }]}
                      />
                    </View>
                  </View>
                  <View style={styles.fieldWrap}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Còn nợ</Text>
                    <View style={[styles.fieldBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.fieldValue, { color: colors.text }]}>
                        {remainingAmount.toLocaleString(dateLocale)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('returns.notes')}</Text>
          <View style={[styles.notesWrap, { borderColor: colors.border }]}>
            <TextInput
              style={[styles.notes, { color: colors.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('inventory.notesPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={submitInventory} disabled={saving}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>
            {saving ? 'Đang lưu...' : t('inventory.confirmAction', { action: modeTitle })}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showProductPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProductPicker(false)}
      >
        <View style={styles.calendarOverlay}>
          <Pressable style={styles.calendarBackdrop} onPress={() => setShowProductPicker(false)} />
          <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '72%' }]}>
            <Text style={[styles.calendarTitle, { color: colors.text, marginBottom: 8 }]}>Chọn sản phẩm</Text>
            <View style={[styles.providerSearchWrap, { borderBottomColor: colors.border, marginBottom: 8, backgroundColor: colors.background }]}>
              <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
              <TextInput
                value={productSearch}
                onChangeText={setProductSearch}
                placeholder="Tìm theo tên, SKU, barcode"
                placeholderTextColor={colors.textSecondary}
                style={[styles.providerSearchInput, { color: colors.text }]}
              />
            </View>
            <ScrollView>
              {filteredStocks.map((stock) => (
                <TouchableOpacity
                  key={stock.id}
                  style={[styles.dropdownOption, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    addStockToItems(stock);
                    setProductSearch('');
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dropdownText, { color: colors.text }]}>{stock.name}</Text>
                    <Text style={[styles.itemSku, { color: colors.textSecondary }]}>{stock.sku || `STK-${stock.id}`} · tồn {formatDecimal(stock.count)}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.saveBtn, { marginTop: 10 }]} onPress={() => setShowProductPicker(false)}>
              <Text style={styles.saveBtnText}>Xong</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.calendarOverlay}>
          <Pressable style={styles.calendarBackdrop} onPress={() => setShowDatePicker(false)} />
          <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                {calendarMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarWeekRow}>
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label) => (
                <Text key={label} style={[styles.calendarWeekday, { color: colors.textSecondary }]}>{label}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((dateCell, idx) => {
                if (!dateCell) {
                  return <View key={`empty-${idx}`} style={styles.calendarCell} />;
                }
                const activeBase =
                  datePickerTarget.type === 'document'
                    ? selectedDate
                    : parseIsoDate(items.find((x) => x.id === datePickerTarget.itemId)?.expiryDate) || selectedDate;
                const active =
                  dateCell.getDate() === activeBase.getDate() &&
                  dateCell.getMonth() === activeBase.getMonth() &&
                  dateCell.getFullYear() === activeBase.getFullYear();
                return (
                  <TouchableOpacity
                    key={dateCell.toISOString()}
                    style={[styles.calendarCell, active && styles.calendarCellActive]}
                    onPress={() => {
                      if (datePickerTarget.type === 'document') {
                        setSelectedDate(dateCell);
                      } else if (datePickerTarget.itemId) {
                        setItems((prev) =>
                          prev.map((it) =>
                            it.id === datePickerTarget.itemId
                              ? { ...it, expiryDate: formatIsoDate(dateCell) }
                              : it,
                          ),
                        );
                      }
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[styles.calendarCellText, { color: active ? '#fff' : colors.text }]}>{dateCell.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoField({
  label,
  value,
  colors,
  mono,
  trailing,
  onPress,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useThemeMode>['colors'];
  mono?: boolean;
  trailing?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  const content = (
    <View style={[styles.fieldBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[styles.fieldValue, mono && styles.monoValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      {trailing && <Ionicons name={trailing} size={16} color={colors.textSecondary} />}
    </View>
  );

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
    gap: Spacing.sm,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  modeTab: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 5,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeTabText: {
    ...Typography.label,
    color: Colors.text,
    fontWeight: '800',
    letterSpacing: 0,
  },
  modeTabTextActive: {
    color: '#fff',
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  cardTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fieldWrap: {
    flex: 1,
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  fieldBox: {
    minHeight: 42,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fieldValue: {
    ...Typography.bodySm,
    color: Colors.text,
    flex: 1,
    fontWeight: '700',
  },
  monoValue: {
    fontFamily: 'monospace',
  },
  dropdown: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: 4,
    ...Shadow.sm,
  },
  dropdownOption: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '600',
  },
  providerSearchWrap: {
    minHeight: 40,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 10,
  },
  providerSearchInput: {
    flex: 1,
    ...Typography.bodySm,
    fontWeight: '600',
    paddingVertical: 8,
  },
  emptyItemsCard: {
    minHeight: 200,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    margin: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  emptyItemsText: {
    ...Typography.bodySm,
    fontWeight: '700',
  },
  actionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    overflow: 'hidden',
    flexDirection: 'row',
    ...Shadow.sm,
  },
  actionTile: {
    flex: 1,
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    gap: 4,
  },
  actionText: {
    ...Typography.captionMd,
    color: Colors.text,
    fontWeight: '800',
  },
  listCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  listHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  listTitle: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '800',
  },
  totalQtyText: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '800',
    letterSpacing: 0,
  },
  itemBlock: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopColor: Colors.border,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '800',
  },
  itemSku: {
    ...Typography.label,
    color: Colors.textSecondary,
    letterSpacing: 0,
    marginTop: 2,
  },
  itemNote: {
    ...Typography.label,
    color: Colors.danger,
    letterSpacing: 0,
    marginTop: 2,
    fontStyle: 'italic',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qtyLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    letterSpacing: 0,
    flex: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 32,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: Colors.border,
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  stepQty: {
    ...Typography.mono,
    minWidth: 44,
    textAlign: 'center',
    color: Colors.primary,
  },
  stepQtyInput: {
    ...Typography.mono,
    minWidth: 56,
    textAlign: 'center',
    color: Colors.primary,
    paddingVertical: 4,
  },
  unitText: {
    ...Typography.label,
    color: Colors.textSecondary,
    minWidth: 28,
    letterSpacing: 0,
  },
  nextQty: {
    ...Typography.mono,
    minWidth: 42,
    textAlign: 'right',
    color: Colors.success,
  },
  itemMetaWrap: {
    marginTop: 8,
    gap: 4,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemMetaLabel: {
    ...Typography.label,
    letterSpacing: 0,
  },
  itemMetaValue: {
    ...Typography.captionMd,
    fontWeight: '800',
  },
  itemPriceInputWrap: {
    minWidth: 120,
    minHeight: 34,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  itemPriceInput: {
    ...Typography.captionMd,
    fontWeight: '800',
    textAlign: 'right',
    paddingVertical: 4,
  },
  expiryBtn: {
    marginTop: 4,
    minHeight: 34,
    borderWidth: 1,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  expiryText: {
    ...Typography.label,
    letterSpacing: 0,
  },
  totalCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  totalCardLabel: {
    ...Typography.captionMd,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 2,
  },
  totalCardValue: {
    ...Typography.h2,
    color: '#fff',
    fontFamily: 'monospace',
  },
  totalCardSide: {
    alignItems: 'flex-end',
    paddingBottom: 2,
  },
  totalCardSideText: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.86)',
    letterSpacing: 0,
    marginTop: 2,
  },
  notesWrap: {
    minHeight: 72,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  notes: {
    ...Typography.bodySm,
    color: Colors.text,
    minHeight: 54,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },
  saveBtnText: {
    ...Typography.h4,
    color: '#fff',
  },
  calendarOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  calendarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  calendarCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  calendarTitle: {
    ...Typography.bodyMd,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calendarWeekday: {
    flex: 1,
    textAlign: 'center',
    ...Typography.captionMd,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  calendarCellActive: {
    backgroundColor: Colors.primary,
  },
  calendarCellText: {
    ...Typography.bodySm,
    fontWeight: '700',
  },
});
