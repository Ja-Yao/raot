import type { FeatureCollection, Feature, GeoJsonProperties, LineString, Point, Position } from 'geojson';

export type LineStringCollection = FeatureCollection<LineString, GeoJsonProperties>;
export type LineStringFeature = Feature<LineString, GeoJsonProperties>;
export type PointCollection = FeatureCollection<Point, GeoJsonProperties>;
export type PointFeature = Feature<Point, GeoJsonProperties>;

export type Theme = "dark" | "light" | "system"

export interface ShapesProps {
  pageOffset?: number;
  pageSize?: number;
  sort?: 'polyline' | '-polyline';
  fields?: string;
  filter?: string;
  key: string;
}

export type Shape = {
  attributes: {
    polyline: string;
  };
  id: string;
  links: {
    self: string;
  };
  type: string;
};

export type RoutesSortOptions =
  | 'color'
  | '-color'
  | 'description'
  | '-description'
  | 'direction_destinations'
  | '-direction_destinations'
  | 'direction_names'
  | '-direction_names'
  | 'fare_class'
  | '-fare_class'
  | 'long_name'
  | '-long_name'
  | 'short_name'
  | '-short_name'
  | 'sort_order'
  | '-sort_order'
  | 'text_color'
  | '-text_color'
  | 'type'
  | '-type';

export interface RoutesProps {
  pageOffset?: number;
  pageLimit?: number;
  sort?: RoutesSortOptions;
  fields?: string;
  include?: string;
  filterStops?: string;
  filterTypes?: string;
  filterDirections?: number;
  filterDate?: string;
  filterIds?: string;
  key: string;
}

export type Route = {
  attributes: {
    color: string;
    description: string;
    direction_destinations: string[];
    direction_names: string[];
    fare_class: string;
    long_name: string;
    short_name: string;
    sort_order: number;
    text_color: string;
    type: number;
  };
  id: string;
  links: {
    self: string;
  };
  relationships: {
    agency: {
      data: {
        id: string;
        type: string;
      };
    };
    line: {
      data: {
        id: string;
        type: string;
      };
    };
    route_patterns: {
      data: [
        {
          id: string;
          type: string;
        },
        {
          id: string;
          type: string;
        },
        {
          id: string;
          type: string;
        },
        {
          id: string;
          type: string;
        },
      ];
    };
  };
  type: string;
};

export type RoutePattern = {
  attributes: {
    canonical: boolean;
    direction_id: number;
    name: string;
    sort_order: number;
    time_desc: any;
    typicality: number;
  };
  id: string;
  links: {
    self: string;
  };
  relationships: {
    representative_trip: {
      data: {
        id: string;
        type: string;
      };
    };
    route: {
      data: {
        id: string;
        type: string;
      };
    };
  };
  type: string;
};

export type Trip = {
  attributes: {
    bikes_allowed: number;
    block_id: string;
    direction_id: number;
    headsign: string;
    name: string;
    revenue: string;
    wheelchair_accessible: number;
  };
  id: string;
  links: {
    self: string;
  };
  relationships: {
    route: {
      data: {
        id: string;
        type: string;
      };
    };
    route_pattern: {
      data: {
        id: string;
        type: string;
      };
    };
    service: {
      data: {
        id: string;
        type: string;
      };
    };
    shape: {
      data: {
        id: string;
        type: string;
      };
    };
  };
  type: string;
};

export type RoutesResponse = { data: Route[]; included: Array<RoutePattern | Trip | Shape> };

export type RoutePatternsSortOptions =
  | 'cannonical'
  | '-cannonical'
  | 'direction'
  | '-direction'
  | 'name'
  | '-name'
  | 'sort_order'
  | '-sort_order'
  | 'time_desc'
  | '-time_desc'
  | 'typicality'
  | '-typicality';

export interface RoutePatternsProps {
  pageOffset?: number;
  pageLimit?: number;
  sort?: RoutePatternsSortOptions;
  fields?: string;
  include?: string;
  filterId?: string;
  filterRoute?: string;
  filterDirection?: string;
  filterStop?: string;
  filterCanonical?: boolean;
  filterDate?: string;
  key: string;
}

export type RoutePatternResponse = RoutePattern[];

export interface MBTAData {
  id: string;
  type: string;
  attributes: {
    [key: string]: any;
  };
  relationships?: {
    [key: string]: {
      data: {
        id: string;
        type: string;
      };
    };
  };
}

export interface MBTASSEEventPayload {
  // This is what the worker will send
  eventType: 'reset' | 'add' | 'update' | 'remove';
  data: MBTAData | MBTAData[] | { id: string; type: string };
}

export interface WorkerMessageFromWorker {
  type: 'status' | 'data' | 'error';
  payload: string | MBTASSEEventPayload | any; // Payload can vary based on type
}

export type MBTASSEEventData = {
  attributes: {
    bearing: number;
    current_status: string;
    current_stop_sequence: number;
    direction_id: number;
    label: string;
    latitude: number;
    longitude: number;
    speed: number;
    updated_at: string;
  };
  id: string;
  links: { self: string };
  relationships: {
    route: { data: { id: string; type: 'route' } };
    stop: { data: { id: string; type: 'stop' } };
    trip: { data: { id: string; type: 'trip' } };
  };
  type: string;
};

export interface MBTASSEResetEvent {
  event: 'reset';
  data: MBTASSEEventData[];
}

export interface MBTASSEAddEvent {
  event: 'add';
  data: MBTASSEEventData
}

export interface MBTASSEUpdateEvent {
  event: 'update';
  data: MBTASSEEventData
}

export interface MBTASSERemoveEvent {
  event: 'remove';
  data: {
    id: string;
    type: string;
  }
}

export type MBTASSEEvent = MBTASSEResetEvent | MBTASSEAddEvent | MBTASSEUpdateEvent | MBTASSERemoveEvent;

export interface MBTAWorkerAPI {
  startStreaming: (
    options: { apiKey: string; endpoint: string; filterParams: string },
    onMessageCallback: (message: WorkerMessageFromWorker) => void // Callback for messages
  ) => void;
  stopStreaming: () => void;
}

/**
 * Defines additional properties for animated vehicle GeoJSON features.
 * These are used to manage the smooth transition of vehicle positions.
 */
export interface AnimatedVehicleProperties {
  color: string; // The color of the vehicle's route
  id: string; // The ID of the MBTA route (e.g., 'Red', 'Orange')
  direction_id?: number; // Direction of travel for the vehicle (0 or 1)
  label?: string; // Optional label for the vehicle

  // Animation related properties:
  currentCoordinates?: Position; // The currently displayed interpolated coordinates during animation
  previousCoordinates?: Position; // The coordinates from where the current animation started
  targetCoordinates: Position; // The destination coordinates for the current animation
  animationStartTime?: number; // Timestamp (from performance.now()) when the animation for this point started
  animationDuration: number; // The total duration of the animation in milliseconds
}

/**
 * Represents an individual GeoJSON Point feature with extended properties
 * specifically for animating MBTA vehicle positions.
 * It ensures the feature itself has an `id` property, which is crucial for
 * Mapbox GL JS to identify and update individual features efficiently.
 */
export interface AnimatedVehicleFeature extends Feature<Point, AnimatedVehicleProperties> {
  id: string; // Mandatory: Ensure the feature has a string ID for efficient updates
  route?: string;
}

/**
 * Represents a GeoJSON FeatureCollection specifically designed to hold
 * `AnimatedVehicleFeature` objects. This is the type used for the `vehicleData`
 * state in your `MBTAMap` component.
 */
export interface AnimatedPointCollection extends FeatureCollection<Point, AnimatedVehicleProperties> {
  features: AnimatedVehicleFeature[]; // Ensures the features array contains AnimatedVehicleFeature
}