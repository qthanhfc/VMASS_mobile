export const API_BASE_URL =
  process.env.EXPO_PUBLIC_VMASS_API_URL?.trim() || 'https://server.vmass.vn';

export const STORE_BASE_DOMAIN =
  process.env.EXPO_PUBLIC_VMASS_STORE_DOMAIN?.trim() || 'vmass.vn';

export const TOKEN_STORAGE_KEY = 'access_token';
export const PASSWORD_LAST_CHANGED_AT_KEY = 'password_last_changed_at';
