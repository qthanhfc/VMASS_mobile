import React, { Fragment, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, type TranslationKey } from '../../i18n';
import { Colors, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { DashboardStats } from '../../types';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_STATS: DashboardStats = {
  revenueToday: 12450000,
  revenueYesterday: 10530000,
  ordersToday: 38,
  newCustomers: 7,
  itemsSold: 142,
  profitToday: 3200000,
  monthlyGoal: 300000000,
  monthlyRevenue: 186000000,
  weeklyRevenue: [7800000, 9100000, 8500000, 11200000, 9700000, 12100000, 12450000],
  topProducts: [
    { id: 1, name: 'Cà phê hòa tan G7', sold: 48, revenue: 1200000 },
    { id: 2, name: 'Mì Hảo Hảo tôm chua', sold: 37, revenue: 185000 },
    { id: 3, name: 'Sữa Vinamilk 1L', sold: 29, revenue: 812000 },
  ],
  lowStockProducts: [
    { id: 1, name: 'Pepsi 330ml', stock: 3, minStock: 10 },
    { id: 2, name: 'Dầu ăn Neptune', stock: 2, minStock: 8 },
    { id: 3, name: 'Bột giặt Omo 800g', stock: 1, minStock: 6 },
  ],
  recentOrders: [
    { id: 1, orderNumber: '#HD0892', customerName: 'Nguyễn Thị Lan', total: 345000, status: 'done', channel: 'pos', createdAt: '14:22' },
    { id: 2, orderNumber: '#HD0891', customerName: 'Khách vãng lai', total: 89000, status: 'done', channel: 'pos', createdAt: '14:08' },
    { id: 3, orderNumber: '#HD0890', customerName: 'Trần Văn Hải', total: 1200000, status: 'done', channel: 'pos', createdAt: '13:47' },
  ],
};

const MONTH_DAY_VALUES = [
  4200000, 5100000, 3900000, 6200000, 5800000, 6400000, 7000000, 7600000, 6900000, 7300000,
  6800000, 7100000, 7900000, 8600000, 8100000, 7700000, 8200000, 9000000, 8800000, 9400000,
  9100000, 8700000, 9600000, 10200000, 9800000, 10500000, 9900000, 10800000, 11200000, 10900000,
];
const MONTH_DAY_LABELS = ['1', '5', '10', '15', '20', '25', '30'];
const YEAR_MONTH_VALUES = [65, 72, 68, 75, 81, 79, 86, 91, 88, 95, 103, 110].map(v => v * 1000000);
const HOURLY_REVENUE = [
  180000, 120000, 90000, 70000, 60000, 85000,
  160000, 320000, 480000, 620000, 710000, 780000,
  920000, 860000, 740000, 680000, 790000, 880000,
  960000, 1020000, 980000, 820000, 560000, 310000,
];
const HOUR_MARKERS = ['00h', '06h', '12h', '18h', '23h'];
const DASH_SEGMENTS = Array.from({ length: 24 }, (_, i) => i);

// ─── Helper ───────────────────────────────────────────────────────────────────

const WEEK_LABEL_KEYS: TranslationKey[] = [
  'home.week.mon',
  'home.week.tue',
  'home.week.wed',
  'home.week.thu',
  'home.week.fri',
  'home.week.sat',
  'home.week.sun',
];

const YEAR_MONTH_LABEL_KEYS: TranslationKey[] = [
  'home.month.1',
  'home.month.2',
  'home.month.3',
  'home.month.4',
  'home.month.5',
  'home.month.6',
  'home.month.7',
  'home.month.8',
  'home.month.9',
  'home.month.10',
  'home.month.11',
  'home.month.12',
];

function money(n: number, dateLocale: string, currency: string) {
  return `${n.toLocaleString(dateLocale)} ${currency}`;
}

function shortMoney(n: number, dateLocale = 'en-US') {
  if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString(dateLocale);
}

function revenuePct(today: number, yesterday: number) {
  if (yesterday <= 0) return '+0%';
  const pct = ((today - yesterday) / yesterday) * 100;
  const sign = pct >= 0 ? '+' : '-';
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

function formatDate(
  date: Date,
  todayLabel: string,
  dateLocale: string
) {
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) return todayLabel;

  return date.toLocaleDateString(dateLocale);
}

function RevenueMiniChart({ values, currency, dateLocale }: { values: number[]; currency: string; dateLocale: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const max = Math.max(...values);
  const tooltipValue = activeIndex !== null ? money(values[activeIndex], dateLocale, currency) : '';
  const tooltipHour = activeIndex !== null ? `${activeIndex.toString().padStart(2, '0')}h` : '';
  const tooltipLeft = activeIndex !== null && chartWidth > 0
    ? Math.min(Math.max((chartWidth * activeIndex) / (values.length - 1), 48), chartWidth - 48)
    : 0;

  return (
    <View style={styles.heroChartWrap}>
      <View style={styles.heroChartRow} onLayout={e => setChartWidth(e.nativeEvent.layout.width)}>
        {activeIndex !== null ? (
          <View style={[styles.heroTooltip, { left: tooltipLeft }]}>
            <Text style={styles.heroTooltipHour}>{tooltipHour}</Text>
            <Text style={styles.heroTooltipValue}>{tooltipValue}</Text>
          </View>
        ) : null}
        {values.map((v, index) => {
          const h = Math.max(4, Math.round((v / max) * 36));
          return (
            <Pressable
              key={`${v}-${index}`}
              style={styles.heroBarPressable}
              onHoverIn={() => setActiveIndex(index)}
              onHoverOut={() => setActiveIndex(null)}
              onPressIn={() => setActiveIndex(index)}
              onPressOut={() => setActiveIndex(null)}
            >
              <View
                style={[
                  styles.heroChartBar,
                  {
                    height: h,
                    opacity: activeIndex === index ? 1 : index === values.length - 1 ? 1 : 0.45,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.heroChartLabels}>
        {HOUR_MARKERS.map(marker => (
          <Text key={marker} style={[styles.heroChartLabel, { color: 'rgba(255,255,255,0.78)' }]}>{marker}</Text>
        ))}
      </View>
    </View>
  );
}

function RevenueBarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values);
  const labelSlots = labels.length;
  const denominator = Math.max(values.length - 1, 1);
  const labelWithOffset = labels.map((label, i) => ({
    label,
    offset: labelSlots <= 1 ? 0 : Math.round((i * denominator) / (labelSlots - 1)),
  }));

  return (
    <View style={styles.barChartWrap}>
      <View style={styles.barChartRow}>
        {values.map((v, index) => {
          const h = Math.max(8, Math.round((v / max) * 70));
          return (
            <View key={`${v}-${index}`} style={styles.barChartCol}>
              <View style={[styles.barChartBar, { height: h }]} />
            </View>
          );
        })}
      </View>
      <View style={styles.barChartLabels}>
        {labelWithOffset.map(item => (
          <Text
            key={`${item.label}-${item.offset}`}
            style={[styles.barChartLabel, { left: `${(item.offset / denominator) * 100}%` }]}
          >
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

type RevenuePeriod = '7N' | '30N' | '12T';

function buildAxisLabels(
  period: RevenuePeriod,
  count: number,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
) {
  if (period === '7N') return WEEK_LABEL_KEYS.map((key) => t(key));
  if (period === '30N') return MONTH_DAY_LABELS;
  if (period === '12T') return YEAR_MONTH_LABEL_KEYS.map((key) => t(key));
  return Array.from({ length: count }, (_, i) => `${i + 1}`);
}

function periodTitle(
  period: RevenuePeriod,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
) {
  if (period === '30N') return t('home.revenue30d');
  if (period === '12T') return t('home.revenue12m');
  return t('home.revenue7d');
}

function KpiCard({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiTop}>
        <Ionicons name={icon} size={18} color={Colors.textSecondary} />
        <Text style={styles.kpiTrend}>{trend}</Text>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function DotImage() {
  return (
    <View style={styles.imagePlaceholder}>
      <Ionicons name="image-outline" size={16} color={Colors.textSecondary} />
    </View>
  );
}

function DashedDivider({ spacious = false }: { spacious?: boolean }) {
  return (
    <View style={[styles.dashRow, spacious && styles.dashRowSpacious]}>
      {DASH_SEGMENTS.map(i => (
        <View key={i} style={styles.dashSegment} />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const [loading] = useState(false);
  const [period, setPeriod] = useState<RevenuePeriod>('7N');
  const stats = MOCK_STATS;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const monthlyProgress = stats.monthlyRevenue / stats.monthlyGoal;
  const pctChange = revenuePct(stats.revenueToday, stats.revenueYesterday);
  const periodValues =
    period === '30N' ? MONTH_DAY_VALUES : period === '12T' ? YEAR_MONTH_VALUES : stats.weeklyRevenue;
  const periodLabels = buildAxisLabels(period, periodValues.length, t);
  const currency = t('home.currency');

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerMainRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.helloText, { color: colors.textSecondary }]}>{t('home.hello', { name: 'Minh' })}</Text>
            <Text style={[styles.titleText, { color: colors.text }]}>{t('home.dashboardTitle')}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.roundIconBtn}>
              <Ionicons name="search-outline" size={18} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roundIconBtn, styles.bellBtn]}>
              <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chipRow}>
          <View style={styles.metaChip}>
            <Ionicons name="storefront-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaChipText}>{t('home.defaultStore')}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaChipText}>{formatDate(new Date(), t('home.today'), dateLocale)}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrap}>
          <View style={styles.revenueCard}>
            <View style={styles.revenueTop}>
              <View style={styles.revenueLeft}>
                <Text style={[styles.revenueLabel, { color: 'rgba(255,255,255,0.9)' }]}>{t('home.revenueToday')}</Text>
                <Text style={[styles.revenueAmount, { color: '#fff' }]}>{money(stats.revenueToday, dateLocale, currency)}</Text>
                <View style={styles.revenueDeltaRow}>
                  <Ionicons name="trending-up" size={14} color="#fff" />
                  <Text style={[styles.revenueDeltaStrong, { color: '#fff' }]}>{pctChange}</Text>
                  <Text style={[styles.revenueDeltaText, { color: 'rgba(255,255,255,0.78)' }]}>{t('home.vsYesterday')}</Text>
                </View>
              </View>
              <Ionicons name="cash-outline" size={32} color="#fff" />
            </View>
            <RevenueMiniChart values={HOURLY_REVENUE} currency={currency} dateLocale={dateLocale} />
          </View>

          <View style={styles.kpiGrid}>
            <KpiCard icon="cart-outline" label={t('home.kpi.orders')} value={String(stats.ordersToday)} trend="+5" />
            <KpiCard icon="cash-outline" label={t('home.kpi.revenue')} value={shortMoney(stats.revenueToday, dateLocale)} trend={pctChange} />
            <KpiCard icon="cube-outline" label={t('home.kpi.itemsSold')} value={String(stats.itemsSold)} trend="+23" />
            <KpiCard icon="wallet-outline" label={t('home.kpi.profit')} value={shortMoney(stats.profitToday, dateLocale)} trend="+12%" />
          </View>

          <View style={styles.card}>
            <View style={styles.goalTop}>
              <Text style={styles.sectionTitle}>{t('home.monthlyGoal')}</Text>
              <Text style={styles.goalPct}>{Math.round(monthlyProgress * 100)}%</Text>
            </View>
            <Text style={styles.goalNumbers}>{shortMoney(stats.monthlyRevenue, dateLocale)} / {shortMoney(stats.monthlyGoal, dateLocale)} {currency}</Text>
            <View style={styles.goalTrack}>
              <View style={[styles.goalFill, { width: `${Math.round(monthlyProgress * 100)}%` }]} />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderLine}>
              <Text style={styles.sectionTitle}>{periodTitle(period, t)}</Text>
              <View style={styles.periodRow}>
                {(['7N', '30N', '12T'] as RevenuePeriod[]).map(p => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPeriod(p)}
                    activeOpacity={0.8}
                    style={[styles.periodPillBtn, period === p && styles.periodPillBtnActive]}
                  >
                    <Text style={[styles.periodPill, period === p && styles.periodPillActive]}>
                      {p === '7N' ? t('home.period.7d') : p === '30N' ? t('home.period.30d') : t('home.period.12m')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <RevenueBarChart values={periodValues} labels={periodLabels} />
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderLine}>
              <Text style={styles.sectionTitle}>{t('home.bestSellers')}</Text>
              <Text style={styles.sectionAction}>{t('home.viewAll')}</Text>
            </View>

            {stats.topProducts.map((p, i) => (
              <Fragment key={p.id}>
                {i > 0 ? <DashedDivider /> : null}
                <View style={styles.productRow}>
                  <View style={styles.rankBox}>
                    <Text style={styles.rankBoxText}>{i + 1}</Text>
                  </View>
                  <DotImage />
                  <View style={styles.productMid}>
                    <Text numberOfLines={1} style={styles.productName}>{p.name}</Text>
                    <Text style={styles.productMeta}>{t('home.productCodeSold', { code: (p.id + 1000).toString(), sold: p.sold })}</Text>
                  </View>
                  <Text style={styles.productRevenue}>{shortMoney(p.revenue, dateLocale)}</Text>
                </View>
              </Fragment>
            ))}
          </View>

          <View style={[styles.card, styles.warningCard]}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning-outline" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>{t('home.lowStock')}</Text>
              <Text style={styles.warningCount}>{stats.lowStockProducts.length} {t('home.productUnitShort')}</Text>
            </View>

            {stats.lowStockProducts.map((p, i) => (
              <Fragment key={p.id}>
                {i > 0 ? <DashedDivider spacious /> : null}
                <View style={styles.lowStockRow}>
                  <Text style={styles.lowStockText}>{t('home.stockLeft', { name: p.name, stock: p.stock })}</Text>
                  <Text style={styles.restockText}>{t('home.restock')}</Text>
                </View>
              </Fragment>
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderLine}>
              <Text style={styles.sectionTitle}>{t('home.recentOrders')}</Text>
              <Text style={styles.sectionAction}>{t('home.viewAll')}</Text>
            </View>

            {stats.recentOrders.map((o, i) => (
              <Fragment key={o.id}>
                {i > 0 ? <DashedDivider spacious /> : null}
                <View style={styles.orderRow}>
                  <Text style={styles.orderCode}>{o.orderNumber}</Text>
                  <Text numberOfLines={1} style={styles.orderWho}>{o.customerName}</Text>
                  <Text style={styles.orderTime}>{o.createdAt}</Text>
                  <Text style={styles.orderAmount}>{shortMoney(o.total, dateLocale)}</Text>
                </View>
              </Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  helloText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  titleText: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 6,
  },
  roundIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBtn: {
    backgroundColor: '#def4ff',
    borderColor: '#bde8fa',
  },

  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaChipText: {
    fontSize: 12,
    color: Colors.text,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  contentWrap: {
    paddingHorizontal: 12,
    gap: 12,
  },

  revenueCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: 14,
    ...Shadow.md,
  },
  revenueTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  revenueLeft: {
    flex: 1,
  },
  revenueLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  revenueAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 2,
  },
  revenueDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  revenueDeltaStrong: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  revenueDeltaText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.75)',
  },
  heroChartWrap: {
    marginTop: 10,
  },
  heroChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 40,
    position: 'relative',
  },
  heroBarPressable: {
    width: 8,
    height: '100%',
    justifyContent: 'flex-end',
  },
  heroChartBar: {
    width: 6,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  heroTooltip: {
    position: 'absolute',
    bottom: 42,
    transform: [{ translateX: -44 }],
    minWidth: 88,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9eef8',
    ...Shadow.sm,
  },
  heroTooltipHour: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  heroTooltipValue: {
    ...Typography.captionMd,
    color: Colors.text,
    fontWeight: '700',
    marginTop: 1,
  },
  heroChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  heroChartLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.78)',
    fontFamily: 'monospace',
  },

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '48.3%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kpiTrend: {
    ...Typography.label,
    color: Colors.primary,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 4,
  },
  kpiLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  sectionHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  sectionAction: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '700',
  },

  goalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalPct: {
    ...Typography.h4,
    color: Colors.primary,
  },
  goalNumbers: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  goalTrack: {
    height: 8,
    marginTop: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },

  periodRow: {
    flexDirection: 'row',
    gap: 4,
  },
  periodPillBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  periodPillBtnActive: {
    borderColor: Colors.primary,
  },
  periodPill: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  periodPillActive: {
    color: Colors.primary,
  },
  barChartWrap: {
    marginTop: 2,
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 80,
  },
  barChartCol: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  barChartBar: {
    width: '100%',
    borderRadius: 6,
    backgroundColor: '#8ed0ec',
    minHeight: 8,
  },
  barChartLabels: {
    position: 'relative',
    height: 14,
    marginTop: 4,
  },
  barChartLabel: {
    position: 'absolute',
    width: 28,
    marginLeft: -14,
    textAlign: 'center',
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  rankBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  rankBoxText: {
    ...Typography.bodyMd,
    color: Colors.primary,
    fontWeight: '800',
  },
  imagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#f8f7f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productMid: {
    flex: 1,
  },
  productName: {
    ...Typography.bodyMd,
    color: Colors.text,
    lineHeight: 17,
  },
  productMeta: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  productRevenue: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '700',
  },

  warningCard: {
    borderStyle: 'dashed',
    borderColor: Colors.accent,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  warningCount: {
    marginLeft: 'auto',
    ...Typography.label,
    color: '#fff',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lowStockRow: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  lowStockText: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
  },
  restockText: {
    ...Typography.captionMd,
    color: Colors.accent,
    fontWeight: '700',
  },

  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
  },
  orderCode: {
    ...Typography.captionMd,
    color: Colors.text,
    fontFamily: 'monospace',
    minWidth: 64,
  },
  orderWho: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
  },
  orderTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  orderAmount: {
    ...Typography.captionMd,
    color: Colors.text,
    fontWeight: '700',
    minWidth: 42,
    textAlign: 'right',
  },

  dashRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  dashRowSpacious: {
    marginVertical: 5,
  },
  dashSegment: {
    width: 7,
    height: 1,
    backgroundColor: '#cfc8bb',
    opacity: 0.95,
  },
});
