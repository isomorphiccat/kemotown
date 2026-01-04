'use client';

/**
 * AttendeeList Component
 * Displays list of event attendees with RSVP status
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, HelpCircle, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface AttendeeListProps {
  contextId: string;
  /** Initial number of attendees to show */
  initialCount?: number;
  /** Show waitlist section */
  showWaitlist?: boolean;
}

// Attendee type from tRPC response
interface AttendeeItem {
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
  rsvpStatus: string;
  guestCount: number;
  checkedIn: boolean;
  joinedAt: Date;
}

const statusIcons: Record<string, typeof Check> = {
  attending: Check,
  considering: HelpCircle,
  waitlist: Clock,
};


export function AttendeeList({
  contextId,
  initialCount = 8,
  showWaitlist = false,
}: AttendeeListProps) {
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'attending' | 'maybe' | 'waitlist'>('attending');

  const { data: attendees, isLoading } = trpc.eventPlugin.getAttendees.useQuery(
    { contextId },
    { enabled: !!contextId }
  );

  const { data: stats } = trpc.eventPlugin.getStats.useQuery(
    { contextId },
    { enabled: !!contextId }
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-warm-100 dark:bg-forest-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!attendees || attendees.items.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 mx-auto text-warm-300 mb-3" />
        <p className="text-warm-500">아직 참가자가 없습니다</p>
      </div>
    );
  }

  // Group attendees by status
  const grouped = {
    attending: attendees.items.filter((a) => a.rsvpStatus === 'attending'),
    maybe: attendees.items.filter((a) => a.rsvpStatus === 'considering'),
    waitlist: attendees.items.filter((a) => a.rsvpStatus === 'waitlist'),
  };

  const currentList = grouped[activeTab];
  const displayList = showAll ? currentList : currentList.slice(0, initialCount);
  const hasMore = currentList.length > initialCount;

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {stats && (
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-500" />
            <span className="font-medium">{stats.attending}</span>
            <span className="text-warm-500">참석</span>
          </div>
          {stats.considering > 0 && (
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">{stats.considering}</span>
              <span className="text-warm-500">미정</span>
            </div>
          )}
          {stats.waitlist > 0 && showWaitlist && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-warm-400" />
              <span className="font-medium">{stats.waitlist}</span>
              <span className="text-warm-500">대기</span>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-warm-100/50 dark:bg-forest-900/50 rounded-lg">
        <button
          type="button"
          onClick={() => setActiveTab('attending')}
          className={cn(
            'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            activeTab === 'attending'
              ? 'bg-card text-forest-700 dark:text-forest-300 shadow-sm'
              : 'text-warm-500 hover:text-forest-600'
          )}
        >
          참석 ({grouped.attending.length})
        </button>
        {grouped.maybe.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('maybe')}
            className={cn(
              'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              activeTab === 'maybe'
                ? 'bg-card text-forest-700 dark:text-forest-300 shadow-sm'
                : 'text-warm-500 hover:text-forest-600'
            )}
          >
            미정 ({grouped.maybe.length})
          </button>
        )}
        {showWaitlist && grouped.waitlist.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('waitlist')}
            className={cn(
              'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              activeTab === 'waitlist'
                ? 'bg-card text-forest-700 dark:text-forest-300 shadow-sm'
                : 'text-warm-500 hover:text-forest-600'
            )}
          >
            대기 ({grouped.waitlist.length})
          </button>
        )}
      </div>

      {/* Attendee List */}
      <div className="space-y-2">
        {displayList.map((attendee: AttendeeItem) => {
          const StatusIcon = statusIcons[attendee.rsvpStatus] || Check;
          return (
            <Link
              key={attendee.user.id}
              href={`/profile/${attendee.user.username}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-warm-50 dark:hover:bg-forest-900/30 transition-colors"
            >
              {/* Avatar */}
              <div className="relative">
                {attendee.user.avatarUrl ? (
                  <Image
                    src={attendee.user.avatarUrl}
                    alt={attendee.user.displayName || attendee.user.username || ''}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-forest flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {(attendee.user.displayName || attendee.user.username || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Check-in badge */}
                {attendee.checkedIn && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-card flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-forest-800 dark:text-cream-100 truncate">
                  {attendee.user.displayName || attendee.user.username}
                </p>
                <p className="text-xs text-warm-500">@{attendee.user.username}</p>
              </div>

              {/* Status & Guest count */}
              <div className="flex items-center gap-2 text-sm">
                {attendee.guestCount > 0 && (
                  <span className="text-warm-500">+{attendee.guestCount}</span>
                )}
                <StatusIcon
                  className={cn(
                    'w-4 h-4',
                    attendee.rsvpStatus === 'attending' && 'text-green-500',
                    attendee.rsvpStatus === 'considering' && 'text-yellow-500',
                    attendee.rsvpStatus === 'waitlist' && 'text-warm-400'
                  )}
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Show More/Less */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm font-medium text-forest-600 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 flex items-center justify-center gap-1 transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>접기</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>{currentList.length - initialCount}명 더 보기</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
