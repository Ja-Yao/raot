import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import type { ViewState } from 'react-map-gl/mapbox';
import Map, { GeolocateControl, Layer, NavigationControl, Source } from 'react-map-gl/mapbox';
import { getTimes } from 'suncalc';

import { toast } from 'sonner';
import type {
  LineStringCollection,
  MBTAData,
  MBTASSEEventData,
  MBTASSERemoveEvent,
  MBTASSEUpdateEvent,
  PointCollection,
  Route,
  Shape,
  Trip,
  WorkerMessageFromWorker,
} from 'types';
import { getRoutes } from '../api/all-routes';
import { shapesToFeatureCollection, streamingEventToPoint } from '../helpers/conversions';
import MBTASSEWorker from '../workers/mbta-worker?worker';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_KEY;
const MBTA_KEY = import.meta.env.VITE_MBTA_KEY;

interface Props {
  setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
}

const StreamStatuses = {
  idle: 'idle',
  connecting: 'connecting',
  open: 'open',
  closed: 'closed',
  error: 'error',
} as const;

type StreamStatus = (typeof StreamStatuses)[keyof typeof StreamStatuses];

const routeTypes = '0,1,3';

function MBTAMap({ setRoutes }: Props) {
  const [isRendered, setIsRendered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shapes, setShapes] = useState<LineStringCollection>({
    type: 'FeatureCollection',
    features: [],
  });
  const [viewState, setViewState] = useState<React.ComponentProps<typeof Map>['initialViewState'] | ViewState>({
    longitude: -71.0565,
    latitude: 42.3555,
    zoom: 15,
  });
  const [vehicleData, setVehicleData] = useState<PointCollection>({ type: 'FeatureCollection', features: [] });
  const [connectionStatus, setConnectionStatus] = useState<StreamStatus>('closed');
  const [hoverInfo, setHoverInfo] = useState()
  const mapRef = useRef(null);

  // Fetch routes and shapes when the component mounts
  useEffect(() => {
    const fetchRoutes = async () => {
      const chainedRoutes = await getRoutes({
        key: MBTA_KEY,
        filterTypes: routeTypes,
        include: 'route_patterns.representative_trip.shape',
      });
      const parsedRoutes = chainedRoutes.data;

      parsedRoutes.forEach((route) => {
        route.attributes.color = '#' + route.attributes.color;
      });

      if (chainedRoutes?.included) {
        const parsedTrips = chainedRoutes.included.filter(
          (item) => item.type === 'trip'
        ) as Trip[];

        const parsedShapes = chainedRoutes.included.filter(
          (item) => item.type === 'shape'
        ) as Shape[];
        const shapesCollection = shapesToFeatureCollection(parsedShapes);

        shapesCollection.features.forEach((feature) => {
          if (!feature.properties) throw new Error('Feature properties are undefined');

          const properties = feature.properties;
          const shapeId = properties?.id as string;
          const relatedTrip = parsedTrips.find((trip) => trip.relationships.shape.data.id === shapeId);
          if (relatedTrip) {
            const relatedRoute = parsedRoutes.find((route) => route.id === relatedTrip.relationships.route.data.id);
            if (relatedRoute) {
              feature.properties['color'] = relatedRoute.attributes.color;
            }
          } else {
            throw new Error(`No trip found for shape ID ${shapeId}}`);
          }
        });

        setRoutes(parsedRoutes);
        setShapes(shapesCollection);
      }
    };
    fetchRoutes();
  }, []);

  // Use useRef to store the worker instance so it persists across renders
  const workerRef = useRef<Worker | null>(null);
  useEffect(() => {
    const setupWorker = () => {
      workerRef.current = new MBTASSEWorker();
      console.debug('Main thread: Web Worker initialized.');

      workerRef.current.onmessage = (event: MessageEvent<WorkerMessageFromWorker>) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'status':
            setConnectionStatus(payload as StreamStatus); // Type assertion for simple string status
            break;
          case 'data':
            const { eventType, data: eventData } = payload;
            // Apply the updates to the main thread's state
            switch (eventType) {
              case 'reset':
                // convert event data to feature collection & cast eventData as MBTASSEEEventData[]
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
            console.error('Main thread: Caught error from worker:', event);
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

      filterParams.append('filter[route_type]', routeTypes);

      workerRef.current.postMessage({
        type: 'start',
        payload: { apiKey: MBTA_KEY, endpoint: 'vehicles', filterParams: filterParams.toString() },
      });
    };
    setupWorker();

    // Cleanup function: Send 'stop' message to worker and terminate it
    return () => {
      if (workerRef.current) {
        console.debug('Main thread: Sending stop message to worker and terminating.');
        workerRef.current.postMessage({ type: 'stop' });
        workerRef.current.terminate(); // Important: terminate the worker when component unmounts
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

        const center = e.target.getCenter();
        const today = new Date();
        const sunTimes = getTimes(today, center.lat, center.lng);
        const dawn = sunTimes.dawn.getTime();
        const sunrise = sunTimes.sunriseEnd.getTime();
        const sunset = sunTimes.sunsetStart.getTime();
        const dusk = sunTimes.dusk.getTime();
        const time = today.getTime();
        const twentyMinutes = 1.2e6;

        let preset;
        if (time >= dawn - twentyMinutes && time < sunrise) {
          // Before sunrise, within the 20-minute window
          preset = 'dawn';
        } else if (time >= sunrise + twentyMinutes && time < sunset - twentyMinutes) {
          preset = 'day';
        } else if (time >= sunset - twentyMinutes && time < dusk) {
          preset = 'dusk';
        } else {
          preset = 'night';
        }

        const currentPreset: string = e.target.getConfigProperty('basemap', 'lightPreset');
        if (currentPreset && currentPreset !== preset) {
          e.target.setConfigProperty('basemap', 'lightPreset', preset);
        }
      }}
      onLoad={(e) => {
        e.target.loadImage('src/assets/navigation-arrow.png', (error, image) => {
          if (error) throw error;
          e.target.addImage('nav-arrow', image as HTMLImageElement);
        });
        setIsLoaded(true);
      }}
    >
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
                'line-emissive-strength': 1,
              }}
              minzoom={10}
            />
          </Source>
          {connectionStatus === 'open' && (
            <Source id='streaming-source' type='geojson' data={vehicleData}>
              <Layer
                id='streaming-layer'
                type='symbol'
                source='streaming-source'
                layout={{
                  'icon-image': 'nav-arrow',
                  'icon-allow-overlap': true,
                  'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 1.25],
                  'icon-rotate': ['get', 'bearing'],
                }}
                paint={{
                  // 'icon-color': [
                  //   'match',
                  //   ['get', 'route'],
                  //   'Red',
                  //   '#da291c',
                  //   'Orange',
                  //   '#ed8b00',
                  //   'Blue',
                  //   '#003da5',
                  //   'Green-B',
                  //   '#00843d',
                  //   'Green-C',
                  //   '#00843d',
                  //   'Green-D',
                  //   '#00843d',
                  //   'Green-E',
                  //   '#00843d',
                  //   '#FFC72C',
                  // ],
                  'icon-emissive-strength': 1,
                }}
                minzoom={10}
              />
            </Source>
          )}
        </>
      )}
    </Map>
  );
}

export default MBTAMap;
