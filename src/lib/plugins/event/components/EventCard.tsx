'use client';

/**
 * EventCard Component
 * Card for displaying events in listings and discovery
 */

import Link from 'next/link';
import Image from 'next/image';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PluginContextProps } from '../../types';
import type { EventPluginData } from '../schema';

interface EventCardProps extends PluginContextProps {
  /** Show compact variant */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function EventCard({
  context,
  pluginData,
  compact = false,
  className,
}: EventCardProps) {
  const eventData = pluginData as EventPluginData;
  const startDate = new Date(eventData.startAt);
  const endDate = new Date(eventData.endAt);

  const isOngoing = isPast(startDate) && isFuture(endDate);
  const isEnded = isPast(endDate);
  const isEventToday = isToday(startDate);

  // Status badge config
  const statusBadge = isOngoing
    ? { label: '진행 중', color: 'bg-green-500' }
    : isEventToday
      ? { label: '오늘', color: 'bg-accent-500' }
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
        {/* Date Badge */}
        <div className="w-12 h-12 rounded-lg bg-forest-100 dark:bg-forest-800 flex flex-col items-center justify-center shrink-0">
          <span className="text-xs font-medium text-forest-600 dark:text-forest-400 uppercase">
            {format(startDate, 'MMM', { locale: ko })}
          </span>
          <span className="text-lg font-bold text-forest-800 dark:text-cream-100 -mt-0.5">
            {format(startDate, 'd')}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-forest-800 dark:text-cream-100 truncate">
              {context.name}
            </h4>
            {statusBadge && (
              <span
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-medium text-white rounded',
                  statusBadge.color
                )}
              >
                {statusBadge.label}
              </span>
            )}
          </div>
          <p className="text-xs text-warm-500 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {format(startDate, 'p', { locale: ko })}
            {eventData.location && (
              <>
                <span>•</span>
                <MapPin className="w-3 h-3" />
                {eventData.location.name}
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
      <div className="relative h-32 bg-gradient-to-br from-forest-400 to-forest-600">
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

        {/* Date Overlay */}
        <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
          <p className="text-xs font-medium text-forest-600 dark:text-forest-400">
            {format(startDate, 'EEE', { locale: ko })}
          </p>
          <p className="text-xl font-bold text-forest-800 dark:text-cream-100 -mt-0.5">
            {format(startDate, 'd')}
          </p>
          <p className="text-xs text-warm-500">
            {format(startDate, 'MMM', { locale: ko })}
          </p>
        </div>

        {/* Price Badge */}
        <div className="absolute top-3 right-3">
          {eventData.cost > 0 ? (
            <span className="px-2 py-1 text-xs font-medium bg-card/90 backdrop-blur-sm text-forest-700 dark:text-forest-300 rounded-lg shadow-md">
              {eventData.cost.toLocaleString()}원
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded-lg shadow-md">
              무료
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-2 line-clamp-2">
          {context.name}
        </h3>

        {/* Time & Location */}
        <div className="space-y-1.5 text-sm text-warm-600 dark:text-warm-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 shrink-0 text-warm-400" />
            <span>
              {format(startDate, 'PPP', { locale: ko })} {format(startDate, 'p', { locale: ko })}
            </span>
          </div>

          {eventData.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0 text-warm-400" />
              <span className="truncate">{eventData.location.name}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-warm-100 dark:border-forest-800 flex items-center justify-between">
          {/* Capacity */}
          {eventData.capacity && (
            <div className="flex items-center gap-1.5 text-sm text-warm-500">
              <Users className="w-4 h-4" />
              <span>최대 {eventData.capacity}명</span>
            </div>
          )}

          {/* Tags */}
          {eventData.tags && eventData.tags.length > 0 && (
            <div className="flex gap-1">
              {eventData.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-warm-100 dark:bg-forest-800 text-warm-500 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
