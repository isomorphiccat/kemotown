/**
 * Context Zod Schemas
 * Validation schemas for Context (Group, Event, Convention) operations
 */

import { z } from 'zod';
import { cursorPaginationSchema, imageUrlSchema } from './common.schema';

// =============================================================================
// Enums (matching Prisma enums)
// =============================================================================

export const contextTypeSchema = z.enum(['GROUP', 'EVENT', 'CONVENTION']);
export const visibilitySchema = z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']);
export const joinPolicySchema = z.enum(['OPEN', 'APPROVAL', 'INVITE', 'CLOSED']);

// =============================================================================
// Create Context
// =============================================================================

export const createContextSchema = z.object({
  type: contextTypeSchema,
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(2000).trim().optional(),
  visibility: visibilitySchema.default('PUBLIC'),
  joinPolicy: joinPolicySchema.default('OPEN'),
  pluginId: z.string().min(1),
  pluginData: z.record(z.unknown()).optional(),
  avatarUrl: imageUrlSchema,
  bannerUrl: imageUrlSchema,
});

export type CreateContextInput = z.infer<typeof createContextSchema>;

// =============================================================================
// Update Context
// =============================================================================

export const updateContextSchema = z.object({
  contextId: z.string().cuid(),
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(2000).trim().optional(),
  visibility: visibilitySchema.optional(),
  joinPolicy: joinPolicySchema.optional(),
  avatarUrl: imageUrlSchema,
  bannerUrl: imageUrlSchema,
  // Handle can be set to a valid string, empty string to clear, or undefined to not change
  handle: z.string().max(30).regex(/^[a-z0-9_-]*$/i).optional().transform((val) =>
    val === '' ? undefined : val
  ),
});

export type UpdateContextInput = z.infer<typeof updateContextSchema>;

// =============================================================================
// Update Plugin Data
// =============================================================================

export const updatePluginDataSchema = z.object({
  contextId: z.string().cuid(),
  pluginId: z.string().min(1),
  data: z.record(z.unknown()),
});

export type UpdatePluginDataInput = z.infer<typeof updatePluginDataSchema>;

// =============================================================================
// Query Schemas
// =============================================================================

export const getContextByIdSchema = z.object({
  contextId: z.string().cuid(),
});

export const getContextBySlugSchema = z.object({
  slug: z.string().min(1).max(100),
});

export const listContextsSchema = cursorPaginationSchema.extend({
  type: contextTypeSchema.optional(),
  visibility: visibilitySchema.optional(),
  ownerId: z.string().cuid().optional(),
  search: z.string().max(100).optional(),
});

export type ListContextsInput = z.infer<typeof listContextsSchema>;

// =============================================================================
// Action Schemas
// =============================================================================

export const joinContextSchema = z.object({
  contextId: z.string().cuid(),
});

export const leaveContextSchema = z.object({
  contextId: z.string().cuid(),
});

export const archiveContextSchema = z.object({
  contextId: z.string().cuid(),
});

export const transferOwnershipSchema = z.object({
  contextId: z.string().cuid(),
  newOwnerId: z.string().cuid(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type ContextType = z.infer<typeof contextTypeSchema>;
export type Visibility = z.infer<typeof visibilitySchema>;
export type JoinPolicy = z.infer<typeof joinPolicySchema>;
