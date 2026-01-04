'use client';

/**
 * PollCard Component
 * Displays a poll with voting functionality
 */

import { useState } from 'react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import { BarChart2, Check, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface PollOption {
  index: number;
  text: string;
  votes: number;
}

interface PollData {
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  endsAt?: string;
  votes: Record<string, number[]>;
}

interface PollCardProps {
  pollId: string;
  contextId: string;
  pollData: PollData;
  currentUserId?: string;
  className?: string;
}

export function PollCard({
  pollId,
  contextId,
  pollData,
  currentUserId,
  className,
}: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(
    currentUserId ? (pollData.votes[currentUserId] ?? []) : []
  );
  const [isVoting, setIsVoting] = useState(false);

  const utils = trpc.useUtils();

  const voteMutation = trpc.groupPlugin.votePoll.useMutation({
    onSuccess: () => {
      utils.activity.getById.invalidate({ activityId: pollId });
    },
  });

  const totalVotes = pollData.options.reduce((sum, opt) => sum + opt.votes, 0);
  const hasEnded = pollData.endsAt ? isPast(new Date(pollData.endsAt)) : false;
  const hasVoted = currentUserId && pollData.votes[currentUserId];

  const handleOptionClick = (index: number) => {
    if (hasEnded || !currentUserId) return;

    if (pollData.allowMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setSelectedOptions([index]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0 || !currentUserId) return;
    setIsVoting(true);

    try {
      await voteMutation.mutateAsync({
        pollId,
        contextId,
        optionIndices: selectedOptions,
      });
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div
      className={cn(
        'p-4 bg-warm-50 dark:bg-forest-900/30 rounded-xl border border-warm-200 dark:border-forest-800',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-forest-100 dark:bg-forest-800 flex items-center justify-center shrink-0">
          <BarChart2 className="w-5 h-5 text-forest-600 dark:text-forest-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-forest-800 dark:text-cream-100">
            {pollData.question}
          </h4>
          {pollData.endsAt && (
            <p className="text-xs text-warm-500 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {hasEnded
                ? '종료됨'
                : `${formatDistanceToNow(new Date(pollData.endsAt), { locale: ko })} 후 종료`}
            </p>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {pollData.options.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const isSelected = selectedOptions.includes(option.index);
          const showResults = hasVoted || hasEnded;

          return (
            <button
              key={option.index}
              type="button"
              onClick={() => handleOptionClick(option.index)}
              disabled={hasEnded || !currentUserId}
              className={cn(
                'relative w-full p-3 rounded-lg text-left transition-all overflow-hidden',
                showResults
                  ? 'bg-card'
                  : 'bg-card hover:bg-warm-100 dark:hover:bg-forest-800',
                isSelected && !showResults && 'ring-2 ring-forest-500',
                (hasEnded || !currentUserId) && 'cursor-default'
              )}
            >
              {/* Progress Bar */}
              {showResults && (
                <div
                  className="absolute inset-y-0 left-0 bg-forest-100 dark:bg-forest-800/50 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Content */}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showResults && isSelected && (
                    <Check className="w-4 h-4 text-forest-600" />
                  )}
                  <span
                    className={cn(
                      'text-sm',
                      isSelected
                        ? 'font-medium text-forest-700 dark:text-forest-300'
                        : 'text-forest-600 dark:text-forest-400'
                    )}
                  >
                    {option.text}
                  </span>
                </div>
                {showResults && (
                  <span className="text-sm font-medium text-warm-500">
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Vote Button */}
      {!hasVoted && !hasEnded && currentUserId && (
        <Button
          onClick={handleVote}
          disabled={selectedOptions.length === 0 || isVoting}
          className="w-full"
        >
          {isVoting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>투표하기</>
          )}
        </Button>
      )}

      {/* Vote Count */}
      <div className="mt-3 text-center text-xs text-warm-500">
        {totalVotes}명 투표
        {pollData.allowMultiple && ' (복수 선택 가능)'}
      </div>
    </div>
  );
}
