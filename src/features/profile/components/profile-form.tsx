import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { profileSchema, type TProfileFormValues } from '../schemas';
import { profileService } from '../services';
import type { TClientProfile } from '../types';

interface ProfileFormProps {
  profile: TClientProfile;
  email?: string;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
      {children}
    </label>
  );
}

function StyledInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg bg-muted px-4 py-3 text-sm text-foreground transition-all',
        'border-none ring-0 outline-none',
        'focus:ring-2 focus:ring-primary/40',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'placeholder:text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const updateMutation = profileService.useUpdateMe();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      companyName: profile.companyName,
      phoneNumber: profile.phoneNumber,
      address: profile.address ?? '',
      googleProfileLink: profile.googleProfileLink ?? '',
    },
  });

  useEffect(() => {
    reset({
      companyName: profile.companyName,
      phoneNumber: profile.phoneNumber,
      address: profile.address ?? '',
      googleProfileLink: profile.googleProfileLink ?? '',
    });
  }, [profile, reset]);

  const onSubmit = (data: TProfileFormValues) => {
    updateMutation.mutate({
      ...data,
      address: data.address || undefined,
      googleProfileLink: data.googleProfileLink || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Shop Name + Phone */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel>Shop Name</FieldLabel>
          <StyledInput {...register('companyName')} placeholder="Your Shop Name" />
          {errors.companyName && (
            <p className="text-xs text-destructive">{errors.companyName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel>Phone Number</FieldLabel>
          <StyledInput {...register('phoneNumber')} placeholder="+1234567890" type="tel" />
          {errors.phoneNumber && (
            <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
          )}
        </div>
      </div>

      {/* Business Email (read-only) */}
      {email && (
        <div className="flex flex-col gap-2">
          <FieldLabel>Business Email</FieldLabel>
          <StyledInput value={email} disabled readOnly type="email" />
          <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
        </div>
      )}

      {/* Address */}
      <div className="flex flex-col gap-2">
        <FieldLabel>Street Address</FieldLabel>
        <StyledInput {...register('address')} placeholder="124 Main Street, Suite 400" />
        {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
      </div>

      {/* Google Profile Link */}
      <div className="flex flex-col gap-2">
        <FieldLabel>Google Business Profile URL</FieldLabel>
        <StyledInput
          {...register('googleProfileLink')}
          placeholder="https://maps.google.com/..."
          type="url"
        />
        {errors.googleProfileLink && (
          <p className="text-xs text-destructive">{errors.googleProfileLink.message}</p>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={updateMutation.isPending || !isDirty}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold transition-all',
            'bg-amber-200 text-amber-800 hover:bg-amber-300',
            'dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          <Save className="size-4" />
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
