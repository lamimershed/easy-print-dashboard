import { Outlet } from 'react-router';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { FeatureSidebar } from './feature-sidebar';
import type { TFeatureNav } from '@/types/navigation';

type FeatureLayoutProps = {
  config: TFeatureNav;
};

export const FeatureLayout = ({ config }: FeatureLayoutProps) => (
  <SidebarProvider
    defaultOpen={false}
    style={{ '--sidebar-width': '20rem' } as React.CSSProperties}
  >
    <div className="flex h-screen w-full flex-col bg-background p-2 text-primary-foreground">
      <div className="flex flex-1 gap-2 overflow-hidden">
        <FeatureSidebar config={config} />
        <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </div>
  </SidebarProvider>
);
