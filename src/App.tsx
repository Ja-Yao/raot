import { LoaderCircle } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Suspense, use } from 'react';
import type { LineStringCollection, Shape, Trip } from 'types';
import { getRoutes } from './api/all-routes';
import { MBTA_KEY, ROUTE_TYPES } from './api/common';
import './App.css';
import Map from './components/Map';
import { Toaster } from './components/ui';
import { shapesToFeatureCollection } from './helpers/conversions';
import { useTheme } from './providers/theme-provider';


// Define a helper function to create an empty LineStringCollection
const createEmptyLineStringCollection = (): LineStringCollection => ({
  type: 'FeatureCollection',
  features: [],
});

// Fetch data once outside the component to avoid re-fetching on every render
const routesPromise = (async (): Promise<LineStringCollection> => { // Explicitly define return type
  try {
    const chainedRoutes = await getRoutes({
      key: MBTA_KEY,
      filterTypes: ROUTE_TYPES,
      include: 'route_patterns.representative_trip.shape',
    });
    const parsedRoutes = chainedRoutes.data;

    parsedRoutes.forEach((route) => {
      route.attributes.color = '#' + route.attributes.color;
    });

    if (chainedRoutes?.included) {
      const parsedTrips = chainedRoutes.included.filter((item) => item.type === 'trip') as Trip[];

      const parsedShapes = chainedRoutes.included.filter((item) => item.type === 'shape') as Shape[];
      const shapesCollection = shapesToFeatureCollection(parsedShapes);

      shapesCollection.features.forEach((feature) => {
        if (!feature.properties) {
          // If properties are undefined, skip or assign default
          console.warn('Feature properties are undefined for a shape. Skipping color assignment.');
          feature.properties = { color: '#808080' }; // Assign default properties to avoid error
          return; // Skip to next feature
        }

        const properties = feature.properties;
        const shapeId = properties?.id as string;
        const relatedTrip = parsedTrips.find((trip) => trip.relationships.shape.data.id === shapeId);
        if (relatedTrip) {
          const relatedRoute = parsedRoutes.find((route) => route.id === relatedTrip.relationships.route.data.id);
          if (relatedRoute) {
            feature.properties['color'] = relatedRoute.attributes.color;
          }
        } else {
          console.warn(`No trip found for shape ID ${shapeId}. This shape will not have a route color.`);
          feature.properties['color'] = '#808080'; // Grey default color
        }
      });

      return shapesCollection;
    } else {
      // If chainedRoutes.included is falsy, return an empty collection
      console.warn("No 'included' data found in chainedRoutes. Returning empty LineStringCollection.");
      return createEmptyLineStringCollection();
    }
  } catch (error) {
    console.error("Failed to fetch routes:", error);
    // Always return a LineStringCollection in case of error
    return createEmptyLineStringCollection();
  }
})();

const Fallback = () => {
  return (
    <div className='w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900'>
      <div className='grow flex flex-col items-center'>
        <LoaderCircle className='animate-spin h-12 w-12 text-blue-500' />
        <p className='mt-4 text-gray-700 dark:text-gray-300'>Loading...</p>
      </div>
    </div>
  );
};

function App() {
  const { theme } = useTheme();
  const mbtaShapes: LineStringCollection = use(routesPromise);

  return (
    <div id='main-container' className='h-full w-full overflow-clip'>
      <Toaster closeButton richColors theme={theme} position='top-center' duration={2500} />
      <Suspense fallback={<Fallback />}>
        <Map shapes={mbtaShapes} />
      </Suspense>
    </div>
  );
}

export default App;
