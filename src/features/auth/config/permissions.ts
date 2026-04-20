import { ROLES, type TRoleValue } from './roles';

export const ROUTE_PERMISSIONS: Record<string, TRoleValue[]> = {
  '/dashboard': [ROLES.CLIENT, ROLES.SUPER_ADMIN],
  '/analytics': [ROLES.CLIENT],
  '/profile': [ROLES.CLIENT],
};

export const DEFAULT_ROUTE: Record<TRoleValue, string> = {
  [ROLES.CLIENT]: '/dashboard',
  [ROLES.SUPER_ADMIN]: '/dashboard',
};
