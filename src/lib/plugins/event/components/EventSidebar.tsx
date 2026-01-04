'use client';

/**
 * EventSidebar Component
 * Sidebar panel with event details, RSVP, and attendees
 */

import { Calendar, Users, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { ko } from 'date-fns/locale';
import { EventHeader } from './EventHeader';
import { RSVPButton } from './RSVPButton';
import { AttendeeList } from './AttendeeList';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import type { PluginContextProps } from '../../types';
import type { EventPluginData } from '../schema';

interface EventSidebarProps extends PluginContextProps {
  currentUserId?: string;
}

export function EventSidebar({
  context,
  membership,
  pluginData,
  currentUserId,
}: EventSidebarProps) {
  const eventData = pluginData as EventPluginData;
  const startDate = new Date(eventData.startAt);
  const endDate = new Date(eventData.endAt);

  const { data: stats } = trpc.eventPlugin.getStats.useQuery(
    { contextId: context.id },
    { enabled: !!context.id }
  );

  // Event status
  const isUpcoming = isFuture(startDate);
  const isOngoing = isPast(startDate) && isFuture(endDate);
  const isEnded = isPast(endDate);

  // Capacity info
  const hasCapacity = !!eventData.capacity;
  const remaining = stats ? eventData.capacity! - stats.attending : null;
  const isFull = hasCapacity && remaining !== null && remaining <= 0;

  return (
    <div className="space-y-6">
      {/* Event Status Banner */}
      {isOngoing && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <span className="font-medium">진행 중</span>
          </div>
        </div>
      )}

      {isEnded && (
        <div className="p-4 bg-warm-50 dark:bg-warm-900/20 border border-warm-200 dark:border-warm-800/40 rounded-xl">
          <div className="flex items-center gap-2 text-warm-600 dark:text-warm-400">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">종료된 이벤트</span>
          </div>
        </div>
      )}

      {/* Countdown for upcoming events */}
      {isUpcoming && (
        <div className="p-4 bg-forest-50 dark:bg-forest-900/30 border border-forest-200 dark:border-forest-800/40 rounded-xl text-center">
          <p className="text-sm text-warm-500 mb-1">이벤트 시작까지</p>
          <p className="text-xl font-bold text-forest-700 dark:text-forest-300">
            {formatDistanceToNow(startDate, { locale: ko })}
          </p>
        </div>
      )}

      {/* RSVP Section */}
      <div className="card-elevated p-4">
        <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          참가 신청
        </h3>

        {/* Capacity Warning */}
        {hasCapacity && remaining !== null && (
          <div
            className={cn(
              'mb-4 p-3 rounded-lg flex items-center gap-2 text-sm',
              isFull
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                : remaining <= 5
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                  : 'bg-warm-50 dark:bg-forest-900/30 text-warm-600 dark:text-warm-400'
            )}
          >
            <Users className="w-4 h-4 shrink-0" />
            {isFull ? (
              <span>정원이 마감되었습니다</span>
            ) : (
              <span>
                {remaining}자리 남음 (총 {eventData.capacity}명)
              </span>
            )}
          </div>
        )}

        {/* Registration Deadline Warning */}
        {eventData.registrationDeadline && isUpcoming && (
          <div className="mb-4 p-3 rounded-lg bg-warm-50 dark:bg-forest-900/30 flex items-center gap-2 text-sm text-warm-600 dark:text-warm-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              등록 마감:{' '}
              {format(new Date(eventData.registrationDeadline), 'PPP', {
                locale: ko,
              })}
            </span>
          </div>
        )}

        {/* RSVP Button */}
        <RSVPButton
          context={context}
          membership={membership}
          pluginData={pluginData}
          currentUserId={currentUserId}
        />

        {/* Rules notice */}
        {eventData.rules && (
          <p className="mt-3 text-xs text-warm-500 text-center">
            참가 시 이벤트 규칙에 동의하는 것으로 간주됩니다
          </p>
        )}
      </div>

      {/* Event Details */}
      <div className="card-elevated p-4">
        <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-2">
          이벤트 정보
        </h3>
        <EventHeader
          context={context}
          membership={membership}
          pluginData={pluginData}
        />
      </div>

      {/* Attendees */}
      <div className="card-elevated p-4">
        <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          참가자
        </h3>
        <AttendeeList
          contextId={context.id}
          initialCount={6}
          showWaitlist={eventData.hasWaitlist}
        />
      </div>

      {/* Event Rules */}
      {eventData.rules && (
        <div className="card-elevated p-4">
          <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-3">
            이벤트 규칙
          </h3>
          <div className="text-sm text-warm-600 dark:text-warm-400 whitespace-pre-wrap">
            {eventData.rules}
          </div>
        </div>
      )}
    </div>
  );
}
