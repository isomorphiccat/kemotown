'use client';

/**
 * PostForm Component
 * Form for creating and editing timeline posts
 */

import { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { MAX_POST_LENGTH } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface PostFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  initialContent?: string;
  submitLabel?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export function PostForm({
  onSubmit,
  placeholder = '무슨 일이 일어나고 있나요?',
  initialContent = '',
  submitLabel = '게시',
  onCancel,
  autoFocus = false,
  className,
}: PostFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent || isSubmitting) return;

    if (trimmedContent.length > MAX_POST_LENGTH) {
      alert(`게시물은 최대 ${MAX_POST_LENGTH}자까지 작성할 수 있습니다.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedContent);
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to submit post:', error);
      alert('게시물 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = MAX_POST_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars <= 50 && remainingChars >= 0;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('bg-cream-50/80 dark:bg-forest-900/60 backdrop-blur-sm rounded-2xl border border-warm-200/60 dark:border-forest-800/60 p-4', className)}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none border-0 bg-transparent focus:ring-0 focus:outline-none text-forest-800 dark:text-cream-100 placeholder-warm-400 dark:placeholder-warm-500 font-korean"
        rows={3}
        disabled={isSubmitting}
      />

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-warm-200/60 dark:border-forest-800/60">
        <div className="flex items-center gap-2">
          {/* Character count */}
          <span
            className={cn(
              'text-sm tabular-nums',
              isOverLimit
                ? 'text-red-600 dark:text-red-400 font-medium'
                : isNearLimit
                  ? 'text-accent-500 dark:text-accent-400'
                  : 'text-warm-400 dark:text-warm-500'
            )}
          >
            {remainingChars}
          </span>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!content.trim() || isOverLimit || isSubmitting}
          className={cn(
            'px-4 py-2 rounded-xl font-medium text-white transition-all flex items-center gap-2 font-korean',
            !content.trim() || isOverLimit || isSubmitting
              ? 'bg-warm-300 dark:bg-forest-700 cursor-not-allowed'
              : 'bg-forest-600 hover:bg-forest-700 shadow-sm hover:shadow-md'
          )}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>게시 중...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
