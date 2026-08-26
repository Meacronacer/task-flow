/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from 'react-router-dom';

function LoginPage() {
  return <div className="text-white p-8">Login Page</div>;
}
function RegisterPage() {
  return <div className="text-white p-8">Register Page</div>;
}
function DashboardPage() {
  return <div className="text-white p-8">Dashboard Page</div>;
}
function BoardPage() {
  return <div className="text-white p-8">Board Page</div>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
  },
  {
    path: '/projects/:projectId/board',
    element: <BoardPage />,
  },
]);