/**
 * Input Component — Premium "Cozy Forest Town" Theme
 * Refined text input with sophisticated focus states and styling
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  // Base: Premium foundation with smooth transitions
  [
    'flex w-full',
    'bg-white dark:bg-forest-950',
    'text-foreground',
    'transition-all duration-200 ease-out',
    'placeholder:text-warm-400 dark:placeholder:text-warm-500',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-warm-50 dark:disabled:bg-forest-900',
    'focus-visible:outline-none',
  ],
  {
    variants: {
      variant: {
        // Default: Clean border with refined focus
        default: [
          'border-2 border-warm-200 dark:border-forest-800',
          'shadow-[inset_0_2px_4px_rgba(26,68,32,0.03)]',
          'hover:border-warm-300 dark:hover:border-forest-700',
          'focus:border-forest-400 dark:focus:border-forest-500',
          'focus:shadow-[inset_0_2px_4px_rgba(26,68,32,0.03),0_0_0_3px_rgba(61,163,61,0.1)]',
          'dark:focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_0_0_3px_rgba(61,163,61,0.15)]',
        ],

        // Ghost: Minimal until focused
        ghost: [
          'border-2 border-transparent',
          'bg-warm-50/50 dark:bg-forest-900/50',
          'hover:bg-warm-100/80 dark:hover:bg-forest-900/80',
          'focus:bg-white dark:focus:bg-forest-950',
          'focus:border-forest-400 dark:focus:border-forest-500',
          'focus:shadow-[0_0_0_3px_rgba(61,163,61,0.1)]',
        ],

        // Filled: Solid background with no border
        filled: [
          'border-2 border-transparent',
          'bg-cream-100 dark:bg-forest-900',
          'shadow-[inset_0_2px_4px_rgba(26,68,32,0.04)]',
          'hover:bg-cream-200/80 dark:hover:bg-forest-800/80',
          'focus:bg-cream-50 dark:focus:bg-forest-950',
          'focus:border-forest-400 dark:focus:border-forest-500',
          'focus:shadow-[inset_0_2px_4px_rgba(26,68,32,0.03),0_0_0_3px_rgba(61,163,61,0.1)]',
        ],
      },
      inputSize: {
        default: 'h-11 px-4 py-2.5 rounded-xl text-sm',
        sm: 'h-9 px-3 py-2 rounded-lg text-sm',
        lg: 'h-12 px-5 py-3 rounded-xl text-base',
        xl: 'h-14 px-6 py-3.5 rounded-2xl text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      inputSize,
      leftElement,
      rightElement,
      error,
      ...props
    },
    ref
  ) => {
    // Simple input without wrapper elements
    if (!leftElement && !rightElement) {
      return (
        <input
          type={type}
          className={cn(
            inputVariants({ variant, inputSize }),
            error && [
              'border-red-400 dark:border-red-500',
              'focus:border-red-500 dark:focus:border-red-400',
              'focus:shadow-[inset_0_2px_4px_rgba(26,68,32,0.03),0_0_0_3px_rgba(239,68,68,0.1)]',
            ],
            className
          )}
          ref={ref}
          {...props}
        />
      );
    }

    // Input with left/right elements wrapped in a container
    return (
      <div className="relative flex items-center">
        {leftElement && (
          <div className="absolute left-3 flex items-center text-warm-400 dark:text-warm-500 pointer-events-none">
            {leftElement}
          </div>
        )}
        <input
          type={type}
          className={cn(
            inputVariants({ variant, inputSize }),
            leftElement && 'pl-10',
            rightElement && 'pr-10',
            error && [
              'border-red-400 dark:border-red-500',
              'focus:border-red-500 dark:focus:border-red-400',
              'focus:shadow-[inset_0_2px_4px_rgba(26,68,32,0.03),0_0_0_3px_rgba(239,68,68,0.1)]',
            ],
            className
          )}
          ref={ref}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center text-warm-400 dark:text-warm-500">
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
