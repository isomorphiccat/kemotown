'use client';

/**
 * Events Page Client Component
 * Displays a list of Event-type contexts with filtering
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Calendar, Search, Plus, Loader2, MapPin, Users } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { EventPluginData } from '@/lib/plugins/event/schema';

interface EventsPageClientProps {
  currentUserId?: string;
}

export function EventsPageClient({ currentUserId }: EventsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch events (Event-type contexts)
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.context.list.useInfiniteQuery(
    {
      type: 'EVENT',
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

  const events = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-forest-800 dark:text-cream-100 font-korean">
            이벤트
          </h1>
          <p className="text-warm-600 dark:text-warm-400 mt-1 font-korean">
            케모타운에서 열리는 이벤트들을 찾아보세요
          </p>
        </div>

        {currentUserId && (
          <Link
            href="/events/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-medium rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-korean">이벤트 만들기</span>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
        <input
          type="text"
          placeholder="이벤트 검색..."
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
      {!isLoading && events.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-warm-300 dark:text-warm-600" />
          <h2 className="text-xl font-bold text-forest-800 dark:text-cream-100 mb-2 font-korean">
            {searchQuery ? '검색 결과가 없습니다' : '아직 이벤트가 없습니다'}
          </h2>
          <p className="text-warm-600 dark:text-warm-400 mb-6 font-korean">
            {searchQuery
              ? '다른 검색어를 시도해보세요'
              : '첫 번째 이벤트를 만들어보세요!'}
          </p>
          {currentUserId && !searchQuery && (
            <Link
              href="/events/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-forest-600 hover:bg-forest-700 text-white font-medium rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-korean">이벤트 만들기</span>
            </Link>
          )}
        </div>
      )}

      {/* Events Grid */}
      {events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const eventData = (event.plugins as Record<string, unknown>)?.event as EventPluginData | undefined;
            const startDate = eventData?.startAt ? new Date(eventData.startAt) : null;

            return (
              <Link
                key={event.id}
                href={`/c/${event.slug}`}
                className="group block bg-white dark:bg-forest-900/60 rounded-2xl border border-warm-200/60 dark:border-forest-800/60 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                {/* Banner */}
                <div className="relative h-40 bg-gradient-to-br from-forest-100 to-cream-100 dark:from-forest-800 dark:to-forest-900">
                  {event.bannerUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.bannerUrl}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {startDate && (
                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-forest-900/90 backdrop-blur-sm rounded-xl p-2 text-center min-w-[60px]">
                      <div className="text-xs font-medium text-warm-500 uppercase">
                        {format(startDate, 'MMM', { locale: ko })}
                      </div>
                      <div className="text-2xl font-bold text-forest-700 dark:text-cream-100">
                        {format(startDate, 'd')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-forest-800 dark:text-cream-100 group-hover:text-forest-600 dark:group-hover:text-forest-400 transition-colors line-clamp-1 font-korean">
                    {event.name}
                  </h3>

                  {event.description && (
                    <p className="text-sm text-warm-600 dark:text-warm-400 mt-1 line-clamp-2 font-korean">
                      {event.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-sm text-warm-500">
                    {eventData?.location?.name && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[120px]">{eventData.location.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{event._count?.memberships || 0}명</span>
                    </div>
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
