import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '@entities/user/model';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useUserStore();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}