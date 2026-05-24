import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 60 * 24
    }
  }
});

export const localStoragePersister = createSyncStoragePersister({
  key: 'whatsapp-simulator-query-cache',
  storage: window.localStorage
});
