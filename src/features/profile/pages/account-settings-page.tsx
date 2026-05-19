import { Store } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { profileService } from '../services';
import { authService } from '@/features/auth/services';
import { ProfileForm } from '../components/profile-form';
import { LogoUploader } from '../components/logo-uploader';
import { PrintingStandQr } from '../components/printing-stand-qr';

export default function AccountSettingsPage() {
  const { data: profile, isLoading: profileLoading, isError } = profileService.useGetMe();
  const { data: authUser, isLoading: authLoading } = authService.useGetMe();

  const isLoading = profileLoading || authLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-2 h-1 w-8 rounded-full bg-primary/30" />
        <Skeleton className="mb-1.5 h-8 w-56" />
        <Skeleton className="mb-8 h-4 w-72" />
        <div className="grid gap-5 lg:grid-cols-12">
          <Skeleton className="h-[460px] rounded-xl lg:col-span-7" />
          <Skeleton className="h-[460px] rounded-xl lg:col-span-5" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex items-center justify-center p-8 text-center text-muted-foreground">
        Failed to load profile. Please refresh.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6">
        <div className="mb-2 h-1 w-8 rounded-full bg-primary" />
        <h2 className="mb-1 text-2xl font-black tracking-tight text-foreground">
          Account Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your business profile and printing station.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <section className="rounded-xl bg-card p-6 shadow-card-soft lg:col-span-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Store className="size-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground">Business Information</h3>
          </div>
          <LogoUploader currentLogoUrl={profile.logoUrl} />
          <Separator className="my-5" />
          <ProfileForm profile={profile} email={authUser?.email} />
        </section>

        <section className="lg:col-span-5">
          <PrintingStandQr slug={profile.slug} companyName={profile.companyName} />
        </section>
      </div>
    </div>
  );
}
