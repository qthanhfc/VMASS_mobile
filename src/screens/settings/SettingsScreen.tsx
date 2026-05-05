import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Image, ImageSourcePropType, Alert, ActivityIndicator, Linking, Platform } from 'react-native';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';
import { languageOptions, useLanguage, type TranslationKey } from '../../i18n';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import {
  getCurrentUserLicense,
  getCurrentUserProfile,
  PASSWORD_LAST_CHANGED_AT_KEY,
  resolvePublicImageUrl,
  signOut,
  type UserLicense,
  type UserProfile,
} from '../../services';
import type { SettingsStackParamList } from '../../navigation';
import {
  Header,
  ListItem,
  SectionHeader,
} from '../../components';

const getInitials = (name?: string | null) => {
  const parts = (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'VM';

  return parts
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const getProfileText = (value?: string | null, fallback = '') => {
  const trimmed = (value || '').trim();
  return trimmed || fallback;
};

const PACKAGE_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'PRO',
  pro_auto: 'PRO Auto',
  enterprise: 'Enterprise',
};

const formatDate = (value: string | null | undefined, dateLocale: string) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';

  const [datePart] = trimmed.split(' ');
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(dateLocale);
    }
  }

  return trimmed;
};

const getLicenseSummary = (
  license: UserLicense | null,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
  dateLocale: string
) => {
  if (!license?.purchased_package) return t('settings.licenseMissing');

  const packageKey = license.purchased_package.trim().toLowerCase();
  const packageName = PACKAGE_LABELS[packageKey] || license.purchased_package;

  if (license.pending) {
    return t('settings.licensePending', { packageName });
  }

  if (license.upgraded && packageKey === 'enterprise') {
    return t('settings.licenseActive', { packageName });
  }

  if (!license.expired_date) {
    return t('settings.licensePackageOnly', { packageName });
  }

  const expiredAt = new Date(`${license.expired_date}T${license.expired_time || '23:59:59'}`);
  if (Number.isNaN(expiredAt.getTime())) {
    return t('settings.licenseExpiresOn', { packageName, date: formatDate(license.expired_date, dateLocale) });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiredDay = new Date(expiredAt);
  expiredDay.setHours(0, 0, 0, 0);
  const remainingDays = Math.ceil((expiredDay.getTime() - today.getTime()) / 86400000);

  if (license.isExpired || remainingDays < 0) {
    return t('settings.licenseExpiredOn', { packageName, date: formatDate(license.expired_date, dateLocale) });
  }

  if (remainingDays === 0) {
    return t('settings.licenseExpiresToday', { packageName });
  }

  return t('settings.licenseRemainingDays', { packageName, days: remainingDays });
};

const getUpgradeActionText = (
  license: UserLicense | null,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
) => {
  const purchasedPackage = (license?.purchased_package || 'free').trim().toLowerCase();
  return purchasedPackage.includes('free') ? t('settings.upgradeAction') : t('settings.renewAction');
};

const SUPPORT_PHONE_DISPLAY = '0708.245.246';
const SUPPORT_PHONE_LINK = '0708245246';
const SUPPORT_EMAIL = 'hotro@vmass.vn';

const getStoreReviewUrl = (storeUrl: string) => {
  const separator = storeUrl.includes('?') ? '&' : '?';

  if (Platform.OS === 'ios') {
    return `${storeUrl}${separator}action=write-review`;
  }

  if (Platform.OS === 'android') {
    return `${storeUrl}${separator}showAllReviews=true`;
  }

  return storeUrl;
};

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { colors, isDark, setMode } = useThemeMode();
  const { locale, dateLocale, setLocale, t } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [license, setLicense] = useState<UserLicense | null>(null);
  const [lastPasswordChangedText, setLastPasswordChangedText] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      const loadLastChanged = async () => {
        const raw = await AsyncStorage.getItem(PASSWORD_LAST_CHANGED_AT_KEY);
        if (!isMounted || !raw) {
          if (isMounted) setLastPasswordChangedText(null);
          return;
        }

        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) {
          setLastPasswordChangedText(null);
          return;
        }

        setLastPasswordChangedText(
          t('settings.lastPasswordChanged', { date: parsed.toLocaleDateString(dateLocale) })
        );
      };

      const loadProfile = async () => {
        try {
          setIsProfileLoading(true);
          const [profileResult, licenseResult] = await Promise.allSettled([
            getCurrentUserProfile(),
            getCurrentUserLicense(),
          ]);
          if (isMounted) {
            setProfile(profileResult.status === 'fulfilled' ? profileResult.value : null);
            setLicense(licenseResult.status === 'fulfilled' ? licenseResult.value : null);
          }
        } catch {
          if (isMounted) {
            setProfile(null);
            setLicense(null);
          }
        } finally {
          if (isMounted) setIsProfileLoading(false);
        }
      };

      loadLastChanged();
      loadProfile();

      return () => {
        isMounted = false;
      };
    }, [dateLocale, t])
  );

  const iconBox = (name: keyof typeof Ionicons.glyphMap, bg: string) => (
    <View style={[styles.iconBox, { backgroundColor: bg }]}>
      <Ionicons name={name} size={16} color="#fff" />
    </View>
  );

  const brandLogo = (
    source: ImageSourcePropType | null,
    fallbackText: string,
    fallbackBg = Colors.primaryLight,
    fallbackColor = Colors.primary
  ) => (
    <View style={styles.brandLogoBox}>
      {source ? (
        <Image source={source} style={styles.brandLogoImage} resizeMode="contain" />
      ) : (
        <View style={[styles.brandFallback, { backgroundColor: fallbackBg }]}>
          <Text style={[styles.brandFallbackText, { color: fallbackColor }]} numberOfLines={1}>
            {fallbackText}
          </Text>
        </View>
      )}
    </View>
  );

  const rightSummary = (text?: string | null, color = colors.textSecondary) => (
    <View style={styles.summaryRight}>
      {text ? (
        <Text style={[styles.summaryRightText, { color, opacity: 0.72 }]} numberOfLines={1}>
          {text}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </View>
  );

  const executeLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();

      const rootNavigation =
        navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;

      rootNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' as never }],
        })
      );
    } catch {
      Alert.alert(t('settings.logoutErrorTitle'), t('settings.logoutErrorMessage'));
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (isLoggingOut) return;

    Alert.alert(t('settings.logoutConfirmTitle'), t('settings.logoutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive', onPress: executeLogout },
    ]);
  };

  const handleSupportContact = () => {
    Alert.alert(
      t('settings.supportTitle'),
      t('settings.supportMessage', { phone: SUPPORT_PHONE_DISPLAY, email: SUPPORT_EMAIL }),
      [
        { text: t('common.close'), style: 'cancel' },
        {
          text: t('settings.callHotline'),
          onPress: () => Linking.openURL(`tel:${SUPPORT_PHONE_LINK}`),
        },
        {
          text: t('settings.sendEmail'),
          onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`),
        },
      ]
    );
  };

  const handleRateApp = async () => {
    try {
      const storeUrl = StoreReview.storeUrl();

      if (storeUrl) {
        await Linking.openURL(getStoreReviewUrl(storeUrl));
        return;
      }

      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
        return;
      }

      Alert.alert(t('settings.rateUnavailableTitle'), t('settings.rateUnavailableMessage'));
    } catch {
      Alert.alert(t('settings.rateErrorTitle'), t('settings.rateErrorMessage'));
    }
  };

  const openPrintSettings = () => {
    navigation.push('PrintSettings');
  };

  const profileName = getProfileText(profile?.fullname, t('settings.vmassUser'));
  const profileEmail = getProfileText(profile?.email, t('common.updatedNotAvailable'));
  const profileCompanyName = getProfileText(profile?.companyName, t('settings.accountInfo'));
  const licenseSummary = getLicenseSummary(license, t, dateLocale);
  const upgradeActionText = getUpgradeActionText(license, t);
  const profileAvatarUrl = resolvePublicImageUrl(profile?.image);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header title={t('settings.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <TouchableOpacity
          style={[styles.profileCard, Shadow.md, { backgroundColor: colors.card }]}
          activeOpacity={0.78}
          onPress={() => navigation.navigate('ProfileSettings')}
        >
          <View style={[styles.profileAvatar, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            {profileAvatarUrl ? (
              <Image source={{ uri: profileAvatarUrl }} style={styles.profileAvatarImage} />
            ) : (
              <Text style={[styles.profileAvatarText, { color: colors.primary }]}>{getInitials(profileName)}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>{profileName}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>{profileEmail}</Text>
            <Text style={[styles.profileCompany, { color: colors.text }]} numberOfLines={1}>{profileCompanyName}</Text>
            <Text style={[styles.profilePlan, { color: colors.primary }]} numberOfLines={1}>{licenseSummary}</Text>
          </View>
          <View style={styles.profileChevronBtn}>
            {isProfileLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            )}
          </View>
        </TouchableOpacity>

        {/* Tài khoản */}
        <SectionHeader title={t('settings.account')} />
        <View style={[styles.group, { backgroundColor: colors.card }]}>
          <ListItem
            title={t('settings.upgradeAccount')}
            left={iconBox('rocket-outline', Colors.accent)}
            right={rightSummary(upgradeActionText, Colors.primary)}
            showChevron={false}
            onPress={() => navigation.navigate('UpgradeAccount')}
          />
          <ListItem
            title="Cửa hàng của tôi"
            left={iconBox('storefront-outline', Colors.primary)}
            right={rightSummary(profileCompanyName)}
            showChevron={false}
            onPress={() => navigation.navigate('ProfileSettings')}
          />
          <ListItem
            title={t('settings.changePassword')}
            left={iconBox('lock-closed-outline', '#7c3aed')}
            right={rightSummary(lastPasswordChangedText)}
            showChevron={false}
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <ListItem
            title={t('settings.permissions')}
            left={iconBox('shield-checkmark-outline', '#0891b2')}
            right={rightSummary(t('settings.rolesCount'))}
            showChevron={false}
            onPress={() => navigation.navigate('RoleSettings')}
          />
          <ListItem
            title={t('settings.staffAccounts')}
            left={iconBox('person-add-outline', Colors.success)}
            right={rightSummary(t('settings.staffAccountsSub'))}
            showChevron={false}
            onPress={() => navigation.navigate('StaffAccountSettings')}
          />
        </View>

        {/* Bán hàng & In */}
        <SectionHeader title={t('settings.salesPrint')} />
        <View style={[styles.group, { backgroundColor: colors.card }]}>
          <ListItem
            title={t('settings.posConfig')}
            left={iconBox('cash-outline', Colors.success)}
            right={rightSummary(t('settings.active'))}
            showChevron={false}
            onPress={() => navigation.navigate('PosSettings')}
          />
          <ListItem
            title={t('settings.invoiceTemplate')}
            left={iconBox('document-text-outline', Colors.warning)}
            right={rightSummary(t('settings.defaultTemplate'))}
            showChevron={false}
            onPress={openPrintSettings}
          />
          <ListItem
            title={t('settings.printerConnection')}
            left={iconBox('print-outline', Colors.primary)}
            right={rightSummary('Xprinter XP-80')}
            showChevron={false}
            onPress={() => {}}
          />
        </View>

        {/* Kết nối */}
        <SectionHeader title={t('settings.connections')} />
        <View style={[styles.group, { backgroundColor: colors.card }]}>
          <ListItem
            title="Shopee"
            left={brandLogo(require('../../../assets/ecommerce/shopee.png'), 'Shopee')}
            right={rightSummary(t('settings.notConnected'))}
            showChevron={false}
            onPress={() => {}}
          />
          <ListItem
            title="Lazada"
            left={brandLogo(require('../../../assets/ecommerce/lazada.png'), 'Lazada')}
            right={rightSummary(t('settings.notConnected'))}
            showChevron={false}
            onPress={() => {}}
          />
          <ListItem
            title="TikTok Shop"
            left={brandLogo(require('../../../assets/ecommerce/tiktok.png'), 'TikTok')}
            right={rightSummary(t('settings.notConnected'))}
            showChevron={false}
            onPress={() => {}}
          />
          <ListItem
            title="Tiki"
            left={brandLogo(require('../../../assets/ecommerce/tiki.png'), 'Tiki')}
            right={rightSummary(t('settings.notConnected'))}
            showChevron={false}
            onPress={() => {}}
          />
          <ListItem
            title="Facebook Shop"
            left={brandLogo(require('../../../assets/ecommerce/facebook.png'), 'Facebook')}
            right={rightSummary(t('settings.notConnected'))}
            showChevron={false}
            onPress={() => {}}
          />
          <ListItem
            title="Sendo"
            left={brandLogo(require('../../../assets/ecommerce/sendo.png'), 'Sendo')}
            right={rightSummary(t('settings.notConnected'))}
            showChevron={false}
            onPress={() => {}}
          />
          <ListItem
            title={t('settings.zaloConnection')}
            left={brandLogo(require('../../../assets/ecommerce/zalo.png'), 'Zalo')}
            right={rightSummary(t('settings.notConnected'))}
            showChevron={false}
            onPress={() => {}}
          />
        </View>

        {/* eInvoice */}
        <SectionHeader title="eInvoice" />
        <View style={[styles.group, { backgroundColor: colors.card }]}>
          <ListItem
            title="MISA eInvoice"
            left={brandLogo(require('../../../assets/ecommerce/misa.png'), 'MISA')}
            right={rightSummary(t('settings.notConnected'))}
            showChevron={false}
            onPress={() => {}}
          />
          <ListItem
            title="sePay eInvoice"
            left={brandLogo(require('../../../assets/ecommerce/sepay.png'), 'sePay')}
            right={rightSummary(t('settings.notConnected'))}
            showChevron={false}
            onPress={() => {}}
          />
          <ListItem
            title="VNPT eTax"
            left={brandLogo(require('../../../assets/ecommerce/vnpt.png'), 'VNPT')}
            right={rightSummary(t('settings.notConnected'))}
            showChevron={false}
            onPress={() => {}}
          />
        </View>

        {/* Giao diện */}
        <SectionHeader title={t('settings.interface')} />
        <View style={[styles.group, { backgroundColor: colors.card }]}>
          {/* Dark mode toggle */}
          <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
            <View style={styles.toggleLeft}>
              {iconBox('moon-outline', '#1a1a1a')}
              <View style={styles.toggleTextWrap}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>{t('settings.darkMode')}</Text>
                <Text style={[styles.toggleSub, { color: colors.textSecondary }]}>{t('settings.darkModeSub')}</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={(value) => setMode(value ? 'dark' : 'light')}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>
          {/* Language selector */}
          <View style={[styles.langRow, { borderBottomColor: colors.border }]}>
            <View style={styles.toggleLeft}>
              {iconBox('language-outline', Colors.primary)}
              <Text style={[styles.toggleLabel, { color: colors.text }]}>{t('settings.language')}</Text>
            </View>
            <View style={styles.langChips}>
              {languageOptions.map(l => (
                <TouchableOpacity
                  key={l.key}
                  onPress={() => setLocale(l.key)}
                  style={[
                    styles.langChip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    locale === l.key && styles.langChipActive,
                  ]}>
                  <Text style={[styles.langChipText, { color: colors.textSecondary }, locale === l.key && styles.langChipTextActive]}>
                    {l.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Khác */}
        <SectionHeader title={t('settings.other')} />
        <View style={[styles.group, { backgroundColor: colors.card }]}>
          <ListItem
            title={t('settings.docs')}
            left={iconBox('help-circle-outline', Colors.success)}
            right={rightSummary(t('settings.docsSub'))}
            showChevron={false}
            onPress={() => navigation.navigate('DocsWebView')}
          />
          <ListItem
            title={t('settings.feedback')}
            left={iconBox('bulb-outline', Colors.accent)}
            right={rightSummary(t('settings.feedbackSub'))}
            showChevron={false}
            onPress={() => navigation.navigate('Feedback')}
          />
          <ListItem
            title={t('settings.rateApp')}
            left={iconBox('star-outline', Colors.warning)}
            right={rightSummary(t('settings.rateAppSub'), Colors.warning)}
            showChevron={false}
            onPress={handleRateApp}
          />
          <ListItem
            title={t('settings.support')}
            left={iconBox('headset-outline', '#7c3aed')}
            right={rightSummary(t('settings.supportSub'))}
            showChevron={false}
            onPress={handleSupportContact}
          />
          <ListItem
            title={t('settings.versionTitle')}
            left={iconBox('information-circle-outline', Colors.textSecondary)}
            right={<Text style={[styles.versionText, { color: colors.textSecondary }]}>v1.0.0</Text>}
            showChevron={false}
            onPress={() => {}}
          />
        </View>

        <View style={[styles.logoutGroup, { backgroundColor: colors.card }]}>
          <ListItem
            title={t('settings.logout')}
            left={iconBox('log-out-outline', Colors.danger)}
            right={
              isLoggingOut ? (
                <ActivityIndicator size="small" color={Colors.danger} />
              ) : (
                <Text style={styles.dangerText}>{t('settings.logout')}</Text>
              )
            }
            showChevron={false}
            onPress={handleLogout}
          />
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: Spacing.lg,
    borderRadius: Radius.lg,
    padding: 14,
  },
  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileAvatarText: {
    ...Typography.h3,
    color: Colors.primary,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
  },
  profileEmail: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  profileCompany: {
    ...Typography.captionMd,
    color: Colors.text,
    marginTop: 3,
    fontWeight: '600',
  },
  profilePlan: {
    ...Typography.captionMd,
    color: Colors.primary,
    marginTop: 3,
    fontWeight: '700',
  },
  profileChevronBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
    marginBottom: Spacing.sm,
  },
  logoutGroup: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoImage: {
    width: '100%',
    height: '100%',
  },
  brandFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  brandFallbackText: {
    ...Typography.label,
    fontSize: 9,
    letterSpacing: 0,
  },
  dangerText: {
    ...Typography.bodyMd,
    color: Colors.danger,
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    maxWidth: 160,
  },
  summaryRightText: {
    ...Typography.captionMd,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleTextWrap: {},
  toggleLabel: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  toggleSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  langChips: {
    flexDirection: 'row',
    gap: 6,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  langChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  langChipText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  langChipTextActive: {
    color: '#fff',
  },
  versionText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  footer: {
    height: 32,
  },
});
