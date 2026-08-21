/**
 * React app example using OneVizion SDK hooks
 */

import {
  OneVizionClient,
  OneVizionProvider,
  useTrackor,
  useTrackors,
  useUpdateTrackor,
  widgetAuth,
} from '@onevizion/sdk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create OneVizion client
const client = new OneVizionClient({
  baseUrl: 'https://app.onevizion.com',
  auth: widgetAuth({ baseUrl: 'https://app.onevizion.com' }),
});

// Create React Query client
const queryClient = new QueryClient();

// Trackor detail component
function TrackorDetail({ id }: { id: number }) {
  const { data: trackor, isLoading, error } = useTrackor(id);
  const updateMutation = useUpdateTrackor();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!trackor) return null;

  const handleUpdate = () => {
    updateMutation.mutate({
      id,
      data: {
        fields: {
          status: 'Updated',
        },
      },
    });
  };

  return (
    <div>
      <h2>Trackor #{trackor.id}</h2>
      <p>Type: {trackor.trackorType}</p>
      <button onClick={handleUpdate} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Updating...' : 'Update Status'}
      </button>
    </div>
  );
}

// Trackors list component
function TrackorsList() {
  const {
    data: trackors,
    isLoading,
    error,
  } = useTrackors({
    filters: {
      trackorType: 'Asset',
      perPage: 10,
    },
  });

  if (isLoading) return <div>Loading trackors...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!trackors) return null;

  return (
    <div>
      <h2>Trackors</h2>
      <ul>
        {trackors.map((trackor) => (
          <li key={trackor.id}>
            Trackor #{trackor.id} - {trackor.trackorType}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Main app component
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OneVizionProvider client={client}>
        <div>
          <h1>OneVizion React Example</h1>
          <TrackorsList />
          <TrackorDetail id={123} />
        </div>
      </OneVizionProvider>
    </QueryClientProvider>
  );
}
