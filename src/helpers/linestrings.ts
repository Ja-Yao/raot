import type { LineStringCollection } from '@/../types';
import { featureCollection } from '@turf/helpers';
import { LngLat } from 'mapbox-gl';
import * as turf from '@turf/turf';

/**
 * Deduplicates any features in a FeatureCollection.
 *
 * @param collection - The GeoJSON FeatureCollection to deduplicate.
 * @returns The deduplicated GeoJSON FeatureCollection.
 */
export const dedupeFeatures = (collection: LineStringCollection): LineStringCollection => {
  const dedupedFeatures = featureCollection(
    collection.features.filter((feature) => {
      return (feature.properties?.id as string).includes('canonical') && feature.geometry.type === 'LineString';
    })
  ) as LineStringCollection;
  return dedupedFeatures;
};

/** Computes the center of a line string collection.
 * 
 * @param collection - The GeoJSON FeatureCollection to deduplicate.
 * @returns The center point of the feature collection, represented as a {@link LngLat}
 */
export const getCenterOfLineStringCollection = (collection: LineStringCollection): LngLat => {
  const centroid = turf.center(collection);
  return new LngLat(centroid.geometry.coordinates[0], centroid.geometry.coordinates[1]);
}