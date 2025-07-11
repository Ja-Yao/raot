import 'mapbox-gl/dist/mapbox-gl.css';
import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import type { MapEvent, MapMouseEvent, ViewState } from 'react-map-gl/mapbox';
import Map, { GeolocateControl, NavigationControl } from 'react-map-gl/mapbox';
import ThemeToggle from './ThemeToggle';

import { useTheme } from '@/providers/theme-provider';
import * as turf from '@turf/turf';
import { LoaderCircle } from 'lucide-react';
import type { LineStringCollection, SupportedSystems } from 'types';
import MBTARouteLayer from './layers/MBTA/MBTARouteLayer';
import MBTAStreamLayer from './layers/MBTA/MBTAStreamLayer';
import { Button } from './ui';
import VehiclePopup from './VehiclePopup';
const Alerts = lazy(() => import('./Alerts'));

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_KEY;
const supportedSystems = {
  mbta: 'MBTA',
} as const;

interface Props {
  shapes: LineStringCollection;
}

// Define a type for the pending data to store in state
interface PendingVehicleData {
  stopId: string;
  tripId: string;
  direction: string;
  position: [number, number]; // Add position here for the popup
  currentStatus: string;
  route: string;
  label: string;
}

function MBTAMap({ shapes }: Props) {
  const { theme } = useTheme();
  const [isRendered, setIsRendered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewState, setViewState] = useState<React.ComponentProps<typeof Map>['initialViewState'] | ViewState>({
    longitude: -95,
    latitude: 39,
    zoom: 4,
  });
  const [clickInfo, setClickInfo] = useState<PendingVehicleData | null>(null);
  const [visibleTransitSystems, setVisibleTransitSystems] = useState<SupportedSystems[]>([]);
  const mapRef = useRef(null);

  /**
   * Checks if a given transit system should be visible based on the current map center.
   * 
   * @param event The render event from the {@link https://visgl.github.io/react-map-gl/|react-map-gl} map
   * @param system Supported transit system to check
   */
  const checkVisibility = (event: MapEvent, system: SupportedSystems) => {
    // if the map is too far zoomed out, hide all transit systems
    if (event.target.getZoom() < 5){
      if (visibleTransitSystems.includes(system)) {
        setVisibleTransitSystems((prev) => [...prev].filter((s) => s !== system));
        return;
      }
    }

    const mapBounds = event.target.getCenter().toArray();
    const bufferedBBox = turf.buffer(turf.bboxPolygon(turf.bbox(shapes)), 15, { units: 'kilometers' });
    const shapesBBox = turf.bboxPolygon(turf.bbox(bufferedBBox!));

    if (turf.booleanPointInPolygon(turf.getCoord(turf.point(mapBounds as number[])), shapesBBox)) {
      if (!visibleTransitSystems.includes(system)) {
        console.debug(`${system} not present in list of visible systems, adding...`);
        setVisibleTransitSystems((prev) => [...prev, system]);
      }
    } else {
      console.debug("'MBTA' is no longer visible, updating state...");
      setVisibleTransitSystems((prev) => [...prev].filter((s) => s !== system));
    }
  };

  const handleIconClick = useCallback((event: MapMouseEvent) => {
    const feature = event.features && event.features[0];
    if (feature) {
      if (feature.source?.includes('streaming-source') && feature.layer!.id.includes('streaming-layer')) {
        // Extract the necessary properties and set state
        let position = feature.properties!.position;
        position = position
          .substring(1, position.length - 1)
          .split(',')
          .map(Number) as [number, number];

        setClickInfo({
          stopId: feature.properties!.stop as string,
          tripId: feature.properties!.trip as string,
          direction: feature.properties!.direction as string,
          position: position,
          currentStatus: feature.properties!.currentStatus as string,
          route: feature.properties!.route as string,
          label: feature.properties!.label as string,
        });
      }
    }
  }, []);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
      mapStyle='mapbox://styles/mapbox/standard'
      initialViewState={viewState}
      projection={`${navigator.maxTouchPoints > 1 ? 'mercator' : 'globe'}`}
      interactiveLayerIds={['mbta-streaming-layer']}
      onMove={(e) => setViewState(e.viewState)}
      onRender={(e) => {
        e.target.resize();

        Object.values(supportedSystems).forEach((system) => {
          checkVisibility(e, system);
        });
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

        // Geolocate on load, but only if not already loaded to prevent multiple calls
        if (navigator.geolocation && !isRendered) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              e.target.jumpTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 15 });
              setIsRendered(true); // Set isLoaded to true after initial geolocation
            },
            (error) => {
              console.error('Error getting location:', error);
              setIsRendered(true); // Still set loaded even if geolocation fails to prevent infinite loop
            }
          );
        }

        setIsLoaded(true);
      }}
      onClick={handleIconClick}
      onMouseEnter={(e) => {
        if (e.features && e.features.some((f) => f.layer?.id.includes('streaming-layer'))) {
          e.target.getCanvas().style.cursor = 'pointer';
        }
      }}
      onMouseLeave={(e) => {
        if (e.features && e.features.some((f) => f.layer?.id.includes('streaming-layer'))) {
          e.target.getCanvas().style.cursor = '';
        }
      }}
    >
      <div className='grid grid-cols-2 gap-3 absolute top-4 right-2 z-1'>
        <div className='size-9'>
          <Suspense
            fallback={
              <Button disabled variant='secondary' size='icon' className='rounded-xl'>
                <LoaderCircle className='animate-spin' />
              </Button>
            }
          >
            <Alerts />
          </Suspense>
        </div>
        <ThemeToggle />
      </div>
      <NavigationControl position='bottom-right' style={{ borderRadius: '0.5rem' }} />
      <GeolocateControl
        positionOptions={{ enableHighAccuracy: true }}
        trackUserLocation={true}
        showUserHeading={true}
        showUserLocation={true}
        position='bottom-right'
        style={{ borderRadius: '0.5rem' }}
        onGeolocate={(pos) => {
          setViewState({
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
          });
        }}
      />
      {isLoaded && (
        <>
          {visibleTransitSystems.includes('MBTA') && (
            <>
              <MBTARouteLayer shapes={shapes} />
              <MBTAStreamLayer />
            </>
          )}
          {clickInfo && <VehiclePopup pendingData={clickInfo} onClose={() => setClickInfo(null)} />}
        </>
      )}
    </Map>
  );
}

export default MBTAMap;
