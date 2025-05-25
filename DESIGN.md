# Kemotown — Next.js/React Architectural Blueprint

Version 0.5 (updated with Custom Timeline Service and Bot System, May 24 2025)

⸻

## 1. Scope & Guiding Principles

This document translates the Kemotown concept into a high‑level software architecture focused on the full‑stack web application built with Next.js and React. It sets the stage for later, more granular engineering specs by describing:

| What | Why |
|------|-----|
| Next.js full‑stack application | Provides SSR/SSG, API routes, and excellent developer experience with React 18 features like Server Components and streaming. |
| Component‑based design system | Consistent, "cute‑but‑modern" visual language with strong accessibility & localization using React components and Tailwind CSS. |
| TypeScript‑first development | End‑to‑end type safety from database to UI components, reducing runtime errors and improving developer experience. |
| Progressive enhancement | Starts with SSR for SEO/performance, enhanced with client‑side interactivity where needed. |

⸻

## 2. High‑Level System Diagram

```
┌────────────────────────────────────────────────────────────┐
│                 Next.js Application                        │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│ │  Pages/App   │  │  Components  │  │  Design System   │  │
│ │  Router      │  │  (React)     │  │  (Tailwind CSS) │  │
│ │              │  │              │  │                  │  │
│ └──────▲───────┘  └──────▲───────┘  └──────────────────┘  │
│        │                 │                                │
│        │                 │                                │
│        ▼                 ▼                                │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│ │  API Routes  │  │  Server      │  │  Client State    │  │
│ │  (/api/*)    │  │  Components  │  │  (Zustand/SWR)   │  │
│ │              │  │              │  │                  │  │
│ └──────▲───────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────────▲───────────────────────────────┘
                             │
                             ▼
                  ┌────────────────────────┐
                  │    Backend Services    │
                  ├────────────┬───────────┤
                  │ PostgreSQL │  Redis    │
                  │            │  (Cache)  │
                  └────────────┴───────────┘
```

⸻

## 3. Project Structure

```
src/
├── app/                    # Next.js 15+ App Router
│   ├── (auth)/            # Route groups for authentication
│   │   └── login/         # Login page with OAuth buttons
│   ├── events/            # Event management system
│   │   ├── [id]/         # Event detail page with RSVP functionality
│   │   ├── create/       # Markdown-based event creation with preview
│   │   ├── edit/[id]/    # Event editing with host permissions
│   │   └── page.tsx      # Event listing with search & pagination
│   ├── profile/           # Profile management
│   │   ├── [id]/         # View user profiles
│   │   ├── create/       # Profile creation
│   │   └── edit/[id]/    # Profile editing
│   ├── users/             # User discovery and browsing
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth.js endpoints
│   │   ├── dashboard/    # Dashboard data endpoints
│   │   ├── events/       # Event CRUD and RSVP endpoints
│   │   └── users/        # User management APIs
│   ├── SessionProviderWrapper.tsx  # Session context provider
│   └── globals.css        # Global styles with Korean font support
├── components/            # React component library
│   ├── dashboard/         # Dashboard-specific components
│   │   └── Dashboard.tsx  # Main dashboard with timeline & events
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── forms/            # Form components with validation
│   ├── auth/             # Authentication-related components
│   ├── search/           # Search and discovery components
│   └── layout/           # Layout components
├── lib/                  # Utility functions and configurations
│   ├── db.ts            # Prisma database client
│   ├── auth.ts          # NextAuth.js configuration with OAuth
│   ├── utils.ts         # General utilities
│   └── validators/       # Zod validation schemas
├── types/               # TypeScript type definitions
└── styles/              # Additional CSS/styling
```

⸻

## 4. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 15.3+ | Full‑stack React framework with App Router |
| UI Library | React 19 | Component‑based UI with Server Components |
| Styling | Tailwind CSS 4 | Utility‑first CSS framework with Korean font support |
| Database | PostgreSQL | Primary data store (Railway for production) |
| ORM | Prisma 6.8+ | Type‑safe database client with auto-generation |
| Authentication | NextAuth.js 4.24+ | OAuth authentication (Google, Kakao) - See [Kakao OAuth Setup](KAKAO_OAUTH_SETUP.md) |
| State Management | React Hooks + SWR | Client state and server state management |
| UI Components | shadcn/ui | Accessible component library |
| Timeline Backend | Custom Service | Native timeline with real-time updates via SSE |
| Payments | Toss Payments API | Korean payment processing (planned) |
| Deployment | Vercel | Hosting with automatic GitHub deployments |
| Language | TypeScript 5+ | Strict type safety throughout the stack |
| CI/CD | GitHub Actions | Automated testing, linting, and security checks |

⸻

## 5. User Experience & Navigation Flow

### 5.1 Authentication Flow
| Flow | Implementation | Status |
|------|----------------|--------|
| OAuth Login | Google/Kakao OAuth → NextAuth.js → automatic username generation (email optional for Kakao) | ✅ Implemented |
| User Registration | OAuth signup → profile creation → dashboard redirect | ✅ Implemented |
| Session Management | JWT sessions with middleware protection | ✅ Implemented |

### 5.2 Dashboard Experience (Implemented)
| Component | Description | Features |
|-----------|-------------|----------|
| **Welcome Section** | Personalized greeting with user's furry name | Korean localization, emoji support |
| **My Events** | User's attending events (max 2 displayed) | RSVP status, quick event details |
| **Community Timeline** | Custom timeline with real-time updates via SSE | Text posts, bot notifications, reactions, mentions |
| **Quick Profile** | Sidebar profile overview | Avatar, username, profile link |
| **Upcoming Events** | Sidebar event list with live data | Date/time, participant count |
| **New Members** | Recently joined users with real data | Interest tags, profile links |

### 5.3 Event Management System (Implemented)
| Component | Description | Features |
|-----------|-------------|----------|
| **Event Discovery** | `/events` page with search and filtering | Search by title/description, upcoming filter, pagination |
| **Event Details** | `/events/[id]` with full event information | Host details, location, pricing, attendee list |
| **RSVP System** | Interactive attendance management | Attend/Consider/Not Attending with capacity limits |
| **Event Listing** | Card-based responsive event grid | Korean price formatting, attendee counts |
| **Host Controls** | Event management for creators | Edit/delete permissions, host identification |

### 5.4 Core User Flows (MVP)
| Flow | Implementation | Real‑time? | Status |
|------|----------------|------------|--------|
| User Login | OAuth → Dashboard redirect | No | ✅ Implemented |
| Profile Creation | Form validation → API POST → profile view | No | ✅ Implemented |
| User Discovery | Search/browse → profile view → interest matching | No | ✅ Implemented |
| Event Discovery | Search/filter → event listing → event details | No | ✅ Implemented |
| Event RSVP | RSVP buttons → POST /api/events/[id]/rsvp → status update | No | ✅ Implemented |
| Host creates event | Multi‑step form → POST /api/events → event view | No | 🔄 Planned |
| Dashboard Timeline | Activity feed with real API data | No | ✅ Implemented |

⸻

## 6. Data Models (Prisma Schema excerpt)

```typescript
// types/index.ts
export interface EventSummary {
  id: string;
  title: string;
  coverUrl: string;
  startDate: Date;
  endDate: Date;
  priceKrw: number | null;
  attendeeCap: number | null;
  hostHandle: string;
  location: {
    address: string;
    naverMapUrl: string;
  };
  attendees: {
    id: string;
    status: 'attending' | 'considering' | 'not_attending';
    paymentStatus: 'pending' | 'paid' | 'failed' | null;
  }[];
}
```

⸻

## 7. Component Architecture

| Layer | Responsibility | Examples |
|-------|----------------|----------|
| Pages | Route handling and data fetching | `/app/events/[id]/page.tsx` |
| Layouts | Shared UI structure | `app/layout.tsx`, `app/(auth)/layout.tsx` |
| Feature Components | Business logic components | `EventCard`, `RSVPButton`, `PaymentModal` |
| UI Components | Reusable design system | `Button`, `Input`, `Modal`, `Card` |
| Server Components | Data fetching and rendering | `EventList`, `UserProfile` |

⸻

## 8. API Design

### REST Endpoints (Implemented)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth.js OAuth endpoints | ✅ Implemented |
| `/api/users` | GET, POST | List users with search/pagination, create user | ✅ Implemented |
| `/api/users/[id]` | GET, PUT | User profile CRUD operations | ✅ Implemented |
| `/api/dashboard` | GET | Community timeline data | ✅ Implemented |
| `/api/dashboard/events` | GET | User's events and upcoming events | ✅ Implemented |
| `/api/dashboard/users` | GET | Recent community members | ✅ Implemented |
| `/api/events` | GET, POST | List and create events with search/pagination | ✅ Implemented |
| `/api/events/[id]` | GET, PUT, DELETE | Event CRUD operations with RSVP status | ✅ Implemented |
| `/api/events/[id]/rsvp` | POST, DELETE | RSVP management with capacity control | ✅ Implemented |
| `/api/timeline` | GET | Fetch timeline posts with pagination | ✅ Implemented |
| `/api/timeline/posts` | POST | Create new timeline posts | ✅ Implemented |
| `/api/timeline/stream` | GET | Server-sent events for real-time updates | ✅ Implemented |
| `/api/timeline/posts/[id]/reactions` | POST, DELETE | Add/remove reactions to posts | ✅ Implemented |
| `/api/timeline/bot` | POST | Send bot notifications to timeline | ✅ Implemented |

### Planned API Endpoints

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/dashboard/stats` | GET | User dashboard statistics | Medium |
| `/api/payments/webhook` | POST | Toss Payments webhook | Low |
| `/api/reports` | POST | Content reporting | Low |
| `/api/events/[id]/comments` | GET, POST | Event comments/discussions | Medium |

### WebSocket Events (Planned)

| Event | Purpose | Priority |
|-------|---------|----------|
| `timeline:update` | Real-time dashboard timeline updates | Medium |
| `event:updated` | Real‑time event updates | High |
| `rsvp:changed` | RSVP status changes | High |
| `payment:confirmed` | Notify payment completion | Low |

⸻

## 9. Custom Timeline Service

### 9.1 Architecture
Kemotown implements a lightweight, event-centric timeline service that:
- **Native Integration**: Built directly into the Next.js application
- **Real-time Updates**: Server-Sent Events (SSE) for Vercel compatibility
- **Database**: Uses existing PostgreSQL with Prisma ORM
- **Frontend**: Custom React components with Naver Band-inspired UI

### 9.2 Bot System
Generalized bot system with factory pattern for automated notifications:
- **System Bot**: Global announcements (user joins, events created)
- **Welcome Bot**: Greets new members with personalized messages
- **Event Bots**: Per-event notification, moderation, and helper bots
- **Template System**: Dynamic message generation with variable substitution
- **Separate Model**: BotUser table with foreign key relationship to TimelinePost
- **Authentication**: Internal API secured with INTERNAL_API_KEY for bot operations

### 9.3 Timeline Features
| Feature | Global Timeline | Event Timeline | Status |
|---------|----------------|----------------|--------|
| Text Posts | ✅ Implemented | ✅ Implemented | Users can post text up to 500 characters |
| Real-time Updates | ✅ Implemented | ✅ Implemented | SSE streaming for instant updates |
| Bot Notifications | ✅ Implemented | ✅ Implemented | Automated posts for system events |
| User Mentions | ✅ Implemented | ✅ Implemented | @username support with links |
| Reactions | ✅ Implemented | ✅ Implemented | 5 emoji reactions per post |
| Media Uploads | 🔄 Planned | 🔄 Planned | Images/videos support |

### 9.4 Data Models
```prisma
model TimelinePost {
  id            String      @id @default(cuid())
  content       String      @db.Text
  userId        String
  eventId       String?     // null for global, eventId for event-specific
  channelType   ChannelType @default(GLOBAL)
  isBot         Boolean     @default(false)
  botType       BotType?
  createdAt     DateTime    @default(now())
  
  // Relations
  user          User        @relation(...)
  event         Event?      @relation(...)
  reactions     Reaction[]
  mentions      Mention[]
}

model BotUser {
  id            String   @id @default(cuid())
  username      String   @unique
  displayName   String
  botType       BotType
  eventId       String?  // null for system bots
}
```

⸻

## 10. Security & Privacy

- **Authentication**: NextAuth.js with OAuth providers (Google, Kakao)
- **CSRF Protection**: Built‑in Next.js CSRF protection
- **Data Validation**: Zod schemas for API input validation
- **Rate Limiting**: Redis‑based rate limiting for API endpoints
- **Field Masking**: Sensitive data (bank accounts, phones) masked in UI
- **GDPR Compliance**: Data export functionality via API endpoints

⸻

## 11. Performance Optimization

- **Server Components**: Reduce client‑side JavaScript bundle
- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Automatic route‑based code splitting
- **Caching**: Redis for API responses, SWR for client‑side caching
- **Static Generation**: Pre‑render public pages at build time
- **Streaming**: React 18 Suspense for progressive loading

⸻

## 12. Internationalization

- **next‑intl**: For Korean/English language support
- **Date/Time**: Korean timezone handling with date‑fns
- **Currency**: Korean Won formatting
- **Text Direction**: RTL support preparation

⸻

## 13. Testing Strategy

| Type | Tool | Coverage |
|------|------|----------|
| Unit Tests | Jest + React Testing Library | Components and utilities |
| Integration Tests | Playwright | Critical user flows |
| API Tests | Supertest | API endpoint testing |
| E2E Tests | Playwright | Full application workflows |
| Type Checking | TypeScript | Compile‑time type safety |

⸻

## 14. Deployment & DevOps (Implemented)

### 14.1 CI/CD Pipeline (GitHub Actions)
| Workflow | Triggers | Purpose | Status |
|----------|----------|---------|--------|
| **CI** | Push/PR to main, develop | ESLint, TypeScript, tests, build verification | ✅ Implemented |
| **Security** | Push/PR to main + weekly | npm audit, CodeQL analysis, dependency checks | ✅ Implemented |
| **Quality** | Push/PR to main, develop | Code formatting, bundle analysis, performance checks | ✅ Implemented |

### 14.2 Environment Setup
1. **Development**: `npm run dev` with Turbopack for fast reload
2. **Build**: `prisma generate && next build` with environment validation
3. **Testing**: Jest + React Testing Library with coverage reports
4. **Linting**: ESLint with strict TypeScript rules
5. **Type Checking**: Strict TypeScript compilation

### 14.3 Production Deployment
| Environment | Platform | Database | Domain | Status |
|-------------|----------|----------|---------|--------|
| **Production** | Vercel | Railway PostgreSQL | kemo.town | ✅ Configured |
| **Preview** | Vercel PR Deploys | Railway (shared) | *.vercel.app | ✅ Automated |
| **Development** | Local | Railway (shared) | localhost:3000 | ✅ Working |

### 14.4 Environment Variables
- `DATABASE_URL`: Railway PostgreSQL connection string
- `NEXTAUTH_URL`: Production domain (kemo.town)
- `NEXTAUTH_SECRET`: Secure random string for JWT signing
- `GOOGLE_CLIENT_ID/SECRET`: OAuth provider credentials
- `KAKAO_CLIENT_ID/SECRET`: Korean OAuth provider (planned)
- `INTERNAL_API_KEY`: Internal API key for bot notifications

### 14.5 Monitoring & Analytics
- **Vercel Analytics**: Performance and usage metrics
- **GitHub Actions**: Build and test status monitoring
- **Railway**: Database performance and connection monitoring

⸻

## 15. Future Enhancements

| Feature | Implementation Notes |
|---------|---------------------|
| Event Timelines | Real‑time chat with WebSocket and React Suspense |
| Mobile Apps | React Native with shared business logic |
| Offline Support | PWA with service workers and IndexedDB |
| Push Notifications | Web Push API for event reminders |

⸻

## 16. Open Design Questions

1. **State Management**: Zustand vs Redux Toolkit for complex state
2. **Real‑time Updates**: WebSocket vs Server‑Sent Events for payment status
3. **Image Storage**: Local vs CDN (Cloudinary/Vercel Blob) for user uploads
4. **Mobile Strategy**: PWA vs React Native for mobile apps

⸻

## 16.1 Security Architecture

**Authentication & Authorization**
- Internal API authentication using INTERNAL_API_KEY for bot operations
- Session-based authentication via NextAuth.js with OAuth providers
- Event timeline access controls (RSVP validation for attendees/considering users)
- Real-time connection limits and user-based rate limiting

**Input Validation & Sanitization**
- Zod schema validation for all API endpoints with discriminated unions
- Template injection prevention with allowlisted bot message templates
- HTML entity encoding for user-generated content in bot messages
- Post and reaction access validation at the service layer

**Real-time Security (SSE)**
- Connection limits: maximum 5 connections per user
- Connection duration limits: 24-hour maximum lifespan
- Automatic cleanup of stale connections with periodic maintenance
- Client-side reconnection logic with exponential backoff (max 5 attempts)

**Bot System Security**
- Strict template allowlisting to prevent injection attacks
- Concurrent initialization protection using Promise-based guards
- Event existence validation before bot operations
- Separate BotUser model isolation from regular User authentication

**Data Integrity**
- Event timeline restricted posting (RSVP validation required)
- Reaction ownership verification and duplicate prevention via upserts
- Post authorship validation (userId XOR botUserId constraints)
- Event existence checks before timeline operations

⸻

## 17. Implementation Status & Next Steps

### 17.1 Completed ✅
1. **Project Setup**: Next.js 15+ with TypeScript, Tailwind CSS, and shadcn/ui
2. **Database Design**: Prisma schema with User, Event, RSVP models + NextAuth tables
3. **Authentication**: NextAuth.js with Google OAuth and automatic username generation
4. **User Management**: Profile creation, editing, and user discovery with search
5. **Dashboard System**: Social media-style dashboard with real API data integration
6. **Event Management System**: Complete event lifecycle with RSVP functionality
   - Event discovery page with search, filtering, and pagination
   - Event detail pages with full RSVP system (Attend/Consider/Not Attending)
   - Markdown-based event creation with live preview functionality
   - Event editing interface with host-only access control
   - Event deletion with confirmation prompts
   - Capacity management and attendee tracking
   - Tag management system for event categorization
7. **Real API Integration**: Dashboard timeline, events, and users with live data
8. **CI/CD Pipeline**: Comprehensive GitHub Actions workflows for quality assurance
9. **Deployment**: Vercel hosting with Railway PostgreSQL and automatic deployments
10. **Custom Timeline Service**: 
    - Native timeline implementation with PostgreSQL/Prisma
    - React component with SSE for real-time updates
    - Generalized bot system with factory pattern
    - Support for global and per-event timeline channels
    - Reactions and mentions functionality
    - **Security Hardening (2025-05-24)**:
      - Fixed API parameter type safety and validation issues
      - Enhanced environment variable safety checks
      - Improved SSE connection management and memory leak prevention
      - Added comprehensive input validation with discriminated unions
      - Strengthened bot API authentication and access controls
      - Performance optimizations and database query improvements

### 17.2 In Progress 🔄
1. **Korean OAuth**: Kakao provider integration for local user adoption
2. **File Upload System**: Event cover images and profile pictures

### 17.3 Next Priorities 🎯
1. **Enhanced Event Features** (High Priority)
   - File upload for event cover images
   - Event comments and discussions
   - Event sharing and social features

2. **Enhanced Dashboard** (Medium Priority)
   - Real-time activity feed with WebSocket integration
   - Event recommendations based on user interests
   - Dashboard statistics and analytics

3. **Payment Integration** (Lower Priority)
   - Toss Payments API for paid events
   - Virtual account generation and webhook handling
   - Payment status tracking and notifications

### 17.4 Future Enhancements 🚀
- Real-time chat for events
- Mobile PWA optimization
- Push notifications for event updates
- Advanced matching algorithms for user discovery

⸻

*This document will be updated as the project evolves and technical decisions are finalized.*