import { tv } from 'tailwind-variants';

export const badgeStyles = tv({
  base: [
    'inline-flex items-center gap-x-1.5 py-px font-medium text-xs/5 forced-colors:outline',
    'border border-(--badge-border,transparent) bg-(--badge-bg) text-(--badge-fg)',
    'group-hover:bg-(--badge-overlay) group-focus:bg-(--badge-overlay)',
    '*:data-[slot=icon]:size-3 *:data-[slot=icon]:shrink-0',
    'duration-200'
  ],
  variants: {
    intent: {
      primary:
        '[--badge-bg:var(--color-primary-subtle)] [--badge-fg:var(--color-primary-subtle-fg)] [--badge-overlay:var(--color-primary)]/20',
      secondary:
        '[--badge-bg:var(--color-secondary)] [--badge-fg:var(--color-secondary-fg)] [--badge-overlay:var(--color-muted-fg)]/25',
      success:
        '[--badge-bg:var(--color-success-subtle)] [--badge-fg:var(--color-success-subtle-fg)] [--badge-overlay:var(--color-success)]/20',
      info: '[--badge-bg:var(--color-info-subtle)] [--badge-fg:var(--color-info-subtle-fg)] [--badge-overlay:var(--color-sky-500)]/20',
      warning:
        '[--badge-bg:var(--color-warning-subtle)] [--badge-fg:var(--color-warning-subtle-fg)] [--badge-overlay:var(--color-warning)]/20',
      danger:
        '[--badge-bg:var(--color-danger-subtle)] [--badge-fg:var(--color-danger-subtle-fg)] [--badge-overlay:var(--color-danger)]/20',
      outline: '[--badge-border:var(--color-border)] [--badge-overlay:var(--color-secondary)]/20'
    },
    isCircle: {
      true: 'rounded-full px-[calc(--spacing(2)-1px)] font-mono',
      false: 'rounded-sm px-[calc(--spacing(1.5)-1px)]'
    }
  },
  defaultVariants: {
    intent: 'primary',
    isCircle: true
  }
});

export const buttonStyles = tv({
  base: [
    '[--btn-border:var(--color-fg)]/15 [--btn-icon-active:var(--btn-fg)] [--btn-outline:var(--btn-bg)] [--btn-radius:calc(var(--radius-lg)-1px)] [--btn-ring:var(--btn-bg)]/20',
    'bg-(--btn-bg) text-(--btn-fg) outline-(--btn-outline) ring-(--btn-ring) hover:bg-(--btn-overlay)',
    'relative isolate inline-flex items-center justify-center border border-(--btn-border) font-medium hover:no-underline',
    'focus:outline-0 focus-visible:outline focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-offset-3 focus-visible:ring-offset-bg',
    '*:data-[slot=icon]:-mx-0.5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center *:data-[slot=icon]:text-(--btn-icon) focus-visible:*:data-[slot=icon]:text-(--btn-icon-active)/80 hover:*:data-[slot=icon]:text-(--btn-icon-active)/90 forced-colors:[--btn-icon:ButtonText] forced-colors:hover:[--btn-icon:ButtonText]',
    '*:data-[slot=loader]:-mx-0.5 *:data-[slot=loader]:shrink-0 *:data-[slot=loader]:self-center *:data-[slot=loader]:text-(--btn-icon)',
    'pending:opacity-50 disabled:opacity-50 disabled:forced-colors:text-[GrayText]',
    '*:data-[slot=color-swatch]:-mx-0.5 *:data-[slot=color-swatch]:shrink-0 *:data-[slot=color-swatch]:self-center *:data-[slot=color-swatch]:[--color-swatch-size:--spacing(5)]'
  ],
  variants: {
    intent: {
      primary:
        '[--btn-bg:var(--color-primary)] [--btn-fg:var(--color-primary-fg)] [--btn-icon-active:var(--primary-fg)]/80 [--btn-icon:var(--primary-fg)]/60 [--btn-overlay:color-mix(in_oklab,var(--color-primary-fg)_10%,var(--color-primary)_90%)]',
      secondary:
        '[--btn-bg:var(--color-secondary)] [--btn-fg:var(--color-secondary-fg)] [--btn-icon:var(--color-muted-fg)] [--btn-outline:var(--color-secondary-fg)] [--btn-overlay:color-mix(in_oklab,var(--color-secondary-fg)_10%,var(--color-secondary)_90%)] [--btn-ring:var(--color-muted-fg)]/20',
      warning:
        '[--btn-bg:var(--color-warning)] [--btn-fg:var(--color-warning-fg)] [--btn-icon:var(--color-warning-fg)]/60 [--btn-overlay:color-mix(in_oklab,var(--color-white)_10%,var(--color-warning)_90%)]',
      danger:
        '[--btn-bg:var(--color-danger)] [--btn-fg:var(--color-danger-fg)] [--btn-icon:color-mix(in_oklab,var(--color-danger-fg)_60%,var(--danger)_40%)] [--btn-overlay:color-mix(in_oklab,var(--color-white)_10%,var(--color-danger)_90%)]',
      outline:
        'border-border [--btn-bg:transparent] [--btn-icon:var(--color-muted-fg)] [--btn-outline:var(--color-ring)] [--btn-overlay:var(--color-secondary)] [--btn-ring:var(--color-ring)]/20',
      plain:
        'border-transparent [--btn-bg:transparent] [--btn-icon:var(--color-muted-fg)] [--btn-outline:var(--color-ring)] [--btn-overlay:var(--color-secondary)] [--btn-ring:var(--color-ring)]/20'
    },
    size: {
      xs: [
        'min-h-8 gap-x-1.5 px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] text-sm sm:min-h-7 sm:px-2 sm:py-[calc(--spacing(1.5)-1px)] sm:text-xs/4',
        '*:data-[slot=icon]:-mx-px *:data-[slot=icon]:size-3.5 sm:*:data-[slot=icon]:size-3',
        '*:data-[slot=loader]:-mx-px *:data-[slot=loader]:size-3.5 sm:*:data-[slot=loader]:size-3'
      ],
      sm: [
        'min-h-9 gap-x-1.5 px-3 py-[calc(--spacing(2)-1px)] sm:min-h-8 sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)] sm:text-sm/5',
        '*:data-[slot=icon]:size-4.5 sm:*:data-[slot=icon]:size-4',
        '*:data-[slot=loader]:size-4.5 sm:*:data-[slot=loader]:size-4'
      ],
      md: [
        'min-h-10 gap-x-2 px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:min-h-9 sm:px-3 sm:py-[calc(--spacing(1.5)-1px)] sm:text-sm/6',
        '*:data-[slot=icon]:size-5 sm:*:data-[slot=icon]:size-4',
        '*:data-[slot=loader]:size-5 sm:*:data-[slot=loader]:size-4'
      ],
      lg: [
        'min-h-10 gap-x-2 px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(3)-1px)] sm:min-h-9 sm:px-3 sm:py-[calc(--spacing(1.5)-1px)] sm:text-sm/7',
        '*:data-[slot=icon]:size-5 sm:*:data-[slot=icon]:size-4.5',
        '*:data-[slot=loader]:size-5 sm:*:data-[slot=loader]:size-4.5'
      ],
      'sq-xs': [
        'touch-target size-8 sm:size-7',
        '*:data-[slot=icon]:size-3.5 sm:*:data-[slot=icon]:size-3',
        '*:data-[slot=loader]:size-3.5 sm:*:data-[slot=loader]:size-3'
      ],
      'sq-sm': [
        'touch-target size-10 sm:size-8',
        '*:data-[slot=icon]:size-4.5 sm:*:data-[slot=icon]:size-4',
        '*:data-[slot=loader]:size-4.5 sm:*:data-[slot=loader]:size-4'
      ],
      'sq-md': [
        'touch-target size-11 sm:size-9',
        '*:data-[slot=icon]:size-5 sm:*:data-[slot=icon]:size-4.5',
        '*:data-[slot=loader]:size-5 sm:*:data-[slot=loader]:size-4.5'
      ],
      'sq-lg': [
        'touch-target size-12 sm:size-10',
        '*:data-[slot=icon]:size-6 sm:*:data-[slot=icon]:size-5',
        '*:data-[slot=loader]:size-6 sm:*:data-[slot=loader]:size-5'
      ]
    },

    isCircle: {
      true: 'rounded-full',
      false: 'rounded-lg'
    }
  },
  defaultVariants: {
    intent: 'primary',
    size: 'md',
    isCircle: false
  }
});

export const dropdownSectionStyles = tv({
  slots: {
    section: 'col-span-full grid grid-cols-[auto_1fr]',
    header: 'col-span-full px-3 py-2 font-medium text-muted-fg text-sm/6 sm:px-2.5 sm:py-1.5 sm:text-xs/3'
  }
});

export const dropdownItemStyles = tv({
  base: [
    'min-w-0 [--me-icon:--spacing(2.5)] sm:[--me-icon:--spacing(2)]',
    'col-span-full grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] px-3 py-2 supports-[grid-template-columns:subgrid]:grid-cols-subgrid sm:px-2.5 sm:py-1.5',
    'not-has-[[slot=description]]:items-center',
    'group relative cursor-default select-none rounded-[calc(var(--radius-xl)-(--spacing(1)))] outline-0',
    // text
    'text-base/6 text-fg sm:text-sm/6 forced-colors:text-[CanvasText]',
    // avatar
    '*:data-[slot=avatar]:*:me-(--me-icon) *:data-[slot=avatar]:me-(--me-icon) has-[[slot=description]]:*:data-[slot=avatar]:row-span-2 *:data-[slot=avatar]:[--avatar-size:--spacing(5)] sm:*:data-[slot=avatar]:[--avatar-size:--spacing(4)]',
    // icon
    "*:data-[slot=icon]:col-start-1 *:data-[slot=icon]:row-start-1 *:data-[slot=icon]:-ms-0.5 *:data-[slot=icon]:me-(--me-icon) *:data-[slot=icon]:shrink-0 [&_[data-slot='icon']:not([class*='text-'])]:text-muted-fg",
    'not-has-[[slot=description]]:*:data-[slot=icon]:size-5 sm:not-has-[[slot=description]]:*:data-[slot=icon]:size-4',
    "has-[[slot=description]]:*:data-[slot=icon]:h-lh has-[[slot=description]]:[&_[data-slot='icon']:not([class*='w-'])]:w-5 sm:has-[[slot=description]]:[&_[data-slot='icon']:not([class*='w-'])]:w-4",
    '[&>[slot=label]+[data-slot=icon]]:absolute [&>[slot=label]+[data-slot=icon]]:end-0 [&>[slot=label]+[data-slot=icon]]:top-1',
    'selected:[&>[data-slot=icon]:has(+[data-slot=icon])]:absolute selected:[&>[data-slot=icon]:has(+[data-slot=icon])]:end-0 selected:[&>[data-slot=icon]:has(+[data-slot=icon])]:top-1',
    'selected:[&>[data-slot=icon]:has(+[data-slot=avatar])]:absolute selected:[&>[data-slot=icon]:has(+[data-slot=avatar])]:end-0 selected:[&>[data-slot=icon]:has(+[data-slot=avatar])]:top-1',
    'selected:[&>[data-slot=avatar]+[data-slot=icon]+[slot=label]]:me-6 selected:[&>[data-slot=avatar]+[slot=label]]:me-6 selected:[&>[data-slot=icon]+[data-slot=avatar]+[slot=label]]:me-6 selected:[&>[data-slot=icon]+[slot=label]]:me-6',
    // keyboard
    '*:data-[slot=keyboard]:end-3',
    // force color adjust
    'forced-color-adjust-none forced-colors:focus:bg-[Highlight] forced-colors:focus:text-[HighlightText] forced-colors:focus:*:data-[slot=icon]:text-[HighlightText]'
  ],
  variants: {
    intent: {
      danger: [
        "text-danger-subtle-fg focus:text-danger-subtle-fg [&_[data-slot='icon']:not([class*='text-'])]:text-danger-subtle-fg/70",
        '*:[[slot=description]]:text-danger-subtle-fg/80 focus:*:[[slot=description]]:text-danger-subtle-fg focus:*:[[slot=label]]:text-danger-subtle-fg',
        "focus:bg-danger-subtle focus:text-danger-subtle-fg forced-colors:focus:text-[Mark] focus:[&_[data-slot='icon']:not([class*='text-'])]:text-danger-subtle-fg",
        '*:data-[slot=keyboard]:text-danger-subtle-fg/70 focus:*:data-[slot=keyboard]:text-danger-subtle-fg'
      ],
      warning: [
        "text-warning-subtle-fg focus:text-warning-subtle-fg [&_[data-slot='icon']:not([class*='text-'])]:text-warning-subtle-fg/70",
        '*:[[slot=description]]:text-warning-subtle-fg/80 focus:*:[[slot=description]]:text-warning-subtle-fg focus:*:[[slot=label]]:text-warning-subtle-fg',
        "focus:bg-warning-subtle focus:text-warning-subtle-fg focus:[&_[data-slot='icon']:not([class*='text-'])]:text-warning-subtle-fg",
        '*:data-[slot=keyboard]:text-warning-subtle-fg/70 focus:*:data-[slot=keyboard]:text-warning-subtle-fg'
      ]
    },
    isDisabled: {
      true: 'opacity-50 forced-colors:text-[GrayText]'
    },
    isSelected: {
      true: "[&_[data-slot='icon']:not([class*='text-'])]:text-accent-fg"
    },
    isFocused: {
      true: [
        "*:data-[slot=keyboard]:text-accent-fg [&_[data-slot='icon']:not([class*='text-'])]:text-accent-fg",
        'bg-accent text-accent-fg forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]',
        '[&_.text-muted-fg]:text-accent-fg/80 *:[[slot=description]]:text-accent-fg *:[[slot=label]]:text-accent-fg'
      ]
    },
    isHovered: {
      true: [
        "*:data-[slot=keyboard]:text-accent-fg [&_[data-slot='icon']:not([class*='text-'])]:text-accent-fg",
        'bg-accent text-accent-fg forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]',
        '[&_.text-muted-fg]:text-accent-fg/80 *:[[slot=description]]:text-accent-fg *:[[slot=label]]:text-accent-fg'
      ]
    }
  }
});

export const menuContentStyles = tv({
  base: "grid max-h-[inherit] grid-cols-[auto_1fr] gap-y-1 overflow-y-auto overflow-x-hidden overscroll-contain p-1 outline-hidden [clip-path:inset(0_0_0_0_round_calc(var(--radius-xl)-(--spacing(1))))] [&>[data-slot=menu-section]+[data-slot=menu-section]:not([class*='mt-']):not([class*='my-'])]:mt-3"
});

export const textLinkStyles = tv({
  base: 'text-primary-subtle-fg decoration-primary-subtle-fg/50 hover:underline hover:decoration-primary-subtle-fg has-data-[slot=icon]:inline-flex has-data-[slot=icon]:items-center has-data-[slot=icon]:gap-x-1'
});

