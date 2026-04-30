import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORE_BASE_DOMAIN, TOKEN_STORAGE_KEY } from './config';
import { request } from './http';

export type LoginPayload = {
  username: string;
  password: string;
  domain?: string;
};

export type RegisterPayload = {
  fullname: string;
  phone: string;
  email: string;
  businessType: string;
  domain: string;
  password: string;
  url?: string;
};

export type QuickRegisterPayload = {
  fullname: string;
  username: string;
  domain: string;
  password: string;
  repassword: string;
};

type SignInResponse = {
  token?: string;
  user?: unknown;
  responseText?: string;
};

type SignUpResponse = {
  token?: string;
  user?: unknown;
  responseText?: string;
};

type DomainAvailabilityResponse = {
  isAvailable: boolean;
  message?: string;
};

type ForgotPasswordResponse = {
  responseText?: string;
  message?: string;
};

export type VerifyForgotPasswordPayload = {
  code: string;
  password: string;
  repassword: string;
};

const normalizeDomain = (domain?: string) =>
  (domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\.vmass\.vn$/i, '')
    .replace(/\/.*$/, '');

const normalizeStoreValue = (raw: string) =>
  (raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/\.vmass\.vn$/i, '')
    .split('.')[0];

const deriveDomainFromUsername = (username: string) => {
  const normalizedUsername = normalizeStoreValue(username);

  if (!normalizedUsername) {
    return '';
  }

  // Match backend SignIn special-case for super admin account
  if (normalizedUsername === 'vmass') {
    return 'admin';
  }

  return normalizedUsername;
};

export async function signIn(payload: LoginPayload) {
  const normalizedUsername = normalizeStoreValue(payload.username);
  const normalizedDomain =
    normalizeDomain(payload.domain) || deriveDomainFromUsername(normalizedUsername);

  const res = await request<SignInResponse>({
    method: 'POST',
    path: '/auth/signin',
    includeAuth: false,
    body: {
      username: normalizedUsername,
      password: payload.password,
      domain: normalizedDomain,
    },
  });

  if (res.token) {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, res.token);
  }

  return res;
}

export async function checkDomainAvailability(domain: string) {
  const normalizedDomain = normalizeDomain(domain);

  return request<DomainAvailabilityResponse>({
    method: 'GET',
    path: `/user/check-domain-availability?domain=${encodeURIComponent(normalizedDomain)}`,
    includeAuth: false,
  });
}

export async function signUp(payload: RegisterPayload) {
  const res = await request<SignUpResponse>({
    method: 'POST',
    path: '/auth/signup',
    includeAuth: false,
    body: {
      phone: payload.phone.trim(),
      password: payload.password,
      fullname: payload.fullname.trim(),
      businessType: payload.businessType.trim(),
      domain: normalizeDomain(payload.domain),
      url: (payload.url || STORE_BASE_DOMAIN).trim(),
      email: payload.email.trim(),
    },
  });

  if (res.token) {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, res.token);
  }

  return res;
}

export async function signUpQuick(payload: QuickRegisterPayload) {
  const res = await request<SignUpResponse>({
    method: 'POST',
    path: '/auth/signup_quick',
    includeAuth: false,
    body: {
      fullname: payload.fullname.trim(),
      username: payload.username.trim(),
      domain: normalizeDomain(payload.domain),
      password: payload.password,
      repassword: payload.repassword,
    },
  });

  if (res.token) {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, res.token);
  }

  return res;
}

export async function requestForgotPassword({
  username,
  domain,
}: {
  username: string;
  domain?: string;
}) {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedDomain = normalizeDomain(domain) || deriveDomainFromUsername(normalizedUsername);

  const res = await request<ForgotPasswordResponse>({
    method: 'POST',
    path: '/user/forget-password',
    includeAuth: false,
    body: {
      username: normalizedUsername,
      domain: normalizedDomain,
    },
  });

  return res;
}

export async function verifyForgotPassword(payload: VerifyForgotPasswordPayload) {
  const res = await request<ForgotPasswordResponse>({
    method: 'POST',
    path: '/user/verify-forget-password',
    includeAuth: false,
    body: {
      code: payload.code.trim(),
      password: payload.password,
      repassword: payload.repassword,
    },
  });

  return res;
}

export async function signOut() {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}
