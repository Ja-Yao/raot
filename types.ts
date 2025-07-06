import type { FeatureCollection, Feature, GeoJsonProperties, LineString, Point } from 'geojson';

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

export type Stop = {
  address: string | null;
  at_street: string;
  description: string | null;
  latitude: number;
  location_type: number;
  longitude: number;
  municipality: string;
  name: string;
  on_street: string;
  platform_code: string | number;
  platform_name: string;
  vehicle_type: number;
  wheelchair_boarding: number;
};

// ----------------------------------SSE Type Definitions----------------------------------

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

const StreamStatuses = {
  idle: 'idle',
  connecting: 'connecting',
  open: 'open',
  closed: 'closed',
  error: 'error',
} as const;

export type StreamStatus = (typeof StreamStatuses)[keyof typeof StreamStatuses];