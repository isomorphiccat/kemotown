'use client';

/**
 * MessageBubble Component
 * Displays a single message in a conversation
 */

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DMMessage } from '@/types/dm';
import { getParticipantDisplayName, getParticipantInitials } from '@/types/dm';

interface MessageBubbleProps {
  message: DMMessage;
  showAvatar?: boolean;
  className?: string;
}

export function MessageBubble({
  message,
  showAvatar = true,
  className,
}: MessageBubbleProps) {
  const { content, published, isFromMe, read, sender, attachments } = message;

  return (
    <div
      className={cn(
        'flex gap-3',
        isFromMe ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {/* Avatar */}
      {showAvatar && !isFromMe && (
        <div className="flex-shrink-0">
          {sender.avatarUrl ? (
            <Image
              src={sender.avatarUrl}
              alt={getParticipantDisplayName(sender)}
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-forest flex items-center justify-center text-white font-semibold text-sm">
              {getParticipantInitials(sender)}
            </div>
          )}
        </div>
      )}

      {/* Message content */}
      <div
        className={cn(
          'max-w-[70%] flex flex-col gap-1',
          isFromMe ? 'items-end' : 'items-start'
        )}
      >
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="rounded-xl overflow-hidden bg-warm-100 dark:bg-forest-800"
              >
                {attachment.type === 'IMAGE' && (
                  <Image
                    src={attachment.thumbnailUrl || attachment.url}
                    alt={attachment.alt || '첨부 이미지'}
                    width={200}
                    height={150}
                    className="max-w-[200px] h-auto object-cover"
                    unoptimized
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Text bubble */}
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl',
            isFromMe
              ? 'bg-forest-600 text-white rounded-br-md'
              : 'bg-white dark:bg-forest-800 text-forest-800 dark:text-cream-100 border border-warm-200/60 dark:border-forest-700/60 rounded-bl-md'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        </div>

        {/* Timestamp and read status */}
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs text-warm-400 dark:text-warm-500',
            isFromMe ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <time
            dateTime={new Date(published).toISOString()}
            title={new Date(published).toLocaleString('ko-KR')}
          >
            {formatDistanceToNow(new Date(published), {
              addSuffix: true,
              locale: ko,
            })}
          </time>
          {isFromMe && (
            <span className={cn(read ? 'text-forest-500' : 'text-warm-400')}>
              {read ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Spacer for alignment when no avatar */}
      {showAvatar && isFromMe && <div className="w-9 flex-shrink-0" />}
    </div>
  );
}
