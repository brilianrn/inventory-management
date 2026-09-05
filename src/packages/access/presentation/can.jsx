'use client';

import { usePermission } from './use-permission';

export const Can = ({
  permission,
  anyOf,
  allOf,
  respectTimeWindow = false,
  fallback = null,
  children,
}) => {
  const { can, canAny, canAll, canActRightNow } = usePermission();

  const allowed = (() => {
    if (permission) return respectTimeWindow ? canActRightNow(permission) : can(permission);
    if (anyOf?.length) return canAny(anyOf);
    if (allOf?.length) return canAll(allOf);
    return true;
  })();

  if (!allowed) return fallback;
  return typeof children === 'function' ? children() : children;
};

export default Can;
