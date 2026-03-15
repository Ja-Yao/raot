'use server';
import { getMBTAAlerts } from '@/api/mbta/alerts';
import { IconBellAlarm } from '@intentui/icons';
import { use, useEffect, useRef, useState } from 'react';

import { twJoin } from 'tailwind-merge';
import { Button } from './ui/buttons/button';
import { ScrollArea } from './ui/controls/scroll-area';
import { Container } from './ui/layouts/container';
import {
  DisclosureGroup as Accordion,
  DisclosurePanel as AccordionContent,
  Disclosure as AccordionItem,
  DisclosureTrigger as AccordionTrigger
} from './ui/navigation/disclosure';
import { DialogTitle } from './ui/overlays/dialog';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTrigger
} from './ui/overlays/drawer';
import { PopoverBody, PopoverContent, PopoverDescription, PopoverFooter, PopoverHeader, PopoverTitle } from './ui/overlays/popover';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/overlays/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/overlays/tooltip';
import { Badge } from './ui/statuses/badge';
import { Note } from './ui/statuses/note';
import { Text } from './ui/surfaces/text';

const alertsPromise = (async () => {
  const alerts = await getMBTAAlerts('5,6,7,8,9,10');
  return alerts;
})();

function Alerts() {
  const alerts = use(alertsPromise).data.sort((a, b) => b.attributes.severity - a.attributes.severity);
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  const popoverTriggerRef = useRef(null);

  useEffect(() => {
    if (navigator.maxTouchPoints > 1 || window.innerWidth <= 640) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }, []);

  useEffect(() => {
    setAlertCount(alerts.length);
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
          <DrawerContent className='h-160'>
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
                      {alerts.map((alert, index) => (
                        <Note
                          key={index}
                          intent={`${alert.attributes.severity <= 7 ? 'warning' : 'danger'}`}
                          className='mb-2'
                        >
                          {alert.attributes.header}
                        </Note>
                      ))}
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      ) : (
        <>
          <Container className='relative inline-block p-0'>
            <Button
              ref={popoverTriggerRef}
              intent='secondary'
              size='sq-md'
              className='rounded-xl'
              onClick={() => setIsPopoverOpen(true)}
            >
              <IconBellAlarm className='h-[1.2rem] w-[1.2rem] scale-100' />
            </Button>
            {alerts.length > 0 ? (
              <Badge
                isCircle
                intent='danger'
                className={twJoin(
                  'absolute bottom-6 left-6 z-2 inline-flex',
                  'h-4 text-xs rounded-full tabular-nums',
                  'bg-red-700 text-white'
                )}
              />
            ) : null}
          </Container>
          <PopoverContent
            triggerRef={popoverTriggerRef}
            isOpen={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
            arrow
            className='width-full lg:min-w-lg md:min-w-sm'
          >
            <PopoverHeader>
              <div className='flex justify-between'>
                <PopoverTitle>Alerts</PopoverTitle>
              </div>
              <PopoverDescription>Warnings and information about the network</PopoverDescription>
            </PopoverHeader>
            <PopoverBody className='md:max-h-128 lg:max-h-196'>
              {!alerts.length ? (
                <Text>No alerts</Text>
              ) : (
                <ScrollArea orientation='vertical'>
                  {alerts.slice(0, 5).map((alert) => (
                    <Note
                      key={crypto.randomUUID()}
                      intent={
                        alert.attributes.severity < 7 ? 'info' : alert.attributes.severity < 9 ? 'warning' : 'danger'
                      }
                      className='mb-2'
                    >
                      {alert.attributes.header}
                    </Note>
                  ))}
                </ScrollArea>
              )}
            </PopoverBody>
            <PopoverFooter>
              <Button
                onClick={() => {
                  setIsPopoverOpen(false);
                  setOpen(true);
                }}
              >
                View all ({alerts.length})
              </Button>
            </PopoverFooter>
          </PopoverContent>
          <Sheet isOpen={open} onOpenChange={setOpen}>
            <SheetContent className='lg:max-w-lg'>
              <SheetHeader>
                <SheetTitle className='text-2xl'>Alerts</SheetTitle>
                <SheetDescription>Active alerts that affect the transit network</SheetDescription>
              </SheetHeader>
              <Container className='w-full h-auto px-8'>
                <AccordionItem>
                  <AccordionTrigger className='font-semibold hover:cursor-pointer'>
                    <div className='flex flex-row gap-2'>
                      <Text id='accordion-heading-boston'>Boston ({alertCount})</Text>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea orientation='vertical' className='*:max-h-196'>
                      {alerts.map((alert) => (
                        <Note
                          key={crypto.randomUUID()}
                          intent={
                            alert.attributes.severity < 7
                              ? 'info'
                              : alert.attributes.severity < 9
                                ? 'warning'
                                : 'danger'
                          }
                          className='mb-2'
                        >
                          {alert.attributes.header}
                        </Note>
                      ))}
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Container>
            </SheetContent>
          </Sheet>
        </>
      )}
    </>
  );
}

export default Alerts;
