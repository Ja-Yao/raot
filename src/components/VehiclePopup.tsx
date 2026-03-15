import { getPrediction } from '@/api/mbta/predictions';
import { getStop } from '@/api/mbta/stops';
import type { Prediction, Stop } from '@/api/mbta/types';
import { differenceInMinutes } from 'date-fns';
import { useEffect, useState } from 'react';
import { Popup } from 'react-map-gl/mapbox';
import { toast } from 'sonner';
import { Container } from './ui/layouts/container';
import { Heading } from './ui/surfaces/heading';
import { Separator } from './ui/surfaces/separator';
import { Text } from './ui/surfaces/text';

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
      getTripPrediction(trip, stop, direction)
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

interface PendingVehicleData {
  stopId: string;
  tripId: string;
  direction: string;
  position: [number, number];
  currentStatus: string;
  route: string;
  label: string;
}

function VehiclePopup({ pendingData, onClose }: { pendingData: PendingVehicleData; onClose: () => void }) {
  const [stopData, setStopData] = useState<Stop | undefined>(undefined);
  const [predictionData, setPredictionData] = useState<Prediction | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setStopData(undefined);
      setPredictionData(undefined);
      try {
        const { stop, prediction } = await fetchStopAndPrediction(
          pendingData.stopId,
          pendingData.tripId,
          pendingData.stopId, // Assuming stopId is also the 'stop' param for prediction
          pendingData.direction
        );
        setStopData(stop!.value); // Access the value from the fulfilled promise
        setPredictionData(prediction!.value); // Access the value from the fulfilled promise
      } catch (err) {
        setError(err);
        toast.error('Failed to fetch vehicle details.');
      } finally {
        setLoading(false);
      }
    };

    if (pendingData) {
      // Only fetch if there's valid pendingData
      fetchData();
    }
  }, [pendingData]); // Re-fetch when pendingData changes

  if (loading) {
    return (
      <Popup longitude={pendingData.position[0]} latitude={pendingData.position[1]} onClose={onClose}>
        <div>Loading vehicle data...</div>
      </Popup>
    );
  }

  if (error) {
    return (
      <Popup longitude={pendingData.position[0]} latitude={pendingData.position[1]} onClose={onClose}>
        <div>Error loading data.</div>
      </Popup>
    );
  }

  // Ensure stopData and predictionData are available before rendering content
  if (!stopData || !predictionData) {
    return null; // Or some other fallback if data is unexpectedly missing after loading
  }

  const vehicleStatus = pendingData.currentStatus;
  let currentStatus;
  if (vehicleStatus === 'STOPPED_AT') {
    currentStatus = 'Stopped at';
  } else if (vehicleStatus === 'IN_TRANSIT_TO') {
    currentStatus = 'Next stop';
  } else if (vehicleStatus === 'INCOMING_AT') {
    currentStatus = 'Arriving at';
  }

  const stopName = stopData?.name; // Access name directly
  const eta = predictionData?.arrival_time;

  const delta = differenceInMinutes(new Date(eta), Date.now());

  return (
    <Popup longitude={pendingData.position[0]} latitude={pendingData.position[1]} onClose={onClose}>
      <div id='vehicle-data-container' aria-label='Container for clicked vehicle data' className='flex flex-col p-4'>
        <Heading level={4} id='vehicle-route' className='font-bold text-xl'>
          <>{/^\d+$/.test(pendingData.route) ? `${pendingData.route} Bus` : pendingData.route}</>
        </Heading>
        <Text className='text-muted-fg'>{pendingData.direction === '0' ? 'Outbound' : 'Inbound'}</Text>
        <Separator className='mt-1' />
        <Container id='vehicle-data-content' className='p-0'>
          <Text className='text--fg'>
            {currentStatus} {stopName} {currentStatus !== 'Stopped at' ? `in ${delta} minutes` : ''}
          </Text>
        </Container>
      </div>
    </Popup>
  );
}

export default VehiclePopup;
