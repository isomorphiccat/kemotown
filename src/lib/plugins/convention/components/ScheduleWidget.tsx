'use client';

/**
 * ScheduleWidget Component
 * Compact schedule view for sidebar
 */

import { format, isToday, isFuture, isPast } from 'date-fns';
import { Clock, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduleItem } from '../schema';

interface ScheduleWidgetProps {
  schedule: ScheduleItem[];
  maxItems?: number;
  className?: string;
}

export function ScheduleWidget({
  schedule,
  maxItems = 5,
  className,
}: ScheduleWidgetProps) {
  // Filter to today's events, sorted by start time
  const todayEvents = schedule
    .filter((item) => isToday(new Date(item.startAt)))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  // If no today events, show upcoming
  const upcomingEvents = todayEvents.length === 0
    ? schedule
        .filter((item) => isFuture(new Date(item.startAt)))
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .slice(0, maxItems)
    : todayEvents.slice(0, maxItems);

  if (upcomingEvents.length === 0) {
    return (
      <div className="text-center py-4">
        <Clock className="w-8 h-8 mx-auto text-warm-300 mb-2" />
        <p className="text-sm text-warm-500">예정된 일정이 없습니다</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {upcomingEvents.map((item) => {
        const startTime = new Date(item.startAt);
        const endTime = new Date(item.endAt);
        const isNow = isPast(startTime) && isFuture(endTime);
        const hasPassed = isPast(endTime);

        return (
          <div
            key={item.id}
            className={cn(
              'p-3 rounded-lg transition-colors',
              isNow
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40'
                : hasPassed
                  ? 'bg-warm-50 dark:bg-forest-900/20 opacity-60'
                  : 'bg-warm-50 dark:bg-forest-900/30 hover:bg-warm-100 dark:hover:bg-forest-900/50'
            )}
          >
            <div className="flex items-start gap-3">
              {/* Time */}
              <div className="shrink-0 text-center">
                <p
                  className={cn(
                    'text-sm font-bold',
                    isNow
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-forest-700 dark:text-forest-300'
                  )}
                >
                  {format(startTime, 'HH:mm')}
                </p>
                <p className="text-[10px] text-warm-400">
                  {format(endTime, 'HH:mm')}
                </p>
              </div>

              {/* Divider */}
              <div
                className={cn(
                  'w-0.5 self-stretch rounded',
                  isNow ? 'bg-green-400' : 'bg-warm-200 dark:bg-forest-700'
                )}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {isNow && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-green-600 bg-green-100 dark:bg-green-900/30 rounded mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    진행 중
                  </span>
                )}
                <p
                  className={cn(
                    'text-sm font-medium truncate',
                    isNow
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-forest-800 dark:text-cream-100'
                  )}
                >
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-warm-500">
                  {item.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </span>
                  )}
                  {item.capacity && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {item.capacity}명
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
