import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  API_BASE_URL,
  createStaff,
  createStaffAccount,
  deleteStaff,
  downloadStaffSalary,
  getStaffAccessAccount,
  getStaffDetail,
  getUserRoleOptions,
  listStaff,
  updateStaff,
  updateStaffAccessAccount,
} from '../../services';
import { ManageStackParamList } from '../../navigation';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import type { Staff, StaffDynamicFormValues, StaffSalaryBy, StaffWorkingHour, StaffWorkingStatus } from '../../types';
import {
  DATE_GET_SALARY_OPTIONS,
  HOUR_WORKING_ON_DAY_OPTIONS,
  POSITION_OPTIONS,
  SALARY_BY_OPTIONS,
  STATUS_WORKING_OPTIONS,
  addDefaultWorkingHour,
  calculateBaseSalary,
  calculateDayoffDeduction,
  calculateOvertimeIncome,
  findStaffUpdateSetting,
  formatMoney,
  formatShortDate,
  formatVnd,
  getSalaryByLabel,
  getStatusWorkingLabel,
  normalizeNumberString,
  toDateInput,
} from '../../utils/staff';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type Route = RouteProp<ManageStackParamList, 'StaffEdit'>;
type StaffPermission = 'R' | 'C' | 'U' | 'D';
type StaffAccessForm = {
  enabled: boolean;
  accountId: string | number | null;
  username: string;
  email: string;
  password: string;
  repassword: string;
  user_role_id: string;
};
type RoleSelectOption = { value: string; label: string };
type DynamicField = {
  name?: string;
  key?: string;
  label?: string;
  title?: string;
  placeholder?: string;
};

const ROLE_ALIAS = 'user_staff';

const blankAccessForm = (): StaffAccessForm => ({
  enabled: false,
  accountId: null,
  username: '',
  email: '',
  password: '',
  repassword: '',
  user_role_id: '',
});

const todayInput = () => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const blankStaff = (): Staff => ({
  id: 0,
  name: '',
  phone: '',
  email: '',
  address: '',
  birthday: '',
  permission_name: '',
  date_join: todayInput(),
  date_get_salary: '1',
  salary_by: 'h',
  salary_value: '',
  hour_working_on_day: '8',
  working_hours: [{ hash: 'FIRST', start: '08:00', end: '12:00' }],
  status_working: 'on',
  dynamic_form: {},
  current_commission: 0,
  current_bonus: 0,
  current_overtime: 0,
  current_advence: 0,
  current_fined: 0,
  current_dayoff: 0,
  current_day_working: 0,
  current_salary: 0,
  total_day_working: 0,
  total_salary: 0,
  pending_date: null,
  pending_hour: null,
  lst_6_month: [],
  overtime_hour: 0,
  day_off_hour: 0,
  status: 'active',
});

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'NV';

async function readStaffPermissions(): Promise<Record<StaffPermission, boolean>> {
  const allowed = { R: true, C: true, U: true, D: true };
  const raw = await AsyncStorage.getItem('roleSettings');
  if (!raw) return allowed;

  try {
    const settings = JSON.parse(raw) as Array<{ role_alias?: string; permission?: string }>;
    if (!Array.isArray(settings) || settings.length === 0) return allowed;

    return {
      R: settings.some((item) => item.role_alias === ROLE_ALIAS && item.permission === 'R'),
      C: settings.some((item) => item.role_alias === ROLE_ALIAS && item.permission === 'C'),
      U: settings.some((item) => item.role_alias === ROLE_ALIAS && item.permission === 'U'),
      D: settings.some((item) => item.role_alias === ROLE_ALIAS && item.permission === 'D'),
    };
  } catch {
    return allowed;
  }
}

export function StaffEditScreen() {
  const { colors } = useThemeMode();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const staffId = route.params?.id;
  const previewStaff = route.params?.preview;
  const isEdit = staffId !== undefined && String(staffId).trim().length > 0;
  const [permissions, setPermissions] = useState<Record<StaffPermission, boolean>>({ R: true, C: true, U: true, D: true });
  const [form, setForm] = useState<Staff>(() => previewStaff || blankStaff());
  const [original, setOriginal] = useState<Staff | null>(previewStaff || null);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [loading, setLoading] = useState(isEdit && !previewStaff);
  const [saving, setSaving] = useState(false);
  const [salaryApplyDate, setSalaryApplyDate] = useState('');
  const [positionSelectOpen, setPositionSelectOpen] = useState(false);
  const [dateJoinPickerOpen, setDateJoinPickerOpen] = useState(false);
  const [birthdayPickerOpen, setBirthdayPickerOpen] = useState(false);
  const [dateGetSalarySelectOpen, setDateGetSalarySelectOpen] = useState(false);
  const [hourWorkingSelectOpen, setHourWorkingSelectOpen] = useState(false);
  const [accessRoleSelectOpen, setAccessRoleSelectOpen] = useState(false);
  const [roleOptions, setRoleOptions] = useState<RoleSelectOption[]>([]);
  const [accessForm, setAccessForm] = useState<StaffAccessForm>(() => blankAccessForm());

  useEffect(() => {
    let mounted = true;
    readStaffPermissions().then((value) => {
      if (mounted) setPermissions(value);
    });

    (async () => {
      try {
        const [listResult, rolesResult] = await Promise.all([
          listStaff({ pageSize: 1, currentPage: 1, search: '' }),
          getUserRoleOptions(),
        ]);
        if (mounted) {
          setDynamicFields((listResult.dynamicForm || []) as DynamicField[]);
          setRoleOptions(
            rolesResult.map((role) => ({
              value: String(role.value),
              label: role.label,
            })),
          );
        }
      } catch {
        if (mounted) {
          setDynamicFields([]);
          setRoleOptions([]);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const currentStaffId = staffId || form.id;
    if (!isEdit || !currentStaffId) {
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const account = await getStaffAccessAccount(currentStaffId);
        if (!mounted || !account) return;

        setAccessForm({
          enabled: true,
          accountId: account.id,
          username: account.username || '',
          email: account.email || '',
          password: '',
          repassword: '',
          user_role_id: account.user_role_id?.value ? String(account.user_role_id.value) : '',
        });
      } catch {
        if (mounted) setAccessForm((prev) => ({ ...prev, enabled: false, accountId: null }));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [form.id, isEdit, staffId]);

  useEffect(() => {
    let mounted = true;
    if (!isEdit || !staffId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        if (!previewStaff) setLoading(true);
        const detail = await getStaffDetail(staffId);
        if (!mounted) return;
        setForm(detail);
        setOriginal(detail);
      } catch (err) {
        if (previewStaff) return;
        const message = err instanceof Error ? err.message : 'Không thể tải thông tin nhân viên.';
        Alert.alert('Lỗi', message, [{ text: 'OK', onPress: () => nav.goBack() }]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isEdit, nav, previewStaff, staffId]);

  const canEdit = isEdit ? permissions.U : permissions.C;
  const salarySetting = useMemo(() => findStaffUpdateSetting(form, original), [form, original]);
  const hasSalaryChanged =
    isEdit &&
    original !== null &&
    (salarySetting.salary_by !== null || salarySetting.salary_value !== null);

  useEffect(() => {
    if (hasSalaryChanged && !salaryApplyDate) {
      setSalaryApplyDate(todayInput());
    }
    if (!hasSalaryChanged && salaryApplyDate) {
      setSalaryApplyDate('');
    }
  }, [hasSalaryChanged, salaryApplyDate]);

  const calculatedBaseSalary = calculateBaseSalary(form);
  const overtimeIncome = calculateOvertimeIncome(form);
  const dayoffDeduction = calculateDayoffDeduction(form);
  const totalIncome = form.current_commission + form.current_bonus + overtimeIncome;
  const totalDeduction = form.current_advence + form.current_fined + dayoffDeduction;
  const takeHome = calculatedBaseSalary + totalIncome - totalDeduction;

  const set = (key: keyof Staff) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openRoleDetail = () => {
    if (!accessForm.user_role_id) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng chọn nhóm quyền trước khi xem chi tiết.');
      return;
    }
    const roleLabel =
      roleOptions.find((item) => String(item.value) === String(accessForm.user_role_id))?.label ||
      'Nhóm quyền';
    nav.navigate('StaffRoleDetail', {
      roleId: String(accessForm.user_role_id),
      roleName: roleLabel,
    });
  };

  const setAccess = (key: keyof StaffAccessForm) => (value: string) =>
    setAccessForm((prev) => ({ ...prev, [key]: value }));

  const setDynamic = (key: string) => (value: string) =>
    setForm((prev) => ({
      ...prev,
      dynamic_form: {
        ...prev.dynamic_form,
        [key]: value,
      },
    }));

  const updateWorkingHour = (hash: string, key: keyof Pick<StaffWorkingHour, 'start' | 'end'>, value: string) => {
    setForm((prev) => ({
      ...prev,
      working_hours: prev.working_hours.map((item) => (item.hash === hash ? { ...item, [key]: value } : item)),
    }));
  };

  const validateAccessForm = () => {
    if (!accessForm.enabled) return true;
    if (!accessForm.username.trim()) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng nhập tên đăng nhập.');
      return false;
    }
    if (!accessForm.user_role_id) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng chọn nhóm quyền.');
      return false;
    }
    if (!accessForm.accountId && !accessForm.password) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng nhập mật khẩu.');
      return false;
    }
    if (accessForm.password || accessForm.repassword) {
      if (accessForm.password !== accessForm.repassword) {
        Alert.alert('Thiếu dữ liệu', 'Mật khẩu không khớp nhau.');
        return false;
      }
      if (accessForm.password.length <= 5) {
        Alert.alert('Thiếu dữ liệu', 'Mật khẩu tối thiểu 6 ký tự.');
        return false;
      }
    }
    return true;
  };

  const saveAccessAccount = async (staffAccessId: Staff['id']) => {
    if (!accessForm.enabled) return;

    if (accessForm.accountId) {
      await updateStaffAccessAccount({
        id: accessForm.accountId,
        fullname: form.name.trim(),
        username: accessForm.username.trim(),
        email: accessForm.email.trim(),
        password: accessForm.password,
        repassword: accessForm.repassword,
        user_role_id: accessForm.user_role_id,
      });
      return;
    }

    await createStaffAccount({
      fullname: form.name.trim(),
      username: accessForm.username.trim(),
      email: accessForm.email.trim(),
      password: accessForm.password,
      repassword: accessForm.repassword,
      user_role_id: accessForm.user_role_id,
      staff_id: staffAccessId,
    });
  };

  const handleSave = async () => {
    if (!canEdit) {
      Alert.alert('Không có quyền', 'Bạn không có quyền lưu nhân viên.');
      return;
    }
    if (!form.name.trim()) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng nhập tên nhân viên.');
      return;
    }
    if (!form.permission_name.trim()) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng chọn vị trí công việc.');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng nhập số điện thoại.');
      return;
    }
    if (!form.address?.trim()) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng nhập địa chỉ.');
      return;
    }
    if (hasSalaryChanged && !salaryApplyDate) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng nhập ngày bắt đầu áp dụng mức lương mới.');
      return;
    }
    if (!validateAccessForm()) {
      return;
    }

    try {
      setSaving(true);
      const normalizedForm = {
        ...form,
        salary_value: normalizeNumberString(form.salary_value),
        date_join: toDateInput(form.date_join),
      };

      if (isEdit) {
        await updateStaff(normalizedForm, original, hasSalaryChanged ? salaryApplyDate : null);
        await saveAccessAccount(normalizedForm.id);
        Alert.alert('Đã lưu', 'Thông tin nhân viên đã được cập nhật.', [{ text: 'OK', onPress: () => nav.goBack() }]);
      } else {
        const createdStaff = await createStaff(normalizedForm);
        if (accessForm.enabled && !createdStaff?.id) {
          throw new Error('Không lấy được mã nhân viên để tạo tài khoản đăng nhập.');
        }
        if (createdStaff?.id) await saveAccessAccount(createdStaff.id);
        Alert.alert('Đã tạo', 'Đã thêm nhân viên thành công.', [{ text: 'OK', onPress: () => nav.goBack() }]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể lưu nhân viên.';
      Alert.alert('Lỗi', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!isEdit || !staffId) return;
    if (!permissions.D) {
      Alert.alert('Không có quyền', 'Bạn không có quyền xóa nhân viên.');
      return;
    }

    Alert.alert('Xóa nhân viên', `Bạn chắc chắn muốn xóa ${form.name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStaff([staffId]);
            Alert.alert('Đã xóa', 'Nhân viên đã được xóa.', [{ text: 'OK', onPress: () => nav.goBack() }]);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Không thể xóa nhân viên.';
            Alert.alert('Lỗi', message);
          }
        },
      },
    ]);
  };

  const handleDownloadSalary = async (month: string | number, year: string | number) => {
    if (!staffId) return;
    try {
      const link = await downloadStaffSalary({ id: staffId, month, year });
      if (!link) {
        Alert.alert('Chưa có dữ liệu', 'Không tìm thấy bảng lương cho kỳ này.');
        return;
      }

      const url = /^https?:\/\//i.test(link) ? link : `${API_BASE_URL}${link.startsWith('/') ? '' : '/'}${link}`;
      await Linking.openURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải bảng lương.';
      Alert.alert('Lỗi', message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải nhân viên...</Text>
      </View>
    );
  }

  if (!permissions.R) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={42} color={colors.textSecondary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Bạn không có quyền sử dụng tính năng này.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isEdit ? 'Hồ sơ nhân viên' : 'Thêm nhân viên'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, (!canEdit || saving) && styles.saveBtnDisabled]} disabled={!canEdit || saving}>
          <Text style={styles.saveTxt}>{saving ? 'Đang lưu' : 'Lưu'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={[styles.avatarCircle, { backgroundColor: `${Colors.primary}22`, borderColor: Colors.primary }]}>
            <Text style={styles.avatarText}>{initials(form.name || 'NV')}</Text>
          </View>
          <View style={styles.profileBody}>
            <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
              {form.name || 'Nhập tên nhân viên'}
            </Text>
            <Text style={[styles.profileMeta, { color: colors.textSecondary }]}>
              Bắt đầu {formatShortDate(form.date_join)}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badgePill, { backgroundColor: form.status_working === 'on' ? Colors.successLight : Colors.dangerLight }]}>
                <Text style={[styles.badgeText, { color: form.status_working === 'on' ? Colors.success : Colors.danger }]}>
                  ● {getStatusWorkingLabel(form.status_working)}
                </Text>
              </View>
              <View style={[styles.badgePill, { backgroundColor: Colors.primaryLight }]}>
                <Text style={[styles.badgeText, { color: Colors.primary }]}>{form.permission_name || 'Chưa có chức vụ'}</Text>
              </View>
            </View>
          </View>
        </View>

        <Section title="THÔNG TIN CƠ BẢN">
          <Field label="Họ tên *" value={form.name} onChangeText={set('name')} placeholder="Nguyễn Văn A" editable={canEdit} />
          <View style={styles.twoCol}>
            <DatePickerField
              label="Ngày sinh"
              value={form.birthday || ''}
              open={birthdayPickerOpen}
              onOpen={() => setBirthdayPickerOpen(true)}
              onClose={() => setBirthdayPickerOpen(false)}
              onSelect={(value) => {
                setForm((prev) => ({ ...prev, birthday: value }));
                setBirthdayPickerOpen(false);
              }}
              disabled={!canEdit}
            />
            <SelectField
              label="Vị trí công việc *"
              value={form.permission_name}
              options={POSITION_OPTIONS}
              placeholder="Chọn vị trí công việc"
              open={positionSelectOpen}
              onOpen={() => setPositionSelectOpen(true)}
              onClose={() => setPositionSelectOpen(false)}
              onSelect={(value) => {
                setForm((prev) => ({ ...prev, permission_name: value }));
                setPositionSelectOpen(false);
              }}
              disabled={!canEdit}
            />
          </View>
          <View style={styles.twoCol}>
            <Field label="Số điện thoại *" value={form.phone} onChangeText={set('phone')} placeholder="09xxxxxxxx" keyboardType="phone-pad" editable={canEdit} mono />
            <Field label="Email" value={form.email || ''} onChangeText={set('email')} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" editable={canEdit} />
          </View>
          <Field label="Địa chỉ *" value={form.address || ''} onChangeText={set('address')} placeholder="Địa chỉ liên hệ" editable={canEdit} />
          <DynamicFormFields fields={dynamicFields} values={form.dynamic_form} onChange={setDynamic} editable={canEdit} />
        </Section>

        <Section title="PHÂN QUYỀN TRUY CẬP">
          <View style={styles.accessHeader}>
            <View style={styles.accessTitleWrap}>
              <Text style={[styles.accessTitle, { color: colors.text }]}>Cho phép đăng nhập</Text>
              <Text style={[styles.accessStatus, { color: accessForm.enabled ? Colors.success : colors.textSecondary }]}>
                {accessForm.enabled ? 'Đang bật' : 'Đang tắt'}
              </Text>
            </View>
            <Switch
              value={accessForm.enabled}
              disabled={!canEdit || Boolean(accessForm.accountId)}
              onValueChange={(enabled) =>
                setAccessForm((prev) => ({
                  ...prev,
                  enabled,
                  email: enabled && !prev.email ? form.email || '' : prev.email,
                }))
              }
              trackColor={{ false: colors.border, true: Colors.primaryLight }}
              thumbColor={accessForm.enabled ? Colors.primary : colors.textSecondary}
            />
          </View>

          {accessForm.enabled ? (
            <>
              <View style={styles.twoCol}>
                <Field
                  label="Tên đăng nhập *"
                  value={accessForm.username}
                  onChangeText={setAccess('username')}
                  placeholder="ten.dang.nhap"
                  autoCapitalize="none"
                  editable={canEdit}
                />
                <Field
                  label="Email"
                  value={accessForm.email}
                  onChangeText={setAccess('email')}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={canEdit}
                />
              </View>
              <SelectField
                label="Nhóm quyền *"
                value={accessForm.user_role_id}
                options={roleOptions}
                placeholder="Chọn nhóm quyền"
                open={accessRoleSelectOpen}
                onOpen={() => setAccessRoleSelectOpen(true)}
                onClose={() => setAccessRoleSelectOpen(false)}
                onSelect={(value) => {
                  setAccessForm((prev) => ({ ...prev, user_role_id: value }));
                  setAccessRoleSelectOpen(false);
                }}
                disabled={!canEdit || roleOptions.length === 0}
              />
              <TouchableOpacity
                style={[
                  styles.roleDetailBtn,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  !accessForm.user_role_id && styles.disabledInput,
                ]}
                onPress={openRoleDetail}
                activeOpacity={0.82}
              >
                <Ionicons name="eye-outline" size={16} color={Colors.primary} />
                <Text style={[styles.roleDetailBtnText, { color: Colors.primary }]}>Xem chi tiết quyền</Text>
              </TouchableOpacity>
              <View style={styles.twoCol}>
                <Field
                  label={accessForm.accountId ? 'Mật khẩu mới' : 'Mật khẩu *'}
                  value={accessForm.password}
                  onChangeText={setAccess('password')}
                  placeholder={accessForm.accountId ? 'Để trống nếu không đổi' : 'Mật khẩu'}
                  secureTextEntry
                  editable={canEdit}
                />
                <Field
                  label={accessForm.accountId ? 'Nhập lại mật khẩu mới' : 'Nhập lại mật khẩu *'}
                  value={accessForm.repassword}
                  onChangeText={setAccess('repassword')}
                  placeholder={accessForm.accountId ? 'Để trống nếu không đổi' : 'Nhập lại mật khẩu'}
                  secureTextEntry
                  editable={canEdit}
                />
              </View>
            </>
          ) : null}
        </Section>

        <Section title="THỜI GIAN & LƯƠNG">
          <View style={styles.twoCol}>
            <DatePickerField
              label="Ngày tham gia *"
              value={form.date_join}
              open={dateJoinPickerOpen}
              onOpen={() => setDateJoinPickerOpen(true)}
              onClose={() => setDateJoinPickerOpen(false)}
              onSelect={(value) => {
                setForm((prev) => ({ ...prev, date_join: value }));
                setDateJoinPickerOpen(false);
              }}
              disabled={!canEdit}
            />
            <SelectField
              label="Ngày chốt lương *"
              value={form.date_get_salary}
              options={DATE_GET_SALARY_OPTIONS}
              placeholder="Chọn ngày chốt lương"
              open={dateGetSalarySelectOpen}
              onOpen={() => setDateGetSalarySelectOpen(true)}
              onClose={() => setDateGetSalarySelectOpen(false)}
              onSelect={(value) => {
                setForm((prev) => ({ ...prev, date_get_salary: value }));
                setDateGetSalarySelectOpen(false);
              }}
              disabled={!canEdit}
            />
          </View>
          <SelectField
            label="Giờ làm/ngày (giờ/tháng) *"
            value={form.hour_working_on_day}
            options={HOUR_WORKING_ON_DAY_OPTIONS}
            placeholder="Chọn giờ làm"
            open={hourWorkingSelectOpen}
            onOpen={() => setHourWorkingSelectOpen(true)}
            onClose={() => setHourWorkingSelectOpen(false)}
            onSelect={(value) => {
              setForm((prev) => ({ ...prev, hour_working_on_day: value }));
              setHourWorkingSelectOpen(false);
            }}
            disabled={!canEdit}
          />
          <ChoiceGroup<StaffSalaryBy>
            label="Lương theo *"
            value={form.salary_by}
            options={SALARY_BY_OPTIONS}
            onSelect={(value) => setForm((prev) => ({ ...prev, salary_by: value }))}
            disabled={!canEdit}
          />
          <Field label={`Mức lương (${getSalaryByLabel(form.salary_by)}) *`} value={formatMoney(form.salary_value)} onChangeText={set('salary_value')} placeholder="6.500.000" keyboardType="numeric" editable={canEdit} mono />

          {hasSalaryChanged ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Mức lương đã thay đổi</Text>
              <Field label="Ngày bắt đầu áp dụng *" value={salaryApplyDate} onChangeText={setSalaryApplyDate} placeholder="YYYY-MM-DD" editable={canEdit} mono />
              <Text style={styles.warningText}>
                Trước {formatShortDate(salaryApplyDate)}, lương cũ là {formatVnd(original?.salary_value || 0)} / {getSalaryByLabel(original?.salary_by || 'h')}.
              </Text>
            </View>
          ) : null}

          <WorkingHoursEditor
            items={form.working_hours}
            editable={canEdit}
            onChange={updateWorkingHour}
            onAdd={() => setForm((prev) => ({ ...prev, working_hours: addDefaultWorkingHour(prev.working_hours) }))}
            onRemove={(hash) => setForm((prev) => ({ ...prev, working_hours: prev.working_hours.filter((item) => item.hash !== hash) }))}
          />

          <ChoiceGroup<StaffWorkingStatus>
            label="Trạng thái *"
            value={form.status_working}
            options={STATUS_WORKING_OPTIONS}
            onSelect={(value) => setForm((prev) => ({ ...prev, status_working: value }))}
            disabled={!canEdit}
          />
        </Section>

        {isEdit ? (
          <>
            <Section title="PHÚC LỢI & KHẤU TRỪ">
              <View style={styles.statGrid}>
                <Stat label="Hoa hồng" value={`+${formatVnd(form.current_commission)}`} color={Colors.success} />
                <Stat label="Thưởng" value={`+${formatVnd(form.current_bonus)}`} color={Colors.success} />
                <Stat label={`Tăng ca (${form.overtime_hour}h)`} value={`+${formatVnd(overtimeIncome)}`} color={Colors.success} />
                <Stat label="Phạt" value={`-${formatVnd(form.current_fined)}`} color={Colors.danger} />
                <Stat label="Tạm ứng" value={`-${formatVnd(form.current_advence)}`} color={Colors.danger} />
                <Stat label={`Nghỉ (${form.day_off_hour}h)`} value={`-${formatVnd(dayoffDeduction)}`} color={Colors.danger} />
              </View>
            </Section>

            <Section title="THỐNG KÊ LƯƠNG KỲ HIỆN TẠI">
              <View style={styles.salaryLine}>
                <Text style={styles.salaryLabel}>Ngày công</Text>
                <Text style={styles.salaryValue}>{form.current_day_working || 0} ngày</Text>
              </View>
              <View style={styles.salaryLine}>
                <Text style={styles.salaryLabel}>Lương cơ bản</Text>
                <Text style={styles.salaryValue}>{formatVnd(calculatedBaseSalary)}</Text>
              </View>
              <View style={styles.salaryLine}>
                <Text style={[styles.salaryLabel, { color: Colors.success }]}>+ Thu nhập</Text>
                <Text style={[styles.salaryValue, { color: Colors.success }]}>+{formatVnd(totalIncome)}</Text>
              </View>
              <View style={styles.salaryLine}>
                <Text style={[styles.salaryLabel, { color: Colors.danger }]}>- Khấu trừ</Text>
                <Text style={[styles.salaryValue, { color: Colors.danger }]}>-{formatVnd(totalDeduction)}</Text>
              </View>
              <View style={styles.takeHomeBox}>
                <Text style={styles.takeHomeLabel}>THỰC LÃNH</Text>
                <Text style={styles.takeHomeValue}>{formatVnd(takeHome)}</Text>
              </View>
              <Text style={[styles.totalSalaryText, { color: colors.textSecondary }]}>
                Tổng từ trước đến nay: {formatVnd(form.total_salary)} ({form.total_day_working || 0} ngày công)
              </Text>
            </Section>

            {form.lst_6_month.length > 0 ? (
              <Section title="BẢNG LƯƠNG">
                <View style={styles.downloadWrap}>
                  {form.lst_6_month.map((item) => (
                    <TouchableOpacity key={`${item.month}-${item.year}`} style={styles.downloadChip} onPress={() => handleDownloadSalary(item.month, item.year)}>
                      <Ionicons name="download-outline" size={14} color={Colors.primary} />
                      <Text style={styles.downloadText}>Tháng {item.month}/{item.year}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Section>
            ) : null}

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteText}>Xóa nhân viên</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useThemeMode();
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      {children}
    </View>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  mono?: boolean;
};

function Field({ label, mono, multiline, numberOfLines, style, editable = true, ...props }: FieldProps) {
  const { colors } = useThemeMode();
  const placeholderColor = colors.text === Colors.textDark ? 'rgba(244,241,232,0.6)' : 'rgba(26,26,26,0.45)';

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        {...props}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.fieldInput,
          mono && styles.fieldInputMono,
          multiline && styles.fieldInputMultiline,
          !editable && styles.disabledInput,
          { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          style,
        ]}
        placeholderTextColor={placeholderColor}
      />
    </View>
  );
}

const parseDateInput = (value: string) => {
  const normalized = toDateInput(value);
  const parsed = normalized ? new Date(`${normalized}T00:00:00`) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatDateInput = (date: Date) => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

function DatePickerField({
  label,
  value,
  open,
  onOpen,
  onClose,
  onSelect,
  disabled,
}: {
  label: string;
  value: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  const { colors } = useThemeMode();
  const datePlaceholderColor =
    colors.text === Colors.textDark ? 'rgba(244, 241, 232, 0.42)' : 'rgba(26, 26, 26, 0.32)';
  const [visibleMonth, setVisibleMonth] = useState(() => parseDateInput(value));
  const selectedDate = parseDateInput(value);

  useEffect(() => {
    if (open) setVisibleMonth(parseDateInput(value));
  }, [open, value]);

  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const leadingBlankCount = firstDay.getDay();
  const cells = [
    ...Array.from({ length: leadingBlankCount }, (_, index) => ({ key: `blank-${index}`, day: 0 })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 })),
  ];

  const moveMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };
  const moveYear = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear() + offset, current.getMonth(), 1));
  };
  const setMonth = (month: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), month, 1));
  };

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onOpen}
        disabled={disabled}
        style={[
          styles.dateButton,
          { backgroundColor: colors.card, borderColor: colors.border },
          disabled && styles.disabledInput,
        ]}
      >
        <Ionicons name="calendar-outline" size={17} color={Colors.primary} />
        <Text style={[styles.dateButtonText, { color: value ? colors.text : datePlaceholderColor }]}>
          {value ? formatShortDate(value) : 'Chọn ngày'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal transparent animationType="fade" visible={open} onRequestClose={onClose}>
        <Pressable style={styles.selectBackdrop} onPress={onClose}>
          <Pressable style={[styles.calendarPanel, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={styles.calendarNavBtn} onPress={() => moveMonth(-1)}>
                <Ionicons name="chevron-back" size={19} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                Tháng {visibleMonth.getMonth() + 1}/{visibleMonth.getFullYear()}
              </Text>
              <TouchableOpacity style={styles.calendarNavBtn} onPress={() => moveMonth(1)}>
                <Ionicons name="chevron-forward" size={19} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.calendarYearControls, { backgroundColor: `${Colors.primary}12`, borderColor: colors.border }]}>
              <TouchableOpacity style={styles.calendarYearBtn} onPress={() => moveYear(-10)}>
                <Text style={[styles.calendarYearBtnText, { color: colors.textSecondary }]}>-10</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calendarYearBtn} onPress={() => moveYear(-1)}>
                <Ionicons name="remove" size={15} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.calendarYearText, { color: colors.text }]}>{visibleMonth.getFullYear()}</Text>
              <TouchableOpacity style={styles.calendarYearBtn} onPress={() => moveYear(1)}>
                <Ionicons name="add" size={15} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.calendarYearBtn} onPress={() => moveYear(10)}>
                <Text style={[styles.calendarYearBtnText, { color: colors.textSecondary }]}>+10</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.calendarMonthGrid, { backgroundColor: `${Colors.primary}0D`, borderColor: colors.border }]}>
              {Array.from({ length: 12 }, (_, index) => {
                const active = visibleMonth.getMonth() === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.calendarMonthChip, active && styles.calendarMonthChipActive]}
                    onPress={() => setMonth(index)}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.calendarMonthText, { color: active ? '#fff' : colors.textSecondary }]}>
                      T{index + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.weekdayRow}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                <Text key={day} style={[styles.weekdayText, { color: colors.textSecondary }]}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {cells.map((cell) => {
                if (!cell.day) return <View key={cell.key} style={styles.calendarCell} />;
                const cellDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), cell.day);
                const cellValue = formatDateInput(cellDate);
                const active = cellValue === formatDateInput(selectedDate);

                return (
                  <TouchableOpacity
                    key={cell.key}
                    style={[styles.calendarCell, active && styles.calendarCellActive]}
                    onPress={() => onSelect(cellValue)}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.calendarCellText, { color: active ? '#fff' : colors.text }]}>
                      {cell.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              <TouchableOpacity onPress={onClose} style={styles.calendarSecondaryBtn}>
                <Text style={[styles.calendarSecondaryText, { color: colors.textSecondary }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onSelect(todayInput())} style={styles.calendarPrimaryBtn}>
                <Text style={styles.calendarPrimaryText}>Hôm nay</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  placeholder = 'Chọn giá trị',
  open,
  onOpen,
  onClose,
  onSelect,
  disabled,
}: {
  label: string;
  value: T | string;
  options: Array<{ label: string; value: T }>;
  placeholder?: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (value: T) => void;
  disabled?: boolean;
}) {
  const { colors } = useThemeMode();
  const selectedLabel = options.find((item) => String(item.value) === String(value))?.label || placeholder;

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onOpen}
        disabled={disabled}
        style={[
          styles.selectButton,
          { backgroundColor: colors.card, borderColor: colors.border },
          disabled && styles.disabledInput,
        ]}
      >
        <Text style={[styles.selectButtonText, { color: value ? colors.text : colors.textSecondary }]} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal transparent animationType="fade" visible={open} onRequestClose={onClose}>
        <Pressable style={styles.selectBackdrop} onPress={onClose}>
          <Pressable style={[styles.selectPanel, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <View style={styles.selectPanelHeader}>
              <Text style={[styles.selectPanelTitle, { color: colors.text }]}>{label.replace(' *', '')}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectOptions} showsVerticalScrollIndicator={false}>
              {options.map((item) => {
                const active = String(item.value) === String(value);
                return (
                  <TouchableOpacity
                    key={String(item.value)}
                    style={[styles.selectOption, active && styles.selectOptionActive]}
                    onPress={() => onSelect(item.value)}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.selectOptionText, { color: active ? Colors.primary : colors.text }]}>
                      {item.label}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={18} color={Colors.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onSelect,
  disabled,
  compact,
}: {
  label: string;
  value: T | string;
  options: Array<{ label: string; value: T }>;
  onSelect: (value: T) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const { colors } = useThemeMode();
  return (
    <View style={styles.choiceBlock}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.choiceWrap}>
        {options.map((item) => {
          const active = String(value) === String(item.value);
          return (
            <TouchableOpacity
              key={String(item.value)}
              style={[styles.choiceChip, compact && styles.choiceChipCompact, { borderColor: colors.border, backgroundColor: colors.card }, active && styles.choiceChipActive, disabled && styles.choiceChipDisabled]}
              onPress={() => onSelect(item.value)}
              disabled={disabled}
            >
              <Text style={[styles.choiceText, { color: colors.textSecondary }, active && styles.choiceTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function DynamicFormFields({
  fields,
  values,
  onChange,
  editable,
}: {
  fields: DynamicField[];
  values: StaffDynamicFormValues;
  onChange: (key: string) => (value: string) => void;
  editable: boolean;
}) {
  const normalized = fields
    .map((field) => ({
      key: field.name || field.key || '',
      label: field.label || field.title || field.name || field.key || '',
      placeholder: field.placeholder || '',
    }))
    .filter((field) => field.key && field.label);

  if (normalized.length === 0) return null;

  return (
    <View style={styles.dynamicWrap}>
      {normalized.map((field) => (
        <Field
          key={field.key}
          label={field.label}
          value={String(values[field.key] ?? '')}
          onChangeText={onChange(field.key)}
          placeholder={field.placeholder}
          editable={editable}
        />
      ))}
    </View>
  );
}

function WorkingHoursEditor({
  items,
  editable,
  onChange,
  onAdd,
  onRemove,
}: {
  items: StaffWorkingHour[];
  editable: boolean;
  onChange: (hash: string, key: keyof Pick<StaffWorkingHour, 'start' | 'end'>, value: string) => void;
  onAdd: () => void;
  onRemove: (hash: string) => void;
}) {
  const { colors } = useThemeMode();
  return (
    <View style={styles.workingWrap}>
      <View style={styles.workingHeader}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Ca làm việc</Text>
        <TouchableOpacity onPress={onAdd} disabled={!editable}>
          <Text style={[styles.addShiftText, !editable && styles.disabledText]}>+ Thêm ca</Text>
        </TouchableOpacity>
      </View>
      {items.map((item, index) => (
        <View key={item.hash} style={[styles.shiftCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.shiftCardHeader}>
            <Text style={[styles.shiftIndex, { color: colors.textSecondary }]}>Ca {index + 1}</Text>
            <TouchableOpacity onPress={() => onRemove(item.hash)} disabled={!editable || items.length <= 1}>
              <Ionicons name="remove-circle-outline" size={18} color={editable && items.length > 1 ? Colors.danger : colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.shiftTimeRow}>
            <View style={styles.shiftTimeField}>
              <Text style={[styles.shiftTimeLabel, { color: colors.textSecondary }]}>Bắt đầu</Text>
              <TextInput
                value={item.start}
                onChangeText={(value) => onChange(item.hash, 'start', value)}
                editable={editable}
                placeholder="08:00"
                style={[styles.shiftInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              />
            </View>
            <View style={styles.shiftTimeField}>
              <Text style={[styles.shiftTimeLabel, { color: colors.textSecondary }]}>Kết thúc</Text>
              <TextInput
                value={item.end}
                onChangeText={(value) => onChange(item.hash, 'end', value)}
                editable={editable}
                placeholder="12:00"
                style={[styles.shiftInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useThemeMode();
  return (
    <View style={[styles.statItem, { backgroundColor: colors.background }]}>
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.bodySm,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 8,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerMain: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
  },
  headerSub: {
    ...Typography.caption,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveTxt: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
  content: {
    padding: Spacing.lg,
    gap: 10,
    paddingBottom: 36,
  },
  profileCard: {
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
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.h2,
    color: Colors.primary,
    fontWeight: '800',
  },
  profileBody: {
    flex: 1,
  },
  profileName: {
    ...Typography.h4,
    fontSize: 17,
  },
  profileMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    ...Shadow.sm,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  accessHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  accessTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  accessTitle: {
    ...Typography.bodySm,
    fontWeight: '700',
  },
  accessStatus: {
    ...Typography.caption,
    marginTop: 2,
    fontWeight: '700',
  },
  roleDetailBtn: {
    minHeight: 40,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  roleDetailBtnText: {
    ...Typography.bodySm,
    fontWeight: '800',
  },
  fieldWrap: {
    flex: 1,
    minWidth: 0,
    marginTop: 7,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: Colors.text,
    backgroundColor: Colors.card,
    fontSize: 13,
    fontWeight: '600',
  },
  fieldInputMono: {
    fontFamily: 'monospace',
  },
  fieldInputMultiline: {
    minHeight: 62,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  disabledInput: {
    opacity: 0.72,
  },
  dateButton: {
    minHeight: 42,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dateButtonText: {
    ...Typography.bodySm,
    flex: 1,
    fontWeight: '700',
  },
  calendarPanel: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 12,
    ...Shadow.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarNavBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  calendarTitle: {
    ...Typography.bodyMd,
    fontWeight: '800',
  },
  calendarYearControls: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  calendarYearBtn: {
    minWidth: 42,
    height: 32,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  calendarYearBtnText: {
    ...Typography.captionMd,
    fontWeight: '800',
  },
  calendarYearText: {
    ...Typography.bodyMd,
    minWidth: 58,
    textAlign: 'center',
    fontWeight: '900',
  },
  calendarMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 7,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 8,
  },
  calendarMonthChip: {
    width: '23.5%',
    minHeight: 32,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  calendarMonthChipActive: {
    backgroundColor: Colors.primary,
  },
  calendarMonthText: {
    ...Typography.captionMd,
    fontWeight: '800',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayText: {
    ...Typography.caption,
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  calendarCellActive: {
    backgroundColor: Colors.primary,
  },
  calendarCellText: {
    ...Typography.bodySm,
    fontWeight: '800',
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  calendarSecondaryBtn: {
    minWidth: 72,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarSecondaryText: {
    ...Typography.bodySm,
    fontWeight: '700',
  },
  calendarPrimaryBtn: {
    minWidth: 92,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  calendarPrimaryText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '800',
  },
  selectButton: {
    minHeight: 42,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectButtonText: {
    ...Typography.bodySm,
    flex: 1,
    fontWeight: '700',
  },
  selectBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  selectPanel: {
    maxHeight: '72%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 12,
    ...Shadow.md,
  },
  selectPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  selectPanelTitle: {
    ...Typography.bodyMd,
    fontWeight: '800',
  },
  selectOptions: {
    marginTop: 2,
  },
  selectOption: {
    minHeight: 42,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  selectOptionText: {
    ...Typography.bodySm,
    fontWeight: '700',
  },
  choiceBlock: {
    marginTop: 8,
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  choiceChip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: Colors.card,
  },
  choiceChipCompact: {
    minWidth: 34,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  choiceChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  choiceChipDisabled: {
    opacity: 0.72,
  },
  choiceText: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  choiceTextActive: {
    color: '#fff',
  },
  dynamicWrap: {
    marginTop: 4,
  },
  warningBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f3c27c',
    backgroundColor: '#fff7ed',
    borderRadius: Radius.md,
    padding: 10,
  },
  warningTitle: {
    ...Typography.captionMd,
    color: '#b45309',
    fontWeight: '800',
  },
  warningText: {
    ...Typography.caption,
    color: '#92400e',
    marginTop: 6,
  },
  workingWrap: {
    marginTop: 10,
  },
  workingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addShiftText: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '800',
  },
  disabledText: {
    opacity: 0.5,
  },
  shiftCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    marginTop: 7,
  },
  shiftCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  shiftIndex: {
    ...Typography.captionMd,
    fontWeight: '800',
  },
  shiftTimeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shiftTimeField: {
    flex: 1,
    minWidth: 0,
  },
  shiftTimeLabel: {
    ...Typography.caption,
    marginBottom: 4,
  },
  shiftInput: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: 'monospace',
    fontWeight: '700',
    minWidth: 0,
    textAlign: 'center',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    width: '31.5%',
    borderRadius: Radius.md,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.captionMd,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  statLabel: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: 3,
  },
  salaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderStyle: 'dashed',
  },
  salaryLabel: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  salaryValue: {
    ...Typography.bodySm,
    color: Colors.text,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  takeHomeBox: {
    marginTop: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.successLight,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  takeHomeLabel: {
    ...Typography.bodySm,
    color: Colors.success,
    fontWeight: '800',
  },
  takeHomeValue: {
    ...Typography.h4,
    color: Colors.success,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  totalSalaryText: {
    ...Typography.caption,
    marginTop: 9,
    textAlign: 'center',
  },
  downloadWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  downloadChip: {
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  downloadText: {
    ...Typography.captionMd,
    color: Colors.primary,
    fontWeight: '700',
  },
  deleteBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    ...Typography.bodySm,
    color: Colors.danger,
    fontWeight: '800',
  },
});
