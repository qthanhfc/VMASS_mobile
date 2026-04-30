import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FormField, Header } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import type { SettingsStackParamList } from '../../navigation';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import {
  getCurrentUserProfile,
  submitFeedback,
  type FeedbackCategory,
} from '../../services';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

type CategoryOption = {
  key: FeedbackCategory;
  labelKey: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'feature', labelKey: 'feedback.category.feature', icon: 'sparkles-outline' },
  { key: 'improvement', labelKey: 'feedback.category.improvement', icon: 'construct-outline' },
  { key: 'bug', labelKey: 'feedback.category.bug', icon: 'bug-outline' },
  { key: 'other', labelKey: 'feedback.category.other', icon: 'chatbox-ellipses-outline' },
];

export function FeedbackScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadProfile = async () => {
        try {
          const profile = await getCurrentUserProfile();
          if (!isMounted) return;
          setContactName((current) => current || (profile.fullname || '').trim());
          setContactEmail((current) => current || (profile.email || '').trim());
          setContactPhone((current) => current || (profile.phoneNumber || profile.hotline || '').trim());
          setCompanyName((current) => current || (profile.companyName || '').trim());
        } catch {
          // The feedback form is still usable without account profile data.
        }
      };

      loadProfile();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleSubmit = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      Alert.alert(t('feedback.missingContentTitle'), t('feedback.missingContentMessage'));
      return;
    }

    if (trimmedContent.length < 10) {
      Alert.alert(t('feedback.shortContentTitle'), t('feedback.shortContentMessage'));
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitFeedback({
        category,
        title: title.trim(),
        content: trimmedContent,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        companyName: companyName.trim(),
        source: 'mobile-settings',
      });

      Alert.alert(t('feedback.successTitle'), response.responseText || t('feedback.successFallback'), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('feedback.errorFallback');
      Alert.alert(t('feedback.errorTitle'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        title={t('feedback.title')}
        subtitle={t('feedback.subtitle')}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('feedback.question')}</Text>
            </View>

            <View style={styles.categoryGrid}>
              {CATEGORY_OPTIONS.map((option) => {
                const isActive = category === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.78}
                    onPress={() => setCategory(option.key)}
                    style={[
                      styles.categoryChip,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      isActive && styles.categoryChipActive,
                    ]}
                  >
                    <Ionicons name={option.icon} size={16} color={isActive ? '#fff' : colors.textSecondary} />
                    <Text style={[styles.categoryText, { color: colors.textSecondary }, isActive && styles.categoryTextActive]}>
                      {t(option.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FormField
              label={t('feedback.field.title')}
              value={title}
              onChangeText={setTitle}
              placeholder={t('feedback.titlePlaceholder')}
              returnKeyType="next"
            />
            <FormField
              label={t('feedback.field.content')}
              value={content}
              onChangeText={setContent}
              placeholder={t('feedback.contentPlaceholder')}
              multiline
              numberOfLines={7}
              textAlignVertical="top"
              style={styles.contentInput}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.86}
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" />
                <Text style={styles.submitText}>{t('feedback.submit')}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  sectionHint: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  categoryChip: {
    minHeight: 36,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: '#fff',
  },
  contentInput: {
    minHeight: 150,
    paddingTop: 12,
  },
  submitBtn: {
    minHeight: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...Shadow.sm,
  },
  submitBtnDisabled: {
    opacity: 0.72,
  },
  submitText: {
    ...Typography.bodyMd,
    color: '#fff',
    fontWeight: '700',
  },
  footer: {
    height: 16,
  },
});
