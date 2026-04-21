import { Store } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { profileService } from '../services';
import { authService } from '@/features/auth/services';
import { ProfileForm } from '../components/profile-form';
import { PrintingStandQr } from '../components/printing-stand-qr';
import { DeleteAccountSection } from '../components/delete-account-section';

export default function AccountSettingsPage() {
  const { data: profile, isLoading: profileLoading, isError } = profileService.useGetMe();
  const { data: authUser, isLoading: authLoading } = authService.useGetMe();

  const isLoading = profileLoading || authLoading;

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-4 h-12 w-72" />
        <Skeleton className="mb-10 h-5 w-96" />
        <div className="grid gap-8 lg:grid-cols-12">
          <Skeleton className="h-[480px] rounded-xl lg:col-span-7" />
          <div className="space-y-6 lg:col-span-5">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
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
    <div className="mx-auto max-w-6xl p-8 pb-20">
      {/* Page Header */}
      <header className="mb-12">
        <h2 className="mb-2 text-4xl font-extrabold tracking-tight text-foreground">
          Account Settings
        </h2>
        <p className="text-muted-foreground">
          Manage your business profile and printing station configuration.
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Business Information Form */}
        <section className="rounded-xl bg-card p-8 shadow-card-soft lg:col-span-7">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Store className="size-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Business Information</h3>
          </div>
          <ProfileForm profile={profile} email={authUser?.email} />
        </section>

        {/* QR Code Section */}
        <section className="lg:col-span-5">
          <PrintingStandQr slug={profile.slug} companyName={profile.companyName} />
        </section>
      </div>

      {/* Danger Zone */}
      <div className="mt-16 border-t border-border/40 pt-8">
        <DeleteAccountSection />
      </div>
    </div>
  );
}
