import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { profileService } from '../services';
import { ProfileForm } from '../components/profile-form';
import { LogoUploader } from '../components/logo-uploader';

export default function AccountSettingsPage() {
  const { data: profile, isLoading, isError } = profileService.useGetMe();

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Failed to load profile. Please refresh.
      </div>
    );
  }

  const planVariant = profile.plan === 'FREE' ? 'secondary' : 'default';

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your print shop profile</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shop Logo</CardTitle>
          <CardDescription>
            Update your shop logo shown in QR codes and the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LogoUploader currentLogoUrl={profile.logoUrl} />
          <Separator />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current plan:</span>
            <Badge variant={planVariant}>{profile.plan}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Shop ID: <code className="rounded bg-muted px-1 py-0.5">{profile.slug}</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Update your company details</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
