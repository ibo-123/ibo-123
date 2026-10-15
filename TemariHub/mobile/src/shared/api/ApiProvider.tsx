import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

import { appQueryClient } from './queryClient';

type ApiProviderProps = {
  children: ReactNode;
};

/** TanStack Query shell. Register the session bridge from the app root (see `SessionBridgeRegistrar`). */
export function ApiProvider({ children }: ApiProviderProps) {
  return <QueryClientProvider client={appQueryClient}>{children}</QueryClientProvider>;
}
