import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, type TranslationKey } from '../../i18n';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import { FormField, Header } from '../../components';
import type { SettingsStackParamList } from '../../navigation';
import {
  downgradeLicense,
  getCurrentUserLicense,
  getCurrentUserProfile,
  getDowngradePreview,
  getUpgradePreview,
  recordUpgradePromoUsage,
  requestLicenseUpgrade,
  sendEnterpriseContact,
  validateUpgradePromo,
  type DowngradePreview,
  type LicensePackage,
  type PromoData,
  type UpgradeDuration,
  type UpgradePreview,
  type UserLicense,
  type UserProfile,
} from '../../services';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

type Plan = {
  key: LicensePackage;
  title: string;
  price: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  featureKeys: TranslationKey[];
  popular?: boolean;
};

type DurationOption = {
  labelKey: TranslationKey;
  value: UpgradeDuration;
  prices: Partial<Record<LicensePackage, number>>;
};

const RANKS: Record<LicensePackage, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  pro_auto: 3,
  enterprise: 4,
};

const DURATIONS: DurationOption[] = [
  { labelKey: 'upgrade.duration.1m', value: '1m', prices: { basic: 99000, pro: 299000, pro_auto: 599000 } },
  { labelKey: 'upgrade.duration.6m', value: '6m', prices: { basic: 594000, pro: 1794000, pro_auto: 3594000 } },
  { labelKey: 'upgrade.duration.1y', value: '1y', prices: { basic: 1188000, pro: 3588000, pro_auto: 7188000 } },
  { labelKey: 'upgrade.duration.2y', value: '2y', prices: { basic: 2376000, pro: 7176000, pro_auto: 14376000 } },
  { labelKey: 'upgrade.duration.5y', value: '5y', prices: { basic: 5940000, pro: 17940000, pro_auto: 35940000 } },
];

const PLANS: Plan[] = [
  {
    key: 'free',
    title: 'Free',
    price: '0',
    sub: 'đ',
    icon: 'leaf-outline',
    color: Colors.textSecondary,
    featureKeys: ['upgrade.plan.free.f1', 'upgrade.plan.free.f2', 'upgrade.plan.free.f3'],
  },
  {
    key: 'basic',
    title: 'Basic',
    price: '99.000',
    sub: 'đ/tháng',
    icon: 'cash-outline',
    color: Colors.primary,
    featureKeys: ['upgrade.plan.basic.f1', 'upgrade.plan.basic.f2', 'upgrade.plan.basic.f3'],
  },
  {
    key: 'pro',
    title: 'PRO',
    price: '299.000',
    sub: 'đ/tháng',
    icon: 'diamond-outline',
    color: '#7c3aed',
    popular: true,
    featureKeys: ['upgrade.plan.pro.f1', 'upgrade.plan.pro.f2', 'upgrade.plan.pro.f3', 'upgrade.plan.pro.f4'],
  },
  {
    key: 'pro_auto',
    title: 'PRO Auto',
    price: '599.000',
    sub: 'đ/tháng',
    icon: 'sparkles-outline',
    color: Colors.danger,
    featureKeys: ['upgrade.plan.proAuto.f1', 'upgrade.plan.proAuto.f2', 'upgrade.plan.proAuto.f3', 'upgrade.plan.proAuto.f4'],
  },
  {
    key: 'enterprise',
    title: 'Enterprise',
    price: '',
    sub: '',
    icon: 'business-outline',
    color: Colors.text,
    featureKeys: ['upgrade.plan.enterprise.f1', 'upgrade.plan.enterprise.f2', 'upgrade.plan.enterprise.f3', 'upgrade.plan.enterprise.f4'],
  },
];

const PACKAGE_LABELS: Record<LicensePackage, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'PRO',
  pro_auto: 'PRO Auto',
  enterprise: 'Enterprise',
};

const money = (value: number | string | null | undefined, currency: string, dateLocale: string) => {
  const amount = typeof value === 'string' ? Number(value) : value || 0;
  return `${Math.max(0, amount).toLocaleString(dateLocale)} ${currency}`;
};

const normalizePackage = (value?: string | null): LicensePackage => {
  const key = (value || 'free').toLowerCase();
  if (key === 'platinum') return 'pro';
  return key in RANKS ? (key as LicensePackage) : 'free';
};

const formatDate = (value: string | null | undefined, fallback: string, dateLocale: string) => {
  if (!value) return fallback;
  const parts = value.split('-');
  if (parts.length === 3) {
    const parsed = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleDateString(dateLocale);
  }
  return value;
};

const getQrPayWithCashAndInfo = (amount: number, companyUUID?: string | null) =>
  `https://qrcode.io.vn/api/generate/970422/0935777736/${amount}/VMASS${companyUUID || ''}`;

export function UpgradeAccountScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useThemeMode();
  const { dateLocale, t } = useLanguage();
  const [license, setLicense] = useState<UserLicense | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<UpgradeDuration>('1m');
  const [preview, setPreview] = useState<UpgradePreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoData, setPromoData] = useState<PromoData | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isPromoLoading, setIsPromoLoading] = useState(false);
  const [downgradePreview, setDowngradePreview] = useState<DowngradePreview | null>(null);
  const [downgradeTarget, setDowngradeTarget] = useState<LicensePackage | null>(null);
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const [nextLicense, nextProfile] = await Promise.all([
        getCurrentUserLicense(),
        getCurrentUserProfile(),
      ]);
      setLicense(nextLicense);
      setProfile(nextProfile);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('upgrade.loadErrorFallback');
      Alert.alert(t('profile.loadErrorTitle'), message);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const currentPackage = license && !license.isExpired ? normalizePackage(license.purchased_package) : 'free';
  const selectedDurationOption = DURATIONS.find((item) => item.value === selectedDuration) || DURATIONS[0];
  const basePrice = selectedPlan ? selectedDurationOption.prices[selectedPlan.key] || 0 : 0;
  const previewPrice = preview?.duration === selectedDuration ? preview.finalPrice : undefined;
  const priceBeforePromo = previewPrice ?? basePrice;
  const promoDiscount = promoData?.discount || 0;
  const finalPrice = Math.max(0, Number(priceBeforePromo || 0) - promoDiscount);
  const isInstant = finalPrice <= 0;

  const currentSummary = useMemo(() => {
    const label = PACKAGE_LABELS[currentPackage];
    if (license?.pending) return t('upgrade.summaryPending', { label });
    if (license?.upgraded && currentPackage === 'enterprise') return t('upgrade.summaryLifetime', { label });
    if (license?.isExpired) {
      return t('upgrade.summaryExpired', {
        label,
        date: formatDate(license.expired_date, t('profile.notUpdated'), dateLocale),
      });
    }
    return t('upgrade.summaryExpires', {
      label,
      date: formatDate(license?.expired_date, t('profile.notUpdated'), dateLocale),
    });
  }, [currentPackage, dateLocale, license, t]);

  const fetchPreview = async (plan: Plan, duration: UpgradeDuration) => {
    if (plan.key === 'free' || plan.key === 'enterprise') return;
    try {
      setIsPreviewing(true);
      const nextPreview = await getUpgradePreview(plan.key, duration);
      setPreview(nextPreview);
    } catch {
      setPreview(null);
    } finally {
      setIsPreviewing(false);
    }
  };

  const openPlan = async (plan: Plan) => {
    if (plan.key === 'enterprise') {
      setEnterpriseOpen(true);
      return;
    }

    const itemRank = RANKS[plan.key];
    const currentRank = RANKS[currentPackage];
    if (itemRank < currentRank) {
      try {
        const nextPreview = await getDowngradePreview(plan.key);
        setDowngradePreview(nextPreview);
        setDowngradeTarget(plan.key);
      } catch (error) {
        const message = error instanceof Error ? error.message : t('upgrade.downgradePreviewError');
        Alert.alert(t('profile.loadErrorTitle'), message);
      }
      return;
    }

    if (plan.key === 'free') return;

    setSelectedPlan(plan);
    setSelectedDuration('1m');
    setPromoCode('');
    setPromoData(null);
    setPromoError('');
    await fetchPreview(plan, '1m');
  };

  const changeDuration = async (duration: UpgradeDuration) => {
    setSelectedDuration(duration);
    setPromoCode('');
    setPromoData(null);
    setPromoError('');
    if (selectedPlan) await fetchPreview(selectedPlan, duration);
  };

  const applyPromo = async () => {
    if (!selectedPlan || !promoCode.trim()) return;
    try {
      setIsPromoLoading(true);
      setPromoError('');
      const nextPromo = await validateUpgradePromo({
        code: promoCode.trim().toUpperCase(),
        targetPackage: selectedPlan.key,
        price: Number(priceBeforePromo || 0),
      });
      setPromoData(nextPromo);
    } catch (error) {
      setPromoData(null);
      setPromoError(error instanceof Error ? error.message : t('upgrade.invalidPromo'));
    } finally {
      setIsPromoLoading(false);
    }
  };

  const submitUpgrade = async () => {
    if (!selectedPlan) return;
    try {
      setIsSubmitting(true);
      const response = await requestLicenseUpgrade({
        targetPackage: selectedPlan.key,
        duration: selectedDuration,
        price: finalPrice,
        promoCode: promoData?.code,
      });
      if (promoData?.id) recordUpgradePromoUsage(promoData.id).catch(() => {});
      setSelectedPlan(null);
      setPreview(null);
      setPromoData(null);
      setPromoCode('');
      await load();
      Alert.alert(t('profile.successTitle'), response.responseText || t('upgrade.upgradeSuccessFallback'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('upgrade.upgradeErrorFallback');
      Alert.alert(t('upgrade.upgradeErrorTitle'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDowngrade = async () => {
    if (!downgradeTarget) return;
    try {
      setIsSubmitting(true);
      const response = await downgradeLicense(downgradeTarget);
      setDowngradeTarget(null);
      setDowngradePreview(null);
      await load();
      Alert.alert(t('profile.successTitle'), response.responseText || t('upgrade.downgradeSuccessFallback'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('upgrade.downgradeErrorFallback');
      Alert.alert(t('upgrade.downgradeErrorTitle'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitEnterpriseContact = async () => {
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      Alert.alert(t('profile.missingTitle'), t('upgrade.contactMissingMessage'));
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await sendEnterpriseContact({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        message: contactForm.message.trim(),
      });
      setEnterpriseOpen(false);
      setContactForm({ name: '', email: '', phone: '', message: '' });
      Alert.alert(t('profile.successTitle'), response.responseText || t('upgrade.contactSuccessFallback'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('upgrade.contactErrorFallback');
      Alert.alert(t('upgrade.contactErrorTitle'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header title={t('upgrade.title')} subtitle={t('upgrade.subtitle')} onBack={() => navigation.goBack()} />
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('upgrade.loading')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.currentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.currentIcon}>
              <Ionicons name="ribbon-outline" size={22} color={Colors.primary} />
            </View>
            <View style={styles.currentBody}>
              <Text style={styles.currentTitle}>{t('upgrade.currentAccount')}</Text>
              <Text style={styles.currentText}>{currentSummary}</Text>
            </View>
          </View>

          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPackage;
            const isLower = RANKS[plan.key] < RANKS[currentPackage];
            const actionText =
              plan.key === 'free'
                ? isCurrent
                  ? t('upgrade.currentAction')
                  : ''
                : plan.key === 'enterprise'
                  ? t('upgrade.contactAction')
                  : isCurrent
                    ? t('upgrade.renewAction')
                    : isLower
                      ? t('upgrade.downgradeAction')
                      : t('upgrade.upgradeAction');

            return (
              <View key={plan.key} style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }, plan.popular && styles.planPopular]}>
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>{t('upgrade.popular')}</Text>
                  </View>
                )}
                <View style={styles.planHeader}>
                  <View style={[styles.planIcon, { backgroundColor: `${plan.color}18` }]}>
                    <Ionicons name={plan.icon} size={22} color={plan.color} />
                  </View>
                  <View style={styles.planTitleWrap}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <Text style={styles.planPrice}>
                      {plan.key === 'enterprise' ? t('upgrade.contactPrice') : plan.price}
                      <Text style={styles.planSub}> {plan.key === 'free' ? t('upgrade.currency') : plan.key === 'enterprise' ? '' : t('upgrade.perMonth')}</Text>
                    </Text>
                  </View>
                  {actionText ? (
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        isCurrent && styles.actionBtnCurrent,
                        isLower && styles.actionBtnOutline,
                      ]}
                      disabled={plan.key === 'free' && isCurrent}
                      onPress={() => openPlan(plan)}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          (isCurrent || isLower) && styles.actionTextOutline,
                        ]}
                      >
                        {actionText}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.featureList}>
                  {plan.featureKeys.map((featureKey) => (
                    <View key={featureKey} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
                      <Text style={styles.featureText}>{t(featureKey)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={!!selectedPlan} animationType="slide" transparent onRequestClose={() => setSelectedPlan(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('upgrade.paymentTitle', { plan: selectedPlan?.title || '' })}</Text>
              <TouchableOpacity onPress={() => setSelectedPlan(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>{t('upgrade.durationLabel')}</Text>
              <View style={styles.durationWrap}>
                {DURATIONS.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.durationChip,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      selectedDuration === item.value && styles.durationChipActive,
                    ]}
                    onPress={() => changeDuration(item.value)}
                  >
                    <Text style={[styles.durationText, selectedDuration === item.value && styles.durationTextActive]}>
                      {t(item.labelKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.priceBox, { backgroundColor: colors.background }]}>
                {isPreviewing ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <PriceRow label={t('upgrade.originalPrice')} value={money(preview?.originalPrice ?? basePrice, t('upgrade.currency'), dateLocale)} />
                    {(preview?.remainingValue || 0) > 0 && <PriceRow label={t('upgrade.remainingValue')} value={`- ${money(preview?.remainingValue, t('upgrade.currency'), dateLocale)}`} success />}
                    {(preview?.creditBalance || 0) > 0 && <PriceRow label={t('upgrade.wallet')} value={`- ${money(preview?.creditBalance, t('upgrade.currency'), dateLocale)}`} success />}
                    {promoDiscount > 0 && <PriceRow label={t('upgrade.promo')} value={`- ${money(promoDiscount, t('upgrade.currency'), dateLocale)}`} success />}
                    <View style={styles.priceDivider} />
                    <PriceRow label={t('upgrade.totalDue')} value={money(finalPrice, t('upgrade.currency'), dateLocale)} primary />
                  </>
                )}
              </View>

              {!isInstant && (
                <View style={styles.paymentBox}>
                  <Image source={{ uri: getQrPayWithCashAndInfo(finalPrice, profile?.companyUUID) }} style={styles.qrImage} />
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentLine}>{t('upgrade.paymentOwner')}: Phạm Quang Thành</Text>
                    <Text style={styles.paymentLine}>{t('upgrade.paymentAccount')}: 0935777736</Text>
                    <Text style={styles.paymentLine}>{t('upgrade.paymentBank')}: MBBank</Text>
                    <Text style={styles.paymentLine}>{t('upgrade.paymentContent')}: VMASS{profile?.companyUUID || ''}</Text>
                  </View>
                </View>
              )}

              <View style={styles.promoBox}>
                <Text style={styles.fieldLabel}>{t('upgrade.promoCode')}</Text>
                {promoData ? (
                  <View style={styles.promoApplied}>
                    <Text style={styles.promoAppliedText}>{promoData.code} · -{money(promoData.discount, t('upgrade.currency'), dateLocale)}</Text>
                    <TouchableOpacity onPress={() => { setPromoData(null); setPromoCode(''); }}>
                      <Text style={styles.removePromo}>{t('upgrade.removeCode')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.promoInputRow}>
                    <TextInput
                      value={promoCode}
                      onChangeText={(value) => { setPromoCode(value.toUpperCase()); setPromoError(''); }}
                      placeholder={t('upgrade.enterCode')}
                      placeholderTextColor={Colors.textSecondary}
                      style={[styles.promoInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity style={styles.applyPromoBtn} onPress={applyPromo} disabled={isPromoLoading || !promoCode.trim()}>
                      {isPromoLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.applyPromoText}>{t('upgrade.apply')}</Text>}
                    </TouchableOpacity>
                  </View>
                )}
                {promoError ? <Text style={styles.promoError}>{promoError}</Text> : null}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={submitUpgrade} disabled={isSubmitting || isPreviewing}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitText}>{isInstant ? t('upgrade.activateNow') : t('upgrade.requestSubmit')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!downgradeTarget} animationType="fade" transparent onRequestClose={() => setDowngradeTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.confirmCard, { backgroundColor: colors.card }]}>
            <Text style={styles.modalTitle}>{t('upgrade.downgradeTitle')}</Text>
            <Text style={styles.confirmText}>
              {t('upgrade.remainingConvert', {
                value: money(downgradePreview?.totalRemainingValue, t('upgrade.currency'), dateLocale),
                days: downgradePreview?.remainingDays || 0,
              })}
            </Text>
            <Text style={styles.confirmText}>
              {t('upgrade.convertToPackage', {
                months: downgradePreview?.totalMonths || 0,
                packageName: downgradeTarget ? PACKAGE_LABELS[downgradeTarget] : '',
              })}
            </Text>
            {(downgradePreview?.surplus || 0) > 0 && (
              <Text style={styles.confirmText}>{t('upgrade.refundBalance', { value: money(downgradePreview?.surplus, t('upgrade.currency'), dateLocale) })}</Text>
            )}
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDowngradeTarget(null)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerBtn} onPress={confirmDowngrade} disabled={isSubmitting || !downgradePreview?.totalMonths}>
                <Text style={styles.dangerText}>{t('upgrade.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={enterpriseOpen} animationType="slide" transparent onRequestClose={() => setEnterpriseOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('upgrade.enterpriseTitle')}</Text>
              <TouchableOpacity onPress={() => setEnterpriseOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.enterpriseInfo}>{t('upgrade.enterpriseInfo')}</Text>
            <FormField label={t('upgrade.name')} value={contactForm.name} onChangeText={(name) => setContactForm((current) => ({ ...current, name }))} placeholder={t('profile.fullnamePlaceholder')} />
            <FormField label={t('upgrade.email')} value={contactForm.email} onChangeText={(email) => setContactForm((current) => ({ ...current, email }))} placeholder={t('upgrade.companyEmailPlaceholder')} keyboardType="email-address" autoCapitalize="none" />
            <FormField label={t('upgrade.phone')} value={contactForm.phone} onChangeText={(phone) => setContactForm((current) => ({ ...current, phone }))} placeholder={t('upgrade.phonePlaceholder')} keyboardType="phone-pad" />
            <FormField label={t('upgrade.message')} value={contactForm.message} onChangeText={(message) => setContactForm((current) => ({ ...current, message }))} placeholder={t('upgrade.enterpriseMessagePlaceholder')} multiline numberOfLines={4} style={styles.messageInput} />
            <TouchableOpacity style={styles.submitBtn} onPress={submitEnterpriseContact} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>{t('upgrade.sendContact')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PriceRow({ label, value, success, primary }: { label: string; value: string; success?: boolean; primary?: boolean }) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, primary && styles.priceLabelPrimary]}>{label}</Text>
      <Text style={[styles.priceValue, success && styles.priceSuccess, primary && styles.pricePrimary]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { ...Typography.bodySm, color: Colors.textSecondary },
  content: { padding: Spacing.lg, gap: 12, paddingBottom: 32 },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
    ...Shadow.sm,
  },
  currentIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBody: { flex: 1 },
  currentTitle: { ...Typography.h4, color: Colors.text },
  currentText: { ...Typography.bodySm, color: Colors.textSecondary, marginTop: 3 },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    ...Shadow.sm,
  },
  planPopular: { borderColor: '#7c3aed' },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#7c3aed',
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 10,
  },
  popularText: { ...Typography.label, color: '#fff', letterSpacing: 0 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planIcon: { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  planTitleWrap: { flex: 1 },
  planTitle: { ...Typography.h4, color: Colors.text },
  planPrice: { ...Typography.h3, color: Colors.text, marginTop: 2 },
  planSub: { ...Typography.caption, color: Colors.textSecondary },
  actionBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 7 },
  actionBtnCurrent: { backgroundColor: Colors.primaryLight },
  actionBtnOutline: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  actionText: { ...Typography.captionMd, color: '#fff', fontWeight: '700' },
  actionTextOutline: { color: Colors.primary },
  featureList: { marginTop: 12, gap: 7 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  featureText: { ...Typography.bodySm, color: Colors.textSecondary, flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
  },
  confirmCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    margin: Spacing.lg,
    padding: Spacing.lg,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { ...Typography.h3, color: Colors.text, flex: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { ...Typography.captionMd, color: Colors.textSecondary, marginBottom: 8 },
  durationWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  durationChip: { borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 7 },
  durationChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  durationText: { ...Typography.captionMd, color: Colors.textSecondary },
  durationTextActive: { color: '#fff' },
  priceBox: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: 12, marginBottom: Spacing.md },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 7 },
  priceLabel: { ...Typography.bodySm, color: Colors.textSecondary },
  priceLabelPrimary: { color: Colors.text, fontWeight: '700' },
  priceValue: { ...Typography.bodySm, color: Colors.text, fontWeight: '600' },
  priceSuccess: { color: Colors.success },
  pricePrimary: { color: Colors.primary, fontWeight: '800' },
  priceDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  paymentBox: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: Spacing.md },
  qrImage: { width: 112, height: 112, borderRadius: Radius.md, backgroundColor: Colors.background },
  paymentInfo: { flex: 1, gap: 5 },
  paymentLine: { ...Typography.captionMd, color: Colors.text },
  promoBox: { marginBottom: Spacing.md },
  promoInputRow: { flexDirection: 'row', gap: 8 },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    color: Colors.text,
  },
  applyPromoBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 12, justifyContent: 'center', minWidth: 82, alignItems: 'center' },
  applyPromoText: { ...Typography.captionMd, color: '#fff', fontWeight: '700' },
  promoApplied: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.successLight, borderRadius: Radius.md, padding: 10 },
  promoAppliedText: { ...Typography.bodySm, color: Colors.success, fontWeight: '700' },
  removePromo: { ...Typography.captionMd, color: Colors.danger },
  promoError: { ...Typography.caption, color: Colors.danger, marginTop: 5 },
  submitBtn: { height: 42, backgroundColor: Colors.primary, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitText: { ...Typography.bodyMd, color: '#fff', fontWeight: '800' },
  confirmText: { ...Typography.bodySm, color: Colors.textSecondary, marginTop: 8 },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: Spacing.lg },
  cancelBtn: { flex: 1, height: 40, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { ...Typography.bodyMd, color: Colors.text },
  dangerBtn: { flex: 1, height: 40, borderRadius: Radius.full, backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center' },
  dangerText: { ...Typography.bodyMd, color: '#fff', fontWeight: '700' },
  enterpriseInfo: { ...Typography.bodySm, color: Colors.textSecondary, marginBottom: Spacing.md },
  messageInput: { minHeight: 96, textAlignVertical: 'top' },
});
