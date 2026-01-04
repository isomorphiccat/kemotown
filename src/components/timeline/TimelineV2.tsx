'use client';

/**
 * TimelineV2 Component
 * Timeline-centric view supporting multiple timeline types
 * Uses IntersectionObserver for infinite scroll
 */

import { useEffect, useRef, useCallback } from 'react';
import { TimelinePost } from './TimelinePost';
import { TimelineEmpty } from './TimelineEmpty';
import { useSSE, type SSEMessage } from '@/hooks/use-sse';
import { trpc } from '@/lib/trpc';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineItem } from '@/types/timeline';

interface TimelineV2Props {
  /** Timeline type */
  type: 'public' | 'home' | 'context' | 'user';
  /** Context ID (required for type='context') */
  contextId?: string;
  /** User ID (required for type='user') */
  userId?: string;
  /** Current logged-in user ID */
  currentUserId?: string;
  /** Include replies in timeline */
  includeReplies?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function TimelineV2({
  type,
  contextId,
  userId,
  currentUserId,
  includeReplies = false,
  className,
}: TimelineV2Props) {
  const utils = trpc.useUtils();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Select the right query based on type
  const publicQuery = trpc.activity.publicTimeline.useInfiniteQuery(
    { limit: 20, includeReplies },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: type === 'public',
    }
  );

  const homeQuery = trpc.activity.homeTimeline.useInfiniteQuery(
    { limit: 20, includeReplies },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: type === 'home',
    }
  );

  const contextQuery = trpc.activity.contextTimeline.useInfiniteQuery(
    { contextId: contextId || '', limit: 20, includeReplies: true },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: type === 'context' && !!contextId,
    }
  );

  const userQuery = trpc.activity.userTimeline.useInfiniteQuery(
    { userId: userId || '', limit: 20, includeReplies, includeReposts: true },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: type === 'user' && !!userId,
    }
  );

  // Select active query
  const query = (() => {
    switch (type) {
      case 'public':
        return publicQuery;
      case 'home':
        return homeQuery;
      case 'context':
        return contextQuery;
      case 'user':
        return userQuery;
    }
  })();

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = query;

  // Invalidate function
  const invalidateTimeline = useCallback(() => {
    switch (type) {
      case 'public':
        utils.activity.publicTimeline.invalidate();
        break;
      case 'home':
        utils.activity.homeTimeline.invalidate();
        break;
      case 'context':
        utils.activity.contextTimeline.invalidate();
        break;
      case 'user':
        utils.activity.userTimeline.invalidate();
        break;
    }
  }, [type, utils]);

  // SSE channel configuration
  const sseChannel = type === 'context' ? 'CONTEXT' : type === 'home' ? 'HOME' : 'GLOBAL';

  // SSE real-time updates
  const { isConnected, error: sseError, reconnect } = useSSE({
    channel: sseChannel,
    eventId: undefined,
    contextId: type === 'context' ? contextId : undefined,
    enabled: type !== 'user', // No SSE for user timelines
    onMessage: useCallback(
      (message: SSEMessage) => {
        if (message.type === 'new_post' || message.type === 'new_reaction') {
          invalidateTimeline();
        }
      },
      [invalidateTimeline]
    ),
  });

  // Mutations
  const deleteActivityMutation = trpc.activity.delete.useMutation({
    onSuccess: invalidateTimeline,
  });

  const likeMutation = trpc.activity.like.useMutation({
    onSuccess: invalidateTimeline,
  });

  const unlikeMutation = trpc.activity.unlike.useMutation({
    onSuccess: invalidateTimeline,
  });

  // Handlers
  const handleDeletePost = async (activityId: string) => {
    await deleteActivityMutation.mutateAsync({ activityId });
  };

  const handleLike = (activityId: string) => {
    likeMutation.mutate({ targetActivityId: activityId });
  };

  const handleUnlike = (activityId: string) => {
    unlikeMutation.mutate({ targetActivityId: activityId });
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten items from pages
  const items = (data?.pages.flatMap((page) => page.items) ?? []) as TimelineItem[];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Connection Status */}
      {sseError && (
        <div className="p-4 rounded-xl bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200/80 dark:border-yellow-800/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
            <WifiOff className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{sseError}</span>
          </div>
          <button
            type="button"
            onClick={reconnect}
            className="shrink-0 px-4 py-2 text-sm font-medium bg-yellow-100 dark:bg-yellow-900/40 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 text-yellow-800 dark:text-yellow-300 rounded-xl transition-colors"
          >
            재연결
          </button>
        </div>
      )}

      {/* Real-time Indicator */}
      {isConnected && !sseError && type !== 'user' && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-forest-600 dark:text-forest-400 bg-forest-50 dark:bg-forest-900/30 rounded-full">
          <Wifi className="w-3.5 h-3.5" />
          <span>실시간 업데이트</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <RefreshCw className="w-8 h-8 text-forest-500 animate-spin" />
          <p className="text-warm-500 dark:text-warm-400 text-sm">
            타임라인을 불러오는 중...
          </p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-8 rounded-xl bg-red-50/80 dark:bg-red-900/20 border border-red-200/80 dark:border-red-800/40 text-center">
          <h3 className="text-red-800 dark:text-red-300 font-bold mb-2">
            타임라인을 불러오는데 실패했습니다
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">
            {error instanceof Error ? error.message : '알 수 없는 오류'}
          </p>
          <button
            type="button"
            onClick={() => invalidateTimeline()}
            className="px-5 py-2.5 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-800 dark:text-red-300 rounded-xl text-sm font-medium transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Posts List */}
      {!isLoading && !isError && (
        <>
          {items.length === 0 ? (
            <TimelineEmpty type={type} />
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.activity.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                >
                  <TimelinePost
                    item={item}
                    currentUserId={currentUserId}
                    onDelete={handleDeletePost}
                    onLike={handleLike}
                    onUnlike={handleUnlike}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Infinite Scroll Trigger */}
          <div ref={loadMoreRef} className="py-4 flex justify-center min-h-[60px]">
            {isFetchingNextPage && (
              <RefreshCw className="w-6 h-6 text-forest-500 animate-spin" />
            )}
          </div>
        </>
      )}
    </div>
  );
}
