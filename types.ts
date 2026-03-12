import type { Feature, FeatureCollection, GeoJsonProperties, LineString, Point } from 'geojson';

export type LineStringCollection = FeatureCollection<LineString, GeoJsonProperties>;
export type LineStringFeature = Feature<LineString, GeoJsonProperties>;
export type PointCollection = FeatureCollection<Point, GeoJsonProperties>;
export type PointFeature = Feature<Point, GeoJsonProperties>;

export type Theme = 'dark' | 'light' | 'system';

export const supportedSystems = {
  mbta: 'MBTA'
} as const;

export type SupportedSystems = (typeof supportedSystems)[keyof typeof supportedSystems];
