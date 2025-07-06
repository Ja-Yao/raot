import type { RoutePattern, RoutePatternResponse, RoutePatternsProps, RoutesProps, RoutesResponse } from 'types';
import { MBTA_KEY } from './common';

/**
 * Get all the routes from the MBTA API.
 */
export async function getRoutes(props: RoutesProps): Promise<RoutesResponse> {
    const params = new URLSearchParams();
    params.append('api_key', props.key);
    if (props.pageOffset) {
        params.append('page[offset]', props.pageOffset.toString());
    }
    if (props.pageLimit) {
        params.append('page[limit]', props.pageLimit.toString());
    }
    if (props.sort) {
        params.append('sort', props.sort);
    }
    if (props.fields) {
        params.append('fields[route]', props.fields);
    }
    if (props.include) {
        params.append('include', props.include);
    }
    if (props.filterStops) {
        params.append('filter[stop]', props.filterStops);
    }
    if (props.filterTypes) {
        params.append('filter[type]', props.filterTypes);
    }
    if (props.filterDirections) {
        params.append('filter[direction_id]', props.filterDirections.toString());
    }
    if (props.filterDate) {
        params.append('filter[date]', props.filterDate);
    }
    if (props.filterIds) {
        params.append('filter[id]', props.filterIds);
    }

    const response = await fetch(`/api/routes?${params}`, {
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': MBTA_KEY
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

export async function getRoutePatterns(props: RoutePatternsProps): Promise<RoutePatternResponse> {
    const params = new URLSearchParams();
    params.append('api_key', props.key);
    if (props.pageOffset) {
        params.append('page[offset]', props.pageOffset.toString());
    }
    if (props.pageLimit) {
        params.append('page[limit]', props.pageLimit.toString());
    }
    if (props.sort) {
        params.append('sort', props.sort);
    }
    if (props.fields) {
        params.append('fields[route_pattern]', props.fields);
    }
    if (props.include) {
        params.append('include', props.include);
    }
    if (props.filterId) {
        params.append('filter[id]', props.filterId);
    }
    if (props.filterRoute) {
        params.append('filter[route]', props.filterRoute);
    }
    if (props.filterDirection) {
        params.append('filter[direction_id]', props.filterDirection.toString());
    }
    if (props.filterDate) {
        params.append('filter[date]', props.filterDate);
    }
    if (props.filterStop) {
        params.append('filter[stop]', props.filterStop);
    }
    if (props.filterCanonical) {
        params.append('filter[canonical]', props.filterCanonical.toString());
    }

    const response = await fetch(`/api/route_patterns?${params}`, {
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': MBTA_KEY
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const parsed = response.json().then(json => {
        const data = json.data;
        const uniqueIds = new Set();
        const deduped = data.filter((item: RoutePattern) => {
            const itemId = (item.id as string).slice(0, -2);
            if (uniqueIds.has(itemId)) {
                return false;
            }
            uniqueIds.add(itemId);
            return true;
        });
        return deduped;
    });
    return parsed;
}