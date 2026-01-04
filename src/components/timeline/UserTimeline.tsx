'use client';

/**
 * UserTimeline Component
 * Displays a specific user's posts with infinite scroll
 * Shows composer on own profile
 */

import { useCallback } from 'react';
import { TimelinePost } from './TimelinePost';
import { ActivityComposer } from './ActivityComposer';
import { trpc } from '@/lib/trpc';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineItem } from '@/types/timeline';

interface UserTimelineProps {
  /** The user whose posts to display */
  userId: string;
  /** Current logged-in user's ID (for interaction state) */
  currentUserId?: string;
  /** Current user's avatar (for composer) */
  currentUserAvatar?: string | null;
  /** Current user's display name (for composer) */
  currentUserDisplayName?: string | null;
  /** Whether to show the post composer (only on own profile) */
  showComposer?: boolean;
  /** Include replies in the timeline */
  includeReplies?: boolean;
  /** Include reposts in the timeline */
  includeReposts?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function UserTimeline({
  userId,
  currentUserId,
  currentUserAvatar,
  currentUserDisplayName,
  showComposer = false,
  includeReplies = false,
  includeReposts = true,
  className,
}: UserTimelineProps) {
  const utils = trpc.useUtils();

  // Fetch user timeline with infinite scroll
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.activity.userTimeline.useInfiniteQuery(
    {
      userId,
      limit: 20,
      includeReplies,
      includeReposts,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // Delete post mutation
  const deleteActivityMutation = trpc.activity.delete.useMutation({
    onSuccess: () => {
      utils.activity.userTimeline.invalidate({ userId });
      utils.activity.publicTimeline.invalidate();
      utils.activity.homeTimeline.invalidate();
    },
  });

  // Like mutation
  const likeMutation = trpc.activity.like.useMutation({
    onSuccess: () => {
      utils.activity.userTimeline.invalidate({ userId });
    },
  });

  // Unlike mutation
  const unlikeMutation = trpc.activity.unlike.useMutation({
    onSuccess: () => {
      utils.activity.userTimeline.invalidate({ userId });
    },
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

  const handleComposerSuccess = useCallback(() => {
    utils.activity.userTimeline.invalidate({ userId });
    utils.activity.publicTimeline.invalidate();
    utils.activity.homeTimeline.invalidate();
  }, [utils, userId]);

  // Flatten items from pages
  const items = (data?.pages.flatMap((page) => page.items) ?? []) as TimelineItem[];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Post Composer (only on own profile) */}
      {showComposer && currentUserId === userId && (
        <ActivityComposer
          avatarUrl={currentUserAvatar}
          displayName={currentUserDisplayName}
          onSuccess={handleComposerSuccess}
          placeholder="무슨 생각을 하고 계신가요?"
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="spinner w-8 h-8" />
          <p className="text-warm-500 dark:text-warm-400 text-sm font-korean">
            게시물을 불러오는 중...
          </p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-8 rounded-2xl bg-red-50/80 dark:bg-red-900/20 border border-red-200/80 dark:border-red-800/40 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-red-800 dark:text-red-300 font-bold mb-2 font-korean">
            게시물을 불러오는데 실패했습니다
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4 font-korean">
            {error instanceof Error ? error.message : '알 수 없는 오류'}
          </p>
          <button
            type="button"
            onClick={() => utils.activity.userTimeline.invalidate({ userId })}
            className="px-5 py-2.5 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-800 dark:text-red-300 rounded-xl text-sm font-medium transition-colors font-korean"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Posts List */}
      {!isLoading && !isError && (
        <>
          {items.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white/60 dark:bg-forest-900/40 border border-warm-200/60 dark:border-forest-800/60 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-forest-100 dark:bg-forest-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-forest-500 dark:text-forest-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-forest-800 dark:text-cream-50 mb-2 font-korean">
                아직 게시물이 없습니다
              </h3>
              <p className="text-sm text-warm-500 dark:text-warm-400 font-korean">
                {showComposer && currentUserId === userId
                  ? '첫 번째 게시물을 작성해보세요!'
                  : '이 사용자는 아직 게시물을 작성하지 않았습니다.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.activity.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
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

          {/* Load More */}
          {hasNextPage && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="group px-6 py-3 bg-white/70 dark:bg-forest-900/70 border-2 border-warm-200/80 dark:border-forest-700/80 text-forest-700 dark:text-cream-100 rounded-xl hover:border-forest-300 dark:hover:border-forest-600 hover:bg-white dark:hover:bg-forest-800 disabled:opacity-60 disabled:cursor-not-allowed font-medium transition-all duration-200 font-korean"
              >
                {isFetchingNextPage ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    불러오는 중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    더 보기
                    <svg className="w-4 h-4 transform group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
