/**
 * Event Zod Schemas
 * Validation schemas for event-related operations
 */

import { z } from 'zod';
import { longContentSchema, priceSchema, capacitySchema, imageUrlSchema, urlSchema } from './common.schema';

/**
 * Event visibility enum
 */
export const eventVisibilitySchema = z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']);

/**
 * Event status enum
 */
export const eventStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']);

/**
 * RSVP status enum
 */
export const rsvpStatusSchema = z.enum(['ATTENDING', 'CONSIDERING', 'NOT_ATTENDING', 'WAITLISTED']);

/**
 * Base event fields schema (without refinements)
 * Exported for form usage where ZodEffects are not needed
 *
 * Date handling:
 * - startDate is required (YYYY-MM-DD format)
 * - startTime is optional (HH:MM format, defaults to 00:00)
 * - endDate is optional (defaults to startDate for single-day events)
 * - endTime is optional (HH:MM format, defaults to 23:59 if no time specified)
 */
export const baseEventFieldsSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: longContentSchema,
  coverUrl: imageUrlSchema,
  // Flexible date/time fields
  // Note: HTML inputs return "" when empty, not undefined, so we use .or(z.literal(''))
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, '시간 형식이 올바르지 않습니다 (HH:MM)').optional().or(z.literal('')),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)').optional().or(z.literal('')),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, '시간 형식이 올바르지 않습니다 (HH:MM)').optional().or(z.literal('')),
  timezone: z.string().default('Asia/Seoul'),
  location: z.string().max(200).trim().optional(),
  address: z.string().max(500).trim().optional(),
  mapUrl: urlSchema,
  isOnline: z.boolean().default(false),
  onlineUrl: urlSchema,
  capacity: capacitySchema.optional(),
  cost: priceSchema.default(0),
  visibility: eventVisibilitySchema.default('PUBLIC'),
  requiresApproval: z.boolean().default(false),
  rules: z.string().max(5000).trim().optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
});

/**
 * Helper to build a Date from date string and optional time string
 * Treats empty strings as undefined (HTML inputs return "" when empty)
 */
export function buildDateTime(dateStr: string, timeStr?: string | '', defaultTime = '00:00'): Date {
  // Treat empty string as undefined
  const time = (timeStr && timeStr !== '') ? timeStr : defaultTime;
  return new Date(`${dateStr}T${time}:00`);
}

/**
 * Helper to check if a string value is present (not undefined, null, or empty)
 */
function hasValue(val: string | undefined | null): val is string {
  return val !== undefined && val !== null && val !== '';
}

/**
 * Create event schema (with refinements and transformation)
 * Transforms string date/time fields into proper Date objects for Prisma
 */
export const createEventSchema = baseEventFieldsSchema.refine(
  (data) => {
    // If endDate is provided (and not empty), check it's not before startDate
    if (hasValue(data.endDate)) {
      const startDateTime = buildDateTime(data.startDate, data.startTime, '00:00');
      const endDateTime = buildDateTime(data.endDate, data.endTime, '23:59');
      return startDateTime <= endDateTime;
    }
    // If only startDate with times, check start time is before end time
    if (hasValue(data.startTime) && hasValue(data.endTime) && !hasValue(data.endDate)) {
      return data.startTime <= data.endTime;
    }
    return true;
  },
  { message: '종료 시간은 시작 시간 이후여야 합니다', path: ['endDate'] }
).refine(
  (data) => {
    if (data.isOnline) {
      return hasValue(data.onlineUrl);
    }
    return true;
  },
  { message: '온라인 이벤트는 링크가 필요합니다', path: ['onlineUrl'] }
).transform((data) => {
  // Build Date objects from the flexible date/time inputs
  const startAt = buildDateTime(data.startDate, data.startTime, '00:00');

  // End date defaults to start date, end time defaults to 23:59 if not specified
  const effectiveEndDate = hasValue(data.endDate) ? data.endDate : data.startDate;
  const effectiveEndTime = hasValue(data.endTime)
    ? data.endTime
    : (hasValue(data.startTime) ? data.startTime : '23:59');
  const endAt = buildDateTime(effectiveEndDate, effectiveEndTime, '23:59');

  // Return transformed data with Date objects for Prisma
  // Remove the string fields that were used for input
  const { startDate, startTime, endDate, endTime, ...rest } = data;

  return {
    ...rest,
    startAt,
    endAt,
    // Keep original string fields for reference if needed
    _originalDates: { startDate, startTime, endDate, endTime },
  };
});

/**
 * Type for the transformed create event input (output of createEventSchema)
 */
export type CreateEventInput = z.output<typeof createEventSchema>;

/**
 * Update event schema (partial, with date transformation)
 */
export const updateEventSchema = baseEventFieldsSchema.partial().extend({
  status: eventStatusSchema.optional(),
  cancelReason: z.string().max(500).trim().optional(),
}).transform((data) => {
  // If date fields are provided (and not empty), transform them to Date objects
  if (hasValue(data.startDate)) {
    const startAt = buildDateTime(data.startDate, data.startTime, '00:00');
    const effectiveEndDate = hasValue(data.endDate) ? data.endDate : data.startDate;
    const effectiveEndTime = hasValue(data.endTime)
      ? data.endTime
      : (hasValue(data.startTime) ? data.startTime : '23:59');
    const endAt = buildDateTime(effectiveEndDate, effectiveEndTime, '23:59');

    // Omit string date fields, keep other fields
    const { title, description, coverUrl, timezone, location, address, mapUrl, isOnline, onlineUrl, capacity, cost, visibility, requiresApproval, rules, tags, status, cancelReason } = data;
    return {
      title, description, coverUrl, timezone, location, address, mapUrl, isOnline, onlineUrl, capacity, cost, visibility, requiresApproval, rules, tags, status, cancelReason,
      startAt,
      endAt,
      startDate: startAt,
      endDate: endAt,
    };
  }

  // If no date fields provided, just pass through, omitting date string fields
  const { title, description, coverUrl, timezone, location, address, mapUrl, isOnline, onlineUrl, capacity, cost, visibility, requiresApproval, rules, tags, status, cancelReason } = data;
  return { title, description, coverUrl, timezone, location, address, mapUrl, isOnline, onlineUrl, capacity, cost, visibility, requiresApproval, rules, tags, status, cancelReason };
});

/**
 * Type for the transformed update event input
 */
export type UpdateEventInput = z.output<typeof updateEventSchema>;

/**
 * Event search schema
 */
export const eventSearchSchema = z.object({
  query: z.string().max(100).optional(),
  tags: z.array(z.string()).max(10).optional(),
  hostId: z.string().cuid().optional(),
  status: eventStatusSchema.optional(),
  visibility: eventVisibilitySchema.optional(),
  upcoming: z.boolean().optional(),
  isOnline: z.boolean().optional(),
  minCost: priceSchema.optional(),
  maxCost: priceSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['startAt', 'createdAt', 'title', 'cost']).default('startAt'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * RSVP schema
 */
export const rsvpSchema = z.object({
  eventId: z.string().cuid(),
  status: rsvpStatusSchema,
  note: z.string().max(500).trim().optional(),
});

/**
 * Update RSVP status schema
 */
export const updateRsvpSchema = z.object({
  eventId: z.string().cuid(),
  status: rsvpStatusSchema,
});

/**
 * Get event RSVPs schema
 */
export const getEventRsvpsSchema = z.object({
  eventId: z.string().cuid(),
  status: rsvpStatusSchema.optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

/**
 * Approve/reject RSVP schema (for host)
 */
export const moderateRsvpSchema = z.object({
  eventId: z.string().cuid(),
  userId: z.string().cuid(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).trim().optional(),
});

/**
 * Event ID schema
 */
export const eventIdSchema = z.object({
  eventId: z.string().cuid(),
});

/**
 * Event slug schema
 */
export const eventSlugSchema = z.object({
  slug: z.string().min(1).max(100),
});
