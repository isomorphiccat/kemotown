# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kemotown is a Korean furry community platform built with Next.js 15. It follows a **timeline-centric architecture** (v2) where all interactions flow through activity feeds. The core design is inspired by ActivityPub vocabulary for potential future Fediverse integration.

## Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production (runs prisma generate first)
npm run lint             # ESLint
npm run typecheck        # TypeScript check (npx tsc --noEmit)

# Testing
npm test                 # Run Vitest
npm test -- --run        # Run tests once (no watch)
npm test -- --run src/lib/permissions/permissions.test.ts  # Run single test file

# Database
npm run db:push          # Push schema to database
npm run db:migrate       # Create migration
npm run db:studio        # Open Prisma Studio
```

## Pre-Commit Checklist

Always run before committing:
```bash
npm run lint && npx tsc --noEmit
```

Update `DESIGN.md` if architectural changes were made.

## Architecture

### Core Concepts (v2)

The system is built around four pillars:

1. **Activity** - Atomic unit of content (posts, likes, RSVPs, follows). Uses ActivityPub-style vocabulary.
2. **Context** - Container for activities (USER, GROUP, EVENT, CONVENTION). Has members, roles, and plugins.
3. **Actor** - Who performs activities (USER, BOT, SYSTEM).
4. **Plugin** - Feature modules that extend contexts (event plugin, group plugin).

### Key Directories

- `src/app/(main)/` - Authenticated routes using main layout with navigation
- `src/app/(auth)/` - Auth routes (login) with minimal layout
- `src/server/api/routers/` - tRPC routers for API endpoints
- `src/server/services/` - Business logic layer
- `src/lib/plugins/` - Plugin system (event, group, convention plugins)
- `src/lib/permissions/` - Role-based permission system
- `src/lib/addressing/` - ActivityPub-style addressing and visibility
- `src/schemas/` - Zod validation schemas
- `src/components/` - React components organized by feature

### Data Flow

```
Client → tRPC Router → Service Layer → Prisma → PostgreSQL
                ↓
         Zod Validation
```

### Plugin System

Plugins extend the Context model with type-specific features:
- Located in `src/lib/plugins/{plugin-name}/`
- Each plugin has: `index.ts` (definition), `schema.ts` (Zod), `hooks.ts` (React Query), `components/`
- Plugins register permissions in `defaultRoles` arrays
- Plugin data stored in Context's `pluginData` JSON field

### Permission System

Role hierarchy: `OWNER > ADMIN > MODERATOR > MEMBER > GUEST`

Core permissions use dot notation: `context.view`, `activity.create`, `member.ban`
Plugin permissions: `plugin.{pluginId}.{permissionId}`

## Common Issues

### TypeScript Strict Mode

Never use `any`. For error handling:
```typescript
catch (error) {
  if (error instanceof Error && 'code' in error) {
    // Handle Prisma errors
  }
}
```

### Next.js 15 Route Params

Route params are Promises in Next.js 15 App Router:
```typescript
// Correct
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### Route Groups

Route groups `(main)` and `(auth)` don't create URL segments. Don't create competing `page.tsx` files at both `app/page.tsx` and `app/(main)/page.tsx` - this causes build conflicts.

## Key Files

- `DESIGN.md` - v1 architecture (current implementation details)
- `ARCHITECTURE_V2.md` - v2 timeline-centric design philosophy
- `IMPLEMENTATION_PLAN_V2.md` - Detailed migration roadmap
- `prisma/schema.prisma` - Database schema
- `src/lib/auth.ts` - Auth.js v5 configuration (Google + Kakao OAuth)
