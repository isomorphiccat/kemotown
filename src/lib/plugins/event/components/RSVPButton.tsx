'use client';

/**
 * RSVPButton Component
 * RSVP action button with status display
 */

import { useState } from 'react';
import {
  Check,
  X,
  Clock,
  HelpCircle,
  Loader2,
  ChevronDown,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import type { PluginContextProps } from '../../types';
import type { EventPluginData, EventMemberData, RSVPStatus } from '../schema';

// User-selectable RSVP statuses (excludes system-assigned: pending, waitlist, cancelled)
type UserSelectableRsvpStatus = 'attending' | 'considering' | 'not_attending';

interface RSVPButtonProps extends PluginContextProps {
  currentUserId?: string;
  onSuccess?: () => void;
}

const statusConfig: Record<
  RSVPStatus,
  { icon: typeof Check; label: string; variant: 'default' | 'outline' | 'destructive' }
> = {
  pending: { icon: Clock, label: '대기중', variant: 'outline' },
  attending: { icon: Check, label: '참석', variant: 'default' },
  considering: { icon: HelpCircle, label: '미정', variant: 'outline' },
  not_attending: { icon: X, label: '불참', variant: 'outline' },
  waitlist: { icon: Clock, label: '대기자 명단', variant: 'outline' },
  cancelled: { icon: X, label: '취소됨', variant: 'destructive' },
};

export function RSVPButton({
  context,
  membership,
  pluginData,
  currentUserId,
  onSuccess,
}: RSVPButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const eventData = pluginData as EventPluginData;
  const memberData = (membership?.pluginData?.event as EventMemberData) || null;
  const currentStatus = memberData?.rsvpStatus;

  const utils = trpc.useUtils();

  const rsvpMutation = trpc.eventPlugin.rsvp.useMutation({
    onSuccess: () => {
      utils.context.getBySlug.invalidate({ slug: context.slug });
      utils.eventPlugin.getAttendees.invalidate({ contextId: context.id });
      onSuccess?.();
    },
  });

  const updateRsvpMutation = trpc.eventPlugin.updateRsvp.useMutation({
    onSuccess: () => {
      utils.context.getBySlug.invalidate({ slug: context.slug });
      utils.eventPlugin.getAttendees.invalidate({ contextId: context.id });
      onSuccess?.();
    },
  });

  const cancelRsvpMutation = trpc.eventPlugin.cancelRsvp.useMutation({
    onSuccess: () => {
      utils.context.getBySlug.invalidate({ slug: context.slug });
      utils.eventPlugin.getAttendees.invalidate({ contextId: context.id });
      onSuccess?.();
    },
  });

  const handleRSVP = async (status: UserSelectableRsvpStatus) => {
    if (!currentUserId) return;
    setIsUpdating(true);
    setShowOptions(false);

    try {
      if (!currentStatus || currentStatus === 'cancelled') {
        await rsvpMutation.mutateAsync({
          contextId: context.id,
          status,
        });
      } else {
        await updateRsvpMutation.mutateAsync({
          contextId: context.id,
          status,
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!currentUserId) return;
    setIsUpdating(true);
    setShowOptions(false);

    try {
      await cancelRsvpMutation.mutateAsync({ contextId: context.id });
    } finally {
      setIsUpdating(false);
    }
  };

  // Not logged in
  if (!currentUserId) {
    return (
      <Button asChild className="w-full">
        <a href="/login">로그인하고 참가하기</a>
      </Button>
    );
  }

  // Check if event is past
  const isPast = new Date(eventData.endAt) < new Date();
  if (isPast) {
    return (
      <Button disabled variant="outline" className="w-full">
        종료된 이벤트
      </Button>
    );
  }

  // Check registration deadline
  if (eventData.registrationDeadline) {
    const deadline = new Date(eventData.registrationDeadline);
    if (deadline < new Date() && !currentStatus) {
      return (
        <Button disabled variant="outline" className="w-full">
          등록 마감
        </Button>
      );
    }
  }

  // Not RSVP'd yet
  if (!currentStatus || currentStatus === 'cancelled') {
    return (
      <div className="relative">
        <Button
          onClick={() => setShowOptions(!showOptions)}
          disabled={isUpdating}
          className="w-full gap-2"
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          <span>참가 신청</span>
          <ChevronDown className="w-4 h-4" />
        </Button>

        {showOptions && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowOptions(false)}
            />
            <div className="absolute top-full mt-2 left-0 right-0 bg-card rounded-xl shadow-large border border-warm-200 dark:border-forest-800 z-20 py-1 overflow-hidden">
              {eventData.rsvpOptions.map((option) => {
                const config = statusConfig[option];
                const Icon = config.icon;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleRSVP(option)}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-warm-50 dark:hover:bg-forest-900/50 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-warm-500" />
                    <span className="font-medium">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Already RSVP'd - show status with change option
  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  return (
    <div className="relative">
      <Button
        variant={config.variant}
        onClick={() => setShowOptions(!showOptions)}
        disabled={isUpdating}
        className={cn(
          'w-full gap-2',
          currentStatus === 'attending' &&
            'bg-green-600 hover:bg-green-700 text-white'
        )}
      >
        {isUpdating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <StatusIcon className="w-4 h-4" />
        )}
        <span>{config.label}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {showOptions && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute top-full mt-2 left-0 right-0 bg-card rounded-xl shadow-large border border-warm-200 dark:border-forest-800 z-20 py-1 overflow-hidden">
            {eventData.rsvpOptions
              .filter((option) => option !== currentStatus)
              .map((option) => {
                const optConfig = statusConfig[option];
                const Icon = optConfig.icon;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleRSVP(option)}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-warm-50 dark:hover:bg-forest-900/50 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-warm-500" />
                    <span className="font-medium">{optConfig.label}로 변경</span>
                  </button>
                );
              })}
            <hr className="my-1 border-warm-200 dark:border-forest-800" />
            <button
              type="button"
              onClick={handleCancel}
              className="w-full px-4 py-2.5 text-left flex items-center gap-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">참가 취소</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
