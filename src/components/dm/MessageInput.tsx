'use client';

/**
 * MessageInput Component
 * Input field for composing and sending messages
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MessageInput({
  onSend,
  placeholder = '메시지를 입력하세요...',
  disabled = false,
  className,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [content]);

  const handleSubmit = useCallback(async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend(trimmedContent);
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [content, isSending, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        'flex items-end gap-3 p-4 bg-cream-50/80 dark:bg-forest-900/60 backdrop-blur-sm border-t border-warm-200/60 dark:border-forest-800/60',
        className
      )}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSending}
        rows={1}
        className="flex-1 resize-none bg-white dark:bg-forest-800 border border-warm-200/80 dark:border-forest-700/80 rounded-xl px-4 py-2.5 text-sm text-forest-800 dark:text-cream-100 placeholder-warm-400 dark:placeholder-warm-500 focus:outline-none focus:ring-2 focus:ring-forest-500/50 focus:border-forest-500 disabled:opacity-50 font-korean"
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!content.trim() || isSending || disabled}
        className={cn(
          'flex-shrink-0 p-2.5 rounded-xl transition-all',
          content.trim() && !isSending && !disabled
            ? 'bg-forest-600 hover:bg-forest-700 text-white shadow-sm hover:shadow-md'
            : 'bg-warm-200 dark:bg-forest-700 text-warm-400 dark:text-warm-500 cursor-not-allowed'
        )}
        aria-label="메시지 보내기"
      >
        {isSending ? (
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
