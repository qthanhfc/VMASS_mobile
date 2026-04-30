import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, type TranslationKey } from '../../i18n';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { Card, SearchBar, SectionHeader } from '../../components';
import { ManageStackParamList } from '../../navigation';

type NavProp = NativeStackNavigationProp<ManageStackParamList, 'ManageMain'>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ManageSection {
  key: keyof ManageStackParamList;
  labelKey: TranslationKey;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  statKey: TranslationKey;
  color?: string;
}

interface Platform {
  key: string;
  label: string;
  logo: ImageSourcePropType;
  orders: number;
  pending: number;
  connected: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SECTIONS: ManageSection[] = [
  { key: 'OrdersList', labelKey: 'manage.section.orders', icon: 'receipt-outline', statKey: 'manage.section.ordersStat', color: Colors.primary },
  { key: 'ProductsList', labelKey: 'manage.section.products', icon: 'shirt-outline', statKey: 'manage.section.productsStat', color: '#7c3aed' },
  { key: 'CustomersList', labelKey: 'manage.section.customers', icon: 'people-outline', statKey: 'manage.section.customersStat', color: '#0891b2' },
  { key: 'InventoryMain', labelKey: 'manage.section.inventory', icon: 'cube-outline', statKey: 'manage.section.inventoryStat', color: Colors.warning },
  { key: 'SuppliersList', labelKey: 'manage.section.suppliers', icon: 'business-outline', statKey: 'manage.section.suppliersStat', color: '#16a34a' },
  { key: 'ReturnsList', labelKey: 'manage.section.returns', icon: 'return-down-back-outline', statKey: 'manage.section.returnsStat', color: Colors.danger },
  { key: 'PromotionsList', labelKey: 'manage.section.promotions', icon: 'pricetag-outline', statKey: 'manage.section.promotionsStat', color: Colors.accent },
  { key: 'StaffList', labelKey: 'manage.section.staff', icon: 'id-card-outline', statKey: 'manage.section.staffStat', color: '#db2777' },
  { key: 'BookkeepingMain', labelKey: 'manage.section.debtInvoice', icon: 'document-text-outline', statKey: 'manage.section.debtInvoiceStat', color: '#0891b2' },
  { key: 'BookkeepingMain', labelKey: 'manage.section.accounting', icon: 'calculator-outline', statKey: 'manage.section.accountingStat', color: Colors.success },
];

const PLATFORMS: Platform[] = [
  { key: 'shopee', label: 'Shopee', logo: require('../../../assets/ecommerce/shopee.png'), orders: 24, pending: 3, connected: true },
  { key: 'lazada', label: 'Lazada', logo: require('../../../assets/ecommerce/lazada.png'), orders: 8, pending: 1, connected: true },
  { key: 'tiktok', label: 'TikTok Shop', logo: require('../../../assets/ecommerce/tiktok.png'), orders: 15, pending: 4, connected: true },
  { key: 'tiki', label: 'Tiki', logo: require('../../../assets/ecommerce/tiki.png'), orders: 0, pending: 0, connected: false },
  { key: 'sendo', label: 'Sendo', logo: require('../../../assets/ecommerce/sendo.png'), orders: 0, pending: 0, connected: false },
  { key: 'facebook', label: 'Facebook Shop', logo: require('../../../assets/ecommerce/facebook.png'), orders: 5, pending: 0, connected: true },
];

const QUICK_ACTIONS = [
  { key: 'OrdersList' as keyof ManageStackParamList, labelKey: 'manage.quick.createOrder' as TranslationKey, icon: 'add-circle-outline' as const },
  { key: 'InventoryMain' as keyof ManageStackParamList, labelKey: 'manage.quick.importStock' as TranslationKey, icon: 'download-outline' as const },
  { key: 'PosScreen' as keyof ManageStackParamList, labelKey: 'manage.quick.posSale' as TranslationKey, icon: 'storefront-outline' as const },
  { key: 'BookkeepingMain' as keyof ManageStackParamList, labelKey: 'manage.quick.report' as TranslationKey, icon: 'bar-chart-outline' as const },
  { key: 'CustomersList' as keyof ManageStackParamList, labelKey: 'manage.quick.addCustomer' as TranslationKey, icon: 'person-add-outline' as const },
];

const BOOKKEEPING_STATS = [
  { labelKey: 'manage.stat.q4Revenue' as TranslationKey, value: '287.4M', color: Colors.success },
  { labelKey: 'manage.stat.taxDue' as TranslationKey, value: '14.3M', color: Colors.danger },
  { labelKey: 'manage.stat.dueDate' as TranslationKey, value: '31/01', color: Colors.warning },
];

const BOOKKEEPING_LINK_KEYS: TranslationKey[] = [
  'manage.link.q4Declaration',
  'manage.link.vatInvoice',
  'manage.link.incomeExpense',
  'manage.link.report',
];

const RECENT_PRODUCTS = [
  { id: 1, name: 'Áo thun basic trắng', sku: 'AT-001', price: 120000, stock: 45 },
  { id: 2, name: 'Quần jean slim fit', sku: 'QJ-012', price: 220000, stock: 18 },
  { id: 3, name: 'Giày sneaker trắng', sku: 'GS-003', price: 420000, stock: 8 },
  { id: 4, name: 'Túi tote canvas', sku: 'TT-007', price: 85000, stock: 3 },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function money(n: number, dateLocale: string, currency: string) {
  return `${n.toLocaleString(dateLocale)} ${currency}`;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function ManageScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const navigation = useNavigation<NavProp>();
  const [search, setSearch] = useState('');
  const connectedPlatforms = PLATFORMS.filter(p => p.connected);
  const totalOrdersToday = connectedPlatforms.reduce((sum, p) => sum + p.orders, 0);
  const totalPendingOrders = connectedPlatforms.reduce((sum, p) => sum + p.pending, 0);

  function navigate(key: keyof ManageStackParamList) {
    navigation.navigate(key as any);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('manage.title')}</Text>
        {/* <TouchableOpacity style={styles.headerIcon} onPress={() => navigate('QrScan')}>
          <Ionicons name="qr-code-outline" size={22} color={Colors.text} />
        </TouchableOpacity> */}
      </View>

      {/* ── Search ── */}
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={t('manage.searchPlaceholder')}
        onQrPress={() => navigate('QrScan')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Quick Actions ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsRow}
        >
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.key}
              style={[styles.quickChip, { backgroundColor: colors.primaryLight }]}
              onPress={() => navigate(action.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={action.icon} size={16} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.quickChipLabel, { color: colors.primary }]}>{t(action.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Bookkeeping Card ── */}
        <View style={styles.px}>
          <TouchableOpacity onPress={() => navigate('BookkeepingMain')} activeOpacity={0.85}>
            <Card style={styles.bookkeepingCard} padding={Spacing.lg}>
              <View style={styles.bookkeepingHeader}>
                <View style={styles.bookkeepingTitleRow}>
                  <Ionicons name="calculator" size={20} color="#fff" />
                  <Text style={[styles.bookkeepingTitle, { color: '#fff' }]}>{t('manage.bookkeepingTitle')}</Text>
                </View>
                <View style={styles.taxPill}>
                  <Text style={[styles.taxPillText, { color: '#fff' }]}>{t('manage.taxDeclaration')}</Text>
                </View>
              </View>

              <View style={styles.bookkeepingStats}>
                {BOOKKEEPING_STATS.map(s => (
                  <View key={s.labelKey} style={styles.bookkeepingStat}>
                    <Text style={[styles.bookkeepingStatValue, { color: '#fff' }]}>{s.value}</Text>
                    <Text style={[styles.bookkeepingStatLabel, { color: 'rgba(255,255,255,0.78)' }]}>{t(s.labelKey)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.bookkeepingLinks}>
                {BOOKKEEPING_LINK_KEYS.map(l => (
                  <View key={l} style={styles.bookkeepingLinkChip}>
                    <Text style={[styles.bookkeepingLinkText, { color: '#fff' }]}>{t(l)}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* ── E-commerce Platforms ── */}
        <View style={styles.px}>
          <Card padding={Spacing.md}>
            <View style={styles.platformSectionHeaderWrap}>
              <SectionHeader title={t('manage.ecommercePlatforms')}/>
            </View>
            <View style={styles.platformGrid}>
              {PLATFORMS.map(p => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.platformCard, { backgroundColor: colors.background, borderColor: colors.border }, !p.connected && styles.platformCardDisabled]}
                  onPress={() => navigate('EcommerceMain')}
                  activeOpacity={0.7}
                >
                  <View style={styles.platformTop}>
                    <Image source={p.logo} style={styles.platformLogo} resizeMode="contain" />
                    <Text style={[styles.platformStateText, p.connected ? styles.stateOn : styles.stateOff]}>
                      {p.connected ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                  <Text style={styles.platformName}>{p.label}</Text>
                  {p.connected ? (
                    <View style={styles.platformMetaRow}>
                      <Text style={styles.platformOrders}>{t('manage.orderCount', { count: p.orders })}</Text>
                      {p.pending > 0 && (
                        <>
                          <Ionicons
                            name="ellipse"
                            size={5}
                            color={Colors.textSecondary}
                            style={styles.platformMetaDot}
                          />
                          <Text style={styles.platformPendingOrders}>{t('manage.pendingCount', { count: p.pending })}</Text>
                        </>
                      )}
                    </View>
                  ) : (
                    <Text style={[styles.platformOrders, styles.platformOrdersStandalone]}>{t('manage.notConnected')}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.platformSummary}>
              <View style={styles.platformSummaryDivider}>
                {Array.from({ length: 36 }).map((_, i) => (
                  <View key={`dash-${i}`} style={styles.platformSummaryDash} />
                ))}
              </View>
              <View style={styles.platformSummaryLine}>
                <Text style={styles.platformSummaryLabel}>{t('manage.totalOrdersToday')}</Text>
                <View style={styles.platformSummaryMetrics}>
                  <Text style={styles.platformSummaryTotal}>{t('manage.orderCount', { count: totalOrdersToday })}</Text>
                  {/* <Text style={styles.platformSummaryDot}>.</Text> */}
                  <Ionicons
                    name="ellipse"
                    size={5}
                    color={Colors.textSecondary}
                    style={styles.platformMetaDot}
                  />
                  <Text style={styles.platformSummaryPendingText}>{t('manage.pendingCount', { count: totalPendingOrders })}</Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* ── Management Sections ── */}
        <SectionHeader title={t('manage.title')} />
        <View style={styles.px}>
          <Card padding={0}>
            {SECTIONS.map((s, i) => (
              <TouchableOpacity
                key={`${s.key}-${i}`}
                style={[
                  styles.sectionRow,
                  i < SECTIONS.length - 1 && styles.rowBorder,
                ]}
                onPress={() => navigate(s.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.sectionRowIconWrap, { backgroundColor: (s.color || Colors.primary) + '18' }]}>
                  <Ionicons name={s.icon} size={20} color={s.color || Colors.primary} />
                </View>
                <View style={styles.sectionRowContent}>
                  <Text style={styles.sectionRowLabel}>{t(s.labelKey)}</Text>
                  <Text style={styles.sectionRowStat}>{t(s.statKey)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* ── Recent Products ── */}
        <SectionHeader title={t('manage.recentProducts')} action={t('manage.viewAll')} onAction={() => navigate('ProductsList')} />
        <View style={styles.px}>
          <Card padding={0} style={styles.tableCard}>
            {RECENT_PRODUCTS.slice(0, 3).map((p, i) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.productRow,
                  i < Math.min(RECENT_PRODUCTS.length, 3) - 1 && styles.rowBorder,
                ]}
                onPress={() => navigation.navigate('ProductEdit', { id: p.id })}
                activeOpacity={0.7}
              >
                <View style={styles.productThumb}>
                  <Ionicons name="shirt-outline" size={20} color={Colors.textSecondary} />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.productSku}>{p.sku}</Text>
                </View>
                <View style={styles.productRight}>
                  <Text style={styles.productPrice}>{money(p.price, dateLocale, t('home.currency'))}</Text>
                  <Text style={[styles.productStock, p.stock <= 5 && { color: Colors.danger }]}>
                    {t('manage.stock', { count: p.stock })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  scroll: { flex: 1 },
  scrollContent: { gap: Spacing.sm },
  px: { paddingHorizontal: Spacing.lg },
  // Quick actions
  quickActionsRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  quickChipLabel: {
    ...Typography.captionMd,
    color: Colors.primary,
  },
  // Bookkeeping card
  bookkeepingCard: {
    backgroundColor: Colors.primary,
    gap: Spacing.md,
  },
  bookkeepingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookkeepingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bookkeepingTitle: {
    ...Typography.h4,
    color: '#fff',
  },
  taxPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  taxPillText: {
    ...Typography.label,
    color: '#fff',
    fontSize: 10,
  },
  bookkeepingStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  bookkeepingStat: {
    flex: 1,
  },
  bookkeepingStatValue: {
    ...Typography.h4,
    color: '#fff',
  },
  bookkeepingStatLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  bookkeepingLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  bookkeepingLinkChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  bookkeepingLinkText: {
    ...Typography.captionMd,
    color: '#fff',
  },
  // Platforms
  platformSectionHeaderWrap: {
    marginHorizontal: -Spacing.lg,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.sm,
  },
  platformCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformCardDisabled: {
    opacity: 0.55,
  },
  platformTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  platformLogo: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
  },
  platformStateText: {
    ...Typography.captionMd,
    fontWeight: '700',
  },
  stateOn: {
    color: Colors.success,
  },
  stateOff: {
    color: Colors.textSecondary,
  },
  platformName: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  platformOrders: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  platformPendingOrders: {
    ...Typography.caption,
    color: Colors.warning,
  },
  platformOrdersStandalone: {
    marginTop: 2,
  },
  platformMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  platformMetaDot: {
    marginHorizontal: 6,
    alignSelf: 'center',
  },
  platformSummary: {
    marginTop: Spacing.md,
  },
  platformSummaryDivider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  platformSummaryDash: {
    width: 6,
    height: 1.5,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  platformSummaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformSummaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  platformSummaryMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformSummaryTotal: {
    ...Typography.h4,
    color: Colors.text,
  },
  platformSummaryDot: {
    ...Typography.bodyMd,
    color: Colors.textSecondary,
    marginHorizontal: 6,
  },
  platformSummaryPendingText: {
    ...Typography.bodyMd,
    color: Colors.warning,
  },
  // Management sections list
  sectionRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  sectionRowIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRowContent: {
    flex: 1,
  },
  sectionRowLabel: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  sectionRowStat: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Table
  tableCard: {
    overflow: 'hidden',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  productThumb: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    gap: 3,
  },
  productName: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  productSku: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  productRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  productPrice: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  productStock: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
