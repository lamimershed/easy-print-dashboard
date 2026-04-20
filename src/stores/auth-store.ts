import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TAuthUserRole = 'CLIENT' | 'SUPER_ADMIN';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  role: TAuthUserRole | null;
  setAuth: (accessToken: string, role: TAuthUserRole) => void;
  updateAccessToken: (newAccessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      isAuthenticated: false,
      role: null,
      setAuth: (accessToken, role) => set({ accessToken, isAuthenticated: true, role }),
      updateAccessToken: (newAccessToken) => set({ accessToken: newAccessToken }),
      clearAuth: () => {
        localStorage.removeItem('auth-storage');
        set({ accessToken: null, isAuthenticated: false, role: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
);
