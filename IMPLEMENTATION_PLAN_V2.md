# Kemotown v2 Implementation Plan

**Version:** 2.0
**Date:** January 3, 2026
**Last Updated:** January 4, 2026
**Status:** Phase 5 Complete - UI Components Implemented
**Reference:** [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md)

---

## Implementation Log

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| 2026-01-04 | Phase 0 | **COMPLETE** | All 5 tasks completed. Plugin, addressing, and permission infrastructure created. 23 tests passing. |
| 2026-01-04 | Phase 1 | **COMPLETE** | All 8 tasks completed. Context, Membership models + services created. 66 tests passing. |
| 2026-01-04 | Phase 2 | **COMPLETE** | All 6 tasks completed. Visibility checker, delivery service, permission DB integration, activity service integration. 181 tests passing. |
| 2026-01-04 | Phase 2+ | **COMPLETE** | Added tRPC routers for Context and Membership services. Created context.schema.ts, membership.schema.ts, context.ts router, membership.ts router. All v2 services now exposed via API. |
| 2026-01-04 | Phase 3 | **COMPLETE** | Event plugin (schema, hooks, index) and Group plugin (schema, hooks, index) created. Plugin registration in index.ts. 24 plugin tests passing. |
| 2026-01-04 | Phase 4 | **COMPLETE** | Activity router updated (contextTimeline, getThread). Event/Group plugin routers created. SSE updated for context streams. 19 API tests passing. |
| 2026-01-04 | Phase 5 | **COMPLETE** | All 8 tasks completed. TimelineV2, ActivityComposer, Context pages, ContextCard, Discovery components, MobileNav, Home page v2, 20 UI tests passing. |

---

## Executive Summary

This document provides the complete implementation roadmap for transforming Kemotown from an event-centered platform to a timeline-centric social network. The implementation is divided into **7 phases** with a total of **~45 major tasks**.

### Phase Overview

| Phase | Name | Focus | Major Tasks |
|-------|------|-------|-------------|
| 0 | Foundation | Project setup, tooling, dev environment | 5 |
| 1 | Core Data Model | Context, Membership, Activity models | 8 |
| 2 | Addressing System | Visibility, delivery, permissions | 6 |
| 3 | Plugin Framework | Plugin architecture, registry | 5 |
| 4 | Timeline API | Activity streams, real-time | 6 |
| 5 | UI Components | Timeline UI, context pages | 8 |
| 6 | Plugin Implementations | Event, Group, Convention plugins | 5 |
| 7 | Migration & Launch | Data migration, testing, deployment | 6 |

---

## Phase 0: Foundation

**Goal:** Set up the development environment, tooling, and project structure for v2 development.

### Task 0.1: Create Feature Branch & Development Environment ✅

**Files:**
- `.env.development.local` (update)
- `docker-compose.dev.yml` (create)

**Actions:**
```bash
# Create v2 feature branch
git checkout -b feature/v2-timeline-architecture

# Set up separate development database
docker-compose -f docker-compose.dev.yml up -d postgres-v2
```

**Acceptance Criteria:**
- [x] Feature branch created
- [x] Separate development database running
- [ ] CI configured to test both v1 and v2 branches

> **Implementation Note (2026-01-04):**
> Used existing `feature/kakao-oauth-email-optional` branch which already contained significant v2 work:
> - ActivityPub models in Prisma (Activity, InboxItem, Follow, Attachment)
> - Services: activity, bot, dm, follow, inbox, sse, timeline, upload
> - tRPC routers for all major features
> Development database runs via existing docker-compose setup.

---

### Task 0.2: Install Additional Dependencies ✅

**Files:**
- `package.json` (update)

**Dependencies to Add:**
```json
{
  "dependencies": {
    "zod": "^3.22.0",
    "@tanstack/react-query": "^5.0.0",
    "superjson": "^2.2.0",
    "lodash-es": "^4.17.21",
    "date-fns-tz": "^2.0.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "msw": "^2.0.0"
  }
}
```

**Acceptance Criteria:**
- [x] All dependencies installed
- [x] No version conflicts
- [x] TypeScript types available for all packages

> **Implementation Note (2026-01-04):**
> Most dependencies already present from existing v2 work. Added:
> - `date-fns-tz@^3.2.0` - Timezone-aware date utilities
> - `nanoid@^5.1.5` - Compact ID generation
> - Testing dependencies (vitest, @testing-library/react) already installed

---

### Task 0.3: Project Structure Setup ✅

**Files to Create:**
```
src/
├── lib/
│   ├── plugins/
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   └── index.ts
│   ├── addressing/
│   │   ├── types.ts
│   │   ├── parser.ts
│   │   ├── visibility.ts
│   │   ├── delivery.ts
│   │   └── index.ts
│   └── utils/
│       ├── slug.ts
│       └── id.ts
├── server/
│   └── api/
│       └── routers/
│           ├── context.ts
│           └── plugins/
│               ├── event.ts
│               ├── group.ts
│               └── convention.ts
└── components/
    ├── context/
    │   ├── ContextHeader.tsx
    │   ├── ContextSidebar.tsx
    │   ├── ContextCard.tsx
    │   └── MembershipButton.tsx
    ├── activity/
    │   ├── ActivityCard.tsx
    │   ├── ActivityComposer.tsx
    │   └── ActivityActions.tsx
    └── plugins/
        ├── event/
        │   ├── EventHeader.tsx
        │   ├── EventSidebar.tsx
        │   └── RSVPButton.tsx
        └── group/
            └── GroupSettings.tsx
```

**Acceptance Criteria:**
- [x] All directories created
- [x] Placeholder files with module exports
- [x] Index files for barrel exports

> **Implementation Note (2026-01-04):**
> Created foundational infrastructure files:
>
> **Plugin System (`src/lib/plugins/`):**
> - `types.ts` - Plugin interface, ContextType, MemberRole, component props, lifecycle hooks
> - `registry.ts` - Singleton PluginRegistry class with validation, activity type aggregation
> - `index.ts` - Barrel exports
>
> **Addressing System (`src/lib/addressing/`):**
> - `types.ts` - Address types, ParsedAddress interface, AddressType enum
> - `parser.ts` - parseAddress(), createAddress helpers, extractContextIds/extractUserIds utilities
> - `parser.test.ts` - 23 unit tests (all passing)
> - `index.ts` - Barrel exports
>
> **Permission System (`src/lib/permissions/`):**
> - `types.ts` - MemberRole, CorePermission, ROLE_HIERARCHY, ROLE_PERMISSIONS, utility functions
> - `index.ts` - checkPermission(), getPermissionsForRole(), getMembershipPermissions()
>
> **Note:** ContextType and MemberRole defined locally in types files since Prisma schema
> doesn't have Context/Membership models yet (Phase 1). These will be replaced with Prisma
> imports after migration.
>
> Server/components structure already existed from prior v2 development.

---

### Task 0.4: Configure Testing Infrastructure ✅

**Files:**
- `vitest.config.ts` (create)
- `src/test/setup.ts` (create)
- `src/test/mocks/prisma.ts` (create)
- `src/test/mocks/trpc.ts` (create)

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Acceptance Criteria:**
- [x] `npm run test` works
- [x] Coverage reports generated
- [x] Mock utilities available

> **Implementation Note (2026-01-04):**
> Created testing infrastructure:
>
> **vitest.config.ts:**
> - Added `css: { postcss: {} }` to disable PostCSS processing in tests (fixed plugin error)
> - Setup file uses `.tsx` extension for JSX support
>
> **src/test/setup.tsx:**
> - Global mocks for Next.js router, Image component, IntersectionObserver
> - React Testing Library matchers configured
>
> **src/test/mocks/prisma.ts:**
> - Mock Prisma client for unit testing
> - Factory function for creating fresh mock instances
>
> **Test Results:**
> ```
> ✓ src/lib/addressing/parser.test.ts (23 tests) 15ms
> Test Files  1 passed (1)
> Tests       23 passed (23)
> ```

---

### Task 0.5: Create Development Seed Script ✅

**Files:**
- `prisma/seed-v2.ts` (create)

**Purpose:** Create test data for v2 development including:
- 5 test users with different roles
- 3 test contexts (1 event, 1 group, 1 convention)
- Sample activities and memberships

**Acceptance Criteria:**
- [x] Seed script runs without errors
- [x] Test data available in dev database
- [x] Idempotent (can run multiple times)

> **Implementation Note (2026-01-04):**
> Created `prisma/seed-v2.ts` with:
>
> **Test Users (5):**
> - Owner (furcon_owner) - Convention organizer
> - Admin (group_admin) - Group administrator
> - Mod (timeline_mod) - Moderator
> - Member (active_member) - Regular member
> - Viewer (event_viewer) - Read-only viewer
>
> **Test Data:**
> - Sample activities (Create, Announce, Like types)
> - Follow relationships between users
>
> **Note:** Contexts and Memberships will be added after Phase 1 migration when
> those models exist in the schema. Current seed focuses on User and Activity
> models that already exist.
>
> Script is idempotent using `upsert` with deterministic IDs.

---

### Phase 0 Summary

**Files Created:**
```
src/lib/plugins/
├── types.ts          # Plugin interface, ContextType, MemberRole, component props
├── registry.ts       # Singleton PluginRegistry class
└── index.ts          # Barrel exports

src/lib/addressing/
├── types.ts          # Address types, ParsedAddress, AddressType enum
├── parser.ts         # parseAddress(), createAddress, extraction utilities
├── parser.test.ts    # 23 unit tests
└── index.ts          # Barrel exports

src/lib/permissions/
├── types.ts          # MemberRole, CorePermission, ROLE_HIERARCHY, ROLE_PERMISSIONS
└── index.ts          # checkPermission(), getPermissionsForRole()

src/test/
├── setup.tsx         # Global test setup, Next.js mocks
└── mocks/
    └── prisma.ts     # Mock Prisma client

prisma/
└── seed-v2.ts        # Development seed script

vitest.config.ts      # Vitest configuration
```

**Test Coverage:**
- 23 tests for addressing parser (all passing)
- Plugin registry: ready for integration tests
- Permission system: ready for integration tests

**Technical Decisions Made:**
1. Types (ContextType, MemberRole) defined locally until Prisma migration in Phase 1
2. PostCSS disabled in vitest config to avoid build conflicts
3. Setup file uses `.tsx` extension for JSX mock support
4. Used existing feature branch rather than creating new one (preserves v2 work)

---

## Phase 1: Core Data Model

**Goal:** Implement the new Context and Membership models while preserving backward compatibility with existing Event model.

### Task 1.1: Create Context Model Migration ✅

**Files:**
- `prisma/migrations/YYYYMMDDHHMMSS_add_context_model/migration.sql`
- `prisma/schema.prisma` (update)

**Migration SQL:**
```sql
-- CreateEnum
CREATE TYPE "ContextType" AS ENUM ('GROUP', 'EVENT', 'CONVENTION', 'CHANNEL');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "JoinPolicy" AS ENUM ('OPEN', 'APPROVAL', 'INVITE', 'CLOSED');

-- CreateTable
CREATE TABLE "Context" (
    "id" TEXT NOT NULL,
    "type" "ContextType" NOT NULL,
    "slug" TEXT NOT NULL,
    "handle" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "ownerId" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "joinPolicy" "JoinPolicy" NOT NULL DEFAULT 'OPEN',
    "plugins" JSONB NOT NULL DEFAULT '{}',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Context_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Context_slug_key" ON "Context"("slug");
CREATE UNIQUE INDEX "Context_handle_key" ON "Context"("handle");
CREATE INDEX "Context_type_idx" ON "Context"("type");
CREATE INDEX "Context_ownerId_idx" ON "Context"("ownerId");
CREATE INDEX "Context_visibility_idx" ON "Context"("visibility");
CREATE INDEX "Context_createdAt_idx" ON "Context"("createdAt");

-- AddForeignKey
ALTER TABLE "Context" ADD CONSTRAINT "Context_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

**Prisma Schema Addition:**
```prisma
model Context {
  id          String      @id @default(cuid())
  type        ContextType
  slug        String      @unique
  handle      String?     @unique
  name        String
  description String?     @db.Text
  avatarUrl   String?
  bannerUrl   String?
  ownerId     String
  owner       User        @relation("ContextOwner", fields: [ownerId], references: [id])
  visibility  Visibility  @default(PUBLIC)
  joinPolicy  JoinPolicy  @default(OPEN)
  plugins     Json        @default("{}")
  features    String[]    @default([])
  isArchived  Boolean     @default(false)
  archivedAt  DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  memberships Membership[]

  @@index([type])
  @@index([ownerId])
  @@index([visibility])
  @@index([createdAt])
}

enum ContextType {
  GROUP
  EVENT
  CONVENTION
  CHANNEL
}

enum Visibility {
  PUBLIC
  PRIVATE
  UNLISTED
}

enum JoinPolicy {
  OPEN
  APPROVAL
  INVITE
  CLOSED
}
```

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] `npx prisma generate` completes
- [ ] TypeScript types available for Context
- [ ] No breaking changes to existing models

---

### Task 1.2: Create Membership Model Migration ✅

**Files:**
- `prisma/migrations/YYYYMMDDHHMMSS_add_membership_model/migration.sql`
- `prisma/schema.prisma` (update)

**Migration SQL:**
```sql
-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'APPROVED', 'BANNED', 'LEFT');

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MemberStatus" NOT NULL DEFAULT 'APPROVED',
    "permissions" JSONB,
    "notifyPosts" BOOLEAN NOT NULL DEFAULT true,
    "notifyMentions" BOOLEAN NOT NULL DEFAULT true,
    "notifyEvents" BOOLEAN NOT NULL DEFAULT true,
    "pluginData" JSONB NOT NULL DEFAULT '{}',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Membership_contextId_userId_key" ON "Membership"("contextId", "userId");
CREATE INDEX "Membership_contextId_role_idx" ON "Membership"("contextId", "role");
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");
CREATE INDEX "Membership_status_idx" ON "Membership"("status");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_contextId_fkey"
    FOREIGN KEY ("contextId") REFERENCES "Context"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

**Prisma Schema Addition:**
```prisma
model Membership {
  id          String       @id @default(cuid())
  contextId   String
  context     Context      @relation(fields: [contextId], references: [id], onDelete: Cascade)
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  role        MemberRole   @default(MEMBER)
  status      MemberStatus @default(APPROVED)
  permissions Json?
  notifyPosts    Boolean   @default(true)
  notifyMentions Boolean   @default(true)
  notifyEvents   Boolean   @default(true)
  pluginData  Json         @default("{}")
  joinedAt    DateTime     @default(now())
  approvedAt  DateTime?
  approvedBy  String?

  @@unique([contextId, userId])
  @@index([contextId, role])
  @@index([userId])
  @@index([status])
}

enum MemberRole {
  OWNER
  ADMIN
  MODERATOR
  MEMBER
  GUEST
}

enum MemberStatus {
  PENDING
  APPROVED
  BANNED
  LEFT
}
```

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] Unique constraint on (contextId, userId) enforced
- [ ] TypeScript types available for Membership
- [ ] Relation to User model works

---

### Task 1.3: Enhance Activity Model ✅

**Files:**
- `prisma/migrations/YYYYMMDDHHMMSS_enhance_activity_model/migration.sql`
- `prisma/schema.prisma` (update)

**Migration SQL:**
```sql
-- Add new columns to Activity
ALTER TABLE "Activity"
  ADD COLUMN "contextId" TEXT,
  ADD COLUMN "threadRoot" TEXT,
  ADD COLUMN "sensitive" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "language" TEXT,
  ADD COLUMN "likesCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "repliesCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "repostsCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "editedAt" TIMESTAMP(3);

-- Add new activity types
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'JOIN';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'LEAVE';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'INVITE';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'RSVP';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CHECKIN';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'FLAG';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'BLOCK';

-- Add new object types
ALTER TYPE "ObjectType" ADD VALUE IF NOT EXISTS 'VIDEO';
ALTER TYPE "ObjectType" ADD VALUE IF NOT EXISTS 'ARTICLE';
ALTER TYPE "ObjectType" ADD VALUE IF NOT EXISTS 'POLL';
ALTER TYPE "ObjectType" ADD VALUE IF NOT EXISTS 'CONTEXT';

-- Create indexes
CREATE INDEX "Activity_contextId_published_idx" ON "Activity"("contextId", "published");
CREATE INDEX "Activity_threadRoot_idx" ON "Activity"("threadRoot");

-- Add foreign key (optional reference to Context)
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contextId_fkey"
    FOREIGN KEY ("contextId") REFERENCES "Context"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

**Acceptance Criteria:**
- [ ] New columns added to Activity
- [ ] New enum values available
- [ ] contextId links activities to contexts
- [ ] Engagement counters work

---

### Task 1.4: Enhance User Model for v2 ✅

**Files:**
- `prisma/migrations/YYYYMMDDHHMMSS_enhance_user_model/migration.sql`
- `prisma/schema.prisma` (update)

**Migration SQL:**
```sql
-- Add new columns to User
ALTER TABLE "User"
  ADD COLUMN "languages" TEXT[] DEFAULT ARRAY['ko']::TEXT[],
  ADD COLUMN "lookingFor" TEXT,
  ADD COLUMN "isDiscoverable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "approximateLocation" JSONB,
  ADD COLUMN "lastLocationUpdate" TIMESTAMP(3),
  ADD COLUMN "theme" JSONB,
  ADD COLUMN "isAgeVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- Create enum for lookingFor (as text since PG enum changes are tricky)
-- We'll validate in application code
```

**Acceptance Criteria:**
- [ ] New profile fields available
- [ ] Discovery fields (isDiscoverable, approximateLocation) work
- [ ] Theme customization field available
- [ ] Age verification fields present

---

### Task 1.5: Enhance InboxItem Model ✅

**Files:**
- `prisma/migrations/YYYYMMDDHHMMSS_enhance_inbox_model/migration.sql`
- `prisma/schema.prisma` (update)

**Migration SQL:**
```sql
-- Add new columns to InboxItem
ALTER TABLE "InboxItem"
  ADD COLUMN "readAt" TIMESTAMP(3),
  ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;

-- Add new inbox categories
ALTER TYPE "InboxCategory" ADD VALUE IF NOT EXISTS 'GROUP';
ALTER TYPE "InboxCategory" ADD VALUE IF NOT EXISTS 'SYSTEM';

-- Create index for priority-based sorting
CREATE INDEX "InboxItem_userId_priority_createdAt_idx"
    ON "InboxItem"("userId", "priority" DESC, "createdAt" DESC);
```

**Acceptance Criteria:**
- [ ] readAt timestamp tracks when notifications are read
- [ ] Priority field enables important notification ordering
- [ ] New categories available for GROUP and SYSTEM

---

### Task 1.6: Create Context Service Layer ✅

**Files:**
- `src/server/services/context.service.ts` (create)

**Implementation:**
```typescript
// src/server/services/context.service.ts

import { db } from '@/lib/db';
import { generateSlug } from '@/lib/utils/slug';
import { pluginRegistry } from '@/lib/plugins/registry';
import type { ContextType, Visibility, JoinPolicy, MemberRole } from '@prisma/client';

export interface CreateContextInput {
  type: ContextType;
  name: string;
  description?: string;
  visibility?: Visibility;
  joinPolicy?: JoinPolicy;
  ownerId: string;
  pluginId: string;
  pluginData?: Record<string, unknown>;
}

export interface ContextWithMembership {
  id: string;
  type: ContextType;
  slug: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  visibility: Visibility;
  joinPolicy: JoinPolicy;
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
  userMembership?: {
    id: string;
    role: MemberRole;
    status: string;
    pluginData: Record<string, unknown>;
  } | null;
}

export const contextService = {
  /**
   * Create a new context with owner membership
   */
  async create(input: CreateContextInput): Promise<ContextWithMembership> {
    const plugin = pluginRegistry.get(input.pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${input.pluginId}" not found`);
    }

    // Validate plugin data
    const validatedData = input.pluginData
      ? plugin.dataSchema.parse(input.pluginData)
      : plugin.defaultData;

    // Generate unique slug
    const baseSlug = generateSlug(input.name);
    let slug = baseSlug;
    let counter = 1;

    while (await db.context.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Transaction: create context + owner membership
    const context = await db.$transaction(async (tx) => {
      const ctx = await tx.context.create({
        data: {
          type: input.type,
          slug,
          name: input.name,
          description: input.description,
          visibility: input.visibility ?? 'PUBLIC',
          joinPolicy: input.joinPolicy ?? 'OPEN',
          ownerId: input.ownerId,
          plugins: { [input.pluginId]: validatedData },
          features: [input.pluginId],
        },
        include: {
          owner: {
            select: { id: true, username: true, displayName: true, avatarUrl: true }
          },
          _count: { select: { memberships: true } },
        },
      });

      // Create owner membership
      await tx.membership.create({
        data: {
          contextId: ctx.id,
          userId: input.ownerId,
          role: 'OWNER',
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      });

      return ctx;
    });

    // Run plugin hook
    await plugin.hooks?.onContextCreate?.(context, validatedData);

    return context as ContextWithMembership;
  },

  /**
   * Get context by ID with optional user membership
   */
  async getById(
    contextId: string,
    userId?: string
  ): Promise<ContextWithMembership | null> {
    const context = await db.context.findUnique({
      where: { id: contextId, isArchived: false },
      include: {
        owner: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        },
        _count: { select: { memberships: { where: { status: 'APPROVED' } } } },
      },
    });

    if (!context) return null;

    let userMembership = null;
    if (userId) {
      userMembership = await db.membership.findUnique({
        where: { contextId_userId: { contextId, userId } },
        select: { id: true, role: true, status: true, pluginData: true },
      });
    }

    return {
      ...context,
      plugins: context.plugins as Record<string, unknown>,
      userMembership: userMembership as ContextWithMembership['userMembership'],
    };
  },

  /**
   * Get context by slug
   */
  async getBySlug(
    slug: string,
    userId?: string
  ): Promise<ContextWithMembership | null> {
    const context = await db.context.findUnique({
      where: { slug, isArchived: false },
    });

    if (!context) return null;
    return this.getById(context.id, userId);
  },

  /**
   * Check if user can access context
   */
  async canAccess(contextId: string, userId?: string): Promise<boolean> {
    const context = await db.context.findUnique({
      where: { id: contextId },
      select: { visibility: true },
    });

    if (!context) return false;

    // Public and unlisted are always accessible
    if (context.visibility !== 'PRIVATE') return true;

    // Private requires membership
    if (!userId) return false;

    const membership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId } },
    });

    return membership?.status === 'APPROVED';
  },

  /**
   * Join a context
   */
  async join(
    contextId: string,
    userId: string
  ): Promise<{ membership: unknown; pending: boolean }> {
    const context = await db.context.findUnique({
      where: { id: contextId },
    });

    if (!context) throw new Error('Context not found');
    if (context.isArchived) throw new Error('Context is archived');
    if (context.joinPolicy === 'CLOSED') throw new Error('Context is not accepting members');
    if (context.joinPolicy === 'INVITE') throw new Error('Invite required');

    const needsApproval = context.joinPolicy === 'APPROVAL';

    const membership = await db.membership.create({
      data: {
        contextId,
        userId,
        role: 'MEMBER',
        status: needsApproval ? 'PENDING' : 'APPROVED',
        approvedAt: needsApproval ? undefined : new Date(),
      },
    });

    // Run plugin hooks
    for (const pluginId of context.features) {
      const plugin = pluginRegistry.get(pluginId);
      if (membership.status === 'APPROVED') {
        await plugin?.hooks?.onMemberJoin?.(membership, context);
      }
    }

    return { membership, pending: needsApproval };
  },

  /**
   * Leave a context
   */
  async leave(contextId: string, userId: string): Promise<void> {
    const context = await db.context.findUnique({ where: { id: contextId } });
    if (!context) throw new Error('Context not found');

    // Owner cannot leave - must transfer ownership first
    if (context.ownerId === userId) {
      throw new Error('Owner cannot leave. Transfer ownership first.');
    }

    const membership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId } },
    });

    if (!membership) throw new Error('Not a member');

    await db.membership.update({
      where: { id: membership.id },
      data: { status: 'LEFT' },
    });

    // Run plugin hooks
    for (const pluginId of context.features) {
      const plugin = pluginRegistry.get(pluginId);
      await plugin?.hooks?.onMemberLeave?.(membership, context);
    }
  },
};
```

**Acceptance Criteria:**
- [ ] Context CRUD operations work
- [ ] Membership management works
- [ ] Plugin hooks are called
- [ ] Visibility checks implemented

---

### Task 1.7: Create Membership Service Layer ✅

**Files:**
- `src/server/services/membership.service.ts` (create)

**Implementation:**
```typescript
// src/server/services/membership.service.ts

import { db } from '@/lib/db';
import type { MemberRole, MemberStatus } from '@prisma/client';

export interface MembershipListOptions {
  contextId: string;
  status?: MemberStatus;
  role?: MemberRole;
  cursor?: string;
  limit?: number;
}

export const membershipService = {
  /**
   * Get membership for user in context
   */
  async get(contextId: string, userId: string) {
    return db.membership.findUnique({
      where: { contextId_userId: { contextId, userId } },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            species: true,
          },
        },
      },
    });
  },

  /**
   * List memberships for a context
   */
  async list(options: MembershipListOptions) {
    const { contextId, status, role, cursor, limit = 50 } = options;

    const memberships = await db.membership.findMany({
      where: {
        contextId,
        ...(status && { status }),
        ...(role && { role }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            species: true,
            lastActiveAt: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first
        { joinedAt: 'asc' },
      ],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = memberships.length > limit;
    const items = hasMore ? memberships.slice(0, -1) : memberships;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : undefined,
    };
  },

  /**
   * Update member role
   */
  async updateRole(
    contextId: string,
    targetUserId: string,
    newRole: MemberRole,
    actorId: string
  ) {
    // Check actor permissions
    const actorMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: actorId } },
    });

    if (!actorMembership || !['OWNER', 'ADMIN'].includes(actorMembership.role)) {
      throw new Error('Insufficient permissions');
    }

    // Cannot change owner role
    const context = await db.context.findUnique({ where: { id: contextId } });
    if (context?.ownerId === targetUserId && newRole !== 'OWNER') {
      throw new Error('Cannot demote owner');
    }

    // Only owner can promote to admin
    if (newRole === 'ADMIN' && actorMembership.role !== 'OWNER') {
      throw new Error('Only owner can promote to admin');
    }

    return db.membership.update({
      where: { contextId_userId: { contextId, userId: targetUserId } },
      data: { role: newRole },
    });
  },

  /**
   * Approve pending membership
   */
  async approve(contextId: string, targetUserId: string, actorId: string) {
    const actorMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: actorId } },
    });

    if (!actorMembership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(actorMembership.role)) {
      throw new Error('Insufficient permissions');
    }

    return db.membership.update({
      where: { contextId_userId: { contextId, userId: targetUserId } },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: actorId,
      },
    });
  },

  /**
   * Ban member
   */
  async ban(contextId: string, targetUserId: string, actorId: string) {
    const actorMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: actorId } },
    });

    const targetMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: targetUserId } },
    });

    if (!actorMembership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(actorMembership.role)) {
      throw new Error('Insufficient permissions');
    }

    // Cannot ban higher role
    const roleOrder = ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER', 'GUEST'];
    if (roleOrder.indexOf(actorMembership.role) >= roleOrder.indexOf(targetMembership?.role || 'MEMBER')) {
      throw new Error('Cannot ban member with equal or higher role');
    }

    return db.membership.update({
      where: { contextId_userId: { contextId, userId: targetUserId } },
      data: { status: 'BANNED' },
    });
  },

  /**
   * Update plugin data for membership
   */
  async updatePluginData(
    contextId: string,
    userId: string,
    pluginId: string,
    data: Record<string, unknown>
  ) {
    const membership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId } },
    });

    if (!membership) throw new Error('Membership not found');

    const currentPluginData = membership.pluginData as Record<string, unknown>;

    return db.membership.update({
      where: { id: membership.id },
      data: {
        pluginData: {
          ...currentPluginData,
          [pluginId]: {
            ...(currentPluginData[pluginId] as Record<string, unknown> || {}),
            ...data,
          },
        },
      },
    });
  },
};
```

**Acceptance Criteria:**
- [ ] Membership CRUD works
- [ ] Role-based permission checks
- [ ] Plugin data updates work
- [ ] Pagination implemented

---

### Task 1.8: Create Unit Tests for Services ✅

**Files:**
- `src/server/services/context.service.test.ts` (create)
- `src/server/services/membership.service.test.ts` (create)

**Test Coverage Requirements:**
- Context creation with plugin validation
- Visibility checks (public, private, unlisted)
- Join/leave with different join policies
- Role-based permission checks
- Membership CRUD operations

**Acceptance Criteria:**
- [x] >80% code coverage for services
- [x] All edge cases tested
- [x] Mocked Prisma client

---

### Phase 1 Summary ✅

**Completed:** 2026-01-04

**Schema Changes:**
- Added `Context` model with ContextType, Visibility, JoinPolicy enums
- Added `Membership` model with MemberRole, MemberStatus enums
- Enhanced `Activity` model with contextId, threadRoot, counters, sensitive, language
- Enhanced `User` model with v2 fields (languages, lookingFor, isDiscoverable, theme, verification)
- Enhanced `InboxItem` model with readAt, priority, GROUP/SYSTEM categories
- Added new ActivityType values (JOIN, LEAVE, INVITE, RSVP, CHECKIN, FLAG, BLOCK)
- Added new ObjectType values (VIDEO, ARTICLE, POLL, CONTEXT)

**Services Created:**
```
src/server/services/
├── context.service.ts    # Context CRUD, join/leave, ownership, plugin data
└── membership.service.ts # Membership CRUD, role management, ban/unban
```

**Tests Created:**
```
src/server/services/
├── context.service.test.ts    # 22 tests
└── membership.service.test.ts # 21 tests
```

**Technical Notes:**
1. Used `prisma db push` to sync schema (migration history was out of sync)
2. Updated Phase 0 types to import from `@prisma/client` instead of local definitions
3. JSON fields require `as Prisma.InputJsonValue` cast for type safety
4. All 66 tests passing (23 addressing + 22 context + 21 membership)

---

## Phase 2: Addressing System

**Goal:** Implement the unified addressing system for activity visibility and delivery.

### Task 2.1: Implement Address Parser ✅

**Files:**
- `src/lib/addressing/parser.ts` (create)
- `src/lib/addressing/types.ts` (create)

**Implementation:**
```typescript
// src/lib/addressing/types.ts

export type AddressType =
  | 'public'
  | 'followers'
  | 'user'
  | 'context'
  | 'unknown';

export interface ParsedAddress {
  type: AddressType;
  id?: string;
  modifier?: string;
  raw: string;
}

export type Address =
  | 'public'
  | 'followers'
  | `user:${string}`
  | `context:${string}`
  | `context:${string}:${string}`;

// src/lib/addressing/parser.ts

import type { ParsedAddress, Address } from './types';

/**
 * Parse an address string into structured data
 */
export function parseAddress(address: string): ParsedAddress {
  const raw = address;

  if (address === 'public') {
    return { type: 'public', raw };
  }

  if (address === 'followers') {
    return { type: 'followers', raw };
  }

  if (address.startsWith('user:')) {
    return {
      type: 'user',
      id: address.slice(5),
      raw,
    };
  }

  if (address.startsWith('context:')) {
    const remainder = address.slice(8);
    const colonIndex = remainder.indexOf(':');

    if (colonIndex === -1) {
      return {
        type: 'context',
        id: remainder,
        raw,
      };
    }

    return {
      type: 'context',
      id: remainder.slice(0, colonIndex),
      modifier: remainder.slice(colonIndex + 1),
      raw,
    };
  }

  return { type: 'unknown', raw };
}

/**
 * Create address strings
 */
export const createAddress = {
  public: (): Address => 'public',
  followers: (): Address => 'followers',
  user: (userId: string): Address => `user:${userId}`,
  context: (contextId: string): Address => `context:${contextId}`,
  contextAdmins: (contextId: string): Address => `context:${contextId}:admins`,
  contextRole: (contextId: string, role: string): Address => `context:${contextId}:role:${role}`,
};

/**
 * Check if address is public
 */
export function isPublicAddress(addresses: string[]): boolean {
  return addresses.includes('public');
}

/**
 * Extract all context IDs from addresses
 */
export function extractContextIds(addresses: string[]): string[] {
  const ids: string[] = [];

  for (const addr of addresses) {
    const parsed = parseAddress(addr);
    if (parsed.type === 'context' && parsed.id) {
      ids.push(parsed.id);
    }
  }

  return [...new Set(ids)];
}

/**
 * Extract all user IDs from addresses
 */
export function extractUserIds(addresses: string[]): string[] {
  const ids: string[] = [];

  for (const addr of addresses) {
    const parsed = parseAddress(addr);
    if (parsed.type === 'user' && parsed.id) {
      ids.push(parsed.id);
    }
  }

  return [...new Set(ids)];
}
```

**Acceptance Criteria:**
- [ ] All address formats parsed correctly
- [ ] Address creation helpers work
- [ ] Extraction utilities tested

---

### Task 2.2: Implement Visibility Checker ✅

**Files:**
- `src/lib/addressing/visibility.ts` (create)

**Implementation:**
```typescript
// src/lib/addressing/visibility.ts

import { db } from '@/lib/db';
import { parseAddress } from './parser';
import { pluginRegistry } from '@/lib/plugins/registry';
import type { Activity } from '@prisma/client';

/**
 * Check if a user can see an activity
 */
export async function canSeeActivity(
  activity: Pick<Activity, 'to' | 'cc' | 'actorId'>,
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

  // Actor can always see their own activities
  if (activity.actorId === userId) {
    return true;
  }

  // Check each address
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
 * Check if viewer is following actor
 */
async function isFollowing(viewerId: string, actorId: string): Promise<boolean> {
  const follow = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: viewerId,
        followingId: actorId,
      },
    },
  });

  return follow?.status === 'ACCEPTED';
}

/**
 * Check if user can access a context-based address
 */
async function canAccessContextAddress(
  userId: string,
  contextId: string,
  modifier?: string
): Promise<boolean> {
  const membership = await db.membership.findUnique({
    where: { contextId_userId: { contextId, userId } },
  });

  // Must be approved member
  if (!membership || membership.status !== 'APPROVED') {
    return false;
  }

  // No modifier = any approved member
  if (!modifier) {
    return true;
  }

  // Check standard modifiers
  if (modifier === 'admins') {
    return ['OWNER', 'ADMIN'].includes(membership.role);
  }

  if (modifier.startsWith('role:')) {
    const requiredRole = modifier.slice(5);
    return membership.role === requiredRole;
  }

  // Check plugin-defined patterns
  const context = await db.context.findUnique({
    where: { id: contextId },
    select: { features: true },
  });

  if (!context) return false;

  for (const pluginId of context.features) {
    const plugin = pluginRegistry.get(pluginId);
    if (!plugin?.addressPatterns) continue;

    for (const pattern of plugin.addressPatterns) {
      const patternModifier = pattern.pattern.replace('context:{id}:', '');
      if (patternModifier === modifier) {
        return await pattern.resolver(contextId, userId);
      }
    }
  }

  return false;
}

/**
 * Filter activities that a user can see
 */
export async function filterVisibleActivities<T extends Pick<Activity, 'to' | 'cc' | 'actorId'>>(
  activities: T[],
  userId: string | null
): Promise<T[]> {
  const results = await Promise.all(
    activities.map(async (activity) => ({
      activity,
      visible: await canSeeActivity(activity, userId),
    }))
  );

  return results.filter(r => r.visible).map(r => r.activity);
}
```

**Acceptance Criteria:**
- [ ] Public activities visible to everyone
- [ ] Private activities only visible to addresses
- [ ] Follower-only activities work correctly
- [ ] Context address modifiers respected
- [ ] Plugin address patterns work

---

### Task 2.3: Implement Delivery Service ✅

**Files:**
- `src/lib/addressing/delivery.ts` (create)

**Implementation:**
```typescript
// src/lib/addressing/delivery.ts

import { db } from '@/lib/db';
import { parseAddress } from './parser';
import type { Activity, InboxCategory, MemberRole, Prisma } from '@prisma/client';

/**
 * Deliver an activity to all recipients' inboxes
 */
export async function deliverActivity(
  activity: Pick<Activity, 'id' | 'type' | 'actorId' | 'to' | 'cc'>
): Promise<number> {
  const recipients = new Set<string>();
  const allAddresses = [...activity.to, ...activity.cc];

  for (const address of allAddresses) {
    const parsed = parseAddress(address);

    switch (parsed.type) {
      case 'public':
        // Public activities don't get individual inbox delivery
        // Users query public timelines instead
        break;

      case 'followers':
        const followers = await db.follow.findMany({
          where: {
            followingId: activity.actorId,
            status: 'ACCEPTED'
          },
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

  if (recipients.size === 0) return 0;

  // Determine category based on activity type
  const category = determineCategory(activity.type);

  // Batch create inbox items
  await db.inboxItem.createMany({
    data: [...recipients].map(userId => ({
      userId,
      activityId: activity.id,
      category,
    })),
    skipDuplicates: true,
  });

  return recipients.size;
}

/**
 * Resolve context address to user IDs
 */
async function resolveContextRecipients(
  contextId: string,
  modifier?: string
): Promise<string[]> {
  const where: Prisma.MembershipWhereInput = {
    contextId,
    status: 'APPROVED',
  };

  if (modifier === 'admins') {
    where.role = { in: ['OWNER', 'ADMIN'] as MemberRole[] };
  } else if (modifier?.startsWith('role:')) {
    where.role = modifier.slice(5) as MemberRole;
  }
  // Note: Plugin-specific modifiers require custom resolution
  // which should be handled by the plugin's address resolver

  const memberships = await db.membership.findMany({
    where,
    select: { userId: true },
  });

  return memberships.map(m => m.userId);
}

/**
 * Determine inbox category based on activity type
 */
function determineCategory(activityType: string): InboxCategory {
  switch (activityType) {
    case 'LIKE':
      return 'LIKE';
    case 'ANNOUNCE':
      return 'REPOST';
    case 'FOLLOW':
      return 'FOLLOW';
    case 'CREATE':
      // Check if it's a DM based on addressing (handled separately)
      return 'REPLY'; // Could be MENTION depending on context
    case 'RSVP':
    case 'CHECKIN':
      return 'EVENT';
    case 'JOIN':
    case 'INVITE':
      return 'GROUP';
    default:
      return 'DEFAULT';
  }
}

/**
 * Enhanced delivery with mention detection
 */
export async function deliverActivityWithMentions(
  activity: Pick<Activity, 'id' | 'type' | 'actorId' | 'to' | 'cc' | 'object'>
): Promise<{ delivered: number; mentioned: number }> {
  // Extract mentions from content
  const mentionedUserIds = extractMentions(activity.object);

  // Add mentioned users to 'cc' for delivery
  const enhancedActivity = {
    ...activity,
    cc: [
      ...activity.cc,
      ...mentionedUserIds.map(id => `user:${id}`),
    ],
  };

  const delivered = await deliverActivity(enhancedActivity);

  // Create separate mention notifications
  if (mentionedUserIds.length > 0) {
    await db.inboxItem.createMany({
      data: mentionedUserIds
        .filter(id => id !== activity.actorId)
        .map(userId => ({
          userId,
          activityId: activity.id,
          category: 'MENTION' as InboxCategory,
          priority: 1, // Higher priority for mentions
        })),
      skipDuplicates: true,
    });
  }

  return { delivered, mentioned: mentionedUserIds.length };
}

/**
 * Extract @mentions from activity content
 */
function extractMentions(object: unknown): string[] {
  if (!object || typeof object !== 'object') return [];

  const obj = object as { content?: string; mentions?: string[] };

  // If explicit mentions array exists, use it
  if (Array.isArray(obj.mentions)) {
    return obj.mentions;
  }

  // Otherwise, parse from content
  if (typeof obj.content === 'string') {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const usernames: string[] = [];
    let match;

    while ((match = mentionRegex.exec(obj.content)) !== null) {
      usernames.push(match[1]);
    }

    // Would need to resolve usernames to IDs
    // This is a simplified version - real implementation needs username->ID lookup
    return []; // TODO: Implement username resolution
  }

  return [];
}
```

**Acceptance Criteria:**
- [ ] Followers receive activities addressed to "followers"
- [ ] Context members receive context-addressed activities
- [ ] Inbox categories correctly assigned
- [ ] Mentions detected and delivered with priority
- [ ] Actor excluded from their own delivery

---

### Task 2.4: Create Addressing Integration Tests ✅

**Files:**
- `src/lib/addressing/__tests__/parser.test.ts` (create)
- `src/lib/addressing/__tests__/visibility.test.ts` (create)
- `src/lib/addressing/__tests__/delivery.test.ts` (create)

**Test Scenarios:**

```typescript
// Example test cases for visibility.test.ts

describe('canSeeActivity', () => {
  it('allows anyone to see public activities', async () => {
    const activity = { to: ['public'], cc: [], actorId: 'user1' };
    expect(await canSeeActivity(activity, null)).toBe(true);
    expect(await canSeeActivity(activity, 'user2')).toBe(true);
  });

  it('requires login for non-public activities', async () => {
    const activity = { to: ['followers'], cc: [], actorId: 'user1' };
    expect(await canSeeActivity(activity, null)).toBe(false);
  });

  it('allows actor to see their own activities', async () => {
    const activity = { to: ['user:specific'], cc: [], actorId: 'user1' };
    expect(await canSeeActivity(activity, 'user1')).toBe(true);
  });

  it('allows direct recipients to see activities', async () => {
    const activity = { to: ['user:user2'], cc: [], actorId: 'user1' };
    expect(await canSeeActivity(activity, 'user2')).toBe(true);
    expect(await canSeeActivity(activity, 'user3')).toBe(false);
  });

  it('allows followers to see follower-only activities', async () => {
    // Setup: user2 follows user1
    const activity = { to: ['followers'], cc: [], actorId: 'user1' };
    expect(await canSeeActivity(activity, 'user2')).toBe(true);
  });

  it('respects context membership for context addresses', async () => {
    // Setup: user2 is member of context1
    const activity = { to: ['context:context1'], cc: [], actorId: 'user1' };
    expect(await canSeeActivity(activity, 'user2')).toBe(true);
    expect(await canSeeActivity(activity, 'user3')).toBe(false);
  });

  it('respects context:admins modifier', async () => {
    // Setup: user2 is admin, user3 is member
    const activity = { to: ['context:context1:admins'], cc: [], actorId: 'user1' };
    expect(await canSeeActivity(activity, 'user2')).toBe(true);
    expect(await canSeeActivity(activity, 'user3')).toBe(false);
  });
});
```

**Acceptance Criteria:**
- [ ] >90% coverage for addressing module
- [ ] All address formats tested
- [ ] Edge cases covered

---

### Task 2.5: Implement Permission Checker ✅

**Files:**
- `src/lib/permissions/index.ts` (create)
- `src/lib/permissions/types.ts` (create)

**Implementation:**
```typescript
// src/lib/permissions/types.ts

export type CorePermission =
  | 'context.view'
  | 'context.edit'
  | 'context.delete'
  | 'context.manage_members'
  | 'activity.create'
  | 'activity.edit_own'
  | 'activity.delete_own'
  | 'activity.delete_any'
  | 'activity.pin'
  | 'member.invite'
  | 'member.approve'
  | 'member.ban'
  | 'member.update_role';

export type Permission = CorePermission | `plugin.${string}.${string}`;

// src/lib/permissions/index.ts

import { db } from '@/lib/db';
import { pluginRegistry } from '@/lib/plugins/registry';
import type { MemberRole } from '@prisma/client';
import type { Permission, CorePermission } from './types';

/**
 * Default permissions by role
 */
const ROLE_PERMISSIONS: Record<MemberRole, CorePermission[]> = {
  OWNER: [
    'context.view', 'context.edit', 'context.delete', 'context.manage_members',
    'activity.create', 'activity.edit_own', 'activity.delete_own', 'activity.delete_any', 'activity.pin',
    'member.invite', 'member.approve', 'member.ban', 'member.update_role',
  ],
  ADMIN: [
    'context.view', 'context.edit', 'context.manage_members',
    'activity.create', 'activity.edit_own', 'activity.delete_own', 'activity.delete_any', 'activity.pin',
    'member.invite', 'member.approve', 'member.ban', 'member.update_role',
  ],
  MODERATOR: [
    'context.view',
    'activity.create', 'activity.edit_own', 'activity.delete_own', 'activity.delete_any',
    'member.approve', 'member.ban',
  ],
  MEMBER: [
    'context.view',
    'activity.create', 'activity.edit_own', 'activity.delete_own',
  ],
  GUEST: [
    'context.view',
  ],
};

/**
 * Check if user has permission in context
 */
export async function hasPermission(
  userId: string,
  contextId: string,
  permission: Permission
): Promise<boolean> {
  const membership = await db.membership.findUnique({
    where: { contextId_userId: { contextId, userId } },
    include: {
      context: { select: { features: true, ownerId: true } },
    },
  });

  // Not a member
  if (!membership || membership.status !== 'APPROVED') {
    return false;
  }

  // Check custom permissions override first
  if (membership.permissions) {
    const custom = membership.permissions as Record<string, boolean>;
    if (permission in custom) {
      return custom[permission];
    }
  }

  // Check role-based permissions
  const rolePerms = ROLE_PERMISSIONS[membership.role];
  if (rolePerms.includes(permission as CorePermission)) {
    return true;
  }

  // Check plugin permissions
  if (permission.startsWith('plugin.')) {
    const [, pluginId, pluginPerm] = permission.split('.');
    const plugin = pluginRegistry.get(pluginId);

    if (plugin?.permissions) {
      const pluginPermDef = plugin.permissions.find(p => p.id === pluginPerm);
      if (pluginPermDef?.defaultRoles.includes(membership.role)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get all permissions for user in context
 */
export async function getPermissions(
  userId: string,
  contextId: string
): Promise<Permission[]> {
  const membership = await db.membership.findUnique({
    where: { contextId_userId: { contextId, userId } },
    include: {
      context: { select: { features: true } },
    },
  });

  if (!membership || membership.status !== 'APPROVED') {
    return [];
  }

  const permissions: Permission[] = [...ROLE_PERMISSIONS[membership.role]];

  // Add plugin permissions
  for (const pluginId of membership.context.features) {
    const plugin = pluginRegistry.get(pluginId);
    if (plugin?.permissions) {
      for (const perm of plugin.permissions) {
        if (perm.defaultRoles.includes(membership.role)) {
          permissions.push(`plugin.${pluginId}.${perm.id}` as Permission);
        }
      }
    }
  }

  // Apply custom overrides
  if (membership.permissions) {
    const custom = membership.permissions as Record<string, boolean>;
    for (const [perm, granted] of Object.entries(custom)) {
      if (granted && !permissions.includes(perm as Permission)) {
        permissions.push(perm as Permission);
      } else if (!granted) {
        const idx = permissions.indexOf(perm as Permission);
        if (idx !== -1) permissions.splice(idx, 1);
      }
    }
  }

  return permissions;
}

/**
 * tRPC middleware for permission checking
 */
export function requirePermission(permission: Permission) {
  return async ({ ctx, next, input }: { ctx: any; next: any; input: { contextId: string } }) => {
    if (!ctx.session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const hasAccess = await hasPermission(
      ctx.session.user.id,
      input.contextId,
      permission
    );

    if (!hasAccess) {
      throw new Error(`Missing permission: ${permission}`);
    }

    return next({ ctx: { ...ctx, permission } });
  };
}
```

**Acceptance Criteria:**
- [ ] Role-based permissions work
- [ ] Custom permission overrides work
- [ ] Plugin permissions integrated
- [ ] tRPC middleware available

---

### Task 2.6: Integrate Addressing with Activity Service ✅

**Files:**
- `src/server/services/activity.service.ts` (update)

**Updates Required:**
1. Use `deliverActivityWithMentions` for new activities
2. Use `canSeeActivity` for timeline queries
3. Add `contextId` to activities when posting to contexts

**Acceptance Criteria:**
- [x] Activity creation triggers delivery
- [x] Timeline queries respect visibility
- [x] Context activities properly linked

---

### Phase 2 Summary

**Files Created:**
```
src/lib/addressing/
├── visibility.ts       # canSeeActivity, filterVisibleActivities, batch helpers
├── visibility.test.ts  # 41 tests
├── delivery.ts         # deliverActivity, deliverActivityWithMentions, batch ops
├── delivery.test.ts    # 28 tests
└── index.ts            # Updated with visibility & delivery exports

src/lib/permissions/
├── index.ts            # Enhanced with DB-backed checks, tRPC middleware
└── permissions.test.ts # 46 tests

src/schemas/
└── activity.schema.ts  # Added context addresses, contextId, contextTimelineSchema
```

**Files Updated:**
- `src/server/services/activity.service.ts` - Integrated unified addressing
- `src/test/mocks/prisma.ts` - Added updateMany, deleteMany for inboxItem

**Test Coverage:**
- Addressing parser: 23 tests
- Visibility checker: 41 tests
- Delivery service: 28 tests
- Permission system: 46 tests
- Context service: 22 tests
- Membership service: 21 tests
- **Total: 181 tests passing**

**Key Features Implemented:**
1. **Unified Addressing** - Consistent `public`, `followers`, `user:{id}`, `context:{id}` format
2. **Context Modifiers** - Support for `:admins`, `:moderators`, `:role:{role}`
3. **Plugin Address Patterns** - Extensible patterns via plugin registry
4. **Visibility Checker** - Async checks with batch optimization helpers
5. **Delivery Service** - Inbox delivery with mention detection and categories
6. **Permission DB Integration** - `hasPermission()`, `requirePermission()` middleware
7. **Activity Integration** - Activities now support contextId and context addressing

---

## Phase 3: Plugin Framework

**Goal:** Implement the plugin system architecture with registry, hooks, and component injection.

### Task 3.1: Create Plugin Types and Interfaces

**Files:**
- `src/lib/plugins/types.ts` (create)

**Implementation:**
```typescript
// src/lib/plugins/types.ts

import type { z } from 'zod';
import type { ContextType, MemberRole } from '@prisma/client';
import type { ComponentType, ReactNode } from 'react';

/**
 * Core plugin interface
 */
export interface Plugin<TData = unknown> {
  /** Unique plugin identifier */
  id: string;

  /** Display name */
  name: string;

  /** Description */
  description: string;

  /** Version string */
  version: string;

  /** Compatible context types */
  contextTypes: ContextType[];

  /** Zod schema for plugin data validation */
  dataSchema: z.ZodSchema<TData>;

  /** Default data for new contexts */
  defaultData: TData;

  /** Custom activity types */
  activityTypes?: PluginActivityType[];

  /** Custom address patterns */
  addressPatterns?: PluginAddressPattern[];

  /** tRPC router (merged into main router) */
  router?: unknown; // TRPCRouter type

  /** React components */
  components?: PluginComponents;

  /** Lifecycle hooks */
  hooks?: PluginHooks<TData>;

  /** Permission definitions */
  permissions?: PluginPermission[];

  /** Membership field extensions */
  membershipFields?: PluginMembershipField[];
}

/**
 * Custom activity type definition
 */
export interface PluginActivityType {
  type: string;
  label: string;
  icon: string;
  description?: string;
}

/**
 * Custom address pattern
 */
export interface PluginAddressPattern {
  /** Pattern string, e.g., "context:{id}:attendees" */
  pattern: string;
  /** Human-readable label */
  label: string;
  /** Async resolver to check if user matches pattern */
  resolver: (contextId: string, userId: string) => Promise<boolean>;
}

/**
 * Plugin UI components
 */
export interface PluginComponents {
  /** Context page header extension */
  ContextHeader?: ComponentType<PluginContextProps>;

  /** Context page sidebar */
  ContextSidebar?: ComponentType<PluginContextProps>;

  /** Context settings panel */
  ContextSettings?: ComponentType<PluginContextProps>;

  /** Context card in listings */
  ContextCard?: ComponentType<PluginContextProps>;

  /** Context creation form */
  CreateForm?: ComponentType<PluginFormProps>;

  /** Post action buttons */
  PostActions?: ComponentType<PluginPostProps>;

  /** Custom post renderer */
  PostRenderer?: ComponentType<PluginPostProps>;

  /** Member card extension */
  MemberCard?: ComponentType<PluginMemberProps>;
}

export interface PluginContextProps {
  context: ContextData;
  membership?: MembershipData;
  pluginData: unknown;
}

export interface PluginFormProps {
  data: unknown;
  onChange: (data: unknown) => void;
  errors?: Record<string, string>;
}

export interface PluginPostProps {
  activity: ActivityData;
  context?: ContextData;
}

export interface PluginMemberProps {
  membership: MembershipData;
  pluginData: unknown;
}

// Simplified data types for components
export interface ContextData {
  id: string;
  type: ContextType;
  slug: string;
  name: string;
  description?: string;
  plugins: Record<string, unknown>;
  features: string[];
}

export interface MembershipData {
  id: string;
  role: MemberRole;
  status: string;
  pluginData: Record<string, unknown>;
}

export interface ActivityData {
  id: string;
  type: string;
  object: unknown;
  actorId: string;
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks<TData> {
  /** Called when context is created */
  onContextCreate?: (context: ContextData, data: TData) => Promise<void>;

  /** Called when context is updated */
  onContextUpdate?: (
    context: ContextData,
    data: TData,
    prevData: TData
  ) => Promise<void>;

  /** Called when context is deleted */
  onContextDelete?: (context: ContextData) => Promise<void>;

  /** Called when user joins */
  onMemberJoin?: (membership: MembershipData, context: ContextData) => Promise<void>;

  /** Called when user leaves */
  onMemberLeave?: (membership: MembershipData, context: ContextData) => Promise<void>;

  /** Called when activity is created */
  onActivityCreate?: (activity: ActivityData, context: ContextData) => Promise<void>;

  /** Validate plugin data */
  validateData?: (
    data: TData,
    context: ContextData
  ) => Promise<{ valid: boolean; errors?: string[] }>;
}

/**
 * Plugin permission definition
 */
export interface PluginPermission {
  id: string;
  name: string;
  description: string;
  defaultRoles: MemberRole[];
}

/**
 * Plugin membership field extension
 */
export interface PluginMembershipField {
  field: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'json';
  enumValues?: string[];
  defaultValue?: unknown;
  required?: boolean;
}
```

**Acceptance Criteria:**
- [ ] All interfaces defined with proper TypeScript types
- [ ] Zod schema support for runtime validation
- [ ] Component props fully typed

---

### Task 3.2: Implement Plugin Registry

**Files:**
- `src/lib/plugins/registry.ts` (create)

**Implementation:**
```typescript
// src/lib/plugins/registry.ts

import type { Plugin } from './types';
import type { ContextType } from '@prisma/client';

/**
 * Central registry for all plugins
 */
class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private initialized = false;

  /**
   * Register a plugin
   */
  register<TData>(plugin: Plugin<TData>): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin "${plugin.id}" already registered, overwriting`);
    }
    this.plugins.set(plugin.id, plugin as Plugin);
  }

  /**
   * Get plugin by ID
   */
  get(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get all plugins
   */
  all(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins compatible with a context type
   */
  forContextType(type: ContextType): Plugin[] {
    return this.all().filter(p => p.contextTypes.includes(type));
  }

  /**
   * Get default plugin for context type
   */
  defaultForContextType(type: ContextType): Plugin | undefined {
    const plugins = this.forContextType(type);
    return plugins[0];
  }

  /**
   * Get plugin IDs
   */
  ids(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if plugin exists
   */
  has(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * Get all activity types from all plugins
   */
  getAllActivityTypes(): Array<{ pluginId: string; type: string; label: string; icon: string }> {
    const types: Array<{ pluginId: string; type: string; label: string; icon: string }> = [];

    for (const plugin of this.plugins.values()) {
      if (plugin.activityTypes) {
        for (const at of plugin.activityTypes) {
          types.push({ pluginId: plugin.id, ...at });
        }
      }
    }

    return types;
  }

  /**
   * Validate plugin data
   */
  async validatePluginData(
    pluginId: string,
    data: unknown,
    context?: unknown
  ): Promise<{ valid: boolean; errors?: string[] }> {
    const plugin = this.get(pluginId);
    if (!plugin) {
      return { valid: false, errors: [`Plugin "${pluginId}" not found`] };
    }

    try {
      plugin.dataSchema.parse(data);
    } catch (error) {
      if (error instanceof Error) {
        return { valid: false, errors: [error.message] };
      }
      return { valid: false, errors: ['Invalid plugin data'] };
    }

    if (plugin.hooks?.validateData && context) {
      return plugin.hooks.validateData(data, context as any);
    }

    return { valid: true };
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();

// Helper to get typed plugin
export function getPlugin<TData>(id: string): Plugin<TData> | undefined {
  return pluginRegistry.get(id) as Plugin<TData> | undefined;
}
```

**Acceptance Criteria:**
- [ ] Plugins can be registered
- [ ] Plugins retrievable by ID
- [ ] Context type filtering works
- [ ] Data validation works

---

### Task 3.3: Implement Event Plugin

**Files:**
- `src/lib/plugins/event/index.ts` (create)
- `src/lib/plugins/event/schema.ts` (create)
- `src/lib/plugins/event/hooks.ts` (create)

**schema.ts:**
```typescript
import { z } from 'zod';

export const eventDataSchema = z.object({
  // Timing
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().default('Asia/Seoul'),
  isAllDay: z.boolean().default(false),

  // Location
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

  // Capacity
  capacity: z.number().min(1).optional(),
  registrationDeadline: z.string().datetime().optional(),

  // Payment
  cost: z.number().min(0).default(0),
  currency: z.string().default('KRW'),
  paymentRequired: z.boolean().default(false),

  // RSVP
  rsvpOptions: z.array(z.enum(['attending', 'maybe', 'not_attending'])).default(['attending', 'not_attending']),
  requiresApproval: z.boolean().default(false),
  screeningQuestions: z.array(z.string()).optional(),

  // Features
  hasWaitlist: z.boolean().default(true),
  allowGuestPlus: z.boolean().default(false),
  maxGuestsPerRsvp: z.number().min(0).default(0),

  // Display
  tags: z.array(z.string()).default([]),
  rules: z.string().optional(),
});

export type EventPluginData = z.infer<typeof eventDataSchema>;

export const defaultEventData: EventPluginData = {
  startAt: new Date().toISOString(),
  endAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
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
};
```

**index.ts:**
```typescript
import { eventDataSchema, defaultEventData, type EventPluginData } from './schema';
import { eventHooks } from './hooks';
import type { Plugin } from '../types';
import { db } from '@/lib/db';

export const eventPlugin: Plugin<EventPluginData> = {
  id: 'event',
  name: 'Event',
  description: 'Time-bounded gatherings with RSVP, capacity, and location management',
  version: '1.0.0',

  contextTypes: ['EVENT'],
  dataSchema: eventDataSchema,
  defaultData: defaultEventData,

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
        const pluginData = membership?.pluginData as Record<string, unknown>;
        const eventData = pluginData?.event as { rsvpStatus?: string } | undefined;
        return eventData?.rsvpStatus === 'attending';
      },
    },
  ],

  hooks: eventHooks,

  permissions: [
    {
      id: 'manage_rsvps',
      name: 'Manage RSVPs',
      description: 'Approve/reject RSVPs',
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
      description: 'Mark attendees as arrived',
      defaultRoles: ['OWNER', 'ADMIN', 'MODERATOR'],
    },
  ],

  membershipFields: [
    {
      field: 'rsvpStatus',
      label: 'RSVP Status',
      type: 'enum',
      enumValues: ['pending', 'attending', 'maybe', 'not_attending', 'waitlist'],
      defaultValue: 'pending',
    },
    { field: 'rsvpAt', label: 'RSVP Time', type: 'date' },
    {
      field: 'paymentStatus',
      label: 'Payment',
      type: 'enum',
      enumValues: ['pending', 'paid', 'refunded', 'not_required'],
      defaultValue: 'not_required',
    },
    { field: 'checkedInAt', label: 'Check-in Time', type: 'date' },
    { field: 'guestCount', label: 'Guest Count', type: 'number', defaultValue: 0 },
  ],
};

export type { EventPluginData };
```

**Acceptance Criteria:**
- [ ] Event plugin registered
- [ ] Zod schema validates event data
- [ ] Address patterns work (hosts, attendees)
- [ ] Permissions defined

---

### Task 3.4: Implement Group Plugin

**Files:**
- `src/lib/plugins/group/index.ts` (create)
- `src/lib/plugins/group/schema.ts` (create)

Similar structure to event plugin but with group-specific fields like:
- Group type (community, interest, regional, species)
- Moderation settings
- Posting rules
- Slow mode

**Acceptance Criteria:**
- [ ] Group plugin registered
- [ ] Schema validates group data
- [ ] Moderation settings work

---

### Task 3.5: Create Plugin Registration and Initialization

**Files:**
- `src/lib/plugins/index.ts` (create)

**Implementation:**
```typescript
// src/lib/plugins/index.ts

import { pluginRegistry } from './registry';
import { eventPlugin } from './event';
import { groupPlugin } from './group';
// import { conventionPlugin } from './convention';

/**
 * Initialize and register all plugins
 * Called once at application startup
 */
export function initializePlugins(): void {
  // Register built-in plugins
  pluginRegistry.register(eventPlugin);
  pluginRegistry.register(groupPlugin);
  // pluginRegistry.register(conventionPlugin);

  console.log(`Initialized ${pluginRegistry.ids().length} plugins:`, pluginRegistry.ids());
}

export { pluginRegistry, getPlugin } from './registry';
export type { Plugin, PluginComponents, PluginHooks } from './types';
```

**Acceptance Criteria:**
- [ ] All plugins registered at startup
- [ ] Registry accessible throughout app
- [ ] Plugin count logged

---

## Phase 4: Timeline API

**Goal:** Implement the tRPC API for activity streams, timeline queries, and real-time updates.

### Task 4.1: Implement Activity Router

**Files:**
- `src/server/api/routers/activity.ts` (update)

**Key Procedures:**
```typescript
export const activityRouter = createTRPCRouter({
  // Create activity (post)
  create: protectedProcedure
    .input(createActivitySchema)
    .mutation(async ({ ctx, input }) => {
      // Create activity with proper addressing
      // Trigger delivery
      // Return created activity with author
    }),

  // Get single activity
  getById: publicProcedure
    .input(z.object({ activityId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Get activity
      // Check visibility
      // Return with author and engagement counts
    }),

  // Get thread (activity + replies)
  getThread: publicProcedure
    .input(z.object({ activityId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Get root activity
      // Get all replies in tree structure
      // Check visibility for each
    }),

  // Delete activity (soft delete)
  delete: protectedProcedure
    .input(z.object({ activityId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership or moderation permission
      // Soft delete
    }),

  // Like activity
  like: protectedProcedure
    .input(z.object({ activityId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Create LIKE activity
      // Increment counter
      // Deliver to author
    }),

  // Unlike activity
  unlike: protectedProcedure
    .input(z.object({ activityId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Create UNDO activity for the LIKE
      // Decrement counter
    }),

  // Repost (announce)
  repost: protectedProcedure
    .input(z.object({ activityId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Create ANNOUNCE activity
      // Increment counter
      // Deliver to followers
    }),

  // Public timeline
  publicTimeline: publicProcedure
    .input(timelineQuerySchema)
    .query(async ({ ctx, input }) => {
      // Get public activities
      // Apply cursor pagination
      // Include author data
    }),

  // Home timeline (following + own)
  homeTimeline: protectedProcedure
    .input(timelineQuerySchema)
    .query(async ({ ctx, input }) => {
      // Get activities from followed users
      // Get own activities
      // Merge and sort
      // Apply cursor pagination
    }),

  // Context timeline
  contextTimeline: publicProcedure
    .input(contextTimelineSchema)
    .query(async ({ ctx, input }) => {
      // Get activities addressed to context
      // Check visibility
      // Apply cursor pagination
    }),

  // User timeline
  userTimeline: publicProcedure
    .input(userTimelineSchema)
    .query(async ({ ctx, input }) => {
      // Get activities by user
      // Filter to visible ones
      // Apply cursor pagination
    }),
});
```

**Acceptance Criteria:**
- [ ] All timeline queries work
- [ ] Visibility respected
- [ ] Pagination works
- [ ] Like/unlike/repost work

---

### Task 4.2: Implement Context Router

**Files:**
- `src/server/api/routers/context.ts` (create)

**Key Procedures:**
- `create`: Create new context with plugin
- `update`: Update context settings
- `updatePluginData`: Update plugin-specific data
- `delete`: Archive context
- `getById`: Get context with membership
- `getBySlug`: Get context by slug
- `list`: List contexts with filters
- `join`: Join context
- `leave`: Leave context
- `members`: List context members
- `updateMemberRole`: Change member role

**Acceptance Criteria:**
- [ ] Context CRUD works
- [ ] Membership operations work
- [ ] Permission checks enforced

---

### Task 4.3: Implement Plugin Routes

**Files:**
- `src/server/api/routers/plugins/event.ts` (create)

**Event-specific procedures:**
```typescript
export const eventPluginRouter = createTRPCRouter({
  // RSVP to event
  rsvp: protectedProcedure
    .input(rsvpSchema)
    .mutation(async ({ ctx, input }) => {
      // Check capacity
      // Check waitlist
      // Update membership pluginData
      // Create RSVP activity
    }),

  // Check in attendee
  checkIn: protectedProcedure
    .input(checkInSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify permission
      // Update membership pluginData
      // Create CHECKIN activity
    }),

  // Get attendee list
  getAttendees: publicProcedure
    .input(z.object({ contextId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Get members with attending status
      // Include RSVP time, guest count
    }),

  // Get waitlist
  getWaitlist: protectedProcedure
    .input(z.object({ contextId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Get members on waitlist
      // Order by RSVP time
    }),

  // Approve RSVP (for approval-required events)
  approveRsvp: protectedProcedure
    .input(approveRsvpSchema)
    .mutation(async ({ ctx, input }) => {
      // Check permission
      // Update status
      // Notify user
    }),

  // Get event stats
  getStats: publicProcedure
    .input(z.object({ contextId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Count by RSVP status
      // Return capacity info
    }),
});
```

**Acceptance Criteria:**
- [ ] RSVP flow works
- [ ] Capacity/waitlist management works
- [ ] Check-in works
- [ ] Stats accurate

---

### Task 4.4: Implement Real-time SSE Updates

**Files:**
- `src/app/api/timeline/stream/route.ts` (update)

**Updates:**
- Support context-specific streams
- Support home timeline stream
- Proper event types for different activities

**Acceptance Criteria:**
- [ ] SSE connection works
- [ ] New activities streamed
- [ ] Context-specific filtering works

---

### Task 4.5: Update Root Router

**Files:**
- `src/server/api/root.ts` (update)

```typescript
import { contextRouter } from './routers/context';
import { activityRouter } from './routers/activity';
import { eventPluginRouter } from './routers/plugins/event';
import { groupPluginRouter } from './routers/plugins/group';

export const appRouter = createTRPCRouter({
  user: userRouter,
  follow: followRouter,
  activity: activityRouter,
  context: contextRouter,
  dm: dmRouter,
  inbox: inboxRouter,
  upload: uploadRouter,

  // Plugin routes
  eventPlugin: eventPluginRouter,
  groupPlugin: groupPluginRouter,
});
```

**Acceptance Criteria:**
- [ ] All routers merged
- [ ] Type inference works
- [ ] No naming conflicts

---

### Task 4.6: Create API Integration Tests

**Files:**
- `src/server/api/routers/__tests__/activity.test.ts`
- `src/server/api/routers/__tests__/context.test.ts`

**Test Coverage:**
- Activity CRUD
- Timeline queries with different visibility settings
- Context operations with permissions
- Plugin-specific operations

**Acceptance Criteria:**
- [ ] >80% coverage for routers
- [ ] Integration with services tested
- [ ] Edge cases covered

---

## Phase 5: UI Components ✅

**Goal:** Implement the timeline-centric UI with context pages and activity components.

> **Implementation Note (2026-01-04):**
> All 8 UI component tasks completed:
> - **TimelineV2.tsx**: IntersectionObserver-based infinite scroll, supports all timeline types
> - **ActivityComposer.tsx**: Content creation with visibility selector, context addressing
> - **Context Pages**: `/c/[slug]` with ContextHeader, tabs, server/client component split
> - **ContextCard.tsx**: Standard and compact variants for context discovery
> - **HomePageClient.tsx**: Tab-based public/home feed, discovery sidebar
> - **DiscoverySidebar.tsx, UserCard.tsx**: Discovery components for sidebar
> - **MobileNav.tsx**: Fixed bottom navigation for mobile devices
> - **UI Tests**: 20 tests passing (8 TimelineV2 + 12 ContextCard tests)
>
> All components use tRPC for data fetching with React Query integration.

### Task 5.1: Implement Timeline Component (v2) ✅

**Files:**
- `src/components/timeline/TimelineV2.tsx` (create)
- `src/components/timeline/TimelinePost.tsx` (update)
- `src/components/timeline/TimelineEmpty.tsx` (create)

**TimelineV2.tsx:**
```tsx
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { TimelinePost } from './TimelinePost';
import { TimelineEmpty } from './TimelineEmpty';
import { Spinner } from '@/components/ui/spinner';

interface TimelineV2Props {
  type: 'public' | 'home' | 'context' | 'user';
  contextId?: string;
  userId?: string;
}

export function TimelineV2({ type, contextId, userId }: TimelineV2Props) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Select the right query based on type
  const query = (() => {
    switch (type) {
      case 'public':
        return trpc.activity.publicTimeline.useInfiniteQuery(
          {},
          { getNextPageParam: (lastPage) => lastPage.nextCursor }
        );
      case 'home':
        return trpc.activity.homeTimeline.useInfiniteQuery(
          {},
          { getNextPageParam: (lastPage) => lastPage.nextCursor }
        );
      case 'context':
        return trpc.activity.contextTimeline.useInfiniteQuery(
          { contextId: contextId! },
          { getNextPageParam: (lastPage) => lastPage.nextCursor, enabled: !!contextId }
        );
      case 'user':
        return trpc.activity.userTimeline.useInfiniteQuery(
          { userId: userId! },
          { getNextPageParam: (lastPage) => lastPage.nextCursor, enabled: !!userId }
        );
    }
  })();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = query;

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const activities = data?.pages.flatMap(page => page.items) ?? [];

  if (activities.length === 0) {
    return <TimelineEmpty type={type} />;
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <TimelinePost key={activity.id} activity={activity} />
      ))}

      <div ref={loadMoreRef} className="py-4 flex justify-center">
        {isFetchingNextPage && <Spinner />}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Infinite scroll works
- [ ] Different timeline types supported
- [ ] Loading states shown
- [ ] Empty states handled

---

### Task 5.2: Implement Activity Composer ✅

**Files:**
- `src/components/activity/ActivityComposer.tsx` (create)
- `src/components/activity/VisibilitySelector.tsx` (create)

**ActivityComposer.tsx:**
```tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VisibilitySelector } from './VisibilitySelector';
import type { Address } from '@/lib/addressing/types';

interface ActivityComposerProps {
  contextId?: string;
  inReplyTo?: string;
  onSuccess?: () => void;
}

export function ActivityComposer({ contextId, inReplyTo, onSuccess }: ActivityComposerProps) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'context'>('public');
  const [sensitive, setSensitive] = useState(false);
  const [contentWarning, setContentWarning] = useState('');

  const createMutation = trpc.activity.create.useMutation({
    onSuccess: () => {
      setContent('');
      setSensitive(false);
      setContentWarning('');
      onSuccess?.();
    },
  });

  const handleSubmit = () => {
    const to: Address[] = [];

    switch (visibility) {
      case 'public':
        to.push('public');
        break;
      case 'followers':
        to.push('followers');
        break;
      case 'context':
        if (contextId) to.push(`context:${contextId}`);
        break;
    }

    createMutation.mutate({
      type: 'CREATE',
      objectType: 'NOTE',
      object: {
        content,
        ...(sensitive && { summary: contentWarning }),
      },
      to,
      cc: [],
      contextId,
      inReplyTo,
      sensitive,
    });
  };

  return (
    <div className="glass-subtle rounded-xl p-4 space-y-4">
      {sensitive && (
        <input
          type="text"
          placeholder="내용 경고 (선택)"
          value={contentWarning}
          onChange={(e) => setContentWarning(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-warm-200 dark:border-forest-700 bg-white/50 dark:bg-forest-900/50"
        />
      )}

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="무슨 생각을 하고 계세요?"
        className="min-h-[100px] resize-none"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <VisibilitySelector
            value={visibility}
            onChange={setVisibility}
            showContext={!!contextId}
          />

          <button
            onClick={() => setSensitive(!sensitive)}
            className={`p-2 rounded-lg transition-colors ${
              sensitive ? 'bg-amber-100 text-amber-700' : 'text-warm-500 hover:bg-warm-100'
            }`}
            title="내용 경고 추가"
          >
            <span className="text-sm">CW</span>
          </button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || createMutation.isPending}
        >
          {createMutation.isPending ? '게시 중...' : '게시'}
        </Button>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Text input works
- [ ] Visibility selection works
- [ ] Content warnings work
- [ ] Context posting works

---

### Task 5.3: Implement Context Page Layout ✅

**Files:**
- `src/app/(main)/c/[slug]/page.tsx` (create)
- `src/app/(main)/c/[slug]/layout.tsx` (create)
- `src/components/context/ContextHeader.tsx` (create)
- `src/components/context/ContextSidebar.tsx` (create)

**layout.tsx:**
```tsx
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { contextService } from '@/server/services/context.service';
import { auth } from '@/lib/auth';
import { ContextHeader } from '@/components/context/ContextHeader';
import { ContextSidebar } from '@/components/context/ContextSidebar';
import { pluginRegistry } from '@/lib/plugins';

interface ContextLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function ContextLayout({ children, params }: ContextLayoutProps) {
  const { slug } = await params;
  const session = await auth();

  const context = await contextService.getBySlug(slug, session?.user?.id);

  if (!context) {
    notFound();
  }

  // Get plugin components
  const pluginComponents = context.features.map(pluginId => {
    const plugin = pluginRegistry.get(pluginId);
    return { pluginId, components: plugin?.components };
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <ContextHeader
        context={context}
        membership={context.userMembership}
        pluginComponents={pluginComponents}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          {children}
        </div>

        <aside className="space-y-4">
          <ContextSidebar
            context={context}
            membership={context.userMembership}
            pluginComponents={pluginComponents}
          />
        </aside>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Context pages render
- [ ] Plugin components injected
- [ ] Sidebar shows context info
- [ ] Membership status visible

---

### Task 5.4: Implement Context Cards ✅

**Files:**
- `src/components/context/ContextCard.tsx` (create)
- `src/components/context/ContextList.tsx` (create)

**ContextCard.tsx:**
```tsx
import Link from 'next/link';
import Image from 'next/image';
import { pluginRegistry } from '@/lib/plugins';
import type { ContextWithMembership } from '@/server/services/context.service';

interface ContextCardProps {
  context: ContextWithMembership;
}

export function ContextCard({ context }: ContextCardProps) {
  // Get plugin-specific card component
  const plugin = pluginRegistry.get(context.features[0]);
  const PluginCard = plugin?.components?.ContextCard;

  if (PluginCard) {
    return (
      <PluginCard
        context={context}
        membership={context.userMembership}
        pluginData={context.plugins[plugin.id]}
      />
    );
  }

  // Default card
  return (
    <Link
      href={`/c/${context.slug}`}
      className="block glass-subtle rounded-xl p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        {context.avatarUrl ? (
          <Image
            src={context.avatarUrl}
            alt={context.name}
            width={48}
            height={48}
            className="rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-forest-100 dark:bg-forest-800 flex items-center justify-center">
            <span className="text-xl font-bold text-forest-600 dark:text-forest-400">
              {context.name.charAt(0)}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-forest-800 dark:text-cream-50 truncate">
            {context.name}
          </h3>

          <p className="text-sm text-warm-500 dark:text-warm-400 line-clamp-2 mt-1">
            {context.description}
          </p>

          <div className="flex items-center gap-4 mt-2 text-xs text-warm-400">
            <span>{context._count.memberships}명</span>
            <span className="capitalize">{context.type.toLowerCase()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

**Acceptance Criteria:**
- [ ] Cards display context info
- [ ] Plugin-specific cards work
- [ ] Link to context page works

---

### Task 5.5: Implement New Home Page ✅

**Files:**
- `src/app/(main)/page.tsx` (update)

**New Design:**
```tsx
import { auth } from '@/lib/auth';
import { TimelineV2 } from '@/components/timeline/TimelineV2';
import { ActivityComposer } from '@/components/activity/ActivityComposer';
import { DiscoverySidebar } from '@/components/discovery/DiscoverySidebar';

export default async function HomePage() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {isAuthenticated && (
            <ActivityComposer />
          )}

          <TimelineV2 type={isAuthenticated ? 'home' : 'public'} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <DiscoverySidebar isAuthenticated={isAuthenticated} />
        </aside>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Home page shows timeline
- [ ] Composer visible when logged in
- [ ] Discovery sidebar works

---

### Task 5.6: Implement Discovery Components ✅

**Files:**
- `src/components/discovery/DiscoverySidebar.tsx` (create)
- `src/components/discovery/TrendingContexts.tsx` (create)
- `src/components/discovery/SuggestedUsers.tsx` (create)

**Acceptance Criteria:**
- [ ] Trending contexts shown
- [ ] Suggested users work
- [ ] Upcoming events displayed

---

### Task 5.7: Implement Mobile Navigation ✅

**Files:**
- `src/components/layout/MobileNav.tsx` (create)
- `src/app/(main)/layout.tsx` (update)

**MobileNav.tsx:**
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, SearchIcon, CalendarIcon, UserIcon } from './icons';

export function MobileNav({ userId }: { userId?: string }) {
  const pathname = usePathname();

  const links = [
    { href: '/', icon: HomeIcon, label: '홈' },
    { href: '/explore', icon: SearchIcon, label: '탐색' },
    { href: '/events', icon: CalendarIcon, label: '이벤트' },
    { href: userId ? `/profile/${userId}` : '/login', icon: UserIcon, label: '프로필' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-warm-200/40 dark:border-forest-800/40 md:hidden">
      <div className="flex items-center justify-around h-16">
        {links.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-4 py-2 ${
              pathname === href
                ? 'text-forest-600 dark:text-forest-400'
                : 'text-warm-500 dark:text-warm-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

**Acceptance Criteria:**
- [ ] Mobile nav shows on small screens
- [ ] Active state correct
- [ ] Navigation works

---

### Task 5.8: Create UI Component Tests ✅

**Files:**
- `src/components/timeline/__tests__/TimelineV2.test.tsx`
- `src/components/context/__tests__/ContextCard.test.tsx`

**Acceptance Criteria:**
- [ ] Components render correctly
- [ ] User interactions work
- [ ] Loading/error states tested

---

## Phase 6: Plugin Implementations

**Goal:** Complete the plugin implementations with UI components and business logic.

### Task 6.1: Event Plugin UI Components

**Files:**
- `src/lib/plugins/event/components/EventHeader.tsx`
- `src/lib/plugins/event/components/EventSidebar.tsx`
- `src/lib/plugins/event/components/EventCard.tsx`
- `src/lib/plugins/event/components/RSVPButton.tsx`
- `src/lib/plugins/event/components/AttendeeList.tsx`

**EventHeader.tsx:**
```tsx
'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { PluginContextProps } from '../../types';
import type { EventPluginData } from '../schema';

export function EventHeader({ context, membership, pluginData }: PluginContextProps) {
  const eventData = pluginData as EventPluginData;

  return (
    <div className="space-y-4">
      {/* Date & Time */}
      <div className="flex items-center gap-2 text-forest-600 dark:text-forest-400">
        <CalendarIcon className="w-5 h-5" />
        <span>
          {format(new Date(eventData.startAt), 'PPP (EEEE)', { locale: ko })}
        </span>
        <span>•</span>
        <span>
          {format(new Date(eventData.startAt), 'p', { locale: ko })} -
          {format(new Date(eventData.endAt), 'p', { locale: ko })}
        </span>
      </div>

      {/* Location */}
      {eventData.location && (
        <div className="flex items-start gap-2">
          <MapPinIcon className="w-5 h-5 text-warm-500 mt-0.5" />
          <div>
            <p className="font-medium">{eventData.location.name}</p>
            {eventData.location.address && eventData.location.isPublic && (
              <p className="text-sm text-warm-500">{eventData.location.address}</p>
            )}
            {eventData.location.mapUrl && (
              <a
                href={eventData.location.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-forest-600 hover:underline"
              >
                지도에서 보기
              </a>
            )}
          </div>
        </div>
      )}

      {/* Cost */}
      {eventData.cost > 0 && (
        <div className="flex items-center gap-2">
          <CurrencyIcon className="w-5 h-5 text-warm-500" />
          <span>{eventData.cost.toLocaleString()}원</span>
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Event header shows date/time/location
- [ ] RSVP button works
- [ ] Attendee list displays
- [ ] Event card shows in listings

---

### Task 6.2: Event Plugin Business Logic

**Files:**
- `src/lib/plugins/event/hooks.ts` (update)
- `src/server/api/routers/plugins/event.ts` (complete)

**Implement:**
- Capacity management with waitlist
- RSVP approval flow
- Payment integration hooks (Toss)
- Check-in functionality
- Event reminders

**Acceptance Criteria:**
- [ ] RSVP respects capacity
- [ ] Waitlist auto-promotes
- [ ] Approval flow works
- [ ] Check-in creates activity

---

### Task 6.3: Group Plugin Implementation

**Files:**
- `src/lib/plugins/group/index.ts` (complete)
- `src/lib/plugins/group/components/*.tsx`
- `src/server/api/routers/plugins/group.ts`

**Features:**
- Post moderation queue
- Auto-moderation rules
- Slow mode
- Group settings UI

**Acceptance Criteria:**
- [ ] Groups create correctly
- [ ] Moderation queue works
- [ ] Auto-mod filters content
- [ ] Slow mode enforced

---

### Task 6.4: Convention Plugin Implementation

**Files:**
- `src/lib/plugins/convention/index.ts` (create)
- `src/lib/plugins/convention/schema.ts` (create)
- `src/lib/plugins/convention/components/*.tsx`

**Features (extends Event):**
- Multi-day schedule
- Floor/room maps
- Dealers room listing
- Room party listings
- "Who's here?" discovery

**Acceptance Criteria:**
- [ ] Schedule management works
- [ ] Maps display correctly
- [ ] Discovery features work

---

### Task 6.5: Plugin Component Integration Tests

**Files:**
- `src/lib/plugins/event/__tests__/*.test.tsx`
- `src/lib/plugins/group/__tests__/*.test.tsx`

**Acceptance Criteria:**
- [ ] Plugin components render
- [ ] Plugin hooks called correctly
- [ ] Plugin permissions work

---

## Phase 7: Migration & Launch

**Goal:** Migrate existing data, complete testing, and prepare for deployment.

### Task 7.1: Create Data Migration Script

**Files:**
- `scripts/migrate-v1-to-v2.ts` (create)

**Migration Steps:**
1. Create Context for each Event
2. Create Membership for each RSVP
3. Migrate TimelinePost to Activity
4. Update User fields

```typescript
// scripts/migrate-v1-to-v2.ts

import { db } from '@/lib/db';
import { eventPlugin } from '@/lib/plugins/event';

async function migrateEvents() {
  console.log('Migrating events to contexts...');

  const events = await db.event.findMany({
    include: { host: true, rsvps: true },
  });

  for (const event of events) {
    // Skip if already migrated (has slug collision)
    const existing = await db.context.findFirst({
      where: { slug: event.slug },
    });
    if (existing) {
      console.log(`Skipping event ${event.id} - already migrated`);
      continue;
    }

    // Create context
    const context = await db.context.create({
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
            rsvpOptions: ['attending', 'not_attending'],
            requiresApproval: event.requiresApproval || false,
            hasWaitlist: true,
            allowGuestPlus: false,
            maxGuestsPerRsvp: 0,
            tags: event.tags,
            rules: event.rules || event.eventRules,
          },
        },
        createdAt: event.createdAt,
      },
    });

    // Create owner membership
    await db.membership.create({
      data: {
        contextId: context.id,
        userId: event.hostId,
        role: 'OWNER',
        status: 'APPROVED',
        approvedAt: event.createdAt,
      },
    });

    // Migrate RSVPs to memberships
    for (const rsvp of event.rsvps) {
      if (rsvp.userId === event.hostId) continue; // Skip host

      await db.membership.create({
        data: {
          contextId: context.id,
          userId: rsvp.userId,
          role: 'MEMBER',
          status: 'APPROVED',
          approvedAt: rsvp.createdAt,
          pluginData: {
            event: {
              rsvpStatus: rsvp.status.toLowerCase(),
              rsvpAt: rsvp.createdAt.toISOString(),
              paymentStatus: rsvp.paymentStatus.toLowerCase(),
            },
          },
        },
      });
    }

    console.log(`Migrated event: ${event.title} -> context: ${context.id}`);
  }
}

async function migrateTimelinePosts() {
  console.log('Migrating timeline posts to activities...');

  // Implementation for migrating TimelinePost to Activity
  // ...
}

async function main() {
  try {
    await migrateEvents();
    await migrateTimelinePosts();
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
```

**Acceptance Criteria:**
- [ ] Events migrate to Contexts
- [ ] RSVPs migrate to Memberships
- [ ] Posts migrate to Activities
- [ ] Migration is idempotent

---

### Task 7.2: Create Rollback Script

**Files:**
- `scripts/rollback-v2.ts` (create)

**Acceptance Criteria:**
- [ ] Can rollback to v1 state
- [ ] No data loss on rollback

---

### Task 7.3: End-to-End Testing

**Files:**
- `e2e/timeline.spec.ts` (create)
- `e2e/context.spec.ts` (create)
- `e2e/event.spec.ts` (create)

**Test Scenarios:**
1. User registration and login
2. Create and view timeline posts
3. Create event and RSVP
4. Join group and post
5. Notification flow

**Acceptance Criteria:**
- [ ] All E2E tests pass
- [ ] Mobile and desktop tested
- [ ] Korean locale tested

---

### Task 7.4: Performance Testing

**Files:**
- `scripts/load-test.ts` (create)

**Test Scenarios:**
- Timeline with 1000+ posts
- Context with 500+ members
- Concurrent SSE connections

**Acceptance Criteria:**
- [ ] Timeline loads <2s
- [ ] Infinite scroll smooth
- [ ] SSE handles 100+ connections

---

### Task 7.5: Update Documentation

**Files:**
- `DESIGN.md` (update)
- `README.md` (update)
- `API.md` (create)

**Acceptance Criteria:**
- [ ] Architecture documented
- [ ] API endpoints documented
- [ ] Plugin development guide

---

### Task 7.6: Deployment Preparation

**Files:**
- `.github/workflows/deploy-v2.yml` (create)
- `docker-compose.prod.yml` (update)

**Steps:**
1. Create v2 deployment workflow
2. Set up staging environment
3. Configure database migration
4. Blue-green deployment plan

**Acceptance Criteria:**
- [ ] CI/CD pipeline works
- [ ] Staging deployment successful
- [ ] Production deployment plan documented

---

## Appendix A: File Change Summary

### New Files (Total: ~50)

**Core System:**
- `src/lib/plugins/types.ts`
- `src/lib/plugins/registry.ts`
- `src/lib/plugins/index.ts`
- `src/lib/addressing/types.ts`
- `src/lib/addressing/parser.ts`
- `src/lib/addressing/visibility.ts`
- `src/lib/addressing/delivery.ts`
- `src/lib/permissions/types.ts`
- `src/lib/permissions/index.ts`
- `src/server/services/context.service.ts`
- `src/server/services/membership.service.ts`

**Plugins:**
- `src/lib/plugins/event/*`
- `src/lib/plugins/group/*`
- `src/lib/plugins/convention/*`

**API:**
- `src/server/api/routers/context.ts`
- `src/server/api/routers/plugins/event.ts`
- `src/server/api/routers/plugins/group.ts`

**Components:**
- `src/components/timeline/TimelineV2.tsx`
- `src/components/activity/ActivityComposer.tsx`
- `src/components/activity/VisibilitySelector.tsx`
- `src/components/context/ContextHeader.tsx`
- `src/components/context/ContextSidebar.tsx`
- `src/components/context/ContextCard.tsx`
- `src/components/context/MembershipButton.tsx`
- `src/components/discovery/DiscoverySidebar.tsx`
- `src/components/layout/MobileNav.tsx`

**Pages:**
- `src/app/(main)/c/[slug]/page.tsx`
- `src/app/(main)/c/[slug]/layout.tsx`
- `src/app/(main)/explore/page.tsx`

### Modified Files

- `prisma/schema.prisma` (new models and enums)
- `src/server/api/root.ts` (add new routers)
- `src/server/services/activity.service.ts` (integrate addressing)
- `src/app/(main)/page.tsx` (new timeline-first design)
- `src/app/(main)/layout.tsx` (add mobile nav)
- `package.json` (new dependencies)

---

## Appendix B: Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Migration data loss | Low | High | Backup before migration, test on staging |
| Performance regression | Medium | Medium | Performance testing before launch |
| Plugin conflicts | Low | Medium | Plugin isolation, thorough testing |
| Breaking existing API | Medium | High | API versioning, deprecation warnings |
| User confusion | Medium | Medium | Onboarding flow, documentation |

---

## Appendix C: Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Timeline load time | <2s | Lighthouse/WebPageTest |
| First contentful paint | <1.5s | Lighthouse |
| API response time (p95) | <200ms | Application monitoring |
| Test coverage | >80% | Vitest coverage |
| User satisfaction | >4/5 | Post-launch survey |

---

**End of Implementation Plan**

*This document should be updated as implementation progresses. Mark tasks complete with [x] as they are finished.*
