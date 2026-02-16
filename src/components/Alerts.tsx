'use server';
import { getMBTAAlerts } from '@/api/mbta/alerts';
import { IconBellAlarm, IconCircleExclamation, IconCircleInfo, IconTriangleExclamation } from '@intentui/icons';
import { use, useEffect, useState } from 'react';
import { ListBox, ListBoxItem, TooltipTrigger } from 'react-aria-components';
import {
  DisclosureGroup as Accordion,
  DisclosurePanel as AccordionContent,
  Disclosure as AccordionItem,
  DisclosureTrigger as AccordionTrigger,
  Alert,
  AlertDescription,
  Badge,
  Button,
  DialogTitle,
  Drawer,
  DrawerBody,
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
  TooltipContent
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
        <Drawer isOpen={open} onOpenChange={setOpen}>
          <Tooltip>
            <TooltipTrigger>
              <DrawerTrigger>
                <Button intent='secondary' size='sq-md' className='rounded-xl'>
                  <IconBellAlarm className='h-[1.2rem] w-[1.2rem] scale-100' />
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
            <DrawerBody>
              <Accordion className='w-full'>
                <AccordionItem>
                  <AccordionTrigger className='font-semibold hover:cursor-pointer'>
                    <div className='flex flex-row gap-2'>
                      <p id='accordion-heading-boston'>Boston ({alertCount})</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea orientation='vertical' className='w-full h-72 pr-3'>
                      {alerts.data.map((alert, index) => (
                        <Alert
                          key={index}
                          variant={`${alert.attributes.severity <= 7 ? 'warning' : 'critical'}`}
                          className='mb-2'
                        >
                          {alert.attributes.severity < 7 ? (
                            <IconCircleInfo />
                          ) : alert.attributes.severity < 9 ? (
                            <IconTriangleExclamation />
                          ) : (
                            <IconCircleExclamation />
                          )}
                          <AlertDescription>{alert.attributes.header}</AlertDescription>
                        </Alert>
                      ))}
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet isOpen={open} onOpenChange={setOpen}>
          <Tooltip>
            <TooltipTrigger>
              <SheetTrigger>
                <Button intent='secondary' size='sq-md' className='rounded-xl'>
                  <IconBellAlarm className='h-[1.2rem] w-[1.2rem] scale-100' />
                </Button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent>Alerts</TooltipContent>
          </Tooltip>
          <SheetContent className='lg:max-w-[512px]'>
            <SheetHeader>
              <SheetTitle className='text-2xl'>Alerts</SheetTitle>
              <SheetDescription>Active alerts that affect the transit network</SheetDescription>
            </SheetHeader>
            <div className='w-full h-auto px-8'>
              <AccordionItem>
                <AccordionTrigger className='font-semibold hover:cursor-pointer'>
                  <div className='flex flex-row gap-2'>
                    <p id='accordion-heading-boston'>Boston ({alertCount})</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea orientation='vertical' className='w-full h-[640px] lg:max-h-[896px] '>
                    <ListBox
                      aria-label='Transit alerts'
                      items={alerts.data.sort((a, b) => b.attributes.severity - a.attributes.severity)}
                      selectionMode='none'
                    >
                      {(item) => (
                        <ListBoxItem>
                          <Alert
                            variant={
                              item.attributes.severity < 7
                                ? 'info'
                                : item.attributes.severity < 9
                                  ? 'warning'
                                  : 'critical'
                            }
                            className='mb-2'
                          >
                            {item.attributes.severity < 7 ? (
                              <IconCircleInfo />
                            ) : item.attributes.severity < 9 ? (
                              <IconTriangleExclamation />
                            ) : (
                              <IconCircleExclamation />
                            )}
                            <AlertDescription>{item.attributes.header}</AlertDescription>
                          </Alert>
                        </ListBoxItem>
                      )}
                    </ListBox>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </div>
          </SheetContent>
        </Sheet>
      )}
      {alerts.data.length > 0 ? (
        <Badge
          isCircle
          intent='danger'
          className='h-6 w-6 justify-center text-xs rounded-full tabular-nums absolute bottom-6 right-9 z-2 bg-red-700 text-white'
        >
          {alerts.data.length > 99 ? '99+' : alerts.data.length}
        </Badge>
      ) : null}
    </>
  );
}

export default Alerts;
