import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ className, hasError, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-md border bg-surface px-4 text-sm text-text placeholder:text-muted',
        'transition-colors duration-ui ease-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        hasError ? 'border-danger' : 'border-border hover:border-accent',
        className
      )}
      {...props}
    />
  );
}
