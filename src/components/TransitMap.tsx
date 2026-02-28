import { useTheme } from '@/providers/theme-provider';
import * as turf from '@turf/turf';
import type { GeoJSONSource } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import type { MapEvent, MapMouseEvent, MapRef, ViewState } from 'react-map-gl/mapbox';
import Map, { GeolocateControl, NavigationControl } from 'react-map-gl/mapbox';
import { supportedSystems, type LineStringCollection, type SupportedSystems } from '../../types';
import MBTARouteLayer from './layers/MBTA/MBTARouteLayer';
import MBTAStreamLayer from './layers/MBTA/MBTAStreamLayer';
import ThemeToggle from './ThemeToggle';
import { Button } from './ui';
import { ProgressCircle } from './ui/progress-circle';
import VehiclePopup from './VehiclePopup';
const Alerts = lazy(() => import('./Alerts'));

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY;

// TODO:
// - Update shapes to be a collection of linestring collections
// - rename TransitMap to Map

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

function TransitMap({ shapes }: Props) {
  const { theme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewState, setViewState] = useState<React.ComponentProps<typeof Map>['initialViewState'] | ViewState>({
    longitude: -95,
    latitude: 39,
    zoom: 4
  });
  const [clickInfo, setClickInfo] = useState<PendingVehicleData | null>(null);
  const [visibleTransitSystems, setVisibleTransitSystems] = useState<SupportedSystems[]>([]);
  const mapRef = useRef<MapRef>(null);

  /**
   * Checks if a given transit system should be visible based on the current map center.
   *
   * @param event The render event from the {@link https://visgl.github.io/react-map-gl/|react-map-gl} map
   * @param system Supported transit system to check
   */
  const checkVisibility = (event: MapEvent, system: SupportedSystems) => {
    // if the map is too far zoomed out, hide all transit systems
    if (event.target.getZoom() < 5) {
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
        setVisibleTransitSystems((prev) => [...prev, system]);
      }
    } else {
      setVisibleTransitSystems((prev) => [...prev].filter((s) => s !== system));
    }
  };

  const handleIconClick = useCallback((event: MapMouseEvent) => {
    const feature = event.features && event.features[0];
    if (feature) {
      const source = feature.source!;
      if (feature.layer!.id.includes('clusters')) {
        const clusterId = feature.properties!.cluster_id;

        const mapboxSource = mapRef.current!.getSource(source) as GeoJSONSource;

        mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom === null) {
            return;
          }

          if (feature.geometry.type === 'Point') {
            mapRef.current!.flyTo({
              center: [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
              zoom,
              duration: 500
            });
          }
        });
      } else if (feature.source?.includes('streaming-source') && feature.layer!.id.includes('unclustered')) {
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
          label: feature.properties!.label as string
        });
      }
    }
  }, []);

  return (
    <Map
      style={{ zIndex: 0 }}
      ref={mapRef}
      mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
      mapStyle='mapbox://styles/mapbox/standard'
      initialViewState={viewState}
      projection={`${navigator.maxTouchPoints > 1 ? 'mercator' : 'globe'}`}
      interactiveLayerIds={['mbta-streaming-layer_clusters', 'mbta-streaming-layer_unclustered']}
      onMove={(e) => setViewState(e.viewState)}
      fog={{
        color: 'rgb(186, 210, 235)', // Lower atmosphere
        'high-color': 'rgb(36, 92, 223)', // Upper atmosphere
        'horizon-blend': 0.01, // Atmosphere thickness (default 0.2 at low zooms)
        'space-color': 'rgb(11, 11, 25)', // Background color
        'star-intensity': 0.6
      }}
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
              <Button intent='secondary' className='rounded-xl'>
                <ProgressCircle aria-label='Loading...' isIndeterminate />
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
            pitch: 0
          });
        }}
      />
      {isLoaded && (
        <>
          <MBTAStreamLayer />
          {visibleTransitSystems.includes('MBTA') && (
            <>
              <MBTARouteLayer shapes={shapes} />
            </>
          )}
          {clickInfo && <VehiclePopup pendingData={clickInfo} onClose={() => setClickInfo(null)} />}
        </>
      )}
    </Map>
  );
}

export default TransitMap;
