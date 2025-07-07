import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useRef, useState } from 'react';
import type { MapMouseEvent, ViewState } from 'react-map-gl/mapbox';
import Map, { GeolocateControl, NavigationControl, Popup } from 'react-map-gl/mapbox';
import ThemeToggle from './ThemeToggle';

import { getPrediction } from '@/api/predictions';
import { getStop } from '@/api/stops';
import { useTheme } from '@/providers/theme-provider';
import type { GeoJsonProperties } from 'geojson';
import { toast } from 'sonner';
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
    longitude: -95,
    latitude: 39,
    zoom: 4,
  });
  const [clickedFeatureId, setClickedFeatureId] = useState<string>('');
  const [clickInfo, setClickInfo] = useState<GeoJsonProperties>(null);
  const [isMBTAVisible, setIsMBTAVisible] = useState(false);
  const mapRef = useRef(null);

  const findStop = async (id: string) => {
    try {
      const stopResult = await getStop(id);
      return { status: 'fulfilled', value: stopResult };
    } catch (error) {
      return { status: 'rejected', reason: error };
    }
  };

  const getTripPrediction = async (trip: string, stop: string, direction: string) => {
    try {
      const predictionResult = await getPrediction(trip, stop, direction);
      return { status: 'fulfilled', value: predictionResult };
    } catch (error) {
      return { status: 'rejected', reason: error };
    }
  };

  const fetchStopAndPrediction = async (id: string, trip: string, stop: string, direction: string) => {
    try {
      const [stopResult, predictionResult] = await Promise.allSettled([
        findStop(id),
        getTripPrediction(trip, stop, direction),
      ]);

      // Extract the value or reason from each result
      const stopValue = stopResult.status === 'fulfilled' ? stopResult.value : null;
      const predictionValue = predictionResult.status === 'fulfilled' ? predictionResult.value : null;

      return { stop: stopValue, prediction: predictionValue };
    } catch (error) {
      console.error('Error fetching stop and prediction:', error);
      toast.error('Something went wrong.', { description: 'Failed to fetch stop and prediction.' });
      throw error;
    }
  };

  const handleIconClick = useCallback(
    async (event: MapMouseEvent) => {
      const feature = event.features && event.features[0];
      if (feature) {
        if (feature.source === 'streaming-source' && feature.layer!.id === 'streaming-layer') {
          const { stop, prediction } = await fetchStopAndPrediction(
            feature.properties!.stop as string,
            feature.properties!.trip as string,
            feature.properties!.stop as string,
            feature.properties!.direction as string
          );

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
            currentStatus = 'In transit';
          } else if (vehicleStatus === 'INCOMING_AT') {
            currentStatus = 'Arriving at';
          }

          const stopName = stop?.value!.name;
          const eta = prediction?.value!.arrival_time!;
          const etd = prediction?.value!.departure_time!;

          console.log(eta);
          console.log(etd);

          // Create a new object combining feature.properties with additional properties
          const newClickInfo: GeoJsonProperties = {
            ...feature.properties,
            currentStatus: currentStatus,
            position: position,
            stop: stopName,
            eta: new Date(eta),
            etd: new Date(etd),
          };

          setClickInfo(newClickInfo);
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
              e.target.jumpTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 15 });
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
      {/* <FullscreenControl position='top-right' style={{ borderRadius: '8px' }} /> */}
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
                className='flex flex-col pb-4 min-w-[196px]'
              >
                <h4 id='vehicle-route' className='font-bold text-xl'>
                  <>{/^\d+$/.test(clickInfo.route) ? `${clickInfo.route} Bus` : clickInfo.route}</>
                </h4>
                <Separator className='mt-1' />
                <div id='vehicle-data-content' className='mt-4 rid grid-rows-4 gap-1'>
                  <div className='grid grid-cols-2'>
                    <span className='font-semibold text-sm'>Direction:</span>
                    <p>{clickInfo.direction === '0' ? 'Outbound' : 'Inbound'}</p>
                  </div>
                  <div className='grid grid-cols-2'>
                    <span className='font-semibold text-sm'>Status:</span>
                    <p>{clickInfo.currentStatus}</p>
                  </div>
                  <div className='grid grid-cols-2'>
                    <span className='font-semibold text-sm'>
                      {`${clickInfo.currentStatus === 'Stopped at' ? 'Stop:' : 'Next Stop:'}`}
                    </span>
                    <p>{clickInfo.stop}</p>
                  </div>
                  <div className='grid grid-cols-2'>
                    <span className='font-semibold text-sm'>ETA:</span>
                    <p>{clickInfo.eta.toLocaleTimeString()}</p>
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
