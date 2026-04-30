import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import type { RootStackParamList } from '../../navigation';
import {
  ApiError,
  STORE_BASE_DOMAIN,
  checkDomainAvailability,
  signUp,
} from '../../services';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type DomainStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const DOMAIN_PATTERN = /^[a-z0-9_]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const registerBackgroundImage = require('../../../assets/login-balloon.jpg');
const vmassLogoImage = require('../../../assets/vmass-logo-horizontal.png');

const businessTypeOptions = [
  { value: 'cafe', label: 'Quán cà phê, trà sữa, trà chanh' },
  { value: 'restaurant', label: 'Nhà hàng, quán ăn' },
  { value: 'retail', label: 'Tạp hóa, bán lẻ' },
  { value: 'fashion', label: 'Thời trang' },
  { value: 'cosmetics', label: 'Mỹ phẩm' },
  { value: 'retail', label: 'Mô hình khác' },
];

export function RegisterScreen() {
  const navigation = useNavigation<Navigation>();
  const { colors, isDark } = useThemeMode();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedBusinessTypeIndex, setSelectedBusinessTypeIndex] = useState<number | null>(null);
  const [businessTypeSelectOpen, setBusinessTypeSelectOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [domainAvailability, setDomainAvailability] = useState<{
    status: DomainStatus;
    message: string;
  }>({
    status: 'idle',
    message: '',
  });

  const selectedBusinessType =
    selectedBusinessTypeIndex === null
      ? null
      : businessTypeOptions[selectedBusinessTypeIndex];

  const domainConditions = useMemo(() => {
    if (!domain) {
      return {
        noSpaces: false,
        isShopNameLike: false,
        onlyLowercaseAndNumbers: false,
      };
    }

    const noSpaces = !/\s/.test(domain);
    const onlyLowercaseAndNumbers = DOMAIN_PATTERN.test(domain);

    return {
      noSpaces,
      isShopNameLike: domain.length > 4,
      onlyLowercaseAndNumbers: onlyLowercaseAndNumbers && noSpaces,
    };
  }, [domain]);

  useEffect(() => {
    const nextDomain = domain.trim();

    if (!nextDomain) {
      setDomainAvailability({ status: 'idle', message: '' });
      return;
    }

    if (!DOMAIN_PATTERN.test(nextDomain)) {
      setDomainAvailability({ status: 'idle', message: '' });
      return;
    }

    let cancelled = false;
    setDomainAvailability({ status: 'checking', message: 'Đang kiểm tra...' });

    const timeoutId = setTimeout(async () => {
      try {
        const response = await checkDomainAvailability(nextDomain);

        if (cancelled) {
          return;
        }

        setDomainAvailability({
          status: response.isAvailable ? 'available' : 'taken',
          message:
            response.message ||
            (response.isAvailable
              ? 'Tên miền có thể sử dụng!'
              : 'Tên miền đã được sử dụng.'),
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof ApiError || error instanceof Error
            ? error.message
            : 'Lỗi khi kiểm tra tên miền. Vui lòng thử lại.';
        setDomainAvailability({ status: 'error', message });
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [domain]);

  const domainRulesReady =
    domainConditions.noSpaces &&
    domainConditions.onlyLowercaseAndNumbers &&
    domainConditions.isShopNameLike;

  const availabilityColor =
    domain && !domainConditions.onlyLowercaseAndNumbers
      ? Colors.danger
      : domainAvailability.status === 'available' && domainRulesReady
        ? Colors.success
        : domainAvailability.status === 'taken' || domainAvailability.status === 'error'
          ? Colors.danger
          : domainAvailability.status === 'checking'
            ? Colors.primary
            : Colors.textSecondary;

  const availabilityIcon: IoniconsName =
    domainAvailability.status === 'available' && domainRulesReady
      ? 'checkmark-circle'
      : domainAvailability.status === 'taken' ||
          domainAvailability.status === 'error' ||
          (Boolean(domain) && !domainConditions.onlyLowercaseAndNumbers)
        ? 'close-circle'
        : domainAvailability.status === 'checking'
          ? 'refresh-circle'
          : 'ellipse-outline';

  const availabilityText = (() => {
    if (!domain) {
      return 'Không trùng với tên của cửa hàng khác';
    }

    if (!domainConditions.noSpaces || !domainConditions.onlyLowercaseAndNumbers) {
      return 'Tên miền chỉ hỗ trợ chữ thường, số và _';
    }

    if (!domainConditions.isShopNameLike) {
      return 'Tên cửa hàng phải có ít nhất 5 ký tự';
    }

    return domainAvailability.message || 'Đang kiểm tra...';
  })();

  const handleDomainChange = (value: string) => {
    setDomain(value.toLowerCase());
  };

  const handleRegister = async () => {
    const normalizedFullName = fullName.trim();
    const normalizedPhone = phone.trim();
    const normalizedEmail = email.trim();
    const normalizedDomain = domain.trim().toLowerCase();

    if (
      !normalizedFullName ||
      !normalizedPhone ||
      !normalizedEmail ||
      !selectedBusinessType ||
      !normalizedDomain ||
      !password.trim()
    ) {
      setErrorMessage('Vui lòng nhập đầy đủ các thông tin');
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setErrorMessage('Email không hợp lệ');
      return;
    }

    if (normalizedDomain.length < 5) {
      setErrorMessage('Tên cửa hàng phải có ít nhất 5 ký tự');
      return;
    }

    if (!DOMAIN_PATTERN.test(normalizedDomain)) {
      setErrorMessage('Tên cửa hàng chỉ hỗ trợ chữ thường, số và _');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (domainAvailability.status === 'taken') {
      setErrorMessage('Tên cửa hàng đã được đăng ký, vui lòng chọn tên khác');
      return;
    }

    if (domainAvailability.status === 'checking') {
      setErrorMessage('Đang kiểm tra tên cửa hàng, vui lòng đợi...');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await signUp({
        fullname: normalizedFullName,
        phone: normalizedPhone,
        email: normalizedEmail,
        businessType: selectedBusinessType.value,
        domain: normalizedDomain,
        password,
        url: STORE_BASE_DOMAIN,
      });

      navigation.replace('Tabs');
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Đăng ký thất bại. Vui lòng thử lại.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderDomainRule = (passed: boolean, label: string) => {
    const color = passed ? Colors.success : Colors.textSecondary;
    const icon: IoniconsName = passed ? 'checkmark-circle' : 'close-circle-outline';

    return (
      <View style={styles.ruleRow}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={[styles.ruleText, { color }]}>{label}</Text>
      </View>
    );
  };

  return (
    <ImageBackground
      source={registerBackgroundImage}
      style={[styles.backgroundImage, { backgroundColor: colors.background }]}
      resizeMode="cover"
    >
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
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={22} color="#fff" />
                <Text style={styles.backText}>Quay lại</Text>
              </TouchableOpacity>

              <View style={styles.hero}>
                <View style={styles.heroCopy}>
                  <Text style={styles.title}>Đăng ký</Text>
                  <Text style={styles.subtitle}>Điền đầy đủ thông tin để hoàn tất đăng ký.</Text>
                </View>
                <Image source={vmassLogoImage} style={styles.logo} resizeMode="contain" />
              </View>

              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nguyễn Văn A"
              placeholderTextColor={Colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            />

            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="0901234567"
              placeholderTextColor={Colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="email@example.com"
              placeholderTextColor={Colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            />

            <Text style={styles.label}>Lĩnh vực kinh doanh</Text>
            <Pressable
              style={[styles.selectField, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setBusinessTypeSelectOpen(true)}
            >
              <Text
                style={[
                  styles.selectText,
                  !selectedBusinessType && styles.selectPlaceholder,
                ]}
              >
                {selectedBusinessType?.label || 'Vui lòng chọn lĩnh vực kinh doanh'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
            </Pressable>

            <Text style={styles.label}>Tên cửa hàng</Text>
            <View style={[styles.domainRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={domain}
                onChangeText={handleDomainChange}
                autoCapitalize="none"
                placeholder="tencuahang"
                placeholderTextColor={Colors.textSecondary}
                style={[styles.domainInput, { color: colors.text }]}
              />
              <Text style={styles.domainSuffix}>.{STORE_BASE_DOMAIN}</Text>
            </View>

            <View style={styles.ruleList}>
              {renderDomainRule(
                domainConditions.noSpaces && domainConditions.onlyLowercaseAndNumbers,
                'Viết liền không dấu',
              )}
              {renderDomainRule(
                domainConditions.onlyLowercaseAndNumbers,
                'Chỉ bao gồm chữ thường, số và _',
              )}
              {renderDomainRule(
                domainConditions.isShopNameLike,
                'Là tên cửa hàng của bạn. Tối thiểu 5 ký tự',
              )}
              <View style={styles.ruleRow}>
                <Ionicons name={availabilityIcon} size={16} color={availabilityColor} />
                <Text style={[styles.ruleText, { color: availabilityColor }]}>
                  {availabilityText}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Mật khẩu</Text>
            <View style={[styles.passwordRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={hidePassword}
                autoCapitalize="none"
                placeholder="Tối thiểu 6 ký tự"
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

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
              onPress={handleRegister}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Đăng ký</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Đã có tài khoản?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <Modal
            transparent
            visible={businessTypeSelectOpen}
            animationType="fade"
            onRequestClose={() => setBusinessTypeSelectOpen(false)}
          >
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setBusinessTypeSelectOpen(false)}
            >
              <Pressable style={[styles.selectModal, { backgroundColor: colors.card }]}>
                <View style={styles.selectModalHeader}>
                  <Text style={styles.selectModalTitle}>Lĩnh vực kinh doanh</Text>
                  <Pressable
                    style={styles.modalCloseBtn}
                    onPress={() => setBusinessTypeSelectOpen(false)}
                  >
                    <Ionicons name="close" size={20} color={Colors.textSecondary} />
                  </Pressable>
                </View>

                {businessTypeOptions.map((option, index) => {
                  const selected = selectedBusinessTypeIndex === index;

                  return (
                    <Pressable
                      key={`${option.value}-${option.label}`}
                      style={[styles.selectOption, selected && styles.selectOptionActive]}
                      onPress={() => {
                        setSelectedBusinessTypeIndex(index);
                        setBusinessTypeSelectOpen(false);
                      }}
                    >
                      <Text
                        style={[styles.selectOptionText, selected && styles.selectOptionTextActive]}
                      >
                        {option.label}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark" size={18} color={Colors.primary} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </Pressable>
            </Pressable>
          </Modal>
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
    gap: Spacing.lg,
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  heroCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  logo: {
    width: 154,
    height: 50,
    borderRadius: Radius.sm,
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
  selectField: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: 12,
  },
  selectText: {
    ...Typography.bodySm,
    color: Colors.text,
    flex: 1,
  },
  selectPlaceholder: {
    color: Colors.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  selectModal: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    gap: Spacing.xs,
    ...Shadow.lg,
  },
  selectModalHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.sm,
  },
  selectModalTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectOption: {
    minHeight: 44,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: 12,
  },
  selectOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  selectOptionText: {
    ...Typography.bodySm,
    color: Colors.text,
    flex: 1,
  },
  selectOptionTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
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
    minWidth: 0,
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
  ruleList: {
    gap: 6,
    marginTop: -2,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ruleText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 17,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
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
