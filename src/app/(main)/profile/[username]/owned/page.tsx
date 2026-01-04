/**
 * Owned Contexts Page
 * Display contexts (events, groups, conventions) owned by the user
 */

'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Calendar, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { EventPluginData } from '@/lib/plugins/event/schema';

interface OwnedPageProps {
  params: Promise<{ username: string }>;
}

type ContextType = 'EVENT' | 'GROUP' | 'CONVENTION';

const TYPE_LABELS: Record<ContextType | 'ALL', string> = {
  ALL: '전체',
  EVENT: '이벤트',
  GROUP: '그룹',
  CONVENTION: '컨벤션',
};

const TYPE_ICONS: Record<ContextType, typeof Calendar | typeof Users> = {
  EVENT: Calendar,
  GROUP: Users,
  CONVENTION: Calendar,
};

export default function OwnedPage({ params }: OwnedPageProps) {
  const { username } = use(params);
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<ContextType | 'ALL'>('ALL');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Get user by username first
  const { data: user, isLoading: userLoading } = trpc.user.getByUsername.useQuery({ username });

  // Get owned contexts
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.context.list.useInfiniteQuery(
    {
      ownerId: user?.id ?? '',
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      limit: 12,
    },
    {
      enabled: !!user?.id,
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

  const contexts = data?.pages.flatMap((page) => page.items) ?? [];

  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-forest-500 mx-auto" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-warm-500 dark:text-warm-400 font-korean">사용자를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로
        </Button>
        <h1 className="text-2xl font-display font-bold text-forest-800 dark:text-cream-100 font-korean">
          {user.displayName || user.username}님이 운영 중
        </h1>
        <p className="text-warm-500 dark:text-warm-400 font-korean mt-1">
          {contexts.length}개의 그룹/이벤트를 운영하고 있습니다
        </p>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(Object.keys(TYPE_LABELS) as (ContextType | 'ALL')[]).map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              typeFilter === type
                ? 'bg-forest-600 text-white'
                : 'bg-cream-100 dark:bg-forest-800 text-forest-700 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-forest-700'
            }`}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-forest-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && contexts.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-16 h-16 mx-auto mb-4 text-warm-300 dark:text-warm-600" />
          <h2 className="text-xl font-bold text-forest-800 dark:text-cream-100 mb-2 font-korean">
            아직 운영 중인 곳이 없습니다
          </h2>
          <p className="text-warm-600 dark:text-warm-400 mb-6 font-korean">
            새로운 그룹이나 이벤트를 만들어보세요!
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/groups/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-medium rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-korean">그룹 만들기</span>
            </Link>
            <Link
              href="/events/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-warm-100 dark:bg-forest-800 hover:bg-warm-200 dark:hover:bg-forest-700 text-forest-700 dark:text-cream-100 font-medium rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-korean">이벤트 만들기</span>
            </Link>
          </div>
        </div>
      )}

      {/* Contexts Grid */}
      {contexts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contexts.map((context) => {
            const Icon = TYPE_ICONS[context.type as ContextType] || Users;
            const eventData = (context.plugins as Record<string, unknown>)?.event as EventPluginData | undefined;
            const startDate = eventData?.startAt ? new Date(eventData.startAt) : null;

            return (
              <Link
                key={context.id}
                href={`/c/${context.slug}`}
                className="group flex items-start gap-4 p-4 bg-cream-50/80 dark:bg-forest-900/60 rounded-xl border border-warm-200/60 dark:border-forest-800/60 hover:shadow-md transition-all"
              >
                {/* Avatar */}
                <div className="w-16 h-16 rounded-xl bg-forest-100 dark:bg-forest-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {context.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={context.avatarUrl}
                      alt={context.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="w-8 h-8 text-forest-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-forest-100 dark:bg-forest-800 text-forest-600 dark:text-forest-400 rounded-full font-korean">
                      {TYPE_LABELS[context.type as ContextType]}
                    </span>
                    {startDate && (
                      <span className="text-xs text-warm-500">
                        {format(startDate, 'M월 d일', { locale: ko })}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-forest-800 dark:text-cream-100 group-hover:text-forest-600 dark:group-hover:text-forest-400 transition-colors line-clamp-1 mt-1 font-korean">
                    {context.name}
                  </h3>
                  {context.description && (
                    <p className="text-sm text-warm-600 dark:text-warm-400 line-clamp-1 mt-0.5 font-korean">
                      {context.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-sm text-warm-500">
                    <Users className="w-4 h-4" />
                    <span>{context._count?.memberships || 0}명</span>
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
