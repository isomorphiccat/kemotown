# Kemotown — Next.js/React Architectural Blueprint

Version 0.2 (updated for Next.js/React stack, May 21 2025)

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
├── app/                    # Next.js 13+ App Router
│   ├── (auth)/            # Route groups
│   ├── events/            # Event pages
│   ├── profile/           # Profile pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utility functions and configurations
│   ├── db.ts            # Database client (Prisma)
│   ├── auth.ts          # Authentication logic
│   ├── payments.ts      # Toss Payments integration
│   └── utils.ts         # General utilities
├── types/               # TypeScript type definitions
└── styles/              # Additional CSS/styling
```

⸻

## 4. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14+ | Full‑stack React framework with App Router |
| UI Library | React 18 | Component‑based UI with Server Components |
| Styling | Tailwind CSS | Utility‑first CSS framework |
| Database | PostgreSQL | Primary data store |
| ORM | Prisma | Type‑safe database client |
| Authentication | NextAuth.js | Authentication solution |
| State Management | Zustand + SWR | Client state and server state |
| Payments | Toss Payments API | Korean payment processing |
| Deployment | Vercel | Hosting and deployment |
| Language | TypeScript | Type safety throughout the stack |

⸻

## 5. UX‑Critical Flows (MVP)

| Flow | Implementation | Real‑time? |
|------|----------------|------------|
| Host creates event | Multi‑step form → POST /api/events → optimistic UI update | No |
| User RSVP → Payment | "Attend" button → POST /api/rsvp → Toss virtual account → WebSocket for payment status | Yes (payment status) |
| Bump | Camera/QR permission → POST /api/bump → success animation | No |
| Moderation | Report modal → POST /api/reports → admin dashboard | No |

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

### REST Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/events` | GET, POST | List and create events |
| `/api/events/[id]` | GET, PUT, DELETE | Event CRUD operations |
| `/api/events/[id]/rsvp` | POST | RSVP to event |
| `/api/payments/webhook` | POST | Toss Payments webhook |
| `/api/users/[id]` | GET, PUT | User profile operations |
| `/api/reports` | POST | Content reporting |

### WebSocket Events

| Event | Purpose |
|-------|---------|
| `payment:confirmed` | Notify payment completion |
| `event:updated` | Real‑time event updates |
| `rsvp:changed` | RSVP status changes |

⸻

## 9. Security & Privacy

- **Authentication**: NextAuth.js with OAuth providers (Google, Kakao)
- **CSRF Protection**: Built‑in Next.js CSRF protection
- **Data Validation**: Zod schemas for API input validation
- **Rate Limiting**: Redis‑based rate limiting for API endpoints
- **Field Masking**: Sensitive data (bank accounts, phones) masked in UI
- **GDPR Compliance**: Data export functionality via API endpoints

⸻

## 10. Performance Optimization

- **Server Components**: Reduce client‑side JavaScript bundle
- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Automatic route‑based code splitting
- **Caching**: Redis for API responses, SWR for client‑side caching
- **Static Generation**: Pre‑render public pages at build time
- **Streaming**: React 18 Suspense for progressive loading

⸻

## 11. Internationalization

- **next‑intl**: For Korean/English language support
- **Date/Time**: Korean timezone handling with date‑fns
- **Currency**: Korean Won formatting
- **Text Direction**: RTL support preparation

⸻

## 12. Testing Strategy

| Type | Tool | Coverage |
|------|------|----------|
| Unit Tests | Jest + React Testing Library | Components and utilities |
| Integration Tests | Playwright | Critical user flows |
| API Tests | Supertest | API endpoint testing |
| E2E Tests | Playwright | Full application workflows |
| Type Checking | TypeScript | Compile‑time type safety |

⸻

## 13. Deployment & DevOps

1. **Development**: `npm run dev` for local development with hot reload
2. **Testing**: Automated tests on PR creation
3. **Staging**: Preview deployments on Vercel for each PR
4. **Production**: Automatic deployment to Vercel on main branch merge
5. **Database**: PostgreSQL on Railway or Supabase
6. **Monitoring**: Vercel Analytics + Sentry for error tracking

⸻

## 14. Future Enhancements

| Feature | Implementation Notes |
|---------|---------------------|
| Event Timelines | Real‑time chat with WebSocket and React Suspense |
| Mobile Apps | React Native with shared business logic |
| Offline Support | PWA with service workers and IndexedDB |
| Push Notifications | Web Push API for event reminders |

⸻

## 15. Open Design Questions

1. **State Management**: Zustand vs Redux Toolkit for complex state
2. **Real‑time Updates**: WebSocket vs Server‑Sent Events for payment status
3. **Image Storage**: Local vs CDN (Cloudinary/Vercel Blob) for user uploads
4. **Mobile Strategy**: PWA vs React Native for mobile apps

⸻

## 16. Next Steps

1. **Setup Project**: Initialize Next.js project with TypeScript and Tailwind
2. **Database Design**: Create Prisma schema for core entities
3. **Authentication**: Implement NextAuth.js with Korean OAuth providers
4. **Design System**: Create base UI components with Tailwind
5. **MVP Features**: Implement event creation and RSVP functionality
6. **Payment Integration**: Set up Toss Payments API integration
7. **Testing**: Establish testing framework and write initial tests

⸻

*This document will be updated as the project evolves and technical decisions are finalized.*