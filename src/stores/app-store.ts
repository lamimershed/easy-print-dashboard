import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  sidebarOpen: boolean;
  lastVisitedRoutes: string[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addVisitedRoute: (route: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      lastVisitedRoutes: [],
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      addVisitedRoute: (route) => {
        const currentRoutes = get().lastVisitedRoutes;
        const filteredRoutes = currentRoutes.filter((r) => r !== route);
        set({ lastVisitedRoutes: [route, ...filteredRoutes].slice(0, 5) });
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ lastVisitedRoutes: state.lastVisitedRoutes }),
    }
  )
);
