import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import type { RootStackParamList } from '../../navigation';
import { ApiError, signIn } from '../../services';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
const loginBackgroundImage = require('../../../assets/login-balloon.jpg');
const vmassLogoImage = require('../../../assets/vmass-logo-horizontal-cropped.png');

export function LoginScreen() {
  const navigation = useNavigation<Navigation>();
  const { colors, isDark } = useThemeMode();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [storeDomain, setStoreDomain] = useState('');
  const [remember, setRemember] = useState(true);
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập tài khoản và mật khẩu');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await signIn({
        username,
        password,
        domain: storeDomain || undefined,
      });

      navigation.replace('Tabs');
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Đăng nhập thất bại. Vui lòng thử lại.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ImageBackground source={loginBackgroundImage} style={[styles.backgroundImage, { backgroundColor: colors.background }]} resizeMode="cover">
      <View style={[styles.backgroundOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.62)' : 'rgba(0,0,0,0.24)' }]}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.container}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.contentWrap}>
                <View style={styles.hero}>
                  <Image source={vmassLogoImage} style={styles.logo} resizeMode="contain" />
                  <Text style={styles.title}>Đăng nhập VMASS Mobile</Text>
                  <Text style={styles.subtitle}>Quản lý bán hàng mọi lúc trên điện thoại của bạn</Text>
                </View>

                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={styles.label}>Tài khoản</Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    placeholder="Tên đăng nhập"
                    placeholderTextColor={Colors.textSecondary}
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  />

                  <Text style={styles.label}>Mật khẩu</Text>
                  <View style={[styles.passwordRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={hidePassword}
                      placeholder="Nhập mật khẩu"
                      placeholderTextColor={Colors.textSecondary}
                      style={[styles.passwordInput, { color: colors.text }]}
                    />
                    <Pressable style={styles.eyeBtn} onPress={() => setHidePassword((v) => !v)}>
                      <Ionicons
                        name={hidePassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={Colors.textSecondary}
                      />
                    </Pressable>
                  </View>

                  <Text style={styles.hintText}>
                    Chủ cửa hàng: chỉ cần tài khoản + mật khẩu.
                  </Text>
                  <Text style={styles.hintText}>
                    Nhân viên: nhập thêm tên cửa hàng bên dưới.
                  </Text>

                  <Text style={styles.label}>Tên cửa hàng (tùy chọn)</Text>
                  <View style={[styles.storeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TextInput
                      value={storeDomain}
                      onChangeText={setStoreDomain}
                      autoCapitalize="none"
                      placeholder="tencuahang"
                      placeholderTextColor={Colors.textSecondary}
                      style={[styles.storeInput, { color: colors.text }]}
                    />
                    <Text style={styles.storeSuffix}>.vmass.vn</Text>
                  </View>

                  <View style={styles.inlineRow}>
                    <Pressable style={styles.checkboxWrap} onPress={() => setRemember((v) => !v)}>
                      <View style={[styles.checkbox, remember && styles.checkboxActive]}>
                        {remember ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                      </View>
                      <Text style={styles.inlineText}>Ghi nhớ đăng nhập</Text>
                    </Pressable>

                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                      <Text style={styles.link}>Quên mật khẩu?</Text>
                    </TouchableOpacity>
                  </View>

                  {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                  <TouchableOpacity
                    style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
                    onPress={handleLogin}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Đăng nhập</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.footerRow}>
                    <Text style={styles.footerText}>Chưa có tài khoản?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                      <Text style={styles.footerLink}>Đăng ký ngay</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingBottom: 84,
  },
  hero: {
    gap: Spacing.sm,
  },
  logo: {
    width: 145,
    height: 40,
  },
  title: {
    ...Typography.h2,
    color: '#fff',
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.md,
  },
  label: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginBottom: -4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    height: 44,
    paddingHorizontal: 12,
    color: Colors.text,
  },
  passwordRow: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    color: Colors.text,
  },
  eyeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: -2,
  },
  storeRow: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  storeInput: {
    flex: 1,
    paddingHorizontal: 12,
    color: Colors.text,
  },
  storeSuffix: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    alignSelf: 'stretch',
    textAlignVertical: 'center',
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  inlineRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  checkboxActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  inlineText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  link: {
    ...Typography.bodySm,
    color: Colors.primary,
    fontWeight: '600',
  },
  primaryBtn: {
    marginTop: Spacing.sm,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.75,
  },
  primaryBtnText: {
    ...Typography.bodyMd,
    color: '#fff',
    fontWeight: '700',
  },
  errorText: {
    ...Typography.bodySm,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  footerRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  footerLink: {
    ...Typography.bodySm,
    color: Colors.primary,
    fontWeight: '700',
  },
});
