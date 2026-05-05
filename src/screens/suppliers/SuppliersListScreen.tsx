import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { ChipRow, SearchBar } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

type SupplierStatus = 'active' | 'paused';
type SupplierCategory = 'beverage' | 'food' | 'dairy' | 'household' | 'snacks';

interface Supplier {
  id: number;
  name: string;
  code: string;
  category: SupplierCategory;
  contactPerson: string;
  phone: string;
  currentDebt: number;
  totalOrders: number;
  status: SupplierStatus;
  color: string;
}

const CATEGORY_LABEL_KEYS: Record<SupplierCategory, TranslationKey> = {
  beverage: 'suppliers.category.beverage',
  food: 'suppliers.category.food',
  dairy: 'suppliers.category.dairy',
  household: 'suppliers.category.household',
  snacks: 'suppliers.category.snacks',
};

const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    name: 'Công ty TNHH Trung Nguyên',
    code: 'NCC-001',
    category: 'beverage',
    contactPerson: 'Anh Khải',
    phone: '02812345678',
    currentDebt: 12400000,
    totalOrders: 42,
    status: 'active',
    color: '#d97757',
  },
  {
    id: 2,
    name: 'Masan Consumer',
    code: 'NCC-002',
    category: 'food',
    contactPerson: 'Chị Duyên',
    phone: '02822334455',
    currentDebt: 0,
    totalOrders: 58,
    status: 'active',
    color: '#4a9f4a',
  },
  {
    id: 3,
    name: 'Vinamilk',
    code: 'NCC-003',
    category: 'dairy',
    contactPerson: 'Anh Nam',
    phone: '02833445566',
    currentDebt: 3800000,
    totalOrders: 31,
    status: 'active',
    color: '#6b8cae',
  },
  {
    id: 4,
    name: 'Unilever Việt Nam',
    code: 'NCC-004',
    category: 'household',
    contactPerson: 'Chị Hà',
    phone: '02844556677',
    currentDebt: 5200000,
    totalOrders: 24,
    status: 'active',
    color: '#8a6a9e',
  },
  {
    id: 5,
    name: 'Mondelez Kinh Đô',
    code: 'NCC-005',
    category: 'snacks',
    contactPerson: 'Anh Long',
    phone: '02855667788',
    currentDebt: 0,
    totalOrders: 18,
    status: 'active',
    color: '#d4a574',
  },
  {
    id: 6,
    name: 'Nestlé Việt Nam',
    code: 'NCC-006',
    category: 'beverage',
    contactPerson: 'Chị My',
    phone: '02866778899',
    currentDebt: 2100000,
    totalOrders: 15,
    status: 'paused',
    color: '#b08968',
  },
];

const FILTER_CHIPS = [
  { key: 'all', labelKey: 'messages.filter.all' },
  { key: 'beverage', labelKey: 'suppliers.category.beverage' },
  { key: 'food', labelKey: 'suppliers.category.food' },
  { key: 'dairy', labelKey: 'suppliers.category.dairy' },
  { key: 'household', labelKey: 'suppliers.category.household' },
  { key: 'snacks', labelKey: 'suppliers.category.snacks' },
  { key: 'withDebt', labelKey: 'suppliers.withDebt' },
] as const;

type FilterKey = (typeof FILTER_CHIPS)[number]['key'];

const formatMoneyShort = (value: number) => `${(value / 1_000_000).toFixed(1)}M`;

export function SuppliersListScreen() {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const totalDebt = useMemo(
    () => MOCK_SUPPLIERS.reduce((sum, supplier) => sum + supplier.currentDebt, 0),
    []
  );
  const totalOrders = useMemo(
    () => MOCK_SUPPLIERS.reduce((sum, supplier) => sum + supplier.totalOrders, 0),
    []
  );
  const activeCount = useMemo(
    () => MOCK_SUPPLIERS.filter(supplier => supplier.status === 'active').length,
    []
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return MOCK_SUPPLIERS.filter(supplier => {
      const categoryMatched =
        filter === 'all'
          ? true
          : filter === 'withDebt'
            ? supplier.currentDebt > 0
            : supplier.category === filter;

      if (!categoryMatched) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        supplier.name.toLowerCase().includes(query) ||
        supplier.code.toLowerCase().includes(query) ||
        supplier.phone.includes(query) ||
        supplier.contactPerson.toLowerCase().includes(query)
      );
    });
  }, [filter, search]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('suppliers.title')}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {t('suppliers.subtitle', { count: MOCK_SUPPLIERS.length, debt: formatMoneyShort(totalDebt) })}
          </Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.fullBleedRow}>
              <SearchBar value={search} onChangeText={setSearch} placeholder={t('suppliers.searchPlaceholder')} />
            </View>

            <View style={styles.statsRow}>
              {[
                { label: t('suppliers.stat.total'), value: String(MOCK_SUPPLIERS.length), color: colors.text },
                { label: t('suppliers.stat.active'), value: String(activeCount), color: Colors.success },
                { label: t('suppliers.stat.debt'), value: formatMoneyShort(totalDebt), color: Colors.accent },
                { label: t('suppliers.stat.purchaseOrders'), value: String(totalOrders), color: Colors.primary },
              ].map(stat => (
                <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.fullBleedRow, styles.filterBleedRow]}>
              <ChipRow chips={FILTER_CHIPS.map(chip => ({ key: chip.key, label: t(chip.labelKey) }))} selected={filter} onSelect={key => setFilter(key as FilterKey)} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="search-outline" size={24} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>{t('suppliers.empty')}</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.row,
              index === 0 && styles.rowFirst,
              index === filtered.length - 1 && styles.rowLast,
              item.status === 'paused' && styles.rowPaused,
            ]}
            onPress={() => nav.navigate('SupplierEdit', { id: item.id })}
            activeOpacity={0.85}
          >
            <View style={[styles.logo, { borderColor: item.color, backgroundColor: `${item.color}22` }]}>
              <Ionicons name="cube-outline" size={20} color={item.color} />
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.meta}>
                {item.code} · {t(CATEGORY_LABEL_KEYS[item.category])}
              </Text>
              <View style={styles.bottomRow}>
                <Text style={styles.ordersText}>{t('suppliers.purchaseOrderCount', { count: item.totalOrders })}</Text>
                <Text
                  style={[
                    styles.debtText,
                    { color: item.currentDebt > 0 ? Colors.accent : Colors.success },
                  ]}
                >
                  {t('suppliers.debtValue', { value: item.currentDebt > 0 ? formatMoneyShort(item.currentDebt) : '0' })}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fabPill}
        onPress={() => nav.navigate('SupplierEdit', {})}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.fabPillText}>{t('suppliers.addTitle')}</Text>
      </TouchableOpacity>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  headerMain: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
  },
  headerSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  iconBtn: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 66,
    ...Shadow.sm,
  },
  statValue: {
    ...Typography.h4,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 96,
  },
  fullBleedRow: {
    marginHorizontal: -Spacing.lg,
  },
  filterBleedRow: {
    paddingRight: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowFirst: {
    borderTopWidth: 0,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    marginTop: Spacing.xs,
  },
  rowLast: {
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  rowPaused: {
    opacity: 0.6,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  name: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  meta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 8,
  },
  ordersText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  debtText: {
    ...Typography.captionMd,
    textTransform: 'lowercase',
  },
  emptyWrap: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  fabPill: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    ...Shadow.md,
  },
  fabPillText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
});
