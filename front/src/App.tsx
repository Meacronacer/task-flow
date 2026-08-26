import { RouterProvider } from 'react-router-dom';
import { QueryProvider, AuthProvider } from '@app/providers';
import { router } from '@app/router';

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryProvider>
  );
}