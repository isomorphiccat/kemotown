/**
 * Convention Plugin Schema
 * Extends Event plugin with convention-specific features
 */

import { z } from 'zod';

// =============================================================================
// Schedule Item Schema
// =============================================================================

export const scheduleItemSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().max(100).optional(), // Room name or area
  category: z.string().max(50).optional(), // Panel, Workshop, Show, etc.
  hosts: z.array(z.string()).default([]), // User IDs
  capacity: z.number().int().min(0).optional(),
  requiresRsvp: z.boolean().default(false),
  tags: z.array(z.string().max(30)).max(5).default([]),
});

export type ScheduleItem = z.infer<typeof scheduleItemSchema>;

// =============================================================================
// Map Area Schema
// =============================================================================

export const mapAreaSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  floor: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  type: z.enum(['venue', 'dealers', 'artist_alley', 'hospitality', 'panel', 'other']),
});

export type MapArea = z.infer<typeof mapAreaSchema>;

// =============================================================================
// Dealer Schema
// =============================================================================

export const dealerSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  userId: z.string().cuid().optional(), // Linked user
  tableNumber: z.string().max(20).optional(),
  category: z.string().max(50).optional(), // Art, Merch, Crafts, etc.
  socialLinks: z.record(z.string().url()).optional(),
  imageUrl: z.string().url().optional(),
  openHours: z.string().max(200).optional(),
});

export type Dealer = z.infer<typeof dealerSchema>;

// =============================================================================
// Room Party Schema
// =============================================================================

export const roomPartySchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  hostId: z.string().cuid(),
  room: z.string().max(50).optional(), // Room number (optional for privacy)
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  isPublic: z.boolean().default(true),
  ageRestricted: z.boolean().default(false),
  tags: z.array(z.string().max(30)).max(5).default([]),
});

export type RoomParty = z.infer<typeof roomPartySchema>;

// =============================================================================
// Main Convention Data Schema
// =============================================================================

export const conventionDataSchema = z.object({
  // Multi-day schedule
  schedule: z.array(scheduleItemSchema).default([]),
  scheduleDays: z.array(z.string().datetime()).default([]), // Start of each day

  // Maps and navigation
  maps: z.array(mapAreaSchema).default([]),
  venueAddress: z.string().max(500).optional(),
  venueMapUrl: z.string().url().optional(),

  // Dealers room
  dealers: z.array(dealerSchema).default([]),
  dealersRoomHours: z.string().max(500).optional(),

  // Room parties
  roomParties: z.array(roomPartySchema).default([]),
  allowUserParties: z.boolean().default(true),

  // Discovery features
  enableWhoIsHere: z.boolean().default(true),
  whoIsHereRadius: z.number().int().min(0).max(1000).default(0), // meters, 0 = venue only

  // Convention info
  hotelInfo: z.string().max(2000).optional(),
  parkingInfo: z.string().max(1000).optional(),
  wifiInfo: z.string().max(500).optional(),
  emergencyContact: z.string().max(200).optional(),

  // Social
  enablePhotoPosts: z.boolean().default(true),
  hashTags: z.array(z.string().max(30)).max(5).default([]),
});

export type ConventionPluginData = z.infer<typeof conventionDataSchema>;

// =============================================================================
// Default Data
// =============================================================================

export const defaultConventionData: ConventionPluginData = {
  schedule: [],
  scheduleDays: [],
  maps: [],
  dealers: [],
  roomParties: [],
  allowUserParties: true,
  enableWhoIsHere: true,
  whoIsHereRadius: 0,
  enablePhotoPosts: true,
  hashTags: [],
};

// =============================================================================
// Per-Member Convention Data Schema
// =============================================================================

export const conventionMemberDataSchema = z.object({
  // Check-in status
  checkedIn: z.boolean().default(false),
  checkedInAt: z.string().datetime().optional(),

  // "Here now" status
  isHereNow: z.boolean().default(false),
  lastSeenAt: z.string().datetime().optional(),
  lastSeenLocation: z.string().max(100).optional(),

  // Schedule
  savedScheduleItems: z.array(z.string()).default([]), // Schedule item IDs
  notifyBefore: z.number().int().min(0).max(60).default(15), // Minutes before event

  // Social
  lookingFor: z.array(z.string().max(30)).max(5).default([]), // e.g., "roommates", "carpool"
  availableFor: z.array(z.string().max(30)).max(5).default([]), // e.g., "commissions", "trades"
});

export type ConventionMemberData = z.infer<typeof conventionMemberDataSchema>;

export const defaultConventionMemberData: ConventionMemberData = {
  checkedIn: false,
  isHereNow: false,
  savedScheduleItems: [],
  notifyBefore: 15,
  lookingFor: [],
  availableFor: [],
};
