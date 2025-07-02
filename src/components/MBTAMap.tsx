import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import type { ViewState } from 'react-map-gl/mapbox';
import Map, { GeolocateControl, Layer, NavigationControl, Source } from 'react-map-gl/mapbox';
import { getTimes } from 'suncalc';

import type {
  LineStringCollection,
  PointCollection,
  Route,
  Shape,
  Trip
} from 'types';
import { getRoutes } from '../api/all-routes';
import { shapesToFeatureCollection } from '../helpers/conversions';

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
