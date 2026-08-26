import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '@features/auth/login/use-auth';
import { loginSchema, type LoginFormValues } from '@features/auth/login/model/schemas';
import { Button, Input } from '@shared/ui';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values, {
      onSuccess: () => navigate('/dashboard', { replace: true }),
      onError: () => {
        setError('root', { message: 'Invalid email or password' });
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Task<span className="text-indigo-500">Flow</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Sign in to your workspace
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            {errors.root ? (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {errors.root.message}
              </p>
            ) : null}

            <Button
              type="submit"
              loading={login.isPending}
              className="mt-2 w-full"
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}