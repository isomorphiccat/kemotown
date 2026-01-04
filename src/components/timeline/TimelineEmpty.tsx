'use client';

/**
 * TimelineEmpty Component
 * Empty state UI for different timeline types
 */

import { Calendar, Home, MessageCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineEmptyProps {
  /** Timeline type to show appropriate empty state */
  type: 'public' | 'home' | 'context' | 'user';
  /** Additional CSS classes */
  className?: string;
}

const emptyStates = {
  public: {
    icon: MessageCircle,
    title: '아직 게시물이 없습니다',
    description: '첫 번째 게시물을 작성해 보세요!',
  },
  home: {
    icon: Home,
    title: '홈 타임라인이 비어있습니다',
    description: '관심있는 사용자나 그룹을 팔로우해보세요.',
  },
  context: {
    icon: Users,
    title: '아직 활동이 없습니다',
    description: '이 공간에 첫 게시물을 남겨보세요!',
  },
  user: {
    icon: Calendar,
    title: '게시물이 없습니다',
    description: '아직 작성된 게시물이 없습니다.',
  },
};

export function TimelineEmpty({ type, className }: TimelineEmptyProps) {
  const state = emptyStates[type];
  const Icon = state.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-warm-100 dark:bg-warm-800 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-warm-400 dark:text-warm-500" />
      </div>
      <h3 className="text-lg font-bold text-warm-800 dark:text-warm-200 mb-2">
        {state.title}
      </h3>
      <p className="text-sm text-warm-500 dark:text-warm-400 max-w-xs">
        {state.description}
      </p>
    </div>
  );
}
