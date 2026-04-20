import { NavLink, useLocation } from 'react-router';
import { Home } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import type { TFeatureNav } from '@/types/navigation';

interface FeatureSidebarProps {
  config: TFeatureNav;
}

export const FeatureSidebar = ({ config }: FeatureSidebarProps) => {
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      className="rounded-3xl border-r border-border/50 bg-sidebar transition-colors duration-300 md:static! md:h-full!"
    >
      <SidebarHeader className="h-auto! min-h-16 border-b border-border/50 px-4 py-4 transition-all duration-300 group-data-[collapsible=icon]:p-2">
        <div className="flex w-full items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-4">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">
            <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <span className="text-sm font-bold text-primary">A</span>
            </div>
            <div className="flex flex-col gap-0.5 overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-bold tracking-tight text-foreground uppercase">
                {config.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
            <ThemeToggle />
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-5 group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="mt-6 p-0">
          <SidebarGroupLabel className="px-4 text-[11px] font-bold tracking-widest text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
            {config.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {Object.values(config.items).map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="group h-auto p-0"
                    tooltip={item.label}
                  >
                    <NavLink
                      to={item.href}
                      onClick={() => isMobile && setOpenMobile(false)}
                      className={({ isActive }) =>
                        cn(
                          'w-full flex-col items-start gap-1 rounded-xl px-4 py-3 transition-all duration-200',
                          isActive
                            ? 'bg-primary/90 text-primary-foreground shadow-[0_4px_12px_rgba(var(--primary),0.3)] ring-1 ring-white/10'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-primary',
                          'group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-4'
                        )
                      }
                    >
                      <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">
                        <div className="flex w-5 shrink-0 items-center justify-center">
                          <item.Icon
                            size={18}
                            className="transition-transform group-hover:scale-110"
                          />
                        </div>
                        <span className="text-sm leading-none font-medium text-inherit group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="ml-8 text-[10px] leading-tight font-light group-data-[collapsible=icon]:hidden">
                          {item.subtitle}
                        </p>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto p-5 group-data-[collapsible=icon]:p-2">
        <SidebarGroup className="p-0">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-4">
              <SidebarMenuButton asChild className="group h-auto p-0" tooltip="Home">
                <NavLink
                  to="/dashboard"
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                  }}
                  className={({ isActive }) =>
                    cn(
                      'flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                      isActive
                        ? 'bg-accent text-accent-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                      'group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'
                    )
                  }
                >
                  <Home size={20} className="shrink-0 transition-transform group-hover:scale-110" />
                  <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                    Home
                  </span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="mt-2 px-2 text-center text-[9px] leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
            <p>Copyright © {new Date().getFullYear()} JLTS Company.</p>
            <p>All rights reserved.</p>
          </div>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
};
