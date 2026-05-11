import type { Staff, StaffSalaryBy, StaffWorkingHour, StaffWorkingStatus } from '../types';

export type StaffOption<T extends string = string> = {
  label: string;
  value: T;
};

export const POSITION_OPTIONS: StaffOption[] = [
  { label: 'Quản lý', value: 'Quản lý' },
  { label: 'Kế toán', value: 'Kế toán' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Thu ngân', value: 'Thu ngân' },
  { label: 'Bếp', value: 'Bếp' },
  { label: 'Pha chế', value: 'Pha chế' },
  { label: 'Phục vụ', value: 'Phục vụ' },
  { label: 'Bảo vệ', value: 'Bảo vệ' },
  { label: 'Vệ sinh', value: 'Vệ sinh' },
  { label: 'Giao hàng', value: 'Giao hàng' },
];

export const SALARY_BY_OPTIONS: Array<StaffOption<StaffSalaryBy>> = [
  { label: 'Giờ', value: 'h' },
  { label: 'Ngày', value: 'd' },
  { label: 'Tháng', value: 'm' },
];

export const STATUS_WORKING_OPTIONS: Array<StaffOption<StaffWorkingStatus>> = [
  { label: 'Đang làm', value: 'on' },
  { label: 'Nghỉ việc', value: 'off' },
];

export const DATE_GET_SALARY_OPTIONS = Array.from({ length: 31 }, (_, index) => ({
  label: String(index + 1),
  value: String(index + 1),
}));

export const HOUR_WORKING_ON_DAY_OPTIONS = Array.from({ length: 24 }, (_, index) => ({
  label: String(index + 1),
  value: String(index + 1),
}));

const randomHash = () => Math.random().toString(36).slice(2, 7).toUpperCase();

export const normalizeNumberString = (value: unknown) =>
  String(value ?? '').replace(/[,.](?=\d{3}(\D|$))/g, '').replace(/[^\d.-]/g, '');

export const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(normalizeNumberString(value));
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const formatMoney = (value: unknown) =>
  Math.round(toNumber(value)).toLocaleString('vi-VN');

export const formatVnd = (value: unknown) => `${formatMoney(value)} đ`;

export const normalizeText = (value: unknown) => String(value ?? '').trim();

export const toDateInput = (value: unknown) => {
  const raw = normalizeText(value);
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split('/');
    return `${year}-${month}-${day}`;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const formatShortDate = (value: unknown) => {
  const raw = toDateInput(value);
  if (!raw) return '-';
  const [year, month, day] = raw.split('-');
  if (!year || !month || !day) return raw;
  return `${day}/${month}/${year}`;
};

export const workingHoursFromString = (value: unknown): StaffWorkingHour[] => {
  const raw = normalizeText(value);
  if (!raw) return [];

  return raw
    .split('|')
    .map((range) => {
      const [start, end] = range.split('-').map((item) => item.trim());
      if (!start || !end) return null;
      return { hash: randomHash(), start, end };
    })
    .filter((item): item is StaffWorkingHour => Boolean(item));
};

export const workingHoursToString = (items: StaffWorkingHour[]) =>
  items
    .filter((item) => item.start && item.end)
    .map((item) => `${item.start}-${item.end}`)
    .join('|');

export const getSalaryByLabel = (value: StaffSalaryBy | string) =>
  SALARY_BY_OPTIONS.find((item) => item.value === value)?.label || 'Giờ';

export const getStatusWorkingLabel = (value: StaffWorkingStatus | string) =>
  STATUS_WORKING_OPTIONS.find((item) => item.value === value)?.label || 'Đang làm';

export const addDefaultWorkingHour = (current: StaffWorkingHour[]) => {
  const last = current[current.length - 1];
  if (!last) return [...current, { hash: randomHash(), start: '08:00', end: '12:00' }];

  const [hourRaw, minuteRaw] = last.end.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const endHour = Number.isFinite(hour) ? (hour + 4) % 24 : 17;
  const minuteText = Number.isFinite(minute) ? String(minute).padStart(2, '0') : '00';

  return [
    ...current,
    {
      hash: randomHash(),
      start: last.end,
      end: `${String(endHour).padStart(2, '0')}:${minuteText}`,
    },
  ];
};

export const calculateBaseSalary = (staff: Pick<Staff, 'salary_by' | 'salary_value' | 'current_day_working' | 'hour_working_on_day'>) => {
  const salaryValue = toNumber(staff.salary_value);
  const workingDays = toNumber(staff.current_day_working);
  const hoursPerDay = toNumber(staff.hour_working_on_day, 8);

  if (staff.salary_by === 'h') return Math.round(salaryValue * hoursPerDay * workingDays);
  if (staff.salary_by === 'd') return Math.round(salaryValue * workingDays);
  return Math.round((salaryValue / 30) * workingDays);
};

export const calculateDayoffDeduction = (
  staff: Pick<Staff, 'salary_by' | 'salary_value' | 'hour_working_on_day' | 'day_off_hour'>,
) => {
  const salaryValue = toNumber(staff.salary_value);
  const hoursPerDay = toNumber(staff.hour_working_on_day, 8);
  const dayoffHours = toNumber(staff.day_off_hour);

  if (staff.salary_by === 'h') return Math.round(salaryValue * dayoffHours);
  if (staff.salary_by === 'd') return Math.round((salaryValue / hoursPerDay) * dayoffHours);
  return Math.round((salaryValue / 30 / hoursPerDay) * dayoffHours);
};

export const calculateOvertimeIncome = (
  staff: Pick<Staff, 'salary_by' | 'salary_value' | 'hour_working_on_day' | 'overtime_hour'>,
) => {
  const salaryValue = toNumber(staff.salary_value);
  const hoursPerDay = toNumber(staff.hour_working_on_day, 8);
  const overtimeHours = toNumber(staff.overtime_hour);

  if (staff.salary_by === 'h') return Math.round(salaryValue * overtimeHours);
  if (staff.salary_by === 'd') return Math.round((salaryValue / hoursPerDay) * overtimeHours);
  return Math.round((salaryValue / 30 / hoursPerDay) * overtimeHours);
};

export const findStaffUpdateSetting = (next: Staff, original: Staff | null) => {
  const normalizedSalary = normalizeNumberString(next.salary_value);
  if (!original) {
    return {
      date_get_salary: next.date_get_salary,
      salary_by: next.salary_by,
      salary_value: normalizedSalary,
      hour_working_on_day: next.hour_working_on_day,
      working_hours: workingHoursToString(next.working_hours),
    };
  }

  const originalWorkingHours = workingHoursToString(original.working_hours);
  const nextWorkingHours = workingHoursToString(next.working_hours);

  return {
    date_get_salary: next.date_get_salary !== original.date_get_salary ? next.date_get_salary : null,
    salary_by: next.salary_by !== original.salary_by ? next.salary_by : null,
    salary_value: normalizedSalary !== normalizeNumberString(original.salary_value) ? normalizedSalary : null,
    hour_working_on_day:
      String(next.hour_working_on_day) !== String(original.hour_working_on_day) ? next.hour_working_on_day : null,
    working_hours: nextWorkingHours !== originalWorkingHours ? nextWorkingHours : null,
  };
};
