import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 401 (unauthorized) or 403 (forbidden)
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry other errors once
        return failureCount < 1;
      },
      refetchOnWindowFocus: false, // Can enable later once stable
    },
    mutations: {
      retry: 0,
    },
  },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export { queryClient };


