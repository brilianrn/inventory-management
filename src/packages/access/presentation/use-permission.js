'use client';

import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MENU_BY_MODULE } from '../domain/navigation';
import { RESTRICTED_CUTOFF_HOUR } from '../domain/permission.catalog';
import {
  canAccessRoute,
  canActNow,
  createAccessProfile,
  filterMenuByAccess,
  filterModulesByAccess,
  resolveModuleEntry,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isRestricted,
} from '../domain/permission.rules';

const SIMULATED_AFTER_CUTOFF_HOUR = 14;

export const usePermission = () => {
  const permissions = useSelector((state) => state.demo.permissions);
  const attributes = useSelector((state) => state.demo.attributes);
  const profile = useSelector((state) => state.demo.profile);
  const personaId = useSelector((state) => state.demo.personaId);
  const afterCutoff = useSelector((state) => state.demo.afterCutoff);

  const access = useMemo(
    () => createAccessProfile(permissions, attributes),
    [permissions, attributes],
  );

  const now = useMemo(() => {
    const current = new Date();
    if (!afterCutoff) return current;
    const simulated = new Date(current);
    simulated.setHours(SIMULATED_AFTER_CUTOFF_HOUR, 30, 0, 0);
    return simulated;
  }, [afterCutoff]);

  const can = useCallback((code) => hasPermission(access, code), [access]);
  const canAny = useCallback((codes) => hasAnyPermission(access, codes), [access]);
  const canAll = useCallback((codes) => hasAllPermissions(access, codes), [access]);
  const restrictedFor = useCallback((code) => isRestricted(access, code), [access]);

  const canActRightNow = useCallback(
    (code) => canActNow({ access, code, now }),
    [access, now],
  );

  const canVisit = useCallback(
    (requiredPermission) => canAccessRoute(access, requiredPermission),
    [access],
  );

  const filterMenu = useCallback((items) => filterMenuByAccess(items, access), [access]);
  const filterModules = useCallback((modules) => filterModulesByAccess(modules, access), [access]);

  const moduleEntry = useCallback(
    (module) => resolveModuleEntry(MENU_BY_MODULE[module.id] ?? [], access, module.path),
    [access],
  );

  return {
    access,
    profile,
    personaId,
    permissions,
    attributes,
    now,
    afterCutoff,
    cutoffHour: RESTRICTED_CUTOFF_HOUR,
    can,
    canAny,
    canAll,
    canVisit,
    canActRightNow,
    isRestricted: restrictedFor,
    filterMenu,
    filterModules,
    moduleEntry,
  };
};
