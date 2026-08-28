import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useRegister } from '@features/auth/login/use-auth';
import {
  registerSchema,
  type RegisterFormValues,
} from '@features/auth/login/model/schemas';
import { Button, Input } from '@shared/ui';

export function RegisterPage() {
  const register_ = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (values: RegisterFormValues) => {
    register_.mutate(
      {
        name: values.name,
        email: values.email,
        password: values.password,
      },
      {
        onError: () => {
          setError('root', { message: 'Registration failed. Email may already be taken.' });
        },
      },
    );
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
            Create your account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Name"
              type="text"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name')}
            />

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

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {errors.root ? (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {errors.root.message}
              </p>
            ) : null}

            <Button
              type="submit"
              loading={register_.isPending}
              className="mt-2 w-full"
            >
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}