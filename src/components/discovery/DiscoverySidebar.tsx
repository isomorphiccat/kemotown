'use client';

/**
 * DiscoverySidebar Component
 * Sidebar section with suggested users and contexts
 */

import Link from 'next/link';
import { Sparkles, Users, Calendar, ChevronRight } from 'lucide-react';
import { ContextCard } from '@/components/context';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface DiscoverySidebarProps {
  /** Current user ID */
  currentUserId?: string;
  /** Show suggested contexts section */
  showContexts?: boolean;
  /** Number of suggestions to show */
  limit?: number;
  /** Additional CSS classes */
  className?: string;
}

export function DiscoverySidebar({
  showContexts = true,
  limit = 3,
  className,
}: DiscoverySidebarProps) {
  // Fetch suggested contexts
  const { data: suggestedContexts, isLoading: loadingContexts } = trpc.context.list.useQuery(
    { limit, visibility: 'PUBLIC' },
    { enabled: showContexts }
  );

  // Fetch suggested users (would need a user router endpoint)
  // For now we'll just show the contexts section
  const hasContexts = suggestedContexts && suggestedContexts.items.length > 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Quick Links */}
      <div className="card-elevated p-5">
        <h3 className="font-semibold text-forest-800 dark:text-cream-100 flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-accent-500" />
          둘러보기
        </h3>

        <div className="space-y-1">
          <Link
            href="/events"
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-warm-50 dark:hover:bg-forest-900/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-forest-100 dark:bg-forest-800 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-forest-600 dark:text-forest-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-forest-800 dark:text-cream-100 text-sm">
                이벤트
              </p>
              <p className="text-xs text-warm-500">다가오는 행사 보기</p>
            </div>
            <ChevronRight className="w-4 h-4 text-warm-400" />
          </Link>

          <Link
            href="/users"
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-warm-50 dark:hover:bg-forest-900/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-forest-800 dark:text-cream-100 text-sm">
                멤버
              </p>
              <p className="text-xs text-warm-500">커뮤니티 멤버 찾기</p>
            </div>
            <ChevronRight className="w-4 h-4 text-warm-400" />
          </Link>
        </div>
      </div>

      {/* Suggested Contexts */}
      {showContexts && (
        <div className="card-elevated p-5">
          <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-4">
            추천 공간
          </h3>

          {loadingContexts ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-warm-100 dark:bg-forest-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : hasContexts ? (
            <div className="space-y-2">
              {suggestedContexts.items.map((context) => (
                <ContextCard key={context.id} context={context} compact />
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-500 text-center py-4">
              추천할 공간이 없습니다
            </p>
          )}
        </div>
      )}

      {/* Footer Links */}
      <div className="text-xs text-warm-400 space-y-2 px-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/privacy" className="hover:text-forest-600 transition-colors">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="hover:text-forest-600 transition-colors">
            이용약관
          </Link>
          <Link href="/faq" className="hover:text-forest-600 transition-colors">
            FAQ
          </Link>
        </div>
        <p className="text-warm-300">© 2024 Kemotown</p>
      </div>
    </div>
  );
}
