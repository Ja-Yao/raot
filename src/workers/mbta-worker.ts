// Define interfaces for data types, similar to your React component
interface MBTAData {
  id: string;
  type: string;
  attributes: {
    [key: string]: any;
  };
  relationships?: {
    [key: string]: {
      data: {
        id: string;
        type: string;
      };
    };
  };
}

interface MBTASSEEvent {
  event: 'reset' | 'add' | 'update' | 'remove';
  data: MBTAData | MBTAData[] | { id: string; type: string };
}

// Define the message types for communication between main thread and worker
interface WorkerMessage {
  type: 'start' | 'stop';
  payload?: {
    apiKey: string;
    endpoint: string;
    filterParams?: string;
  };
}

let eventSource: EventSource | null = null;
let currentUrl: string | null = null;

const handleEvent = (event: MessageEvent) => {
  try {
    const parsedEvent: MBTASSEEvent = JSON.parse(event.data);
    const mbtaEventType = event.type;

    // Send the raw parsed event to the main thread
    self.postMessage({
      type: 'data',
      payload: {
        eventType: mbtaEventType,
        data: parsedEvent,
      },
    });
  } catch (e) {
    console.error('Worker: Error parsing MBTA SSE data:', e, event.data);
    self.postMessage({ type: 'error', payload: 'Error parsing data: ' + (e as Error).message });
  }
};

const connectSSE = (apiKey: string, endpoint: string, filterParams?: string) => {
  const url = `https://api-v3.mbta.com/${endpoint}/?api_key=${apiKey}${filterParams ? `&${filterParams}` : ''}`;

  if (eventSource && currentUrl === url) {
    // Already connected to the same URL, do nothing
    return;
  }

  if (eventSource) {
    console.debug('Worker: Closing existing SSE connection.');
    eventSource.removeEventListener('reset', handleEvent);
    eventSource.removeEventListener('add', handleEvent);
    eventSource.removeEventListener('update', handleEvent);
    eventSource.removeEventListener('remove', handleEvent);
    eventSource.close();
    eventSource = null;
  }

  currentUrl = url;
  self.postMessage({ type: 'status', payload: 'connecting' });
  console.debug('Worker: Attempting to connect to:', url);

  eventSource = new EventSource(url);

  eventSource.onopen = () => {
    console.debug('Worker: SSE connection established.');
    self.postMessage({ type: 'status', payload: 'open' });
  };

  eventSource.addEventListener('reset', handleEvent);
  eventSource.addEventListener('add', handleEvent);
  eventSource.addEventListener('update', handleEvent);
  eventSource.addEventListener('remove', handleEvent);

  eventSource.onerror = (err) => {
    console.error('Worker: SSE connection error:', err);
    self.postMessage({ type: 'status', payload: 'error' });
    self.postMessage({ type: 'error', payload: 'SSE connection error' });

    eventSource?.close(); // Close on error to attempt re-connection
    eventSource = null; // Clear the instance to allow reconnection

    // Implement re-connection logic if desired.
    // For simplicity, we'll rely on the main thread to initiate a new 'start' message.
    // In a more robust solution, you might automatically re-connect here with backoff.
  };
};

const stopSSE = () => {
  if (eventSource) {
    console.log('Worker: Closing SSE connection.');
    eventSource.removeEventListener('reset', handleEvent);
    eventSource.removeEventListener('add', handleEvent);
    eventSource.removeEventListener('update', handleEvent);
    eventSource.removeEventListener('remove', handleEvent);
    eventSource.close();
    eventSource = null;
    currentUrl = null;
    self.postMessage({ type: 'status', payload: 'closed' });
  }
};

// Listen for messages from the main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'start':
      if (payload) {
        connectSSE(payload.apiKey, payload.endpoint, payload.filterParams);
      } else {
        console.warn('Worker: Start message received without payload.');
      }
      break;
    case 'stop':
      stopSSE();
      break;
    default:
      console.warn('Worker: Unknown message type received:', type);
  }
};

// Initial status
self.postMessage({ type: 'status', payload: 'idle' });

// Add this line to satisfy TypeScript's self-postMessage requirement for workers
export {};
