/**
 * Convention Plugin
 * Extends Context with convention-specific functionality:
 * - Multi-day schedule management
 * - Venue maps and navigation
 * - Dealers room directory
 * - Room party listings
 * - "Who's here" discovery
 */

import type { Plugin } from '../types';
import {
  conventionDataSchema,
  defaultConventionData,
  type ConventionPluginData,
} from './schema';
import { ConventionSidebar } from './components/ConventionSidebar';
import { ConventionCard } from './components/ConventionCard';

/**
 * Convention Plugin Definition
 */
export const conventionPlugin: Plugin<ConventionPluginData> = {
  id: 'convention',
  name: 'Convention',
  description: 'Multi-day convention with schedule, maps, dealers, and discovery',
  version: '1.0.0',

  // Only compatible with CONVENTION context type
  contextTypes: ['CONVENTION'],

  // Data validation
  dataSchema: conventionDataSchema,
  defaultData: defaultConventionData,

  // Custom activity types
  activityTypes: [
    {
      type: 'SCHEDULE_UPDATE',
      label: 'Schedule Update',
      icon: 'calendar',
      description: 'Schedule was updated',
    },
    {
      type: 'ROOM_PARTY',
      label: 'Room Party',
      icon: 'party-popper',
      description: 'Room party announcement',
    },
    {
      type: 'CON_PHOTO',
      label: 'Con Photo',
      icon: 'camera',
      description: 'Photo from the convention',
    },
    {
      type: 'CHECK_IN',
      label: 'Check In',
      icon: 'map-pin',
      description: 'User checked in at convention',
    },
  ],

  // Custom address patterns
  addressPatterns: [
    {
      pattern: 'context:{id}:staff',
      label: 'Convention Staff',
      resolver: async () => {
        // Placeholder - would check membership role
        return false;
      },
    },
    {
      pattern: 'context:{id}:here',
      label: 'Currently Here',
      resolver: async () => {
        // Placeholder - would check isHereNow in pluginData
        return false;
      },
    },
    {
      pattern: 'context:{id}:dealers',
      label: 'Dealers',
      resolver: async () => {
        // Placeholder - would check if user is in dealers list
        return false;
      },
    },
  ],

  // UI Components
  components: {
    ContextSidebar: ConventionSidebar,
    ContextCard: ConventionCard,
  },

  // Permission definitions
  permissions: [
    {
      id: 'manage_schedule',
      name: 'Manage Schedule',
      description: 'Create, edit, and delete schedule items',
      defaultRoles: ['OWNER', 'ADMIN'],
    },
    {
      id: 'manage_dealers',
      name: 'Manage Dealers',
      description: 'Add and remove dealers from the directory',
      defaultRoles: ['OWNER', 'ADMIN'],
    },
    {
      id: 'manage_maps',
      name: 'Manage Maps',
      description: 'Upload and organize venue maps',
      defaultRoles: ['OWNER', 'ADMIN'],
    },
    {
      id: 'approve_parties',
      name: 'Approve Room Parties',
      description: 'Approve or remove room party listings',
      defaultRoles: ['OWNER', 'ADMIN', 'MODERATOR'],
    },
    {
      id: 'check_in_attendees',
      name: 'Check In Attendees',
      description: 'Mark attendees as checked in at registration',
      defaultRoles: ['OWNER', 'ADMIN', 'MODERATOR'],
    },
    {
      id: 'send_announcements',
      name: 'Send Announcements',
      description: 'Send push notifications to all attendees',
      defaultRoles: ['OWNER', 'ADMIN'],
    },
  ],

  // Membership field extensions
  membershipFields: [
    {
      field: 'checkedIn',
      label: 'Checked In',
      type: 'boolean',
      defaultValue: false,
    },
    {
      field: 'checkedInAt',
      label: 'Check-in Time',
      type: 'date',
    },
    {
      field: 'isHereNow',
      label: 'Currently Here',
      type: 'boolean',
      defaultValue: false,
    },
    {
      field: 'savedScheduleItems',
      label: 'Saved Schedule Items',
      type: 'json',
      defaultValue: [],
    },
    {
      field: 'lookingFor',
      label: 'Looking For',
      type: 'json',
      defaultValue: [],
    },
    {
      field: 'availableFor',
      label: 'Available For',
      type: 'json',
      defaultValue: [],
    },
  ],
};

// Re-export types
export type {
  ConventionPluginData,
  ConventionMemberData,
  ScheduleItem,
  MapArea,
  Dealer,
  RoomParty,
} from './schema';
export { conventionDataSchema, defaultConventionData } from './schema';

// Re-export components
export * from './components';
