import type { AlertResponse } from 'types';
import { MBTA_KEY, ROUTE_TYPES } from './common';

/**
 * Gets all the current and upcoming alerts on the MBTA system for the supported route types. View the documentation
 * {@link https://api-v3.mbta.com/docs/swagger/index.html#/Alert/ApiWeb_AlertController_index|here}.
 *
 * @param severity Comma-separated string detailing the levels of severity the fetched alerts should be.
 * @param routeType Comma-separated string detailing the types of routes to get alerts for. Defaults to All subway, bus, and ferry routes.
 * @param onlyActiveAlerts Optional flag to only fetch currently active alerts. Defaults to true.
 * @returns Something
 */
export async function getMBTAAlerts(
  severity: string,
  routeType: string = ROUTE_TYPES,
  onlyActiveAlerts: boolean = true
): Promise<AlertResponse> {
  const params = new URLSearchParams();

  params.append('filter[route_type]', routeType);
  params.append('filter[severity]', severity);
  if (onlyActiveAlerts) {
    params.append('filter[datetime', 'NOW');
  }

  const response = await fetch(`/api/alerts?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': MBTA_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const parsed = await response.json();
  return parsed;
}
