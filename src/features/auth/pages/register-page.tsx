import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/form/password-input';
import { cn } from '@/lib/utils';
import { AuthLayout } from '@/components/layouts';
import { authService } from '../services';
import { registerSchema, type TRegisterFormValues } from '../schemas';
import { RegisterLogoDropzone } from '../components';
import { utils } from '@/utils';

const fieldLabel =
  'ml-1 block text-[10px] font-bold tracking-wider uppercase text-muted-foreground';
const fieldInput =
  'w-full rounded-lg border-none bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

export default function RegisterPage() {
  const registerMutation = authService.useRegister();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TRegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      logoUrl: '',
      googleProfileLink: '',
      address: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: TRegisterFormValues) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword: _confirmPassword, ...payload } = data;
    registerMutation.mutate({
      ...payload,
      googleProfileLink: payload.googleProfileLink || undefined,
    });
  };

  const apiError = registerMutation.isError
    ? (utils.getApiResponseError(registerMutation.error) ??
      'Registration failed. Please try again.')
    : null;

  return (
    <AuthLayout>
      {/* Header */}
      <div className="mb-10 text-center lg:text-left">
        <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-foreground">
          Create Account
        </h2>
        <p className="text-muted-foreground">Set up your shop dashboard in seconds.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Row 1: Company Name + Phone */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className={fieldLabel}>Company name *</label>
            <Input
              className={fieldInput}
              placeholder="The Print Haus"
              {...register('companyName')}
            />
            {errors.companyName && (
              <p className="text-xs text-destructive">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className={fieldLabel}>Phone number *</label>
            <Input
              className={fieldInput}
              placeholder="+1 (555) 000-0000"
              type="tel"
              {...register('phoneNumber')}
            />
            {errors.phoneNumber && (
              <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
            )}
          </div>
        </div>

        {/* Row 2: Email */}
        <div className="space-y-1">
          <label className={fieldLabel}>Email address *</label>
          <Input
            className={fieldInput}
            placeholder="owner@printshop.com"
            type="email"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {/* Optional section: Logo + Google + Address */}
        <div className="space-y-4 border-y border-border/40 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Logo dropzone */}
            <div className="space-y-1">
              <label className={fieldLabel}>Company logo *</label>
              <Controller
                control={control}
                name="logoUrl"
                render={({ field }) => (
                  <RegisterLogoDropzone
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.logoUrl?.message}
                  />
                )}
              />
            </div>

            {/* Google profile */}
            <div className="space-y-1">
              <label className={fieldLabel}>Google profile (optional)</label>
              <Input
                className={cn(fieldInput, 'text-xs')}
                placeholder="google.com/maps/..."
                type="url"
                {...register('googleProfileLink')}
              />
              {errors.googleProfileLink && (
                <p className="text-xs text-destructive">{errors.googleProfileLink.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className={fieldLabel}>Full address *</label>
            <Input
              className={cn(fieldInput, 'text-xs')}
              placeholder="123 Printing Way, New York, NY"
              {...register('address')}
            />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>
        </div>

        {/* Row 3: Password + Confirm password */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className={fieldLabel}>Create password *</label>
            <PasswordInput
              className={fieldInput}
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className={fieldLabel}>Confirm password *</label>
            <PasswordInput
              className={fieldInput}
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* API error banner */}
        {apiError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Submit */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={registerMutation.isPending}
            className="group relative w-full overflow-hidden rounded-full py-6 text-base font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            {registerMutation.isPending ? 'Creating account…' : 'Create Account'}
          </Button>
        </div>
      </form>

      {/* Sign in link */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/auth/login"
          className="font-bold text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>

      {/* Trust indicators */}
      <div className="mt-10 flex justify-center gap-8 opacity-40 grayscale transition-all duration-700 hover:opacity-70 hover:grayscale-0">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Secure
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
            />
          </svg>
          Encrypted
        </div>
      </div>
    </AuthLayout>
  );
}
