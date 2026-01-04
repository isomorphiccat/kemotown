'use client';

/**
 * Groups Page Client Component
 * Displays a list of Group-type contexts with filtering
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Users, Search, Plus, Loader2, Shield } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import type { GroupPluginData } from '@/lib/plugins/group/schema';

interface GroupsPageClientProps {
  currentUserId?: string;
}

export function GroupsPageClient({ currentUserId }: GroupsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch groups (Group-type contexts)
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.context.list.useInfiniteQuery(
    {
      type: 'GROUP',
      visibility: 'PUBLIC',
      search: searchQuery || undefined,
      limit: 12,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const groups = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-forest-800 dark:text-cream-100 font-korean">
            그룹
          </h1>
          <p className="text-warm-600 dark:text-warm-400 mt-1 font-korean">
            관심사가 비슷한 사람들과 함께하세요
          </p>
        </div>

        {currentUserId && (
          <Link
            href="/groups/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-medium rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-korean">그룹 만들기</span>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
        <input
          type="text"
          placeholder="그룹 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-forest-900 border border-warm-200 dark:border-forest-700 rounded-xl text-forest-800 dark:text-cream-100 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent font-korean"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-forest-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && groups.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-16 h-16 mx-auto mb-4 text-warm-300 dark:text-warm-600" />
          <h2 className="text-xl font-bold text-forest-800 dark:text-cream-100 mb-2 font-korean">
            {searchQuery ? '검색 결과가 없습니다' : '아직 그룹이 없습니다'}
          </h2>
          <p className="text-warm-600 dark:text-warm-400 mb-6 font-korean">
            {searchQuery
              ? '다른 검색어를 시도해보세요'
              : '첫 번째 그룹을 만들어보세요!'}
          </p>
          {currentUserId && !searchQuery && (
            <Link
              href="/groups/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-forest-600 hover:bg-forest-700 text-white font-medium rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-korean">그룹 만들기</span>
            </Link>
          )}
        </div>
      )}

      {/* Groups Grid */}
      {groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const groupData = (group.plugins as Record<string, unknown>)?.group as GroupPluginData | undefined;
            const tags = groupData?.tags || [];

            return (
              <Link
                key={group.id}
                href={`/c/${group.slug}`}
                className="group block bg-white dark:bg-forest-900/60 rounded-2xl border border-warm-200/60 dark:border-forest-800/60 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                {/* Banner / Avatar Section */}
                <div className="relative h-32 bg-gradient-to-br from-forest-100 to-cream-100 dark:from-forest-800 dark:to-forest-900">
                  {group.bannerUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={group.bannerUrl}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Avatar */}
                  <div className="absolute -bottom-8 left-4">
                    <div className="w-16 h-16 rounded-xl bg-white dark:bg-forest-900 border-4 border-white dark:border-forest-900 overflow-hidden shadow-lg">
                      {group.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={group.avatarUrl}
                          alt={group.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center">
                          <Users className="w-8 h-8 text-forest-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-10 px-4 pb-4">
                  <h3 className="font-bold text-lg text-forest-800 dark:text-cream-100 group-hover:text-forest-600 dark:group-hover:text-forest-400 transition-colors line-clamp-1 font-korean">
                    {group.name}
                  </h3>

                  {group.description && (
                    <p className="text-sm text-warm-600 dark:text-warm-400 mt-1 line-clamp-2 font-korean">
                      {group.description}
                    </p>
                  )}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-forest-100 dark:bg-forest-800 text-forest-600 dark:text-forest-400 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-warm-500">
                          +{tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-warm-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{group._count?.memberships || 0}명</span>
                    </div>
                    {group.joinPolicy !== 'OPEN' && (
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        <span className="font-korean">승인 필요</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="h-4 mt-8" />

      {/* Loading More */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-forest-500" />
        </div>
      )}
    </div>
  );
}
