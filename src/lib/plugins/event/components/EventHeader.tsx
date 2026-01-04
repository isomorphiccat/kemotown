'use client';

/**
 * EventHeader Component
 * Displays event date, time, location, and cost information
 */

import { format, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Globe, DollarSign, Users, Ticket } from 'lucide-react';
import type { PluginContextProps } from '../../types';
import type { EventPluginData } from '../schema';
import { cn } from '@/lib/utils';

export function EventHeader({ pluginData }: PluginContextProps) {
  const eventData = pluginData as EventPluginData;
  const startDate = new Date(eventData.startAt);
  const endDate = new Date(eventData.endAt);
  const isSameDayEvent = isSameDay(startDate, endDate);
  const isPast = endDate < new Date();

  return (
    <div className="space-y-4 py-4">
      {/* Date & Time */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
            isPast
              ? 'bg-warm-100 dark:bg-warm-800'
              : 'bg-forest-100 dark:bg-forest-800'
          )}
        >
          <Calendar
            className={cn(
              'w-5 h-5',
              isPast
                ? 'text-warm-500'
                : 'text-forest-600 dark:text-forest-400'
            )}
          />
        </div>
        <div>
          <p className="font-semibold text-forest-800 dark:text-cream-100">
            {format(startDate, 'PPP (EEEE)', { locale: ko })}
          </p>
          <div className="flex items-center gap-1.5 text-sm text-warm-600 dark:text-warm-400 mt-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {format(startDate, 'p', { locale: ko })}
              {' - '}
              {isSameDayEvent
                ? format(endDate, 'p', { locale: ko })
                : format(endDate, 'PPP p', { locale: ko })}
            </span>
          </div>
        </div>
      </div>

      {/* Location */}
      {eventData.locationType !== 'online' && eventData.location && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-accent-600 dark:text-accent-400" />
          </div>
          <div>
            <p className="font-medium text-forest-800 dark:text-cream-100">
              {eventData.location.name}
            </p>
            {eventData.location.address && eventData.location.isPublic && (
              <p className="text-sm text-warm-500 mt-0.5">
                {eventData.location.address}
              </p>
            )}
            {eventData.location.mapUrl && (
              <a
                href={eventData.location.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-forest-600 dark:text-forest-400 hover:underline mt-1 inline-block"
              >
                지도에서 보기 →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Online URL */}
      {(eventData.locationType === 'online' || eventData.locationType === 'hybrid') &&
        eventData.onlineUrl && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-forest-800 dark:text-cream-100">온라인</p>
              <a
                href={eventData.onlineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-forest-600 dark:text-forest-400 hover:underline"
              >
                온라인 참여 링크
              </a>
            </div>
          </div>
        )}

      {/* Cost & Capacity Row */}
      <div className="flex flex-wrap gap-4 pt-2">
        {/* Cost */}
        {eventData.cost > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-warm-50 dark:bg-forest-900/30 rounded-lg">
            <DollarSign className="w-4 h-4 text-warm-500" />
            <span className="text-sm font-medium text-forest-800 dark:text-cream-100">
              {eventData.cost.toLocaleString()}원
            </span>
          </div>
        )}

        {/* Capacity */}
        {eventData.capacity && (
          <div className="flex items-center gap-2 px-3 py-2 bg-warm-50 dark:bg-forest-900/30 rounded-lg">
            <Users className="w-4 h-4 text-warm-500" />
            <span className="text-sm font-medium text-forest-800 dark:text-cream-100">
              최대 {eventData.capacity}명
            </span>
          </div>
        )}

        {/* Free badge */}
        {eventData.cost === 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Ticket className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              무료
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {eventData.tags && eventData.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {eventData.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium bg-warm-100 dark:bg-forest-800 text-warm-600 dark:text-warm-400 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
