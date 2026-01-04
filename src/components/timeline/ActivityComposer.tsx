'use client';

/**
 * ActivityComposer Component
 * Form for creating new activities (posts, replies)
 * Supports context addressing and attachment uploads
 */

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Send, ImagePlus, Loader2, Globe, Users, Lock } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ActivityComposerProps {
  /** Current user's avatar URL */
  avatarUrl?: string | null;
  /** Current user's display name */
  displayName?: string | null;
  /** Context ID if posting to a group/event */
  contextId?: string;
  /** Activity ID if replying to a post */
  inReplyTo?: string;
  /** Callback after successful post */
  onSuccess?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Compact mode for inline replies */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

type VisibilityOption = 'public' | 'followers' | 'context';

interface VisibilityConfig {
  icon: typeof Globe;
  label: string;
  description: string;
}

const visibilityOptions: Record<VisibilityOption, VisibilityConfig> = {
  public: {
    icon: Globe,
    label: '전체 공개',
    description: '모든 사용자가 볼 수 있습니다',
  },
  followers: {
    icon: Users,
    label: '팔로워만',
    description: '팔로워만 볼 수 있습니다',
  },
  context: {
    icon: Lock,
    label: '멤버만',
    description: '이 공간의 멤버만 볼 수 있습니다',
  },
};

export function ActivityComposer({
  avatarUrl,
  displayName,
  contextId,
  inReplyTo,
  onSuccess,
  placeholder = '무슨 생각을 하고 계신가요?',
  compact = false,
  className,
}: ActivityComposerProps) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<VisibilityOption>(
    contextId ? 'context' : 'public'
  );
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const utils = trpc.useUtils();

  const createNoteMutation = trpc.activity.createNote.useMutation({
    onSuccess: () => {
      setContent('');
      // Invalidate relevant timelines
      if (contextId) {
        utils.activity.contextTimeline.invalidate({ contextId });
      } else {
        utils.activity.publicTimeline.invalidate();
        utils.activity.homeTimeline.invalidate();
      }
      onSuccess?.();
    },
  });

  // Auto-resize textarea
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
    }
  }, []);

  // Build addressing based on visibility
  const getAddressing = useCallback(() => {
    if (contextId && visibility === 'context') {
      return {
        to: [`context:${contextId}`],
        cc: [] as string[],
      };
    }
    if (visibility === 'followers') {
      return {
        to: ['followers'],
        cc: [] as string[],
      };
    }
    // Public
    return {
      to: ['public'],
      cc: contextId ? [`context:${contextId}`] : ['followers'],
    };
  }, [contextId, visibility]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || createNoteMutation.isPending) return;

    const { to, cc } = getAddressing();

    await createNoteMutation.mutateAsync({
      content: content.trim(),
      to,
      cc,
      inReplyTo,
      contextId,
    });
  };

  const isValid = content.trim().length > 0 && content.length <= 2000;
  const charCount = content.length;
  const charWarning = charCount > 1800;
  const charExceeded = charCount > 2000;

  const VisibilityIcon = visibilityOptions[visibility].icon;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'bg-card rounded-xl border border-warm-200 dark:border-forest-800 transition-shadow',
        isFocused && 'shadow-medium ring-2 ring-forest-500/20',
        className
      )}
    >
      <div className={cn('flex gap-3', compact ? 'p-3' : 'p-4')}>
        {/* Avatar */}
        {!compact && (
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName || 'User'}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-forest flex items-center justify-center text-white font-semibold">
                {(displayName || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={inReplyTo ? '답글을 작성하세요...' : placeholder}
            className={cn(
              'w-full bg-transparent border-none outline-none resize-none placeholder:text-warm-400 dark:placeholder:text-warm-500',
              'text-forest-800 dark:text-cream-100',
              compact ? 'text-sm min-h-[36px]' : 'text-base min-h-[60px]'
            )}
            rows={compact ? 1 : 2}
            maxLength={2100} // Allow some overflow for visual feedback
          />

          {/* Error message */}
          {createNoteMutation.isError && (
            <p className="text-sm text-red-500 mt-2">
              {createNoteMutation.error.message || '게시물을 작성하는데 실패했습니다'}
            </p>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div
        className={cn(
          'flex items-center justify-between border-t border-warm-100 dark:border-forest-800',
          compact ? 'px-3 py-2' : 'px-4 py-3'
        )}
      >
        <div className="flex items-center gap-2">
          {/* Visibility Selector */}
          {!inReplyTo && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors',
                  'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-forest-800'
                )}
              >
                <VisibilityIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{visibilityOptions[visibility].label}</span>
              </button>

              {showVisibilityMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowVisibilityMenu(false)}
                  />
                  <div className="absolute left-0 bottom-full mb-2 w-56 bg-card rounded-xl shadow-large border border-warm-200 dark:border-forest-800 z-20 py-1 overflow-hidden">
                    {(Object.entries(visibilityOptions) as [VisibilityOption, VisibilityConfig][])
                      .filter(([key]) => key !== 'context' || contextId)
                      .map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setVisibility(key);
                              setShowVisibilityMenu(false);
                            }}
                            className={cn(
                              'w-full px-4 py-2.5 text-left flex items-start gap-3 hover:bg-warm-50 dark:hover:bg-forest-800/50 transition-colors',
                              visibility === key && 'bg-forest-50 dark:bg-forest-900/30'
                            )}
                          >
                            <Icon className="w-4 h-4 mt-0.5 shrink-0 text-warm-500" />
                            <div>
                              <p className="text-sm font-medium text-forest-800 dark:text-cream-100">
                                {config.label}
                              </p>
                              <p className="text-xs text-warm-500">{config.description}</p>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Image Upload (placeholder for future) */}
          <button
            type="button"
            disabled
            className="p-2 text-warm-400 rounded-lg opacity-50 cursor-not-allowed"
            title="이미지 업로드 (준비중)"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Character Count */}
          {content.length > 0 && (
            <span
              className={cn(
                'text-xs tabular-nums',
                charExceeded
                  ? 'text-red-500 font-medium'
                  : charWarning
                    ? 'text-yellow-500'
                    : 'text-warm-400'
              )}
            >
              {charCount}/2000
            </span>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size={compact ? 'sm' : 'default'}
            disabled={!isValid || createNoteMutation.isPending}
            className="gap-2"
          >
            {createNoteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">게시중...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{inReplyTo ? '답글' : '게시'}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
