import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/providers/theme-provider';
import { useMap } from 'react-map-gl/mapbox';

interface Props {
  className: string;
}

function ThemeToggle({ className }: Props) {
  const { theme, setTheme } = useTheme();
  const {map} = useMap();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button id='theme-toggle' variant='secondary' size='icon' className={cn('rounded-xl', className)}>
          <Sun className='h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
          <Moon className='absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='rounded-xl w-56'>
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            className='rounded-lg'
            onClick={() => {
              setTheme('light');
              map?.setConfigProperty('basemap', 'lightPreset', 'day');
            }}
            defaultChecked
            checked={theme == 'light'}
          >
            Light
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem className='rounded-lg' onClick={() => {
            setTheme('dark');
            map?.setConfigProperty('basemap', 'lightPreset', 'night');
          }} checked={theme == 'dark'}>
            Dark
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            className='rounded-lg'
            onClick={() => {
              setTheme('system');
              const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              isDarkMode
                ? map?.setConfigProperty('basemap', 'lightPreset', 'night')
                : map?.setConfigProperty('basemap', 'lightPreset', 'day');
            }}
            checked={theme == 'system'}
          >
            System
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeToggle;
