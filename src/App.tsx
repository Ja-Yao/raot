import { LoaderCircle } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Suspense, useEffect, useState } from 'react';
import type { LineStringCollection, Trip, Shape } from 'types';
import { getRoutes } from './api/all-routes';
import './App.css';
import Map from './components/Map';
import { Toaster } from './components/ui';
import { shapesToFeatureCollection } from './helpers/conversions';
import { MBTA_KEY, ROUTE_TYPES } from './api/common';

const Fallback = () => {
  return (
    <div className='w-full h-full flex'>
      <div className='grow'>
        <LoaderCircle className='animate-spin h-12 w-12' />
      </div>
    </div>
  );
};

function App() {
  const [MBTAShapes, setMBTAShapes] = useState<LineStringCollection>({
    type: 'FeatureCollection',
    features: [],
  });
  // Fetch routes and shapes when the component mounts
  useEffect(() => {
    const fetchRoutes = async () => {
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
          if (!feature.properties) throw new Error('Feature properties are undefined');

          const properties = feature.properties;
          const shapeId = properties?.id as string;
          const relatedTrip = parsedTrips.find((trip) => trip.relationships.shape.data.id === shapeId);
          if (relatedTrip) {
            const relatedRoute = parsedRoutes.find((route) => route.id === relatedTrip.relationships.route.data.id);
            if (relatedRoute) {
              feature.properties['color'] = relatedRoute.attributes.color;
            }
          } else {
            throw new Error(`No trip found for shape ID ${shapeId}}`);
          }
        });

        setMBTAShapes(shapesCollection);
      }
    };
    fetchRoutes();
  }, []);

  return (
    <div id='main-container' className='h-full w-full overflow-clip'>
      <Toaster closeButton richColors position='bottom-center' />
      <Suspense fallback={<Fallback />}>
        <Map shapes={MBTAShapes} />
      </Suspense>
    </div>
  );
}

export default App;
