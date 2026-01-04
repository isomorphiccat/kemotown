'use client';

/**
 * NotificationList Component
 * Displays list of notifications with actions using inbox router
 */

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import {
  Check,
  Trash2,
  X,
  Heart,
  UserPlus,
  AtSign,
  Repeat2,
  MessageCircle,
  Bell,
  Loader2,
} from 'lucide-react';
import { InboxCategory } from '@prisma/client';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface NotificationListProps {
  onClose?: () => void;
  limit?: number;
}

// Category icons
const CATEGORY_ICONS: Record<InboxCategory, React.ComponentType<{ className?: string }>> = {
  DEFAULT: Bell,
  FOLLOW: UserPlus,
  MENTION: AtSign,
  LIKE: Heart,
  REPOST: Repeat2,
  REPLY: MessageCircle,
  DM: MessageCircle,
  EVENT: Bell,
  GROUP: Bell,
  SYSTEM: Bell,
};

// Category colors
const CATEGORY_COLORS: Record<InboxCategory, string> = {
  DEFAULT: 'text-warm-500',
  FOLLOW: 'text-blue-500',
  MENTION: 'text-purple-500',
  LIKE: 'text-red-500',
  REPOST: 'text-green-500',
  REPLY: 'text-amber-500',
  DM: 'text-forest-500',
  EVENT: 'text-accent-500',
  GROUP: 'text-forest-500',
  SYSTEM: 'text-warm-500',
};

// Get notification message
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

// Get link for notification
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
    default:
      return objectId ? `/post/${objectId}` : '/notifications';
  }
}

export function NotificationList({ onClose, limit = 20 }: NotificationListProps) {
  const utils = trpc.useUtils();

  // Fetch notifications using inbox router
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.inbox.list.useInfiniteQuery(
      {
        category: 'all',
        limit,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  // Mark as read mutation
  const markReadMutation = trpc.inbox.markRead.useMutation({
    onSuccess: () => {
      utils.inbox.list.invalidate();
      utils.inbox.unreadCount.invalidate();
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = trpc.inbox.markAllRead.useMutation({
    onSuccess: () => {
      utils.inbox.list.invalidate();
      utils.inbox.unreadCount.invalidate();
    },
  });

  // Delete notification mutation
  const deleteMutation = trpc.inbox.delete.useMutation({
    onSuccess: () => {
      utils.inbox.list.invalidate();
      utils.inbox.unreadCount.invalidate();
    },
  });

  const notifications = data?.pages.flatMap((page) => page.items) ?? [];
  const hasUnread = notifications.some((n) => !n.read);

  const handleMarkAsRead = (id: string) => {
    markReadMutation.mutate({ ids: [id] });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  return (
    <div className="flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-warm-200 dark:border-forest-800">
        <h3 className="text-lg font-semibold text-forest-800 dark:text-cream-100 font-korean">알림</h3>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate({})}
              disabled={markAllReadMutation.isPending}
              className="text-sm text-forest-600 hover:text-forest-700 dark:text-forest-400 font-medium font-korean"
            >
              모두 읽음
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 rounded"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-forest-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-warm-500 dark:text-warm-400">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-korean">알림이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-warm-100 dark:divide-forest-800">
            {notifications.map((notification) => {
              const Icon = CATEGORY_ICONS[notification.category] || Bell;
              const iconColor = CATEGORY_COLORS[notification.category] || 'text-warm-500';
              const actorName = notification.activity.actor.name || notification.activity.actor.username || '익명';
              const message = getNotificationMessage(notification.category, actorName);
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
                    'p-4 hover:bg-warm-50 dark:hover:bg-forest-900/50 transition-colors',
                    !notification.read && 'bg-forest-50/50 dark:bg-forest-900/30'
                  )}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={cn('flex-shrink-0 mt-1', iconColor)}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <Link href={href} className="flex-1 min-w-0 group">
                      <div className="flex items-center gap-2">
                        {notification.activity.actor.image && (
                          <Image
                            src={notification.activity.actor.image}
                            alt={actorName}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                        )}
                        <p className="text-sm font-medium text-forest-800 dark:text-cream-100 group-hover:text-forest-600 dark:group-hover:text-forest-300 font-korean">
                          {message}
                        </p>
                      </div>
                      <p className="text-xs text-warm-500 dark:text-warm-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                    </Link>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-start gap-1">
                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 text-forest-600 hover:bg-forest-100 dark:hover:bg-forest-800 rounded transition-colors"
                          title="읽음으로 표시"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(notification.id)}
                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {hasNextPage && (
          <div className="p-4 text-center border-t border-warm-100 dark:border-forest-800">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm text-forest-600 hover:text-forest-700 dark:text-forest-400 font-medium font-korean"
            >
              {isFetchingNextPage ? (
                <Loader2 className="w-4 h-4 animate-spin inline" />
              ) : (
                '더 보기'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Link to full notifications page */}
      <div className="p-3 border-t border-warm-200 dark:border-forest-800 bg-warm-50 dark:bg-forest-900/50">
        <Link
          href="/notifications"
          className="block w-full text-sm text-center text-forest-600 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 font-medium font-korean"
          onClick={onClose}
        >
          모든 알림 보기
        </Link>
      </div>
    </div>
  );
}
