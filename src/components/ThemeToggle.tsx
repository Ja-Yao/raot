import { IconMoon as Moon, IconSun as Sun } from '@intentui/icons';

import { Button } from '@/components/ui/buttons/button';
import { useTheme } from '@/providers/theme-provider';
import { useMap } from 'react-map-gl/mapbox';
import { Tooltip, TooltipContent } from './ui/overlays/tooltip';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { current: map } = useMap();

  const determineTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      map!.setConfigProperty('basemap', 'lightPreset', 'night');
    } else {
      setTheme('light');
      map!.setConfigProperty('basemap', 'lightPreset', 'day');
    }
  };

  return (
    <Tooltip>
      <Button
        id='theme-toggle'
        intent='secondary'
        size='sq-md'
        className='rounded-xl'
        onClick={determineTheme}
      >
        <Sun className='h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
        <Moon className='absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
      </Button>
      <TooltipContent>{theme === 'light' ? 'Turn off the lights' : 'Turn on the lights'}</TooltipContent>
    </Tooltip>
  );
}

export default ThemeToggle;
