import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
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
import { ApiError, requestForgotPassword, verifyForgotPassword } from '../../services';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
const forgotPasswordBackgroundImage = require('../../../assets/login-balloon.jpg');
const vmassLogoImage = require('../../../assets/vmass-logo-horizontal-cropped.png');

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Navigation>();
  const { colors, isDark } = useThemeMode();
  const [username, setUsername] = useState('');
  const [domain, setDomain] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [repassword, setRepassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [hideRepassword, setHideRepassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async () => {
    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập tài khoản');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    setSent(false);

    try {
      const response = await requestForgotPassword({ username, domain: domain || undefined });
      setSent(true);
      setSuccessMessage(response.responseText || response.message || 'Vui lòng kiểm tra email để lấy mã xác thực.');
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Không thể gửi yêu cầu khôi phục.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!code.trim() || !password.trim() || !repassword.trim()) {
      setErrorMessage('Nhập đầy đủ dữ liệu');
      return;
    }

    if (password !== repassword) {
      setErrorMessage('Mật khẩu không khớp nhau');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await verifyForgotPassword({ code, password, repassword });
      setSuccessMessage(response.responseText || response.message || 'Đã đổi mật khẩu');
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Không thể đổi mật khẩu.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ImageBackground
      source={forgotPasswordBackgroundImage}
      style={[styles.backgroundImage, { backgroundColor: colors.background }]}
      resizeMode="cover"
    >
      <View style={[styles.backgroundOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.62)' : 'rgba(0,0,0,0.24)' }]}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={22} color="#fff" />
                <Text style={styles.backText}>Quay lại đăng nhập</Text>
              </TouchableOpacity>

              <View style={styles.contentWrap}>
                <View style={styles.hero}>
                  <Image source={vmassLogoImage} style={styles.logo} resizeMode="contain" />
                  <Text style={styles.title}>Quên mật khẩu</Text>
                  <Text style={styles.subtitle}>
                    Nhập thông tin tài khoản để nhận hướng dẫn đặt lại mật khẩu
                  </Text>
                </View>

                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {!sent ? (
                    <>
                      <Text style={styles.label}>Tài khoản</Text>
                      <TextInput
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        placeholder="Tên đăng nhập"
                        placeholderTextColor={Colors.textSecondary}
                        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      />

                      <Text style={styles.label}>Tên miền cửa hàng</Text>
                      <View style={[styles.domainRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TextInput
                          value={domain}
                          onChangeText={setDomain}
                          autoCapitalize="none"
                          placeholder="tencuahang"
                          placeholderTextColor={Colors.textSecondary}
                          style={[styles.domainInput, { color: colors.text }]}
                        />
                        <Text style={styles.domainSuffix}>.vmass.vn</Text>
                      </View>

                      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                      <TouchableOpacity
                        style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.primaryBtnText}>Gửi yêu cầu khôi phục</Text>
                        )}
                      </TouchableOpacity>

                      <View style={styles.footerRow}>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                          <Text style={styles.footerLink}>Đăng nhập?</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      {successMessage ? (
                        <View style={styles.noticeBox}>
                          <Ionicons name="mail-outline" size={18} color={Colors.primary} />
                          <Text style={styles.noticeText}>{successMessage}</Text>
                        </View>
                      ) : null}

                      <Text style={styles.label}>Mã xác thực</Text>
                      <TextInput
                        value={code}
                        onChangeText={setCode}
                        autoCapitalize="none"
                        placeholder="Nhập mã trong email"
                        placeholderTextColor={Colors.textSecondary}
                        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      />

                      <Text style={styles.label}>Mật khẩu mới</Text>
                      <View style={[styles.passwordRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TextInput
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={hidePassword}
                          autoCapitalize="none"
                          placeholder="Nhập mật khẩu mới"
                          placeholderTextColor={Colors.textSecondary}
                          style={[styles.passwordInput, { color: colors.text }]}
                        />
                        <TouchableOpacity
                          style={styles.eyeBtn}
                          onPress={() => setHidePassword((value) => !value)}
                        >
                          <Ionicons
                            name={hidePassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={Colors.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.label}>Nhập lại mật khẩu</Text>
                      <View style={[styles.passwordRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TextInput
                          value={repassword}
                          onChangeText={setRepassword}
                          secureTextEntry={hideRepassword}
                          autoCapitalize="none"
                          placeholder="Nhập lại mật khẩu"
                          placeholderTextColor={Colors.textSecondary}
                          style={[styles.passwordInput, { color: colors.text }]}
                        />
                        <TouchableOpacity
                          style={styles.eyeBtn}
                          onPress={() => setHideRepassword((value) => !value)}
                        >
                          <Ionicons
                            name={hideRepassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={Colors.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>

                      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                      <TouchableOpacity
                        style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
                        onPress={handleChangePassword}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.primaryBtnText}>Đổi mật khẩu</Text>
                        )}
                      </TouchableOpacity>

                      <View style={styles.footerRowBetween}>
                        <TouchableOpacity
                          onPress={() => {
                            setSent(false);
                            setErrorMessage('');
                            setSuccessMessage('');
                          }}
                        >
                          <Text style={styles.footerLink}>Gửi lại mã</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                          <Text style={styles.footerLink}>Đăng nhập ngay!</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
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
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    ...Typography.bodySm,
    color: 'rgba(255,255,255,0.9)',
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
    marginTop: Spacing.lg,
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
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    height: 44,
    paddingHorizontal: 12,
    color: Colors.text,
  },
  domainRow: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  domainInput: {
    flex: 1,
    paddingHorizontal: 12,
    color: Colors.text,
  },
  domainSuffix: {
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
  noticeBox: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#c8e9f8',
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noticeText: {
    ...Typography.bodySm,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  footerRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerRowBetween: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  footerLink: {
    ...Typography.bodySm,
    color: Colors.primary,
    fontWeight: '700',
  },
});
