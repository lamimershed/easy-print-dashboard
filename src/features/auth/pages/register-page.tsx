import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { authService } from '../services';
import { uploadService } from '@/features/upload/services';
import { registerSchema, type TRegisterFormValues } from '../schemas';

export default function RegisterPage() {
  const registerMutation = authService.useRegister();
  const uploadMutation = uploadService.usePreRegisterUpload();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TRegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { logoUrl: '', googleProfileLink: '', address: '' },
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    uploadMutation.mutate(file, {
      onSuccess: (data) => setValue('logoUrl', data.url, { shouldValidate: true }),
    });
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setValue('logoUrl', '', { shouldValidate: true });
  };

  const onSubmit = (data: TRegisterFormValues) => {
    registerMutation.mutate({
      ...data,
      googleProfileLink: data.googleProfileLink || undefined,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>Set up your Easy Print shop dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Logo upload */}
            <div className="space-y-2">
              <Label>Shop Logo *</Label>
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 w-16 rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="text-destructive-foreground absolute -top-2 -right-2 rounded-full bg-destructive p-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
                    <Upload className="size-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="cursor-pointer"
                    onChange={handleLogoUpload}
                    disabled={uploadMutation.isPending}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPEG, PNG, WebP or GIF · max 5 MB
                  </p>
                </div>
              </div>
              {errors.logoUrl && (
                <p className="text-sm text-destructive">{errors.logoUrl.message}</p>
              )}
            </div>

            <Separator />

            {/* Business info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" placeholder="Acme Print Co." {...register('companyName')} />
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input id="phoneNumber" placeholder="+1234567890" {...register('phoneNumber')} />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input id="address" placeholder="123 Main St" {...register('address')} />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
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

            <Separator />

            {/* Credentials */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 chars, upper, lower, number, special"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending || uploadMutation.isPending}
            >
              {registerMutation.isPending ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
