'use client';

/**
 * ContextHeader Component
 * Banner, avatar, name, description, and join/leave actions
 */

import { useState } from 'react';
import Image from 'next/image';
import { Calendar, Users, Lock, Globe, UserPlus, LogOut, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import type { ContextWithMembership } from '@/server/services/context.service';

interface ContextHeaderProps {
  context: ContextWithMembership;
  currentUserId?: string;
  onMembershipChange?: () => void;
  className?: string;
}

export function ContextHeader({
  context,
  currentUserId,
  onMembershipChange,
  className,
}: ContextHeaderProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const utils = trpc.useUtils();

  const joinMutation = trpc.context.join.useMutation({
    onSuccess: () => {
      utils.context.getBySlug.invalidate({ slug: context.slug });
      onMembershipChange?.();
    },
  });

  const leaveMutation = trpc.context.leave.useMutation({
    onSuccess: () => {
      utils.context.getBySlug.invalidate({ slug: context.slug });
      onMembershipChange?.();
    },
  });

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await joinMutation.mutateAsync({ contextId: context.id });
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('정말 이 공간을 나가시겠습니까?')) return;
    setIsLeaving(true);
    try {
      await leaveMutation.mutateAsync({ contextId: context.id });
    } finally {
      setIsLeaving(false);
    }
  };

  const membership = context.userMembership;
  const isOwner = membership?.role === 'OWNER';
  const isAdmin = membership?.role === 'ADMIN' || isOwner;
  const isMember = membership?.status === 'APPROVED';
  const isPending = membership?.status === 'PENDING';

  // Determine context type label
  const getTypeLabel = () => {
    if (context.features.includes('event')) return '이벤트';
    if (context.features.includes('group')) return '그룹';
    return '공간';
  };

  // Get visibility icon
  const VisibilityIcon = context.visibility === 'PRIVATE' ? Lock : Globe;

  return (
    <div className={cn('relative', className)}>
      {/* Banner */}
      <div className="relative h-32 sm:h-48 bg-gradient-to-br from-forest-400 to-forest-600 rounded-t-xl overflow-hidden">
        {context.bannerUrl && (
          <Image
            src={context.bannerUrl}
            alt={`${context.name} banner`}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Avatar & Info */}
      <div className="relative px-4 sm:px-6 pb-4">
        {/* Avatar */}
        <div className="absolute -top-12 left-4 sm:left-6">
          <div className="w-24 h-24 rounded-xl border-4 border-card bg-card shadow-medium overflow-hidden">
            {context.avatarUrl ? (
              <Image
                src={context.avatarUrl}
                alt={context.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gradient-forest flex items-center justify-center">
                {context.features.includes('event') ? (
                  <Calendar className="w-10 h-10 text-white" />
                ) : (
                  <Users className="w-10 h-10 text-white" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions (top right) */}
        <div className="flex justify-end pt-3 gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">설정</span>
            </Button>
          )}

          {currentUserId && !isMember && !isPending && (
            <Button
              onClick={handleJoin}
              disabled={isJoining}
              size="sm"
              className="gap-2"
            >
              {isJoining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>참여하기</span>
            </Button>
          )}

          {isPending && (
            <Button variant="outline" size="sm" disabled className="gap-2">
              <Loader2 className="w-4 h-4" />
              <span>승인 대기중</span>
            </Button>
          )}

          {isMember && !isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeave}
              disabled={isLeaving}
              className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {isLeaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">나가기</span>
            </Button>
          )}
        </div>

        {/* Name & Description */}
        <div className="mt-6 pl-28">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-medium bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300 rounded">
              {getTypeLabel()}
            </span>
            <span className="flex items-center gap-1 text-xs text-warm-500">
              <VisibilityIcon className="w-3 h-3" />
              {context.visibility === 'PRIVATE' ? '비공개' : '공개'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-forest-800 dark:text-cream-100">
            {context.name}
          </h1>

          {context.description && (
            <p className="mt-2 text-sm text-warm-600 dark:text-warm-400 line-clamp-2">
              {context.description}
            </p>
          )}

          {/* Stats */}
          <div className="mt-3 flex items-center gap-4 text-sm text-warm-500">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{context._count.memberships} 멤버</span>
            </div>
            {context.owner && (
              <div className="flex items-center gap-1.5">
                <span className="text-warm-400">by</span>
                <span className="font-medium text-forest-600 dark:text-forest-400">
                  {context.owner.displayName || context.owner.username}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
