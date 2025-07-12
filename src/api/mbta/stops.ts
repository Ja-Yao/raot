import type { Stop } from 'types';
import { MBTA_KEY } from './common';

/**
 * Gets the details of a stop
 * @param stop_id The stop ID.
 * @returns The stop attributes from the MBTA API. This should never return null due to how the MBTA handles relationships
 */
export async function getStop(stop_id: string): Promise<Stop> {
  const response = await fetch(`/api/stops/${stop_id}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': MBTA_KEY,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const parsed = response
    .json()
    .then((json) => {
      return json.data.attributes;
    })
    .catch((error) => {
      console.error('Error fetching shapes', error);
      throw error;
    });
  return parsed;
}
