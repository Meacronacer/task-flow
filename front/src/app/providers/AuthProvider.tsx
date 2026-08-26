import { type ReactNode, useEffect } from 'react';
import { useUserStore } from '@entities/user/model';
import { authApi } from '@features/auth/login';
import { clearTokens } from '@shared/api';
import { Spinner } from '@shared/ui';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading, isLoading } = useUserStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then((user: Awaited<ReturnType<typeof authApi.me>>) => {
        setUser(user);
      })
      .catch(() => {
        clearTokens();
        setUser(null);
      });
  }, [setUser, setLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}