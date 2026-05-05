import { request } from './http';
import type { RoleCatalogItem, RolePermissionSetting } from '../utils/roleRules';

export type UserRole = {
  id: string | number;
  name: string;
  settings?: RolePermissionSetting[];
  pending_cashier?: boolean;
  pending_table_payment?: boolean;
  pending_kitchen?: boolean;
};

export type StaffAccountOption = {
  value: string | number;
  label: string;
  name?: string;
};

export type UserRoleOption = {
  value: string | number;
  label: string;
  name?: string;
};

type UserRoleListResponse = {
  data?: UserRole[];
  totalPage?: number;
  totalItem?: number;
};

type RoleCatalogResponse = {
  data?: RoleCatalogItem[];
};

type RolePayload = {
  name: string;
  role_aliases: RolePermissionSetting[];
};

export type CreateStaffAccountPayload = {
  fullname: string;
  username: string;
  email?: string;
  password: string;
  repassword: string;
  user_role_id: string | number;
  domain?: string | null;
  staff_id?: string | number | null;
  newStaffName?: string | null;
};

export async function getUserRoles({
  pageSize = 100,
  currentPage = 1,
  search = '',
}: {
  pageSize?: number;
  currentPage?: number;
  search?: string;
} = {}) {
  const query = `pageSize=${pageSize}&currentPage=${currentPage}&search=${encodeURIComponent(search)}`;

  const response = await request<UserRoleListResponse>({
    path: `/user-role/json?${query}`,
  });

  return {
    data: response.data || [],
    totalPage: response.totalPage || 1,
    totalItem: response.totalItem || 0,
  };
}

export async function getRoleCatalog() {
  const response = await request<RoleCatalogResponse>({
    path: '/user-role/role',
  });

  return response.data || [];
}

export async function getStaffAccountOptions() {
  const response = await request<{ data?: StaffAccountOption[] }>({
    path: '/user-staff/all-simple',
  });

  return response.data || [];
}

export async function getUserRoleOptions() {
  const response = await request<{ data?: Array<UserRoleOption | UserRole> }>({
    path: '/user-role',
  });

  return (response.data || []).map((role) => {
    if ('value' in role && role.value !== undefined) {
      return {
        value: role.value,
        label: role.label || role.name || String(role.value),
        name: role.name,
      };
    }

    const roleId = 'id' in role ? role.id : '';

    return {
      value: roleId,
      label: role.name || String(roleId),
      name: role.name,
    };
  });
}

export async function createStaffAccount(payload: CreateStaffAccountPayload) {
  return request<unknown>({
    method: 'POST',
    path: '/auth/signup/role',
    body: payload,
  });
}

export async function createUserRole(payload: RolePayload) {
  return request<unknown>({
    method: 'POST',
    path: '/user-role',
    body: payload,
  });
}

export async function updateUserRole(id: string | number, payload: RolePayload) {
  return request<unknown>({
    method: 'PUT',
    path: '/user-role',
    body: {
      id,
      ...payload,
    },
  });
}

export async function deleteUserRoles(arrayId: Array<string | number>) {
  return request<unknown>({
    method: 'DELETE',
    path: '/user-role',
    body: { arrayId },
  });
}
