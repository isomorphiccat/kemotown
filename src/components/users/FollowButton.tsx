'use client';

/**
 * FollowButton Component
 * Button to follow/unfollow a user with support for pending follow requests
 */

import { trpc } from '@/lib/trpc';
import { FollowStatus } from '@prisma/client';

interface FollowButtonProps {
  targetUserId: string;
  className?: string;
}

export function FollowButton({ targetUserId, className }: FollowButtonProps) {
  const utils = trpc.useUtils();

  // Get detailed follow status (includes pending state)
  const { data: statusData, isLoading: isCheckingFollow } =
    trpc.follow.getStatus.useQuery({ targetUserId });

  const isFollowing = statusData?.isFollowing ?? false;
  const isPending = statusData?.followStatus === FollowStatus.PENDING;

  const followMutation = trpc.follow.follow.useMutation({
    onSuccess: () => {
      utils.follow.getStatus.invalidate({ targetUserId });
      utils.follow.isFollowing.invalidate({ targetUserId });
      utils.follow.getCounts.invalidate({ userId: targetUserId });
    },
  });

  const unfollowMutation = trpc.follow.unfollow.useMutation({
    onSuccess: () => {
      utils.follow.getStatus.invalidate({ targetUserId });
      utils.follow.isFollowing.invalidate({ targetUserId });
      utils.follow.getCounts.invalidate({ userId: targetUserId });
    },
  });

  const handleClick = () => {
    if (isFollowing || isPending) {
      unfollowMutation.mutate({ targetUserId });
    } else {
      followMutation.mutate({ targetUserId });
    }
  };

  const isLoading =
    followMutation.isPending || unfollowMutation.isPending || isCheckingFollow;

  // Determine button label
  const getLabel = () => {
    if (isLoading) return '처리 중...';
    if (isFollowing) return '팔로잉';
    if (isPending) return '요청됨';
    return '팔로우';
  };

  // Determine button style
  const getButtonStyle = () => {
    const base =
      'px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';
    if (isFollowing) {
      return `${base} bg-forest-100 hover:bg-red-50 text-forest-700 hover:text-red-600 dark:bg-forest-800 dark:hover:bg-red-900/40 dark:text-forest-300 dark:hover:text-red-400`;
    }
    if (isPending) {
      return `${base} bg-warm-100 text-warm-600 dark:bg-warm-800 dark:text-warm-400`;
    }
    return `${base} bg-forest-600 hover:bg-forest-700 text-white dark:bg-forest-500 dark:hover:bg-forest-600`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`${getButtonStyle()} ${className ?? ''}`}
    >
      {getLabel()}
    </button>
  );
}
