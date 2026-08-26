import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '@entities/user/model';

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useUserStore();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}