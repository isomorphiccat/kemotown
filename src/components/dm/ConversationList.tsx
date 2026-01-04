'use client';

/**
 * ConversationList Component
 * Lists all conversations for the current user
 */

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MessageSquare, RefreshCw, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import type { DMConversation } from '@/types/dm';
import {
  getParticipantDisplayName,
  getParticipantInitials,
  formatMessagePreview,
} from '@/types/dm';

interface ConversationListProps {
  selectedUserId?: string;
  className?: string;
}

export function ConversationList({
  selectedUserId,
  className,
}: ConversationListProps) {
  const router = useRouter();

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.dm.listConversations.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const conversations = (
    data?.pages.flatMap((page) => page.conversations) ?? []
  ) as DMConversation[];

  const handleConversationClick = (userId: string) => {
    router.push(`/messages/${userId}`);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-warm-200/60 dark:border-forest-800/60">
        <h1 className="text-xl font-bold text-forest-800 dark:text-cream-100 font-korean">
          메시지
        </h1>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="spinner w-8 h-8" />
            <p className="text-warm-500 dark:text-warm-400 text-sm font-korean">
              대화 목록을 불러오는 중...
            </p>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-red-800 dark:text-red-300 font-bold mb-2 font-korean">
              대화 목록을 불러오는데 실패했습니다
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 font-korean">
              {error instanceof Error ? error.message : '알 수 없는 오류'}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-forest-100 dark:bg-forest-800 flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-forest-500 dark:text-forest-400" />
            </div>
            <h3 className="text-lg font-bold text-forest-800 dark:text-cream-50 mb-2 font-korean">
              아직 대화가 없습니다
            </h3>
            <p className="text-sm text-warm-500 dark:text-warm-400 font-korean">
              다른 사용자에게 메시지를 보내보세요!
            </p>
          </div>
        )}

        {/* Conversation list */}
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.participant.id}
            conversation={conversation}
            isSelected={conversation.participant.id === selectedUserId}
            onClick={() => handleConversationClick(conversation.participant.id)}
          />
        ))}

        {/* Load more */}
        {hasNextPage && (
          <div className="p-4 text-center">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-4 py-2 text-sm text-forest-600 dark:text-forest-400 hover:bg-warm-100 dark:hover:bg-forest-800 rounded-xl transition-colors disabled:opacity-50 font-korean"
            >
              {isFetchingNextPage ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  불러오는 중...
                </span>
              ) : (
                '더 보기'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Conversation Item Sub-component
// =============================================================================

interface ConversationItemProps {
  conversation: DMConversation;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const { participant, lastMessage, unreadCount } = conversation;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        isSelected
          ? 'bg-forest-100 dark:bg-forest-800'
          : 'hover:bg-warm-50 dark:hover:bg-forest-900/50'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {participant.avatarUrl ? (
          <Image
            src={participant.avatarUrl}
            alt={getParticipantDisplayName(participant)}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-forest flex items-center justify-center text-white font-semibold">
            {getParticipantInitials(participant)}
          </div>
        )}

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-accent-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p
            className={cn(
              'font-semibold truncate',
              unreadCount > 0
                ? 'text-forest-800 dark:text-cream-100'
                : 'text-forest-700 dark:text-cream-200'
            )}
          >
            {getParticipantDisplayName(participant)}
          </p>
          {lastMessage && (
            <span className="text-xs text-warm-400 dark:text-warm-500 flex-shrink-0">
              {formatDistanceToNow(new Date(lastMessage.published), {
                addSuffix: false,
                locale: ko,
              })}
            </span>
          )}
        </div>

        {lastMessage && (
          <p
            className={cn(
              'text-sm truncate',
              unreadCount > 0
                ? 'text-forest-600 dark:text-cream-300 font-medium'
                : 'text-warm-500 dark:text-warm-400'
            )}
          >
            {lastMessage.isFromMe && (
              <span className="text-warm-400 dark:text-warm-500">나: </span>
            )}
            {formatMessagePreview(lastMessage.content)}
          </p>
        )}
      </div>
    </button>
  );
}
