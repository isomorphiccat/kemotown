/**
 * Event Plugin
 * Extends Context with event-specific functionality:
 * - Time-bounded gatherings
 * - RSVP management
 * - Capacity and waitlist
 * - Location (physical/online/hybrid)
 * - Payment integration
 */

import type { Plugin } from '../types';
import { eventDataSchema, defaultEventData, type EventPluginData } from './schema';
import { eventHooks } from './hooks';
import { db } from '@/server/db';
import { EventSidebar } from './components/EventSidebar';
import { EventCard } from './components/EventCard';

/**
 * Event Plugin Definition
 */
export const eventPlugin: Plugin<EventPluginData> = {
  id: 'event',
  name: 'Event',
  description: 'Time-bounded gatherings with RSVP, capacity, and location management',
  version: '1.0.0',

  // Only compatible with EVENT context type
  contextTypes: ['EVENT'],

  // Data validation
  dataSchema: eventDataSchema,
  defaultData: defaultEventData,

  // Custom activity types
  activityTypes: [
    {
      type: 'RSVP',
      label: 'RSVP',
      icon: 'calendar-check',
      description: 'User RSVPed to event',
    },
    {
      type: 'CHECKIN',
      label: 'Check-in',
      icon: 'map-pin',
      description: 'User checked in at event',
    },
    {
      type: 'EVENT_UPDATE',
      label: 'Event Update',
      icon: 'bell',
      description: 'Host posted an update about the event',
    },
  ],

  // Custom address patterns for targeting
  addressPatterns: [
    {
      pattern: 'context:{id}:hosts',
      label: 'Event Hosts',
      resolver: async (contextId: string, userId: string) => {
        const membership = await db.membership.findUnique({
          where: { contextId_userId: { contextId, userId } },
          select: { role: true, status: true },
        });
        return (
          membership?.status === 'APPROVED' &&
          (membership.role === 'OWNER' || membership.role === 'ADMIN')
        );
      },
    },
    {
      pattern: 'context:{id}:attendees',
      label: 'Confirmed Attendees',
      resolver: async (contextId: string, userId: string) => {
        const membership = await db.membership.findUnique({
          where: { contextId_userId: { contextId, userId } },
          select: { status: true, pluginData: true },
        });
        if (membership?.status !== 'APPROVED') return false;

        const pluginData = membership.pluginData as Record<string, unknown>;
        const eventData = pluginData?.event as { rsvpStatus?: string } | undefined;
        return eventData?.rsvpStatus === 'attending';
      },
    },
    {
      pattern: 'context:{id}:waitlist',
      label: 'Waitlisted',
      resolver: async (contextId: string, userId: string) => {
        const membership = await db.membership.findUnique({
          where: { contextId_userId: { contextId, userId } },
          select: { pluginData: true },
        });
        const pluginData = membership?.pluginData as Record<string, unknown>;
        const eventData = pluginData?.event as { rsvpStatus?: string } | undefined;
        return eventData?.rsvpStatus === 'waitlist';
      },
    },
  ],

  // Lifecycle hooks
  hooks: eventHooks,

  // UI Components
  components: {
    ContextSidebar: EventSidebar,
    ContextCard: EventCard,
  },

  // Permission definitions
  permissions: [
    {
      id: 'manage_rsvps',
      name: 'Manage RSVPs',
      description: 'Approve, reject, or modify attendee RSVPs',
      defaultRoles: ['OWNER', 'ADMIN'],
    },
    {
      id: 'send_updates',
      name: 'Send Updates',
      description: 'Post event updates to attendees',
      defaultRoles: ['OWNER', 'ADMIN', 'MODERATOR'],
    },
    {
      id: 'check_in',
      name: 'Check In Attendees',
      description: 'Mark attendees as arrived at the event',
      defaultRoles: ['OWNER', 'ADMIN', 'MODERATOR'],
    },
    {
      id: 'view_attendee_info',
      name: 'View Attendee Info',
      description: 'See detailed attendee information and screening answers',
      defaultRoles: ['OWNER', 'ADMIN'],
    },
    {
      id: 'manage_waitlist',
      name: 'Manage Waitlist',
      description: 'Promote users from waitlist or reorder priority',
      defaultRoles: ['OWNER', 'ADMIN'],
    },
  ],

  // Membership field extensions
  membershipFields: [
    {
      field: 'rsvpStatus',
      label: 'RSVP Status',
      type: 'enum',
      enumValues: ['pending', 'attending', 'maybe', 'not_attending', 'waitlist', 'cancelled'],
      defaultValue: 'pending',
    },
    {
      field: 'rsvpAt',
      label: 'RSVP Time',
      type: 'date',
    },
    {
      field: 'paymentStatus',
      label: 'Payment Status',
      type: 'enum',
      enumValues: ['pending', 'paid', 'refunded', 'not_required'],
      defaultValue: 'not_required',
    },
    {
      field: 'checkedInAt',
      label: 'Check-in Time',
      type: 'date',
    },
    {
      field: 'guestCount',
      label: 'Guest Count',
      type: 'number',
      defaultValue: 0,
    },
  ],
};

// Re-export types
export type { EventPluginData } from './schema';
export { eventDataSchema, defaultEventData } from './schema';
export { eventHooks, checkEventCapacity, processWaitlist } from './hooks';

// Re-export components
export * from './components';
