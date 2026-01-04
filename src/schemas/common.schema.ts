/**
 * Common Zod Schemas
 * Shared validation schemas used across the application
 */

import { z } from 'zod';

/**
 * Pagination input schema
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Cursor-based pagination schema
 */
export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * ID parameter schema
 */
export const idSchema = z.object({
  id: z.string().cuid(),
});

/**
 * Username parameter schema
 */
export const usernameSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/i, {
    message: 'Username can only contain letters, numbers, underscores, and hyphens',
  }),
});

/**
 * Slug parameter schema
 */
export const slugSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  }),
});

/**
 * Search query schema
 */
export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.from && data.to) {
      return data.from <= data.to;
    }
    return true;
  },
  { message: 'Start date must be before end date' }
);

/**
 * Social links schema
 */
export const socialLinksSchema = z.record(
  z.enum(['twitter', 'telegram', 'discord', 'furaffinity', 'instagram', 'website']),
  z.string().url().optional()
).optional();

/**
 * Interest tags schema
 */
export const interestTagsSchema = z.array(z.string().min(1).max(30)).max(20);

/**
 * Content text schema (for posts, comments, etc.)
 */
export const contentSchema = z.string().min(1).max(500).trim();

/**
 * Long content schema (for event descriptions, etc.)
 */
export const longContentSchema = z.string().min(1).max(10000).trim();

/**
 * Bio schema
 */
export const bioSchema = z.string().max(500).trim().optional();

/**
 * URL schema
 */
export const urlSchema = z.string().url().optional().or(z.literal(''));

/**
 * Image URL schema
 */
export const imageUrlSchema = z.string().url().optional().or(z.literal(''));

/**
 * Korean price schema (non-negative integer)
 */
export const priceSchema = z.number().int().nonnegative();

/**
 * Capacity schema (positive integer or null for unlimited)
 */
export const capacitySchema = z.number().int().positive().nullable();

/**
 * Emoji schema (for reactions)
 */
export const emojiSchema = z.enum(['thumbsup', 'heart', 'laugh', 'wow', 'sad']);

/**
 * Sort order schema
 */
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');
