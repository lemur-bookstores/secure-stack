'use client';

import { SecureStackProvider } from '@lemur-bookstores/client/react';

const config = {
  url: 'http://localhost:3000/api',
};

export function Providers({ children }: { children: React.ReactNode }) {
  return <SecureStackProvider config={config}>{children}</SecureStackProvider>;
}
