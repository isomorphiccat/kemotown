/**
 * Avatar Component
 * User avatar with fallback to initials
 */

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

const pixelSizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  // Generate fallback from alt text (first letter)
  const getFallback = () => {
    if (fallback) return fallback;
    if (alt) return alt.charAt(0).toUpperCase();
    return '?';
  };

  const pixelSize = pixelSizeMap[size];

  return (
    <div
      className={cn(
        'avatar relative inline-flex items-center justify-center overflow-hidden',
        sizeMap[size],
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <Image
          src={src}
          alt={alt}
          width={pixelSize}
          height={pixelSize}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
          unoptimized // External OAuth URLs may not be configured in next.config
        />
      ) : (
        <span className="flex items-center justify-center bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-semibold">
          {getFallback()}
        </span>
      )}
    </div>
  );
}
