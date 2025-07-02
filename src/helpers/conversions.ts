import { toGeoJSON } from '@mapbox/polyline';
import { featureCollection, lineString } from '@turf/helpers';
import type { LineStringCollection, MBTASSEEventData, PointFeature, Shape } from 'types';


/**
 * Convert a list of Shape objects into a GeoJSON FeatureCollection.
 *
 * @param shapes - Array of Shape objects to convert.
 * @returns A GeoJSON FeatureCollection containing LineString geometries.
 */
export const shapesToFeatureCollection = (shapes: Shape[]): LineStringCollection => {
    // Decode the polylines and create a turf feature collection
    const decoded = shapes.map((shape) => {
      const geojson = toGeoJSON(shape.attributes.polyline);
      return {
        ...geojson,
        properties: { id: shape.id, links: shape.links, mbtaType: shape.type },
      };
    });
  
    const collection = featureCollection(
      decoded.map((feature) => {
        return lineString(feature.coordinates, { ...feature.properties });
      })
    );
  
    return collection;
  };

  /**
   * Convert an MBTA streaming event to a GeoJSON point
   * @param data Data from the MBTA SSE event
   * @returns A {@link PointFeature} 
   */
  export const streamingEventToPoint = (data: MBTASSEEventData): PointFeature => {
    const coordinates = [data.attributes.longitude, data.attributes.latitude] as [number, number];
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coordinates,
      },
      id: data.id,
      properties: {
        bearing: data.attributes.bearing,
        currentStatus: data.attributes.current_status,
        label: data.attributes.label,
        route: data.relationships.route.data.id,
        speed: data.attributes.speed,
      },
    };
  };