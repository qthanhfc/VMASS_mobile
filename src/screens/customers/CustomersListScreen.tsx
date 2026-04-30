import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { Header, SearchBar, ChipRow } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import { Customer } from '../../types';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type CustomerFilter = 'all' | 'VIP' | 'Gold' | 'Silver' | 'Normal' | 'new' | 'debt';

type CustomerRow = Customer & {
  hasDebt?: boolean;
};

const MOCK_CUSTOMERS: CustomerRow[] = [
  { id: 1, name: 'Nguyễn Thị Lan', phone: '0912 345 678', totalSpent: 18400000, orderCount: 42, points: 1840, tier: 'VIP', email: 'lan@gmail.com', createdAt: '2026-01-15' },
  { id: 2, name: 'Trần Văn Minh', phone: '0987 654 321', totalSpent: 12100000, orderCount: 28, points: 1210, tier: 'Gold', email: 'minh@gmail.com', createdAt: '2025-11-20' },
  { id: 3, name: 'Lê Thị Hoa', phone: '0901 234 567', totalSpent: 5800000, orderCount: 15, points: 580, tier: 'Silver', createdAt: '2025-10-05' },
  { id: 4, name: 'Phạm Đức Anh', phone: '0934 567 890', totalSpent: 3200000, orderCount: 8, points: 320, tier: 'Normal', createdAt: '2026-02-10' },
  { id: 5, name: 'Vũ Thị Mai', phone: '0967 890 123', totalSpent: 850000, orderCount: 3, points: 85, tier: 'Normal', createdAt: '2026-04-08' },
  { id: 6, name: 'Hoàng Văn Tú', phone: '0945 678 901', totalSpent: 24700000, orderCount: 52, points: 2470, tier: 'VIP', createdAt: '2025-08-01' },
  { id: 7, name: 'Đỗ Thị Hương', phone: '0923 456 789', totalSpent: 7300000, orderCount: 19, points: 730, tier: 'Gold', createdAt: '2026-04-15', hasDebt: true },
];

const TIER_META: Record<Customer['tier'], { color: string; bg: string; labelKey: TranslationKey }> = {
  VIP: { color: '#d97757', bg: '#fff1eb', labelKey: 'customers.tier.vip' },
  Gold: { color: '#d4a574', bg: '#fcf5eb', labelKey: 'customers.tier.gold' },
  Silver: { color: '#8a8a8a', bg: '#f2f2f2', labelKey: 'customers.tier.silver' },
  Normal: { color: '#7a9e7a', bg: '#edf7ed', labelKey: 'customers.tier.normal' },
};

const FILTER_CHIPS: Array<{ key: CustomerFilter; labelKey: TranslationKey }> = [
  { key: 'all', labelKey: 'messages.filter.all' },
  { key: 'VIP', labelKey: 'customers.tier.vip' },
  { key: 'Gold', labelKey: 'customers.tier.gold' },
  { key: 'Silver', labelKey: 'customers.tier.silver' },
  { key: 'Normal', labelKey: 'customers.tier.normal' },
  { key: 'new', labelKey: 'customers.filter.new' },
  { key: 'debt', labelKey: 'suppliers.withDebt' },
];

function compactMoney(value: number): string {
  if (value >= 1_000_000) {
    const million = value / 1_000_000;
    return million >= 100 ? `${Math.round(million)}M` : `${million.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  return String(value);
}

function firstLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, '');
}

export function CustomersListScreen() {
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');

  const totalSpent = useMemo(() => MOCK_CUSTOMERS.reduce((sum, customer) => sum + customer.totalSpent, 0), []);

  const avgSpent = useMemo(
    () => (MOCK_CUSTOMERS.length ? Math.round(totalSpent / MOCK_CUSTOMERS.length) : 0),
    [totalSpent]
  );

  const thisMonthPrefix = useMemo(() => {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }, []);

  const newThisMonth = useMemo(
    () => MOCK_CUSTOMERS.filter((customer) => customer.createdAt.startsWith(thisMonthPrefix)).length,
    [thisMonthPrefix]
  );

  const totalCustomers = MOCK_CUSTOMERS.length;
  const vipCustomers = MOCK_CUSTOMERS.filter((customer) => customer.tier === 'VIP').length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return MOCK_CUSTOMERS
      .filter((customer) => {
        const bySearch =
          query.length === 0 ||
          customer.name.toLowerCase().includes(query) ||
          normalizePhone(customer.phone).includes(query.replace(/\s+/g, ''));

        const byFilter =
          filter === 'all' ||
          (filter === 'new' && customer.orderCount <= 3) ||
          (filter === 'debt' && !!customer.hasDebt) ||
          customer.tier === filter;

        return bySearch && byFilter;
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [filter, search]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title={t('customers.title')}
        subtitle={t('customers.subtitle', { total: totalCustomers.toLocaleString(dateLocale), vip: vipCustomers })}
        onBack={() => navigation.goBack()}
        rightActions={
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="search" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="filter-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        }
      />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={t('customers.searchPlaceholder')}
      />

      <View style={styles.heroWrap}>
        <View style={styles.heroCard}>
          <Text style={[styles.heroHeading, { color: 'rgba(255,255,255,0.85)' }]}>{t('customers.overview')}</Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroValue, { color: '#fff' }]}>{compactMoney(totalSpent)}</Text>
              <Text style={[styles.heroLabel, { color: 'rgba(255,255,255,0.85)' }]}>{t('customers.totalSpent')}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroValue, { color: '#fff' }]}>{compactMoney(avgSpent)}</Text>
              <Text style={[styles.heroLabel, { color: 'rgba(255,255,255,0.85)' }]}>{t('customers.avgPerCustomer')}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroValue, { color: '#fff' }]}>+{newThisMonth}</Text>
              <Text style={[styles.heroLabel, { color: 'rgba(255,255,255,0.85)' }]}>{t('customers.newThisMonth')}</Text>
            </View>
          </View>
        </View>
      </View>

      <ChipRow chips={FILTER_CHIPS.map(chip => ({ key: chip.key, label: t(chip.labelKey) }))} selected={filter} onSelect={(key) => setFilter(key as CustomerFilter)} />

      <View style={styles.sortRow}>
        <Text style={[styles.sortText, { color: colors.textSecondary }]}>{t('customers.sortHighestSpend')}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          const isLast = index === filtered.length - 1;
          const tier = TIER_META[item.tier];

          return (
            <TouchableOpacity
              style={[
                styles.customerRow,
                { backgroundColor: colors.card, borderColor: colors.border },
                isFirst && styles.customerRowFirst,
                !isFirst && [styles.customerRowWithSeparator, { borderTopColor: colors.border }],
                isLast && styles.customerRowLast,
              ]}
              onPress={() => navigation.navigate('CustomerEdit', { id: item.id })}
              activeOpacity={0.8}
            >
              <View style={[styles.avatarCircle, { backgroundColor: tier.bg, borderColor: tier.color }]}>
                <Text style={[styles.avatarText, { color: tier.color }]}>{firstLetter(item.name)}</Text>
              </View>

              <View style={styles.customerInfo}>
                <View style={styles.customerNameRow}>
                  <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
                    <Text style={styles.tierText}>{t(tier.labelKey)}</Text>
                  </View>
                </View>

                <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>{item.phone}</Text>
                <Text style={[styles.customerMeta, { color: colors.textSecondary }]}>
                  {t('manage.orderCount', { count: item.orderCount })} · <Text style={[styles.customerSpent, { color: colors.primary }]}>{compactMoney(item.totalSpent)}</Text>
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={46} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('customers.empty')}</Text>
          </View>
        }
        ListFooterComponent={
          <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>{t('customers.loadMore')}</Text>
        }
      />

      <TouchableOpacity style={styles.fabPill} onPress={() => navigation.navigate('CustomerEdit', {})}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.fabPillText}>{t('customers.addShort')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  heroCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  heroHeading: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStat: {
    flex: 1,
  },
  heroValue: {
    ...Typography.h3,
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  heroLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  sortRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sortText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  customerRowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    ...Shadow.sm,
  },
  customerRowWithSeparator: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
  },
  customerRowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    ...Typography.bodyMd,
    fontSize: 16,
    fontWeight: '800',
  },
  customerInfo: {
    flex: 1,
    minWidth: 0,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    ...Typography.bodyMd,
    color: Colors.text,
    flex: 1,
  },
  tierBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tierText: {
    ...Typography.label,
    color: '#fff',
    fontSize: 9,
    letterSpacing: 0.2,
  },
  customerPhone: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  customerMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  customerSpent: {
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 52,
    gap: 10,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  loadMoreText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
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
