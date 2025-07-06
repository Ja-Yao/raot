import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useRef, useState } from 'react';
import type { MapMouseEvent, ViewState } from 'react-map-gl/mapbox';
import Map, { FullscreenControl, GeolocateControl, NavigationControl, Popup } from 'react-map-gl/mapbox';
import ThemeToggle from './ThemeToggle';

import { getStop } from '@/api/stops';
import { useTheme } from '@/providers/theme-provider';
import type { GeoJsonProperties } from 'geojson';
import type { LineStringCollection } from 'types';
import MBTARouteLayer from './layers/MBTA/MBTARouteLayer';
import MBTAStreamLayer from './layers/MBTA/MBTAStreamLayer';
import { Separator } from './ui/separator';

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
  const [clickedFeatureId, setClickedFeatureId] = useState<string>('');
  const [clickInfo, setClickInfo] = useState<GeoJsonProperties>(null);
  const [isMBTAVisible, setIsMBTAVisible] = useState(false);
  const mapRef = useRef(null);

  const handleIconClick = useCallback(
    async (event: MapMouseEvent) => {
      const findStop = async (id: string) => {
        const stop = await getStop(id);
        return stop;
      };

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
            currentStatus = 'Arriving at';
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
      <ThemeToggle className='absolute bottom-10 left-2 z-1' />
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
      <FullscreenControl position='top-right' style={{ borderRadius: '8px' }} />
      {isLoaded && (
        <>
          <MBTARouteLayer shapes={shapes} setIsMBTAVisible={setIsMBTAVisible} />
          <MBTAStreamLayer visible={isMBTAVisible} />
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
                className='flex flex-col pb-4 min-w-30'
              >
                <h4 id='vehicle-route' className='font-bold text-xl'>
                  <>{/^\d+$/.test(clickInfo.route) ? `${clickInfo.route} Bus` : clickInfo.route}</>
                </h4>
                <Separator className='mt-1' />
                <div id='vehicle-data-content' className='mt-4 rid grid-rows-4 gap-1'>
                  <div className='grid grid-cols-2'>
                    <span className='font-semibold text-sm'>Direction:</span>
                    <p>{clickInfo.direction}</p>
                  </div>
                  <div className='grid grid-cols-2'>
                    <span className='font-semibold text-sm'>Status:</span>
                    <p>
                      {clickInfo.currentStatus} {clickInfo.stop}
                    </p>
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
