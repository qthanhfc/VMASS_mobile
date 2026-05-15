import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../i18n';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import { PASSWORD_LAST_CHANGED_AT_KEY } from '../../services';

const changePasswordBackgroundImage = require('../../../assets/login-balloon.jpg');

export function ChangePasswordScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useThemeMode();
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert(t('changePassword.missingTitle'), t('changePassword.missingMessage'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('changePassword.mismatchTitle'), t('changePassword.mismatchMessage'));
      return;
    }

    await AsyncStorage.setItem(PASSWORD_LAST_CHANGED_AT_KEY, new Date().toISOString());
    Alert.alert(t('changePassword.title'), t('changePassword.successMessage'));
    navigation.goBack();
  };

  return (
    <ImageBackground source={changePasswordBackgroundImage} style={[styles.backgroundImage, { backgroundColor: colors.background }]} resizeMode="cover">
      <View style={[styles.backgroundOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.62)' : 'rgba(0,0,0,0.24)' }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('changePassword.title')}</Text>
            <View style={styles.headerSpacer} />
          </View>

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
                <Text style={styles.label}>{t('changePassword.current')}</Text>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder={t('changePassword.currentPlaceholder')}
                  placeholderTextColor={Colors.textSecondary}
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                />

                <Text style={styles.label}>{t('changePassword.new')}</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder={t('changePassword.newPlaceholder')}
                  placeholderTextColor={Colors.textSecondary}
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                />

                <Text style={styles.label}>{t('changePassword.confirm')}</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder={t('changePassword.confirmPlaceholder')}
                  placeholderTextColor={Colors.textSecondary}
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                />

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  <Text style={styles.submitText}>{t('changePassword.submit')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  backBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: '#fff',
  },
  headerSpacer: {
    width: 28,
    height: 28,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    ...Shadow.md,
  },
  label: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    height: 44,
    paddingHorizontal: 12,
    color: Colors.text,
  },
  submitBtn: {
    marginTop: Spacing.xl,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    ...Typography.bodyMd,
    color: '#fff',
    fontWeight: '700',
  },
});
