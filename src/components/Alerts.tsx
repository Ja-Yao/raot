'use server';
import { getMBTAAlerts } from '@/api/alerts';
import { AlertCircleIcon, BellRing, TriangleAlertIcon } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  Badge,
  Button,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTrigger,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from './ui';

const alertsPromise = (async () => {
  const alerts = await getMBTAAlerts('5,6,7,8,9,10');
  return alerts;
})();

//FIXME: fix scrolling on accordions; scrolls full dialog content and not accordion content
function Alerts() {
  const alerts = use(alertsPromise);
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (navigator.maxTouchPoints > 1 || window.innerWidth <= 640) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  });

  useEffect(() => {
    setAlertCount(alerts.data.length);
  }, [alerts]);

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
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
          <DrawerContent className='h-[640px]'>
            <DrawerHeader>
              <DialogTitle className='text-2xl'>Alerts</DialogTitle>
              <DrawerDescription>Active alerts that affect the transit network</DrawerDescription>
            </DrawerHeader>
            <div className='w-full h-auto px-4'>
              <Accordion type='single' collapsible className='w-full'>
                <AccordionItem value='boston'>
                  <AccordionTrigger className='font-semibold hover:cursor-pointer'>
                    <div className='flex flex-row gap-2'>
                      <p id='accordion-heading-boston'>Boston ({alertCount})</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className='w-full h-72 pr-3'>
                      {alerts.data.map((alert, index) => (
                        <Alert
                          key={index}
                          variant={`${alert.attributes.severity <= 7 ? 'warning' : 'critical'}`}
                          className='mb-2'
                        >
                          {alert.attributes.severity > 4 && alert.attributes.severity <= 7 ? (
                            <TriangleAlertIcon />
                          ) : (
                            <AlertCircleIcon />
                          )}
                          <AlertDescription>{alert.attributes.header}</AlertDescription>
                        </Alert>
                      ))}
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={open} onOpenChange={setOpen} modal={false}>
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
              <SheetTitle className='text-2xl'>Alerts</SheetTitle>
              <SheetDescription>Active alerts that affect the transit network</SheetDescription>
            </SheetHeader>
            <div className='w-full h-auto px-4'>
              <Accordion type='single' collapsible className='w-full'>
                <AccordionItem value='boston'>
                  <AccordionTrigger className='font-semibold hover:cursor-pointer'>
                    <div className='flex flex-row gap-2'>
                      <p id='accordion-heading-boston'>Boston ({alertCount})</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className='w-full h-[640px] lg:h-[896px] pr-3'>
                      {alerts.data.map((alert, index) => (
                        <Alert
                          key={index}
                          variant={`${alert.attributes.severity <= 7 ? 'warning' : 'critical'}`}
                          className='mb-2'
                        >
                          {alert.attributes.severity > 4 && alert.attributes.severity <= 7 ? (
                            <TriangleAlertIcon />
                          ) : (
                            <AlertCircleIcon />
                          )}
                          <AlertDescription>{alert.attributes.header}</AlertDescription>
                        </Alert>
                      ))}
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </SheetContent>
        </Sheet>
      )}
      {alerts.data.length > 0 ? (
        <Badge
          variant='destructive'
          className='h-6 w-6 px-1 text-xs rounded-full tabular-nums absolute bottom-6 right-9 z-2'
        >
          {alerts.data.length > 99 ? '99+' : alerts.data.length}
        </Badge>
      ) : null}
    </>
  );
}

export default Alerts;
