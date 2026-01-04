'use client';

/**
 * TimelinePost Component
 * Individual timeline post display with like button and actions
 * Uses ActivityPub-style Activity model
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import { MoreVertical, Trash2, Heart, MessageCircle, Repeat2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineItem, TimelineActivity } from '@/types/timeline';
import { getActivityContent } from '@/types/timeline';

interface TimelinePostProps {
  item: TimelineItem;
  currentUserId?: string;
  onDelete?: (activityId: string) => void;
  onLike: (activityId: string) => void;
  onUnlike: (activityId: string) => void;
  className?: string;
}

export function TimelinePost({
  item,
  currentUserId,
  onDelete,
  onLike,
  onUnlike,
  className,
}: TimelinePostProps) {
  const [showMenu, setShowMenu] = useState(false);

  // For reposts, show the original activity
  const displayActivity: TimelineActivity = item.originalActivity || item.activity;
  const isRepost = item.activity.type === 'ANNOUNCE' && item.originalActivity;

  const actor = displayActivity.actor;
  const isOwnPost = displayActivity.actorId === currentUserId;

  // Extract content from the object JSON field
  const content = getActivityContent(displayActivity);

  // Format content with mentions
  const formatContent = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = text.split(mentionRegex);

    return parts.map((part, index) => {
      // Odd indices are usernames from capture group
      if (index % 2 === 1) {
        return (
          <span
            key={index}
            className="text-blue-600 font-medium hover:underline cursor-pointer"
          >
            @{part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleLikeClick = () => {
    if (item.liked === true) {
      onUnlike(displayActivity.id);
    } else {
      onLike(displayActivity.id);
    }
  };

  return (
    <div
      className={cn(
        'card-elevated p-4 hover:shadow-large transition-shadow',
        className
      )}
    >
      {/* Repost indicator */}
      {isRepost && (
        <div className="flex items-center gap-2 text-warm-500 dark:text-warm-400 text-sm mb-3 -mt-1">
          <Repeat2 className="w-4 h-4" />
          <span className="font-korean">
            {item.activity.actor.displayName || item.activity.actor.username}님이 리포스트
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {actor.avatarUrl ? (
              <Image
                src={actor.avatarUrl}
                alt={actor.displayName || actor.username || 'User'}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-forest flex items-center justify-center text-white font-semibold">
                {(actor.displayName || actor.username || '?')[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Author info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-forest-800 dark:text-cream-100 truncate">
                {actor.displayName || actor.username}
              </p>
              {displayActivity.actorType === 'BOT' && (
                <span className="px-2 py-0.5 text-xs font-medium bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300 rounded">
                  봇
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-warm-500 dark:text-warm-400">
              <span>@{actor.username}</span>
              <span>•</span>
              <time
                dateTime={new Date(displayActivity.published).toISOString()}
                title={new Date(displayActivity.published).toLocaleString('ko-KR')}
              >
                {formatDistanceToNow(new Date(displayActivity.published), {
                  addSuffix: true,
                  locale: ko,
                })}
              </time>
              {new Date(displayActivity.updated) > new Date(displayActivity.published) && (
                <>
                  <span>•</span>
                  <span className="text-xs">(수정됨)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        {isOwnPost && !isRepost && onDelete && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-warm-400 hover:text-forest-600 dark:hover:text-forest-400 rounded hover:bg-cream-50 dark:hover:bg-forest-900/50"
              aria-label="메뉴"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-40 bg-card rounded-xl shadow-large border border-warm-200 dark:border-forest-800 z-20 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('정말 삭제하시겠습니까?')) {
                        onDelete(displayActivity.id);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-forest-800 dark:text-cream-100 whitespace-pre-wrap break-words">
          {formatContent(content)}
        </p>
      </div>

      {/* Attachments */}
      {displayActivity.attachments.length > 0 && (
        <div className="mb-3 grid gap-2 grid-cols-2">
          {displayActivity.attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative rounded-xl overflow-hidden bg-warm-100 dark:bg-forest-800"
            >
              {attachment.type === 'IMAGE' && (
                <Image
                  src={attachment.thumbnailUrl || attachment.url}
                  alt={attachment.alt || '첨부 이미지'}
                  width={attachment.width || 400}
                  height={attachment.height || 300}
                  className="w-full h-auto object-cover"
                  unoptimized
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-4 pt-2 border-t border-warm-100 dark:border-forest-800">
        {/* Like button */}
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={!currentUserId}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
            item.liked === true
              ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
              : 'text-warm-500 dark:text-warm-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
            !currentUserId && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-all',
              item.liked === true && 'fill-current scale-110'
            )}
          />
          <span className="font-korean">좋아요</span>
        </button>

        {/* Reply count */}
        {displayActivity._count.replies > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-warm-500 dark:text-warm-400">
            <MessageCircle className="w-4 h-4" />
            <span>{displayActivity._count.replies}</span>
          </div>
        )}
      </div>
    </div>
  );
}
