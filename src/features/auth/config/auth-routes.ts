import { LogIn, UserPlus } from 'lucide-react';
import type { TFeatureNav } from '@/types/navigation';

export const authRoutes: TFeatureNav = {
  label: 'Auth',
  items: {
    login: {
      label: 'Login',
      subtitle: 'Sign in to your account',
      Icon: LogIn,
      href: '/auth/login',
    },
    register: {
      label: 'Register',
      subtitle: 'Create a new account',
      Icon: UserPlus,
      href: '/auth/register',
    },
  },
};
