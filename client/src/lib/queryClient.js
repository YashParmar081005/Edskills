import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton React Query client with sensible defaults for an LMS:
 * - retry once on failure
 * - 30s stale time to avoid refetch storms
 * - don't refetch on window focus by default (opt-in per query)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;
