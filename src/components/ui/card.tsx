/**
 * Card Component — Premium "Cozy Forest Town" Theme
 * Sophisticated container with refined depth and interaction states
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  // Base: Premium foundation
  ['rounded-2xl bg-card text-card-foreground', 'transition-all duration-300 ease-out'],
  {
    variants: {
      variant: {
        // Default: Subtle border with minimal shadow
        default: [
          'border border-warm-200/80 dark:border-forest-800/80',
          'shadow-[0_2px_8px_-4px_rgba(26,68,32,0.06)]',
        ],

        // Elevated: Floating effect with depth
        elevated: [
          'shadow-[0_4px_12px_-4px_rgba(26,68,32,0.08),0_8px_24px_-8px_rgba(26,68,32,0.06)]',
          'hover:shadow-[0_8px_20px_-4px_rgba(26,68,32,0.1),0_16px_40px_-12px_rgba(26,68,32,0.08)]',
          'hover:-translate-y-0.5',
        ],

        // Interactive: Full lift + scale on hover
        interactive: [
          'cursor-pointer',
          'shadow-[0_4px_12px_-4px_rgba(26,68,32,0.08),0_8px_24px_-8px_rgba(26,68,32,0.06)]',
          'hover:shadow-[0_12px_32px_-8px_rgba(26,68,32,0.12),0_24px_56px_-16px_rgba(26,68,32,0.1)]',
          'hover:-translate-y-1 hover:scale-[1.01]',
          'active:translate-y-0 active:scale-[0.995]',
          'active:shadow-[0_4px_12px_-4px_rgba(26,68,32,0.08)]',
          'active:transition-all active:duration-100',
        ],

        // Outlined: Elegant border treatment
        outlined: [
          'border-2 border-warm-200 dark:border-forest-800',
          'hover:border-forest-300 dark:hover:border-forest-600',
          'hover:shadow-[0_4px_16px_-8px_rgba(26,68,32,0.1)]',
        ],

        // Glass: Frosted glass effect
        glass: [
          'bg-white/60 dark:bg-forest-900/60',
          'backdrop-blur-xl',
          'border border-white/40 dark:border-white/10',
          'shadow-[0_4px_20px_-4px_rgba(26,68,32,0.08),inset_0_0_0_1px_rgba(255,255,255,0.3)]',
          'dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.05)]',
        ],

        // Highlight: Accent border on the left/top
        highlight: [
          'border border-warm-200/80 dark:border-forest-800/80',
          'shadow-[0_2px_8px_-4px_rgba(26,68,32,0.06)]',
          'relative overflow-hidden',
          'before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-forest-500 before:to-forest-600',
        ],

        // Accent highlight
        'highlight-accent': [
          'border border-warm-200/80 dark:border-forest-800/80',
          'shadow-[0_2px_8px_-4px_rgba(26,68,32,0.06)]',
          'relative overflow-hidden',
          'before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-accent-400 before:to-accent-500',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardVariants({ variant, className }))}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1.5 p-6 pb-3', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-display text-xl font-bold tracking-tight',
      'text-forest-800 dark:text-cream-50',
      'leading-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm text-warm-500 dark:text-warm-400',
      'leading-relaxed',
      className
    )}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center p-6 pt-3',
      'border-t border-warm-100/80 dark:border-forest-800/80',
      className
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
