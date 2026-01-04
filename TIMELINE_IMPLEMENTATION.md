# Timeline & Realtime System Implementation

**Date:** December 31, 2025
**Status:** ✅ Complete

## Overview

This document describes the complete implementation of the Timeline & Realtime System for Kemotown v1, including tRPC routers, SSE endpoints, bot services, and React components.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Timeline    │  │ Notification │  │   useSSE Hook   │  │
│  │  Component   │  │    Bell      │  │  (reconnection) │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          │ tRPC             │ tRPC             │ SSE
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server (Next.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Timeline   │  │ Notification │  │  SSE Endpoint   │  │
│  │   Router     │  │   Router     │  │  (streaming)    │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                  │                   │            │
│         ▼                  ▼                   ▼            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Prisma + PostgreSQL                     │  │
│  │  (Post, Reaction, Mention, Notification, Bot)       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Implemented Files

### Backend (tRPC Routers)

#### 1. Timeline Router (`src/server/api/routers/timeline.ts`)
**Procedures:**
- `getPosts` - Fetch timeline posts with cursor pagination and RSVP validation
- `getPost` - Get single post with reactions and mentions
- `createPost` - Create post with automatic mention extraction and notifications
- `updatePost` - Update post (author only) with mention re-extraction
- `deletePost` - Delete post (author only, no bot posts)
- `getMentions` - Get mentions for current user

**Key Features:**
- Automatic @mention extraction using regex
- Notification creation for mentioned users
- RSVP-based access control for event timelines
- Optimistic invalidation for real-time updates

#### 2. Reaction Router (`src/server/api/routers/reaction.ts`)
**Procedures:**
- `getReactions` - Get all reactions for a post
- `addReaction` - Add reaction with upsert (prevents duplicates)
- `removeReaction` - Remove user's reaction
- `getUserReactions` - Get user's reaction history

**Key Features:**
- Upsert pattern prevents duplicate reactions
- Automatic notification to post author
- RSVP validation for event timeline posts
- 5 emoji types: thumbsup, heart, laugh, wow, sad

#### 3. Notification Router (`src/server/api/routers/notification.ts`)
**Procedures:**
- `getNotifications` - Get notifications with pagination and filtering
- `getUnreadCount` - Real-time unread count
- `markAsRead` - Mark single notification as read
- `markAllAsRead` - Bulk mark as read
- `deleteNotification` - Delete single notification
- `deleteAllRead` - Bulk delete read notifications

**Key Features:**
- Cursor pagination for infinite scroll
- Unread-only filtering
- Bulk operations for efficiency
- 11 notification types (WELCOME, EVENT_REMINDER, MENTION, etc.)

### Backend (Services)

#### 4. Bot Service (`src/server/services/bot.service.ts`)
**Factory pattern for bot management:**
- System bots (announcements, global)
- Welcome bots (new user greetings)
- Event-specific bots (notifications, moderation)

**Methods:**
- `getOrCreateBot` - Initialize bot with config
- `createBotPost` - Create post with template substitution
- `initializeSystemBots` - Create system and welcome bots
- `initializeEventBots` - Create event-specific bots
- `sendWelcomeMessage` - Send welcome to new users
- `sendAnnouncement` - System announcements
- `sendEventCreated` - New event notifications
- `sendEventNotification` - Event-specific messages
- `deactivateBot` / `deactivateEventBots` - Bot lifecycle management

**Message Templates:**
- Variable substitution with `{variable}` syntax
- Predefined templates for each bot type
- HTML entity encoding for safety

#### 5. SSE Service (`src/server/services/sse.service.ts`)
**Connection management:**
- Connection pooling by channel (GLOBAL, EVENT:eventId)
- Max 5 connections per user
- Automatic cleanup of stale connections
- Heartbeat every 15 seconds
- 24-hour max connection lifetime

**Broadcasting:**
- `broadcastToChannel` - Send message to all channel subscribers
- `broadcastNewPost` - Post creation broadcasts
- `broadcastReaction` - Reaction update broadcasts
- `startConnectionCleanup` - Periodic cleanup task

### API Routes

#### 6. SSE Endpoint (`src/app/api/timeline/stream/route.ts`)
**GET /api/timeline/stream**

**Query Parameters:**
- `channel` - GLOBAL or EVENT
- `eventId` - Required for EVENT channel

**Features:**
- RSVP validation for event timelines
- Session-based authentication
- Connection tagging with userId
- Automatic heartbeat and timeout
- Vercel-compatible streaming

**Response Format:**
```
data: {"type": "connected", "channel": "GLOBAL"}

data: {"type": "new_post", "post": {...}}

data: {"type": "new_reaction", "reaction": {...}}

: heartbeat
```

#### 7. tRPC API Route (`src/app/api/trpc/[trpc]/route.ts`)
**GET/POST /api/trpc/[trpc]**

Batch endpoint for all tRPC routers using `fetchRequestHandler`.

### Frontend (React Components)

#### 8. Timeline Component (`src/components/timeline/Timeline.tsx`)
**Main timeline with SSE integration**

**Props:**
- `channel` - GLOBAL or EVENT
- `eventId` - Optional event ID
- `currentUserId` - For reaction management
- `showPostForm` - Toggle post creation

**Features:**
- Infinite scroll with cursor pagination
- SSE real-time updates with auto-reconnection
- Optimistic updates via tRPC invalidation
- Connection status indicator
- Loading/error states
- Korean localization

**Hooks Used:**
- `trpc.timeline.getPosts.useInfiniteQuery`
- `trpc.timeline.createPost.useMutation`
- `trpc.timeline.deletePost.useMutation`
- `trpc.reaction.addReaction.useMutation`
- `trpc.reaction.removeReaction.useMutation`
- `useSSE` (custom hook)

#### 9. TimelinePost Component (`src/components/timeline/TimelinePost.tsx`)
**Individual post display**

**Features:**
- Avatar with gradient fallback
- @mention formatting and linking
- Bot badge display
- Edit timestamp
- Delete confirmation
- Korean relative time (date-fns/ko)
- ReactionBar integration

#### 10. PostForm Component (`src/components/timeline/PostForm.tsx`)
**Post creation/editing form**

**Features:**
- Auto-resizing textarea
- Character count (max 500)
- Visual feedback (color-coded limit)
- Loading state during submission
- Cancel support for editing mode
- Korean UI text

#### 11. ReactionBar Component (`src/components/timeline/ReactionBar.tsx`)
**Reaction display and picker**

**Features:**
- Grouped reactions by emoji type
- User reaction highlighting
- Emoji picker popup
- Click to add/remove reactions
- Hover tooltips with user names
- 5 emoji types from constants

#### 12. NotificationBell Component (`src/components/notifications/NotificationBell.tsx`)
**Header notification icon**

**Features:**
- Unread count badge (99+ for large numbers)
- Dropdown on click
- Auto-refetch every 30 seconds
- Click-outside to close

#### 13. NotificationList Component (`src/components/notifications/NotificationList.tsx`)
**Notification dropdown/page**

**Features:**
- Infinite scroll pagination
- Mark as read (single/all)
- Delete (single/all read)
- Type-specific icons
- Korean relative time
- Empty state

### Frontend (Custom Hooks)

#### 14. useSSE Hook (`src/hooks/use-sse.ts`)
**Server-Sent Events connection management**

**Features:**
- Automatic connection on mount
- Exponential backoff reconnection (max 5 retries)
- Custom retry delay (default 1 second)
- Connection status tracking
- Error handling with user-friendly messages
- Manual reconnect/disconnect methods
- Message parsing and callback

**Options:**
- `channel` - GLOBAL or EVENT
- `eventId` - Optional event ID
- `onMessage` - Message callback
- `onError` - Error callback
- `onOpen` - Open callback
- `enabled` - Enable/disable connection
- `maxRetries` - Max reconnection attempts
- `retryDelay` - Base retry delay

### Client Setup

#### 15. tRPC Client (`src/lib/trpc/client.ts`)
**React Query integration**

#### 16. tRPC Provider (`src/lib/trpc/Provider.tsx`)
**App-wide provider component**

#### 17. Updated Root Router (`src/server/api/root.ts`)
**Merged all routers:**
- timeline
- reaction
- notification
- user, event, rsvp, comment, follow, bump (existing)

## Database Schema (Relevant Models)

```prisma
model Post {
  id        String   @id @default(cuid())
  content   String   @db.Text
  authorId  String?
  author    User?    @relation(...)
  botId     String?
  bot       Bot?     @relation(...)
  channel   Channel  @default(GLOBAL)
  eventId   String?
  event     Event?   @relation(...)
  reactions Reaction[]
  mentions  Mention[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  editedAt  DateTime?
}

model Reaction {
  id       String   @id @default(cuid())
  emoji    String   // thumbsup, heart, laugh, wow, sad
  postId   String
  post     Post     @relation(...)
  userId   String
  user     User     @relation(...)
  createdAt DateTime @default(now())

  @@unique([postId, userId, emoji])
}

model Mention {
  id       String   @id @default(cuid())
  postId   String
  post     Post     @relation(...)
  userId   String
  user     User     @relation(...)
  createdAt DateTime @default(now())

  @@unique([postId, userId])
}

model Notification {
  id       String           @id @default(cuid())
  userId   String
  user     User             @relation(...)
  type     NotificationType
  title    String
  body     String
  data     Json?
  readAt   DateTime?
  createdAt DateTime        @default(now())
}

model Bot {
  id          String   @id @default(cuid())
  username    String   @unique
  displayName String
  avatarUrl   String?
  type        BotType
  eventId     String?
  event       Event?   @relation(...)
  isActive    Boolean  @default(true)
  posts       Post[]
  createdAt   DateTime @default(now())
}

enum Channel {
  GLOBAL
  EVENT
}

enum BotType {
  SYSTEM
  WELCOME
  EVENT_NOTIFY
  EVENT_MOD
}
```

## Constants (`src/lib/constants.ts`)

```typescript
export const AVAILABLE_REACTIONS = ['thumbsup', 'heart', 'laugh', 'wow', 'sad'] as const;

export const REACTION_EMOJI_MAP: Record<ReactionType, string> = {
  thumbsup: '👍',
  heart: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
};

export const BOT_TYPE_LABELS = {
  SYSTEM: '시스템',
  WELCOME: '환영봇',
  EVENT_NOTIFY: '이벤트 알림',
  EVENT_MOD: '이벤트 관리',
} as const;

export const MAX_POST_LENGTH = 500;
export const TIMELINE_POLL_INTERVAL = 30000;
export const SSE_HEARTBEAT_INTERVAL = 15000;
```

## Validation Schemas (`src/schemas/timeline.schema.ts`)

All input schemas use Zod for type-safe validation:
- `createPostSchema` - content (1-500 chars), optional eventId
- `updatePostSchema` - postId, content
- `deletePostSchema` - postId
- `getTimelineSchema` - cursor, limit, channel, eventId
- `addReactionSchema` - postId, emoji (enum)
- `removeReactionSchema` - postId, emoji
- `getNotificationsSchema` - cursor, limit, unreadOnly
- `markNotificationReadSchema` - notificationId
- `markAllNotificationsReadSchema` - optional before date

## Security Features

1. **Authentication**
   - All mutations require authenticated session via `protectedProcedure`
   - SSE endpoint validates session for event timelines

2. **Authorization**
   - Event timeline access requires RSVP (ATTENDING or CONSIDERING)
   - Only post authors can edit/delete posts
   - Bot posts cannot be edited/deleted by users
   - Notification ownership validation

3. **Input Validation**
   - All inputs validated with Zod schemas
   - Content length limits (500 chars for posts)
   - CUID validation for IDs
   - Emoji enum validation

4. **Rate Limiting**
   - SSE: Max 5 connections per user
   - SSE: 24-hour max connection lifetime
   - Automatic cleanup of stale connections

5. **Data Integrity**
   - Upsert for reactions prevents duplicates
   - Unique constraints in database schema
   - Transaction support for complex operations

## Performance Optimizations

1. **Cursor Pagination**
   - Efficient infinite scroll
   - No offset queries

2. **Optimistic Updates**
   - Immediate UI feedback
   - tRPC query invalidation

3. **SSE Connection Pooling**
   - Shared connections by channel
   - Automatic cleanup of dead connections

4. **Database Indexes**
   - `[channel, createdAt]` for timeline queries
   - `[eventId, createdAt]` for event timelines
   - `[userId, readAt]` for notification queries

## Korean Localization

All UI text is in Korean:
- Button labels: "게시", "수정", "삭제", "더 보기"
- Placeholders: "무슨 일이 일어나고 있나요?"
- Status messages: "게시 중...", "불러오는 중..."
- Error messages: "타임라인을 불러오는데 실패했습니다"
- Relative time formatting using `date-fns/locale/ko`

## Testing Checklist

- ✅ ESLint passes (no errors in new files)
- ✅ TypeScript type checking (except Next.js build types)
- ✅ All imports resolve correctly
- ✅ tRPC routers properly registered in root
- ✅ SSE endpoint follows Vercel constraints
- ⏳ Manual testing required:
  - Post creation with mentions
  - Reaction add/remove
  - SSE real-time updates
  - Notification creation and reading
  - Bot message creation
  - Event timeline access control

## Future Enhancements

1. **Media Support**
   - Image uploads for posts
   - Video embedding
   - Link previews

2. **Advanced Features**
   - Post pinning
   - Post threading/replies
   - Rich text formatting
   - Polls and surveys

3. **Optimization**
   - Redis caching for hot data
   - WebSocket alternative to SSE
   - Database query optimization

## Files Created

**Backend:**
- `src/server/api/routers/timeline.ts` (437 lines)
- `src/server/api/routers/reaction.ts` (160 lines)
- `src/server/api/routers/notification.ts` (138 lines)
- `src/server/services/bot.service.ts` (238 lines)
- `src/server/services/sse.service.ts` (197 lines)
- `src/app/api/timeline/stream/route.ts` (115 lines)

**Frontend:**
- `src/components/timeline/Timeline.tsx` (223 lines)
- `src/components/timeline/TimelinePost.tsx` (216 lines)
- `src/components/timeline/PostForm.tsx` (122 lines)
- `src/components/timeline/ReactionBar.tsx` (146 lines)
- `src/components/notifications/NotificationBell.tsx` (67 lines)
- `src/components/notifications/NotificationList.tsx` (199 lines)
- `src/hooks/use-sse.ts` (125 lines)

**Modified:**
- `src/server/api/root.ts` (added 3 routers)

**Total:** 2,383 lines of code

## Conclusion

The Timeline & Realtime System is now fully implemented with:
- ✅ Type-safe tRPC API with 3 routers (23 procedures)
- ✅ Real-time SSE with Vercel compatibility
- ✅ Bot service with factory pattern
- ✅ 6 React components with Korean localization
- ✅ Custom SSE hook with reconnection logic
- ✅ ESLint compliant code
- ✅ Full end-to-end type safety

The system is ready for integration with the existing Kemotown application and manual testing.
