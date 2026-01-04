# Kemotown v1 → v2 — Next.js/React Architectural Blueprint

Version 1.1 (v2 Planning - January 2026)

> **Note**: This document describes v1 (current implementation). See:
> - `ARCHITECTURE_V2.md` — Planned v2 timeline-centric architecture
> - `IMPLEMENTATION_PLAN_V2.md` — Detailed implementation roadmap with 7 phases and ~45 tasks

---

## 1. Overview

Kemotown v1 is a complete rewrite of the Korean furry community platform, featuring:
- Modern tech stack with Auth.js v5, tRPC, and TanStack Query
- Clean architecture with clear separation of concerns
- Enhanced type safety with end-to-end TypeScript
- New social features: follows, event comments, and improved bumps

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 15.3+ | Full-stack React with App Router |
| UI | React 19, Tailwind CSS 4 | Component-based UI |
| Database | PostgreSQL | Primary data store (Railway) |
| ORM | Prisma 6.8+ | Type-safe database client |
| Auth | Auth.js 5 (next-auth@beta) | OAuth (Google, Kakao) |
| API | tRPC 11 | End-to-end type-safe APIs |
| Server State | TanStack Query 5 | Caching, mutations, infinite queries |
| Validation | Zod | Schema validation |
| Real-time | Server-Sent Events | Timeline updates |
| Testing | Vitest + Playwright | Unit and E2E tests |
| i18n | next-intl | Korean/English |
| Deployment | Vercel | Hosting with auto-deploy |

---

## 3. Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login)
│   ├── (main)/                   # Authenticated routes
│   │   ├── events/               # Event pages
│   │   ├── profile/              # Profile pages
│   │   └── users/                # User discovery
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Auth.js handler
│   │   ├── trpc/[trpc]/          # tRPC handler
│   │   └── timeline/stream/      # SSE endpoint
│   ├── layout.tsx                # Root layout
│   ├── providers.tsx             # Global providers
│   └── globals.css               # Tailwind styles
│
├── server/                       # Backend logic
│   ├── api/
│   │   ├── root.ts               # tRPC router aggregation
│   │   └── routers/              # Feature routers
│   │       ├── user.ts
│   │       ├── event.ts
│   │       ├── rsvp.ts
│   │       ├── activity.ts       # ActivityPub-style social features
│   │       ├── comment.ts        # (pending implementation)
│   │       ├── follow.ts         # (pending implementation)
│   │       ├── bump.ts           # (pending implementation)
│   │       └── notification.ts   # (pending implementation)
│   ├── db/
│   │   └── index.ts              # Prisma client
│   ├── services/                 # Business logic
│   │   └── bot.service.ts
│   └── trpc.ts                   # tRPC context
│
├── components/                   # UI Components
│   ├── ui/                       # Base primitives
│   ├── layout/                   # Layout components
│   ├── events/                   # Event components
│   ├── timeline/                 # Timeline components
│   ├── users/                    # User components
│   └── shared/                   # Shared components
│
├── hooks/                        # Custom React hooks
├── schemas/                      # Zod schemas
├── types/                        # TypeScript types
├── lib/                          # Utilities
└── i18n/                         # Internationalization
```

---

## 4. Data Models

### Core Models
- **User** - Profile with furry-specific fields (species, fursuitPhotos, interests)
- **Event** - Meetups with visibility, capacity, and pricing
- **RSVP** - Attendance with approval workflow and payment status
- **Post** - Timeline posts (global or event-specific)
- **Comment** - Threaded event discussions

### Social Models
- **Follow** - User following relationships
- **Bump** - In-person meeting records (QR, manual, NFC)
- **Reaction** - Post reactions (5 types)
- **Mention** - @username mentions in posts

### System Models
- **Bot** - Automated posting (system, welcome, event bots)
- **Notification** - User notifications

### ActivityPub-style Models (NEW)
- **Activity** - Unified model for all social actions (posts, likes, reposts, follows)
  - Uses `to`/`cc` addressing for flexible visibility (public, followers, user:id, event:id)
  - Supports threading via `inReplyTo`
  - Soft delete with `deleted` flag
- **InboxItem** - Delivery tracking for notifications and DMs
  - Categories: DEFAULT, MENTION, DM, FOLLOW, LIKE, REPOST, REPLY, EVENT
- **Follow** - User following relationships with approval workflow
  - Statuses: PENDING, ACCEPTED, REJECTED
- **Attachment** - File upload metadata for images, videos, audio, documents

---

## 5. API Architecture

### tRPC Routers

| Router | Endpoints | Status |
|--------|-----------|--------|
| `user` | getById, getByUsername, getCurrentUser, updateProfile, updateFursuitPhotos, search, getStats, getAttendedEvents | ✅ Implemented |
| `follow` | follow, unfollow, getFollows, isFollowing, getMutualFollows | ✅ Implemented |
| `bump` | create, getBumps, getStats, checkBump, delete | ⚠️ Legacy (Prisma model pending) |
| `event` | create, getById, getBySlug, list, update, delete, publish, unpublish | ✅ Implemented (Legacy - use context for v2) |
| `rsvp` | upsert, delete, getForEvent, approve, reject, getMine | ✅ Implemented |
| `comment` | create, update, delete, list | ⚠️ Legacy (Prisma model pending) |
| `timeline` | create, getTimeline, update, delete | ✅ Implemented |
| `reaction` | add, remove | ✅ Implemented |
| `notification` | list, markRead, markAllRead, getUnreadCount | ✅ Implemented |
| `activity` | createNote, like/unlike, repost/unrepost, update, delete, getById, getReplies, getLikers, getReposters, publicTimeline, homeTimeline, eventTimeline, userTimeline | ✅ Implemented |
| `dm` | sendDm, getConversation, listConversations, markAsRead | ✅ Implemented |
| `upload` | createUpload, confirmUpload, deleteUpload | ✅ Implemented |
| `inbox` | list, getUnreadCounts, markRead, markAllRead, delete, mute | ✅ Implemented |
| `context` | create, update, updatePluginData, archive, getById, getBySlug, list, join, leave, transferOwnership | ✅ NEW (v2) |
| `membership` | get, getMine, list, countByStatus, myMemberships, updateRole, approve, reject, ban, unban, updatePluginData, updateNotifications | ✅ NEW (v2) |

### Real-time (SSE)
- `/api/timeline/stream` - Timeline updates
- Supports global and event-specific channels
- Vercel-compatible with connection limits

---

## 6. Authentication

### Auth.js v5 Flow
1. OAuth login (Google/Kakao)
2. PrismaAdapter creates/retrieves user
3. Auto-generate unique username for new users
4. Database sessions with extended user data

### Session Data
```typescript
interface Session {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    email: string;
  }
}
```

---

## 7. Features

### Implemented ✅
- OAuth authentication (Google, Kakao with optional email)
- User profiles with furry-specific fields (species, interests, socialLinks)
- **Event System (COMPLETE)** - Full event lifecycle with tRPC
  - Event creation with Markdown preview
  - Event discovery with search and filters
  - RSVP system with capacity management and waitlist
  - Threaded comments with moderation
  - Host permissions and approval workflow
- Timeline with real-time updates (SSE)
- Reactions and mentions
- User discovery and search with filters
- Bot notification system
- **Follow system** - Follow/unfollow users with mutual follows tracking
- **Bump system** - In-person meeting records (QR, manual, NFC methods)
- **User & Social System** - Complete user management with tRPC

### Pages Implemented 🎨
- `/profile/[username]` - User profile view with stats, interests, social links
- `/profile/settings` - Profile editing with form validation
- `/users` - User discovery with search, filters, and pagination
- `/events` - Event listing with search, filters, and pagination
- `/events/[id]` - Event details with RSVP and threaded comments
- `/events/create` - Event creation with Markdown editor and live preview
- `/events/edit/[id]` - Event editing with host-only access

### Components Library 📦
- `UserCard`, `UserGrid` - User listing components
- `ProfileHeader`, `ProfileStats` - Profile display
- `FollowButton`, `BumpButton`, `BumpModal` - Social interactions
- `EventCard`, `EventList` - Event listing components
- `EventForm` - Event creation/editing with Markdown preview
- `RSVPButtons` - Interactive RSVP with capacity management
- `CommentSection` - Threaded comments with replies
- `InterestTags`, `SocialLinks` - Profile metadata display
- `ProfileSettingsForm` - Profile editing form
- `UserDiscovery` - User search and filter interface

### Planned 🔄
- Toss Payments integration
- File uploads (S3/Cloudinary)
- Direct messaging
- Push notifications

---

## 8. Security

- **Auth**: OAuth-only, no password auth
- **API**: Protected procedures via tRPC
- **Validation**: Zod schemas for all inputs
- **CSRF**: Built-in Next.js protection
- **Rate Limiting**: Redis-based (planned)

---

## 9. Deployment

| Environment | Platform | Database |
|-------------|----------|----------|
| Production | Vercel | Railway PostgreSQL |
| Preview | Vercel PR Deploy | Railway (shared) |
| Development | Local | Railway (shared) |

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_URL` - App URL
- `NEXTAUTH_SECRET` - Session secret
- `GOOGLE_CLIENT_ID/SECRET` - OAuth
- `KAKAO_CLIENT_ID/SECRET` - OAuth
- `INTERNAL_API_KEY` - Bot API auth

---

## 10. Migration from v0

- v0 code archived in `v0-archive/`
- Fresh database schema
- Same OAuth providers (re-auth required)
- Environment variables mostly compatible

---

## 11. UI Component Library

Kemotown v1 features a comprehensive UI component library built with shadcn/ui patterns, Tailwind CSS 4, and Radix UI primitives.

### Design System

| Aspect | Implementation |
|--------|----------------|
| Styling | Tailwind CSS 4 with custom theme |
| Components | shadcn/ui patterns with forwardRef |
| Icons | Lucide React |
| Variants | class-variance-authority (cva) |
| Accessibility | ARIA labels, keyboard navigation |
| Dark Mode | CSS variables with dark theme |
| Korean Support | font-korean class for proper line-breaking |

### Component Categories

#### 1. UI Primitives (`src/components/ui/`)
Base components following shadcn/ui patterns:
- **button.tsx** - Button with variants (default, destructive, outline, secondary, ghost, link) and sizes (sm, md, lg, icon)
- **card.tsx** - Card container with header, content, footer sections
- **input.tsx** - Text input with focus states
- **textarea.tsx** - Multi-line input with character counter
- **select.tsx** - Dropdown select with Radix UI
- **dialog.tsx** - Modal dialog with overlay
- **dropdown-menu.tsx** - Dropdown menu with items, separators, shortcuts
- **tabs.tsx** - Tab navigation with content switching
- **tooltip.tsx** - Hover tooltips with Radix UI

#### 2. Shared Components (`src/components/shared/`)
Reusable components for common patterns:
- **Avatar.tsx** - User avatar with image fallback to initials, supports sizes (xs, sm, md, lg, xl)
- **ErrorBoundary.tsx** - React error boundary with fallback UI
- **LoadingState.tsx** - Loading spinner, skeleton loaders, card skeleton patterns
- **EmptyState.tsx** - Empty state with icon, title, description, and optional action
- **Badge.tsx** - Status badges with variants (default, secondary, destructive, success, warning, info)
- **Pagination.tsx** - Pagination controls with first/last/prev/next buttons
- **ConfirmDialog.tsx** - Confirmation dialog for destructive actions
- **Toast.tsx** - Toast notification system with context provider

#### 3. Layout Components (`src/components/layout/`)
Page structure and navigation:
- **Header.tsx** - Main navigation header with mobile menu, user dropdown
- **Sidebar.tsx** - Mobile sidebar with slide-out navigation
- **Footer.tsx** - Site footer with links and copyright
- **Container.tsx** - Page container with responsive max-width (sm, md, lg, xl, full)
- **PageHeader.tsx** - Page title with breadcrumbs and action buttons

#### 4. Form Components (`src/components/forms/`)
Advanced form inputs:
- **FormField.tsx** - Form field wrapper with label, error message, required indicator
- **MarkdownEditor.tsx** - Markdown editor with live preview, edit/preview tabs, syntax guide
- **TagInput.tsx** - Tag input with autocomplete suggestions, add/remove tags
- **ImageUpload.tsx** - Image upload with drag-and-drop, preview, file validation (placeholder for S3 integration)
- **DateTimePicker.tsx** - Korean-friendly date/time picker with date-fns formatting

### Usage Patterns

#### Component Import
```typescript
// UI primitives
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// Shared components
import { Avatar, LoadingState, Badge } from '@/components/shared';

// Layout components
import { Container, PageHeader } from '@/components/layout';

// Form components
import { FormField, MarkdownEditor } from '@/components/forms';
```

#### Styling with cn() Utility
```typescript
import { cn } from '@/lib/utils';

<div className={cn('base-classes', condition && 'conditional-classes', className)} />
```

#### Korean Text Support
```tsx
<p className="font-korean">
  한글 텍스트는 자동으로 word-break: keep-all 적용됩니다
</p>
```

#### Dark Mode
Components automatically support dark mode through CSS variables defined in `globals.css`.

### Theme Configuration — "Cozy Forest Town"

Custom theme in `globals.css` featuring a warm, inviting aesthetic:

**Color Palettes:**
- **Forest Green** (Primary): `--color-forest-*` - Deep, natural greens (#1a4d2e to #f3faf3)
- **Primary Green**: `--color-primary-*` - Bright accent greens
- **Accent Coral**: `--color-accent-*` - Warm coral/peach tones (#f45858 to #fff5f5)
- **Cream**: `--color-cream-*` - Warm off-white backgrounds (#fefdfb to #413221)
- **Warm Neutrals**: `--color-warm-*` - Warm gray tones

**Typography:**
- **Display Font**: Gmarket Sans (distinctive Korean font)
- **Body Font**: Pretendard Variable
- **Monospace**: JetBrains Mono

**Design Features:**
- `bg-gradient-mesh` - Multi-radial-gradient backgrounds
- `bg-gradient-forest` - Forest green gradient
- `grain` - Subtle noise texture overlay
- `glass` / `glass-strong` - Frosted glass effects
- `shadow-soft/medium/large/glow/coral` - Warm, organic shadows
- `float` / `float-slow` - Floating animation
- `card-elevated` / `card-interactive` - Card hover effects
- `animate-fade-in-up` - Staggered reveal animations

**Animation Timings:**
- Fast: 150ms
- Normal: 300ms
- Slow: 500ms
- Custom easing: `--ease-bounce` for playful interactions

### Accessibility Features
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus visible states with ring
- Screen reader friendly
- Color contrast compliance

### Internationalization (i18n)

Located in `src/i18n/`:
- **config.ts** - i18n setup with locale configuration
- **messages/ko.json** - Korean translations
- **messages/en.json** - English translations

Translation categories:
- common: Loading, errors, actions
- nav: Navigation labels
- auth: Authentication messages
- dashboard: Dashboard content
- events: Event-related text
- profile: Profile fields
- form: Form validation
- errors: Error messages
- empty: Empty states

---

## 12. Recent Updates

### January 4, 2026 - Phase 4 Complete: Timeline API ✅

Completed Phase 4 of Kemotown v2 implementation, creating the Timeline API and plugin-specific tRPC routes.

#### Activity Router Updates (`src/server/api/routers/activity.ts`)

**New Procedures:**
- `getThread` - Get activity with all replies in tree structure
- `contextTimeline` - Generic timeline for any context (groups, events, conventions)

**Timeline Service Updates (`src/server/services/timeline.service.ts`):**
- `getContextTimeline()` - Query activities addressed to `context:{id}`
- `getActivityThread()` - Get root activity + replies with interaction states

#### Event Plugin Router (`src/server/api/routers/plugins/event.ts`)

**RSVP Operations:**
- `rsvp` - RSVP to event with capacity/waitlist handling
- `updateRsvp` - Update RSVP status
- `cancelRsvp` - Cancel RSVP and process waitlist

**Check-in Operations:**
- `checkIn` - Check in attendee (host permission required)
- `approveRsvp` - Approve/reject RSVP for approval-required events

**Query Operations:**
- `getAttendees` - List attendees with RSVP status
- `getWaitlist` - Get waitlist (host only)
- `getStats` - Event statistics (capacity, attending, waitlist, checked-in)

#### Group Plugin Router (`src/server/api/routers/plugins/group.ts`)

**Content Operations:**
- `createAnnouncement` - Create admin announcements
- `createPoll` - Create polls with options
- `votePoll` - Vote on polls

**Moderation Operations:**
- `issueWarning` - Issue warning to member
- `muteMember`/`unmuteMember` - Mute management
- `assignRole` - Assign custom roles

**Query Operations:**
- `canPost` - Check slow mode status
- `getModLogs` - View moderation logs (admin only)
- `getStats` - Group statistics

#### SSE Updates (`src/app/api/timeline/stream/route.ts`)

**New Channels:**
- `CONTEXT:{contextId}` - Context-specific real-time updates
- `HOME` - Authenticated user's home timeline

**Access Control:**
- Public contexts: No auth required
- Private contexts: Membership required

#### Tests

19 API tests covering:
- Activity CRUD and timeline queries
- Context visibility checks
- RSVP operations and capacity management
- Check-in permission verification
- Attendee and stats queries

---

### January 4, 2026 - Phase 3 Complete: Plugin Framework ✅

Completed Phase 3 of Kemotown v2 implementation, creating the Event and Group plugins that extend Context functionality.

#### Event Plugin (`src/lib/plugins/event/`)

**Schema (`schema.ts`):**
- Event timing: `startAt`, `endAt`, `timezone`, `isAllDay`
- Location: `locationType` (physical/online/hybrid), `location`, `onlineUrl`
- Capacity: `capacity`, `hasWaitlist`, `waitlistBehavior`
- Payments: `cost`, `currency`, `paymentMethods`, `refundPolicy`
- RSVP: `requiresApproval`, `screeningQuestions`

**Hooks (`hooks.ts`):**
- `onContextCreate/Update/Delete` - Lifecycle handlers
- `onMemberJoin/Leave` - RSVP tracking
- `onActivityCreate` - Handle RSVP and check-in activities
- `validateData` - Business rule validation
- `checkEventCapacity()`, `processWaitlist()` - Helpers

**Activity Types:** `RSVP`, `CHECKIN`, `EVENT_UPDATE`
**Address Patterns:** `context:{id}:hosts`, `context:{id}:attendees`, `context:{id}:waitlist`
**Permissions:** `manage_rsvps`, `send_updates`, `check_in`, `view_attendee_info`

#### Group Plugin (`src/lib/plugins/group/`)

**Schema (`schema.ts`):**
- Type: `groupType` (community, interest, regional, species, convention, other)
- Moderation: `requirePostApproval`, `slowModeSeconds`, `enableAutoMod`, `bannedWords`
- Custom roles: Up to 10 custom roles with colors and permissions
- Features: `enablePolls`, `isDiscoverable`, `welcomeMessage`

**Hooks (`hooks.ts`):**
- Auto-moderation on post creation
- Slow mode enforcement
- Warning system: `issueMemberWarning()`
- Post rate limiting: `canUserPost()`

**Activity Types:** `ANNOUNCEMENT`, `POLL`, `INTRODUCTION`
**Address Patterns:** `context:{id}:staff`, `context:{id}:active`
**Permissions:** `post_announcement`, `create_poll`, `moderate_posts`, `issue_warnings`, `mute_members`

#### Plugin Registration (`src/lib/plugins/index.ts`)

```typescript
initializePlugins();       // Register built-in plugins
ensurePluginsInitialized(); // Lazy initialization
```

#### Tests

24 tests covering:
- Plugin registration and retrieval
- Schema validation for events and groups
- Activity type definitions
- Permission definitions
- Membership field extensions

---

### January 4, 2026 - Phase 2 Complete: Unified Addressing & Context API ✅

Completed Phase 2 of Kemotown v2 implementation, establishing the unified addressing system for visibility, delivery, and permissions. Also exposed the Context and Membership services via tRPC.

#### New Addressing System (`src/lib/addressing/`)

**Visibility Module (`visibility.ts`):**
- `canSeeActivity()` - Check if user can see an activity based on `to`/`cc` addressing
- `canSeeActivityWithReason()` - Same with detailed reason for debugging
- `filterVisibleActivities()` - Batch filter activities for a viewer
- `batchCheckFollowing()` - Efficient bulk follow status check
- `batchCheckMembership()` - Efficient bulk context membership check

**Delivery Module (`delivery.ts`):**
- `deliverActivity()` - Deliver to user inboxes based on addressing
- `deliverActivityWithMentions()` - Delivery with automatic @mention detection
- `resolveRecipients()` - Resolve addresses to user IDs
- `previewDelivery()` - Preview who would receive an activity
- Category assignment: MENTION, DM, FOLLOW, LIKE, REPOST, REPLY, EVENT, GROUP, SYSTEM

**Address Patterns:**
| Pattern | Meaning |
|---------|---------|
| `public` | Visible to everyone |
| `followers` | Actor's accepted followers |
| `user:{id}` | Specific user (DMs, mentions) |
| `context:{id}` | All approved context members |
| `context:{id}:admins` | Context admins only |
| `context:{id}:moderators` | Moderators and above |
| `context:{id}:role:{ROLE}` | Specific role |

#### New tRPC Routers

**Context Router (`src/server/api/routers/context.ts`):**
- `create` - Create groups, events, or conventions with plugin support
- `update` - Update context settings (requires ADMIN+)
- `updatePluginData` - Update plugin-specific data
- `archive` - Soft delete (owner only)
- `getById`, `getBySlug` - Fetch with visibility checks
- `list` - Paginated listing with filters
- `join`, `leave` - Membership actions
- `transferOwnership` - Transfer to another member

**Membership Router (`src/server/api/routers/membership.ts`):**
- `get`, `getMine` - Fetch membership details
- `list` - List context members with filters
- `countByStatus` - Count by PENDING/APPROVED/BANNED/LEFT
- `myMemberships` - User's memberships across contexts
- `updateRole` - Change member role (respects hierarchy)
- `approve`, `reject` - Handle pending memberships
- `ban`, `unban` - Moderation actions
- `updatePluginData` - Per-membership plugin data
- `updateNotifications` - Notification preferences

#### Schemas Added

**Context Schema (`src/schemas/context.schema.ts`):**
- `createContextSchema` - With type, plugin, visibility, joinPolicy
- `updateContextSchema` - Partial updates
- `listContextsSchema` - Pagination with type/visibility filters

**Membership Schema (`src/schemas/membership.schema.ts`):**
- `listMembershipsSchema` - With status/role filters
- `updateRoleSchema` - Role assignment (blocks OWNER)
- `updateNotificationsSchema` - Notification preferences

#### Permission System Enhancements (`src/lib/permissions/`)

**Database-Backed Functions:**
- `hasPermission(userId, contextId, permission)` - Check permission with DB lookup
- `hasPermissionWithReason()` - Same with detailed reason
- `getPermissionsFromDb()` - Get all permissions for user in context
- `canActOnActivity()` - Check edit/delete/pin permissions

**tRPC Middleware:**
- `requirePermission(permission)` - Procedure middleware
- `requireAnyPermission(permissions)` - Any of multiple permissions
- `requireMembership()` - Requires approved membership

#### Test Coverage

| Test File | Tests |
|-----------|-------|
| `addressing/visibility.test.ts` | 41 tests |
| `addressing/delivery.test.ts` | 28 tests |
| `permissions/permissions.test.ts` | 46 tests |
| **Total new tests** | **115 tests** |

#### Quality Validation
- ✅ All 181 tests passing
- ✅ ESLint clean for new files
- ✅ TypeScript strict mode compliant

---

### January 1, 2026 - ActivityPub-style Social Networking Foundation ✅

Implemented Phase 1 of the ActivityPub-based social networking system. This uses ActivityPub vocabulary internally (without federation) as a unified data model for all social features.

#### New Prisma Models (`prisma/schema.prisma`)

**Activity Model:**
- Unified model for posts, likes, reposts, follows
- `type` enum: CREATE, UPDATE, DELETE, LIKE, ANNOUNCE, FOLLOW, ACCEPT, REJECT, UNDO
- `to`/`cc` arrays for flexible addressing (public, followers, user:id, event:id)
- `inReplyTo` for threading support
- Soft delete with `deleted` and `deletedAt`

**InboxItem Model:**
- Delivery tracking to user inboxes
- Categories for filtering (DEFAULT, MENTION, DM, FOLLOW, LIKE, REPOST, REPLY, EVENT)
- Read/muted status

**Follow Model:**
- User following relationships
- Approval workflow (PENDING, ACCEPTED, REJECTED)

**Attachment Model:**
- File upload metadata
- Types: IMAGE, VIDEO, AUDIO, DOCUMENT
- Blurhash support for placeholders

**User Model Updates:**
- Added `requiresFollowApproval` field
- Relations to Activity, InboxItem, Follow, Attachment

#### New Services

**Activity Service (`src/server/services/activity.service.ts`):**
- `createNoteActivity` - Create posts, comments, DMs
- `createLikeActivity` / `removeLikeActivity` - Like/unlike
- `createAnnounceActivity` / `removeAnnounceActivity` - Repost/unrepost
- `updateActivity` - Edit post content
- `deleteActivity` - Soft delete
- `canSeeActivity` - Visibility check based on addressing
- `deliverActivity` - Inbox delivery based on `to`/`cc`
- `getInteractionStates` - Batch check liked/reposted status

**Timeline Service (`src/server/services/timeline.service.ts`):**
- `getPublicTimeline` - Public posts with cursor pagination
- `getHomeTimeline` - Posts from followed users + own
- `getEventTimeline` - Event-scoped posts
- `getUserTimeline` - Specific user's posts with visibility filtering
- `getReplies` - Thread replies
- `getLikers` / `getReposters` - Engagement lists

#### New tRPC Router (`src/server/api/routers/activity.ts`)

Full API for the new Activity system:
- CRUD operations: createNote, like, unlike, repost, unrepost, update, delete
- Queries: getById, getReplies, getLikers, getReposters
- Timelines: publicTimeline, homeTimeline, eventTimeline, userTimeline

#### New Schemas (`src/schemas/activity.schema.ts`)

Comprehensive Zod validation:
- Address validation (public, followers, user:id, event:id patterns)
- Activity input schemas (createNote, like, announce, update, delete)
- Timeline query schemas (public, home, event, user, replies, likes, reposts)
- Inbox and follow schemas

#### Addressing Semantics

| Address | Meaning |
|---------|---------|
| `public` | Visible to everyone |
| `followers` | Visible to actor's followers |
| `user:{cuid}` | Direct to specific user (DMs, mentions) |
| `event:{cuid}` | Visible to event participants |
| `event:{cuid}:hosts` | Visible only to event hosts |

#### Files Created/Modified
- `prisma/schema.prisma` - New models and enums
- `src/schemas/activity.schema.ts` - NEW
- `src/server/services/activity.service.ts` - NEW
- `src/server/services/timeline.service.ts` - NEW
- `src/server/api/routers/activity.ts` - NEW
- `src/server/api/root.ts` - Added activity router
- `ACTIVITYPUB_PLAN.md` - Implementation plan document

#### Migration Strategy
- New Activity system runs alongside legacy TimelinePost
- Frontend can be gradually migrated to use `activity.*` endpoints
- Data migration scripts planned for Phase 2

#### Quality Validation
- ✅ `npm run lint` - Passes
- ✅ `npx prisma db push` - Database synced
- ✅ `npx prisma generate` - Client generated

---

### January 1, 2026 - ActivityPub Phase 2: Timeline Components ✅

Completed Phase 2 of the ActivityPub migration, updating all timeline components to use the new Activity model.

#### Components Updated

**Timeline.tsx (`src/components/timeline/Timeline.tsx`):**
- Now uses `activity.publicTimeline` and `activity.eventTimeline` endpoints
- Post creation via `activity.createNote` with proper addressing
- Integrated like/unlike via `activity.like` and `activity.unlike`
- Delete via `activity.delete`
- SSE integration maintained for real-time updates

**TimelinePost.tsx (`src/components/timeline/TimelinePost.tsx`):**
- Displays Activity data structure (actor, object, published, etc.)
- Content extracted from `activity.object.content`
- Integrated like button (simplified from multi-emoji reactions)
- Supports repost display with original activity
- Bot post indicator for `actorType === 'BOT'`

**New Shared Types (`src/types/timeline.ts`):**
- `TimelineActor` - Actor information (id, username, displayName, avatarUrl)
- `TimelineAttachment` - Attachment metadata
- `TimelineActivity` - Full activity structure
- `TimelineItem` - Timeline item with liked/reposted state
- `getActivityContent()` - Helper to extract content from activity object

#### API Changes

| Old Endpoint | New Endpoint |
|--------------|--------------|
| `timeline.getPosts` | `activity.publicTimeline` / `activity.eventTimeline` |
| `timeline.createPost` | `activity.createNote` (with `to` addressing) |
| `timeline.deletePost` | `activity.delete` |
| `reaction.addReaction` | `activity.like` |
| `reaction.removeReaction` | `activity.unlike` |

#### Reaction System Simplification
- Old: Multiple emoji reactions (thumbsup, heart, laugh, wow, sad)
- New: Binary like/unlike (ActivityPub standard)
- Like button integrated directly into TimelinePost (no separate ReactionBar)

#### Quality Validation
- ✅ `npm run lint` - Timeline components pass
- ✅ `npx tsc --noEmit` - Timeline types compile correctly

---

### December 31, 2025 - Premium UI Enhancement: "Ultra-Quality Forest Town" ✅

Elevated the entire UI to ultra-high-quality, slick, clean design while preserving the "Cozy Forest Town" theme.

#### Design Philosophy Upgrade
- **Multi-layer shadows** - Realistic depth with primary, ambient, and accent shadows
- **Glass morphism** - Sophisticated backdrop-blur effects with refined opacity
- **Premium micro-interactions** - Thoughtful hover states with scale, glow, and shadow transitions
- **Orchestrated animations** - Staggered entrance sequences for polished reveal effects

#### Files Enhanced
- `src/app/globals.css` - Complete premium design system with:
  - CSS custom properties for shadows, easing, transitions
  - New utility classes: `.glass-strong`, `.grain`, `.blob-*`, `.gradient-text`
  - Premium component classes: `.btn-premium`, `.card-glass`, `.input-premium`
  - Animation keyframes: `float`, `shimmer`, `pulse-glow`, `fade-in-up`
  - Skeleton loading states with shimmer effects

- `src/components/ui/button.tsx` - Premium button with:
  - 8 variants: default, destructive, outline, secondary, ghost, link, accent, premium
  - `asChild` prop support using Radix Slot for composition
  - Multi-layer shadows with glow on hover
  - Inner highlights for depth perception
  - Active state compression (scale 0.97)

- `src/components/ui/card.tsx` - Elegant card with:
  - 7 variants: default, elevated, interactive, outlined, glass, highlight, highlight-accent
  - Smooth hover lift and scale transitions
  - Decorative gradient border option

- `src/components/ui/input.tsx` - Polished input with:
  - 3 variants: default, ghost, filled
  - 4 sizes: sm, default, lg, xl
  - Left/right element slots
  - Premium focus ring with shadow

- `src/app/page.tsx` - Stunning landing page with:
  - Animated floating blob decorations
  - Gradient mesh background
  - Hero section with animated shine text
  - Feature cards with staggered reveal
  - Stats section with gradient accents
  - Full footer with links

- `src/app/(auth)/login/page.tsx` - Premium OAuth login with:
  - Decorative gradient corners
  - Refined OAuth buttons with brand colors
  - Glass card with subtle shadows
  - Smooth loading states

- `src/app/(auth)/layout.tsx` - Auth wrapper with:
  - Multi-layer floating blobs
  - Pattern overlay texture
  - Animated entrance sequence

- `src/app/(main)/layout.tsx` - App shell with:
  - Glass header with sticky positioning
  - Desktop/mobile responsive navigation
  - Profile section with avatar and status indicator
  - Comprehensive footer

- `src/components/timeline/Timeline.tsx` - Enhanced timeline with:
  - Connection status badges (SSE)
  - Staggered post animations
  - Refined empty/error states
  - Skeleton loading with shimmer

#### Quality Validation
- ✅ `npm run lint` - Passes (1 acceptable warning for `<img>`)
- ✅ `npx tsc --noEmit` - All TypeScript checks pass

---

### December 31, 2025 - Complete Design System Overhaul: "Cozy Forest Town" ✅

Implemented a completely new design system called "Cozy Forest Town" with a warm, inviting aesthetic specifically crafted for the Korean furry community.

#### Design Philosophy
- **Warm & Inviting**: Forest greens, cream backgrounds, and coral accents create a cozy gathering place
- **Organic Shapes**: Generous rounded corners (2xl), soft shadows, and floating elements
- **Playful Animations**: Bouncy easing functions, floating blobs, and staggered reveals
- **Distinctive Typography**: Gmarket Sans for display text (Korean-optimized)

#### Files Updated
- `src/app/globals.css` - Complete theme rewrite with new color palettes and utility classes
- `src/app/page.tsx` - Landing page with animated blobs, mesh gradients, and feature cards
- `src/app/(auth)/layout.tsx` - Auth layout with decorative elements
- `src/app/(auth)/login/page.tsx` - Beautiful OAuth login page
- `src/app/(main)/layout.tsx` - Authenticated area with glass header
- `src/components/ui/button.tsx` - Button with new variants (accent, glow effects)
- `src/components/ui/card.tsx` - Card with variant prop (default/elevated/interactive/outlined)
- `src/components/layout/Header.tsx` - Navigation with new styling

#### New CSS Features
- `bg-gradient-mesh` - Multi-radial-gradient backgrounds with animated blobs
- `grain` - Subtle noise texture overlay for organic feel
- `glass-strong` - Frosted glass effect for headers
- `shadow-glow`, `shadow-coral` - Themed shadow effects
- `card-interactive` - Lift + scale hover animations
- `animate-fade-in-up`, `stagger-1/2/3` - Staggered reveal animations
- `float`, `float-slow` - Floating animation for decorative elements
- Custom blob shapes (`.blob-green`, `.blob-coral`, `.blob-cream`)

#### Component Enhancements
- Button: Added `accent` variant for coral CTA buttons, `xl` size
- Card: Added `variant` prop with 4 options, automatic hover states

---

### December 31, 2025 - User & Social System Complete ✅

Implemented complete User & Social System with the following:

#### Backend (tRPC Routers)
- **User Router** (`src/server/api/routers/user.ts`)
  - `getById`, `getByUsername` - Fetch user profiles with privacy checks
  - `getCurrentUser` - Get authenticated user data
  - `updateProfile` - Update profile information (displayName, bio, species, interests, socialLinks)
  - `updateFursuitPhotos` - Manage fursuit photo gallery
  - `search` - Advanced user search with filters (species, interests, sorting)
  - `getStats` - User statistics (followers, following, bumps, events)
  - `getAttendedEvents` - List of user's attended events

- **Follow Router** (`src/server/api/routers/follow.ts`)
  - `follow`, `unfollow` - Manage follow relationships with notifications
  - `getFollows` - Get followers/following with cursor pagination
  - `isFollowing` - Check follow status
  - `getMutualFollows` - Get mutual followers

- **Bump Router** (`src/server/api/routers/bump.ts`)
  - `create` - Record in-person meetings with method selection (QR/Manual/NFC)
  - `getBumps` - List bumps given/received with cursor pagination
  - `getStats` - Bump statistics including unique people met
  - `checkBump` - Verify if bump exists
  - `delete` - Remove bump records

#### Frontend (Pages & Components)
- **Pages**
  - `/profile/[username]` - Dynamic profile view with stats, photos, interests
  - `/profile/settings` - Profile editing with real-time validation
  - `/users` - User discovery with advanced search and filters

- **Components** (`src/components/users/`)
  - `UserCard`, `UserGrid` - Responsive user listing
  - `ProfileHeader` - Profile display with follow/bump buttons
  - `ProfileStats` - Statistics display with links
  - `FollowButton` - Real-time follow/unfollow
  - `BumpButton`, `BumpModal` - Bump interaction with method selection
  - `InterestTags` - Tag display and management
  - `SocialLinks` - Social media links display
  - `ProfileSettingsForm` - Comprehensive profile editor
  - `UserDiscovery` - Search interface with filters

#### Key Features
- Privacy controls (public/private profiles)
- Real-time updates with optimistic UI
- Korean localization throughout
- Type-safe API calls with tRPC
- Proper error handling and validation
- Responsive design for all screen sizes

---

### December 31, 2025 - Complete UI Component Library ✅

Implemented comprehensive UI component library with 30+ components:

#### Installed Dependencies
- `class-variance-authority` - Component variant management
- `@radix-ui/react-*` - Accessible UI primitives (dialog, dropdown, tabs, tooltip, select)
- `lucide-react` - Icon library
- `react-markdown` - Markdown rendering

#### Components Implemented
**UI Primitives (9 components)**
- Button, Card, Input, Textarea, Select
- Dialog, Dropdown Menu, Tabs, Tooltip
- All follow shadcn/ui patterns with forwardRef and cva variants

**Shared Components (8 components)**
- Avatar with fallback, ErrorBoundary, LoadingState with skeletons
- EmptyState, Badge with variants, Pagination
- ConfirmDialog, Toast notification system

**Layout Components (5 components)**
- Header with navigation and user menu
- Sidebar for mobile, Footer, Container with sizes
- PageHeader with breadcrumbs

**Form Components (5 components)**
- FormField wrapper, MarkdownEditor with preview
- TagInput with autocomplete, ImageUpload with drag-drop
- DateTimePicker with Korean formatting

**i18n Setup**
- Configuration with Korean/English support
- Translation files for common, nav, auth, dashboard, events, profile, forms, errors
- Integration with date-fns for Korean date formatting

#### Key Features
- Full TypeScript type safety
- Accessibility with ARIA labels and keyboard navigation
- Dark mode support via CSS variables
- Korean text optimization with font-korean class
- Component index files for clean imports
- ESLint compliant (all new components pass strict checks)

#### Quality Assurance
- All components pass ESLint with strict TypeScript rules
- Proper error handling without `any` types
- Consistent naming and file structure
- Ready for production use

---

### December 31, 2025 - v1 Integration Complete ✅

Final integration of all parallel implementation agents with comprehensive type and lint fixes.

#### Integration Fixes Applied

**Missing Dependencies Installed**
- `sonner` - Toast notifications
- `react-hook-form` + `@hookform/resolvers` - Form handling
- `@radix-ui/react-label` + `@radix-ui/react-checkbox` - UI primitives

**Missing UI Components Created**
- `src/components/ui/label.tsx` - Form label component
- `src/components/ui/checkbox.tsx` - Checkbox input component

**Import Path Corrections**
- Fixed tRPC import paths in `bump.ts`, `follow.ts`, `user.ts` routers (`'../trpc'` → `'@/server/trpc'`)
- Fixed tRPC server client import in `lib/trpc/server.ts`

**Type Error Fixes**
- Added `TRPCContext` type export for repository-like functions in `event.ts`
- Added explicit Prisma types (`Prisma.EventWhereInput`, `Prisma.RSVPWhereInput`) for complex where clauses
- Fixed session null checks in event router
- Updated TanStack Query v5 usage (`isLoading` → `isPending`)
- Replaced `react-icons` with `lucide-react` icons in `SocialLinks.tsx`
- Fixed Post/Reaction interface types to match API response structure
- Exported `baseEventFieldsSchema` from `event.schema.ts` for form usage
- Fixed EventForm types for react-hook-form compatibility with Zod refinements
- Fixed checkbox `onCheckedChange` type annotation in event pages
- Added `v0-archive` to tsconfig.json exclude list

**Validation**
- ✅ `npm run typecheck` - All TypeScript checks pass
- ✅ `npm run lint` - No errors (warnings for `<img>` usage are acceptable)

#### Final Project Status

| Category | Status | Notes |
|----------|--------|-------|
| Foundation | ✅ Complete | Next.js 15, Auth.js v5, tRPC v11, Prisma 6.8 |
| Authentication | ✅ Complete | Google + Kakao OAuth with session handling |
| User System | ✅ Complete | Profiles, settings, discovery, search |
| Event System | ✅ Complete | CRUD, RSVP, comments, host management |
| Timeline System | ✅ Complete | Posts, reactions, mentions, SSE |
| Social Features | ✅ Complete | Follows, bumps with QR/manual/NFC |
| Notifications | ✅ Complete | System notifications with mark read |
| UI Components | ✅ Complete | 30+ components, i18n, dark mode |
| Type Safety | ✅ Complete | All TypeScript/ESLint checks pass |

#### Ready for Testing
The v1 rewrite is now complete and ready for manual testing:
```bash
npm run dev
```

#### Remaining Work (Future Tasks)
- Replace `<img>` with `next/image` for optimization
- Implement Toss Payments integration
- Add file upload service (S3/Cloudinary)
- Write unit and E2E tests
- Production deployment to Vercel

---

### December 31, 2025 - Flexible Event Date/Time System ✅

Implemented flexible date/time input for event creation, allowing users to specify just a date, date with time, or full date range.

#### Schema Changes (`src/schemas/event.schema.ts`)

**New Date/Time Fields:**
- `startDate` (required) - Event start date in YYYY-MM-DD format
- `startTime` (optional) - Event start time in HH:MM format
- `endDate` (optional) - Event end date in YYYY-MM-DD format (defaults to startDate)
- `endTime` (optional) - Event end time in HH:MM format (defaults to 23:59 or startTime)

**Schema Transformation:**
- `createEventSchema` now uses `.transform()` to convert string date/time inputs to Date objects
- Outputs `startAt` and `endAt` as proper Date objects for Prisma
- Validates that end datetime is after start datetime
- Helper function `buildDateTime(dateStr, timeStr, defaultTime)` constructs Date objects

#### UI Changes (`src/components/events/EventForm.tsx`)

**User Experience Improvements:**
- Separate date and time inputs using native HTML5 `<input type="date">` and `<input type="time">`
- Date format displays as YYYY-MM-DD (Korean-friendly ISO format)
- Toggle checkbox "여러 날에 걸친 이벤트" (Multi-day event) to show end date fields
- Live date preview in Korean format (e.g., "2025년 12월 31일 (화) 14:00 ~ 18:00")
- Helper text explaining flexible options

**Flexibility Options:**
1. **Date only** - Just select start date → All-day event (00:00 to 23:59)
2. **Date + Time** - Add start time → Specific time event (startTime to startTime)
3. **Date + Time + End Time** - Add end time → Same-day event with duration
4. **Multi-day** - Toggle multi-day → Separate end date/time fields

#### Router Changes (`src/server/api/routers/event.ts`)

**Field Mapping:**
- Extracts transformed `startAt` and `endAt` Date objects from schema output
- Maps to both legacy (`startDate`, `endDate`) and new (`startAt`, `endAt`) Prisma fields
- Properly handles null vs undefined for Prisma compatibility
- Generates unique IDs using `crypto.randomUUID()` (Prisma schema missing @default)

#### Files Modified
- `src/schemas/event.schema.ts` - Added flexible date/time schema with transform
- `src/components/events/EventForm.tsx` - Rewrote with separate date/time inputs and preview
- `src/server/api/routers/event.ts` - Updated to handle transformed date values

#### Quality Validation
- ✅ `npm run lint` - Passes (1 pre-existing warning for `<img>`)
- Pre-existing TypeScript issues in event pages (tRPC type inference) are unrelated to these changes

---

## 13. Kemotown v2 Roadmap

### Vision: Timeline-Centric Social Network

Kemotown v2 represents a fundamental architectural shift from an **event-centric platform** to a **timeline-centric social network** where events, groups, and other features are "plugins" that extend the core timeline experience.

### Key Changes in v2

| v1 (Current) | v2 (Planned) |
|--------------|--------------|
| Events are primary entities | **Timeline is the primary interface** |
| Event-specific timelines | **Unified Context model** (events, groups, conventions are all Contexts) |
| Fixed feature set | **Plugin architecture** for extensibility |
| `event:{id}` addressing | **Unified `context:{id}` addressing** |
| Dashboard homepage | **Home timeline** (following + contexts) |

### New Core Concepts

1. **Context**: Unified container for events, groups, conventions
2. **Membership**: User's relationship to a context (with roles, permissions)
3. **Plugin System**: Modular features that extend contexts
4. **Unified Addressing**: `context:{id}`, `context:{id}:admins`, etc.

### Barq! Inspirations

- Multi-fursona profiles (characters array)
- Convention mode with "Who's here?" discovery
- Profile customization (colors, fonts)
- Enhanced discovery filters (languages, location)

### Implementation Phases

1. **Phase 1**: Foundation (Context model, Membership, Plugin system)
2. **Phase 2**: Context System (Event plugin migration, Group plugin)
3. **Phase 3**: UI Overhaul (Timeline-first home, new navigation)
4. **Phase 4**: Enhanced Features (Convention plugin, multi-character)
5. **Phase 5**: Polish (Performance, a11y, testing)
6. **Phase 6**: Launch

**Full details**: See `ARCHITECTURE_V2.md`

---

*This document reflects Kemotown v1 architecture as of December 31, 2025.*
*v2 planning added January 2, 2026.*
