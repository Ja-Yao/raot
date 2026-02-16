'use client';

import { tv, type VariantProps } from 'tailwind-variants';

const badgeIntents = {
  primary: [
    '[--badge-primary:color-mix(in_oklab,var(--color-primary)_10%,white_90%)] [--badge-primary-fg:color-mix(in_oklab,var(--color-primary)_60%,white_40%)] bg-(--badge-primary)',
    'dark:bg-primary/15 text-primary dark:text-(--badge-primary-fg) dark:group-hover:bg-primary/25',
    'group-hover:bg-[color-mix(in_oklab,var(--color-primary)_15%,white_85%)] dark:group-hover:bg-primary/20'
  ],
  secondary: ['bg-secondary group-hover:bg-muted dark:bg-secondary dark:group-hover:bg-muted text-secondary-fg'],
  success: ['bg-emerald-700 text-emerald-200 group-hover:bg-emerald-500/25'],
  info: 'bg-sky-700 text-sky-200 group-hover:bg-sky-500/25',
  warning: 'bg-amber-400 text-amber-700 group-hover:bg-amber-400/30',
  danger: 'bg-red-700 text-red-200 group-hover:bg-red-500/25',
  outline: 'inset-ring-border bg-transparent text-fg group-hover:bg-secondary'
};
const badgeStyles = tv({
  base: 'inset-ring inset-ring-transparent inline-flex items-center gap-x-1.5 py-0.5 font-medium text-xs/5 **:data-[slot=icon]:size-3 forced-colors:outline',
  variants: {
    intent: { ...badgeIntents },
    isCircle: {
      true: 'rounded-full px-2 font-mono',
      false: 'rounded-sm px-1.5'
    }
  },
  defaultVariants: {
    intent: 'primary',
    isCircle: true
  }
});

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeStyles> {
  className?: string;
  children: React.ReactNode;
}

const Badge = ({ children, intent, isCircle = true, className, ...props }: BadgeProps) => {
  return (
    <span {...props} className={badgeStyles({ intent, isCircle, className })}>
      {children}
    </span>
  );
};

export { Badge, badgeIntents, badgeStyles };
export type { BadgeProps };
