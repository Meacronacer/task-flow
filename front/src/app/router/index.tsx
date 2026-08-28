import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import { LoginPage } from '@pages/auth/login';
import { RegisterPage } from '@pages/auth/register';
import { DashboardPage } from '@pages/dashboard';

// eslint-disable-next-line react-refresh/only-export-components
function BoardPage() {
  return <div className="text-white p-8">Board — coming soon</div>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/projects/:projectId/board', element: <BoardPage /> },
    ],
  },
]);