/**
 * tRPC Client Configuration
 *
 * Type-safe client for API calls
 */

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../server/trpc';

/**
 * Create tRPC client
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * tRPC client configuration
 */
export const trpcClientConfig = {
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === 'development' ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: '/api/trpc',
      // You can pass any custom headers here
      headers() {
        return {
          // Add authentication token if available
          ...(typeof window !== 'undefined' && window.localStorage.getItem('token')
            ? { Authorization: `Bearer ${window.localStorage.getItem('token')}` }
            : {}),
        };
      },
    }),
  ],
  transformer: superjson,
};

/**
 * React Query configuration
 */
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
};

/**
 * Provider wrapper for tRPC
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(queryClientConfig));
  const [trpcClient] = useState(() =>
    trpc.createClient(trpcClientConfig)
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
