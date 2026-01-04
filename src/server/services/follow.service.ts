/**
 * Follow Service
 * Business logic for follow relationships between users
 *
 * Follow relationships are stored in the Follow model.
 * Activity records are created for ActivityPub compliance
 * and to enable notifications via InboxItem delivery.
 */

import { TRPCError } from '@trpc/server';
import { FollowStatus, Prisma, InboxCategory, ObjectType, ActivityType } from '@prisma/client';
import { db } from '@/server/db';

// =============================================================================
// Types
// =============================================================================

interface FollowResult {
  success: boolean;
  status: FollowStatus;
  message: string;
}

interface FollowUserData {
  id: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
}

interface PaginatedFollows {
  users: FollowUserData[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface FollowStatusResult {
  isFollowing: boolean;
  isFollowedBy: boolean;
  followStatus: FollowStatus | null;
  followedByStatus: FollowStatus | null;
}

interface PendingRequest {
  id: string;
  follower: FollowUserData;
  createdAt: Date;
}

interface PaginatedPendingRequests {
  requests: PendingRequest[];
  nextCursor: string | null;
  hasMore: boolean;
}

// =============================================================================
// Follow Operations
// =============================================================================

/**
 * Follow a user
 * Creates a Follow record and Activity, handles auto-accept for public accounts
 */
export async function followUser(
  followerId: string,
  targetUserId: string
): Promise<FollowResult> {
  // Can't follow yourself
  if (followerId === targetUserId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: '자기 자신을 팔로우할 수 없습니다',
    });
  }

  // Check if target user exists
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, requiresFollowApproval: true },
  });

  if (!targetUser) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: '사용자를 찾을 수 없습니다',
    });
  }

  // Check if already following
  const existingFollow = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: targetUserId,
      },
    },
  });

  if (existingFollow) {
    if (existingFollow.status === FollowStatus.ACCEPTED) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '이미 팔로우 중입니다',
      });
    }
    if (existingFollow.status === FollowStatus.PENDING) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: '이미 팔로우 요청을 보냈습니다',
      });
    }
    // If rejected, allow re-following (delete old record first)
    await db.follow.delete({
      where: { id: existingFollow.id },
    });
  }

  // Determine initial status based on target's settings
  const initialStatus = targetUser.requiresFollowApproval
    ? FollowStatus.PENDING
    : FollowStatus.ACCEPTED;

  // Create follow record and Activity in a transaction
  const follow = await db.$transaction(async (tx) => {
    // Create the follow record
    const newFollow = await tx.follow.create({
      data: {
        followerId,
        followingId: targetUserId,
        status: initialStatus,
        acceptedAt: initialStatus === FollowStatus.ACCEPTED ? new Date() : null,
      },
    });

    // Create Follow activity for notification/ActivityPub compliance
    const activity = await tx.activity.create({
      data: {
        type: ActivityType.FOLLOW,
        actorId: followerId,
        actorType: 'USER',
        objectType: ObjectType.USER,
        objectId: targetUserId,
        to: [`user:${targetUserId}`],
        cc: [],
      },
    });

    // Deliver to target user's inbox (for notification)
    await tx.inboxItem.create({
      data: {
        userId: targetUserId,
        activityId: activity.id,
        category: InboxCategory.FOLLOW,
      },
    });

    return newFollow;
  });

  return {
    success: true,
    status: follow.status,
    message:
      initialStatus === FollowStatus.PENDING
        ? '팔로우 요청을 보냈습니다'
        : '팔로우했습니다',
  };
}

/**
 * Unfollow a user
 * Removes the Follow record
 */
export async function unfollowUser(
  followerId: string,
  targetUserId: string
): Promise<{ success: boolean }> {
  const follow = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: targetUserId,
      },
    },
  });

  if (!follow) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: '팔로우 관계가 없습니다',
    });
  }

  await db.follow.delete({
    where: { id: follow.id },
  });

  return { success: true };
}

/**
 * Accept a follow request
 */
export async function acceptFollowRequest(
  userId: string,
  followerId: string
): Promise<{ success: boolean }> {
  const follow = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: userId,
      },
    },
  });

  if (!follow) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: '팔로우 요청을 찾을 수 없습니다',
    });
  }

  if (follow.status !== FollowStatus.PENDING) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: '대기 중인 팔로우 요청이 아닙니다',
    });
  }

  await db.$transaction(async (tx) => {
    // Update follow status
    await tx.follow.update({
      where: { id: follow.id },
      data: {
        status: FollowStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });

    // Create Accept activity for notification
    const activity = await tx.activity.create({
      data: {
        type: ActivityType.ACCEPT,
        actorId: userId,
        actorType: 'USER',
        objectType: ObjectType.ACTIVITY, // Accept references the Follow activity
        objectId: follow.id,
        to: [`user:${followerId}`],
        cc: [],
      },
    });

    // Deliver to follower's inbox
    await tx.inboxItem.create({
      data: {
        userId: followerId,
        activityId: activity.id,
        category: InboxCategory.FOLLOW, // Follow-related notification
      },
    });
  });

  return { success: true };
}

/**
 * Reject a follow request
 */
export async function rejectFollowRequest(
  userId: string,
  followerId: string
): Promise<{ success: boolean }> {
  const follow = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: userId,
      },
    },
  });

  if (!follow) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: '팔로우 요청을 찾을 수 없습니다',
    });
  }

  if (follow.status !== FollowStatus.PENDING) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: '대기 중인 팔로우 요청이 아닙니다',
    });
  }

  await db.follow.update({
    where: { id: follow.id },
    data: {
      status: FollowStatus.REJECTED,
    },
  });

  return { success: true };
}

// =============================================================================
// Query Operations
// =============================================================================

/**
 * Check if user A is following user B
 */
export async function isFollowing(
  followerId: string,
  targetUserId: string
): Promise<boolean> {
  const follow = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: targetUserId,
      },
    },
  });

  return follow?.status === FollowStatus.ACCEPTED;
}

/**
 * Get detailed follow status between two users
 */
export async function getFollowStatus(
  userId: string,
  targetUserId: string
): Promise<FollowStatusResult> {
  const [following, followedBy] = await Promise.all([
    db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    }),
    db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: targetUserId,
          followingId: userId,
        },
      },
    }),
  ]);

  return {
    isFollowing: following?.status === FollowStatus.ACCEPTED,
    isFollowedBy: followedBy?.status === FollowStatus.ACCEPTED,
    followStatus: following?.status ?? null,
    followedByStatus: followedBy?.status ?? null,
  };
}

/**
 * Get followers of a user
 */
export async function getFollowers(
  userId: string,
  cursor?: string,
  limit: number = 20
): Promise<PaginatedFollows> {
  const where: Prisma.FollowWhereInput = {
    followingId: userId,
    status: FollowStatus.ACCEPTED,
  };

  const follows = await db.follow.findMany({
    where,
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { acceptedAt: 'desc' },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  const hasMore = follows.length > limit;
  const results = hasMore ? follows.slice(0, -1) : follows;

  return {
    users: results.map((f) => f.follower),
    nextCursor: hasMore ? results[results.length - 1]?.id ?? null : null,
    hasMore,
  };
}

/**
 * Get users that a user is following
 */
export async function getFollowing(
  userId: string,
  cursor?: string,
  limit: number = 20
): Promise<PaginatedFollows> {
  const where: Prisma.FollowWhereInput = {
    followerId: userId,
    status: FollowStatus.ACCEPTED,
  };

  const follows = await db.follow.findMany({
    where,
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { acceptedAt: 'desc' },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  const hasMore = follows.length > limit;
  const results = hasMore ? follows.slice(0, -1) : follows;

  return {
    users: results.map((f) => f.following),
    nextCursor: hasMore ? results[results.length - 1]?.id ?? null : null,
    hasMore,
  };
}

/**
 * Get pending follow requests for a user
 */
export async function getPendingRequests(
  userId: string,
  cursor?: string,
  limit: number = 20
): Promise<PaginatedPendingRequests> {
  const follows = await db.follow.findMany({
    where: {
      followingId: userId,
      status: FollowStatus.PENDING,
    },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  const hasMore = follows.length > limit;
  const results = hasMore ? follows.slice(0, -1) : follows;

  return {
    requests: results.map((f) => ({
      id: f.id,
      follower: f.follower,
      createdAt: f.createdAt,
    })),
    nextCursor: hasMore ? results[results.length - 1]?.id ?? null : null,
    hasMore,
  };
}

/**
 * Get follower/following counts for a user
 */
export async function getFollowCounts(
  userId: string
): Promise<{ followers: number; following: number }> {
  const [followers, following] = await Promise.all([
    db.follow.count({
      where: {
        followingId: userId,
        status: FollowStatus.ACCEPTED,
      },
    }),
    db.follow.count({
      where: {
        followerId: userId,
        status: FollowStatus.ACCEPTED,
      },
    }),
  ]);

  return { followers, following };
}

/**
 * Get pending follow request count for a user
 */
export async function getPendingRequestCount(userId: string): Promise<number> {
  return db.follow.count({
    where: {
      followingId: userId,
      status: FollowStatus.PENDING,
    },
  });
}

/**
 * Get IDs of users that a user is following (for timeline filtering)
 */
export async function getFollowingIds(userId: string): Promise<string[]> {
  const follows = await db.follow.findMany({
    where: {
      followerId: userId,
      status: FollowStatus.ACCEPTED,
    },
    select: {
      followingId: true,
    },
  });

  return follows.map((f) => f.followingId);
}
