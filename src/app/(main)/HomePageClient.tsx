'use client';

/**
 * Home Page Client Component
 * Timeline-centric home with tabs for public/home feed
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, Home, Sparkles, Users, Calendar, ChevronRight } from 'lucide-react';
import { TimelineV2 } from '@/components/timeline/TimelineV2';
import { ActivityComposer } from '@/components/timeline/ActivityComposer';
import { ContextCard } from '@/components/context';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface HomePageClientProps {
  currentUserId?: string;
  userAvatar?: string | null;
  userDisplayName?: string | null;
  username?: string | null;
}

type FeedTab = 'public' | 'home';

export function HomePageClient({
  currentUserId,
  userAvatar,
  userDisplayName,
  username,
}: HomePageClientProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>(currentUserId ? 'home' : 'public');

  // Fetch suggested contexts for discovery
  const { data: suggestedContexts } = trpc.context.list.useQuery(
    { limit: 3, visibility: 'PUBLIC' },
    { enabled: true }
  );

  const isAuthenticated = !!currentUserId;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Welcome Banner for non-authenticated users */}
          {!isAuthenticated && (
            <div className="card-elevated p-6 bg-gradient-to-br from-forest-50 to-cream-50 dark:from-forest-900/50 dark:to-forest-950/50">
              <h1 className="text-2xl font-bold text-forest-800 dark:text-cream-100 mb-2">
                케모타운에 오신 것을 환영합니다!
              </h1>
              <p className="text-warm-600 dark:text-warm-400 mb-4">
                한국 퍼리 커뮤니티를 위한 따뜻한 공간입니다.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-medium rounded-xl transition-colors"
              >
                지금 참여하기
              </Link>
            </div>
          )}

          {/* Feed Tabs */}
          <div className="flex gap-2 p-1 bg-warm-100/50 dark:bg-forest-900/50 rounded-xl">
            <button
              onClick={() => setActiveTab('public')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'public'
                  ? 'bg-card text-forest-700 dark:text-forest-300 shadow-sm'
                  : 'text-warm-500 hover:text-forest-600 dark:hover:text-forest-400'
              )}
            >
              <Globe className="w-4 h-4" />
              전체
            </button>
            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('home')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'home'
                    ? 'bg-card text-forest-700 dark:text-forest-300 shadow-sm'
                    : 'text-warm-500 hover:text-forest-600 dark:hover:text-forest-400'
                )}
              >
                <Home className="w-4 h-4" />
                팔로잉
              </button>
            )}
          </div>

          {/* Composer (only for authenticated users) */}
          {isAuthenticated && (
            <ActivityComposer
              avatarUrl={userAvatar}
              displayName={userDisplayName}
              placeholder="무슨 생각을 하고 계신가요?"
            />
          )}

          {/* Timeline */}
          <TimelineV2
            type={activeTab}
            currentUserId={currentUserId}
          />
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {/* User Profile Card (authenticated) */}
          {isAuthenticated && (
            <div className="card-elevated p-5">
              <Link
                href={`/profile/${username}`}
                className="flex items-center gap-3 mb-4"
              >
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt={userDisplayName || ''}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-xl object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-forest flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {(userDisplayName || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-forest-800 dark:text-cream-100">
                    {userDisplayName}
                  </h3>
                  <p className="text-sm text-warm-500">@{username}</p>
                </div>
              </Link>
              <Link
                href="/profile/settings"
                className="block w-full text-center px-4 py-2 border border-warm-200 dark:border-forest-700 rounded-xl text-sm font-medium text-forest-600 dark:text-forest-400 hover:bg-warm-50 dark:hover:bg-forest-900/50 transition-colors"
              >
                프로필 수정
              </Link>
            </div>
          )}

          {/* Discover Section */}
          <div className="card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-forest-800 dark:text-cream-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-500" />
                둘러보기
              </h3>
            </div>

            {/* Quick Links */}
            <div className="space-y-1 mb-4">
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
          {suggestedContexts && suggestedContexts.items.length > 0 && (
            <div className="card-elevated p-5">
              <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-4">
                추천 공간
              </h3>
              <div className="space-y-2">
                {suggestedContexts.items.map((context) => (
                  <ContextCard key={context.id} context={context} compact />
                ))}
              </div>
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
        </aside>
      </div>
    </div>
  );
}
