import { Outlet, useLocation } from 'react-router';
import { profileService } from '@/features/profile/services';
import { TrialExpiryWarning } from '@/features/plan';
import { usePrintSocket } from '@/features/dashboard/hooks/use-print-socket';
import { AppSidebar } from './app-sidebar';
import { SidebarProvider, SidebarInset } from '../ui/sidebar';

function SocketManager() {
  const { data: profile } = profileService.useGetMe();
  usePrintSocket(profile?.id);
  return null;
}

export default function MainLayout() {
  const { pathname } = useLocation();

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ '--sidebar-width': '20rem' } as React.CSSProperties}
    >
      <SocketManager />
      <div className="flex h-screen w-full bg-background p-2 text-foreground">
        <AppSidebar />
        <SidebarInset className="bg-re flex min-h-0 flex-1 flex-col overflow-hidden py-2">
          <main className="flex-1 overflow-y-auto">
            {/* Sits above every page: the drop to 30% is not something a shop
                should be able to miss by never opening the plan page. */}
            <div className="px-1 empty:hidden">
              <TrialExpiryWarning hideOnPlanPage={pathname.startsWith('/plan')} />
            </div>

            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
