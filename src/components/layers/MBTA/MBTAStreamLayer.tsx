import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import { Layer, Source } from 'react-map-gl/mapbox';
import type { PointCollection } from 'types';

import { MBTA_KEY, ROUTE_TYPES } from '@/api/common';
import { streamingEventToPoint } from '@/helpers/conversions';
import MBTASSEWorker from '@/workers/mbta-worker?worker';
import { proxy, wrap, type Remote } from 'comlink';
import { toast } from 'sonner';
import type {
  MBTAData,
  MBTASSEEventData,
  MBTASSERemoveEvent,
  MBTASSEUpdateEvent,
  MBTAWorkerAPI,
  WorkerMessageFromWorker
} from 'types';

function MBTAStreamLayer() {
  const [vehicleData, setVehicleData] = useState<PointCollection>({ type: 'FeatureCollection', features: [] });

  // Use useRef to store the worker instance so it persists across renders
  const workerRef = useRef<Remote<MBTAWorkerAPI>>(null);
  useEffect(() => {
    const setupWorker = async () => {
      // Wrap the worker with Comlink
      const workerInstance = new MBTASSEWorker();
      workerRef.current = wrap<MBTAWorkerAPI>(workerInstance);
      console.debug('Main thread: Web Worker initialized with Comlink.');

      // Define the callback function to handle messages from the worker
      const handleWorkerMessage = (message: WorkerMessageFromWorker) => {
        const { type, payload } = message;

        switch (type) {
          case 'status':
            // no action required
            if (payload.data === 'connected') {
              toast.success('Connected to MBTA Stream')
            }
            console.debug(`SSE connection status: ${payload.data}`)
            break;
          case 'data':
            const { eventType, data: eventData } = payload;
            switch (eventType) {
              case 'reset':
                // contains the full current state of the endpoint. This is always the first event in the SSE stream.
                const vehicleData = eventData as MBTASSEEventData[];
                setVehicleData({
                  type: 'FeatureCollection',
                  features: vehicleData.map((vehicle) => streamingEventToPoint(vehicle)),
                });
                break;
              case 'add':
                // contains data for a new vehicle added to the stream
                const addedItem = eventData as MBTAData;
                setVehicleData((prevData) => {
                  const newFeatures = [...prevData.features, addedItem];
                  return { ...prevData, features: newFeatures } as PointCollection;
                });
                break;
              case 'update':
                // contains data for an existing vehicle updated in the stream
                const updatedItem = streamingEventToPoint(eventData as MBTASSEUpdateEvent['data']);
                setVehicleData((prevData) => {
                  const newFeatures = prevData.features.map((feature) =>
                    feature.id === updatedItem.id ? updatedItem : feature
                  );
                  return { ...prevData, features: newFeatures };
                });
                break;
              case 'remove':
                // contains data for a vehicle removed from the stream
                const removedItem = eventData as MBTASSERemoveEvent['data'];
                setVehicleData((prevData) => {
                  const newFeatures = prevData.features.filter((feature) => feature.id !== removedItem.id);
                  return { ...prevData, features: newFeatures };
                });
                break;
              default:
                console.warn('Main thread: Unknown MBTA event type from worker:', eventType);
                break;
            }
            break;
          case 'error':
            console.error('Main thread: Caught error from worker:', message);
            toast.error("Got an error message. If icons aren't showing, refresh the page", {
              description: new Date().toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZoneName: 'short',
              }),
            });
            break;
          default:
            console.warn('Main thread: Unknown message type from worker:', type);
            toast.warning('Got a strange message from the MBTA', {
              description: new Date().toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZoneName: 'short',
              }),
            });
            break;
        }
      };

      const filterParams = new URLSearchParams();
      filterParams.append('filter[route_type]', ROUTE_TYPES);

      // Call the exposed worker function directly
      if (workerRef.current) {
        await workerRef.current.startStreaming(
          { apiKey: MBTA_KEY, endpoint: 'vehicles', filterParams: filterParams.toString() },
          proxy(handleWorkerMessage) // Use Comlink.proxy to pass the callback
        );
      }
    };
    setupWorker();

    // Cleanup function: Send 'stop' message to worker and terminate it
    return () => {
      if (workerRef.current) {
        console.debug('Main thread: Sending stop message to worker and terminating.');
        workerRef.current.stopStreaming(); // Call the exposed stop function
        // Comlink handles the termination of the underlying worker instance when the proxy is no longer referenced.
        // However, explicitly terminating the worker can be done if needed, but Comlink usually manages the lifecycle.
        // If you want to explicitly terminate the underlying worker:
        // (workerRef.current as any)[Comlink.releaseProxy](); // This releases the proxy and potentially the worker
        workerRef.current = null;
        setVehicleData({ type: 'FeatureCollection', features: [] });
      }
    };
  }, []);

  return (
    <Source id='mbta-streaming-source' type='geojson' data={vehicleData}>
      <Layer
        id='mbta-streaming-layer'
        type='circle'
        source='mbta-streaming-source'
        slot='top'
        paint={{
          'circle-color': [
            'match',
            ['get', 'route'],
            'Red',
            '#da291c',
            'Orange',
            '#ed8b00',
            'Blue',
            '#003da5',
            'Green-B',
            '#00843d',
            'Green-C',
            '#00843d',
            'Green-D',
            '#00843d',
            'Green-E',
            '#00843d',
            '#FFC72C',
          ],
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2,
          'circle-radius': ['case', ['boolean', ['feature-state', 'hover'], false], 20, 7],
          'circle-radius-transition': {
            duration: 0,
            delay: 0,
          },
          'circle-emissive-strength': 1,
        }}
        minzoom={10}
      />
    </Source>
  );
}

export default MBTAStreamLayer;