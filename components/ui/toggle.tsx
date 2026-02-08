import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const toggleVariants = cva(
  'inline-flex min-h-11 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors duration-ui ease-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-accent data-[state=on]:bg-accent/15 data-[state=on]:text-text',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface text-muted hover:text-text',
        outline: 'border-border bg-transparent text-muted hover:text-text'
      },
      size: {
        default: 'h-11',
        sm: 'h-9 px-2 text-xs',
        lg: 'h-12 px-4'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {}

const Toggle = React.forwardRef<React.ElementRef<typeof TogglePrimitive.Root>, ToggleProps>(
  ({ className, variant, size, ...props }, ref) => (
    <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size }), className)} {...props} />
  )
);

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle };
