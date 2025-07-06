import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MapMouseEvent, ViewState } from 'react-map-gl/mapbox';
import Map, { GeolocateControl, Layer, NavigationControl, Popup, Source } from 'react-map-gl/mapbox';
import ThemeToggle from './ThemeToggle';

import { MBTA_KEY, ROUTE_TYPES } from '@/api/common';
import { useTheme } from '@/providers/theme-provider';
import { proxy, wrap, type Remote } from 'comlink';
import type { GeoJsonProperties } from 'geojson';
import { toast } from 'sonner';
import type {
  LineStringCollection,
  MBTAData,
  MBTASSEEventData,
  MBTASSERemoveEvent,
  MBTASSEUpdateEvent,
  MBTAWorkerAPI,
  PointCollection,
  StreamStatus,
  WorkerMessageFromWorker
} from 'types';
import { streamingEventToPoint } from '../helpers/conversions';
import MBTASSEWorker from '../workers/mbta-worker?worker';
import { Separator } from './ui/separator';
import { getStop } from '@/api/stops';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_KEY;

interface Props {
  shapes: LineStringCollection;
}

function MBTAMap({ shapes }: Props) {
  const { theme } = useTheme();
  const [isRendered, setIsRendered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewState, setViewState] = useState<React.ComponentProps<typeof Map>['initialViewState'] | ViewState>({
    longitude: -71.0565,
    latitude: 42.3555,
    zoom: 15,
  });
  const [vehicleData, setVehicleData] = useState<PointCollection>({ type: 'FeatureCollection', features: [] });
  const [connectionStatus, setConnectionStatus] = useState<StreamStatus>('closed');
  const [clickedFeatureId, setClickedFeatureId] = useState<string>('');
  const [clickInfo, setClickInfo] = useState<GeoJsonProperties>(null);
  const mapRef = useRef(null);

  const findStop = async (id: string) => {
    const stop = await getStop(id);
    return stop;
  };

  const handleIconClick = useCallback(async (event: MapMouseEvent) => {
      const feature = event.features && event.features[0];
      if (feature) {
        if (feature.source === 'streaming-source' && feature.layer!.id === 'streaming-layer') {
          const relatedStop = await findStop(feature.properties!.stop);
          setClickedFeatureId(feature.properties!.label);

          let position = feature.properties!.position;
          position = position
            .substring(1, position.length - 1)
            .split(',')
            .map(Number) as [number, number];
          const vehicleStatus = feature.properties!.currentStatus;

          let currentStatus;
          if (vehicleStatus === 'STOPPED_AT') {
            currentStatus = 'Stopped at';
          } else if (vehicleStatus === 'IN_TRANSIT_TO') {
            currentStatus = 'In transit to';
          } else if (vehicleStatus === 'INCOMING_AT') {
            currentStatus = 'Arriving at'
          }
          setClickInfo({
            ...feature.properties,
            currentStatus: currentStatus,
            position: position,
            stop: relatedStop.name,
          });
        }
      }
    },
    [clickedFeatureId, clickInfo]
  );

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
            setConnectionStatus(payload as StreamStatus);
            break;
          case 'data':
            const { eventType, data: eventData } = payload;
            switch (eventType) {
              case 'reset':
                const vehicleData = eventData as MBTASSEEventData[];
                setVehicleData({
                  type: 'FeatureCollection',
                  features: vehicleData.map((vehicle) => streamingEventToPoint(vehicle)),
                });
                break;
              case 'add':
                const addedItem = eventData as MBTAData;
                setVehicleData((prevData) => {
                  const newFeatures = [...prevData.features, addedItem];
                  return { ...prevData, features: newFeatures } as PointCollection;
                });
                break;
              case 'update':
                const updatedItem = streamingEventToPoint(eventData as MBTASSEUpdateEvent['data']);
                setVehicleData((prevData) => {
                  const newFeatures = prevData.features.map((feature) =>
                    feature.id === updatedItem.id ? updatedItem : feature
                  );
                  return { ...prevData, features: newFeatures };
                });
                break;
              case 'remove':
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
      }
    };
  }, []);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
      mapStyle='mapbox://styles/mapbox/standard'
      initialViewState={viewState}
      projection='globe'
      interactiveLayerIds={['streaming-layer']}
      onMove={(e) => setViewState(e.viewState)}
      onRender={(e) => {
        e.target.resize();

        // Geolocate on load, but only if not already loaded to prevent multiple calls
        if (navigator.geolocation && !isRendered) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              e.target.jumpTo({ center: [position.coords.longitude, position.coords.latitude] });
              setIsRendered(true); // Set isLoaded to true after initial geolocation
            },
            (error) => {
              console.error('Error getting location:', error);
              setIsRendered(true); // Still set loaded even if geolocation fails to prevent infinite loop
            }
          );
        }
      }}
      onLoad={(e) => {
        e.target.loadImage('src/assets/navigation-arrow.png', (error, image) => {
          if (error) throw error;
          e.target.addImage('nav-arrow', image as HTMLImageElement, { sdf: true });
        });

        if (theme == 'light') {
          e.target.setConfigProperty('basemap', 'lightPreset', 'day');
        } else if (theme == 'dark') {
          e.target.setConfigProperty('basemap', 'lightPreset', 'night');
        } else {
          const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          isDarkMode
            ? e.target.setConfigProperty('basemap', 'lightPreset', 'night')
            : e.target.setConfigProperty('basemap', 'lightPreset', 'day');
        }
        setIsLoaded(true);
      }}
      onClick={handleIconClick}
    >
      <ThemeToggle className='absolute top-2 right-2 z-1' />
      <NavigationControl position='bottom-right' style={{ borderRadius: '8px' }} />
      <GeolocateControl
        positionOptions={{ enableHighAccuracy: true }}
        trackUserLocation={true}
        showUserHeading={true}
        showUserLocation={true}
        position='bottom-right'
        style={{ borderRadius: '8px' }}
        onGeolocate={(pos) => {
          setViewState({
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
          });
        }}
      />
      {isLoaded && (
        <>
          <Source id='shape-source' type='geojson' data={shapes}>
            <Layer
              id='shape-layer'
              type='line'
              source='shape-source'
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{
                'line-width': ['interpolate', ['linear'], ['zoom'], 8, 2, 40, 8],
                'line-color': ['case', ['has', 'color'], ['get', 'color'], 'transparent'],
                'line-emissive-strength': 0.75,
              }}
              minzoom={10}
            />
          </Source>
          {connectionStatus === 'open' && (
            <Source id='streaming-source' type='geojson' data={vehicleData}>
              <Layer
                id='streaming-layer'
                type='circle'
                source='streaming-source'
                layout={{}}
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
          )}
          {clickInfo && (
            <Popup
              longitude={clickInfo.position[0]}
              latitude={clickInfo.position[1]}
              onClose={() => {
                setClickInfo(null);
                setClickedFeatureId('');
              }}
            >
              <div
                id='vehicle-data-container'
                aria-label='Container for clicked vehicle data'
                className='flex flex-col pb-4 px-2 min-w-30'
              >
                <h4 id='vehicle-route' className='font-bold text-xl'>
                  {clickInfo.route}
                </h4>
                <Separator />
                <div id='vehicle-data-content' className='mt-4 rid grid-rows-4 gap-1'>
                  <div className='grid grid-cols-2'>
                    <span className='font-semibold text-sm'>Direction:</span>
                    <p>{clickInfo.direction}</p>
                  </div>
                  <div className='grid grid-cols-2'>
                    <span className='font-semibold text-sm'>Status:</span>
                    <p>{clickInfo.currentStatus} {clickInfo.stop}</p>
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </>
      )}
    </Map>
  );
}

export default MBTAMap;
