import { getPrediction } from '@/api/predictions';
import { getStop } from '@/api/stops';
import { useEffect, useState } from 'react';
import { Popup } from 'react-map-gl/mapbox';
import { toast } from 'sonner';
import { Separator } from './ui';

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
  const [stopData, setStopData] = useState<any | null>(null);
  const [predictionData, setPredictionData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setStopData(null);
      setPredictionData(null);
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
    currentStatus = 'In transit';
  } else if (vehicleStatus === 'INCOMING_AT') {
    currentStatus = 'Arriving at';
  }

  const stopName = stopData?.name; // Access name directly
  const eta = predictionData?.arrival_time;

  return (
    <Popup longitude={pendingData.position[0]} latitude={pendingData.position[1]} onClose={onClose}>
      <div
        id='vehicle-data-container'
        aria-label='Container for clicked vehicle data'
        className='flex flex-col pb-4 min-w-[196px]'
      >
        <h4 id='vehicle-route' className='font-bold text-xl'>
          <>{/^\d+$/.test(pendingData.route) ? `${pendingData.route} Bus` : pendingData.route}</>
        </h4>
        <Separator className='mt-1' />
        <div id='vehicle-data-content' className='mt-4 rid grid-rows-4 gap-1'>
          <div className='grid grid-cols-2'>
            <span className='font-semibold text-sm'>Direction:</span>
            <p>{pendingData.direction === '0' ? 'Outbound' : 'Inbound'}</p>
          </div>
          <div className='grid grid-cols-2'>
            <span className='font-semibold text-sm'>Status:</span>
            <p>{currentStatus}</p>
          </div>
          <div className='grid grid-cols-2'>
            <span className='font-semibold text-sm'>
              {`${currentStatus === 'Stopped at' ? 'Stop:' : 'Next Stop:'}`}
            </span>
            <p>{stopName}</p>
          </div>
          <div className='grid grid-cols-2'>
            <span className='font-semibold text-sm'>ETA:</span>
            <p>{eta ? new Date(eta).toLocaleTimeString() : 'N/A'}</p>
          </div>
        </div>
      </div>
    </Popup>
  );
}

export default VehiclePopup;
