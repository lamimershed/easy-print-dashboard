import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/auth-store';
import { DEFAULT_ROUTE } from '@/features/auth/config';
import type { TRoleValue } from '@/features/auth/config';

export default function RoleRedirect() {
  const { role } = useAuthStore();
  const destination = (role && DEFAULT_ROUTE[role as TRoleValue]) ?? '/dashboard';
  return <Navigate to={destination} replace />;
}
