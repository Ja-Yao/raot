import { cn } from '@/lib/utils';
import { GridLayout, ListLayout, TableLayout, Virtualizer, WaterfallLayout } from 'react-aria-components';

type Layout = typeof ListLayout | typeof GridLayout | typeof WaterfallLayout | typeof TableLayout;

interface ScrollAreaProps {
  className?: string;
  layout?: Layout;
  children: React.ReactNode;
}

// https://react-spectrum.adobe.com/react-aria/Virtualizer.html#listlayout
function ScrollArea({ className, layout, children, ...props }: ScrollAreaProps) {
  return (
    <div className={cn('overflow-y-auto', className)}>
      <Virtualizer
        {...props}
        layout={layout ?? ListLayout}
        layoutOptions={{
          estimatedRowHeight: 75,
          gap: 6,
          padding: 4
        }}
      >
        {children}
      </Virtualizer>
    </div>
  );
}

export { ScrollArea };
