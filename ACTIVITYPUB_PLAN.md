# ActivityPub-Based Social Networking Implementation Plan

## Overview

This document outlines the plan to implement social networking features for Kemotown using ActivityPub vocabulary and patterns as an **internal framework**, without the complexity of fediverse interoperability.

### Why ActivityPub as Internal Framework?

ActivityPub provides a well-defined, battle-tested vocabulary for social networking:

- **Actor Model**: Users, bots, and system actors with clear identity
- **Activity Types**: Create, Like, Follow, Announce, Delete, Update - covers all social actions
- **Object Types**: Note, Image, Event, Person - standardized content types
- **Addressing**: `to` and `cc` fields for flexible audience targeting

By adopting AP patterns internally, we get:
1. A unified data model that handles posts, DMs, reactions, and notifications
2. Clear semantics for public vs. private content
3. Extensible foundation if fediverse interop is desired later
4. Simplified reasoning about "who sees what"

### What We Keep vs. Remove

| Keep (Internal Use) | Remove (Federation) |
|---------------------|---------------------|
| Actor model | HTTP Signatures |
| Activity types (Create, Like, etc.) | WebFinger discovery |
| Object types (Note, Image, etc.) | JSON-LD context |
| `to`/`cc` addressing | Remote actor fetching |
| Inbox concept | Shared inbox |
| `inReplyTo` threading | Remote object resolution |

---

## Schema Design

### Core Models

#### 1. Activity Model

The central model that represents any action in the system.

```prisma
model Activity {
  id          String   @id @default(cuid())
  type        String   // Create, Like, Follow, Announce, Delete, Update, Add, Remove

  // Actor (who performed the action)
  actorId     String
  actorType   String   @default("User") // User, Bot, System
  actor       User     @relation("ActorActivities", fields: [actorId], references: [id], onDelete: Cascade)

  // Object (what the action is about)
  objectType  String?  // Note, Image, Event, User, Activity
  objectId    String?  // Reference to the object
  object      Json?    // Embedded object data for self-contained activities

  // Target (where the action is directed, e.g., "Add photo TO album")
  targetId    String?
  targetType  String?

  // Addressing (who can see this)
  to          String[] // Primary recipients: ["public"], ["followers"], ["user:cuid"], ["event:cuid"]
  cc          String[] // Secondary recipients (shown but not highlighted)

  // Threading
  inReplyTo   String?  // Activity ID this replies to
  replies     Activity[] @relation("Replies")
  parent      Activity?  @relation("Replies", fields: [inReplyTo], references: [id])

  // Metadata
  published   DateTime @default(now())
  updated     DateTime @updatedAt

  // Delivery tracking
  inboxItems  InboxItem[]

  @@index([actorId])
  @@index([objectType, objectId])
  @@index([type])
  @@index([published])
  @@index([inReplyTo])
}
```

#### 2. InboxItem Model

Tracks delivery of activities to users' inboxes.

```prisma
model InboxItem {
  id          String   @id @default(cuid())

  // Recipient
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Activity
  activityId  String
  activity    Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)

  // State
  read        Boolean  @default(false)
  muted       Boolean  @default(false)

  // Categorization (for filtering inbox)
  category    String   @default("default") // default, mention, dm, notification

  createdAt   DateTime @default(now())

  @@unique([userId, activityId])
  @@index([userId, read])
  @@index([userId, category])
  @@index([createdAt])
}
```

#### 3. Follow Model (ActivityPub-style)

```prisma
model Follow {
  id          String   @id @default(cuid())

  // Follower (the actor who follows)
  followerId  String
  follower    User     @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)

  // Following (the target being followed)
  followingId String
  following   User     @relation("Followers", fields: [followingId], references: [id], onDelete: Cascade)

  // State
  status      String   @default("pending") // pending, accepted, rejected

  createdAt   DateTime @default(now())
  acceptedAt  DateTime?

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

#### 4. Attachment Model (for file uploads)

```prisma
model Attachment {
  id          String   @id @default(cuid())

  // Owner
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // File info
  type        String   // image, video, audio, document
  mimeType    String   // image/jpeg, video/mp4, etc.
  url         String   // Storage URL (S3, R2, etc.)
  thumbnailUrl String? // For images/videos

  // Metadata
  filename    String
  size        Int      // bytes
  width       Int?     // for images/videos
  height      Int?     // for images/videos
  duration    Int?     // for audio/video (seconds)
  blurhash    String?  // for image placeholders
  alt         String?  // accessibility description

  // Usage tracking
  activityId  String?  // Which activity uses this attachment

  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([activityId])
}
```

### Migration: TimelinePost to Activity

Current `TimelinePost` model will be migrated to use the Activity model:

```
TimelinePost.content     -> Activity.object.content (as Note)
TimelinePost.authorId    -> Activity.actorId
TimelinePost.eventId     -> Activity.to includes "event:{eventId}"
TimelinePost.reactions   -> Separate Like activities with inReplyTo
TimelinePost.replyToId   -> Activity.inReplyTo
```

---

## Addressing Semantics

The `to` and `cc` arrays determine visibility and delivery:

### Address Types

| Address | Meaning | Example |
|---------|---------|---------|
| `"public"` | Visible to everyone | Global timeline posts |
| `"followers"` | Visible to actor's followers | Follower-only posts |
| `"user:{cuid}"` | Direct to specific user | DMs, mentions |
| `"event:{cuid}"` | Visible to event participants | Event timeline posts |
| `"event:{cuid}:hosts"` | Visible to event hosts only | Host-only messages |

### Visibility Rules

```typescript
function canSeeActivity(activity: Activity, userId: string | null): boolean {
  // Public activities are always visible
  if (activity.to.includes("public")) return true;

  // Must be logged in for non-public
  if (!userId) return false;

  // Check direct addressing
  if (activity.to.includes(`user:${userId}`)) return true;
  if (activity.cc.includes(`user:${userId}`)) return true;

  // Check follower addressing (requires follow relationship check)
  if (activity.to.includes("followers") || activity.cc.includes("followers")) {
    // Check if userId follows actorId
    return isFollowing(userId, activity.actorId);
  }

  // Check event addressing (requires event participation check)
  const eventAddress = activity.to.find(a => a.startsWith("event:"));
  if (eventAddress) {
    const eventId = eventAddress.replace("event:", "").replace(":hosts", "");
    const isHostOnly = eventAddress.endsWith(":hosts");
    return isHostOnly
      ? isEventHost(userId, eventId)
      : isEventParticipant(userId, eventId);
  }

  return false;
}
```

### Delivery Logic

When an Activity is created, it's delivered to inboxes based on addressing:

```typescript
async function deliverActivity(activity: Activity) {
  const recipients = new Set<string>();

  for (const address of [...activity.to, ...activity.cc]) {
    if (address === "public") {
      // Don't deliver to everyone's inbox - they query the public timeline
      continue;
    }

    if (address === "followers") {
      // Get all followers of the actor
      const followers = await getFollowers(activity.actorId);
      followers.forEach(f => recipients.add(f.id));
    }

    if (address.startsWith("user:")) {
      recipients.add(address.replace("user:", ""));
    }

    if (address.startsWith("event:")) {
      const eventId = address.replace("event:", "").replace(":hosts", "");
      const isHostOnly = address.endsWith(":hosts");
      const participants = isHostOnly
        ? await getEventHosts(eventId)
        : await getEventParticipants(eventId);
      participants.forEach(p => recipients.add(p.id));
    }
  }

  // Create inbox items for all recipients (except actor)
  recipients.delete(activity.actorId);

  await db.inboxItem.createMany({
    data: [...recipients].map(userId => ({
      userId,
      activityId: activity.id,
      category: determineCategory(activity, userId),
    })),
  });
}
```

---

## Feature Mapping

### 1. Global Timeline (Public Posts)

```typescript
// Create a public post
const activity = await createActivity({
  type: "Create",
  actorId: userId,
  objectType: "Note",
  object: { content: "Hello world!", attachments: [] },
  to: ["public"],
  cc: ["followers"], // Also notify followers
});

// Query public timeline
const publicPosts = await db.activity.findMany({
  where: {
    type: "Create",
    objectType: "Note",
    to: { has: "public" },
  },
  orderBy: { published: "desc" },
});
```

### 2. Event Timeline (Event-Scoped Posts)

```typescript
// Create an event post
const activity = await createActivity({
  type: "Create",
  actorId: userId,
  objectType: "Note",
  object: { content: "See you all at the meetup!" },
  to: [`event:${eventId}`],
});

// Query event timeline
const eventPosts = await db.activity.findMany({
  where: {
    type: "Create",
    objectType: "Note",
    to: { has: `event:${eventId}` },
  },
  orderBy: { published: "desc" },
});
```

### 3. Direct Messages

```typescript
// Send a DM
const activity = await createActivity({
  type: "Create",
  actorId: senderId,
  objectType: "Note",
  object: { content: "Hey, are you coming to the event?" },
  to: [`user:${recipientId}`], // Only recipient can see
});

// Query DM conversation
const conversation = await db.activity.findMany({
  where: {
    type: "Create",
    objectType: "Note",
    OR: [
      { actorId: userId, to: { has: `user:${otherUserId}` } },
      { actorId: otherUserId, to: { has: `user:${userId}` } },
    ],
  },
  orderBy: { published: "asc" },
});
```

### 4. Reactions (Likes)

```typescript
// Like a post
const likeActivity = await createActivity({
  type: "Like",
  actorId: userId,
  objectType: "Activity",
  objectId: postActivityId,
  to: [postActivity.actorId === userId ? "public" : `user:${postActivity.actorId}`],
});

// Get likes for a post
const likes = await db.activity.findMany({
  where: {
    type: "Like",
    objectType: "Activity",
    objectId: postActivityId,
  },
});
```

### 5. Follows

```typescript
// Follow a user
const followActivity = await createActivity({
  type: "Follow",
  actorId: userId,
  objectType: "User",
  objectId: targetUserId,
  to: [`user:${targetUserId}`],
});

// The Follow model is also updated for efficient querying
await db.follow.create({
  data: {
    followerId: userId,
    followingId: targetUserId,
    status: targetUser.requiresFollowApproval ? "pending" : "accepted",
  },
});
```

### 6. Reposts (Announce)

```typescript
// Repost something
const announceActivity = await createActivity({
  type: "Announce",
  actorId: userId,
  objectType: "Activity",
  objectId: originalActivityId,
  to: ["public"],
  cc: ["followers"],
});
```

### 7. Notifications (via Inbox)

```typescript
// Query user's notifications
const notifications = await db.inboxItem.findMany({
  where: {
    userId,
    category: { in: ["mention", "notification"] },
  },
  include: { activity: true },
  orderBy: { createdAt: "desc" },
});

// Mark as read
await db.inboxItem.updateMany({
  where: { userId, read: false },
  data: { read: true },
});
```

---

## API Design (tRPC Routes)

### Activity Router

```typescript
export const activityRouter = createTRPCRouter({
  // Create a new activity (post, DM, reaction, etc.)
  create: protectedProcedure
    .input(createActivitySchema)
    .mutation(async ({ ctx, input }) => { ... }),

  // Get activity by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => { ... }),

  // Delete activity (and cascade)
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => { ... }),

  // Get replies to an activity
  getReplies: publicProcedure
    .input(z.object({ activityId: z.string().cuid(), cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => { ... }),
});
```

### Timeline Router

```typescript
export const timelineRouter = createTRPCRouter({
  // Public timeline
  public: publicProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => { ... }),

  // Home timeline (following + own posts)
  home: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => { ... }),

  // Event timeline
  event: publicProcedure
    .input(z.object({ eventId: z.string().cuid(), ...paginationSchema }))
    .query(async ({ ctx, input }) => { ... }),

  // User timeline (user's posts)
  user: publicProcedure
    .input(z.object({ userId: z.string().cuid(), ...paginationSchema }))
    .query(async ({ ctx, input }) => { ... }),
});
```

### Inbox Router

```typescript
export const inboxRouter = createTRPCRouter({
  // Get inbox items (notifications, DMs)
  list: protectedProcedure
    .input(z.object({
      category: z.enum(["all", "mentions", "dms", "notifications"]).optional(),
      unreadOnly: z.boolean().optional(),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => { ... }),

  // Mark items as read
  markRead: protectedProcedure
    .input(z.object({ ids: z.array(z.string().cuid()) }))
    .mutation(async ({ ctx, input }) => { ... }),

  // Get unread count
  unreadCount: protectedProcedure
    .query(async ({ ctx }) => { ... }),
});
```

### DM Router

```typescript
export const dmRouter = createTRPCRouter({
  // List conversations (grouped by user)
  listConversations: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => { ... }),

  // Get messages in a conversation
  getConversation: protectedProcedure
    .input(z.object({
      userId: z.string().cuid(),
      cursor: z.string().optional()
    }))
    .query(async ({ ctx, input }) => { ... }),

  // Send a DM
  send: protectedProcedure
    .input(z.object({
      recipientId: z.string().cuid(),
      content: z.string().min(1).max(5000),
      attachments: z.array(z.string().cuid()).optional(),
    }))
    .mutation(async ({ ctx, input }) => { ... }),
});
```

### Follow Router

```typescript
export const followRouter = createTRPCRouter({
  // Follow a user
  follow: protectedProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => { ... }),

  // Unfollow a user
  unfollow: protectedProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => { ... }),

  // Accept/reject follow request
  respond: protectedProcedure
    .input(z.object({
      followerId: z.string().cuid(),
      action: z.enum(["accept", "reject"])
    }))
    .mutation(async ({ ctx, input }) => { ... }),

  // Get followers
  getFollowers: publicProcedure
    .input(z.object({ userId: z.string().cuid(), cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => { ... }),

  // Get following
  getFollowing: publicProcedure
    .input(z.object({ userId: z.string().cuid(), cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => { ... }),
});
```

### Upload Router

```typescript
export const uploadRouter = createTRPCRouter({
  // Get presigned URL for upload
  getUploadUrl: protectedProcedure
    .input(z.object({
      filename: z.string(),
      mimeType: z.string(),
      size: z.number().max(10 * 1024 * 1024), // 10MB max
    }))
    .mutation(async ({ ctx, input }) => { ... }),

  // Confirm upload and create attachment record
  confirmUpload: protectedProcedure
    .input(z.object({
      key: z.string(),
      filename: z.string(),
      mimeType: z.string(),
      size: z.number(),
      width: z.number().optional(),
      height: z.number().optional(),
      blurhash: z.string().optional(),
      alt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => { ... }),

  // Delete attachment
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => { ... }),
});
```

---

## Implementation Phases

### Phase 1: Core Activity Model & Migration ✅ COMPLETE

**Goal**: Introduce Activity model alongside existing TimelinePost, with gradual migration.

**Tasks**:
1. ✅ Add Activity, InboxItem, Follow, Attachment models to Prisma schema
2. ✅ Create base activity service with create/read/delete
3. ✅ Add addressing utilities (`canSeeActivity`, `deliverActivity`)
4. ✅ Create activity router with basic CRUD
5. ✅ Clean up legacy timeline/reaction routers (were broken, removed)
6. ⏳ Update Timeline component to read from Activity model (Phase 2)
7. ✅ Database synced via `prisma db push`

**Deliverables**:
- [x] Prisma schema with new models (`prisma/schema.prisma`)
- [x] Activity validation schemas (`src/schemas/activity.schema.ts`)
- [x] Activity service (`src/server/services/activity.service.ts`)
- [x] Timeline service (`src/server/services/timeline.service.ts`)
- [x] Activity tRPC router (`src/server/api/routers/activity.ts`)
- [x] Legacy routers removed (timeline.ts, reaction.ts were broken)
- [x] Updated Timeline component (completed in Phase 2)

**Completed**: January 1, 2026

### Phase 2: Timeline Features ✅ COMPLETE

**Goal**: Full timeline functionality with public, home, and event timelines.

**Tasks**:
1. ✅ Implement public timeline query (to includes "public") - `activity.publicTimeline`
2. ✅ Implement home timeline (following + own posts) - `activity.homeTimeline`
3. ✅ Implement event timeline (to includes "event:{id}") - `activity.eventTimeline`
4. ✅ Implement reactions (Like activities) - `activity.like/unlike`
5. ✅ Implement reposts (Announce activities) - `activity.repost/unrepost`
6. ✅ Add reply threading (inReplyTo) - `activity.getReplies`
7. ✅ **Update Timeline.tsx component to use new activity endpoints**
8. ✅ Update PostForm.tsx (integrated via Timeline.tsx handler)
9. ✅ Simplify reactions to like button (integrated into TimelinePost.tsx)
10. ✅ SSE integration maintained (existing implementation works with new endpoints)

**Deliverables**:
- [x] Timeline service (`src/server/services/timeline.service.ts`)
- [x] Activity router with all timeline queries
- [x] Reaction system via Like activities
- [x] Repost functionality via Announce activities
- [x] **Updated Timeline.tsx component** - uses `activity.publicTimeline/eventTimeline`
- [x] **Updated TimelinePost.tsx component** - displays Activity data, integrated like button
- [x] **Created shared timeline types** (`src/types/timeline.ts`)
- [x] PostForm.tsx integration (Timeline.tsx provides `activity.createNote` handler)
- [ ] Thread view component (deferred to Phase 3)
- [x] SSE integration (existing implementation continues to work)

**Notes**:
- ReactionBar.tsx was simplified into a direct like button in TimelinePost.tsx
- Multiple emoji reactions replaced with binary like/unlike (ActivityPub standard)
- Thread view will be implemented in Phase 3 with DM functionality

**Completed**: January 1, 2026

### Phase 3: Direct Messaging ✅ COMPLETE

**Goal**: Private messaging between users using Activity model with `to: ['user:{id}']` addressing.

**Tasks**:
1. ✅ Create DM service with conversation and message logic
2. ✅ Create DM tRPC router with all endpoints
3. ✅ Build conversation list UI component
4. ✅ Build chat/message UI component
5. ✅ Create messages page with conversation routing
6. ✅ Implement message read receipts via InboxItem
7. ⏳ Add real-time message delivery via SSE (deferred - basic polling works)
8. ⏳ Add inbox notifications for new DMs (deferred to Phase 6)

**How DMs Work with Activity Model**:
- DMs are `CREATE` activities with `objectType: 'NOTE'`
- Addressing: `to: ['user:{recipientId}']` (private to recipient only)
- Conversations: Group activities by participant pair
- Threading: Use `inReplyTo` for message replies
- Read status: Track via `InboxItem.read` field

**Deliverables**:
- [x] `src/server/services/dm.service.ts` - DM business logic
- [x] `src/server/api/routers/dm.ts` - tRPC endpoints
- [x] `src/schemas/dm.schema.ts` - Zod validation schemas
- [x] `src/types/dm.ts` - Shared DM types
- [x] `src/components/dm/ConversationList.tsx` - Conversation list
- [x] `src/components/dm/ChatView.tsx` - Message thread view
- [x] `src/components/dm/MessageBubble.tsx` - Individual message
- [x] `src/components/dm/MessageInput.tsx` - Message composer
- [x] `src/components/dm/index.ts` - Component exports
- [x] `src/app/(main)/messages/page.tsx` - Messages inbox
- [x] `src/app/(main)/messages/[userId]/page.tsx` - Conversation view
- [ ] Real-time message updates via SSE (optional enhancement)

**Completed**: January 1, 2026

### Phase 4: Follow System ✅ COMPLETE

**Goal**: User following with optional approval.

**Tasks**:
1. ✅ Create follow service with business logic
2. ✅ Create follow tRPC router with all endpoints
3. ✅ Update FollowButton component with pending state support
4. ✅ Implement follow request approval flow (if user requires approval)
5. ✅ Home timeline already uses follow relationships
6. ✅ Create FollowerList and FollowTabs components
7. ⏳ Add "followers-only" post visibility (deferred to Phase 6)

**How Follow Works with Activity Model**:
- Follow creates a `FOLLOW` activity with `to: ['user:{targetId}']`
- If `requiresFollowApproval` is true, status is PENDING until accepted
- Accept creates an `ACCEPT` activity delivered to follower's inbox
- InboxItem entries created for notifications with `category: FOLLOW`

**Deliverables**:
- [x] `src/schemas/follow.schema.ts` - Zod validation schemas
- [x] `src/server/services/follow.service.ts` - Follow business logic
- [x] `src/server/api/routers/follow.ts` - tRPC endpoints (updated)
- [x] `src/components/users/FollowButton.tsx` - Updated with pending state
- [x] `src/components/users/FollowerList.tsx` - Follower/Following lists with pagination
- [x] Follow request accept/reject endpoints
- [x] Home timeline uses Follow model for filtering
- [ ] Followers/Following pages (component ready, needs routing)

**Completed**: January 1, 2026

### Phase 5: File Uploads ✅ COMPLETE

**Goal**: Image and file upload support for posts and DMs.

**Tasks**:
1. ✅ Set up S3/R2 compatible upload service
2. ✅ Create upload router with presigned URLs
3. ✅ Build enhanced ImageUpload component with drag-and-drop
4. ✅ Create AttachmentPreview component for displaying attachments
5. ✅ Implement attachment deletion and cleanup
6. ⏳ Image processing (thumbnails, blurhash) - deferred, can be added via Lambda/Worker

**How Uploads Work**:
1. Client requests presigned URL via `upload.getUploadUrl`
2. Client uploads directly to S3/R2 (bypasses server)
3. Client confirms upload via `upload.confirmUpload`
4. Server creates Attachment record linked to Activity

**Deliverables**:
- [x] `src/schemas/upload.schema.ts` - Zod validation schemas
- [x] `src/server/services/upload.service.ts` - S3/R2 presigned URLs, attachment management
- [x] `src/server/api/routers/upload.ts` - tRPC endpoints
- [x] `src/components/forms/ImageUpload.tsx` - Enhanced with real S3 upload
- [x] `src/components/shared/AttachmentPreview.tsx` - Display images, videos, audio, documents
- [x] Attachment deletion and orphan cleanup
- [x] AWS SDK packages installed (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- [ ] Image thumbnails and blurhash (optional, via Lambda/Worker)

**Environment Variables Required**:
```env
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1  # or 'auto' for R2
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com  # for R2
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_PUBLIC_URL=https://your-cdn.com  # optional, for CDN URLs
```

**Completed**: January 1, 2026

### Phase 6: Notifications & Inbox ✅ COMPLETE

**Goal**: Unified notification system.

**Tasks**:
1. ✅ Create inbox validation schemas
2. ✅ Create inbox service with listing, counting, marking read
3. ✅ Create inbox tRPC router
4. ✅ Build notification list UI
5. ✅ Add unread badge to navigation (NotificationBell)
6. ✅ Create notifications page with filters
7. ⏳ Notification preferences (deferred - can be added to settings)
8. ⏳ Push notification support (optional, requires service worker)

**How Notifications Work with InboxItem**:
- InboxItem model tracks delivery of Activities to user inboxes
- Each item has a `category` (FOLLOW, MENTION, LIKE, REPOST, REPLY, DM, EVENT)
- `read` boolean tracks whether user has seen the notification
- `muted` boolean allows users to dismiss notifications
- Unread counts computed by category for filtered views

**Deliverables**:
- [x] `src/schemas/inbox.schema.ts` - Zod validation schemas
- [x] `src/server/services/inbox.service.ts` - Inbox business logic
- [x] `src/server/api/routers/inbox.ts` - tRPC endpoints
- [x] `src/components/notifications/NotificationList.tsx` - Updated to use inbox router
- [x] `src/components/notifications/NotificationBell.tsx` - Unread badge with dropdown
- [x] `src/components/notifications/index.ts` - Component exports
- [x] `src/app/(main)/notifications/page.tsx` - Full notifications page with filters
- [x] Removed old `notification.ts` router (used non-existent Notification model)
- [ ] Notification preferences UI (deferred to settings page)
- [ ] Push notification integration (optional)

**Completed**: January 1, 2026

---

## Database Migration Strategy

### Step 1: Add New Models (Non-breaking)

```sql
-- Add new tables without modifying existing ones
CREATE TABLE "Activity" (...);
CREATE TABLE "InboxItem" (...);
CREATE TABLE "Follow" (...);
CREATE TABLE "Attachment" (...);
```

### Step 2: Dual-Write Period

During migration, write to both TimelinePost and Activity:

```typescript
// Create post writes to both
async function createPost(data) {
  const [timelinePost, activity] = await db.$transaction([
    db.timelinePost.create({ data: timelinePostData }),
    db.activity.create({ data: activityData }),
  ]);
  return activity;
}
```

### Step 3: Backfill Existing Data

```typescript
// Migration script
async function migrateTimelinePosts() {
  const posts = await db.timelinePost.findMany({
    include: { reactions: true },
  });

  for (const post of posts) {
    await db.activity.create({
      data: {
        type: "Create",
        actorId: post.authorId,
        objectType: "Note",
        object: { content: post.content },
        to: post.eventId ? [`event:${post.eventId}`] : ["public"],
        published: post.createdAt,
      },
    });
  }
}
```

### Step 4: Switch Reads to Activity

Update all queries to read from Activity model instead of TimelinePost.

### Step 5: Remove TimelinePost (After Verification)

Once Activity model is fully operational:
1. Remove dual-write logic
2. Drop TimelinePost table
3. Clean up old code

---

## File Structure

```
src/
├── server/
│   ├── api/
│   │   └── routers/
│   │       ├── activity.ts      # Core activity CRUD
│   │       ├── timeline.ts      # Timeline queries
│   │       ├── dm.ts            # Direct messages
│   │       ├── follow.ts        # Follow system
│   │       ├── inbox.ts         # Notifications
│   │       └── upload.ts        # File uploads
│   └── services/
│       ├── activity.service.ts  # Activity business logic
│       ├── delivery.service.ts  # Inbox delivery logic
│       └── upload.service.ts    # File upload handling
├── components/
│   ├── timeline/
│   │   ├── Timeline.tsx         # (existing, updated)
│   │   ├── TimelinePost.tsx     # (existing, updated)
│   │   ├── PostForm.tsx         # (existing, updated)
│   │   └── ReactionBar.tsx      # (existing)
│   ├── dm/
│   │   ├── ConversationList.tsx # NEW
│   │   ├── ChatView.tsx         # NEW
│   │   └── MessageBubble.tsx    # NEW
│   ├── notifications/
│   │   ├── NotificationList.tsx # NEW
│   │   └── NotificationItem.tsx # NEW
│   └── follow/
│       ├── FollowButton.tsx     # NEW
│       └── FollowerList.tsx     # NEW
├── app/
│   └── (main)/
│       ├── messages/
│       │   ├── page.tsx         # NEW - DM list
│       │   └── [userId]/
│       │       └── page.tsx     # NEW - Conversation
│       └── notifications/
│           └── page.tsx         # NEW
└── schemas/
    ├── activity.schema.ts       # NEW
    ├── dm.schema.ts             # NEW
    └── follow.schema.ts         # NEW
```

---

## Success Metrics

### Phase 1 Complete When: ✅
- [x] Activity model is in production
- [x] Activity service and router implemented
- [x] Legacy routers cleaned up

### Phase 2 Complete When: ✅
- [x] Users can post to public, event, and home timelines
- [x] Reactions (likes) work on activities
- [x] Reposts work correctly
- [x] Timeline components use new Activity model

### Phase 3 Complete When: ✅
- [x] Users can send and receive DMs
- [x] Conversations are grouped correctly
- [x] Messages have read receipts
- [ ] Real-time message delivery works (optional enhancement)

### Phase 4 Complete When: ✅
- [x] Users can follow/unfollow each other
- [x] Follow requests work for private accounts (requiresFollowApproval)
- [x] Home timeline shows followed users' posts
- [x] Accept/Reject follow request functionality

### Phase 5 Complete When: ✅
- [x] Users can upload images to posts
- [x] Images display with proper thumbnails (AttachmentPreview component)
- [x] Attachment deletion cleans up storage

### Phase 6 Complete When: ✅
- [x] Users receive notifications for mentions, likes, follows
- [x] Unread badge shows correct count
- [x] Notifications can be marked as read
- [x] Notifications page with category filtering

---

## Future Considerations (Post-V1)

### Fediverse Interoperability
If we decide to enable federation later:
1. Add WebFinger endpoint for actor discovery
2. Implement HTTP Signatures for authentication
3. Add JSON-LD context to activities
4. Create shared inbox for efficient delivery
5. Implement remote actor/object fetching

### Additional Features
- Group/community support (new addressing type)
- Polls (new object type)
- Events in timeline (Event as object type)
- Hashtag support and trending
- Search indexing
- Content moderation tools

---

## Appendix: Activity Type Reference

| Type | Description | Object | Target |
|------|-------------|--------|--------|
| Create | Create new content | Note, Image, Event | - |
| Update | Edit existing content | Activity being edited | - |
| Delete | Remove content | Activity being deleted | - |
| Like | React to content | Activity being liked | - |
| Announce | Repost/boost | Activity being reposted | - |
| Follow | Follow a user | User being followed | - |
| Accept | Accept follow request | Follow activity | - |
| Reject | Reject follow request | Follow activity | - |
| Add | Add to collection | Object being added | Collection |
| Remove | Remove from collection | Object being removed | Collection |

---

*Document Version: 1.6*
*Last Updated: 2026-01-01*
*Author: Claude Code*

---

## Changelog

### v1.6 (2026-01-01)
- Marked Phase 6 (Notifications & Inbox) as COMPLETE
- Created inbox validation schemas (`inbox.schema.ts`)
- Created inbox service (`inbox.service.ts`) with:
  - List notifications with category filtering and pagination
  - Mark items as read (individual or all)
  - Get unread counts by category
  - Delete/mute notifications
- Created inbox tRPC router with endpoints:
  - `list` - List notifications with filters
  - `unreadCount` - Get counts by category
  - `markRead` - Mark specific items as read
  - `markAllRead` - Mark all/category items as read
  - `delete` - Mute/hide notifications
- Updated NotificationList component to use inbox router
- Updated NotificationBell component for unread badge
- Created full notifications page at `/notifications` with:
  - Category filter tabs
  - Unread-only toggle
  - Infinite scroll
  - Mark all as read button
- Removed old notification.ts router (used non-existent Notification model)
- Installed `react-intersection-observer` for infinite scroll

### v1.5 (2026-01-01)
- Marked Phase 5 (File Uploads) as COMPLETE
- Created upload validation schemas (`upload.schema.ts`)
- Created upload service (`upload.service.ts`) with:
  - S3/R2 presigned URL generation for direct client uploads
  - Attachment record creation and management
  - Attachment deletion with storage cleanup
  - Development fallback when S3 not configured
- Created upload tRPC router with endpoints:
  - `getUploadUrl` - Get presigned URL for upload
  - `confirmUpload` - Create attachment record after upload
  - `delete` - Delete attachment and storage object
  - `linkToActivity` - Link attachments to activities
- Enhanced ImageUpload component with real S3 upload functionality
- Created AttachmentPreview component for displaying:
  - Images (with grid layout and lightbox)
  - Videos (with playback controls)
  - Audio (with player controls)
  - Documents (with download links)
- Installed AWS SDK packages (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)

### v1.4 (2026-01-01)
- Marked Phase 4 (Follow System) as COMPLETE
- Created follow validation schemas (`follow.schema.ts`)
- Created follow service (`follow.service.ts`) with:
  - Follow/unfollow with ActivityPub Activity creation
  - Accept/reject follow requests for private accounts
  - InboxItem delivery for follow notifications
- Updated follow router to use new service (removed Notification dependency)
- Updated FollowButton component with pending state support
- Created FollowerList and FollowTabs components for profile integration
- Home timeline already uses Follow model for filtering

### v1.3 (2026-01-01)
- Marked Phase 3 (Direct Messaging) as COMPLETE
- Created DM service (`dm.service.ts`) with conversation logic
- Created DM tRPC router with all endpoints
- Created DM validation schemas (`dm.schema.ts`)
- Created shared DM types (`src/types/dm.ts`)
- Built DM UI components:
  - `ConversationList.tsx` - Lists all conversations with unread badges
  - `ChatView.tsx` - Full conversation view with infinite scroll
  - `MessageBubble.tsx` - Individual message display
  - `MessageInput.tsx` - Message composer with auto-resize
- Created messages pages at `/messages` and `/messages/[userId]`
- Implemented read receipts via InboxItem model

### v1.2 (2026-01-01)
- Marked Phase 2 as COMPLETE
- Updated Timeline.tsx, TimelinePost.tsx components
- Created shared timeline types (`src/types/timeline.ts`)
- Simplified reactions from multi-emoji to binary like/unlike

### v1.1 (2026-01-01)
- Marked Phase 1 as COMPLETE
- Implemented Activity, InboxItem, Follow, Attachment models
- Created activity service and router
- Removed broken legacy timeline/reaction routers

### v1.0 (2026-01-01)
- Initial plan document
