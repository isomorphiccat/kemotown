/**
 * User Zod Schemas
 * Validation schemas for user-related operations
 */

import { z } from 'zod';
import { socialLinksSchema, interestTagsSchema, bioSchema, imageUrlSchema } from './common.schema';

/**
 * User profile update schema
 */
export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).trim().optional(),
  bio: bioSchema,
  avatarUrl: imageUrlSchema,
  bannerUrl: imageUrlSchema,
  species: z.string().max(50).trim().optional(),
  interests: interestTagsSchema.optional(),
  socialLinks: socialLinksSchema,
  isPublic: z.boolean().optional(),
  locale: z.enum(['ko', 'en']).optional(),
});

/**
 * User search schema
 */
export const userSearchSchema = z.object({
  query: z.string().max(100).optional(),
  interests: z.array(z.string()).max(10).optional(),
  species: z.string().max(50).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['createdAt', 'displayName', 'followers', 'bumps']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Update fursuit photos schema
 */
export const updateFursuitPhotosSchema = z.object({
  photos: z.array(z.string().url()).max(20),
});

/**
 * User ID schema (for following, bumping, etc.)
 */
export const userIdSchema = z.object({
  userId: z.string().cuid(),
});

/**
 * Follow/unfollow schema
 */
export const followSchema = z.object({
  targetUserId: z.string().cuid(),
});

/**
 * Bump schema
 */
export const bumpSchema = z.object({
  receiverId: z.string().cuid(),
  eventId: z.string().cuid().optional(),
  method: z.enum(['QR_CODE', 'MANUAL', 'NFC']),
  note: z.string().max(200).trim().optional(),
});

/**
 * Get user bumps schema
 */
export const getUserBumpsSchema = z.object({
  userId: z.string().cuid(),
  type: z.enum(['given', 'received']).default('received'),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

/**
 * Get user followers/following schema
 */
export const getUserFollowsSchema = z.object({
  userId: z.string().cuid(),
  type: z.enum(['followers', 'following']),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
