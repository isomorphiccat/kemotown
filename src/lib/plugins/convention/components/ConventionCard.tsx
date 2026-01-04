'use client';

/**
 * ConventionCard Component
 * Card for displaying conventions in listings
 */

import Link from 'next/link';
import Image from 'next/image';
import { format, isFuture, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, MapPin, Users, Store, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PluginContextProps } from '../../types';
import type { ConventionPluginData } from '../schema';

interface ConventionCardProps extends PluginContextProps {
  /** Show compact variant */
  compact?: boolean;
  /** Member count */
  memberCount?: number;
  /** Additional CSS classes */
  className?: string;
}

export function ConventionCard({
  context,
  pluginData,
  compact = false,
  memberCount,
  className,
}: ConventionCardProps) {
  // Convention extends event, so we need event dates from parent context
  const conData = pluginData as ConventionPluginData;

  // Get date range from schedule days
  const hasSchedule = conData.scheduleDays && conData.scheduleDays.length > 0;
  const startDate = hasSchedule ? new Date(conData.scheduleDays[0]) : null;
  const endDate = hasSchedule
    ? new Date(conData.scheduleDays[conData.scheduleDays.length - 1])
    : null;

  const isUpcoming = startDate && isFuture(startDate);
  const isOngoing = startDate && endDate && isPast(startDate) && isFuture(endDate);
  const isEnded = endDate && isPast(endDate);

  // Status badge
  const statusBadge = isOngoing
    ? { label: '진행 중', color: 'bg-green-500' }
    : isUpcoming
      ? { label: '예정', color: 'bg-forest-500' }
      : isEnded
        ? { label: '종료', color: 'bg-warm-400' }
        : null;

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
        {context.avatarUrl ? (
          <Image
            src={context.avatarUrl}
            alt=""
            width={48}
            height={48}
            className="w-12 h-12 rounded-lg object-cover"
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <PartyPopper className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-forest-800 dark:text-cream-100 truncate">
              {context.name}
            </h4>
            {statusBadge && (
              <span
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-medium text-white rounded shrink-0',
                  statusBadge.color
                )}
              >
                {statusBadge.label}
              </span>
            )}
          </div>
          <p className="text-xs text-warm-500 flex items-center gap-1.5 mt-0.5">
            {startDate && (
              <>
                <Calendar className="w-3 h-3" />
                {format(startDate, 'M.d', { locale: ko })}
                {endDate && endDate > startDate && ` - ${format(endDate, 'M.d', { locale: ko })}`}
              </>
            )}
            {memberCount !== undefined && (
              <>
                <span>•</span>
                <Users className="w-3 h-3" />
                {memberCount.toLocaleString()}
              </>
            )}
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
        isEnded && 'opacity-75',
        className
      )}
    >
      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-br from-orange-400 to-orange-600">
        {context.bannerUrl && (
          <Image
            src={context.bannerUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Status Badge */}
        {statusBadge && (
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                'px-2 py-1 text-xs font-medium text-white rounded-lg shadow-md',
                statusBadge.color
              )}
            >
              {statusBadge.label}
            </span>
          </div>
        )}

        {/* Date Range */}
        {startDate && (
          <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
            <p className="text-xs font-medium text-forest-600 dark:text-forest-400">
              {format(startDate, 'MMM', { locale: ko })}
            </p>
            <p className="text-lg font-bold text-forest-800 dark:text-cream-100 -mt-0.5">
              {format(startDate, 'd')}
              {endDate && endDate > startDate && ` - ${format(endDate, 'd')}`}
            </p>
          </div>
        )}

        {/* Day Count */}
        {hasSchedule && conData.scheduleDays.length > 1 && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium bg-card/90 backdrop-blur-sm text-forest-700 dark:text-forest-300 rounded-lg shadow-md">
              {conData.scheduleDays.length}일간
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-2 line-clamp-2">
          {context.name}
        </h3>

        {/* Location */}
        {conData.venueAddress && (
          <div className="flex items-center gap-2 text-sm text-warm-600 dark:text-warm-400 mb-3">
            <MapPin className="w-4 h-4 shrink-0 text-warm-400" />
            <span className="truncate">{conData.venueAddress.split(',')[0]}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-3 text-sm text-warm-500">
          {memberCount !== undefined && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{memberCount.toLocaleString()} 참가자</span>
            </div>
          )}
          {conData.dealers && conData.dealers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Store className="w-4 h-4" />
              <span>{conData.dealers.length} 딜러</span>
            </div>
          )}
          {conData.schedule && conData.schedule.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{conData.schedule.length} 일정</span>
            </div>
          )}
        </div>

        {/* Hash Tags */}
        {conData.hashTags && conData.hashTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {conData.hashTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
