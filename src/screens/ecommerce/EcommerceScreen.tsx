import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Image, ImageSourcePropType } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { Header } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';

type Platform = {
  key: string;
  name: string;
  shop?: string;
  connected: boolean;
  orders?: number;
  pending?: number;
  revenue?: number;
  rating?: number | null;
  color: string;
  logo: ImageSourcePropType;
};

const PLATFORMS: Platform[] = [
  { key: 'shopee', name: 'Shopee', shop: 'vmass.store', connected: true, orders: 42, pending: 3, revenue: 4200000, rating: 4.8, color: '#ee4d2d', logo: require('../../../assets/ecommerce/shopee.png') },
  { key: 'tiktok', name: 'TikTok Shop', shop: '@vmass', connected: true, orders: 27, pending: 5, revenue: 2800000, rating: 4.7, color: '#1a1a1a', logo: require('../../../assets/ecommerce/tiktok.png') },
  { key: 'lazada', name: 'Lazada', shop: 'VMASS Official', connected: true, orders: 18, pending: 0, revenue: 1900000, rating: 4.9, color: '#0f146d', logo: require('../../../assets/ecommerce/lazada.png') },
  { key: 'tiki', name: 'Tiki', connected: false, color: '#189eff', logo: require('../../../assets/ecommerce/tiki.png') },
  { key: 'sendo', name: 'Sendo', connected: false, color: '#d0021b', logo: require('../../../assets/ecommerce/sendo.png') },
  { key: 'facebook', name: 'Facebook Shop', shop: 'fb.com/vmass', connected: true, orders: 12, pending: 2, revenue: 890000, rating: null, color: '#1877f2', logo: require('../../../assets/ecommerce/facebook.png') },
];

const FILTERS = [
  { key: 'all', labelKey: 'messages.filter.all' },
  { key: 'connected', labelKey: 'ecommerce.filter.connected' },
  { key: 'disconnected', labelKey: 'ecommerce.filter.disconnected' },
  { key: 'pending', labelKey: 'ecommerce.filter.pending' },
];

const DASH_SEGMENTS = Array.from({ length: 24 }, (_, index) => index);

function formatMoney(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
  }
  return `${Math.round(value / 1000)}K`;
}

export function EcommerceScreen() {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const connectedPlatforms = useMemo(() => PLATFORMS.filter(platform => platform.connected), []);
  const totalOrders = connectedPlatforms.reduce((sum, platform) => sum + (platform.orders || 0), 0);
  const totalPending = connectedPlatforms.reduce((sum, platform) => sum + (platform.pending || 0), 0);
  const totalRevenue = connectedPlatforms.reduce((sum, platform) => sum + (platform.revenue || 0), 0);

  const filteredPlatforms = useMemo(() => {
    const query = search.trim().toLowerCase();

    return PLATFORMS.filter(platform => {
      const matchesSearch =
        query.length === 0 ||
        platform.name.toLowerCase().includes(query) ||
        platform.shop?.toLowerCase().includes(query);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'connected' && platform.connected) ||
        (filter === 'disconnected' && !platform.connected) ||
        (filter === 'pending' && (platform.pending || 0) > 0);

      return matchesSearch && matchesFilter;
    });
  }, [filter, search]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title={t('ecommerce.title')}
        subtitle={t('ecommerce.subtitle', { connected: connectedPlatforms.length, total: PLATFORMS.length })}
        onBack={() => navigation.goBack()}
        rightActions={
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="refresh-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={[styles.heroEyebrow, { color: 'rgba(255,255,255,0.9)' }]}>{t('ecommerce.heroTitle')}</Text>
              <Text style={[styles.heroLabel, { color: 'rgba(255,255,255,0.82)' }]}>{t('ecommerce.totalMarketplaceOrders')}</Text>
              <Text style={[styles.heroOrders, { color: '#fff' }]}>{totalOrders}</Text>
            </View>
            <View style={styles.pendingBlock}>
              <Text style={[styles.heroLabel, { color: 'rgba(255,255,255,0.82)' }]}>{t('ecommerce.needsProcessing')}</Text>
              <Text style={styles.heroPending}>{totalPending}</Text>
            </View>
          </View>

          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Text style={[styles.heroMetricLabel, { color: 'rgba(255,255,255,0.82)' }]}>{t('ecommerce.marketplaceRevenueToday')}</Text>
              <Text style={[styles.heroMetricValue, { color: '#fff' }]}>{formatMoney(totalRevenue)}</Text>
            </View>
            <View style={styles.heroMetric}>
              <Text style={[styles.heroMetricLabel, { color: 'rgba(255,255,255,0.82)' }]}>{t('ecommerce.inventorySync')}</Text>
              <View style={styles.syncStatusRow}>
                <View style={styles.syncDot} />
                <Text style={styles.syncStatusText}>{t('ecommerce.syncNormal')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.searchInputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder={t('ecommerce.searchPlaceholder')}
            placeholderTextColor={Colors.textSecondary}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {FILTERS.map(chip => {
            const active = filter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFilter(chip.key)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(chip.labelKey as TranslationKey)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('ecommerce.platforms')}</Text>
          <TouchableOpacity style={styles.sectionAction}>
            <Ionicons name="sync-outline" size={15} color={Colors.primary} />
            <Text style={styles.sectionActionText}>{t('ecommerce.syncAll')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.platformList}>
          {filteredPlatforms.map(platform => (
            <TouchableOpacity
              key={platform.key}
              activeOpacity={0.82}
              style={[styles.platformCard, { backgroundColor: colors.card, borderColor: colors.border }, !platform.connected && styles.platformCardDisabled]}
            >
              <View style={styles.platformHeader}>
                <View style={styles.platformAvatar}>
                  <Image source={platform.logo} style={styles.platformLogo} resizeMode="contain" />
                </View>

                <View style={styles.platformInfo}>
                  <Text style={[styles.platformName, { color: colors.text }]} numberOfLines={1}>{platform.name}</Text>
                  <Text style={[styles.platformShop, { color: colors.textSecondary }]} numberOfLines={1}>
                    {platform.connected ? platform.shop : t('manage.notConnected')}
                  </Text>
                </View>

                {platform.connected ? (
                  <View style={styles.connectedBadge}>
                    <View style={styles.connectedDot} />
                    <Text style={styles.connectedText}>{t('ecommerce.connectedShort')}</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.connectBtn}>
                    <Text style={styles.connectText}>{t('ecommerce.connect')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {platform.connected && (
                <>
                  <View style={styles.platformSeparator} pointerEvents="none">
                    {DASH_SEGMENTS.map(segment => (
                      <View key={segment} style={styles.platformSeparatorDash} />
                    ))}
                  </View>
                  <View style={styles.metricGrid}>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('ecommerce.orders')}</Text>
                      <Text style={[styles.metricValue, { color: colors.text }]}>{platform.orders}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('home.kpi.revenue')}</Text>
                      <Text style={[styles.metricValue, styles.metricValueAccent]}>
                        {formatMoney(platform.revenue || 0)}
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('ecommerce.pending')}</Text>
                      <Text style={[styles.metricValue, (platform.pending || 0) > 0 && styles.metricValueWarning]}>
                        {platform.pending}
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('ecommerce.rating')}</Text>
                      <Text style={[styles.metricValue, { color: colors.text }]}>{platform.rating ? `${platform.rating}` : '-'}</Text>
                    </View>
                  </View>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
  },
  heroCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    padding: 14,
    ...Shadow.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  heroEyebrow: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
  },
  heroLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.82)',
  },
  heroOrders: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'monospace',
  },
  pendingBlock: {
    alignItems: 'flex-end',
    paddingBottom: 2,
  },
  heroPending: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    color: '#ffd54a',
    fontFamily: 'monospace',
  },
  heroMetrics: {
    flexDirection: 'row',
    gap: 8,
  },
  heroMetric: {
    flex: 1,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  heroMetricLabel: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 3,
  },
  heroMetricValue: {
    ...Typography.bodyMd,
    color: '#fff',
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4adf6a',
  },
  syncStatusText: {
    ...Typography.bodySm,
    color: '#4adf6a',
    fontWeight: '800',
  },
  searchInputWrap: {
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginTop: Spacing.md,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  chip: {
    height: 30,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.bodyMd,
    color: Colors.text,
    fontWeight: '700',
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionActionText: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '700',
  },
  platformList: {
    gap: Spacing.sm,
  },
  platformCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  platformCardDisabled: {
    opacity: 0.72,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformSeparator: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 4,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  platformSeparatorDash: {
    flex: 1,
    minWidth: 6,
    height: 1,
    backgroundColor: '#cfcac0',
  },
  platformAvatar: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  platformLogo: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
  },
  platformInfo: {
    flex: 1,
    minWidth: 0,
  },
  platformName: {
    ...Typography.bodyMd,
    color: Colors.text,
    fontWeight: '700',
  },
  platformShop: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
    fontFamily: 'monospace',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: Spacing.sm,
  },
  connectedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  connectedText: {
    ...Typography.label,
    color: Colors.success,
  },
  connectBtn: {
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: Spacing.sm,
  },
  connectText: {
    ...Typography.captionMd,
    color: '#fff',
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  metricValue: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  metricValueAccent: {
    color: Colors.primary,
  },
  metricValueWarning: {
    color: Colors.warning,
  },
});
