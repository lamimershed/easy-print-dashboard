import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  LayoutDashboard,
  BarChart2,
  Wallet,
  Tag,
  Settings,
  LogOutIcon,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import { TrialCountdown } from '@/features/plan';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { authService } from '@/features/auth/services';
import { profileService } from '@/features/profile/services';
import { cn } from '@/lib/utils';

const navLinks = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Analytics', url: '/analytics', icon: BarChart2 },
  { title: 'Pricing', url: '/pricing', icon: Tag },
  { title: 'Earnings', url: '/billing', icon: Wallet },
  { title: 'Plan', url: '/plan', icon: Sparkles },
  { title: 'Settings', url: '/profile', icon: Settings },
  ...(import.meta.env.DEV
    ? [{ title: 'Printer Test', url: '/printer-test', icon: FlaskConical }]
    : []),
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const logoutMutation = authService.useLogout();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { data: profile, isLoading } = profileService.useGetMe();

  const displayName = profile?.companyName ?? 'Easy Print';
  const displayPlan = profile?.plan ?? 'FREE';

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className="rounded-3xl transition-colors duration-300 md:static! md:h-full!"
    >
      <SidebarHeader className="px-3 pt-4 pb-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-3">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col items-start leading-none group-data-[collapsible=icon]:hidden">
              {isLoading ? (
                <>
                  <Skeleton className="mb-1 h-3 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-foreground">{displayName}</span>
                  <Badge variant="secondary" className="mt-0.5 h-4 px-1 text-[10px]">
                    {displayPlan}
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-3">
            <ThemeToggle />
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-3 bg-border/60 group-data-[collapsible=icon]:mx-2" />

      <SidebarContent className="px-2 py-2">
        <SidebarGroupContent>
          <SidebarMenu>
            {navLinks.map((item, index) => {
              const isActive = pathname === item.url || pathname.startsWith(item.url + '/');
              return (
                <SidebarGroup key={item.title} className="p-0">
                  {index > 0 && <SidebarSeparator className="mx-0 my-2 bg-border/40" />}
                  <SidebarGroupContent>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          'h-11 rounded-xl px-3 text-sm font-medium transition-all duration-200',
                          'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                          'data-[active=true]:bg-primary/10 data-[active=true]:font-semibold data-[active=true]:text-primary',
                          isMobile && 'px-2'
                        )}
                        tooltip={item.title}
                      >
                        <NavLink to={item.url} onClick={() => isMobile && setOpenMobile(false)}>
                          <item.icon
                            className={cn(
                              'size-4 shrink-0',
                              isActive ? 'text-primary' : 'text-muted-foreground'
                            )}
                          />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarContent>

      <SidebarFooter className="mt-auto px-3 pt-2 pb-4 group-data-[collapsible=icon]:px-2">
        {/* Every shop signs up onto a 30-day trial, so this clock is live for all
            of them. It sits in the shell rather than on the plan page because a
            countdown you have to navigate to is one nobody sees. */}
        <TrialCountdown collapsed={state === 'collapsed' && !isMobile} />

        <SidebarSeparator className="my-3 bg-border/60 group-data-[collapsible=icon]:my-2" />

        <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
          <DialogTrigger asChild>
            <SidebarMenuButton
              tooltip="Log out"
              size="lg"
              className={cn(
                'group h-11 w-full items-center justify-start gap-3 rounded-xl px-3 transition-all duration-200',
                'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
                'group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'
              )}
            >
              <LogOutIcon className="size-4 shrink-0" />
              <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                Log out
              </span>
            </SidebarMenuButton>
          </DialogTrigger>

          <div className="mt-3 px-1 text-center text-[9px] leading-relaxed text-muted-foreground/60 group-data-[collapsible=icon]:hidden">
            <p>
              © {new Date().getFullYear()} {displayName}.
            </p>
            <p>All rights reserved.</p>
          </div>

          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Sign Out</DialogTitle>
              <DialogDescription>
                Are you sure you want to sign out? You will need to log in again to access your
                account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button
                variant="outline"
                className="flex-1 rounded-[6px] border-border sm:flex-none"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-[6px] bg-foreground text-background hover:bg-foreground/90 sm:flex-none"
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
              >
                Sign Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarFooter>
    </Sidebar>
  );
}
