'use client';

/**
 * FollowerList Component
 * Displays a list of followers or following users with pagination
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RefreshCw, AlertCircle, Users, UserPlus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { FollowButton } from './FollowButton';
import { useSession } from 'next-auth/react';

type ListType = 'followers' | 'following';

interface FollowerListProps {
  userId: string;
  type: ListType;
  className?: string;
}

export function FollowerList({ userId, type, className }: FollowerListProps) {
  const { data: session } = useSession();
  const isOwnProfile = session?.user?.id === userId;

  // Use the appropriate query based on type
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = type === 'followers'
    ? trpc.follow.getFollowers.useInfiniteQuery(
        { userId, limit: 20 },
        { getNextPageParam: (lastPage) => lastPage.nextCursor }
      )
    : trpc.follow.getFollowing.useInfiniteQuery(
        { userId, limit: 20 },
        { getNextPageParam: (lastPage) => lastPage.nextCursor }
      );

  const users = data?.pages.flatMap((page) => page.users) ?? [];

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="spinner w-8 h-8" />
          <p className="text-warm-500 dark:text-warm-400 text-sm font-korean">
            {type === 'followers' ? '팔로워' : '팔로잉'} 목록을 불러오는 중...
          </p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-red-800 dark:text-red-300 font-bold mb-2 font-korean">
            목록을 불러오는데 실패했습니다
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 font-korean">
            {error instanceof Error ? error.message : '알 수 없는 오류'}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-forest-100 dark:bg-forest-800 flex items-center justify-center mb-4">
            {type === 'followers' ? (
              <Users className="w-7 h-7 text-forest-500 dark:text-forest-400" />
            ) : (
              <UserPlus className="w-7 h-7 text-forest-500 dark:text-forest-400" />
            )}
          </div>
          <h3 className="text-lg font-bold text-forest-800 dark:text-cream-50 mb-2 font-korean">
            {type === 'followers' ? '팔로워가 없습니다' : '팔로잉이 없습니다'}
          </h3>
          <p className="text-sm text-warm-500 dark:text-warm-400 font-korean">
            {type === 'followers'
              ? '아직 팔로워가 없습니다.'
              : '아직 팔로우하는 사용자가 없습니다.'}
          </p>
        </div>
      )}

      {/* User list */}
      <div className="divide-y divide-warm-200/60 dark:divide-forest-800/60">
        {users.map((user) => (
          <UserListItem
            key={user.id}
            user={user}
            showFollowButton={!isOwnProfile && session?.user?.id !== user.id}
          />
        ))}
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div className="p-4 text-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-4 py-2 text-sm text-forest-600 dark:text-forest-400 hover:bg-warm-100 dark:hover:bg-forest-800 rounded-xl transition-colors disabled:opacity-50 font-korean"
          >
            {isFetchingNextPage ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                불러오는 중...
              </span>
            ) : (
              '더 보기'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// UserListItem Sub-component
// =============================================================================

interface UserData {
  id: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
}

interface UserListItemProps {
  user: UserData;
  showFollowButton: boolean;
}

function UserListItem({ user, showFollowButton }: UserListItemProps) {
  const displayName = user.name || user.username || '알 수 없음';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-warm-50 dark:hover:bg-forest-900/50 transition-colors">
      {/* Avatar */}
      <Link href={`/profile/${user.username}`} className="flex-shrink-0">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={displayName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-forest flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
        )}
      </Link>

      {/* Name & Username */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${user.username}`}
          className="block hover:underline"
        >
          <p className="font-semibold text-forest-800 dark:text-cream-100 truncate">
            {displayName}
          </p>
          {user.username && (
            <p className="text-sm text-warm-500 dark:text-warm-400 truncate">
              @{user.username}
            </p>
          )}
        </Link>
      </div>

      {/* Follow button */}
      {showFollowButton && (
        <FollowButton targetUserId={user.id} className="flex-shrink-0" />
      )}
    </div>
  );
}

// =============================================================================
// Follower/Following Tabs Component
// =============================================================================

interface FollowTabsProps {
  userId: string;
  initialTab?: ListType;
  className?: string;
}

export function FollowTabs({
  userId,
  initialTab = 'followers',
  className,
}: FollowTabsProps) {
  const [activeTab, setActiveTab] = useState<ListType>(initialTab);

  // Get counts
  const { data: counts } = trpc.follow.getCounts.useQuery({ userId });

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Tabs */}
      <div className="flex border-b border-warm-200/60 dark:border-forest-800/60">
        <button
          type="button"
          onClick={() => setActiveTab('followers')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors relative font-korean',
            activeTab === 'followers'
              ? 'text-forest-700 dark:text-forest-400'
              : 'text-warm-500 dark:text-warm-400 hover:text-forest-600 dark:hover:text-forest-500'
          )}
        >
          팔로워
          {counts && (
            <span className="ml-2 text-warm-400 dark:text-warm-500">
              {counts.followers}
            </span>
          )}
          {activeTab === 'followers' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest-500 dark:bg-forest-400" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('following')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors relative font-korean',
            activeTab === 'following'
              ? 'text-forest-700 dark:text-forest-400'
              : 'text-warm-500 dark:text-warm-400 hover:text-forest-600 dark:hover:text-forest-500'
          )}
        >
          팔로잉
          {counts && (
            <span className="ml-2 text-warm-400 dark:text-warm-500">
              {counts.following}
            </span>
          )}
          {activeTab === 'following' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest-500 dark:bg-forest-400" />
          )}
        </button>
      </div>

      {/* Content */}
      <FollowerList userId={userId} type={activeTab} />
    </div>
  );
}
