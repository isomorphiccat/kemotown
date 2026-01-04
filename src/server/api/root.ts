/**
 * tRPC Root Router (v2)
 * Aggregates all sub-routers into a single router
 */

import { createTRPCRouter } from '../trpc';
import { userRouter } from './routers/user';
import { followRouter } from './routers/follow';
import { activityRouter } from './routers/activity';
import { dmRouter } from './routers/dm';
import { uploadRouter } from './routers/upload';
import { inboxRouter } from './routers/inbox';
import { contextRouter } from './routers/context';
import { membershipRouter } from './routers/membership';
import { eventPluginRouter } from './routers/plugins/event';
import { groupPluginRouter } from './routers/plugins/group';

/**
 * Main tRPC router (v2 Architecture)
 *
 * ## Context System
 * - `context` - Unified container for Groups, Events, Conventions
 * - `membership` - Role-based access control within contexts
 *
 * ## Social Features
 * - `activity` - ActivityPub-style posts, likes, reposts, replies
 * - `follow` - User following with approval workflow
 * - `dm` - Direct messaging via Activity addressing
 * - `inbox` - Notifications and inbox management
 *
 * ## Utilities
 * - `user` - User profiles and settings
 * - `upload` - File uploads (S3/R2)
 *
 * ## Plugins
 * - `eventPlugin` - Event-specific: RSVP, check-in, attendees
 * - `groupPlugin` - Group-specific: moderation, polls, roles
 */
export const appRouter = createTRPCRouter({
  // Core
  user: userRouter,
  activity: activityRouter,
  follow: followRouter,
  dm: dmRouter,
  inbox: inboxRouter,
  upload: uploadRouter,

  // Context system (v2)
  context: contextRouter,
  membership: membershipRouter,

  // Plugin routes
  eventPlugin: eventPluginRouter,
  groupPlugin: groupPluginRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
