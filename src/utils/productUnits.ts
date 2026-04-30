import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StockUnit } from '../services/products';

type UnitGroup = {
  businessTypes: string[];
  units: string[];
};

const UNIT_GROUPS: UnitGroup[] = [
  {
    businessTypes: ['cafe'],
    units: ['ly', 'cốc', 'chai', 'lon', 'phần'],
  },
  {
    businessTypes: ['restaurant'],
    units: ['phần', 'suất', 'đĩa', 'tô', 'bát', 'khay'],
  },
  {
    businessTypes: ['fashion'],
    units: ['cái', 'chiếc', 'bộ', 'đôi', 'set'],
  },
  {
    businessTypes: ['cosmetics', 'beauty'],
    units: ['chai', 'lọ', 'tuýp', 'hũ', 'hộp', 'set'],
  },
  {
    businessTypes: ['grocery'],
    units: ['gói', 'hộp', 'chai', 'lon', 'túi', 'thùng'],
  },
  {
    businessTypes: ['retail', 'shop'],
    units: ['cái', 'chiếc', 'bộ', 'hộp', 'gói', 'set'],
  },
];

const DEFAULT_UNITS = ['cái', 'chiếc', 'bộ', 'hộp', 'gói'];
const CUSTOM_UNITS_STORAGE_KEY = 'vmass_custom_units_by_business_type';

type CustomUnitsMap = Record<string, string[]>;

const normalizeBusinessType = (businessType?: string) =>
  (businessType || 'default').trim().toLowerCase() || 'default';

export function getUnitsForBusinessType(
  businessType?: string,
  backendUnits: StockUnit[] = [],
  currentUnit?: string,
  customUnits: string[] = [],
) {
  const normalized = normalizeBusinessType(businessType);
  const group = UNIT_GROUPS.find((item) => item.businessTypes.includes(normalized));
  const baseUnits = group?.units || DEFAULT_UNITS;
  const normalizedBase = new Set(baseUnits.map((name) => name.trim().toLowerCase()));
  const matchingBackendUnits = backendUnits
    .map((item) => item.name)
    .filter((name) => normalizedBase.has(name.trim().toLowerCase()));
  const names = [...baseUnits, ...matchingBackendUnits, ...customUnits, currentUnit || ''].filter(Boolean);

  return Array.from(new Set(names.map((name) => name.trim()).filter(Boolean))).map((name) => ({
    id: name,
    name,
  }));
}

export async function loadCustomUnitsForBusinessType(businessType?: string) {
  const normalized = normalizeBusinessType(businessType);
  const raw = await AsyncStorage.getItem(CUSTOM_UNITS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CustomUnitsMap;
    return Array.isArray(parsed[normalized]) ? parsed[normalized] : [];
  } catch {
    return [];
  }
}

export async function saveCustomUnitForBusinessType(businessType: string | undefined, unitName: string) {
  const normalized = normalizeBusinessType(businessType);
  const cleanUnitName = unitName.trim();
  if (!cleanUnitName) return [];

  const raw = await AsyncStorage.getItem(CUSTOM_UNITS_STORAGE_KEY);
  let parsed: CustomUnitsMap = {};

  if (raw) {
    try {
      parsed = JSON.parse(raw) as CustomUnitsMap;
    } catch {
      parsed = {};
    }
  }

  const currentUnits = Array.isArray(parsed[normalized]) ? parsed[normalized] : [];
  const exists = currentUnits.some((item) => item.trim().toLowerCase() === cleanUnitName.toLowerCase());
  const nextUnits = exists ? currentUnits : [...currentUnits, cleanUnitName];

  parsed[normalized] = nextUnits;
  await AsyncStorage.setItem(CUSTOM_UNITS_STORAGE_KEY, JSON.stringify(parsed));

  return nextUnits;
}
