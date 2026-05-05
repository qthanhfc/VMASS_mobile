export type RolePermissionSetting = {
  role_alias: string;
  permission: string;
};

export type RoleCatalogItem = {
  alias: string;
  name: string;
  permissions: string;
  group?: string | null;
};

export type RoleGroup = {
  groupName: string;
  roles: RoleCatalogItem[];
};

export const DEFAULT_ROLE_ALIASES = ['cashier', 'table_pending_payment', 'kitchen'];

export const PERMISSION_ORDER = ['R', 'C', 'U', 'D', 'RBD', 'RC', 'ACE', 'F'];

export const PERMISSION_LABELS: Record<string, string> = {
  C: 'Thêm',
  R: 'Xem',
  U: 'Sửa',
  D: 'Xóa',
  F: 'Toàn quyền',
  RBD: 'Xem ngày cụ thể',
  RC: 'Xem và so sánh',
  ACE: 'Administrator',
};

export function splitPermissions(value: string) {
  return value
    .split('|')
    .map((permission) => permission.trim())
    .filter(Boolean);
}

export function hasPermission(
  settings: RolePermissionSetting[],
  alias: string,
  permission: string
) {
  return settings.some((setting) => setting.role_alias === alias && setting.permission === permission);
}

export function isPermissionDisabled(
  settings: RolePermissionSetting[],
  alias: string,
  permission: string
) {
  if (permission === 'C' || permission === 'U' || permission === 'D') {
    return !hasPermission(settings, alias, 'R');
  }

  return false;
}

export function togglePermission(
  settings: RolePermissionSetting[],
  alias: string,
  permission: string,
  catalogPermissions?: string[]
) {
  let nextSettings = [...settings];
  const isChecked = hasPermission(nextSettings, alias, permission);

  if (isChecked) {
    if (permission === 'C' || permission === 'R' || permission === 'U' || permission === 'D') {
      nextSettings = nextSettings.filter(
        (setting) => setting.role_alias !== alias || setting.permission !== 'F'
      );
    }

    nextSettings = nextSettings.filter(
      (setting) => setting.role_alias !== alias || setting.permission !== permission
    );

    if (permission === 'R') {
      nextSettings = nextSettings.filter(
        (setting) =>
          setting.role_alias !== alias ||
          !['C', 'U', 'D'].includes(setting.permission)
      );
    }

    if (permission === 'F') {
      nextSettings = nextSettings.filter(
        (setting) =>
          setting.role_alias !== alias ||
          !['C', 'U', 'D'].includes(setting.permission)
      );
    }

    return nextSettings;
  }

  if (permission === 'F' && catalogPermissions) {
    catalogPermissions.forEach((catalogPermission) => {
      if (!hasPermission(nextSettings, alias, catalogPermission)) {
        nextSettings.push({ role_alias: alias, permission: catalogPermission });
      }
    });
    return nextSettings;
  }

  nextSettings.push({ role_alias: alias, permission });
  return nextSettings;
}

export function groupRoleCatalog(roles: RoleCatalogItem[]) {
  const groupMap = new Map<string, RoleCatalogItem[]>();

  roles.forEach((role) => {
    const groupKey = role.group || '__general__';
    const current = groupMap.get(groupKey) || [];
    current.push(role);
    groupMap.set(groupKey, current);
  });

  const groupedData: RoleGroup[] = [];
  const generalRoles = groupMap.get('__general__');

  if (generalRoles) {
    groupedData.push({ groupName: 'Chung', roles: generalRoles });
  }

  groupMap.forEach((groupRoles, key) => {
    if (key === '__general__') return;

    groupedData.push({
      groupName: key === 'analytics' ? 'Thống kê' : key.charAt(0).toUpperCase() + key.slice(1),
      roles: groupRoles,
    });
  });

  return groupedData;
}

export function getVisibleRoleGroups(roles: RoleCatalogItem[], roleType?: string | null) {
  return groupRoleCatalog(roles)
    .map((group) => ({
      ...group,
      roles: group.roles.filter((role) => {
        if (roleType) return role.alias === roleType;
        return !DEFAULT_ROLE_ALIASES.includes(role.alias);
      }),
    }))
    .filter((group) => group.roles.length > 0);
}

export function getRoleTypeFromFlags(role: {
  pending_cashier?: boolean;
  pending_table_payment?: boolean;
  pending_kitchen?: boolean;
}) {
  if (role.pending_cashier) return 'cashier';
  if (role.pending_table_payment) return 'table_pending_payment';
  if (role.pending_kitchen) return 'kitchen';
  return null;
}

export function countEnabledPermissions(settings: RolePermissionSetting[]) {
  return settings.length;
}
