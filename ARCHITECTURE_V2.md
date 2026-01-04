# Kemotown v2 Architecture: Timeline-Centric Social Network

**Version:** 2.0
**Date:** January 2, 2026
**Status:** Planning Phase

---

## Table of Contents

1. [Vision & Philosophy](#1-vision--philosophy)
2. [Core Concepts](#2-core-concepts)
3. [Data Model](#3-data-model)
4. [Plugin System](#4-plugin-system)
5. [Addressing & Visibility](#5-addressing--visibility)
6. [API Architecture](#6-api-architecture)
7. [UI/UX Architecture](#7-uiux-architecture)
8. [Real-time System](#8-real-time-system)
9. [Migration Strategy](#9-migration-strategy)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. Vision & Philosophy

### 1.1 Mission Statement

Kemotown v2 transforms from an "event platform with social features" to a **"social network with event capabilities"**. The timeline becomes the primary interface through which all community interaction flows.

### 1.2 Design Principles

| Principle | Description |
|-----------|-------------|
| **Timeline-First** | Every interaction surfaces in a timeline. Users scroll, discover, and engage through feeds. |
| **Context-Agnostic Core** | The core system doesn't distinguish between user posts, event updates, or group discussions—they're all Activities in Contexts. |
| **Plugin Architecture** | Features like events, groups, and conventions are plugins that extend the core without modifying it. |
| **Progressive Disclosure** | Simple by default, powerful when needed. New users see a Twitter-like experience; power users unlock advanced features. |
| **Federation-Ready** | Use ActivityPub vocabulary internally, making future Fediverse integration possible without architectural changes. |
| **Mobile-Native Thinking** | Design for thumb-first mobile interaction, then adapt to desktop. |

### 1.3 Inspirations

- **Mastodon**: ActivityPub foundation, timeline focus, content warnings
- **Barq!**: Furry-specific UX, multi-character profiles, convention mode, discovery
- **Discord**: Server/channel model → Context/timeline model
- **Twitter/X**: Timeline UX, quote posts, engagement patterns

---

## 2. Core Concepts

### 2.1 The Four Pillars

```
┌─────────────────────────────────────────────────────────────────────┐
│                          KEMOTOWN v2                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐  │
│   │   ACTIVITY   │  │   CONTEXT    │  │    ACTOR     │  │ PLUGIN │  │
│   │              │  │              │  │              │  │        │  │
│   │  The atomic  │  │  Container   │  │  Who does    │  │ Feature│  │
│   │  unit of     │  │  for related │  │  things      │  │ modules│  │
│   │  content     │  │  activities  │  │  (user/bot)  │  │        │  │
│   └──────────────┘  └──────────────┘  └──────────────┘  └────────┘  │
│                                                                      │
│   - CREATE        - USER (implicit) - User           - Event        │
│   - LIKE          - GROUP           - Bot            - Group        │
│   - ANNOUNCE      - EVENT           - System         - Convention   │
│   - FOLLOW        - CONVENTION                       - Poll         │
│   - etc.          - CHANNEL                          - Media        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Concept Definitions

#### Activity
The atomic unit of content. Everything that happens is an Activity:
- A user posts text → `CREATE` Activity with `NOTE` object
- A user likes a post → `LIKE` Activity targeting another Activity
- A user RSVPs to an event → `RSVP` Activity (plugin-defined type)
- A bot announces something → `CREATE` Activity with `actorType: BOT`

#### Context
A container that groups related Activities. Contexts have:
- Their own timeline (filtered view of Activities addressed to them)
- Members with roles
- Plugin configurations
- Visibility settings

Types:
- **USER**: Implicit context (every user has a personal timeline)
- **GROUP**: Persistent community space
- **EVENT**: Time-bounded gathering
- **CONVENTION**: Special event mode with enhanced features
- **CHANNEL**: Topic-based discussion (future)

#### Actor
Who performs Activities:
- **USER**: Human user
- **BOT**: Automated accounts (event bots, moderation bots)
- **SYSTEM**: Platform-generated (welcome messages, announcements)

#### Plugin
Feature modules that extend Contexts:
- Define new Activity types
- Add UI components
- Provide API endpoints
- Store plugin-specific data

---

## 3. Data Model

### 3.1 Schema Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA MODEL                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐         │
│  │    User     │──────│  Activity   │──────│  Context    │         │
│  └─────────────┘      └─────────────┘      └─────────────┘         │
│        │                    │                    │                   │
│        │              ┌─────┴─────┐              │                   │
│        │              │           │              │                   │
│        │         ┌────┴───┐ ┌─────┴────┐   ┌────┴────┐             │
│        │         │InboxItem│ │Attachment│   │Membership│             │
│        │         └────────┘ └──────────┘   └─────────┘             │
│        │                                                             │
│   ┌────┴────┐                                                       │
│   │ Follow  │                                                       │
│   └─────────┘                                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Core Models

#### 3.2.1 User (Extended)

```prisma
model User {
  id                     String    @id @default(cuid())

  // === Identity ===
  username               String    @unique
  email                  String?   @unique
  emailVerified          DateTime?

  // === Profile ===
  displayName            String?
  bio                    String?   @db.Text
  avatarUrl              String?
  bannerUrl              String?

  // === Furry-Specific ===
  species                String?
  characters             Json?     // Character[] - multiple fursonas
  fursuitPhotos          String[]  @default([])

  // === Social ===
  socialLinks            Json?     // { twitter, telegram, etc. }
  interests              String[]  @default([])
  languages              String[]  @default(["ko"])  // NEW: spoken languages
  lookingFor             LookingFor? // NEW: relationship status

  // === Discovery ===
  isPublic               Boolean   @default(true)
  isDiscoverable         Boolean   @default(true)   // NEW: show in search
  approximateLocation    Json?     // NEW: { lat, lng, city } for nearby discovery
  lastLocationUpdate     DateTime?

  // === Preferences ===
  locale                 String    @default("ko")
  theme                  Json?     // NEW: { primaryColor, accentColor, font }
  requiresFollowApproval Boolean   @default(false)

  // === Verification ===
  isAgeVerified          Boolean   @default(false)  // NEW: 18+ verified
  verifiedAt             DateTime?

  // === Activity ===
  lastActiveAt           DateTime  @default(now())
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  // === Relations ===
  activities             Activity[]       @relation("ActorActivities")
  memberships            Membership[]
  inboxItems             InboxItem[]
  attachments            Attachment[]
  followers              Follow[]         @relation("Followers")
  following              Follow[]         @relation("Following")
  ownedContexts          Context[]        @relation("ContextOwner")
  accounts               Account[]
  sessions               Session[]
}

enum LookingFor {
  NOT_LOOKING
  FRIENDS
  RELATIONSHIP
  OPEN
}
```

#### 3.2.2 Context (NEW - Central Entity)

```prisma
/// Context is the core container for grouped activities
/// Events, Groups, Conventions are all Contexts with different plugins
model Context {
  id          String      @id @default(cuid())

  // === Identity ===
  type        ContextType
  slug        String      @unique  // URL-friendly identifier
  handle      String?     @unique  // @handle for mentions (optional)

  // === Display ===
  name        String
  description String?     @db.Text
  avatarUrl   String?
  bannerUrl   String?

  // === Ownership ===
  ownerId     String
  owner       User        @relation("ContextOwner", fields: [ownerId], references: [id])

  // === Visibility & Access ===
  visibility  Visibility  @default(PUBLIC)
  joinPolicy  JoinPolicy  @default(OPEN)

  // === Plugin Data ===
  // Stores plugin-specific configuration as JSON
  // Each plugin defines its own schema
  plugins     Json        @default("{}")

  // === Feature Flags ===
  features    String[]    @default([])  // Enabled plugin IDs

  // === Addressing ===
  // Activities can be addressed to:
  // - "context:{id}" - all members
  // - "context:{id}:admins" - admins only
  // - "context:{id}:role:{roleId}" - specific role

  // === State ===
  isArchived  Boolean     @default(false)
  archivedAt  DateTime?

  // === Timestamps ===
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // === Relations ===
  memberships Membership[]

  // === Indexes ===
  @@index([type])
  @@index([ownerId])
  @@index([visibility])
  @@index([createdAt])
}

enum ContextType {
  GROUP       // Persistent community
  EVENT       // Time-bounded gathering
  CONVENTION  // Multi-day event with enhanced features
  CHANNEL     // Topic-based discussion (future)
}

enum Visibility {
  PUBLIC      // Anyone can see content
  PRIVATE     // Members only
  UNLISTED    // Not in discovery, but accessible via link
}

enum JoinPolicy {
  OPEN        // Anyone can join
  APPROVAL    // Requires admin approval
  INVITE      // Invite only
  CLOSED      // No new members
}
```

#### 3.2.3 Membership (NEW)

```prisma
/// Tracks user membership in Contexts
model Membership {
  id          String          @id @default(cuid())

  // === Relations ===
  contextId   String
  context     Context         @relation(fields: [contextId], references: [id], onDelete: Cascade)

  userId      String
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  // === Role & Status ===
  role        MemberRole      @default(MEMBER)
  status      MemberStatus    @default(APPROVED)

  // === Permissions (bitmask or explicit) ===
  permissions Json?           // Custom permissions override

  // === Notifications ===
  notifyPosts     Boolean     @default(true)
  notifyMentions  Boolean     @default(true)
  notifyEvents    Boolean     @default(true)  // For event updates

  // === Plugin-Specific Data ===
  // E.g., for events: RSVP status, payment status
  pluginData  Json            @default("{}")

  // === Audit ===
  joinedAt    DateTime        @default(now())
  approvedAt  DateTime?
  approvedBy  String?         // User ID who approved

  // === Constraints ===
  @@unique([contextId, userId])
  @@index([contextId, role])
  @@index([userId])
  @@index([status])
}

enum MemberRole {
  OWNER       // Full control, can delete context
  ADMIN       // Full control except deletion
  MODERATOR   // Can manage members and content
  MEMBER      // Can post and interact
  GUEST       // Can view only (for private contexts)
}

enum MemberStatus {
  PENDING     // Awaiting approval
  APPROVED    // Active member
  BANNED      // Removed from context
  LEFT        // Voluntarily left
}
```

#### 3.2.4 Activity (Enhanced)

```prisma
/// Activity represents any action in the system
/// Uses ActivityPub vocabulary for future federation compatibility
model Activity {
  id          String        @id @default(cuid())

  // === Activity Type ===
  type        ActivityType

  // === Actor ===
  actorId     String
  actorType   ActorType     @default(USER)
  actor       User          @relation("ActorActivities", fields: [actorId], references: [id], onDelete: Cascade)

  // === Object ===
  objectType  ObjectType?
  objectId    String?       // Reference to another entity
  object      Json?         // Embedded object data

  // === Target (for Add/Remove actions) ===
  targetId    String?
  targetType  String?

  // === Addressing ===
  // Primary recipients - determines visibility
  to          String[]      @default([])
  // Secondary recipients - notified but not primary audience
  cc          String[]      @default([])

  // Address formats:
  // - "public" - visible to everyone
  // - "followers" - actor's followers
  // - "user:{cuid}" - specific user
  // - "context:{cuid}" - context members
  // - "context:{cuid}:admins" - context admins
  // - "context:{cuid}:role:{roleId}" - specific role

  // === Threading ===
  inReplyTo   String?       // Activity ID this replies to
  threadRoot  String?       // NEW: Root of thread for efficient queries
  parent      Activity?     @relation("Replies", fields: [inReplyTo], references: [id], onDelete: SetNull)
  replies     Activity[]    @relation("Replies")

  // === Context Reference ===
  // Denormalized for efficient queries
  contextId   String?       // NEW: Primary context this belongs to

  // === Content Metadata ===
  sensitive   Boolean       @default(false)  // Content warning
  summary     String?       // CW text / spoiler text
  language    String?       // ISO language code

  // === Engagement Counts (Denormalized) ===
  likesCount    Int         @default(0)
  repliesCount  Int         @default(0)
  repostsCount  Int         @default(0)

  // === State ===
  deleted     Boolean       @default(false)
  deletedAt   DateTime?
  editedAt    DateTime?     // NEW: Track edits

  // === Timestamps ===
  published   DateTime      @default(now())
  updated     DateTime      @updatedAt

  // === Relations ===
  inboxItems  InboxItem[]
  attachments Attachment[]

  // === Indexes ===
  @@index([actorId])
  @@index([contextId, published])
  @@index([type])
  @@index([objectType, objectId])
  @@index([inReplyTo])
  @@index([threadRoot])
  @@index([deleted, published])
}

enum ActivityType {
  // Core ActivityPub types
  CREATE      // Create new content
  UPDATE      // Edit content
  DELETE      // Remove content (soft delete)
  LIKE        // React to content
  ANNOUNCE    // Repost/boost
  FOLLOW      // Follow user
  ACCEPT      // Accept follow request
  REJECT      // Reject follow request
  UNDO        // Undo previous action

  // Extended types for plugins
  JOIN        // Join a context
  LEAVE       // Leave a context
  INVITE      // Invite to context

  // Event plugin types
  RSVP        // Event attendance response
  CHECKIN     // "I'm here" at event

  // Moderation types
  FLAG        // Report content
  BLOCK       // Block user
}

enum ActorType {
  USER
  BOT
  SYSTEM
}

enum ObjectType {
  NOTE        // Text post
  IMAGE       // Image post
  VIDEO       // Video post
  ARTICLE     // Long-form content
  EVENT       // Event object
  POLL        // Poll object
  ACTIVITY    // Reference to another activity
  USER        // User reference (for follows)
  CONTEXT     // Context reference
}
```

#### 3.2.5 InboxItem (Enhanced)

```prisma
/// Tracks delivery of activities to user inboxes
/// Used for notifications and DM tracking
model InboxItem {
  id          String        @id @default(cuid())

  // === Recipient ===
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  // === Activity ===
  activityId  String
  activity    Activity      @relation(fields: [activityId], references: [id], onDelete: Cascade)

  // === Categorization ===
  category    InboxCategory @default(DEFAULT)

  // === State ===
  read        Boolean       @default(false)
  readAt      DateTime?     // NEW: When was it read
  muted       Boolean       @default(false)

  // === Priority ===
  // Used for notification ordering and filtering
  priority    Int           @default(0)  // Higher = more important

  // === Timestamps ===
  createdAt   DateTime      @default(now())

  // === Constraints ===
  @@unique([userId, activityId])
  @@index([userId, read, createdAt])
  @@index([userId, category])
  @@index([createdAt])
}

enum InboxCategory {
  DEFAULT     // General timeline activity
  MENTION     // Someone mentioned you
  DM          // Direct message
  FOLLOW      // New follower
  LIKE        // Someone liked your content
  REPOST      // Someone reposted your content
  REPLY       // Someone replied to you
  EVENT       // Event-related (RSVP, updates)
  GROUP       // Group-related (invites, approvals)
  SYSTEM      // System notifications
}
```

### 3.3 Plugin Data Schemas

Plugins store their configuration in `Context.plugins` JSON field. Each plugin defines a TypeScript interface for its data:

#### 3.3.1 Event Plugin Data

```typescript
interface EventPluginData {
  // === Timing ===
  startAt: string;      // ISO datetime
  endAt: string;        // ISO datetime
  timezone: string;     // IANA timezone
  isAllDay: boolean;

  // === Location ===
  locationType: 'physical' | 'online' | 'hybrid';
  location?: {
    name: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
    mapUrl?: string;        // Naver/Kakao map link
    isPublic: boolean;      // Show to non-attendees?
  };
  onlineUrl?: string;       // Zoom/Discord link

  // === Capacity & Registration ===
  capacity?: number;
  registrationDeadline?: string;

  // === Payment (Toss Integration) ===
  cost: number;             // 0 for free events
  currency: string;         // KRW
  paymentRequired: boolean;
  tossPaymentConfig?: {
    sellerId: string;
    productName: string;
  };

  // === RSVP Options ===
  rsvpOptions: ('attending' | 'maybe' | 'not_attending')[];
  requiresApproval: boolean;
  screeningQuestions?: string[];

  // === Event Features ===
  hasWaitlist: boolean;
  allowGuestPlus: boolean;  // Bring +1
  maxGuestsPerRsvp: number;

  // === Display ===
  tags: string[];
  rules?: string;           // Markdown
}
```

#### 3.3.2 Group Plugin Data

```typescript
interface GroupPluginData {
  // === Group Type ===
  groupType: 'community' | 'interest' | 'regional' | 'species';

  // === Rules & Guidelines ===
  rules: string[];          // List of rules
  guidelines?: string;      // Markdown

  // === Moderation ===
  autoModeration: {
    enabled: boolean;
    bannedWords: string[];
    linkPolicy: 'allow' | 'approval' | 'block';
    mediaPolicy: 'allow' | 'approval' | 'block';
  };

  // === Posting ===
  allowedPostTypes: ObjectType[];
  requirePostApproval: boolean;
  slowModeSeconds: number;  // 0 for disabled

  // === Discovery ===
  category?: string;
  tags: string[];
  isNsfw: boolean;

  // === Member Settings ===
  showMemberList: boolean;
  showMemberCount: boolean;
}
```

#### 3.3.3 Convention Plugin Data (extends Event)

```typescript
interface ConventionPluginData extends EventPluginData {
  // === Venue ===
  venue: {
    name: string;
    floors?: { id: string; name: string; mapUrl?: string }[];
  };

  // === Schedule ===
  schedule: {
    id: string;
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
    location?: string;      // Room/floor
    hosts?: string[];       // User IDs
    tags?: string[];
  }[];

  // === Room Parties ===
  roomPartiesEnabled: boolean;
  roomParties: {
    id: string;
    title: string;
    hostId: string;
    location: string;
    startAt: string;
    endAt?: string;
    capacity?: number;
    isPublic: boolean;
  }[];

  // === Discovery Features ===
  attendeeDiscovery: {
    enabled: boolean;
    showOnlineStatus: boolean;
    showLocation: boolean;  // "Floor 2" type location
    allowMessaging: boolean;
  };

  // === Special Features ===
  dealersRoom?: {
    enabled: boolean;
    vendors: { id: string; name: string; booth: string }[];
  };
}
```

---

## 4. Plugin System

### 4.1 Plugin Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PLUGIN ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    Plugin Registry                           │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│   │  │  Event  │ │  Group  │ │  Conv   │ │  Poll   │  ...      │   │
│   │  │ Plugin  │ │ Plugin  │ │ Plugin  │ │ Plugin  │           │   │
│   │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │   │
│   └───────┼──────────┼──────────┼──────────┼────────────────────┘   │
│           │          │          │          │                         │
│           ▼          ▼          ▼          ▼                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    Plugin Interface                          │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  • id: string                                                │   │
│   │  • name: string                                              │   │
│   │  • contextTypes: ContextType[]                               │   │
│   │  • dataSchema: ZodSchema                                     │   │
│   │  • activityTypes: ActivityType[]                             │   │
│   │  • routes: TRPCRouter                                        │   │
│   │  • components: ComponentMap                                  │   │
│   │  • hooks: HookMap                                            │   │
│   │  • permissions: PermissionDefinition[]                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Plugin Interface

```typescript
// src/lib/plugins/types.ts

import type { TRPCRouter } from '@/server/trpc';
import type { z } from 'zod';
import type { ContextType, ActivityType, MemberRole } from '@prisma/client';
import type { ComponentType } from 'react';

/**
 * Plugin definition interface
 */
export interface Plugin<TData = unknown> {
  /** Unique plugin identifier */
  id: string;

  /** Display name */
  name: string;

  /** Plugin description */
  description: string;

  /** Plugin version */
  version: string;

  /** Which context types can use this plugin */
  contextTypes: ContextType[];

  /** Zod schema for plugin data validation */
  dataSchema: z.ZodSchema<TData>;

  /** Default plugin data for new contexts */
  defaultData: TData;

  /** Custom activity types this plugin introduces */
  activityTypes?: {
    type: string;
    label: string;
    icon: string;
  }[];

  /** Custom addressing patterns */
  addressPatterns?: {
    pattern: string;  // e.g., "context:{id}:hosts"
    label: string;
    resolver: (contextId: string, userId: string) => Promise<boolean>;
  }[];

  /** API routes */
  routes?: TRPCRouter;

  /** React components */
  components: PluginComponents;

  /** Lifecycle hooks */
  hooks?: PluginHooks<TData>;

  /** Permission definitions */
  permissions?: PluginPermission[];

  /** Membership extensions */
  membershipFields?: {
    field: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
    enumValues?: string[];
    defaultValue?: unknown;
  }[];
}

/**
 * Plugin UI components
 */
export interface PluginComponents {
  /** Header section in context page */
  ContextHeader?: ComponentType<{ context: Context; membership?: Membership }>;

  /** Sidebar widgets */
  ContextSidebar?: ComponentType<{ context: Context; membership?: Membership }>;

  /** Context settings panel */
  ContextSettings?: ComponentType<{ context: Context }>;

  /** Additional post actions */
  PostActions?: ComponentType<{ activity: Activity; context: Context }>;

  /** Custom post renderer for plugin activity types */
  PostRenderer?: ComponentType<{ activity: Activity }>;

  /** Member card extension */
  MemberCard?: ComponentType<{ membership: Membership }>;

  /** Context card in listings */
  ContextCard?: ComponentType<{ context: Context }>;

  /** Context creation form fields */
  CreateForm?: ComponentType<{
    data: unknown;
    onChange: (data: unknown) => void;
    errors?: Record<string, string>;
  }>;
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks<TData> {
  /** Called when context is created */
  onContextCreate?: (context: Context, data: TData) => Promise<void>;

  /** Called when context is updated */
  onContextUpdate?: (context: Context, data: TData, prevData: TData) => Promise<void>;

  /** Called when context is deleted */
  onContextDelete?: (context: Context) => Promise<void>;

  /** Called when user joins context */
  onMemberJoin?: (membership: Membership, context: Context) => Promise<void>;

  /** Called when user leaves context */
  onMemberLeave?: (membership: Membership, context: Context) => Promise<void>;

  /** Called when activity is created in context */
  onActivityCreate?: (activity: Activity, context: Context) => Promise<void>;

  /** Validate plugin data before save */
  validateData?: (data: TData, context: Context) => Promise<{ valid: boolean; errors?: string[] }>;
}

/**
 * Plugin permission definition
 */
export interface PluginPermission {
  id: string;
  name: string;
  description: string;
  defaultRoles: MemberRole[];  // Which roles have this by default
}
```

### 4.3 Event Plugin Implementation

```typescript
// src/lib/plugins/event/index.ts

import { z } from 'zod';
import type { Plugin } from '../types';
import { eventRouter } from './routes';
import { EventHeader, EventSidebar, EventSettings, RSVPButton } from './components';

const eventDataSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().default('Asia/Seoul'),
  isAllDay: z.boolean().default(false),

  locationType: z.enum(['physical', 'online', 'hybrid']),
  location: z.object({
    name: z.string(),
    address: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    mapUrl: z.string().url().optional(),
    isPublic: z.boolean().default(false),
  }).optional(),
  onlineUrl: z.string().url().optional(),

  capacity: z.number().min(1).optional(),
  registrationDeadline: z.string().datetime().optional(),

  cost: z.number().min(0).default(0),
  currency: z.string().default('KRW'),
  paymentRequired: z.boolean().default(false),

  rsvpOptions: z.array(z.enum(['attending', 'maybe', 'not_attending'])).default(['attending', 'not_attending']),
  requiresApproval: z.boolean().default(false),
  screeningQuestions: z.array(z.string()).optional(),

  hasWaitlist: z.boolean().default(true),
  allowGuestPlus: z.boolean().default(false),
  maxGuestsPerRsvp: z.number().min(0).default(0),

  tags: z.array(z.string()).default([]),
  rules: z.string().optional(),
});

export type EventPluginData = z.infer<typeof eventDataSchema>;

export const eventPlugin: Plugin<EventPluginData> = {
  id: 'event',
  name: 'Event',
  description: 'Time-bounded gatherings with RSVP, capacity, and location',
  version: '1.0.0',

  contextTypes: ['EVENT'],

  dataSchema: eventDataSchema,

  defaultData: {
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // +3 hours
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
  },

  activityTypes: [
    { type: 'RSVP', label: 'RSVP', icon: 'calendar-check' },
    { type: 'CHECKIN', label: 'Check-in', icon: 'map-pin' },
  ],

  addressPatterns: [
    {
      pattern: 'context:{id}:hosts',
      label: 'Event Hosts',
      resolver: async (contextId, userId) => {
        const membership = await db.membership.findUnique({
          where: { contextId_userId: { contextId, userId } },
        });
        return membership?.role === 'OWNER' || membership?.role === 'ADMIN';
      },
    },
    {
      pattern: 'context:{id}:attendees',
      label: 'Confirmed Attendees',
      resolver: async (contextId, userId) => {
        const membership = await db.membership.findUnique({
          where: { contextId_userId: { contextId, userId } },
        });
        const pluginData = membership?.pluginData as { rsvpStatus?: string };
        return pluginData?.rsvpStatus === 'attending';
      },
    },
  ],

  routes: eventRouter,

  components: {
    ContextHeader: EventHeader,
    ContextSidebar: EventSidebar,
    ContextSettings: EventSettings,
    PostActions: RSVPButton,
  },

  hooks: {
    onMemberJoin: async (membership, context) => {
      // Set default RSVP status
      await db.membership.update({
        where: { id: membership.id },
        data: {
          pluginData: {
            ...(membership.pluginData as object),
            rsvpStatus: 'pending',
            rsvpAt: new Date().toISOString(),
          },
        },
      });
    },

    validateData: async (data, context) => {
      const errors: string[] = [];

      if (new Date(data.startAt) >= new Date(data.endAt)) {
        errors.push('End time must be after start time');
      }

      if (data.registrationDeadline && new Date(data.registrationDeadline) > new Date(data.startAt)) {
        errors.push('Registration deadline must be before event start');
      }

      return { valid: errors.length === 0, errors };
    },
  },

  permissions: [
    { id: 'manage_rsvps', name: 'Manage RSVPs', description: 'Approve/reject RSVPs', defaultRoles: ['OWNER', 'ADMIN'] },
    { id: 'send_updates', name: 'Send Updates', description: 'Post event updates', defaultRoles: ['OWNER', 'ADMIN', 'MODERATOR'] },
    { id: 'check_in', name: 'Check In Attendees', description: 'Mark attendees as arrived', defaultRoles: ['OWNER', 'ADMIN', 'MODERATOR'] },
  ],

  membershipFields: [
    { field: 'rsvpStatus', label: 'RSVP Status', type: 'enum', enumValues: ['pending', 'attending', 'maybe', 'not_attending', 'waitlist'], defaultValue: 'pending' },
    { field: 'rsvpAt', label: 'RSVP Time', type: 'date' },
    { field: 'paymentStatus', label: 'Payment', type: 'enum', enumValues: ['pending', 'paid', 'refunded', 'not_required'], defaultValue: 'not_required' },
    { field: 'checkedInAt', label: 'Check-in Time', type: 'date' },
    { field: 'guestCount', label: 'Guest Count', type: 'number', defaultValue: 0 },
  ],
};
```

### 4.4 Plugin Registry

```typescript
// src/lib/plugins/registry.ts

import type { Plugin } from './types';
import { eventPlugin } from './event';
import { groupPlugin } from './group';
import { conventionPlugin } from './convention';
import { pollPlugin } from './poll';

/**
 * Central registry of all available plugins
 */
class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already registered`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  getForContextType(type: ContextType): Plugin[] {
    return Array.from(this.plugins.values())
      .filter(p => p.contextTypes.includes(type));
  }

  all(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Merge all plugin routes into a single router
   */
  getMergedRouter(): TRPCRouter {
    const routers: Record<string, TRPCRouter> = {};

    for (const plugin of this.plugins.values()) {
      if (plugin.routes) {
        routers[plugin.id] = plugin.routes;
      }
    }

    return createTRPCRouter(routers);
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();

// Register built-in plugins
pluginRegistry.register(eventPlugin);
pluginRegistry.register(groupPlugin);
pluginRegistry.register(conventionPlugin);
pluginRegistry.register(pollPlugin);
```

---

## 5. Addressing & Visibility

### 5.1 Unified Addressing System

The addressing system determines who can see an Activity and who gets notified.

```typescript
// src/lib/addressing/types.ts

/**
 * Address types and their semantics
 */
export type Address =
  | 'public'                          // Everyone can see
  | 'followers'                       // Actor's followers
  | `user:${string}`                  // Specific user
  | `context:${string}`               // Context members
  | `context:${string}:admins`        // Context admins
  | `context:${string}:role:${string}` // Specific role in context
  | `context:${string}:${string}`;    // Plugin-defined patterns

/**
 * Parse an address string
 */
export function parseAddress(address: string): ParsedAddress {
  if (address === 'public') {
    return { type: 'public' };
  }

  if (address === 'followers') {
    return { type: 'followers' };
  }

  if (address.startsWith('user:')) {
    return { type: 'user', id: address.slice(5) };
  }

  if (address.startsWith('context:')) {
    const parts = address.slice(8).split(':');
    return {
      type: 'context',
      id: parts[0],
      modifier: parts.slice(1).join(':') || undefined,
    };
  }

  return { type: 'unknown', raw: address };
}

interface ParsedAddress {
  type: 'public' | 'followers' | 'user' | 'context' | 'unknown';
  id?: string;
  modifier?: string;
  raw?: string;
}
```

### 5.2 Visibility Resolution

```typescript
// src/lib/addressing/visibility.ts

/**
 * Check if a user can see an activity
 */
export async function canSeeActivity(
  activity: Activity,
  userId: string | null
): Promise<boolean> {
  const allAddresses = [...activity.to, ...activity.cc];

  // Public is always visible
  if (allAddresses.includes('public')) {
    return true;
  }

  // Must be logged in for non-public
  if (!userId) {
    return false;
  }

  // Actor can always see their own
  if (activity.actorId === userId) {
    return true;
  }

  for (const address of allAddresses) {
    const parsed = parseAddress(address);

    switch (parsed.type) {
      case 'user':
        if (parsed.id === userId) return true;
        break;

      case 'followers':
        if (await isFollowing(userId, activity.actorId)) return true;
        break;

      case 'context':
        if (await canAccessContextAddress(userId, parsed.id!, parsed.modifier)) {
          return true;
        }
        break;
    }
  }

  return false;
}

/**
 * Check if user can access a context address
 */
async function canAccessContextAddress(
  userId: string,
  contextId: string,
  modifier?: string
): Promise<boolean> {
  const membership = await db.membership.findUnique({
    where: { contextId_userId: { contextId, userId } },
  });

  if (!membership || membership.status !== 'APPROVED') {
    return false;
  }

  // No modifier = any member
  if (!modifier) {
    return true;
  }

  // Admin modifier
  if (modifier === 'admins') {
    return ['OWNER', 'ADMIN'].includes(membership.role);
  }

  // Role modifier
  if (modifier.startsWith('role:')) {
    const requiredRole = modifier.slice(5);
    return membership.role === requiredRole;
  }

  // Check plugin-defined patterns
  const context = await db.context.findUnique({ where: { id: contextId } });
  if (!context) return false;

  for (const pluginId of context.features) {
    const plugin = pluginRegistry.get(pluginId);
    if (!plugin?.addressPatterns) continue;

    for (const pattern of plugin.addressPatterns) {
      const patternModifier = pattern.pattern.replace(`context:{id}:`, '');
      if (patternModifier === modifier) {
        return await pattern.resolver(contextId, userId);
      }
    }
  }

  return false;
}
```

### 5.3 Delivery Logic

```typescript
// src/lib/addressing/delivery.ts

/**
 * Deliver an activity to all recipients' inboxes
 */
export async function deliverActivity(activity: Activity): Promise<void> {
  const recipients = new Set<string>();

  for (const address of [...activity.to, ...activity.cc]) {
    const parsed = parseAddress(address);

    switch (parsed.type) {
      case 'public':
        // Public activities don't need inbox delivery
        // Users query the public timeline instead
        break;

      case 'followers':
        const followers = await db.follow.findMany({
          where: { followingId: activity.actorId, status: 'ACCEPTED' },
          select: { followerId: true },
        });
        followers.forEach(f => recipients.add(f.followerId));
        break;

      case 'user':
        if (parsed.id) recipients.add(parsed.id);
        break;

      case 'context':
        const contextRecipients = await resolveContextRecipients(
          parsed.id!,
          parsed.modifier
        );
        contextRecipients.forEach(id => recipients.add(id));
        break;
    }
  }

  // Never deliver to the actor themselves
  recipients.delete(activity.actorId);

  if (recipients.size === 0) return;

  // Create inbox items
  await db.inboxItem.createMany({
    data: [...recipients].map(userId => ({
      userId,
      activityId: activity.id,
      category: determineCategory(activity, userId),
    })),
    skipDuplicates: true,
  });
}

/**
 * Resolve context address to user IDs
 */
async function resolveContextRecipients(
  contextId: string,
  modifier?: string
): Promise<string[]> {
  let where: Prisma.MembershipWhereInput = {
    contextId,
    status: 'APPROVED',
  };

  if (modifier === 'admins') {
    where.role = { in: ['OWNER', 'ADMIN'] };
  } else if (modifier?.startsWith('role:')) {
    where.role = modifier.slice(5) as MemberRole;
  }

  const memberships = await db.membership.findMany({
    where,
    select: { userId: true },
  });

  return memberships.map(m => m.userId);
}
```

---

## 6. API Architecture

### 6.1 Router Structure

```
src/server/api/
├── root.ts                 # Main router aggregation
├── trpc.ts                 # tRPC configuration
└── routers/
    ├── context.ts          # Context CRUD & membership
    ├── activity.ts         # Activity CRUD & timelines
    ├── user.ts             # User profiles & settings
    ├── follow.ts           # Follow relationships
    ├── dm.ts               # Direct messages
    ├── inbox.ts            # Notifications
    ├── upload.ts           # File uploads
    └── plugins/
        ├── event.ts        # Event-specific procedures
        ├── group.ts        # Group-specific procedures
        └── convention.ts   # Convention-specific procedures
```

### 6.2 Context Router

```typescript
// src/server/api/routers/context.ts

export const contextRouter = createTRPCRouter({
  // === CRUD ===

  create: protectedProcedure
    .input(createContextSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate plugin data
      const plugin = pluginRegistry.get(input.pluginId);
      if (!plugin) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid plugin' });

      const validatedPluginData = plugin.dataSchema.parse(input.pluginData);

      // Create context with owner membership
      const context = await ctx.db.$transaction(async (tx) => {
        const context = await tx.context.create({
          data: {
            type: input.type,
            slug: generateSlug(input.name),
            name: input.name,
            description: input.description,
            visibility: input.visibility,
            joinPolicy: input.joinPolicy,
            ownerId: ctx.session.user.id,
            plugins: { [input.pluginId]: validatedPluginData },
            features: [input.pluginId],
          },
        });

        // Create owner membership
        await tx.membership.create({
          data: {
            contextId: context.id,
            userId: ctx.session.user.id,
            role: 'OWNER',
            status: 'APPROVED',
            approvedAt: new Date(),
          },
        });

        return context;
      });

      // Run plugin hook
      await plugin.hooks?.onContextCreate?.(context, validatedPluginData);

      return context;
    }),

  update: protectedProcedure
    .input(updateContextSchema)
    .mutation(async ({ ctx, input }) => {
      const context = await ctx.db.context.findUnique({
        where: { id: input.contextId },
        include: { memberships: { where: { userId: ctx.session.user.id } } },
      });

      if (!context) throw new TRPCError({ code: 'NOT_FOUND' });

      const membership = context.memberships[0];
      if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Update context
      const updated = await ctx.db.context.update({
        where: { id: input.contextId },
        data: {
          name: input.name,
          description: input.description,
          visibility: input.visibility,
          joinPolicy: input.joinPolicy,
          avatarUrl: input.avatarUrl,
          bannerUrl: input.bannerUrl,
        },
      });

      return updated;
    }),

  updatePluginData: protectedProcedure
    .input(updatePluginDataSchema)
    .mutation(async ({ ctx, input }) => {
      const context = await ctx.db.context.findUnique({
        where: { id: input.contextId },
        include: { memberships: { where: { userId: ctx.session.user.id } } },
      });

      if (!context) throw new TRPCError({ code: 'NOT_FOUND' });

      const membership = context.memberships[0];
      if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const plugin = pluginRegistry.get(input.pluginId);
      if (!plugin) throw new TRPCError({ code: 'BAD_REQUEST' });

      // Validate plugin data
      const validated = plugin.dataSchema.parse(input.data);

      // Validate with plugin hook
      const validation = await plugin.hooks?.validateData?.(validated, context);
      if (validation && !validation.valid) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: validation.errors?.join(', ') });
      }

      const prevPlugins = context.plugins as Record<string, unknown>;
      const prevData = prevPlugins[input.pluginId];

      // Update
      const updated = await ctx.db.context.update({
        where: { id: input.contextId },
        data: {
          plugins: { ...prevPlugins, [input.pluginId]: validated },
        },
      });

      // Run plugin hook
      await plugin.hooks?.onContextUpdate?.(updated, validated, prevData);

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ contextId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const context = await ctx.db.context.findUnique({
        where: { id: input.contextId },
      });

      if (!context) throw new TRPCError({ code: 'NOT_FOUND' });
      if (context.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owner can delete' });
      }

      // Run plugin hooks
      for (const pluginId of context.features) {
        const plugin = pluginRegistry.get(pluginId);
        await plugin?.hooks?.onContextDelete?.(context);
      }

      // Soft delete by archiving
      await ctx.db.context.update({
        where: { id: input.contextId },
        data: { isArchived: true, archivedAt: new Date() },
      });
    }),

  // === Queries ===

  getById: publicProcedure
    .input(z.object({ contextId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const context = await ctx.db.context.findUnique({
        where: { id: input.contextId, isArchived: false },
        include: {
          owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          _count: { select: { memberships: { where: { status: 'APPROVED' } } } },
        },
      });

      if (!context) throw new TRPCError({ code: 'NOT_FOUND' });

      // Check visibility
      if (context.visibility === 'PRIVATE') {
        if (!ctx.session?.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const membership = await ctx.db.membership.findUnique({
          where: { contextId_userId: { contextId: context.id, userId: ctx.session.user.id } },
        });

        if (!membership || membership.status !== 'APPROVED') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
      }

      // Get user's membership if logged in
      let userMembership = null;
      if (ctx.session?.user?.id) {
        userMembership = await ctx.db.membership.findUnique({
          where: { contextId_userId: { contextId: context.id, userId: ctx.session.user.id } },
        });
      }

      return { ...context, userMembership };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const context = await ctx.db.context.findUnique({
        where: { slug: input.slug, isArchived: false },
      });

      if (!context) throw new TRPCError({ code: 'NOT_FOUND' });

      // Delegate to getById for visibility checks
      return ctx.db.context.findUnique({
        where: { id: context.id },
        include: {
          owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          _count: { select: { memberships: { where: { status: 'APPROVED' } } } },
        },
      });
    }),

  list: publicProcedure
    .input(listContextsSchema)
    .query(async ({ ctx, input }) => {
      const { type, visibility, cursor, limit = 20 } = input;

      const where: Prisma.ContextWhereInput = {
        isArchived: false,
        ...(type && { type }),
        ...(visibility ? { visibility } : { visibility: { not: 'PRIVATE' } }),
      };

      const contexts = await ctx.db.context.findMany({
        where,
        include: {
          owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          _count: { select: { memberships: { where: { status: 'APPROVED' } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      const hasNextPage = contexts.length > limit;
      const items = hasNextPage ? contexts.slice(0, -1) : contexts;

      return {
        items,
        nextCursor: hasNextPage ? items[items.length - 1].id : undefined,
      };
    }),

  // === Membership ===

  join: protectedProcedure
    .input(z.object({ contextId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const context = await ctx.db.context.findUnique({
        where: { id: input.contextId, isArchived: false },
      });

      if (!context) throw new TRPCError({ code: 'NOT_FOUND' });

      // Check join policy
      if (context.joinPolicy === 'CLOSED') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'This context is not accepting new members' });
      }

      if (context.joinPolicy === 'INVITE') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Invitation required to join' });
      }

      const status = context.joinPolicy === 'APPROVAL' ? 'PENDING' : 'APPROVED';

      const membership = await ctx.db.membership.upsert({
        where: { contextId_userId: { contextId: input.contextId, userId: ctx.session.user.id } },
        create: {
          contextId: input.contextId,
          userId: ctx.session.user.id,
          role: 'MEMBER',
          status,
          approvedAt: status === 'APPROVED' ? new Date() : undefined,
        },
        update: {
          status,
          approvedAt: status === 'APPROVED' ? new Date() : undefined,
        },
      });

      // Run plugin hooks
      if (status === 'APPROVED') {
        for (const pluginId of context.features) {
          const plugin = pluginRegistry.get(pluginId);
          await plugin?.hooks?.onMemberJoin?.(membership, context);
        }
      }

      return membership;
    }),

  leave: protectedProcedure
    .input(z.object({ contextId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const context = await ctx.db.context.findUnique({
        where: { id: input.contextId },
      });

      if (!context) throw new TRPCError({ code: 'NOT_FOUND' });

      if (context.ownerId === ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Owner cannot leave. Transfer ownership first.' });
      }

      const membership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId: ctx.session.user.id } },
      });

      if (!membership) throw new TRPCError({ code: 'NOT_FOUND' });

      await ctx.db.membership.update({
        where: { id: membership.id },
        data: { status: 'LEFT' },
      });

      // Run plugin hooks
      for (const pluginId of context.features) {
        const plugin = pluginRegistry.get(pluginId);
        await plugin?.hooks?.onMemberLeave?.(membership, context);
      }
    }),

  getMembers: publicProcedure
    .input(getMembersSchema)
    .query(async ({ ctx, input }) => {
      const { contextId, role, status, cursor, limit = 20 } = input;

      const context = await ctx.db.context.findUnique({
        where: { id: contextId },
      });

      if (!context) throw new TRPCError({ code: 'NOT_FOUND' });

      // Check if user can see member list
      const plugins = context.plugins as Record<string, { showMemberList?: boolean }>;
      const groupPlugin = plugins.group;
      if (groupPlugin?.showMemberList === false && context.visibility === 'PRIVATE') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const memberships = await ctx.db.membership.findMany({
        where: {
          contextId,
          ...(role && { role }),
          ...(status ? { status } : { status: 'APPROVED' }),
        },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true, species: true } },
        },
        orderBy: [{ role: 'asc' }, { joinedAt: 'desc' }],
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      const hasNextPage = memberships.length > limit;
      const items = hasNextPage ? memberships.slice(0, -1) : memberships;

      return {
        items,
        nextCursor: hasNextPage ? items[items.length - 1].id : undefined,
      };
    }),

  // === Admin Actions ===

  approveMember: protectedProcedure
    .input(z.object({ membershipId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.membership.findUnique({
        where: { id: input.membershipId },
        include: { context: true },
      });

      if (!membership) throw new TRPCError({ code: 'NOT_FOUND' });

      // Check permission
      const adminMembership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: membership.contextId, userId: ctx.session.user.id } },
      });

      if (!adminMembership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(adminMembership.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const updated = await ctx.db.membership.update({
        where: { id: input.membershipId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: ctx.session.user.id,
        },
      });

      // Run plugin hooks
      for (const pluginId of membership.context.features) {
        const plugin = pluginRegistry.get(pluginId);
        await plugin?.hooks?.onMemberJoin?.(updated, membership.context);
      }

      return updated;
    }),

  rejectMember: protectedProcedure
    .input(z.object({ membershipId: z.string().cuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Similar to approveMember but sets status to BANNED
    }),

  updateMemberRole: protectedProcedure
    .input(z.object({ membershipId: z.string().cuid(), role: z.nativeEnum(MemberRole) }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions, update role
    }),
});
```

### 6.3 Timeline Queries

```typescript
// src/server/api/routers/activity.ts (timeline portion)

export const activityRouter = createTRPCRouter({
  // ... existing CRUD ...

  // === Timeline Queries ===

  /**
   * Public timeline - all public activities
   */
  publicTimeline: publicProcedure
    .input(timelineQuerySchema)
    .query(async ({ ctx, input }) => {
      const { cursor, limit = 20 } = input;

      const activities = await ctx.db.activity.findMany({
        where: {
          deleted: false,
          type: 'CREATE',
          to: { has: 'public' },
        },
        include: activityInclude,
        orderBy: { published: 'desc' },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      return buildTimelineResponse(activities, limit, ctx.session?.user?.id);
    }),

  /**
   * Home timeline - following + own + context posts
   */
  homeTimeline: protectedProcedure
    .input(timelineQuerySchema)
    .query(async ({ ctx, input }) => {
      const { cursor, limit = 20 } = input;
      const userId = ctx.session.user.id;

      // Get followed user IDs
      const following = await ctx.db.follow.findMany({
        where: { followerId: userId, status: 'ACCEPTED' },
        select: { followingId: true },
      });
      const followingIds = following.map(f => f.followingId);

      // Get joined context IDs
      const memberships = await ctx.db.membership.findMany({
        where: { userId, status: 'APPROVED' },
        select: { contextId: true },
      });
      const contextAddresses = memberships.map(m => `context:${m.contextId}`);

      const activities = await ctx.db.activity.findMany({
        where: {
          deleted: false,
          type: 'CREATE',
          OR: [
            // Own posts
            { actorId: userId },
            // Following posts that are public or addressed to followers
            {
              actorId: { in: followingIds },
              OR: [
                { to: { has: 'public' } },
                { to: { has: 'followers' } },
              ],
            },
            // Context posts
            {
              to: { hasSome: contextAddresses },
            },
          ],
        },
        include: activityInclude,
        orderBy: { published: 'desc' },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      return buildTimelineResponse(activities, limit, userId);
    }),

  /**
   * Context timeline - activities in a specific context
   */
  contextTimeline: publicProcedure
    .input(z.object({
      contextId: z.string().cuid(),
      ...timelineQuerySchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const { contextId, cursor, limit = 20 } = input;

      const context = await ctx.db.context.findUnique({
        where: { id: contextId, isArchived: false },
      });

      if (!context) throw new TRPCError({ code: 'NOT_FOUND' });

      // Check visibility
      if (context.visibility === 'PRIVATE') {
        if (!ctx.session?.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const membership = await ctx.db.membership.findUnique({
          where: { contextId_userId: { contextId, userId: ctx.session.user.id } },
        });

        if (!membership || membership.status !== 'APPROVED') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
      }

      const activities = await ctx.db.activity.findMany({
        where: {
          deleted: false,
          type: 'CREATE',
          contextId,
        },
        include: activityInclude,
        orderBy: { published: 'desc' },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      return buildTimelineResponse(activities, limit, ctx.session?.user?.id);
    }),

  /**
   * User timeline - specific user's activities
   */
  userTimeline: publicProcedure
    .input(z.object({
      userId: z.string().cuid(),
      ...timelineQuerySchema.shape,
    }))
    .query(async ({ ctx, input }) => {
      const { userId, cursor, limit = 20 } = input;

      const targetUser = await ctx.db.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) throw new TRPCError({ code: 'NOT_FOUND' });

      // Build visibility filter
      let visibilityFilter: Prisma.ActivityWhereInput = { to: { has: 'public' } };

      if (ctx.session?.user?.id) {
        if (ctx.session.user.id === userId) {
          // Own profile - show everything
          visibilityFilter = {};
        } else {
          // Check if following
          const isFollowing = await ctx.db.follow.findUnique({
            where: { followerId_followingId: { followerId: ctx.session.user.id, followingId: userId } },
          });

          if (isFollowing?.status === 'ACCEPTED') {
            visibilityFilter = {
              OR: [
                { to: { has: 'public' } },
                { to: { has: 'followers' } },
              ],
            };
          }
        }
      }

      const activities = await ctx.db.activity.findMany({
        where: {
          deleted: false,
          type: 'CREATE',
          actorId: userId,
          ...visibilityFilter,
        },
        include: activityInclude,
        orderBy: { published: 'desc' },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      return buildTimelineResponse(activities, limit, ctx.session?.user?.id);
    }),
});

/**
 * Helper to build timeline response with interaction states
 */
async function buildTimelineResponse(
  activities: ActivityWithRelations[],
  limit: number,
  currentUserId?: string
) {
  const hasNextPage = activities.length > limit;
  const items = hasNextPage ? activities.slice(0, -1) : activities;

  // Get interaction states
  let interactionStates: Map<string, { liked: boolean; reposted: boolean }> | undefined;
  if (currentUserId && items.length > 0) {
    interactionStates = await getInteractionStates(items.map(a => a.id), currentUserId);
  }

  const timelineItems: TimelineItem[] = items.map(activity => ({
    activity,
    liked: interactionStates?.get(activity.id)?.liked ?? false,
    reposted: interactionStates?.get(activity.id)?.reposted ?? false,
  }));

  return {
    items: timelineItems,
    nextCursor: hasNextPage ? items[items.length - 1].id : undefined,
  };
}
```

---

## 7. UI/UX Architecture

### 7.1 Navigation Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                      NAVIGATION ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MOBILE (Bottom Navigation)                                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  🏠      🔍      ➕      🔔      👤                          │    │
│  │ Home  Explore  Create  Notifs  Profile                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  DESKTOP (Sidebar)                                                   │
│  ┌────────────────┐                                                  │
│  │ 🏠 Home        │  → Personal feed (following + contexts)         │
│  │ 🔍 Explore     │  → Public timeline + discovery                  │
│  │ 📅 Events      │  → Event listings                               │
│  │ 👥 Groups      │  → Group listings                               │
│  │ 💬 Messages    │  → DMs                                          │
│  │ 🔔 Notifications│                                                 │
│  │ ────────────── │                                                  │
│  │ 👤 Profile     │                                                  │
│  │ ⚙️ Settings    │                                                  │
│  └────────────────┘                                                  │
│                                                                      │
│  "Create" Action (FAB on mobile, button on desktop)                  │
│  Opens creation sheet with options:                                  │
│  - 📝 Post (to home timeline)                                       │
│  - 📅 Event                                                         │
│  - 👥 Group                                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Page Structure

```
/                           → Landing page (unauthenticated) / Home timeline (authenticated)
├── /login                  → OAuth login
├── /home                   → Home timeline (explicit route)
├── /explore                → Public timeline + discovery tabs
│   ├── /explore/trending   → Trending posts
│   ├── /explore/people     → User discovery
│   └── /explore/tags       → Tag-based discovery
├── /events                 → Event listings
│   ├── /events/upcoming    → Upcoming events
│   ├── /events/past        → Past events
│   └── /events/my          → My events (hosting/attending)
├── /groups                 → Group listings
│   ├── /groups/discover    → Discover groups
│   └── /groups/my          → My groups
├── /[handle]               → Context page (event or group by handle)
│   ├── /[handle]/members   → Member list
│   ├── /[handle]/settings  → Context settings (admin)
│   └── /[handle]/manage    → Management dashboard (admin)
├── /@[username]            → User profile
│   ├── /@[username]/posts  → User's posts
│   ├── /@[username]/likes  → Liked posts
│   ├── /@[username]/media  → Media gallery
│   ├── /@[username]/followers
│   └── /@[username]/following
├── /messages               → DM inbox
│   └── /messages/[userId]  → Conversation
├── /notifications          → Notification list
├── /settings               → User settings
│   ├── /settings/profile   → Profile settings
│   ├── /settings/account   → Account settings
│   ├── /settings/privacy   → Privacy settings
│   └── /settings/appearance→ Theme customization
├── /post/[activityId]      → Single post view (thread)
└── /search                 → Search results
```

### 7.3 Component Architecture

```
src/components/
├── layout/
│   ├── AppShell.tsx          # Main app wrapper with nav
│   ├── Sidebar.tsx           # Desktop sidebar
│   ├── BottomNav.tsx         # Mobile bottom navigation
│   ├── Header.tsx            # Page headers
│   └── CreateButton.tsx      # FAB for creation
│
├── timeline/
│   ├── Timeline.tsx          # Timeline container
│   ├── TimelinePost.tsx      # Individual post
│   ├── PostComposer.tsx      # Post creation form
│   ├── PostActions.tsx       # Like, repost, reply buttons
│   ├── ThreadView.tsx        # Thread/conversation view
│   └── MediaGrid.tsx         # Image/video grid
│
├── context/
│   ├── ContextPage.tsx       # Context page layout
│   ├── ContextHeader.tsx     # Context header (name, avatar, actions)
│   ├── ContextTimeline.tsx   # Context-scoped timeline
│   ├── ContextSidebar.tsx    # Context sidebar (members, info)
│   └── ContextCard.tsx       # Context preview card
│
├── user/
│   ├── ProfilePage.tsx       # User profile layout
│   ├── ProfileHeader.tsx     # Profile header
│   ├── ProfileTimeline.tsx   # User's posts
│   ├── UserCard.tsx          # User preview card
│   ├── FollowButton.tsx      # Follow/unfollow button
│   └── CharacterSwitcher.tsx # Multi-fursona selector
│
├── discover/
│   ├── DiscoverPage.tsx      # Discovery layout
│   ├── UserDiscovery.tsx     # User search/browse
│   ├── ContextDiscovery.tsx  # Event/group search
│   └── TrendingTags.tsx      # Trending topics
│
├── notifications/
│   ├── NotificationList.tsx  # Notification feed
│   ├── NotificationItem.tsx  # Individual notification
│   └── NotificationBell.tsx  # Header bell icon
│
├── dm/
│   ├── ConversationList.tsx  # DM inbox
│   ├── ChatView.tsx          # Conversation view
│   └── MessageBubble.tsx     # Individual message
│
├── plugins/
│   ├── event/
│   │   ├── EventHeader.tsx   # Event-specific header
│   │   ├── EventSidebar.tsx  # RSVP list, location, schedule
│   │   ├── RSVPButton.tsx    # RSVP action button
│   │   └── AttendeeList.tsx  # Attendee grid
│   ├── group/
│   │   ├── GroupHeader.tsx   # Group-specific header
│   │   ├── GroupSidebar.tsx  # Rules, member count
│   │   └── GroupSettings.tsx # Group admin settings
│   └── convention/
│       ├── ConventionHeader.tsx
│       ├── ScheduleView.tsx
│       ├── WhoIsHere.tsx
│       └── RoomParties.tsx
│
├── shared/
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Dialog.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   ├── LoadingState.tsx
│   └── ... (other primitives)
│
└── forms/
    ├── PostForm.tsx          # Post composition
    ├── ContextForm.tsx       # Context creation/editing
    ├── ProfileForm.tsx       # Profile editing
    └── ... (other forms)
```

### 7.4 Home Timeline Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        HEADER                                │   │
│  │  [Logo]  Home                             [🔍] [🔔] [Avatar] │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────┐  ┌─────────────────────────────┐  ┌───────────┐   │
│  │  SIDEBAR    │  │        MAIN FEED            │  │  WIDGETS  │   │
│  │  (Desktop)  │  │                             │  │           │   │
│  │             │  │  ┌───────────────────────┐  │  │  ┌─────┐  │   │
│  │  🏠 Home    │  │  │   POST COMPOSER       │  │  │  │Who  │  │   │
│  │  🔍 Explore │  │  │   What's happening?   │  │  │  │to   │  │   │
│  │  📅 Events  │  │  └───────────────────────┘  │  │  │follow│  │   │
│  │  👥 Groups  │  │                             │  │  └─────┘  │   │
│  │  💬 Messages│  │  ┌───────────────────────┐  │  │           │   │
│  │  🔔 Notifs  │  │  │ 🐾 @username · 5m     │  │  │  ┌─────┐  │   │
│  │             │  │  │ Just finished my new  │  │  │  │Trend│  │   │
│  │  ────────── │  │  │ fursuit! 🦊           │  │  │  │-ing │  │   │
│  │             │  │  │ [Image]               │  │  │  │     │  │   │
│  │  👤 Profile │  │  │ ❤️ 42  💬 8  🔄 5     │  │  │  └─────┘  │   │
│  │  ⚙️ Settings│  │  └───────────────────────┘  │  │           │   │
│  │             │  │                             │  │  ┌─────┐  │   │
│  │             │  │  ┌───────────────────────┐  │  │  │Events│  │   │
│  │             │  │  │ 📅 Seoul Furry Meet   │  │  │  │nearby│  │   │
│  │             │  │  │ @host · 2h            │  │  │  │     │  │   │
│  │             │  │  │ "Registration open!"  │  │  │  └─────┘  │   │
│  │  [Create]   │  │  │ 📍 Hongdae · Jan 15  │  │  │           │   │
│  │             │  │  │ [Join Event]          │  │  │           │   │
│  │             │  │  └───────────────────────┘  │  │           │   │
│  │             │  │                             │  │           │   │
│  └─────────────┘  └─────────────────────────────┘  └───────────┘   │
│                                                                     │
│  (Mobile: Sidebar hidden, Bottom nav instead, No widgets)           │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.5 Context Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CONTEXT PAGE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  BANNER IMAGE                                                │    │
│  │  ═══════════════════════════════════════════════════════════│    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────┐  ┌──────────────────────┐   │
│  │  CONTEXT HEADER                     │  │  PLUGIN WIDGETS     │   │
│  │  ┌──────┐                           │  │  (via ContextSidebar)│   │
│  │  │Avatar│  Seoul Furry Meet 2026    │  │                      │   │
│  │  └──────┘  @seoulmeeet              │  │  ┌────────────────┐  │   │
│  │  [📍 Physical] [🔓 Public]          │  │  │  EVENT INFO    │  │   │
│  │                                     │  │  │  📍 Hongdae    │  │   │
│  │  Monthly furry meetup for the       │  │  │  🗓️ Jan 15, 2PM │  │   │
│  │  Korean community. All welcome!     │  │  │  👥 32/50      │  │   │
│  │                                     │  │  │  💰 15,000원   │  │   │
│  │  ┌──────────────────────────────┐  │  │  │                │  │   │
│  │  │ [Join/RSVP] [Share] [···]    │  │  │  │  [Get Tickets] │  │   │
│  │  └──────────────────────────────┘  │  │  └────────────────┘  │   │
│  └────────────────────────────────────┘  │                      │   │
│                                           │  ┌────────────────┐  │   │
│  ┌────────────────────────────────────┐  │  │  ATTENDEES     │  │   │
│  │  TABS                               │  │  │  [👤][👤][👤]  │  │   │
│  │  [Timeline] [About] [Members]       │  │  │  +29 others    │  │   │
│  └────────────────────────────────────┘  │  │  [See all]      │  │   │
│                                           │  └────────────────┘  │   │
│  ┌────────────────────────────────────┐  │                      │   │
│  │  CONTEXT TIMELINE                   │  │  ┌────────────────┐  │   │
│  │                                     │  │  │  HOST          │  │   │
│  │  ┌─────────────────────────────┐   │  │  │  [👤] @furry   │  │   │
│  │  │ @host · 1h                   │   │  │  │  [Message]     │  │   │
│  │  │ "Who's excited for next     │   │  │  └────────────────┘  │   │
│  │  │ week?! 🎉"                   │   │  │                      │   │
│  │  │ ❤️ 12  💬 5                  │   │  └──────────────────────┘   │
│  │  └─────────────────────────────┘   │                              │
│  │                                     │                              │
│  │  ┌─────────────────────────────┐   │                              │
│  │  │ @attendee · 3h               │   │                              │
│  │  │ "Can't wait! First time     │   │                              │
│  │  │ bringing my suit!"           │   │                              │
│  │  │ [Photo]                      │   │                              │
│  │  │ ❤️ 8  💬 2                   │   │                              │
│  │  └─────────────────────────────┘   │                              │
│  │                                     │                              │
│  └────────────────────────────────────┘                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Real-time System

### 8.1 SSE Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Client                        Server                                │
│  ┌─────────────┐               ┌─────────────────────────────┐      │
│  │  useSSE()   │──────────────▶│  /api/stream                │      │
│  │  hook       │  SSE Connect  │                             │      │
│  └─────────────┘               │  ┌───────────────────────┐  │      │
│        ▲                       │  │  Connection Manager   │  │      │
│        │                       │  │  - User connections   │  │      │
│        │  Events:              │  │  - Channel subscriptions│  │      │
│        │  - new_post           │  │  - Heartbeat           │  │      │
│        │  - new_reaction       │  └───────────────────────┘  │      │
│        │  - context_update     │             ▲               │      │
│        │  - notification       │             │               │      │
│        │                       │  ┌──────────┴────────────┐  │      │
│        │                       │  │   Event Broadcaster   │  │      │
│        │                       │  └───────────────────────┘  │      │
│        │                       │             ▲               │      │
│  ◀─────┘                       │             │               │      │
│                                │  Activity Created           │      │
│                                │  InboxItem Created          │      │
│                                │  Context Updated            │      │
│                                └─────────────────────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Channel System

```typescript
// src/lib/realtime/channels.ts

/**
 * Channel types for real-time updates
 */
export type ChannelType =
  | 'global'              // Public timeline updates
  | 'home'                // Home timeline (requires auth)
  | `context:${string}`   // Context-specific updates
  | `user:${string}`;     // User-specific (notifications, DMs)

/**
 * Event types sent over SSE
 */
export interface SSEEvents {
  // Timeline events
  'activity:created': { activity: TimelineItem };
  'activity:updated': { activityId: string; changes: Partial<Activity> };
  'activity:deleted': { activityId: string };

  // Interaction events
  'reaction:added': { activityId: string; likesCount: number };
  'reaction:removed': { activityId: string; likesCount: number };
  'repost:added': { activityId: string; repostsCount: number };
  'repost:removed': { activityId: string; repostsCount: number };

  // Context events
  'context:updated': { contextId: string; changes: Partial<Context> };
  'member:joined': { contextId: string; userId: string };
  'member:left': { contextId: string; userId: string };

  // User events
  'notification': { inboxItem: InboxItem };
  'dm:received': { activity: Activity };

  // System events
  'heartbeat': { timestamp: number };
  'error': { message: string };
}

/**
 * Subscribe to channels based on user state
 */
export function getChannelsForUser(userId: string | null): ChannelType[] {
  if (!userId) {
    return ['global'];
  }

  return [
    'global',
    'home',
    `user:${userId}`,
    // Context channels are added dynamically when viewing context pages
  ];
}
```

### 8.3 SSE Endpoint

```typescript
// src/app/api/stream/route.ts

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { connectionManager } from '@/lib/realtime/connection-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  // Get requested channels from query
  const channelsParam = req.nextUrl.searchParams.get('channels');
  const requestedChannels = channelsParam?.split(',') ?? ['global'];

  // Validate channel access
  const authorizedChannels = await authorizeChannels(requestedChannels, userId);

  if (authorizedChannels.length === 0) {
    return new Response('No valid channels', { status: 400 });
  }

  // Create response stream
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Register connection
  const connectionId = connectionManager.register({
    userId,
    channels: authorizedChannels,
    send: async (event: string, data: unknown) => {
      try {
        await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      } catch {
        // Connection closed
        connectionManager.unregister(connectionId);
      }
    },
  });

  // Send initial connected event
  await writer.write(encoder.encode(`event: connected\ndata: ${JSON.stringify({ channels: authorizedChannels })}\n\n`));

  // Cleanup on close
  req.signal.addEventListener('abort', () => {
    connectionManager.unregister(connectionId);
    writer.close();
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function authorizeChannels(channels: string[], userId: string | null): Promise<string[]> {
  const authorized: string[] = [];

  for (const channel of channels) {
    if (channel === 'global') {
      authorized.push(channel);
    } else if (channel === 'home' && userId) {
      authorized.push(channel);
    } else if (channel.startsWith('user:') && channel === `user:${userId}`) {
      authorized.push(channel);
    } else if (channel.startsWith('context:') && userId) {
      const contextId = channel.slice(8);
      const membership = await db.membership.findUnique({
        where: { contextId_userId: { contextId, userId } },
      });
      if (membership?.status === 'APPROVED') {
        authorized.push(channel);
      }
    }
  }

  return authorized;
}
```

---

## 9. Migration Strategy

### 9.1 Phase Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MIGRATION PHASES                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Phase 1: Foundation        Phase 2: Context System                  │
│  ─────────────────────      ───────────────────────                  │
│  • Context model            • Event → Context migration              │
│  • Membership model         • Plugin system                          │
│  • Updated Activity         • Context UI components                  │
│  • Address utilities        • Context routes                         │
│                                                                      │
│  Phase 3: UI Overhaul       Phase 4: Enhanced Features               │
│  ─────────────────────      ────────────────────────                 │
│  • New navigation           • Group plugin                           │
│  • Timeline-first home      • Convention plugin                      │
│  • Context pages            • Multi-character profiles               │
│  • Mobile optimization      • Enhanced discovery                     │
│                                                                      │
│  Phase 5: Polish            Phase 6: Launch                          │
│  ─────────────────────      ─────────────────                        │
│  • Performance              • Production deploy                      │
│  • Accessibility            • Documentation                          │
│  • i18n completion          • Community launch                       │
│  • Testing                                                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 Data Migration Scripts

```typescript
// scripts/migrate-events-to-contexts.ts

/**
 * Migrate existing Events to the new Context system
 */
async function migrateEventsToContexts() {
  console.log('Starting event migration...');

  const events = await db.event.findMany({
    include: {
      host: true,
      rsvps: true,
    },
  });

  console.log(`Found ${events.length} events to migrate`);

  for (const event of events) {
    try {
      await db.$transaction(async (tx) => {
        // Create Context
        const context = await tx.context.create({
          data: {
            type: 'EVENT',
            slug: event.slug,
            name: event.title,
            description: event.description,
            avatarUrl: event.coverImageUrl || event.coverUrl,
            ownerId: event.hostId,
            visibility: event.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
            joinPolicy: event.requiresApproval ? 'APPROVAL' : 'OPEN',
            features: ['event'],
            plugins: {
              event: {
                startAt: event.startAt?.toISOString() || event.startDate.toISOString(),
                endAt: event.endAt?.toISOString() || event.endDate.toISOString(),
                timezone: event.timezone || 'Asia/Seoul',
                isAllDay: false,
                locationType: event.isOnline ? 'online' : 'physical',
                location: event.locationAddress ? {
                  name: event.locationAddress,
                  address: event.locationAddress,
                  mapUrl: event.naverMapUrl || event.mapUrl,
                  isPublic: event.isLocationPublic,
                } : undefined,
                onlineUrl: event.onlineUrl,
                capacity: event.capacity || event.attendeeCap,
                cost: event.cost,
                currency: 'KRW',
                paymentRequired: event.cost > 0,
                requiresApproval: event.requiresApproval || false,
                hasWaitlist: true,
                tags: event.tags,
                rules: event.rules || event.eventRules,
              },
            },
            createdAt: event.createdAt,
          },
        });

        // Migrate host as owner
        await tx.membership.create({
          data: {
            contextId: context.id,
            userId: event.hostId,
            role: 'OWNER',
            status: 'APPROVED',
            approvedAt: event.createdAt,
            pluginData: {
              rsvpStatus: 'attending',
              rsvpAt: event.createdAt.toISOString(),
            },
          },
        });

        // Migrate RSVPs as memberships
        for (const rsvp of event.rsvps) {
          if (rsvp.userId === event.hostId) continue; // Skip host

          await tx.membership.create({
            data: {
              contextId: context.id,
              userId: rsvp.userId,
              role: 'MEMBER',
              status: 'APPROVED',
              joinedAt: rsvp.createdAt,
              approvedAt: rsvp.createdAt,
              pluginData: {
                rsvpStatus: rsvp.status.toLowerCase(),
                rsvpAt: rsvp.createdAt.toISOString(),
                paymentStatus: rsvp.paymentStatus.toLowerCase(),
              },
            },
          });
        }

        // Update Activities with event addressing to use context
        await tx.activity.updateMany({
          where: {
            to: { has: `event:${event.id}` },
          },
          data: {
            contextId: context.id,
            // Note: We need to update the `to` array separately
          },
        });

        console.log(`Migrated event: ${event.title} → ${context.slug}`);
      });
    } catch (error) {
      console.error(`Failed to migrate event ${event.id}:`, error);
    }
  }

  console.log('Event migration complete!');
}
```

### 9.3 Backward Compatibility

During migration, we maintain backward compatibility:

1. **API Routes**: Old `/api/events/*` routes redirect to new context routes
2. **URLs**: `/events/[id]` redirects to `/[contextSlug]`
3. **Addressing**: `event:{id}` continues to work, resolved to `context:{id}`

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Establish core data models and utilities

**Tasks**:
- [ ] Create `Context` model in Prisma
- [ ] Create `Membership` model in Prisma
- [ ] Update `Activity` model with `contextId` field
- [ ] Implement plugin registry system
- [ ] Implement unified addressing utilities
- [ ] Create context tRPC router (CRUD)
- [ ] Create membership management procedures
- [ ] Unit tests for addressing and visibility

**Deliverables**:
- `prisma/schema.prisma` - Updated schema
- `src/lib/plugins/` - Plugin system
- `src/lib/addressing/` - Addressing utilities
- `src/server/api/routers/context.ts` - Context router

### Phase 2: Context System (Week 3-4)

**Goal**: Full context/plugin functionality

**Tasks**:
- [ ] Implement event plugin with full data schema
- [ ] Create event plugin tRPC procedures (RSVP, checkin)
- [ ] Implement group plugin basics
- [ ] Create context page components
- [ ] Context timeline component
- [ ] Context sidebar with plugin widgets
- [ ] Migration script for existing events

**Deliverables**:
- `src/lib/plugins/event/` - Event plugin
- `src/lib/plugins/group/` - Group plugin
- `src/components/context/` - Context components
- `scripts/migrate-events-to-contexts.ts` - Migration

### Phase 3: UI Overhaul (Week 5-6)

**Goal**: Timeline-first interface

**Tasks**:
- [ ] New app shell with sidebar/bottom nav
- [ ] Redesigned home page as timeline feed
- [ ] Explore page with discovery features
- [ ] Context listing pages (events, groups)
- [ ] Mobile-optimized layouts
- [ ] Post composer improvements
- [ ] Create action (FAB/button)

**Deliverables**:
- `src/components/layout/` - New layout components
- `src/app/(main)/` - Restructured routes
- `src/components/timeline/` - Enhanced timeline

### Phase 4: Enhanced Features (Week 7-8)

**Goal**: Advanced features and polish

**Tasks**:
- [ ] Convention plugin implementation
- [ ] Multi-character profile support
- [ ] Enhanced user discovery
- [ ] Profile customization (themes)
- [ ] Improved notifications
- [ ] Real-time enhancements

**Deliverables**:
- `src/lib/plugins/convention/` - Convention plugin
- Enhanced user profile features
- Discovery improvements

### Phase 5: Polish (Week 9-10)

**Goal**: Production readiness

**Tasks**:
- [ ] Performance optimization
- [ ] Accessibility audit and fixes
- [ ] Complete i18n (Korean/English)
- [ ] E2E testing with Playwright
- [ ] Security review
- [ ] Documentation

**Deliverables**:
- Complete test suite
- Documentation
- Performance benchmarks

### Phase 6: Launch (Week 11-12)

**Goal**: Production deployment

**Tasks**:
- [ ] Production environment setup
- [ ] Database migration in production
- [ ] Monitoring and alerting
- [ ] Soft launch to existing users
- [ ] Feedback collection
- [ ] Public launch

---

## Appendix A: File Structure

```
kemotown/
├── prisma/
│   └── schema.prisma           # Database schema
├── scripts/
│   ├── migrate-events.ts       # Migration scripts
│   └── seed.ts                 # Development seeding
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes
│   │   ├── (main)/             # Main app routes
│   │   │   ├── page.tsx        # Home timeline
│   │   │   ├── explore/        # Discovery
│   │   │   ├── events/         # Event listings
│   │   │   ├── groups/         # Group listings
│   │   │   ├── [handle]/       # Context pages
│   │   │   ├── @[username]/    # User profiles
│   │   │   ├── messages/       # DMs
│   │   │   ├── notifications/  # Notifications
│   │   │   ├── settings/       # Settings
│   │   │   └── post/[id]/      # Single post
│   │   ├── api/
│   │   │   ├── trpc/           # tRPC handler
│   │   │   ├── auth/           # Auth.js handler
│   │   │   └── stream/         # SSE endpoint
│   │   └── layout.tsx
│   ├── components/
│   │   ├── context/            # Context components
│   │   ├── dm/                 # DM components
│   │   ├── discover/           # Discovery components
│   │   ├── forms/              # Form components
│   │   ├── layout/             # Layout components
│   │   ├── notifications/      # Notification components
│   │   ├── plugins/            # Plugin UI components
│   │   │   ├── event/
│   │   │   ├── group/
│   │   │   └── convention/
│   │   ├── shared/             # Shared primitives
│   │   ├── timeline/           # Timeline components
│   │   ├── ui/                 # UI primitives
│   │   └── user/               # User components
│   ├── hooks/                  # React hooks
│   ├── i18n/                   # Internationalization
│   ├── lib/
│   │   ├── addressing/         # Addressing utilities
│   │   ├── auth.ts             # Auth configuration
│   │   ├── plugins/            # Plugin system
│   │   │   ├── types.ts        # Plugin interfaces
│   │   │   ├── registry.ts     # Plugin registry
│   │   │   ├── event/          # Event plugin
│   │   │   ├── group/          # Group plugin
│   │   │   └── convention/     # Convention plugin
│   │   ├── realtime/           # Real-time utilities
│   │   ├── trpc/               # tRPC client
│   │   └── utils.ts
│   ├── schemas/                # Zod schemas
│   ├── server/
│   │   ├── api/
│   │   │   ├── root.ts         # Router aggregation
│   │   │   └── routers/        # tRPC routers
│   │   ├── db/                 # Prisma client
│   │   ├── services/           # Business logic
│   │   └── trpc.ts             # tRPC setup
│   └── types/                  # TypeScript types
├── ARCHITECTURE_V2.md          # This document
├── DESIGN.md                   # Original design doc
└── package.json
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Activity** | Atomic unit of content (post, like, follow, etc.) |
| **Actor** | Entity that performs activities (user, bot, system) |
| **Context** | Container for grouped activities (event, group) |
| **Plugin** | Feature module that extends context functionality |
| **Addressing** | System for determining activity visibility |
| **Membership** | User's relationship to a context |
| **InboxItem** | Delivery record for notifications |
| **Timeline** | Chronological feed of activities |

---

*Document Version: 2.0.0*
*Last Updated: January 2, 2026*
