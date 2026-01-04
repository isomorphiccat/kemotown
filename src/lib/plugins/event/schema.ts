/**
 * Event Plugin Schema
 * Zod schemas for event-specific data
 */

import { z } from 'zod';

// =============================================================================
// Location Schemas
// =============================================================================

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const locationSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  coordinates: coordinatesSchema.optional(),
  mapUrl: z.string().url().optional(),
  isPublic: z.boolean().default(false),
});

// =============================================================================
// Main Event Data Schema
// =============================================================================

export const eventDataSchema = z.object({
  // Timing
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().default('Asia/Seoul'),
  isAllDay: z.boolean().default(false),

  // Location
  locationType: z.enum(['physical', 'online', 'hybrid']),
  location: locationSchema.optional(),
  onlineUrl: z.string().url().optional(),

  // Capacity
  capacity: z.number().int().min(1).optional(),
  registrationDeadline: z.string().datetime().optional(),

  // Payment
  cost: z.number().min(0).default(0),
  currency: z.string().default('KRW'),
  paymentRequired: z.boolean().default(false),

  // RSVP Options
  rsvpOptions: z
    .array(z.enum(['attending', 'considering', 'not_attending']))
    .default(['attending', 'not_attending']),
  requiresApproval: z.boolean().default(false),
  screeningQuestions: z.array(z.string().max(500)).max(5).optional(),

  // Features
  hasWaitlist: z.boolean().default(true),
  allowGuestPlus: z.boolean().default(false),
  maxGuestsPerRsvp: z.number().int().min(0).max(10).default(0),

  // Display
  tags: z.array(z.string().max(30)).max(10).default([]),
  rules: z.string().max(5000).optional(),
});

export type EventPluginData = z.infer<typeof eventDataSchema>;

// =============================================================================
// Default Data
// =============================================================================

/**
 * Default event data for new events
 */
export const defaultEventData: EventPluginData = {
  startAt: new Date().toISOString(),
  endAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours later
  timezone: 'Asia/Seoul',
  isAllDay: false,
  locationType: 'physical',
  cost: 0,
  currency: 'KRW',
  paymentRequired: false,
  rsvpOptions: ['attending', 'not_attending'],
  requiresApproval: false,
  hasWaitlist: true,
  allowGuestPlus: false,
  maxGuestsPerRsvp: 0,
  tags: [],
};

// =============================================================================
// RSVP Status Schema
// =============================================================================

export const rsvpStatusSchema = z.enum([
  'pending',
  'attending',
  'considering',
  'not_attending',
  'waitlist',
  'cancelled',
]);

export type RSVPStatus = z.infer<typeof rsvpStatusSchema>;

// =============================================================================
// Payment Status Schema
// =============================================================================

export const paymentStatusSchema = z.enum([
  'pending',
  'paid',
  'refunded',
  'not_required',
]);

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

// =============================================================================
// Per-Member Event Data Schema
// =============================================================================

export const eventMemberDataSchema = z.object({
  rsvpStatus: rsvpStatusSchema.default('pending'),
  rsvpAt: z.string().datetime().optional(),
  paymentStatus: paymentStatusSchema.default('not_required'),
  paymentId: z.string().optional(),
  checkedInAt: z.string().datetime().optional(),
  guestCount: z.number().int().min(0).default(0),
  screeningAnswers: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
});

export type EventMemberData = z.infer<typeof eventMemberDataSchema>;

export const defaultEventMemberData: EventMemberData = {
  rsvpStatus: 'pending',
  paymentStatus: 'not_required',
  guestCount: 0,
};
