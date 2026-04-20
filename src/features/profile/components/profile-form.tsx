import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { profileSchema, type TProfileFormValues } from '../schemas';
import { profileService } from '../services';
import type { TClientProfile } from '../types';

interface ProfileFormProps {
  profile: TClientProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" {...register('companyName')} />
          {errors.companyName && (
            <p className="text-sm text-destructive">{errors.companyName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input id="phoneNumber" {...register('phoneNumber')} />
          {errors.phoneNumber && (
            <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" placeholder="123 Main St" {...register('address')} />
          {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="googleProfileLink">Google Business Profile URL</Label>
          <Input
            id="googleProfileLink"
            placeholder="https://maps.google.com/..."
            {...register('googleProfileLink')}
          />
          {errors.googleProfileLink && (
            <p className="text-sm text-destructive">{errors.googleProfileLink.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={updateMutation.isPending || !isDirty}>
        {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  );
}
