import { featureCollection } from '@turf/helpers';
import type { LineStringCollection } from 'types';

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
