import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/auth-store';

export default function AuthCheck() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
