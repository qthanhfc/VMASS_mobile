import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, type TranslationKey } from '../../i18n';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';
import { FormField, Header } from '../../components';
import type { SettingsStackParamList } from '../../navigation';
import {
  getCurrentUserProfile,
  resolvePublicImageUrl,
  updateCurrentUserProfile,
  type UpdateUserProfilePayload,
  type UserProfile,
} from '../../services';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

type ProfileForm = {
  fullname: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
  description: string;
  address: string;
  companyName: string;
  companyAddress: string;
  hotline: string;
  companyWebsite: string;
  companyStartTime: string;
  companyEndTime: string;
  namePay: string;
  numberPay: string;
  bankPay: string;
};

const emptyForm: ProfileForm = {
  fullname: '',
  email: '',
  phoneNumber: '',
  birthDate: '',
  description: '',
  address: '',
  companyName: '',
  companyAddress: '',
  hotline: '',
  companyWebsite: '',
  companyStartTime: '',
  companyEndTime: '',
  namePay: '',
  numberPay: '',
  bankPay: '',
};

const text = (value?: string | null) => (value || '').trim();

const toForm = (profile: UserProfile): ProfileForm => ({
  fullname: text(profile.fullname),
  email: text(profile.email),
  phoneNumber: text(profile.phoneNumber),
  birthDate: text(profile.birthDate),
  description: text(profile.description),
  address: text(profile.address),
  companyName: text(profile.companyName),
  companyAddress: text(profile.companyAddress),
  hotline: text(profile.hotline),
  companyWebsite: text(profile.companyWebsite),
  companyStartTime: text(profile.companyStartTime),
  companyEndTime: text(profile.companyEndTime),
  namePay: text(profile.namePay),
  numberPay: text(profile.numberPay),
  bankPay: text(profile.bankPay),
});

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'VM';
  return parts.slice(-2).map((part) => part[0]).join('').toUpperCase();
};

const businessTypeLabel = (
  value: string | null | undefined,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
) => {
  const labels: Record<string, TranslationKey> = {
    cafe: 'profile.business.cafe',
    restaurant: 'profile.business.restaurant',
    retail: 'profile.business.retail',
    fashion: 'profile.business.fashion',
    cosmetics: 'profile.business.cosmetics',
  };

  const key = text(value);
  return labels[key] ? t(labels[key]) : key || t('profile.notUpdated');
};

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) => (
  <FormField
    label={label}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    multiline={multiline}
    numberOfLines={multiline ? 3 : 1}
    keyboardType={keyboardType}
    autoCapitalize={autoCapitalize}
    style={multiline && styles.multilineInput}
  />
);

export function ProfileSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const set = (key: keyof ProfileForm) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const nextProfile = await getCurrentUserProfile();
      setProfile(nextProfile);
      setForm(toForm(nextProfile));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('profile.loadErrorFallback');
      Alert.alert(t('profile.loadErrorTitle'), message);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const avatarUrl = resolvePublicImageUrl(profile?.image);
  const companyLogoUrl = resolvePublicImageUrl(profile?.companyLogo);
  const companyImageUrl = resolvePublicImageUrl(profile?.companyImage);
  const qrPayUrl = resolvePublicImageUrl(profile?.qrPayImage);

  const profileTitle = form.fullname || t('profile.userFallback');
  const subtitle = useMemo(() => {
    const store = form.companyName || t('profile.storeFallback');
    const phone = form.phoneNumber || form.hotline || t('profile.phoneFallback');
    return `${store} · ${phone}`;
  }, [form.companyName, form.hotline, form.phoneNumber, t]);

  const handleSave = async () => {
    if (!form.fullname.trim()) {
      Alert.alert(t('profile.missingTitle'), t('profile.missingFullname'));
      return;
    }

    if (!form.companyName.trim()) {
      Alert.alert(t('profile.missingTitle'), t('profile.missingCompany'));
      return;
    }

    const payload: UpdateUserProfilePayload = {
      fullname: form.fullname.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      birthDate: form.birthDate.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      companyName: form.companyName.trim(),
      companyAddress: form.companyAddress.trim(),
      hotline: form.hotline.trim(),
      companyWebsite: form.companyWebsite.trim(),
      companyStartTime: form.companyStartTime.trim(),
      companyEndTime: form.companyEndTime.trim(),
      namePay: form.namePay.trim(),
      numberPay: form.numberPay.trim(),
      bankPay: form.bankPay.trim(),
    };

    try {
      setIsSaving(true);
      const response = await updateCurrentUserProfile(payload);
      if (response.data) {
        setProfile(response.data);
        setForm(toForm(response.data));
      }
      Alert.alert(t('profile.successTitle'), response.responseText || t('profile.successFallback'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('profile.saveErrorFallback');
      Alert.alert(t('profile.saveErrorTitle'), message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        onBack={() => navigation.goBack()}
        rightActions={
          <TouchableOpacity style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{t('profile.save')}</Text>
            )}
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('profile.loading')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.avatarBox}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials(profileTitle)}</Text>
              )}
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={1}>{profileTitle}</Text>
              <Text style={styles.heroSubtitle} numberOfLines={2}>{subtitle}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Ionicons name="storefront-outline" size={13} color={Colors.primary} />
                  <Text style={styles.badgeText}>{businessTypeLabel(profile?.businessType, t)}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('profile.personalInfo')}</Text>
            <ReadonlyRow label={t('profile.account')} value={profile?.username} fallback={t('profile.notUpdated')} />
            <Field label={t('profile.fullname')} value={form.fullname} onChangeText={set('fullname')} placeholder={t('profile.fullnamePlaceholder')} />
            <Field label={t('profile.description')} value={form.description} onChangeText={set('description')} placeholder={t('profile.descriptionPlaceholder')} multiline />
            <Field label={t('profile.address')} value={form.address} onChangeText={set('address')} placeholder={t('profile.addressPlaceholder')} multiline />
            <Field label={t('profile.phone')} value={form.phoneNumber} onChangeText={set('phoneNumber')} placeholder={t('profile.phonePlaceholder')} keyboardType="phone-pad" />
            <Field label="Email" value={form.email} onChangeText={set('email')} placeholder={t('profile.emailPlaceholder')} keyboardType="email-address" autoCapitalize="none" />
            <Field label={t('profile.birthDate')} value={form.birthDate} onChangeText={set('birthDate')} placeholder={t('profile.birthDatePlaceholder')} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('profile.storeInfo')}</Text>
            <ReadonlyRow label={t('profile.storeId')} value={profile?.companyUUID} fallback={t('profile.notUpdated')} />
            <ReadonlyRow label={t('profile.domain')} value={profile?.domain} fallback={t('profile.notUpdated')} />
            <ReadonlyRow label={t('profile.menu')} value={profile?.companyMenuHash} fallback={t('profile.notUpdated')} />
            <ReadonlyRow label={t('profile.businessType')} value={businessTypeLabel(profile?.businessType, t)} fallback={t('profile.notUpdated')} />
            <Field label={t('profile.storeName')} value={form.companyName} onChangeText={set('companyName')} placeholder={t('profile.storeNamePlaceholder')} />
            <Field label={t('profile.hotline')} value={form.hotline} onChangeText={set('hotline')} placeholder={t('profile.hotline')} keyboardType="phone-pad" />
            <Field label={t('profile.website')} value={form.companyWebsite} onChangeText={set('companyWebsite')} placeholder="https://..." keyboardType="url" autoCapitalize="none" />
            <Field label={t('profile.storeAddress')} value={form.companyAddress} onChangeText={set('companyAddress')} placeholder={t('profile.storeAddressPlaceholder')} multiline />
            <View style={styles.timeRow}>
              <View style={styles.timeCol}>
                <Field label={t('profile.openTime')} value={form.companyStartTime} onChangeText={set('companyStartTime')} placeholder="08:00" />
              </View>
              <View style={styles.timeCol}>
                <Field label={t('profile.closeTime')} value={form.companyEndTime} onChangeText={set('companyEndTime')} placeholder="22:00" />
              </View>
            </View>
          </View>

          {(companyLogoUrl || companyImageUrl || qrPayUrl) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('profile.currentImages')}</Text>
              <View style={styles.imageGrid}>
                <ImagePreview title="Logo" uri={companyLogoUrl} />
                <ImagePreview title={t('profile.coverImage')} uri={companyImageUrl} wide />
                <ImagePreview title={t('profile.paymentQr')} uri={qrPayUrl} />
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('profile.paymentInfo')}</Text>
            <Field label={t('profile.bank')} value={form.bankPay} onChangeText={set('bankPay')} placeholder={t('profile.bankPlaceholder')} autoCapitalize="characters" />
            <Field label={t('profile.accountName')} value={form.namePay} onChangeText={set('namePay')} placeholder={t('profile.accountNamePlaceholder')} />
            <Field label={t('profile.accountNumber')} value={form.numberPay} onChangeText={set('numberPay')} placeholder={t('profile.accountNumberPlaceholder')} keyboardType="phone-pad" />
          </View>

          <View style={styles.footer} />
        </ScrollView>
      )}
    </View>
  );
}

function ReadonlyRow({ label, value, fallback }: { label: string; value?: string | null; fallback: string }) {
  return (
    <View style={styles.readonlyRow}>
      <Text style={styles.readonlyLabel}>{label}</Text>
      <Text style={styles.readonlyValue} numberOfLines={2}>{text(value) || fallback}</Text>
    </View>
  );
}

function ImagePreview({ title, uri, wide }: { title: string; uri: string; wide?: boolean }) {
  if (!uri) return null;

  return (
    <View style={[styles.imagePreview, wide && styles.imagePreviewWide]}>
      <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
      <Text style={styles.previewTitle} numberOfLines={1}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { ...Typography.bodySm, color: Colors.textSecondary },
  content: {
    padding: Spacing.lg,
    gap: 12,
    paddingBottom: 32,
  },
  saveBtn: {
    minWidth: 58,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  saveBtnDisabled: { opacity: 0.72 },
  saveBtnText: { ...Typography.bodySm, color: '#fff', fontWeight: '700' },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadow.sm,
  },
  avatarBox: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { ...Typography.h2, color: Colors.primary, fontWeight: '800' },
  heroInfo: { flex: 1 },
  heroName: { ...Typography.h3, color: Colors.text },
  heroSubtitle: { ...Typography.captionMd, color: Colors.textSecondary, marginTop: 4 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
  },
  badgeText: { ...Typography.captionMd, color: Colors.primary },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  cardTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  multilineInput: {
    minHeight: 78,
    textAlignVertical: 'top',
  },
  readonlyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  readonlyLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    width: 94,
  },
  readonlyValue: {
    ...Typography.bodySm,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeCol: { flex: 1 },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imagePreview: {
    width: 96,
  },
  imagePreviewWide: {
    width: 150,
  },
  previewImage: {
    width: '100%',
    height: 82,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewTitle: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginTop: 5,
  },
  footer: { height: 16 },
});
