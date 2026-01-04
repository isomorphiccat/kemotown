'use client';

/**
 * ReactionBar Component
 * Displays and handles reactions to timeline posts
 */

import { useState } from 'react';
import { REACTION_EMOJI_MAP, type ReactionType } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    username: string;
  };
}

interface ReactionBarProps {
  reactions: Reaction[];
  currentUserId?: string;
  onAddReaction: (emoji: ReactionType) => void;
  onRemoveReaction: (emoji: ReactionType) => void;
  className?: string;
}

export function ReactionBar({
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  className,
}: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Group reactions by emoji
  const reactionGroups = reactions.reduce(
    (acc, reaction) => {
      const emoji = reaction.emoji as ReactionType;
      if (!acc[emoji]) {
        acc[emoji] = [];
      }
      acc[emoji].push(reaction);
      return acc;
    },
    {} as Record<ReactionType, Reaction[]>
  );

  // Check if current user has reacted with specific emoji
  const hasUserReacted = (emoji: ReactionType) => {
    return reactions.some(
      (r) => r.emoji === emoji && r.userId === currentUserId
    );
  };

  const handleReactionClick = (emoji: ReactionType) => {
    if (hasUserReacted(emoji)) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
    setShowPicker(false);
  };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* Display reaction groups */}
      {Object.entries(reactionGroups).map(([emoji, reactionList]) => {
        const reactionEmoji = emoji as ReactionType;
        const userReacted = hasUserReacted(reactionEmoji);
        const emojiDisplay = REACTION_EMOJI_MAP[reactionEmoji];

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => handleReactionClick(reactionEmoji)}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors',
              userReacted
                ? 'bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300 border border-forest-300 dark:border-forest-600'
                : 'bg-warm-100 dark:bg-forest-800/60 text-warm-700 dark:text-warm-300 border border-warm-200 dark:border-forest-700 hover:bg-warm-200 dark:hover:bg-forest-700'
            )}
            title={reactionList
              .map((r) => r.user.username)
              .join(', ')}
          >
            <span>{emojiDisplay}</span>
            <span className="text-xs font-medium">{reactionList.length}</span>
          </button>
        );
      })}

      {/* Add reaction button */}
      {currentUserId && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-warm-100 dark:bg-forest-800/60 text-warm-600 dark:text-warm-400 border border-warm-200 dark:border-forest-700 hover:bg-warm-200 dark:hover:bg-forest-700 transition-colors"
            aria-label="반응 추가"
          >
            <span>➕</span>
          </button>

          {showPicker && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowPicker(false)}
              />

              {/* Picker */}
              <div className="absolute left-0 mt-1 p-2 bg-cream-50 dark:bg-forest-900 rounded-xl shadow-lg border border-warm-200/60 dark:border-forest-700 z-20 flex gap-1">
                {Object.entries(REACTION_EMOJI_MAP).map(([key, emoji]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleReactionClick(key as ReactionType)}
                    className={cn(
                      'w-8 h-8 rounded-lg hover:bg-warm-100 dark:hover:bg-forest-800 transition-colors text-lg',
                      hasUserReacted(key as ReactionType) && 'bg-forest-100 dark:bg-forest-800'
                    )}
                    title={key}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
