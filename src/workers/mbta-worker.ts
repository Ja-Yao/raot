import { expose } from 'comlink';
import type { WorkerMessageFromWorker } from 'types';

// Define the worker's API that will be exposed
const workerAPI = {
  eventSource: null as EventSource | null,
  onMessageCallback: null as ((message: WorkerMessageFromWorker) => void) | null,

  // Helper function to handle individual SSE events
  handleSSEEvent: function(event: MessageEvent, eventType: 'reset' | 'add' | 'update' | 'remove') {
    try {
      const parsedData = JSON.parse(event.data);
      if (this.onMessageCallback) {
        this.onMessageCallback({ type: 'data', payload: { eventType, data: parsedData } });
      }
    } catch (error) {
      console.error(`Worker: Error parsing MBTA SSE ${eventType} data:`, error, event.data);
      if (this.onMessageCallback) {
        this.onMessageCallback({ type: 'error', payload: `Error parsing ${eventType} data: ` + (error as Error).message });
      }
    }
  },

  // Function to start the SSE stream
  startStreaming: function(options: { apiKey: string; endpoint: string; filterParams: string }, onMessageCallback: (message: WorkerMessageFromWorker) => void) {
    if (this.eventSource) {
      this.stopStreaming(); // Stop any existing stream
    }

    this.onMessageCallback = onMessageCallback; // Store the callback from the main thread

    const { apiKey, endpoint, filterParams } = options;
    const url = `https://api-v3.mbta.com/${endpoint}/?api_key=${apiKey}${filterParams ? `&${filterParams}` : ''}`;

    this.eventSource = new EventSource(url);
    console.debug('Worker: EventSource created and attempting to connect to:', url);

    this.eventSource.onopen = () => {
      console.debug('Worker: SSE connection opened.');
      if (this.onMessageCallback) {
        this.onMessageCallback({ type: 'status', payload: 'open' });
      }
    };

    // Attach event listeners for specific MBTA SSE event types
    this.eventSource.addEventListener('reset', (event) => this.handleSSEEvent(event, 'reset'));
    this.eventSource.addEventListener('add', (event) => this.handleSSEEvent(event, 'add'));
    this.eventSource.addEventListener('update', (event) => this.handleSSEEvent(event, 'update'));
    this.eventSource.addEventListener('remove', (event) => this.handleSSEEvent(event, 'remove'));

    // The generic onmessage is not typically used for MBTA's specific event types,
    // but can be kept for fallback or unexpected messages if needed.
    // For MBTA, the above addEventListener calls are crucial.
    this.eventSource.onmessage = (event) => {
      console.warn('Worker: Received generic SSE message (no specific event type):', event.data);
      // You might want to handle this differently or ignore it if all expected messages
      // come with specific event types from MBTA.
      try {
        const parsedData = JSON.parse(event.data);
        if (this.onMessageCallback) {
          // As a fallback, if a message without an 'event:' field comes through
          // you might classify it as 'data' with a generic event type or log it.
          // For MBTA, this path is less likely for actual vehicle updates.
          this.onMessageCallback({ type: 'data', payload: { eventType: 'generic', data: parsedData } });
        }
      } catch (error) {
        console.error('Worker: Error parsing generic SSE data:', error, event.data);
        if (this.onMessageCallback) {
          this.onMessageCallback({ type: 'error', payload: 'Error parsing generic data: ' + (error as Error).message });
        }
      }
    };


    this.eventSource.onerror = (error) => {
      console.error('Worker: SSE error:', error);
      if (this.onMessageCallback) {
        this.onMessageCallback({ type: 'status', payload: 'error' });
        this.onMessageCallback({ type: 'error', payload: 'SSE connection error' });
      }
      this.stopStreaming(); // Attempt to stop on error
    };
  },

  // Function to stop the SSE stream
  stopStreaming: function() {
    if (this.eventSource) {
      console.debug('Worker: Closing existing SSE connection.');
      // Remove all event listeners before closing
      this.eventSource.removeEventListener('reset', (event) => this.handleSSEEvent(event, 'reset'));
      this.eventSource.removeEventListener('add', (event) => this.handleSSEEvent(event, 'add'));
      this.eventSource.removeEventListener('update', (event) => this.handleSSEEvent(event, 'update'));
      this.eventSource.removeEventListener('remove', (event) => this.handleSSEEvent(event, 'remove'));
      this.eventSource.onmessage = null; // Clear generic handler
      this.eventSource.onerror = null; // Clear error handler
      this.eventSource.onopen = null; // Clear open handler

      this.eventSource.close();
      console.debug('Worker: SSE connection closed.');
      if (this.onMessageCallback) {
        this.onMessageCallback({ type: 'status', payload: 'closed' });
      }
      this.eventSource = null;
      this.onMessageCallback = null; // Clear the callback
    }
  }
};

// Expose the workerAPI object to the main thread
expose(workerAPI);

// let eventSource: EventSource | null = null;
// let currentUrl: string | null = null;

// const handleEvent = (event: MessageEvent) => {
//   try {
//     const parsedEvent: MBTASSEEvent = JSON.parse(event.data);
//     const mbtaEventType = event.type;

//     // Send the raw parsed event to the main thread
//     self.postMessage({
//       type: 'data',
//       payload: {
//         eventType: mbtaEventType,
//         data: parsedEvent,
//       },
//     });
//   } catch (e) {
//     console.error('Worker: Error parsing MBTA SSE data:', e, event.data);
//     self.postMessage({ type: 'error', payload: 'Error parsing data: ' + (e as Error).message });
//   }
// };

// const connectSSE = (apiKey: string, endpoint: string, filterParams?: string) => {
//   const url = `https://api-v3.mbta.com/${endpoint}/?api_key=${apiKey}${filterParams ? `&${filterParams}` : ''}`;

//   if (eventSource && currentUrl === url) {
//     // Already connected to the same URL, do nothing
//     return;
//   }

//   if (eventSource) {
//     console.debug('Worker: Closing existing SSE connection.');
//     eventSource.removeEventListener('reset', handleEvent);
//     eventSource.removeEventListener('add', handleEvent);
//     eventSource.removeEventListener('update', handleEvent);
//     eventSource.removeEventListener('remove', handleEvent);
//     eventSource.close();
//     eventSource = null;
//   }

//   currentUrl = url;
//   self.postMessage({ type: 'status', payload: 'connecting' });
//   console.debug('Worker: Attempting to connect to:', url);

//   eventSource = new EventSource(url);

//   eventSource.onopen = () => {
//     console.debug('Worker: SSE connection established.');
//     self.postMessage({ type: 'status', payload: 'open' });
//   };

//   eventSource.addEventListener('reset', handleEvent);
//   eventSource.addEventListener('add', handleEvent);
//   eventSource.addEventListener('update', handleEvent);
//   eventSource.addEventListener('remove', handleEvent);

//   eventSource.onerror = (err) => {
//     console.error('Worker: SSE connection error:', err);
//     self.postMessage({ type: 'status', payload: 'error' });
//     self.postMessage({ type: 'error', payload: 'SSE connection error' });

//     eventSource?.close(); // Close on error to attempt re-connection
//     eventSource = null; // Clear the instance to allow reconnection

//     // Implement re-connection logic if desired.
//     // For simplicity, we'll rely on the main thread to initiate a new 'start' message.
//     // In a more robust solution, you might automatically re-connect here with backoff.
//   };
// };

// const stopSSE = () => {
//   if (eventSource) {
//     console.log('Worker: Closing SSE connection.');
//     eventSource.removeEventListener('reset', handleEvent);
//     eventSource.removeEventListener('add', handleEvent);
//     eventSource.removeEventListener('update', handleEvent);
//     eventSource.removeEventListener('remove', handleEvent);
//     eventSource.close();
//     eventSource = null;
//     currentUrl = null;
//     self.postMessage({ type: 'status', payload: 'closed' });
//   }
// };

// // Listen for messages from the main thread
// self.onmessage = (event: MessageEvent<WorkerMessage>) => {
//   const { type, payload } = event.data;

//   switch (type) {
//     case 'start':
//       if (payload) {
//         connectSSE(payload.apiKey, payload.endpoint, payload.filterParams);
//       } else {
//         console.warn('Worker: Start message received without payload.');
//       }
//       break;
//     case 'stop':
//       stopSSE();
//       break;
//     default:
//       console.warn('Worker: Unknown message type received:', type);
//   }
// };

// // Initial status
// self.postMessage({ type: 'status', payload: 'idle' });

// // Add this line to satisfy TypeScript's self-postMessage requirement for workers
// export {};
