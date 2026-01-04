/**
 * TypeScript Type Definitions (v2)
 * Centralized type exports for the application
 */

// Re-export Prisma types that exist in v2 schema
export type {
  User,
  Activity,
  InboxItem,
  Follow,
  Attachment,
  Context,
  Membership,
  Account,
  Session,
} from '@prisma/client';

// Re-export v2 enums
export {
  ActivityType,
  ActorType,
  ObjectType,
  InboxCategory,
  FollowStatus,
  AttachmentType,
  ContextType,
  Visibility,
  JoinPolicy,
  MemberRole,
  MemberStatus,
} from '@prisma/client';

// Custom enums for features
export type NotificationType = 'FOLLOW' | 'LIKE' | 'REPOST' | 'REPLY' | 'MENTION' | 'DM' | 'EVENT' | 'GROUP' | 'SYSTEM';

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

// User types with relations
export interface UserWithCounts {
  id: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  species: string | null;
  interests: string[];
  isPublic: boolean | null;
  createdAt: Date;
  _count?: {
    followers?: number;
    following?: number;
    memberships?: number;
    ownedContexts?: number;
  };
}

export interface UserProfile extends UserWithCounts {
  fursuitPhotos: string[];
  socialLinks: Record<string, string> | null;
}

// Context types with relations (v2 unified container for events, groups, conventions)
export interface ContextWithOwner {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  type: import('@prisma/client').ContextType;
  visibility: import('@prisma/client').Visibility;
  joinPolicy: import('@prisma/client').JoinPolicy;
  plugins: Record<string, unknown>;
  features: string[];
  owner: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
  _count: {
    memberships: number;
  };
}

export interface ContextDetail extends ContextWithOwner {
  isArchived: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userMembership?: {
    id: string;
    role: import('@prisma/client').MemberRole;
    status: import('@prisma/client').MemberStatus;
  } | null;
}

// Activity types with relations
export interface ActivityWithActor {
  id: string;
  type: import('@prisma/client').ActivityType;
  actorType: import('@prisma/client').ActorType;
  objectType: import('@prisma/client').ObjectType | null;
  objectId: string | null;
  object: Record<string, unknown> | null;
  published: Date;
  likesCount: number;
  repliesCount: number;
  repostsCount: number;
  actor: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
  context?: {
    id: string;
    slug: string;
    name: string;
    type: import('@prisma/client').ContextType;
  } | null;
}

// Membership types
export interface MembershipWithUser {
  id: string;
  role: import('@prisma/client').MemberRole;
  status: import('@prisma/client').MemberStatus;
  joinedAt: Date;
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

// Notification types
export interface NotificationItem {
  id: string;
  category: import('@prisma/client').InboxCategory;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
  activity: ActivityWithActor;
}

// Comment types (for replies to activities)
export interface ReplyWithAuthor {
  id: string;
  object: {
    content: string;
  };
  published: Date;
  actor: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
  _count?: {
    replies: number;
  };
}
