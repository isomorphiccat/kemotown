'use client';

/**
 * GroupRules Component
 * Displays group rules and posting guidelines
 */

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupRulesProps {
  pinnedRules?: string;
  postingGuidelines?: string;
  className?: string;
}

export function GroupRules({
  pinnedRules,
  postingGuidelines,
  className,
}: GroupRulesProps) {
  const [showGuidelines, setShowGuidelines] = useState(false);

  if (!pinnedRules && !postingGuidelines) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="font-semibold text-forest-800 dark:text-cream-100 flex items-center gap-2">
        <BookOpen className="w-4 h-4" />
        그룹 규칙
      </h3>

      {/* Pinned Rules (always visible) */}
      {pinnedRules && (
        <div className="p-3 bg-forest-50 dark:bg-forest-900/30 rounded-lg border border-forest-200 dark:border-forest-800/40">
          <div className="text-sm text-forest-700 dark:text-forest-300 whitespace-pre-wrap">
            {pinnedRules}
          </div>
        </div>
      )}

      {/* Posting Guidelines (collapsible) */}
      {postingGuidelines && (
        <div>
          <button
            type="button"
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="w-full flex items-center justify-between py-2 text-sm font-medium text-forest-600 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 transition-colors"
          >
            <span>게시 가이드라인</span>
            {showGuidelines ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showGuidelines && (
            <div className="p-3 bg-warm-50 dark:bg-forest-900/20 rounded-lg text-sm text-warm-600 dark:text-warm-400 whitespace-pre-wrap">
              {postingGuidelines}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
