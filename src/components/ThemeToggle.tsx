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

interface Props {
  className: string;
}

function ThemeToggle({ className }: Props) {
  const { theme, setTheme } = useTheme();

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
            onClick={() => setTheme('light')}
            defaultChecked
            checked={theme == 'light'}
          >
            Light
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem className='rounded-lg' onClick={() => setTheme('dark')} checked={theme == 'dark'}>
            Dark
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            className='rounded-lg'
            onClick={() => setTheme('system')}
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
