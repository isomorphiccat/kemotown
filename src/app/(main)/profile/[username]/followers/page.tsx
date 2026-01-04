/**
 * Followers Page
 * Display users who follow this profile
 */

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, UserMinus } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface FollowersPageProps {
  params: Promise<{ username: string }>;
}

export default function FollowersPage({ params }: FollowersPageProps) {
  const { username } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  // Get user by username first
  const { data: user } = trpc.user.getByUsername.useQuery({ username });

  // Get followers - returns { users, nextCursor, hasMore }
  const { data: followersData, isLoading } = trpc.follow.getFollowers.useQuery(
    { userId: user?.id ?? '' },
    { enabled: !!user?.id }
  );

  const utils = trpc.useUtils();

  const followMutation = trpc.follow.follow.useMutation({
    onSuccess: () => {
      utils.follow.getFollowers.invalidate();
      utils.follow.getStatus.invalidate();
    },
  });

  const unfollowMutation = trpc.follow.unfollow.useMutation({
    onSuccess: () => {
      utils.follow.getFollowers.invalidate();
      utils.follow.getStatus.invalidate();
    },
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-warm-500 dark:text-warm-400 font-korean">사용자를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로
        </Button>
        <h1 className="text-2xl font-display font-bold text-forest-800 dark:text-cream-100 font-korean">
          {user.displayName || user.username}님의 팔로워
        </h1>
        <p className="text-warm-500 dark:text-warm-400 font-korean mt-1">
          {followersData?.users.length ?? 0}명이 팔로우하고 있습니다
        </p>
      </div>

      {/* Followers List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600" />
        </div>
      ) : followersData?.users.length === 0 ? (
        <div className="text-center py-12 text-warm-500 dark:text-warm-400 font-korean">
          아직 팔로워가 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {followersData?.users.map((follower) => (
            <div
              key={follower.id}
              className="flex items-center justify-between p-4 bg-cream-50/80 dark:bg-forest-900/60 rounded-xl border border-warm-200/60 dark:border-forest-800/60"
            >
              <Link
                href={`/profile/${follower.username}`}
                className="flex items-center gap-3 flex-1"
              >
                {follower.avatarUrl ? (
                  <Image
                    src={follower.avatarUrl}
                    alt={follower.username ?? follower.id}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center">
                    <span className="text-forest-600 dark:text-forest-400 font-bold">
                      {(follower.name || follower.username || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-forest-800 dark:text-cream-100 font-korean">
                    {follower.name || follower.username}
                  </p>
                  <p className="text-sm text-warm-500 dark:text-warm-400">
                    @{follower.username}
                  </p>
                </div>
              </Link>

              {session?.user?.id && session.user.id !== follower.id && (
                <FollowButton
                  targetUserId={follower.id}
                  onFollow={() => followMutation.mutate({ targetUserId: follower.id })}
                  onUnfollow={() => unfollowMutation.mutate({ targetUserId: follower.id })}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FollowButton({
  targetUserId,
  onFollow,
  onUnfollow,
}: {
  targetUserId: string;
  onFollow: () => void;
  onUnfollow: () => void;
}) {
  const { data: status } = trpc.follow.getStatus.useQuery({ targetUserId });

  if (status?.isFollowing) {
    return (
      <Button variant="outline" size="sm" onClick={onUnfollow}>
        <UserMinus className="mr-1 h-4 w-4" />
        팔로잉
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={onFollow}>
      <UserPlus className="mr-1 h-4 w-4" />
      팔로우
    </Button>
  );
}
