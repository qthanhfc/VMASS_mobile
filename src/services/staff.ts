import { request } from './http';
import type {
  Staff,
  StaffDynamicFormValues,
  StaffId,
  StaffPendingSetting,
  StaffSalaryArchive,
  StaffSalaryBy,
  StaffWorkingStatus,
} from '../types';
import {
  findStaffUpdateSetting,
  normalizeNumberString,
  normalizeText,
  toDateInput,
  toNumber,
  workingHoursFromString,
  workingHoursToString,
} from '../utils/staff';

export type StaffListParams = {
  pageSize?: number;
  currentPage?: number;
  search?: string;
};

export type StaffListResult = {
  items: Staff[];
  dynamicForm: unknown[];
  totalItem: number;
  totalPage: number;
  currentPage: number;
  staffLimit: number;
  totalStaff: number;
};

export type StaffLogType = 'commission' | 'bonus' | 'overtime_hour' | 'overtime_coefficient' | 'advence' | 'fined' | 'day_off_hour';

export type StaffLogDraft = {
  staffId: StaffId;
  logType: StaffLogType;
  value: string | number;
};

type ApiStaffSetting = {
  date_get_salary?: string | number | null;
  date_join?: string | null;
  hour_working_on_day?: string | number | null;
  permission_name?: string | null;
  salary_by?: StaffSalaryBy | string | null;
  salary_value?: string | number | null;
  status_working?: StaffWorkingStatus | string | null;
  working_hours?: string | null;
};

type ApiStaff = {
  id?: number | string | null;
  _id?: number | string | null;
  user_staff_id?: number | string | null;
  users_staff_id?: number | string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  birthday?: string | null;
  birth_day?: string | null;
  dob?: string | null;
  permission_name?: string | null;
  date_join?: string | null;
  date_get_salary?: string | number | null;
  salary_by?: StaffSalaryBy | string | null;
  salary_value?: string | number | null;
  hour_working_on_day?: string | number | null;
  status_working?: StaffWorkingStatus | string | null;
  working_hours?: string | null;
  setting?: ApiStaffSetting | null;
  dynamic_form?: StaffDynamicFormValues | null;
  current_commission?: number | string | null;
  current_bonus?: number | string | null;
  current_overtime?: number | string | null;
  current_advence?: number | string | null;
  current_fined?: number | string | null;
  current_dayoff?: number | string | null;
  current_day_working?: number | string | null;
  current_salary?: number | string | null;
  total_day_working?: number | string | null;
  total_salary?: number | string | null;
  pending_date?: StaffPendingSetting | null;
  pending_hour?: StaffPendingSetting | null;
  lst_6_month?: StaffSalaryArchive[] | null;
  overtime_hour?: number | string | null;
  day_off_hour?: number | string | null;
};

type ApiStaffListResponse = {
  data?: ApiStaff[];
  dataDynamicForm?: unknown[];
  totalItem?: number;
  totalPage?: number;
  currentPage?: number | string;
  staffLimit?: number | string | null;
  totalStaff?: number | string | null;
};

type ApiStaffDetailResponse = {
  data?: ApiStaff | string;
};

type ApiStaffMutationResponse = {
  data?: ApiStaff;
};

const asSalaryBy = (value: unknown): StaffSalaryBy => {
  if (value === 'd' || value === 'm') return value;
  return 'h';
};

const asWorkingStatus = (value: unknown): StaffWorkingStatus => (value === 'off' ? 'off' : 'on');

const mapStaff = (item: ApiStaff): Staff => {
  const setting = item.setting || {};
  const rawId = item.id ?? item.user_staff_id ?? item.users_staff_id ?? item._id;
  const rawIdText = normalizeText(rawId);
  const numericId = toNumber(rawId, Number.NaN);
  const id: StaffId = rawIdText || (Number.isFinite(numericId) ? numericId : '');
  const status = asWorkingStatus(setting.status_working ?? item.status_working);

  return {
    id,
    name: normalizeText(item.name) || 'Nhân viên chưa đặt tên',
    phone: normalizeText(item.phone),
    email: normalizeText(item.email) || undefined,
    address: normalizeText(item.address) || undefined,
    birthday: toDateInput(item.birthday ?? item.birth_day ?? item.dob) || undefined,
    permission_name: normalizeText(setting.permission_name ?? item.permission_name),
    date_join: toDateInput(setting.date_join ?? item.date_join),
    date_get_salary: normalizeText(setting.date_get_salary ?? item.date_get_salary) || '1',
    salary_by: asSalaryBy(setting.salary_by ?? item.salary_by),
    salary_value: normalizeNumberString(setting.salary_value ?? item.salary_value),
    hour_working_on_day: normalizeText(setting.hour_working_on_day ?? item.hour_working_on_day) || '8',
    working_hours: workingHoursFromString(setting.working_hours ?? item.working_hours),
    status_working: status,
    dynamic_form: item.dynamic_form || {},
    current_commission: toNumber(item.current_commission),
    current_bonus: toNumber(item.current_bonus),
    current_overtime: toNumber(item.current_overtime),
    current_advence: toNumber(item.current_advence),
    current_fined: toNumber(item.current_fined),
    current_dayoff: toNumber(item.current_dayoff),
    current_day_working: toNumber(item.current_day_working),
    current_salary: toNumber(item.current_salary),
    total_day_working: toNumber(item.total_day_working),
    total_salary: toNumber(item.total_salary),
    pending_date: item.pending_date || null,
    pending_hour: item.pending_hour || null,
    lst_6_month: item.lst_6_month || [],
    overtime_hour: toNumber(item.overtime_hour),
    day_off_hour: toNumber(item.day_off_hour),
    status: status === 'on' ? 'active' : 'inactive',
  };
};

const buildStaffBody = (form: Staff, original: Staff | null, salaryApplyDate?: string | null) => {
  const updateSetting = findStaffUpdateSetting(form, original);

  return {
    id: form.id,
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: normalizeText(form.email),
    address: normalizeText(form.address),
    birthday: toDateInput(form.birthday),
    permission_name: form.permission_name,
    status_working: form.status_working,
    date_join: form.date_join,
    date_get_salary: updateSetting.date_get_salary,
    salary_by: updateSetting.salary_by,
    salary_value: updateSetting.salary_value,
    hour_working_on_day: updateSetting.hour_working_on_day,
    working_hours: updateSetting.working_hours,
    dynamic_form: form.dynamic_form,
    salary_apply_date: salaryApplyDate || null,
  };
};

export async function listStaff({
  pageSize = 12,
  currentPage = 1,
  search = '',
}: StaffListParams = {}): Promise<StaffListResult> {
  const query = [
    `pageSize=${encodeURIComponent(String(pageSize))}`,
    `currentPage=${encodeURIComponent(String(currentPage))}`,
    `search=${encodeURIComponent(search)}`,
  ].join('&');

  const response = await request<ApiStaffListResponse>({
    method: 'GET',
    path: `/user-staff/json?${query}`,
  });

  const items = (response.data || []).map(mapStaff);
  const staffLimitValue = response.staffLimit === null || response.staffLimit === undefined
    ? Infinity
    : toNumber(response.staffLimit, Infinity);

  return {
    items,
    dynamicForm: response.dataDynamicForm || [],
    totalItem: response.totalItem ?? items.length,
    totalPage: response.totalPage ?? 1,
    currentPage: toNumber(response.currentPage, currentPage),
    staffLimit: staffLimitValue,
    totalStaff: toNumber(response.totalStaff, items.length),
  };
}

export async function getStaffDetail(id: StaffId): Promise<Staff> {
  const response = await request<ApiStaffDetailResponse>({
    method: 'GET',
    path: `/user-staff?user_staff_id=${encodeURIComponent(String(id))}`,
  });

  if (!response.data || typeof response.data === 'string') {
    throw new Error('Không tìm thấy nhân viên');
  }

  return mapStaff(response.data);
}

export async function createStaff(form: Staff): Promise<Staff | null> {
  const response = await request<ApiStaffMutationResponse>({
    method: 'POST',
    path: '/user-staff',
    body: {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: normalizeText(form.email),
      address: normalizeText(form.address),
      birthday: toDateInput(form.birthday),
      permission_name: form.permission_name,
      date_get_salary: form.date_get_salary,
      salary_by: form.salary_by,
      salary_value: normalizeNumberString(form.salary_value),
      hour_working_on_day: form.hour_working_on_day,
      status_working: form.status_working,
      date_join: form.date_join,
      working_hours: workingHoursToString(form.working_hours),
      dynamic_form: form.dynamic_form,
    },
  });

  return response.data ? mapStaff(response.data) : null;
}

export async function updateStaff(form: Staff, original: Staff | null, salaryApplyDate?: string | null) {
  return request({
    method: 'PUT',
    path: '/user-staff',
    body: buildStaffBody(form, original, salaryApplyDate),
  });
}

export async function deleteStaff(ids: StaffId[]) {
  return request({
    method: 'DELETE',
    path: '/user-staff',
    body: {
      arrayId: ids,
    },
  });
}

export async function addStaffLogs(logs: StaffLogDraft[]) {
  for (const log of logs) {
    await request({
      method: 'POST',
      path: '/user-staff/log',
      body: {
        users_staff_id: [log.staffId],
        [log.logType]: String(log.value),
      },
    });
  }
}

export async function saveStaffWelfare(staffId: StaffId, values: {
  current_commission?: string | number;
  current_bonus?: string | number;
  current_overtime?: string | number;
  current_fined?: string | number;
  current_advence?: string | number;
  current_dayoff?: string | number;
}) {
  return request({
    method: 'POST',
    path: '/user-staff/welfare',
    body: {
      user_staff_id: staffId,
      commission: toNumber(values.current_commission),
      bonus: toNumber(values.current_bonus),
      overtime: toNumber(values.current_overtime),
      fined: toNumber(values.current_fined),
      advence: toNumber(values.current_advence),
      dayoff: toNumber(values.current_dayoff),
    },
  });
}

export async function downloadStaffSalary(params: { id: StaffId; month: string | number; year: string | number }) {
  const response = await request<ApiStaffDetailResponse>({
    method: 'GET',
    path: `/user-staff?user_staff_id=${encodeURIComponent(String(params.id))}&month=${encodeURIComponent(String(params.month))}&year=${encodeURIComponent(String(params.year))}`,
  });

  return typeof response.data === 'string' ? response.data : '';
}
