/**
 * Group Plugin Schema
 * Zod schemas for group-specific data
 */

import { z } from 'zod';

// =============================================================================
// Group Type Schema
// =============================================================================

export const groupTypeSchema = z.enum([
  'community',    // General community group
  'interest',     // Interest-based (e.g., art, games)
  'regional',     // Location-based (e.g., Seoul furries)
  'species',      // Species-based (e.g., canines, felines)
  'convention',   // Convention planning/attendees
  'other',        // Miscellaneous
]);

export type GroupType = z.infer<typeof groupTypeSchema>;

// =============================================================================
// Moderation Settings Schema
// =============================================================================

export const moderationSettingsSchema = z.object({
  // Content moderation
  requirePostApproval: z.boolean().default(false),
  allowedMediaTypes: z
    .array(z.enum(['image', 'video', 'audio', 'document']))
    .default(['image']),
  maxAttachmentsPerPost: z.number().int().min(0).max(10).default(4),

  // Posting restrictions
  slowModeSeconds: z.number().int().min(0).max(86400).default(0), // 0 = disabled
  minMemberAgeMinutes: z.number().int().min(0).default(0), // Time before new members can post

  // Auto-moderation
  enableAutoMod: z.boolean().default(false),
  bannedWords: z.array(z.string().max(50)).max(100).default([]),
  linkWhitelist: z.array(z.string().url()).max(50).default([]),
});

export type ModerationSettings = z.infer<typeof moderationSettingsSchema>;

// =============================================================================
// Main Group Data Schema
// =============================================================================

export const groupDataSchema = z.object({
  // Group identity
  groupType: groupTypeSchema.default('community'),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10).default([]),

  // Moderation
  moderation: moderationSettingsSchema.default({}),

  // Posting rules
  postingGuidelines: z.string().max(5000).optional(),
  pinnedRules: z.string().max(2000).optional(),

  // Features
  enablePolls: z.boolean().default(true),
  enableEvents: z.boolean().default(true),
  enableAnnouncements: z.boolean().default(true),

  // Customization
  welcomeMessage: z.string().max(1000).optional(),
  customRoles: z
    .array(
      z.object({
        name: z.string().max(30),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        permissions: z.array(z.string()).default([]),
      })
    )
    .max(10)
    .default([]),

  // Discovery
  isDiscoverable: z.boolean().default(true),
  requiredProfileFields: z.array(z.string()).default([]),
});

export type GroupPluginData = z.infer<typeof groupDataSchema>;

// =============================================================================
// Default Data
// =============================================================================

export const defaultGroupData: GroupPluginData = {
  groupType: 'community',
  tags: [],
  moderation: {
    requirePostApproval: false,
    allowedMediaTypes: ['image'],
    maxAttachmentsPerPost: 4,
    slowModeSeconds: 0,
    minMemberAgeMinutes: 0,
    enableAutoMod: false,
    bannedWords: [],
    linkWhitelist: [],
  },
  enablePolls: true,
  enableEvents: true,
  enableAnnouncements: true,
  customRoles: [],
  isDiscoverable: true,
  requiredProfileFields: [],
};

// =============================================================================
// Per-Member Group Data Schema
// =============================================================================

export const groupMemberDataSchema = z.object({
  customRole: z.string().max(30).optional(),
  mutedUntil: z.string().datetime().optional(),
  warningCount: z.number().int().min(0).default(0),
  lastPostAt: z.string().datetime().optional(),
  introductionPosted: z.boolean().default(false),
});

export type GroupMemberData = z.infer<typeof groupMemberDataSchema>;

export const defaultGroupMemberData: GroupMemberData = {
  warningCount: 0,
  introductionPosted: false,
};
