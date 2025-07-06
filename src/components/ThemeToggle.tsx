import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/providers/theme-provider';
import { useMap } from 'react-map-gl/mapbox';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui';
import type { Theme } from 'types';

interface Props {
  className: string;
}

function ThemeToggle({ className }: Props) {
  const { theme, setTheme } = useTheme();
  const { current: map } = useMap();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button id='theme-toggle' variant='secondary' size='icon' className={cn('rounded-xl', className)}>
              <Sun className='h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
              <Moon className='absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
              <span className='sr-only'>Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side='right'>Change Appearance</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align='end' className='rounded-xl w-56'>
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          <DropdownMenuRadioItem
            className='rounded-lg'
            onClick={() => {
              setTheme('light');
              map!.setConfigProperty('basemap', 'lightPreset', 'day');
            }}
            value='light'
          >
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className='rounded-lg'
            onClick={() => {
              setTheme('dark');
              map!.setConfigProperty('basemap', 'lightPreset', 'night');
            }}
            value='dark'
          >
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className='rounded-lg'
            onClick={() => {
              setTheme('system');
              const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              isDarkMode
                ? map!.setConfigProperty('basemap', 'lightPreset', 'night')
                : map!.setConfigProperty('basemap', 'lightPreset', 'day');
            }}
            value='system'
          >
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeToggle;
