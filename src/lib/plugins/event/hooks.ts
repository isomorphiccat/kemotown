/**
 * Event Plugin Lifecycle Hooks
 * Business logic for event-specific behaviors
 */

import type { PluginHooks, ContextData, MembershipData, ActivityData } from '../types';
import type { EventPluginData } from './schema';
import { db } from '@/server/db';

/**
 * Event plugin lifecycle hooks
 */
export const eventHooks: PluginHooks<EventPluginData> = {
  /**
   * Called when an event context is created
   * Sets up initial event state
   */
  onContextCreate: async (context: ContextData, data: EventPluginData) => {
    console.log(`[EventPlugin] Event created: ${context.name}`, {
      startAt: data.startAt,
      endAt: data.endAt,
      capacity: data.capacity,
    });

    // Could create calendar entries, send notifications, etc.
  },

  /**
   * Called when event data is updated
   * Handles time/location change notifications
   */
  onContextUpdate: async (
    context: ContextData,
    data: EventPluginData,
    prevData: EventPluginData
  ) => {
    const timeChanged =
      data.startAt !== prevData.startAt || data.endAt !== prevData.endAt;
    const locationChanged =
      data.locationType !== prevData.locationType ||
      JSON.stringify(data.location) !== JSON.stringify(prevData.location);

    if (timeChanged || locationChanged) {
      console.log(`[EventPlugin] Event updated: ${context.name}`, {
        timeChanged,
        locationChanged,
      });

      // Notify attendees about changes
      // This would create an UPDATE activity addressed to attendees
    }
  },

  /**
   * Called when event is deleted/archived
   * Notifies attendees and cleans up
   */
  onContextDelete: async (context: ContextData) => {
    console.log(`[EventPlugin] Event deleted: ${context.name}`);

    // Could notify all attendees about cancellation
    // Could cancel pending payments
    // Could clean up external calendar entries
  },

  /**
   * Called when user joins event (becomes member)
   * Initializes their RSVP data
   */
  onMemberJoin: async (membership: MembershipData, context: ContextData) => {
    console.log(`[EventPlugin] User joined event: ${context.name}`, {
      memberId: membership.id,
      role: membership.role,
    });

    // Could send welcome message with event details
    // Could add to calendar
  },

  /**
   * Called when user leaves event
   * Handles RSVP cancellation
   */
  onMemberLeave: async (membership: MembershipData, context: ContextData) => {
    const eventData = membership.pluginData.event as { rsvpStatus?: string } | undefined;

    console.log(`[EventPlugin] User left event: ${context.name}`, {
      memberId: membership.id,
      previousRsvpStatus: eventData?.rsvpStatus,
    });

    // If they were attending, might need to:
    // - Process refund
    // - Move someone from waitlist
    // - Update capacity counts
  },

  /**
   * Called when activity is created in event context
   * Handles event-specific activity types
   */
  onActivityCreate: async (activity: ActivityData, context: ContextData) => {
    // Handle RSVP activities
    if (activity.type === 'RSVP') {
      console.log(`[EventPlugin] RSVP activity in ${context.name}`);
      // Could update attendee counts, check capacity, etc.
    }

    // Handle check-in activities
    if (activity.type === 'CHECKIN') {
      console.log(`[EventPlugin] Check-in at ${context.name}`);
      // Could trigger welcome notifications, badge unlocks, etc.
    }
  },

  /**
   * Validate event data before save
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateData: async (data: EventPluginData, _context: ContextData) => {
    const errors: string[] = [];

    // Validate dates
    const startDate = new Date(data.startAt);
    const endDate = new Date(data.endAt);

    if (endDate <= startDate) {
      errors.push('End date must be after start date');
    }

    // Validate registration deadline
    if (data.registrationDeadline) {
      const deadline = new Date(data.registrationDeadline);
      if (deadline > startDate) {
        errors.push('Registration deadline must be before event start');
      }
    }

    // Validate location for physical/hybrid events
    if (
      (data.locationType === 'physical' || data.locationType === 'hybrid') &&
      !data.location
    ) {
      errors.push('Physical location required for in-person events');
    }

    // Validate online URL for online/hybrid events
    if (
      (data.locationType === 'online' || data.locationType === 'hybrid') &&
      !data.onlineUrl
    ) {
      errors.push('Online URL required for virtual events');
    }

    // Validate capacity
    if (data.capacity !== undefined && data.capacity < 1) {
      errors.push('Capacity must be at least 1');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};

// =============================================================================
// RSVP Helper Functions
// =============================================================================

/**
 * Check if event has capacity for more attendees
 */
export async function checkEventCapacity(
  contextId: string
): Promise<{ available: boolean; remaining: number | null }> {
  const context = await db.context.findUnique({
    where: { id: contextId },
    select: { plugins: true },
  });

  if (!context) {
    return { available: false, remaining: null };
  }

  const plugins = context.plugins as Record<string, unknown>;
  const eventData = plugins.event as EventPluginData | undefined;

  if (!eventData?.capacity) {
    // No capacity limit
    return { available: true, remaining: null };
  }

  // Count current attendees
  const attendeeCount = await db.membership.count({
    where: {
      contextId,
      status: 'APPROVED',
      // This is a simplification - in reality we'd check pluginData.event.rsvpStatus
    },
  });

  const remaining = eventData.capacity - attendeeCount;
  return {
    available: remaining > 0,
    remaining,
  };
}

/**
 * Process waitlist when a spot opens
 */
export async function processWaitlist(contextId: string): Promise<string | null> {
  // Get first person on waitlist (oldest)
  const waitlisted = await db.membership.findFirst({
    where: {
      contextId,
      // Would need to filter by pluginData.event.rsvpStatus === 'waitlist'
      // This is a simplification
    },
    orderBy: { joinedAt: 'asc' },
  });

  if (!waitlisted) {
    return null;
  }

  // In real implementation:
  // 1. Update their RSVP status to 'attending'
  // 2. Send notification
  // 3. Create activity

  return waitlisted.userId;
}
