'use client';

import { cx } from '@/lib/primitive';
import { Button as ButtonPrimitive, type ButtonProps as ButtonPrimitiveProps } from 'react-aria-components';
import { type VariantProps } from 'tailwind-variants';
import { buttonStyles } from '../styles';

export interface ButtonProps extends ButtonPrimitiveProps, VariantProps<typeof buttonStyles> {
  ref?: React.Ref<HTMLButtonElement>;
}

export function Button({ className, intent, size, isCircle, ref, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      ref={ref}
      {...props}
      className={cx(
        buttonStyles({
          intent,
          size,
          isCircle
        }),
        className
      )}
    />
  );
}
