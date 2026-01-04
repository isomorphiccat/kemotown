/**
 * Group Plugin Zod Schemas
 * Validation schemas for group-specific operations
 */

import { z } from 'zod';

/**
 * Create announcement
 */
export const createAnnouncementSchema = z.object({
  contextId: z.string().cuid(),
  content: z.string().min(1).max(5000),
  pinned: z.boolean().default(false),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

/**
 * Create poll
 */
export const createPollSchema = z.object({
  contextId: z.string().cuid(),
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
  allowMultiple: z.boolean().default(false),
  endsAt: z.string().datetime().optional(),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;

/**
 * Vote on poll
 */
export const votePollSchema = z.object({
  contextId: z.string().cuid(),
  pollId: z.string().cuid(),
  optionIndices: z.array(z.number().int().min(0)).min(1),
});

export type VotePollInput = z.infer<typeof votePollSchema>;

/**
 * Issue warning to member
 */
export const issueWarningSchema = z.object({
  contextId: z.string().cuid(),
  userId: z.string().cuid(),
  reason: z.string().min(1).max(500),
});

export type IssueWarningInput = z.infer<typeof issueWarningSchema>;

/**
 * Mute member
 */
export const muteMemberSchema = z.object({
  contextId: z.string().cuid(),
  userId: z.string().cuid(),
  duration: z.number().int().min(1).max(604800), // Max 1 week in seconds
  reason: z.string().max(500).optional(),
});

export type MuteMemberInput = z.infer<typeof muteMemberSchema>;

/**
 * Unmute member
 */
export const unmuteMemberSchema = z.object({
  contextId: z.string().cuid(),
  userId: z.string().cuid(),
});

/**
 * Assign custom role
 */
export const assignRoleSchema = z.object({
  contextId: z.string().cuid(),
  userId: z.string().cuid(),
  roleName: z.string().min(1).max(50),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;

/**
 * Get moderation logs query
 */
export const getModLogsSchema = z.object({
  contextId: z.string().cuid(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

/**
 * Get group stats query
 */
export const getGroupStatsSchema = z.object({
  contextId: z.string().cuid(),
});
