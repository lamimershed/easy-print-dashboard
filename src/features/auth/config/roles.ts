export const ROLES = {
  CLIENT: 'CLIENT',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type TRoleValue = (typeof ROLES)[keyof typeof ROLES];
