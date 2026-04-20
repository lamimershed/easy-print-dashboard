import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/form/password-input';
import { AuthLayout } from '@/components/layouts';
import { authService } from '../services';
import { loginSchema, type TLoginFormValues } from '../schemas';
import { utils } from '@/utils';

const fieldLabel =
  'ml-1 block text-[10px] font-bold tracking-wider uppercase text-muted-foreground';
const fieldInput =
  'w-full rounded-lg border-none bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

export default function LoginPage() {
  const loginMutation = authService.useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TLoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: TLoginFormValues) => {
    loginMutation.mutate(data);
  };

  const apiError = loginMutation.isError
    ? (utils.getApiResponseError(loginMutation.error) ?? 'Login failed. Please try again.')
    : null;

  return (
    <AuthLayout>
      {/* Header */}
      <div className="mb-10 text-center lg:text-left">
        <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="text-muted-foreground">Sign in to your print shop dashboard.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1">
          <label className={fieldLabel}>Email address</label>
          <Input
            className={fieldInput}
            type="email"
            placeholder="owner@printshop.com"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className={fieldLabel}>Password</label>
          <PasswordInput className={fieldInput} placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {/* API error banner */}
        {apiError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="group relative w-full overflow-hidden rounded-full py-6 text-base font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
          </Button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          to="/auth/register"
          className="font-bold text-primary underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
