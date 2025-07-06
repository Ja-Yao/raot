import 'mapbox-gl/dist/mapbox-gl.css';
import { Suspense } from 'react';
import './App.css';
import Map from './components/Map';
import ThemeToggle from './components/ThemeToggle';
import { Skeleton, Toaster } from './components/ui';

function App() {
  return (
    <div id='main-container' className='h-full w-full overflow-clip'>
      <Toaster closeButton richColors position='bottom-center' />
      <ThemeToggle className='absolute top-2 right-2 z-1' />
      <Suspense fallback={<Skeleton />}>
        <Map />
      </Suspense>
    </div>
  );
}

export default App;
