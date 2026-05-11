import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, type TranslationKey } from '../../i18n';
import { Colors, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { DashboardStats } from '../../types';
import { useRealtimeRefresh } from '../../realtime';
import { getCachedHomeDashboard, getCurrentUserProfile, getHomeDashboard, type HomeDashboardData, type HomeRevenuePeriod } from '../../services';
import type { RootTabParamList } from '../../navigation';

const MONTH_DAY_LABELS = ['1', '5', '10', '15', '20', '25', '30'];
const HOUR_MARKERS = ['00h', '06h', '12h', '18h', '23h'];
const DASH_SEGMENTS = Array.from({ length: 24 }, (_, i) => i);

// ─── Helper ───────────────────────────────────────────────────────────────────

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

function compactMoneyKpi(n: number) {
  const abs = Math.abs(n || 0);
  if (abs >= 1000000) return `${Math.round((n / 1000000) * 10) / 10}M`;
  if (abs >= 1000) return `${Math.round(n / 1000)}K`;
  return `${Math.round(n || 0)}`;
}

function formatStockQty(value: number, dateLocale: string) {
  return value.toLocaleString(dateLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function revenuePct(today: number, yesterday: number) {
  if (yesterday <= 0) return '+0%';
  const pct = ((today - yesterday) / yesterday) * 100;
  const sign = pct >= 0 ? '+' : '-';
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

function sanitizeErrorMessage(message: string) {
  if (!message) return 'Không thể tải dashboard.';
  const trimmed = message.trim();
  if (/<!doctype html>/i.test(trimmed) || /<html/i.test(trimmed)) {
    return 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.';
  }
  return trimmed;
}

function toDisplayFirstName(fullname?: string | null) {
  const normalized = String(fullname || '').trim().replace(/\s+/g, ' ');
  if (!normalized) return '';
  const parts = normalized.split(' ');
  const last = parts[parts.length - 1] || '';
  if (!last) return '';
  return last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
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

function toYmd(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateRange(start: Date, end: Date, todayLabel: string, dateLocale: string) {
  if (toYmd(start) === toYmd(end)) return formatDate(start, todayLabel, dateLocale);
  return `${start.toLocaleDateString(dateLocale)} - ${end.toLocaleDateString(dateLocale)}`;
}

function RevenueMiniChart({ values, currency, dateLocale }: { values: number[]; currency: string; dateLocale: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const max = Math.max(...values, 1);
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
  const max = Math.max(...values, 1);
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
          const h = v <= 0 ? 0 : Math.max(4, Math.round((v / max) * 70));
          return (
            <View key={`${v}-${index}`} style={styles.barChartCol}>
              <View
                style={[
                  styles.barChartBar,
                  {
                    height: h,
                    opacity: v <= 0 ? 0.18 : 1,
                  },
                ]}
              />
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

type RevenuePeriod = HomeRevenuePeriod;

function buildAxisLabels(
  period: RevenuePeriod,
  count: number,
  rawLabels: string[],
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
) {
  if (period === '7N') {
    if (rawLabels.length === count) {
      return rawLabels.map((label) => {
        const parts = label.split('-');
        return parts.length === 3 ? `${Number(parts[2])}/${Number(parts[1])}` : label;
      });
    }
    return Array.from({ length: count }, (_, i) => String(i + 1));
  }
  if (period === '30N') {
    if (rawLabels.length === count) {
      return rawLabels.map((label) => {
        const parts = label.split('-');
        return parts.length === 3 ? `${Number(parts[2])}` : label;
      });
    }
    return MONTH_DAY_LABELS;
  }
  if (period === '12T') {
    if (rawLabels.length === count) {
      return rawLabels.map((label) => {
        const parts = label.split('-');
        return parts.length >= 2 ? `T${Number(parts[1])}` : label;
      });
    }
    return YEAR_MONTH_LABEL_KEYS.map((key) => t(key));
  }
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
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  trend: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.kpiCard}>
      <View style={styles.kpiTop}>
        <Ionicons name={icon} size={18} color={Colors.textSecondary} />
        <Text style={styles.kpiTrend}>{trend}</Text>
      </View>
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{value}</Text>
      <Text style={styles.kpiLabel} numberOfLines={1}>{label}</Text>
    </View>
  );

  if (!onPress) {
    return <View style={styles.kpiCardWrap}>{content}</View>;
  }

  return (
    <TouchableOpacity style={styles.kpiCardWrap} onPress={onPress} activeOpacity={0.88}>
      {content}
    </TouchableOpacity>
  );
}

function DotImage() {
  return (
    <View style={styles.imagePlaceholder}>
      <Ionicons name="image-outline" size={16} color={Colors.textSecondary} />
    </View>
  );
}

function SectionEmptyState({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.sectionEmptyWrap}>
      <Ionicons name={icon} size={18} color={Colors.textSecondary} />
      <Text style={styles.sectionEmptyText}>{text}</Text>
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

type HomeTabNav = NativeStackNavigationProp<RootTabParamList>;

const EMPTY_DASHBOARD: HomeDashboardData = {
  stats: {
    revenueToday: 0,
    revenueYesterday: 0,
    ordersToday: 0,
    ordersPrevious: 0,
    newCustomers: 0,
    itemsSold: 0,
    itemsSoldPrevious: 0,
    profitToday: 0,
    profitPrevious: 0,
    monthlyGoal: 1,
    monthlyRevenue: 0,
    dailyGoal: 1,
    dailyRevenue: 0,
    dailyProductGoal: 1,
    dailyProductsSold: 0,
    monthlyProductGoal: 1,
    monthlyProductsSold: 0,
    weeklyRevenue: Array.from({ length: 7 }, () => 0),
    topProducts: [],
    lowStockProducts: [],
    recentOrders: [],
  },
  hourlyRevenue: Array.from({ length: 24 }, () => 0),
  hourlyCost: Array.from({ length: 24 }, () => 0),
  costToday: 0,
  costYesterday: 0,
  periodRevenue: {
    '7N': Array.from({ length: 7 }, () => 0),
    '30N': Array.from({ length: 30 }, () => 0),
    '12T': Array.from({ length: 12 }, () => 0),
  },
  periodLabels: {
    '7N': Array.from({ length: 7 }, (_, i) => String(i + 1)),
    '30N': Array.from({ length: 30 }, (_, i) => String(i + 1)),
    '12T': Array.from({ length: 12 }, (_, i) => String(i + 1)),
  },
};

export function HomeScreen() {
  const navigation = useNavigation<HomeTabNav>();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState<HomeDashboardData>(EMPTY_DASHBOARD);
  const [period, setPeriod] = useState<RevenuePeriod>('7N');
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(new Date());
  const [draftStartDate, setDraftStartDate] = useState<Date>(new Date());
  const [draftEndDate, setDraftEndDate] = useState<Date>(new Date());
  const [dateMode, setDateMode] = useState<'single' | 'range'>('range');
  const [pickingRangeEdge, setPickingRangeEdge] = useState<'start' | 'end'>('start');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [headerUserName, setHeaderUserName] = useState('');
  const [headerStoreName, setHeaderStoreName] = useState('');
  const stats: DashboardStats = dashboard.stats;
  const initializedRef = useRef(false);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const slots: Array<Date | null> = [];
    for (let i = 0; i < startWeekday; i += 1) slots.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) slots.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d));
    return slots;
  }, [calendarMonth]);

  const loadDashboard = useCallback(async (options?: { isRefresh?: boolean; silent?: boolean; isRangeSwitch?: boolean; keepSkeleton?: boolean }) => {
    const isRefresh = options?.isRefresh ?? false;
    const silent = options?.silent ?? false;
    const isRangeSwitch = options?.isRangeSwitch ?? false;
    const keepSkeleton = options?.keepSkeleton ?? true;
    if (!isRefresh && !silent) setLoading(true);
    if (keepSkeleton) setDataLoading(true);
    if (isRangeSwitch) setRangeLoading(true);
    setError('');
    try {
      const data = await getHomeDashboard({ dateStart: selectedStartDate, dateEnd: selectedEndDate });
      setDashboard(data);
    } catch (err) {
      const message = sanitizeErrorMessage(err instanceof Error ? err.message : 'Không thể tải dashboard.');
      setError(message);
      const cached = await getCachedHomeDashboard();
      if (cached) {
        setDashboard(cached);
      }
    } finally {
      if (!silent || isRefresh) setLoading(false);
      if (isRangeSwitch) setRangeLoading(false);
      if (keepSkeleton) setDataLoading(false);
      setRefreshing(false);
    }
  }, [selectedStartDate, selectedEndDate]);
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard({ isRefresh: true });
  }, [loadDashboard]);
  useRealtimeRefresh(['dashboard', 'orders', 'bookkeeping', 'tax', 'products'], handleRefresh);

  const onPickDate = useCallback((picked: Date) => {
    if (dateMode === 'single') {
      setDraftStartDate(picked);
      setDraftEndDate(picked);
      return;
    }

    if (pickingRangeEdge === 'start') {
      setDraftStartDate(picked);
      if (picked > draftEndDate) setDraftEndDate(picked);
      setPickingRangeEdge('end');
      return;
    }

    if (picked < draftStartDate) {
      setDraftStartDate(picked);
      setDraftEndDate(draftStartDate);
    } else {
      setDraftEndDate(picked);
    }
    setPickingRangeEdge('start');
  }, [dateMode, draftEndDate, draftStartDate, pickingRangeEdge]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!initializedRef.current) {
        const cached = await getCachedHomeDashboard();
        if (!mounted) return;

        if (cached) {
          setDashboard(cached);
          setLoading(false);
          initializedRef.current = true;
          await loadDashboard({ silent: true });
          return;
        }

        initializedRef.current = true;
        await loadDashboard();
        return;
      }
      await loadDashboard({ isRangeSwitch: true });
    })();

    return () => {
      mounted = false;
    };
  }, [loadDashboard]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await getCurrentUserProfile();
        if (!mounted) return;

        const displayName =
          toDisplayFirstName(profile.fullname) ||
          toDisplayFirstName(profile.username) ||
          'Bạn';
        const storeName = String(profile.companyName || '').trim() || t('home.defaultStore');

        setHeaderUserName(displayName);
        setHeaderStoreName(storeName);
      } catch {
        if (!mounted) return;
        setHeaderUserName('Bạn');
        setHeaderStoreName(t('home.defaultStore'));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [t]);

  const monthlyProgress = stats.monthlyGoal > 0 ? stats.monthlyRevenue / stats.monthlyGoal : 0;
  const dailyProgress = stats.dailyGoal > 0 ? stats.dailyRevenue / stats.dailyGoal : 0;
  const monthlyProgressPct = Math.max(0, Math.min(100, Math.round(monthlyProgress * 100)));
  const dailyProgressPct = Math.max(0, Math.min(100, Math.round(dailyProgress * 100)));
  const pctChange = revenuePct(stats.revenueToday, stats.revenueYesterday);
  const costPctChange = revenuePct(dashboard.costToday, dashboard.costYesterday);
  const profitPctChange = revenuePct(stats.profitToday, stats.profitPrevious);
  const ordersPctChange = revenuePct(stats.ordersToday, stats.ordersPrevious);
  const itemsPctChange = revenuePct(stats.itemsSold, stats.itemsSoldPrevious);
  const periodValues =
    period === '30N' ? dashboard.periodRevenue['30N'] : period === '12T' ? dashboard.periodRevenue['12T'] : dashboard.periodRevenue['7N'];
  const periodLabels = buildAxisLabels(period, periodValues.length, dashboard.periodLabels[period], t);
  const currency = t('home.currency');
  const masked = (value: string) => (dataLoading ? '~~~~' : value);
  const maskedShort = (value: string) => (dataLoading ? '~~~' : value);
  const maskedTrend = (value: string) => (dataLoading ? '...' : value);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerMainRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.helloText, { color: colors.textSecondary }]}>{t('home.hello', { name: headerUserName || 'Bạn' })}</Text>
            <Text style={[styles.titleText, { color: colors.text }]}>{`${headerStoreName || t('home.defaultStore')}`}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.roundIconBtn} onPress={() => navigation.navigate('Manage', { screen: 'ManageMain' })}>
              <Ionicons name="search-outline" size={18} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roundIconBtn, styles.bellBtn]} onPress={() => navigation.navigate('Messages')}>
              <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chipRow}>
          <View style={styles.metaChip}>
            <Ionicons name="storefront-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaChipText}>{t('home.defaultStore')}</Text>
          </View>
          <TouchableOpacity
            style={styles.metaChip}
            activeOpacity={0.85}
            onPress={() => {
              setCalendarMonth(new Date(selectedEndDate.getFullYear(), selectedEndDate.getMonth(), 1));
              setDateMode(toYmd(selectedStartDate) === toYmd(selectedEndDate) ? 'single' : 'range');
              setPickingRangeEdge('start');
              setDraftStartDate(selectedStartDate);
              setDraftEndDate(selectedEndDate);
              setShowDatePicker(true);
            }}
          >
            <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaChipText}>{formatDateRange(selectedStartDate, selectedEndDate, t('home.today'), dateLocale)}</Text>
          </TouchableOpacity>
          {rangeLoading ? (
            <View style={styles.updatingChip}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.updatingChipText}>Đang cập nhật</Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View style={styles.contentWrap}>
          <View style={styles.revenueCard}>
            <View style={styles.revenueTop}>
              <View style={styles.revenueLeft}>
                <Text style={[styles.revenueLabel, { color: 'rgba(255,255,255,0.9)' }]}>{t('home.revenueToday')}</Text>
                <Text style={[styles.revenueAmount, { color: '#fff' }]}>{masked(money(stats.revenueToday, dateLocale, currency))}</Text>
                <View style={styles.revenueDeltaRow}>
                  <Ionicons name={pctChange.startsWith('-') ? 'trending-down' : 'trending-up'} size={14} color="#fff" />
                  <Text style={[styles.revenueDeltaStrong, { color: '#fff' }]}>{maskedTrend(pctChange)}</Text>
                  <Text style={[styles.revenueDeltaText, { color: 'rgba(255,255,255,0.78)' }]}>{t('home.vsYesterday')}</Text>
                </View>
              </View>
              <Ionicons name="cash-outline" size={32} color="#fff" />
            </View>
            <RevenueMiniChart values={dataLoading ? Array.from({ length: 24 }, () => 0) : dashboard.hourlyRevenue} currency={currency} dateLocale={dateLocale} />
          </View>

          <View style={styles.kpiGrid}>
            <KpiCard icon="receipt-outline" label="Chi phí" value={maskedShort(compactMoneyKpi(dashboard.costToday))} trend={maskedTrend(costPctChange)} />
            <KpiCard icon="wallet-outline" label={t('home.kpi.profit')} value={maskedShort(compactMoneyKpi(stats.profitToday))} trend={maskedTrend(profitPctChange)} />
            <KpiCard icon="cart-outline" label={t('home.kpi.orders')} value={maskedShort(String(stats.ordersToday))} trend={maskedTrend(ordersPctChange)} onPress={() => navigation.navigate('Manage', { screen: 'OrdersList' })} />
            <KpiCard icon="cube-outline" label={t('home.kpi.itemsSold')} value={maskedShort(String(stats.itemsSold))} trend={maskedTrend(itemsPctChange)} onPress={() => navigation.navigate('Manage', { screen: 'ProductsList' })} />
          </View>

          <View style={styles.card}>
            <View style={styles.goalTop}>
              <Text style={styles.sectionTitle}>{t('home.monthlyGoal')}</Text>
            </View>
            <View style={styles.goalGroup}>
              <View style={styles.goalRow}>
                <Text style={styles.goalRowTitle}>{t('home.goal.day')}</Text>
              </View>
              <View style={styles.goalMetricsRow}>
                <Text style={styles.goalNumbers}>{masked(`${shortMoney(stats.dailyRevenue, dateLocale)} / ${shortMoney(stats.dailyGoal, dateLocale)} ${currency}`)}</Text>
                <Text style={styles.goalSubNumbers}>{maskedShort(`${stats.dailyProductsSold} / ${stats.dailyProductGoal} ${t('home.goal.products')}`)}</Text>
              </View>
              <View style={styles.goalTrack}>
                <View style={[styles.goalFill, { width: `${dailyProgressPct}%` }]} />
              </View>
            </View>
            <View style={styles.goalGroup}>
              <View style={styles.goalRow}>
                <Text style={styles.goalRowTitle}>{t('home.goal.month')}</Text>
              </View>
              <View style={styles.goalMetricsRow}>
                <Text style={styles.goalNumbers}>{masked(`${shortMoney(stats.monthlyRevenue, dateLocale)} / ${shortMoney(stats.monthlyGoal, dateLocale)} ${currency}`)}</Text>
                <Text style={styles.goalSubNumbers}>{maskedShort(`${stats.monthlyProductsSold} / ${stats.monthlyProductGoal} ${t('home.goal.products')}`)}</Text>
              </View>
              <View style={styles.goalTrack}>
                <View style={[styles.goalFill, { width: `${monthlyProgressPct}%` }]} />
              </View>
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
            <RevenueBarChart values={dataLoading ? Array.from({ length: periodValues.length }, () => 0) : periodValues} labels={periodLabels} />
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderLine}>
              <Text style={styles.sectionTitle}>{t('home.bestSellers')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Manage', { screen: 'ProductsList' })}>
                <Text style={styles.sectionAction}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView nestedScrollEnabled style={styles.innerListScroll} showsVerticalScrollIndicator={false}>
              {stats.topProducts.length === 0 ? (
                <SectionEmptyState icon="sparkles-outline" text={t('home.empty.bestSellers')} />
              ) : stats.topProducts.map((p, i) => (
                <Fragment key={p.id}>
                  {i > 0 ? <DashedDivider /> : null}
                  <View style={styles.productRow}>
                    <View style={styles.rankBox}>
                      <Text style={styles.rankBoxText}>{i + 1}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Manage', { screen: 'ProductEdit', params: { id: p.id } })}>
                      <DotImage />
                    </TouchableOpacity>
                    <View style={styles.productMid}>
                      <Text numberOfLines={1} style={styles.productName}>{p.name}</Text>
                      <Text style={styles.productMeta}>{t('home.productCodeSold', { code: (p.id + 1000).toString(), sold: p.sold })}</Text>
                    </View>
                    <Text style={styles.productRevenue}>{shortMoney(p.revenue, dateLocale)}</Text>
                  </View>
                </Fragment>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.card, styles.warningCard]}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning-outline" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>{t('home.lowStock')}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Manage', { screen: 'InventoryMain' })}
                activeOpacity={0.85}
                style={styles.warningCountBtn}
              >
                <Text style={styles.warningCount}>{stats.lowStockProducts.length} {t('home.productUnitShort')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView nestedScrollEnabled style={styles.innerListScroll} showsVerticalScrollIndicator={false}>
              {stats.lowStockProducts.length === 0 ? (
                <SectionEmptyState icon="cube-outline" text={t('home.empty.lowStock')} />
              ) : stats.lowStockProducts.map((p, i) => (
                <Fragment key={p.id}>
                  {i > 0 ? <DashedDivider spacious /> : null}
                  <View style={styles.lowStockRow}>
                    <Text style={styles.lowStockText}>
                      {t('home.stockLeft', {
                        name: p.name,
                        stock: `${formatStockQty(p.stock, dateLocale)}${p.unit ? ` ${p.unit}` : ''}`,
                      })}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Manage', { screen: 'InventoryStockForm', params: { stockId: p.id } })}
                    >
                      <Text style={styles.restockText}>{t('home.restock')}</Text>
                    </TouchableOpacity>
                  </View>
                </Fragment>
              ))}
            </ScrollView>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderLine}>
              <Text style={styles.sectionTitle}>{t('home.recentOrders')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Manage', { screen: 'OrdersList' })}>
                <Text style={styles.sectionAction}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView nestedScrollEnabled style={styles.innerListScroll} showsVerticalScrollIndicator={false}>
              {stats.recentOrders.length === 0 ? (
                <SectionEmptyState icon="receipt-outline" text={t('home.empty.recentOrders')} />
              ) : stats.recentOrders.map((o, i) => (
                <Fragment key={o.id}>
                  {i > 0 ? <DashedDivider spacious /> : null}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Manage', { screen: 'OrdersList' })}
                  >
                    <View style={styles.orderRow}>
                      <Text style={styles.orderCode}>{o.orderNumber}</Text>
                      <Text numberOfLines={1} style={styles.orderWho}>{o.customerName}</Text>
                      <Text style={styles.orderTime}>{o.createdAt}</Text>
                      <Text style={styles.orderAmount}>{shortMoney(o.total, dateLocale)}</Text>
                    </View>
                  </TouchableOpacity>
                </Fragment>
              ))}
            </ScrollView>
          </View>
          {error ? (
            <View style={styles.card}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <Modal transparent visible={showDatePicker} animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.calendarOverlay}>
          <Pressable style={styles.calendarBackdrop} onPress={() => setShowDatePicker(false)} />
          <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, dateMode === 'single' && styles.modeBtnActive]}
                onPress={() => {
                  setDateMode('single');
                  setPickingRangeEdge('start');
                }}
              >
                <Text style={[styles.modeText, dateMode === 'single' && styles.modeTextActive]}>Theo ngày</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, dateMode === 'range' && styles.modeBtnActive]}
                onPress={() => {
                  setDateMode('range');
                  setPickingRangeEdge('start');
                }}
              >
                <Text style={[styles.modeText, dateMode === 'range' && styles.modeTextActive]}>Khoảng ngày</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                {calendarMonth.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })}
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
                if (!dateCell) return <View key={`empty-${idx}`} style={styles.calendarCell} />;
                const today = new Date();
                const isFuture =
                  dateCell.getFullYear() > today.getFullYear() ||
                  (dateCell.getFullYear() === today.getFullYear() && dateCell.getMonth() > today.getMonth()) ||
                  (dateCell.getFullYear() === today.getFullYear() &&
                    dateCell.getMonth() === today.getMonth() &&
                    dateCell.getDate() > today.getDate());
                const dateKey = toYmd(dateCell);
                const startKey = toYmd(draftStartDate);
                const endKey = toYmd(draftEndDate);
                const selectedStart = dateKey === startKey;
                const selectedEnd = dateKey === endKey;
                const inRange = dateMode === 'range' && dateKey > startKey && dateKey < endKey;
                const active = dateMode === 'single' ? selectedStart : (selectedStart || selectedEnd);
                return (
                  <TouchableOpacity
                    key={dateKey}
                    style={[styles.calendarCell, isFuture && styles.calendarCellDisabled, inRange && styles.calendarCellInRange, active && styles.calendarCellActive]}
                    onPress={() => onPickDate(dateCell)}
                    disabled={isFuture}
                  >
                    <Text style={[styles.calendarCellText, { color: active ? '#fff' : (isFuture ? colors.textSecondary : colors.text), opacity: isFuture ? 0.45 : 1 }]}>{dateCell.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.rangeActions}>
              <TouchableOpacity
                style={styles.rangeActionBtn}
                onPress={() => {
                  const today = new Date();
                  setDraftStartDate(today);
                  setDraftEndDate(today);
                  setDateMode('single');
                }}
              >
                <Text style={styles.rangeActionText}>Hôm nay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rangeActionBtn, styles.rangeActionPrimary]}
                onPress={() => {
                  setSelectedStartDate(draftStartDate);
                  setSelectedEndDate(draftEndDate);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.rangeActionPrimaryText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
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
  updatingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#eef7ff',
    borderWidth: 1,
    borderColor: '#d8ecff',
  },
  updatingChipText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
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
    flexShrink: 1,
  },
  revenueDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
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
  kpiCardWrap: {
    width: '48.3%',
  },
  kpiCard: {
    width: '100%',
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
  goalNumbers: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  goalMetricsRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  goalSubNumbers: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  goalGroup: {
    marginTop: 8,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalRowTitle: {
    ...Typography.captionMd,
    color: Colors.text,
    fontWeight: '700',
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
  innerListScroll: {
    maxHeight: 280,
  },
  sectionEmptyWrap: {
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sectionEmptyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
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
    ...Typography.label,
    color: '#fff',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  warningCountBtn: {
    marginLeft: 'auto',
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
  errorText: {
    ...Typography.caption,
    color: Colors.accent,
  },
  calendarOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  calendarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  calendarCard: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  modeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    alignItems: 'center',
    paddingVertical: 8,
  },
  modeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  modeText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  modeTextActive: {
    color: Colors.primary,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    ...Typography.caption,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  calendarCellActive: {
    backgroundColor: Colors.primary,
  },
  calendarCellDisabled: {
    opacity: 0.55,
  },
  calendarCellInRange: {
    backgroundColor: Colors.primaryLight,
  },
  calendarCellText: {
    ...Typography.captionMd,
    fontWeight: '700',
  },
  rangeActions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  rangeActionBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rangeActionPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rangeActionText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  rangeActionPrimaryText: {
    ...Typography.captionMd,
    color: '#fff',
    fontWeight: '700',
  },
});
