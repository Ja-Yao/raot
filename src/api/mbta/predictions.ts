import type { Prediction } from 'types';
import { MBTA_KEY } from './common'

export async function getPrediction(tripId: string, stopId: string, directionId: string): Promise<Prediction> {
  const params = new URLSearchParams()
  
  params.append('filter[trip]', tripId);
  params.append('filter[stop]', stopId);
  params.append('filter[direction_id]', directionId);

  const response = await fetch(`/api/predictions?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': MBTA_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const parsed = await response.json().then(json => json.data[0].attributes);

  return parsed;
}