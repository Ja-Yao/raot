import { dedupeFeatures } from '@/helpers/dedupe-linestrings';
import * as polyline from '@mapbox/polyline';
import { featureCollection, lineString } from '@turf/helpers';
import { type ShapesProps } from '../../types';
import { MBTA_KEY } from './common';

const ALL_ROUTES = 'Red,Orange,Green-B,Green-C,Green-D,Green-E,Blue'

/**
 * Get the shapes for all lines on the MBTA
 */
export async function getShapes(props: ShapesProps): Promise<GeoJSON.FeatureCollection<GeoJSON.LineString, GeoJSON.GeoJsonProperties>> {
    const params = new URLSearchParams()
    params.append('filter[route]', !props.filter ? ALL_ROUTES : props.filter );

    if (props.pageOffset) {
        params.append('page[offset]', props.pageOffset.toString());
    }
    if (props.pageSize) {
        params.append('page[size]', props.pageSize.toString());
    }
    if (props.sort) {
        params.append('sort', props.sort);
    }
    if (props.fields) {
        params.append('fields[shape]', props.fields);
    }

    const response = await fetch(`/api/shapes?${params}`, 
        { headers: { 
            'Content-Type': 'application/json', 
            'X-API-Key': MBTA_KEY
            }
        });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const parsed = response.json().then(json => {
        const polylines: { polyline: string, id: string, links: string; }[] = json.data.map(
            (shape: { attributes: { polyline: string; }; id: string, links: { self: string; } }) => (
                { polyline: shape.attributes.polyline, id: shape.id, links: shape.links }
            )
        );

        // Decode the polylines and create a turf feature collection
        const decoded = polylines.map(shape => {
            const geojson = polyline.toGeoJSON(shape.polyline);
            return {
                ...geojson,
                properties: { id: shape.id, links: shape.links }
            };
        });

        const collection = featureCollection(decoded.map(feature => {
            return lineString(feature.coordinates, { ...feature.properties });
        }));

        return dedupeFeatures(collection);
    }).catch((error) => {
        console.error('Error fetching shapes', error);
        throw error;
    });
    return parsed;
}