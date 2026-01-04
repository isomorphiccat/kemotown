'use client';

/**
 * ChatView Component
 * Full conversation view with messages and input
 */

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import type { DMParticipant, DMMessage } from '@/types/dm';
import { getParticipantDisplayName, getParticipantInitials } from '@/types/dm';

interface ChatViewProps {
  participantId: string;
  participant?: DMParticipant;
  className?: string;
}

export function ChatView({
  participantId,
  participant: initialParticipant,
  className,
}: ChatViewProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch conversation
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.dm.getConversation.useInfiniteQuery(
    { userId: participantId, limit: 30 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // Fetch participant info if not provided
  const { data: participantData } = trpc.user.getById.useQuery(
    { userId: participantId },
    { enabled: !initialParticipant }
  );

  const participant = initialParticipant || participantData;

  // Send message mutation
  const sendMutation = trpc.dm.send.useMutation({
    onSuccess: () => {
      utils.dm.getConversation.invalidate({ userId: participantId });
      utils.dm.listConversations.invalidate();
      scrollToBottom();
    },
  });

  // Mark conversation as read
  const markReadMutation = trpc.dm.markRead.useMutation({
    onSuccess: () => {
      utils.dm.unreadCount.invalidate();
      utils.dm.listConversations.invalidate();
    },
  });

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Mark as read when viewing
  useEffect(() => {
    if (participantId) {
      markReadMutation.mutate({ conversationUserId: participantId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId]);

  // Scroll to bottom on initial load
  const firstPageMessageCount = data?.pages[0]?.messages.length ?? 0;
  useEffect(() => {
    if (firstPageMessageCount > 0) {
      scrollToBottom();
    }
  }, [firstPageMessageCount, scrollToBottom]);

  // Handle scroll to load more
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Load more when near top
    if (container.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      const scrollHeight = container.scrollHeight;
      fetchNextPage().then(() => {
        // Maintain scroll position after loading
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - scrollHeight;
        });
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle send message
  const handleSend = async (content: string) => {
    await sendMutation.mutateAsync({
      recipientId: participantId,
      content,
    });
  };

  // Flatten and reverse messages (oldest first in display)
  const messages: DMMessage[] = (
    data?.pages.flatMap((page) => page.messages) ?? []
  ).reverse() as DMMessage[];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-cream-50/80 dark:bg-forest-900/80 backdrop-blur-sm border-b border-warm-200/60 dark:border-forest-800/60">
        <button
          type="button"
          onClick={() => router.push('/messages')}
          className="p-2 -ml-2 rounded-xl text-warm-500 hover:text-forest-600 dark:hover:text-forest-400 hover:bg-warm-100 dark:hover:bg-forest-800 transition-colors"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {participant && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {participant.avatarUrl ? (
              <Image
                src={participant.avatarUrl}
                alt={getParticipantDisplayName(participant)}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-forest flex items-center justify-center text-white font-semibold">
                {getParticipantInitials(participant)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-forest-800 dark:text-cream-100 truncate">
                {getParticipantDisplayName(participant)}
              </p>
              {participant.username && (
                <p className="text-sm text-warm-500 dark:text-warm-400 truncate">
                  @{participant.username}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {/* Load more indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <RefreshCw className="w-5 h-5 text-warm-400 animate-spin" />
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="spinner w-8 h-8" />
            <p className="text-warm-500 dark:text-warm-400 text-sm font-korean">
              메시지를 불러오는 중...
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
              메시지를 불러오는데 실패했습니다
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4 font-korean">
              {error instanceof Error ? error.message : '알 수 없는 오류'}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-forest-100 dark:bg-forest-800 flex items-center justify-center mb-4">
              <svg
                className="w-7 h-7 text-forest-500 dark:text-forest-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-forest-800 dark:text-cream-50 mb-2 font-korean">
              아직 메시지가 없습니다
            </h3>
            <p className="text-sm text-warm-500 dark:text-warm-400 font-korean">
              첫 메시지를 보내보세요!
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => {
          // Show avatar for first message or when sender changes
          const prevMessage = messages[index - 1];
          const showAvatar =
            !message.isFromMe &&
            (!prevMessage ||
              prevMessage.isFromMe ||
              prevMessage.sender.id !== message.sender.id);

          return (
            <MessageBubble
              key={message.id}
              message={message}
              showAvatar={showAvatar}
            />
          );
        })}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <MessageInput
        onSend={handleSend}
        disabled={sendMutation.isPending}
      />
    </div>
  );
}
