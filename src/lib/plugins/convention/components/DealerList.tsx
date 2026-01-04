'use client';

/**
 * DealerList Component
 * Displays a list of dealers with their info
 */

import Image from 'next/image';
import { Store, ExternalLink, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Dealer } from '../schema';

interface DealerListProps {
  dealers: Dealer[];
  className?: string;
}

export function DealerList({ dealers, className }: DealerListProps) {
  if (dealers.length === 0) {
    return (
      <div className="text-center py-4">
        <Store className="w-8 h-8 mx-auto text-warm-300 mb-2" />
        <p className="text-sm text-warm-500">등록된 딜러가 없습니다</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {dealers.map((dealer) => (
        <div
          key={dealer.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-warm-50 dark:hover:bg-forest-900/30 transition-colors"
        >
          {/* Avatar */}
          {dealer.imageUrl ? (
            <Image
              src={dealer.imageUrl}
              alt=""
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg object-cover"
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Store className="w-5 h-5 text-orange-500" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-forest-800 dark:text-cream-100 truncate">
              {dealer.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-warm-500">
              {dealer.tableNumber && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {dealer.tableNumber}
                </span>
              )}
              {dealer.category && (
                <span className="px-1.5 py-0.5 bg-warm-100 dark:bg-forest-800 rounded text-[10px]">
                  {dealer.category}
                </span>
              )}
            </div>
          </div>

          {/* External Link */}
          {dealer.socialLinks && Object.keys(dealer.socialLinks).length > 0 && (
            <a
              href={Object.values(dealer.socialLinks)[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-warm-400 hover:text-forest-600 dark:hover:text-forest-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
