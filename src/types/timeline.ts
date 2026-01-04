/**
 * Timeline Types
 * Shared types for timeline components
 * These types represent the API response format from the activity router
 */

import type { JsonValue } from '@prisma/client/runtime/library';

/**
 * Actor information included with activities
 */
export interface TimelineActor {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

/**
 * Attachment included with activities
 */
export interface TimelineAttachment {
  id: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  blurhash: string | null;
}

/**
 * Activity as returned from the API
 */
export interface TimelineActivity {
  id: string;
  type: string;
  actorId: string;
  actorType: string;
  objectType: string | null;
  objectId: string | null;
  object: JsonValue;
  to: string[];
  cc: string[];
  inReplyTo: string | null;
  published: Date;
  updated: Date;
  deleted: boolean;
  deletedAt: Date | null;
  actor: TimelineActor;
  attachments: TimelineAttachment[];
  _count: {
    replies: number;
  };
}

/**
 * Timeline item as returned from timeline endpoints
 * liked/reposted may be undefined for unauthenticated users
 */
export interface TimelineItem {
  activity: TimelineActivity;
  originalActivity?: TimelineActivity;
  liked?: boolean;
  reposted?: boolean;
}

/**
 * Timeline result from API
 */
export interface TimelineResult {
  items: TimelineItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Helper to extract content from activity object
 */
export function getActivityContent(activity: TimelineActivity): string {
  if (activity.object && typeof activity.object === 'object' && 'content' in activity.object) {
    return (activity.object as { content: string }).content || '';
  }
  return '';
}
