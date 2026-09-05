import { PERMISSION_BY_CODE, RESTRICTED_CUTOFF_HOUR } from './permission.catalog.js';

export const createAccessProfile = (permissions = [], attributes = {}) => ({
  permissions: [...new Set(permissions)],
  attributes,
});

export const hasPermission = (access, code) => {
  if (!code) return true;
  if (!access) return false;
  return access.permissions.includes(code);
};

export const hasAnyPermission = (access, codes = []) => {
  if (!codes.length) return true;
  return codes.some((code) => hasPermission(access, code));
};

export const hasAllPermissions = (access, codes = []) => {
  if (!codes.length) return true;
  return codes.every((code) => hasPermission(access, code));
};

export const isRestricted = (access, code) => {
  const permission = PERMISSION_BY_CODE[code];
  if (!permission?.restrictable) return false;
  if (!hasPermission(access, code)) return false;
  return Boolean(access?.attributes?.[code]?.restricted);
};

export const isWithinRestrictedWindow = ({ restricted, now, cutoffHour = RESTRICTED_CUTOFF_HOUR }) => {
  if (!restricted) return true;
  return now.getHours() < cutoffHour;
};

export const canActNow = ({ access, code, now, cutoffHour = RESTRICTED_CUTOFF_HOUR }) => {
  if (!hasPermission(access, code)) return false;
  return isWithinRestrictedWindow({
    restricted: isRestricted(access, code),
    now,
    cutoffHour,
  });
};

export const canAccessRoute = (access, requiredPermission) => {
  if (!requiredPermission) return true;
  return hasPermission(access, requiredPermission);
};

export const filterMenuByAccess = (items = [], access) =>
  items.reduce((visible, item) => {
    if (Array.isArray(item.children)) {
      const children = filterMenuByAccess(item.children, access);
      if (children.length) visible.push({ ...item, children });
      return visible;
    }

    if (canAccessRoute(access, item.permission)) visible.push({ ...item });
    return visible;
  }, []);

export const filterModulesByAccess = (modules = [], access) =>
  modules.filter((module) => hasAnyPermission(access, module.requiresAny ?? []));

export const resolveModuleEntry = (menu = [], access, fallback) => {
  const visible = filterMenuByAccess(menu, access);

  const firstPath = (items) => {
    for (const item of items) {
      if (item.path) return item.path;
      const nested = item.children ? firstPath(item.children) : null;
      if (nested) return nested;
    }
    return null;
  };

  return firstPath(visible) ?? fallback;
};
