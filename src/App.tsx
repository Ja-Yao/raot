import 'mapbox-gl/dist/mapbox-gl.css';
import { Suspense, useState } from 'react';
import type { Route } from 'types';
import './App.css';
import Map from './components/Map';
import { Skeleton, Toaster } from './components/ui';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [selectedLine, setSelectedLine] = useState<string>('Select a line...');
  const [isLineSelectOpen, setIsLineSelectOpen] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([])

  return (
    <div id='main-container' className='h-full w-full overflow-clip'>
      <Toaster closeButton richColors position='bottom-left' />
      <ThemeToggle className='absolute top-2 right-2 z-1' />
      <Suspense fallback={<Skeleton />}>
        <Map setRoutes={setRoutes} />
      </Suspense>
    </div>
  );
}

export default App;
