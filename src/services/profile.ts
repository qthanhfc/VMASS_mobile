import { API_BASE_URL } from './config';
import { request } from './http';

export type UserProfile = {
  id?: string | number;
  username?: string | null;
  fullname?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  image?: string | null;
  description?: string | null;
  address?: string | null;
  birthDate?: string | null;
  companyName?: string | null;
  companyUUID?: string | null;
  companyAddress?: string | null;
  hotline?: string | null;
  domain?: string | null;
  businessType?: string | null;
  companyImage?: string | null;
  companyLogo?: string | null;
  companyMenuHash?: string | null;
  companyWebsite?: string | null;
  companyStartTime?: string | null;
  companyEndTime?: string | null;
  namePay?: string | null;
  numberPay?: string | null;
  bankPay?: string | null;
  qrPayImage?: string | null;
};

type UserProfileResponse = {
  data?: UserProfile;
};

export type UserLicense = {
  id?: string | number;
  purchased_package?: string | null;
  pending_date?: string | null;
  expired_date?: string | null;
  expired_time?: string | null;
  upgraded?: boolean | null;
  pending?: boolean | null;
  isExpired?: boolean | null;
};

type UserLicenseResponse = {
  data?: UserLicense;
  responseText?: string;
};

export type UpgradeDuration = '1m' | '6m' | '1y' | '2y' | '5y' | 'forever';
export type LicensePackage = 'free' | 'basic' | 'pro' | 'pro_auto' | 'enterprise';

export type UpgradePreview = {
  package?: string;
  duration?: UpgradeDuration;
  originalPrice?: number;
  remainingValue?: number;
  creditBalance?: number;
  finalPrice?: number;
  surplus?: number;
};

export type DowngradePreview = {
  totalRemainingValue?: number;
  remainingDays?: number;
  totalMonths?: number;
  surplus?: number;
};

export type PromoData = {
  id?: string | number;
  code?: string;
  discount?: number;
  finalPrice?: number;
};

export const resolvePublicImageUrl = (image?: string | null) => {
  const trimmed = (image || '').trim();

  if (!trimmed) return '';

  if (/^(https?:|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  const publicPath = trimmed.replace(/^\/?public\/?/i, '');
  return `${API_BASE_URL}/public/${publicPath}`;
};

export async function getCurrentUserProfile() {
  const response = await request<UserProfileResponse>({
    method: 'GET',
    path: '/user',
  });

  return response.data || {};
}

export async function getCurrentUserLicense() {
  const response = await request<UserLicenseResponse>({
    method: 'GET',
    path: '/user-license',
  });

  return response.data || {};
}

export async function getUpgradePreview(targetPackage: LicensePackage, duration: UpgradeDuration) {
  const response = await request<{ data?: UpgradePreview }>({
    method: 'POST',
    path: '/user-license/preview-upgrade',
    body: {
      target_package: targetPackage,
      duration,
    },
  });

  return response.data || {};
}

export async function requestLicenseUpgrade({
  targetPackage,
  duration,
  price,
  promoCode,
}: {
  targetPackage: LicensePackage;
  duration: UpgradeDuration;
  price: number;
  promoCode?: string;
}) {
  return request<UserLicenseResponse>({
    method: 'POST',
    path: '/user-license/requirement',
    body: {
      time: duration,
      purchased_package: targetPackage,
      price,
      promo_code: promoCode,
    },
  });
}

export async function validateUpgradePromo({
  code,
  targetPackage,
  price,
}: {
  code: string;
  targetPackage: LicensePackage;
  price: number;
}) {
  const response = await request<{ data?: PromoData; responseText?: string }>({
    method: 'POST',
    path: '/user-license/validate-promo',
    body: {
      code,
      target_package: targetPackage,
      price,
    },
  });

  return response.data || {};
}

export async function recordUpgradePromoUsage(promoId: string | number) {
  return request<{ responseText?: string }>({
    method: 'POST',
    path: '/user-license/record-promo-usage',
    body: { promo_id: promoId },
  });
}

export async function getDowngradePreview(targetPackage: LicensePackage) {
  const response = await request<{ data?: DowngradePreview }>({
    method: 'POST',
    path: '/user-license/preview-downgrade',
    body: { target_package: targetPackage },
  });

  return response.data || {};
}

export async function downgradeLicense(targetPackage: LicensePackage) {
  return request<UserLicenseResponse>({
    method: 'POST',
    path: '/user-license/downgrade',
    body: { target_package: targetPackage },
  });
}

export async function sendEnterpriseContact(payload: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  return request<{ responseText?: string }>({
    method: 'POST',
    path: '/user-license/enterprise-contact',
    body: payload,
  });
}

export type UpdateUserProfilePayload = Pick<
  UserProfile,
  | 'fullname'
  | 'email'
  | 'address'
  | 'description'
  | 'phoneNumber'
  | 'birthDate'
  | 'companyName'
  | 'companyAddress'
  | 'hotline'
  | 'companyWebsite'
  | 'companyStartTime'
  | 'companyEndTime'
  | 'namePay'
  | 'numberPay'
  | 'bankPay'
>;

export async function updateCurrentUserProfile(payload: UpdateUserProfilePayload) {
  const response = await request<UserProfileResponse & { responseText?: string }>({
    method: 'PUT',
    path: '/user',
    body: payload,
  });

  return response;
}
