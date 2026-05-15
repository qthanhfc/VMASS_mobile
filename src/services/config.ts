import { resolveRuntimeApiUrl } from './runtimeUrl';

const PROD_API_BASE_URL = 'https://server.vmass.vn';
const isDevRuntime = typeof __DEV__ !== 'undefined' && __DEV__;

const rawApiBaseUrl = isDevRuntime
  ? process.env.EXPO_PUBLIC_VMASS_API_URL?.trim() ||
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    process.env.SERVER_VMASS_URL?.trim() ||
    PROD_API_BASE_URL
  : process.env.SERVER_VMASS_URL?.trim() || PROD_API_BASE_URL;

export const API_BASE_URL = resolveRuntimeApiUrl(rawApiBaseUrl);

const deriveRealtimeFallbackUrl = (apiBaseUrl: string) => {
  try {
    const parsed = new URL(apiBaseUrl);
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return apiBaseUrl.replace(/\/api\/?$/i, '').replace(/\/$/, '');
  }
};

const rawRealtimeUrl =
  process.env.EXPO_PUBLIC_VMASS_REALTIME_URL?.trim() || deriveRealtimeFallbackUrl(API_BASE_URL);

export const REALTIME_URL = resolveRuntimeApiUrl(rawRealtimeUrl);

export const STORE_BASE_DOMAIN =
  process.env.EXPO_PUBLIC_VMASS_STORE_DOMAIN?.trim() || 'vmass.vn';

export const TOKEN_STORAGE_KEY = 'access_token';
export const PASSWORD_LAST_CHANGED_AT_KEY = 'password_last_changed_at';
