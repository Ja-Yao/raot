import { LoaderCircle } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Suspense } from 'react';
import './App.css';
import Map from './components/Map';
import { Toaster } from './components/ui';

const Fallback = () => {
  return (
    <div className='w-full h-full flex'>
      <div className='grow'>
        <LoaderCircle className='animate-spin h-12 w-12' />
      </div>
    </div>
  );
}

function App() {
  return (
    <div id='main-container' className='h-full w-full overflow-clip'>
      <Toaster closeButton richColors position='bottom-center' />
      <Suspense fallback={<Fallback />}>
        <Map />
      </Suspense>
    </div>
  );
}

export default App;
