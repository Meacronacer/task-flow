import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@app/providers';
import { router } from '@app/router';

export function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}