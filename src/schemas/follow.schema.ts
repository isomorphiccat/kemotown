/**
 * Follow Validation Schemas
 * Zod schemas for follow-related operations
 */

import { z } from 'zod';

// =============================================================================
// Follow/Unfollow Operations
// =============================================================================

/**
 * Schema for following a user
 */
export const followUserSchema = z.object({
  targetUserId: z.string().cuid('Invalid user ID'),
});

/**
 * Schema for unfollowing a user
 */
export const unfollowUserSchema = z.object({
  targetUserId: z.string().cuid('Invalid user ID'),
});

/**
 * Schema for responding to a follow request
 */
export const respondToFollowSchema = z.object({
  followerId: z.string().cuid('Invalid follower ID'),
  action: z.enum(['accept', 'reject']),
});

// =============================================================================
// Query Operations
// =============================================================================

/**
 * Schema for checking follow status
 */
export const isFollowingSchema = z.object({
  targetUserId: z.string().cuid('Invalid user ID'),
});

/**
 * Schema for getting follow status between users
 */
export const getFollowStatusSchema = z.object({
  targetUserId: z.string().cuid('Invalid user ID'),
});

/**
 * Schema for listing followers/following
 */
export const listFollowsSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

/**
 * Schema for listing pending follow requests
 */
export const listPendingRequestsSchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

// =============================================================================
// Type Exports
// =============================================================================

export type FollowUserInput = z.infer<typeof followUserSchema>;
export type UnfollowUserInput = z.infer<typeof unfollowUserSchema>;
export type RespondToFollowInput = z.infer<typeof respondToFollowSchema>;
export type IsFollowingInput = z.infer<typeof isFollowingSchema>;
export type GetFollowStatusInput = z.infer<typeof getFollowStatusSchema>;
export type ListFollowsInput = z.infer<typeof listFollowsSchema>;
export type ListPendingRequestsInput = z.infer<typeof listPendingRequestsSchema>;
