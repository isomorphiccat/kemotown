'use client';

/**
 * ContextCard Component
 * Card display for contexts in lists (discovery, search results)
 */

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Users, Lock, Globe, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ContextCardProps {
  context: {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    visibility: string;
    type: string;
    features: string[];
    _count?: {
      memberships: number;
    };
    owner?: {
      displayName?: string | null;
      username?: string | null;
    } | null;
    createdAt?: Date | string;
  };
  /** Show compact variant */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function ContextCard({ context, compact = false, className }: ContextCardProps) {
  const isEvent = context.features.includes('event');
  const isPrivate = context.visibility === 'PRIVATE';
  const memberCount = context._count?.memberships ?? 0;

  if (compact) {
    return (
      <Link
        href={`/c/${context.slug}`}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl hover:bg-warm-50 dark:hover:bg-forest-900/30 transition-colors',
          className
        )}
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-warm-100 dark:bg-forest-800">
          {context.avatarUrl ? (
            <Image
              src={context.avatarUrl}
              alt={context.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-forest flex items-center justify-center">
              {isEvent ? (
                <Calendar className="w-5 h-5 text-white" />
              ) : (
                <Users className="w-5 h-5 text-white" />
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-forest-800 dark:text-cream-100 truncate">
              {context.name}
            </h3>
            {isPrivate && <Lock className="w-3 h-3 text-warm-400 flex-shrink-0" />}
          </div>
          <p className="text-xs text-warm-500 mt-0.5">
            {memberCount} 멤버
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/c/${context.slug}`}
      className={cn(
        'block card-elevated hover:shadow-large transition-shadow overflow-hidden',
        className
      )}
    >
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-br from-forest-400 to-forest-600">
        {context.bannerUrl && (
          <Image
            src={context.bannerUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Type Badge */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 text-xs font-medium bg-black/30 backdrop-blur-sm text-white rounded-lg flex items-center gap-1">
            {isEvent ? (
              <>
                <Calendar className="w-3 h-3" />
                이벤트
              </>
            ) : (
              <>
                <Users className="w-3 h-3" />
                그룹
              </>
            )}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Avatar + Name */}
        <div className="flex gap-3">
          <div className="relative -mt-8 z-10">
            <div className="w-14 h-14 rounded-xl border-2 border-card bg-card overflow-hidden">
              {context.avatarUrl ? (
                <Image
                  src={context.avatarUrl}
                  alt={context.name}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-forest flex items-center justify-center">
                  {isEvent ? (
                    <Calendar className="w-6 h-6 text-white" />
                  ) : (
                    <Users className="w-6 h-6 text-white" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-forest-800 dark:text-cream-100 truncate">
                {context.name}
              </h3>
              {isPrivate ? (
                <Lock className="w-3.5 h-3.5 text-warm-400 flex-shrink-0" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-warm-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-warm-500 mt-0.5 flex items-center gap-2">
              <span>{memberCount} 멤버</span>
              {context.owner && (
                <>
                  <span>•</span>
                  <span>by {context.owner.displayName || context.owner.username}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Description */}
        {context.description && (
          <p className="mt-3 text-sm text-warm-600 dark:text-warm-400 line-clamp-2">
            {context.description}
          </p>
        )}

        {/* Footer */}
        {context.createdAt && (
          <div className="mt-3 pt-3 border-t border-warm-100 dark:border-forest-800 flex items-center gap-1.5 text-xs text-warm-400">
            <Clock className="w-3 h-3" />
            <span>
              {formatDistanceToNow(new Date(context.createdAt), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
