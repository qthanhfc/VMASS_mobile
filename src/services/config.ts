export const API_BASE_URL =
  process.env.EXPO_PUBLIC_VMASS_API_URL?.trim() || 'https://server.vmass.vn';
export const REALTIME_URL =
  process.env.EXPO_PUBLIC_VMASS_REALTIME_URL?.trim() || API_BASE_URL;

export const STORE_BASE_DOMAIN =
  process.env.EXPO_PUBLIC_VMASS_STORE_DOMAIN?.trim() || 'vmass.vn';

export const TOKEN_STORAGE_KEY = 'access_token';
export const PASSWORD_LAST_CHANGED_AT_KEY = 'password_last_changed_at';
