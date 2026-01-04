/**
 * Button Component — Premium "Cozy Forest Town" Theme
 * Refined button with sophisticated micro-interactions and depth
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base: Premium foundation with refined transitions
  [
    'group relative inline-flex items-center justify-center gap-2',
    'font-medium text-sm',
    'rounded-xl',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none',
  ],
  {
    variants: {
      variant: {
        // Primary: Deep forest green with glow hover
        default: [
          'bg-forest-600 text-white',
          'shadow-[0_4px_12px_-4px_rgba(26,68,32,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]',
          'hover:bg-forest-700',
          'hover:shadow-[0_8px_20px_-4px_rgba(45,132,45,0.4),0_0_24px_-4px_rgba(61,163,61,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]',
          'active:scale-[0.97] active:shadow-[0_2px_8px_-2px_rgba(26,68,32,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]',
        ],

        // Destructive: Refined red with proper warning feel
        destructive: [
          'bg-red-600 text-white',
          'shadow-[0_4px_12px_-4px_rgba(220,38,38,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]',
          'hover:bg-red-700',
          'hover:shadow-[0_8px_20px_-4px_rgba(220,38,38,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]',
          'active:scale-[0.97]',
        ],

        // Outline: Elegant border with fill-on-hover
        outline: [
          'border-2 border-warm-200 dark:border-forest-700',
          'bg-white/50 dark:bg-forest-950/50',
          'text-forest-700 dark:text-cream-100',
          'shadow-[0_2px_8px_-4px_rgba(26,68,32,0.08)]',
          'hover:border-forest-400 dark:hover:border-forest-500',
          'hover:bg-forest-50 dark:hover:bg-forest-900/80',
          'hover:shadow-[0_4px_12px_-4px_rgba(26,68,32,0.12)]',
          'active:scale-[0.97]',
        ],

        // Secondary: Soft cream background
        secondary: [
          'bg-cream-100 dark:bg-forest-800',
          'text-forest-700 dark:text-cream-100',
          'shadow-[0_2px_8px_-4px_rgba(26,68,32,0.1),inset_0_1px_0_rgba(255,255,255,0.5)]',
          'hover:bg-cream-200 dark:hover:bg-forest-700',
          'hover:shadow-[0_4px_12px_-4px_rgba(26,68,32,0.15)]',
          'active:scale-[0.97]',
        ],

        // Ghost: Minimal until interaction
        ghost: [
          'text-warm-600 dark:text-warm-400',
          'hover:text-forest-700 dark:hover:text-forest-300',
          'hover:bg-forest-50 dark:hover:bg-forest-900/60',
          'active:scale-[0.97]',
        ],

        // Link: Text-only with underline
        link: [
          'text-forest-600 dark:text-forest-400',
          'underline-offset-4 hover:underline',
          'p-0 h-auto',
        ],

        // Accent: Warm coral CTA
        accent: [
          'bg-accent-500 text-white',
          'shadow-[0_4px_16px_-4px_rgba(244,88,88,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]',
          'hover:bg-accent-600',
          'hover:shadow-[0_8px_24px_-4px_rgba(244,88,88,0.45),0_0_20px_-4px_rgba(244,88,88,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]',
          'active:scale-[0.97] active:shadow-[0_2px_8px_-2px_rgba(244,88,88,0.3)]',
        ],

        // Premium: Glass effect with border shine
        premium: [
          'bg-white/80 dark:bg-forest-900/80',
          'backdrop-blur-md',
          'border border-warm-200/50 dark:border-forest-700/50',
          'text-forest-700 dark:text-cream-100',
          'shadow-[0_4px_16px_-4px_rgba(26,68,32,0.1),inset_0_0_0_1px_rgba(255,255,255,0.3)]',
          'hover:bg-white/90 dark:hover:bg-forest-800/90',
          'hover:border-forest-300/50 dark:hover:border-forest-600/50',
          'hover:shadow-[0_8px_24px_-4px_rgba(26,68,32,0.15),inset_0_0_0_1px_rgba(255,255,255,0.4)]',
          'active:scale-[0.97]',
        ],
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-4 text-xs rounded-lg',
        lg: 'h-12 px-6 text-base rounded-xl',
        xl: 'h-14 px-8 text-lg rounded-2xl',
        icon: 'h-10 w-10 p-0 rounded-xl',
        'icon-sm': 'h-8 w-8 p-0 rounded-lg',
        'icon-lg': 'h-12 w-12 p-0 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // For asChild mode, render simple pass-through
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}

        {/* Content wrapper - hide when loading */}
        <span
          className={cn(
            'inline-flex items-center justify-center gap-2 transition-opacity',
            isLoading && 'opacity-0'
          )}
        >
          {leftIcon && (
            <span className="shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5">
              {leftIcon}
            </span>
          )}
          {children}
          {rightIcon && (
            <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
              {rightIcon}
            </span>
          )}
        </span>
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
