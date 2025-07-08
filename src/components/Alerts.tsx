'use server';
import { getMBTAAlerts } from '@/api/alerts';
import { use, useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import {
  Badge,
  Button,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui';
import { BellRing } from 'lucide-react';

const alertsPromise = (async () => {
  const alerts = await getMBTAAlerts('5,6,7,8,9,10');
  return alerts;
})();

function Alerts() {
  const { current: map } = useMap();
  const alerts = use(alertsPromise);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (navigator.maxTouchPoints > 1) {
      setIsMobile(true);
    }
  }, []);

  return (
    <>
      {isMobile ? (
        <Drawer>
          <Tooltip>
            <TooltipTrigger asChild>
              <DrawerTrigger asChild>
                <Button variant='secondary' size='icon' className='rounded-xl'>
                  <BellRing />
                </Button>
              </DrawerTrigger>
            </TooltipTrigger>
            <TooltipContent>Alerts</TooltipContent>
          </Tooltip>
          <DrawerContent>
            <DrawerHeader>
              <DialogTitle>
                <h2 className='text-2xl'>Alerts</h2>
              </DialogTitle>
              <DrawerDescription>
                Active alerts that affect the transit network
              </DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet modal={false}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <Button variant='secondary' size='icon' className='rounded-xl'>
                  <BellRing />
                </Button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent>Alerts</TooltipContent>
          </Tooltip>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                <h2 className='text-2xl'>Alerts</h2>
              </SheetTitle>
              <SheetDescription>
                Active alerts that affect the transit network
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      )}
      {alerts.data.length > 0 ? (
        <Badge
          variant='destructive'
          className='h-5 w-5 px-1 text-xs rounded-full tabular-nums absolute bottom-6 right-9 z-2'
        >
          {alerts.data.length}
        </Badge>
      ) : null}
    </>
  );
}

export default Alerts;
