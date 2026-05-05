import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { ChipRow, ProgressBar, SearchBar } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

type PromotionStatus = 'active' | 'scheduled' | 'ended';
type PromotionType = 'percent' | 'flat' | 'bogo' | 'combo';
type PromotionFilterKey =
  | 'all'
  | PromotionStatus
  | PromotionType;

interface Promotion {
  id: number;
  nameKey: TranslationKey;
  code: string;
  type: PromotionType;
  value: number;
  usageLimit: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  estimatedDiscount: number;
  attributedRevenue: number;
  color: string;
}

const MOCK_PROMOTIONS: Promotion[] = [
  { id: 1, nameKey: 'promotions.sample.drink20', type: 'percent', value: 20, code: 'DRINK20', usageLimit: 500, usageCount: 142, startDate: '01/04', endDate: '30/04', status: 'active', estimatedDiscount: 5100000, attributedRevenue: 25600000, color: '#d97757' },
  { id: 2, nameKey: 'promotions.sample.bogoNoodles', type: 'bogo', value: 0, code: 'BOGO-MI', usageLimit: 100, usageCount: 38, startDate: '10/04', endDate: '25/04', status: 'active', estimatedDiscount: 900000, attributedRevenue: 5100000, color: '#4a9f4a' },
  { id: 3, nameKey: 'promotions.sample.save50', type: 'flat', value: 50000, code: 'SAVE50', usageLimit: 200, usageCount: 89, startDate: '01/04', endDate: '28/04', status: 'active', estimatedDiscount: 4450000, attributedRevenue: 35600000, color: '#6b8cae' },
  { id: 4, nameKey: 'promotions.sample.flash1212', type: 'percent', value: 30, code: 'FLASH1212', usageLimit: 1000, usageCount: 0, startDate: '10/12', endDate: '12/12', status: 'scheduled', estimatedDiscount: 0, attributedRevenue: 0, color: '#8a6a9e' },
  { id: 5, nameKey: 'promotions.sample.tetCombo', type: 'combo', value: 0, code: 'TET2026', usageLimit: 300, usageCount: 0, startDate: '05/01', endDate: '15/01', status: 'scheduled', estimatedDiscount: 0, attributedRevenue: 0, color: '#d4a574' },
  { id: 6, nameKey: 'promotions.sample.opening', type: 'percent', value: 10, code: 'OPEN10', usageLimit: 300, usageCount: 256, startDate: '01/03', endDate: '30/03', status: 'ended', estimatedDiscount: 3840000, attributedRevenue: 19800000, color: '#8a8a8a' },
];

const FILTER_CHIPS: Array<{ key: PromotionFilterKey; labelKey: TranslationKey }> = [
  { key: 'all', labelKey: 'messages.filter.all' },
  { key: 'active', labelKey: 'promotions.status.active' },
  { key: 'scheduled', labelKey: 'promotions.status.scheduled' },
  { key: 'ended', labelKey: 'promotions.status.ended' },
  { key: 'percent', labelKey: 'promotions.filter.percent' },
  { key: 'flat', labelKey: 'promotions.filter.flat' },
  { key: 'bogo', labelKey: 'promotions.filter.bogo' },
];

const STATUS_META: Record<PromotionStatus, { labelKey: TranslationKey; color: string }> = {
  active: { labelKey: 'promotions.status.active', color: Colors.success },
  scheduled: { labelKey: 'promotions.status.scheduled', color: Colors.primary },
  ended: { labelKey: 'promotions.status.ended', color: Colors.textSecondary },
};

function compactMoney(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  return `${value}`;
}

function discountBadgeText(promotion: Promotion) {
  if (promotion.type === 'percent') return `${promotion.value}%`;
  if (promotion.type === 'flat') return `-${Math.round(promotion.value / 1000)}K`;
  if (promotion.type === 'bogo') return 'B2G1';
  return 'COMBO';
}

function typeFilterMatches(filter: PromotionFilterKey, promotion: Promotion) {
  if (filter === 'all') return true;
  if (filter === 'active' || filter === 'scheduled' || filter === 'ended') {
    return promotion.status === filter;
  }
  return promotion.type === filter;
}

export function PromotionsListScreen() {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PromotionFilterKey>('all');

  const stats = useMemo(() => {
    const activeCount = MOCK_PROMOTIONS.filter(item => item.status === 'active').length;
    const totalUsed = MOCK_PROMOTIONS.reduce((sum, item) => sum + item.usageCount, 0);
    const totalDiscount = MOCK_PROMOTIONS.reduce((sum, item) => sum + item.estimatedDiscount, 0);
    const promoRevenue = MOCK_PROMOTIONS.reduce((sum, item) => sum + item.attributedRevenue, 0);
    return { activeCount, totalUsed, totalDiscount, promoRevenue };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return MOCK_PROMOTIONS.filter(promotion => {
      if (!typeFilterMatches(filter, promotion)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        t(promotion.nameKey).toLowerCase().includes(query) ||
        promotion.code.toLowerCase().includes(query)
      );
    });
  }, [filter, search]);

  const headerSub = t('promotions.subtitle', { total: MOCK_PROMOTIONS.length, active: stats.activeCount });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('promotions.title')}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{headerSub}</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.fullBleedRow}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder={t('promotions.searchPlaceholder')}
              />
            </View>

            <View style={styles.heroWrap}>
              <View style={styles.heroCard}>
                <Text style={[styles.heroLabel, { color: 'rgba(255,255,255,0.9)' }]}>{t('promotions.monthlyPerformance')}</Text>
                <View style={styles.heroStatRow}>
                  {[
                    { label: t('promotions.used'), value: String(stats.totalUsed) },
                    { label: t('promotions.saved'), value: compactMoney(stats.totalDiscount) },
                    { label: t('promotions.promoRevenue'), value: compactMoney(stats.promoRevenue) },
                  ].map(item => (
                    <View key={item.label} style={styles.heroStatCol}>
                      <Text style={[styles.heroStatValue, { color: '#fff' }]}>{item.value}</Text>
                      <Text style={[styles.heroStatLabel, { color: 'rgba(255,255,255,0.85)' }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={[styles.fullBleedRow, styles.filterBleedRow]}>
              <ChipRow
                chips={FILTER_CHIPS.map(chip => ({ key: chip.key, label: t(chip.labelKey) }))}
                selected={filter}
                onSelect={key => setFilter(key as PromotionFilterKey)}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="search-outline" size={24} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>{t('promotions.empty')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }, item.status === 'ended' && styles.endedRow]}
            onPress={() => nav.navigate('PromotionEdit', { id: item.id })}
            activeOpacity={0.85}
          >
            <View style={[styles.discountBox, { borderColor: item.color, backgroundColor: `${item.color}22` }]}>
              <Ionicons name="pricetag-outline" size={14} color={item.color} />
              <Text style={[styles.discountBadgeValue, { color: item.color }]}>{discountBadgeText(item)}</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={[styles.promoName, { color: colors.text }]} numberOfLines={1}>
                {t(item.nameKey)}
              </Text>
              <Text style={[styles.promoMeta, { color: colors.textSecondary }]}>
                {item.code} · {t('promotions.endsOn', { date: item.endDate })}
              </Text>

              <View style={styles.progressWrap}>
                <ProgressBar
                  progress={item.usageLimit > 0 ? item.usageCount / item.usageLimit : 0}
                  color={item.color}
                  height={5}
                />
              </View>

              <View style={styles.statusLine}>
                <Text style={[styles.statusText, { color: STATUS_META[item.status].color }]}>
                  ● {t(STATUS_META[item.status].labelKey)}
                </Text>
                <Text style={[styles.usageText, { color: colors.textSecondary }]}>
                  {item.usageCount}/{item.usageLimit}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fabPill}
        onPress={() => nav.navigate('PromotionEdit', {})}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.fabPillText}>{t('promotions.createTitle')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginRight: 8, padding: 4 },
  headerMain: { flex: 1 },
  headerTitle: { ...Typography.h3 },
  headerSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  heroWrap: {
    paddingBottom: Spacing.sm,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...Shadow.sm,
  },
  heroLabel: {
    ...Typography.captionMd,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  heroStatRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStatCol: {
    flex: 1,
  },
  heroStatValue: {
    ...Typography.h3,
    color: '#fff',
    fontWeight: '700',
  },
  heroStatLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
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
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    marginTop: Spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  endedRow: {
    opacity: 0.6,
  },
  discountBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadgeValue: {
    ...Typography.captionMd,
    marginTop: 2,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
  },
  promoName: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  promoMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressWrap: {
    marginTop: 6,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statusText: {
    ...Typography.captionMd,
  },
  usageText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyWrap: {
    marginTop: 16,
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
