import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors duration-ui ease-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary: 'border-text bg-text text-bg hover:bg-zinc-200 active:bg-zinc-300',
        secondary: 'border-border bg-surface text-text hover:border-accent hover:text-white',
        ghost: 'border-transparent bg-transparent text-muted hover:bg-surface hover:text-text',
        destructive: 'border-transparent bg-danger text-white hover:bg-red-400 active:bg-red-500'
      },
      size: {
        default: 'h-11',
        sm: 'h-10 px-3',
        lg: 'h-12 px-5',
        icon: 'h-11 w-11 p-0'
      }
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Spinner = () => (
  <span
    aria-hidden="true"
    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
  />
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref}
          aria-disabled={disabled || loading ? true : undefined}
          data-disabled={disabled || loading ? '' : undefined}
          {...props}
        >
          {React.Children.only(children)}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Spinner /> : null}
        <span>{children}</span>
      </Comp>
    );
  }
);

Button.displayName = 'Button';
