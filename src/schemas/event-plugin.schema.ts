/**
 * Event Plugin Zod Schemas
 * Validation schemas for event-specific operations
 */

import { z } from 'zod';

/**
 * RSVP status enum
 */
export const rsvpStatusSchema = z.enum([
  'attending',
  'waitlist',
  'considering',
  'not_attending',
]);

export type RsvpStatus = z.infer<typeof rsvpStatusSchema>;

/**
 * RSVP to an event
 */
export const rsvpSchema = z.object({
  contextId: z.string().cuid(),
  status: rsvpStatusSchema,
  guestCount: z.number().int().min(0).max(10).default(0),
  screeningAnswers: z.record(z.string()).optional(),
  note: z.string().max(500).optional(),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;

/**
 * Update RSVP
 */
export const updateRsvpSchema = z.object({
  contextId: z.string().cuid(),
  status: rsvpStatusSchema.optional(),
  guestCount: z.number().int().min(0).max(10).optional(),
  note: z.string().max(500).optional(),
});

export type UpdateRsvpInput = z.infer<typeof updateRsvpSchema>;

/**
 * Cancel RSVP
 */
export const cancelRsvpSchema = z.object({
  contextId: z.string().cuid(),
});

/**
 * Check in attendee (for event hosts)
 */
export const checkInSchema = z.object({
  contextId: z.string().cuid(),
  userId: z.string().cuid(),
  note: z.string().max(200).optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

/**
 * Approve or reject RSVP
 */
export const approveRsvpSchema = z.object({
  contextId: z.string().cuid(),
  userId: z.string().cuid(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});

export type ApproveRsvpInput = z.infer<typeof approveRsvpSchema>;

/**
 * Get attendees query
 */
export const getAttendeesSchema = z.object({
  contextId: z.string().cuid(),
  status: rsvpStatusSchema.optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

/**
 * Get waitlist query
 */
export const getWaitlistSchema = z.object({
  contextId: z.string().cuid(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

/**
 * Get event stats query
 */
export const getStatsSchema = z.object({
  contextId: z.string().cuid(),
});
