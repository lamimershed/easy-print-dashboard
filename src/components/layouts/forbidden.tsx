import { useNavigate } from 'react-router';
import { ShieldOffIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { DEFAULT_ROUTE } from '@/features/auth/config';
import type { TRoleValue } from '@/features/auth/config';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const homeRoute = (role && DEFAULT_ROUTE[role as TRoleValue]) ?? '/dashboard';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <ShieldOffIcon className="size-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Access Denied</h1>
        <p className="max-w-sm text-muted-foreground">
          You don&apos;t have permission to view this page. Contact your administrator if you think
          this is a mistake.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button onClick={() => navigate(homeRoute, { replace: true })}>Go to Home</Button>
      </div>
    </div>
  );
}
