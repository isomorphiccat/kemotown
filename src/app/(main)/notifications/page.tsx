'use client';

/**
 * Notifications Page
 * Full-page notification view with filtering and infinite scroll
 */

import { useState, useCallback, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import {
  Bell,
  Heart,
  UserPlus,
  AtSign,
  Repeat2,
  MessageCircle,
  CheckCheck,
  Loader2,
  Check,
  Trash2,
  Settings,
} from 'lucide-react';
import { InboxCategory } from '@prisma/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

// =============================================================================
// Types
// =============================================================================

type FilterCategory =
  | 'all'
  | 'mentions'
  | 'likes'
  | 'follows'
  | 'reposts'
  | 'replies';

// =============================================================================
// Filter Tabs Configuration
// =============================================================================

const FILTER_TABS: Array<{
  id: FilterCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'all', label: '전체', icon: Bell },
  { id: 'mentions', label: '언급', icon: AtSign },
  { id: 'likes', label: '좋아요', icon: Heart },
  { id: 'follows', label: '팔로우', icon: UserPlus },
  { id: 'reposts', label: '리포스트', icon: Repeat2 },
  { id: 'replies', label: '댓글', icon: MessageCircle },
];

// Category icons and colors
const CATEGORY_CONFIG: Record<
  InboxCategory,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  DEFAULT: { icon: Bell, color: 'text-warm-500 bg-warm-100 dark:bg-warm-900/50' },
  FOLLOW: { icon: UserPlus, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/50' },
  MENTION: { icon: AtSign, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/50' },
  LIKE: { icon: Heart, color: 'text-red-500 bg-red-100 dark:bg-red-900/50' },
  REPOST: { icon: Repeat2, color: 'text-green-500 bg-green-100 dark:bg-green-900/50' },
  REPLY: { icon: MessageCircle, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/50' },
  DM: { icon: MessageCircle, color: 'text-forest-500 bg-forest-100 dark:bg-forest-900/50' },
  EVENT: { icon: Bell, color: 'text-accent-500 bg-accent-100 dark:bg-accent-900/50' },
  GROUP: { icon: Bell, color: 'text-forest-500 bg-forest-100 dark:bg-forest-900/50' },
  SYSTEM: { icon: Bell, color: 'text-warm-500 bg-warm-100 dark:bg-warm-900/50' },
};

// =============================================================================
// Helper Functions
// =============================================================================

function getNotificationMessage(
  category: InboxCategory,
  actorName: string
): string {
  switch (category) {
    case 'FOLLOW':
      return `${actorName}님이 팔로우했습니다`;
    case 'MENTION':
      return `${actorName}님이 회원님을 언급했습니다`;
    case 'LIKE':
      return `${actorName}님이 게시물을 좋아합니다`;
    case 'REPOST':
      return `${actorName}님이 리포스트했습니다`;
    case 'REPLY':
      return `${actorName}님이 댓글을 남겼습니다`;
    case 'DM':
      return `${actorName}님이 메시지를 보냈습니다`;
    default:
      return `${actorName}님의 활동`;
  }
}

function getNotificationLink(
  category: InboxCategory,
  actorUsername: string | null,
  actorId: string,
  objectId: string | null
): string {
  switch (category) {
    case 'FOLLOW':
      return `/profile/${actorUsername || actorId}`;
    case 'DM':
      return `/messages/${actorId}`;
    case 'LIKE':
    case 'REPLY':
    case 'MENTION':
    case 'REPOST':
      // Link to post detail page if objectId exists
      return objectId ? `/post/${objectId}` : '/';
    case 'EVENT':
      // Could link to event page - for now go to events list
      return '/events';
    default:
      return '/';
  }
}

// =============================================================================
// Page Component
// =============================================================================

export default function NotificationsPage() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView();

  const utils = trpc.useUtils();

  // Query notifications
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = trpc.inbox.list.useInfiniteQuery(
    {
      category: activeCategory,
      unreadOnly: showUnreadOnly,
      limit: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // Query unread counts
  const { data: unreadCounts } = trpc.inbox.unreadCount.useQuery();

  // Mutations
  const markReadMutation = trpc.inbox.markRead.useMutation({
    onSuccess: () => {
      utils.inbox.list.invalidate();
      utils.inbox.unreadCount.invalidate();
    },
  });
  const markAllReadMutation = trpc.inbox.markAllRead.useMutation({
    onSuccess: () => {
      utils.inbox.list.invalidate();
      utils.inbox.unreadCount.invalidate();
    },
  });
  const deleteMutation = trpc.inbox.delete.useMutation({
    onSuccess: () => {
      utils.inbox.list.invalidate();
      utils.inbox.unreadCount.invalidate();
    },
  });

  // Flatten pages
  const notifications = data?.pages.flatMap((page) => page.items) ?? [];

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handlers
  const handleMarkRead = useCallback(
    (id: string) => {
      markReadMutation.mutate({ ids: [id] });
    },
    [markReadMutation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate({ id });
    },
    [deleteMutation]
  );

  const handleMarkAllRead = useCallback(() => {
    markAllReadMutation.mutate({ category: activeCategory });
  }, [markAllReadMutation, activeCategory]);

  // Get count for category
  const getCountForCategory = (category: FilterCategory): number => {
    if (!unreadCounts) return 0;
    switch (category) {
      case 'mentions':
        return unreadCounts.mentions;
      case 'likes':
        return unreadCounts.likes;
      case 'follows':
        return unreadCounts.follows;
      case 'reposts':
        return unreadCounts.reposts;
      case 'replies':
        return unreadCounts.replies;
      case 'all':
        return unreadCounts.total;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-forest-950">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-cream-50/95 dark:bg-forest-950/95 backdrop-blur-sm border-b border-warm-200/60 dark:border-forest-800/60">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-forest-800 dark:text-cream-100 font-korean">
              알림
            </h1>
            <div className="flex items-center gap-2">
              {unreadCounts && unreadCounts.total > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={markAllReadMutation.isPending}
                  className="text-forest-600 dark:text-forest-400"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  <span className="font-korean">모두 읽음</span>
                </Button>
              )}
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile/settings">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
            {FILTER_TABS.map((tab) => {
              const count = getCountForCategory(tab.id);
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                    activeCategory === tab.id
                      ? 'bg-forest-600 text-white'
                      : 'bg-warm-100 dark:bg-forest-800 text-warm-600 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-forest-700'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-korean">{tab.label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        'min-w-[1.25rem] px-1 py-0.5 rounded-full text-xs',
                        activeCategory === tab.id
                          ? 'bg-white/20'
                          : 'bg-accent-500 text-white'
                      )}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Unread only filter */}
          <div className="px-4 py-2 border-t border-warm-100 dark:border-forest-800">
            <label className="flex items-center gap-2 text-sm text-warm-600 dark:text-warm-400">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="rounded border-warm-300 dark:border-forest-600 text-forest-600 focus:ring-forest-500"
              />
              <span className="font-korean">읽지 않은 알림만</span>
            </label>
          </div>
        </header>

        {/* Notification list */}
        <main className="divide-y divide-warm-100 dark:divide-forest-800">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-forest-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-warm-500 dark:text-warm-400">
              <Bell className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium font-korean">알림이 없습니다</p>
              <p className="text-sm font-korean">
                {showUnreadOnly
                  ? '읽지 않은 알림이 없습니다'
                  : '새로운 알림이 도착하면 여기에 표시됩니다'}
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => {
                const config = CATEGORY_CONFIG[notification.category] || {
                  icon: Bell,
                  color: 'text-warm-500 bg-warm-100 dark:bg-warm-800',
                };
                const Icon = config.icon;
                const actorName =
                  notification.activity.actor.name ||
                  notification.activity.actor.username ||
                  '익명';
                const message = getNotificationMessage(
                  notification.category,
                  actorName
                );
                const href = getNotificationLink(
                  notification.category,
                  notification.activity.actor.username,
                  notification.activity.actor.id,
                  notification.activity.objectId
                );

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'relative flex items-start gap-3 p-4 hover:bg-warm-50 dark:hover:bg-forest-900/50 transition-colors group',
                      !notification.read && 'bg-forest-50/50 dark:bg-forest-900/30'
                    )}
                  >
                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent-500" />
                    )}

                    {/* Icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                        config.color
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <Link href={href} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {notification.activity.actor.image && (
                          <Image
                            src={notification.activity.actor.image}
                            alt={actorName}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        )}
                        <p className="text-sm font-medium text-forest-800 dark:text-cream-100 hover:text-forest-600 dark:hover:text-forest-300 font-korean">
                          {message}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-warm-500 dark:text-warm-400">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                    </Link>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(notification.id)}
                          className="p-1.5 text-forest-600 hover:bg-forest-100 dark:hover:bg-forest-800 rounded-lg transition-colors"
                          title="읽음으로 표시"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(notification.id)}
                        className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Load more trigger */}
              <div ref={loadMoreRef} className="h-4" />

              {/* Loading more indicator */}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-forest-500" />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
