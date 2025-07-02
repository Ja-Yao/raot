import 'mapbox-gl/dist/mapbox-gl.css';
import { Suspense, useState } from 'react';
import type { Route } from 'types';
import './App.css';
import MBTAMap from './components/MBTAMap';
import { Skeleton, Toaster } from './components/ui';

function App() {
  const [selectedLine, setSelectedLine] = useState<string>('Select a line...');
  const [isLineSelectOpen, setIsLineSelectOpen] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([])

  return (
    <div id='main-container' className='h-full w-full overflow-clip'>
      <Toaster closeButton richColors position='top-right'/>
      {/* <Popover open={isLineSelectOpen} onOpenChange={() => setIsLineSelectOpen(!isLineSelectOpen)}>
        <PopoverTrigger asChild>
          <Button
            id='line-selector'
            size='lg'
            variant='secondary'
            role='combobox'
            className={`
              bg-primary-foreground 
              hover:bg-primary-foreground 
              md:w-[376px] shadow-lg 
              justify-between 
              absolute
              z-2
              top-4
              left-4
              text-md
              transition duration-100 ease-in-out
              ${isLineSelectOpen ? 'rounded-t-2xl rounded-b-none border-b border-b-border' : 'rounded-full'}
            `}
          >
            {selectedLine} <ChevronsUpDown />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          sideOffset={0}
          className='w-[var(--radix-popover-trigger-width)] md:max-h-144 rounded-t-none rounded-b-2xl border-none pl-2 pr-0.5'
        >
          <RouteList routes={routes} selectedLine={selectedLine} setSelectedLine={(line) => setSelectedLine(line)} />
        </PopoverContent>
      </Popover> */}
      <Suspense fallback={<Skeleton />}>
        <MBTAMap setRoutes={setRoutes} />
      </Suspense>
    </div>
  );
}

export default App;
