import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
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
import { Header } from '../../components';
import type { SettingsStackParamList } from '../../navigation';
import {
  createStaffAccount,
  getCurrentUserProfile,
  getStaffAccountOptions,
  getUserRoleOptions,
  type StaffAccountOption,
  type UserRoleOption,
} from '../../services';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

const CREATE_NEW_STAFF_VALUE = '__create_new_staff__';

type AccountFormState = {
  staffId: string | number | null;
  newStaffName: string;
  username: string;
  email: string;
  password: string;
  repassword: string;
  userRoleId: string | number | null;
};

const DEFAULT_ACCOUNT_FORM: AccountFormState = {
  staffId: null,
  newStaffName: '',
  username: '',
  email: '',
  password: '',
  repassword: '',
  userRoleId: null,
};

export function StaffAccountScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useThemeMode();
  const [staffOptions, setStaffOptions] = useState<StaffAccountOption[]>([]);
  const [roleOptions, setRoleOptions] = useState<UserRoleOption[]>([]);
  const [storeDomain, setStoreDomain] = useState<string | null>(null);
  const [form, setForm] = useState<AccountFormState>(DEFAULT_ACCOUNT_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffExpanded, setStaffExpanded] = useState(false);
  const [roleExpanded, setRoleExpanded] = useState(false);

  const loadData = useCallback(async (refreshing = false) => {
    try {
      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);

      const [staffResult, roleResult, profileResult] = await Promise.all([
        getStaffAccountOptions(),
        getUserRoleOptions(),
        getCurrentUserProfile(),
      ]);

      setStaffOptions(staffResult);
      setRoleOptions(roleResult);
      setStoreDomain(profileResult.domain || null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải dữ liệu tạo tài khoản.';
      Alert.alert('Tạo tài khoản', message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const selectedStaff = useMemo(
    () => staffOptions.find((staff) => staff.value === form.staffId),
    [form.staffId, staffOptions]
  );
  const selectedRole = useMemo(
    () => roleOptions.find((role) => role.value === form.userRoleId),
    [form.userRoleId, roleOptions]
  );
  const isCreatingNewStaff = form.staffId === CREATE_NEW_STAFF_VALUE;
  const staffLabel = isCreatingNewStaff
    ? '+ Tạo nhân viên mới'
    : selectedStaff?.label || selectedStaff?.name || 'Không liên kết nhân viên';
  const roleLabel = selectedRole?.label || selectedRole?.name || 'Chọn một quyền';

  const updateForm = <K extends keyof AccountFormState>(key: K, value: AccountFormState[K]) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleStaffSelect = (value: string | number | null) => {
    updateForm('staffId', value);
    setStaffExpanded(false);

    if (value !== CREATE_NEW_STAFF_VALUE) {
      updateForm('newStaffName', '');
    }
  };

  const handleRoleSelect = (value: string | number) => {
    updateForm('userRoleId', value);
    setRoleExpanded(false);
  };

  const handleSubmit = async () => {
    const username = form.username.trim();
    const email = form.email.trim();
    const password = form.password;
    const repassword = form.repassword;
    const newStaffName = form.newStaffName.trim();
    const staffName = isCreatingNewStaff
      ? newStaffName
      : selectedStaff?.name || selectedStaff?.label || '';

    if (isCreatingNewStaff && !newStaffName) {
      Alert.alert('Tạo tài khoản', 'Tên nhân viên mới cần được nhập vào.');
      return;
    }

    if (!username) {
      Alert.alert('Tạo tài khoản', 'Tên đăng nhập cần được thêm vào.');
      return;
    }

    if (!password) {
      Alert.alert('Tạo tài khoản', 'Mật khẩu cần được thêm vào.');
      return;
    }

    if (!form.userRoleId) {
      Alert.alert('Tạo tài khoản', 'Phân quyền cần được chọn.');
      return;
    }

    if (password !== repassword) {
      Alert.alert('Tạo tài khoản', 'Mật khẩu không khớp nhau.');
      return;
    }

    if (password.length <= 5) {
      Alert.alert('Tạo tài khoản', 'Mật khẩu tối thiểu 5 ký tự.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createStaffAccount({
        fullname: staffName || username,
        username,
        email,
        password,
        repassword,
        user_role_id: form.userRoleId,
        domain: storeDomain,
        staff_id: !isCreatingNewStaff && form.staffId ? form.staffId : null,
        newStaffName: isCreatingNewStaff ? newStaffName : null,
      });

      setForm(DEFAULT_ACCOUNT_FORM);
      setStaffOptions(await getStaffAccountOptions());
      Alert.alert('Tạo tài khoản', 'Đã tạo tài khoản nhân viên.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo tài khoản nhân viên.';
      Alert.alert('Tạo tài khoản', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header title="Tạo tài khoản nhân viên" subtitle="Gán tài khoản đăng nhập với phân quyền" onBack={() => navigation.goBack()} />
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadData(true)}
              tintColor={colors.primary}
            />
          }
        >
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SelectField
              label="Tên nhân viên"
              value={staffLabel}
              expanded={staffExpanded}
              onPress={() => setStaffExpanded((current) => !current)}
            />
            {staffExpanded ? (
              <View style={[styles.optionList, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <OptionRow label="Không liên kết nhân viên" selected={!form.staffId} onPress={() => handleStaffSelect(null)} />
                <OptionRow
                  label="+ Tạo nhân viên mới"
                  selected={isCreatingNewStaff}
                  accent
                  onPress={() => handleStaffSelect(CREATE_NEW_STAFF_VALUE)}
                />
                {staffOptions.map((staff) => (
                  <OptionRow
                    key={String(staff.value)}
                    label={staff.label || staff.name || String(staff.value)}
                    selected={staff.value === form.staffId}
                    onPress={() => handleStaffSelect(staff.value)}
                  />
                ))}
              </View>
            ) : null}

            {isCreatingNewStaff ? (
              <AccountTextInput
                label="Tên nhân viên mới"
                value={form.newStaffName}
                placeholder="Nhập tên nhân viên mới"
                onChangeText={(value) => updateForm('newStaffName', value)}
              />
            ) : null}

            <AccountTextInput
              label="Tên đăng nhập"
              value={form.username}
              placeholder="Ví dụ: thungan01"
              autoCapitalize="none"
              onChangeText={(value) => updateForm('username', value)}
            />
            <AccountTextInput
              label="Email"
              value={form.email}
              placeholder="name@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(value) => updateForm('email', value)}
            />
            <AccountTextInput
              label="Mật khẩu"
              value={form.password}
              placeholder="Tối thiểu 6 ký tự"
              secureTextEntry
              onChangeText={(value) => updateForm('password', value)}
            />
            <AccountTextInput
              label="Nhập lại mật khẩu"
              value={form.repassword}
              placeholder="Nhập lại mật khẩu"
              secureTextEntry
              onChangeText={(value) => updateForm('repassword', value)}
            />

            <SelectField
              label="Phân quyền"
              value={roleLabel}
              muted={!selectedRole}
              expanded={roleExpanded}
              onPress={() => setRoleExpanded((current) => !current)}
            />
            {roleExpanded ? (
              <View style={[styles.optionList, { borderColor: colors.border, backgroundColor: colors.card }]}>
                {roleOptions.map((role) => (
                  <OptionRow
                    key={String(role.value)}
                    label={role.label || role.name || String(role.value)}
                    selected={role.value === form.userRoleId}
                    onPress={() => handleRoleSelect(role.value)}
                  />
                ))}
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.86}
              disabled={isSubmitting}
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.submitText}>Tạo tài khoản</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function SelectField({
  label,
  value,
  expanded,
  muted,
  onPress,
}: {
  label: string;
  value: string;
  expanded: boolean;
  muted?: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemeMode();

  return (
    <View style={styles.formField}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.82}
        style={[styles.selectBox, { borderColor: colors.border, backgroundColor: colors.background }]}
        onPress={onPress}
      >
        <Text style={[styles.selectBoxText, { color: muted ? colors.textSecondary : colors.text }]} numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

function AccountTextInput({
  label,
  value,
  placeholder,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const { colors } = useThemeMode();

  return (
    <View style={styles.formField}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onChangeText={onChangeText}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
      />
    </View>
  );
}

function OptionRow({
  label,
  selected,
  accent,
  onPress,
}: {
  label: string;
  selected: boolean;
  accent?: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemeMode();

  return (
    <TouchableOpacity activeOpacity={0.78} style={styles.optionRow} onPress={onPress}>
      <Text
        style={[
          styles.optionText,
          {
            color: accent ? colors.primary : colors.text,
            fontWeight: selected || accent ? '700' : '500',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {selected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingText: {
    ...Typography.captionMd,
    marginTop: 10,
    letterSpacing: 0,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 30,
  },
  formCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 12,
    ...Shadow.sm,
  },
  formField: {
    gap: 0,
  },
  fieldLabel: {
    ...Typography.captionMd,
    marginBottom: 8,
    letterSpacing: 0,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    ...Typography.bodyMd,
    letterSpacing: 0,
  },
  selectBox: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectBoxText: {
    ...Typography.bodyMd,
    flex: 1,
    letterSpacing: 0,
  },
  optionList: {
    marginTop: -4,
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  optionRow: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionText: {
    ...Typography.bodySm,
    flex: 1,
    letterSpacing: 0,
  },
  submitButton: {
    minHeight: 46,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 2,
  },
  submitButtonDisabled: {
    opacity: 0.72,
  },
  submitText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0,
  },
});
