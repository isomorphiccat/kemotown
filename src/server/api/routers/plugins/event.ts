/**
 * Event Plugin tRPC Router
 * Handles event-specific operations: RSVP, check-in, attendee management
 */

import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/trpc';
import {
  rsvpSchema,
  updateRsvpSchema,
  cancelRsvpSchema,
  checkInSchema,
  approveRsvpSchema,
  getAttendeesSchema,
  getWaitlistSchema,
  getStatsSchema,
} from '@/schemas/event-plugin.schema';
import type { EventPluginData } from '@/lib/plugins/event/schema';
import { checkEventCapacity, processWaitlist } from '@/lib/plugins/event/hooks';

export const eventPluginRouter = createTRPCRouter({
  // ==========================================================================
  // RSVP Operations
  // ==========================================================================

  /**
   * RSVP to an event
   */
  rsvp: protectedProcedure
    .input(rsvpSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get context and verify it's an event
      const context = await ctx.db.context.findUnique({
        where: { id: input.contextId },
        select: { id: true, type: true, plugins: true },
      });

      if (!context) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Event not found',
        });
      }

      if (context.type !== 'EVENT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only RSVP to events',
        });
      }

      const eventData = (context.plugins as Record<string, unknown>)?.event as
        | EventPluginData
        | undefined;

      // Check if event requires approval
      const requiresApproval = eventData?.requiresApproval ?? false;

      // Check capacity for attending status
      let finalStatus = input.status;
      if (input.status === 'attending') {
        const { available } = await checkEventCapacity(input.contextId);
        if (!available && eventData?.hasWaitlist) {
          finalStatus = 'waitlist';
        } else if (!available) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Event is at capacity',
          });
        }
      }

      // Check if user already has a membership
      const existingMembership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId } },
      });

      const pluginData = {
        event: {
          rsvpStatus: finalStatus,
          rsvpAt: new Date().toISOString(),
          guestCount: input.guestCount,
          screeningAnswers: input.screeningAnswers,
          note: input.note,
          needsApproval: requiresApproval && finalStatus === 'attending',
        },
      };

      if (existingMembership) {
        // Update existing membership
        await ctx.db.membership.update({
          where: { id: existingMembership.id },
          data: {
            status: requiresApproval ? 'PENDING' : 'APPROVED',
            pluginData: {
              ...((existingMembership.pluginData as Record<string, unknown>) || {}),
              ...pluginData,
            },
          },
        });
      } else {
        // Create new membership
        await ctx.db.membership.create({
          data: {
            contextId: input.contextId,
            userId,
            role: 'MEMBER',
            status: requiresApproval ? 'PENDING' : 'APPROVED',
            pluginData,
          },
        });
      }

      return {
        success: true,
        status: finalStatus,
        requiresApproval,
      };
    }),

  /**
   * Update RSVP
   */
  updateRsvp: protectedProcedure
    .input(updateRsvpSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const membership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId } },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'RSVP not found',
        });
      }

      const currentPluginData = (membership.pluginData as Record<string, unknown>) || {};
      const eventData = (currentPluginData.event as Record<string, unknown>) || {};

      await ctx.db.membership.update({
        where: { id: membership.id },
        data: {
          pluginData: {
            ...currentPluginData,
            event: {
              ...eventData,
              ...(input.status && { rsvpStatus: input.status }),
              ...(input.guestCount !== undefined && { guestCount: input.guestCount }),
              ...(input.note !== undefined && { note: input.note }),
              updatedAt: new Date().toISOString(),
            },
          },
        },
      });

      return { success: true };
    }),

  /**
   * Cancel RSVP (leave event)
   */
  cancelRsvp: protectedProcedure
    .input(cancelRsvpSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const membership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId } },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'RSVP not found',
        });
      }

      // Get previous status
      const pluginData = (membership.pluginData as Record<string, unknown>) || {};
      const eventData = (pluginData.event as { rsvpStatus?: string }) || {};
      const wasAttending = eventData.rsvpStatus === 'attending';

      // Update to not attending
      await ctx.db.membership.update({
        where: { id: membership.id },
        data: {
          status: 'LEFT',
          pluginData: {
            ...pluginData,
            event: {
              ...eventData,
              rsvpStatus: 'not_attending',
              cancelledAt: new Date().toISOString(),
            },
          },
        },
      });

      // If they were attending, process waitlist
      if (wasAttending) {
        const promotedUserId = await processWaitlist(input.contextId);
        if (promotedUserId) {
          // TODO: Send notification to promoted user
          console.log(`[EventPlugin] Promoted user ${promotedUserId} from waitlist`);
        }
      }

      return { success: true };
    }),

  // ==========================================================================
  // Check-in Operations
  // ==========================================================================

  /**
   * Check in an attendee (for event hosts)
   */
  checkIn: protectedProcedure
    .input(checkInSchema)
    .mutation(async ({ ctx, input }) => {
      const hostId = ctx.session.user.id;

      // Verify host has permission
      const hostMembership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId: hostId } },
        select: { role: true, status: true },
      });

      if (!hostMembership || hostMembership.status !== 'APPROVED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this event',
        });
      }

      if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(hostMembership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to check in attendees',
        });
      }

      // Get attendee membership
      const attendeeMembership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId: input.userId } },
      });

      if (!attendeeMembership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Attendee not found',
        });
      }

      const pluginData = (attendeeMembership.pluginData as Record<string, unknown>) || {};
      const eventData = (pluginData.event as Record<string, unknown>) || {};

      // Update check-in status
      await ctx.db.membership.update({
        where: { id: attendeeMembership.id },
        data: {
          pluginData: {
            ...pluginData,
            event: {
              ...eventData,
              checkedIn: true,
              checkedInAt: new Date().toISOString(),
              checkedInBy: hostId,
              checkInNote: input.note,
            },
          },
        },
      });

      return { success: true, checkedInAt: new Date() };
    }),

  // ==========================================================================
  // Approval Operations
  // ==========================================================================

  /**
   * Approve or reject RSVP (for approval-required events)
   */
  approveRsvp: protectedProcedure
    .input(approveRsvpSchema)
    .mutation(async ({ ctx, input }) => {
      const hostId = ctx.session.user.id;

      // Verify host has permission
      const hostMembership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId: hostId } },
        select: { role: true, status: true },
      });

      if (!hostMembership || hostMembership.status !== 'APPROVED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this event',
        });
      }

      if (!['OWNER', 'ADMIN'].includes(hostMembership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to approve RSVPs',
        });
      }

      // Get pending membership
      const membership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId: input.userId } },
      });

      if (!membership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'RSVP not found',
        });
      }

      const pluginData = (membership.pluginData as Record<string, unknown>) || {};
      const eventData = (pluginData.event as Record<string, unknown>) || {};

      if (input.action === 'approve') {
        // Check capacity before approving
        const { available } = await checkEventCapacity(input.contextId);
        const context = await ctx.db.context.findUnique({
          where: { id: input.contextId },
          select: { plugins: true },
        });
        const eventPluginData = (context?.plugins as Record<string, unknown>)?.event as
          | EventPluginData
          | undefined;

        if (!available && eventPluginData?.hasWaitlist) {
          // Move to waitlist instead of approving
          await ctx.db.membership.update({
            where: { id: membership.id },
            data: {
              status: 'APPROVED',
              pluginData: {
                ...pluginData,
                event: {
                  ...eventData,
                  rsvpStatus: 'waitlist',
                  needsApproval: false,
                  approvedAt: new Date().toISOString(),
                  approvedBy: hostId,
                },
              },
            },
          });

          return { success: true, action: 'waitlisted' };
        } else if (!available) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Event is at capacity',
          });
        }

        await ctx.db.membership.update({
          where: { id: membership.id },
          data: {
            status: 'APPROVED',
            pluginData: {
              ...pluginData,
              event: {
                ...eventData,
                needsApproval: false,
                approvedAt: new Date().toISOString(),
                approvedBy: hostId,
              },
            },
          },
        });

        return { success: true, action: 'approved' };
      } else {
        // Reject
        await ctx.db.membership.update({
          where: { id: membership.id },
          data: {
            status: 'BANNED',
            pluginData: {
              ...pluginData,
              event: {
                ...eventData,
                rsvpStatus: 'not_attending',
                rejectedAt: new Date().toISOString(),
                rejectedBy: hostId,
                rejectionReason: input.reason,
              },
            },
          },
        });

        return { success: true, action: 'rejected' };
      }
    }),

  // ==========================================================================
  // Query Operations
  // ==========================================================================

  /**
   * Get attendees list
   */
  getAttendees: publicProcedure
    .input(getAttendeesSchema)
    .query(async ({ ctx, input }) => {
      const memberships = await ctx.db.membership.findMany({
        where: {
          contextId: input.contextId,
          status: 'APPROVED',
          ...(input.cursor && { id: { lt: input.cursor } }),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
        take: input.limit + 1,
      });

      // Filter by RSVP status if specified
      const filtered = input.status
        ? memberships.filter((m) => {
            const eventData = ((m.pluginData as Record<string, unknown>)?.event as {
              rsvpStatus?: string;
            }) || {};
            return eventData.rsvpStatus === input.status;
          })
        : memberships;

      const hasMore = filtered.length > input.limit;
      const items = hasMore ? filtered.slice(0, -1) : filtered;

      return {
        items: items.map((m) => ({
          user: m.user,
          rsvpStatus: ((m.pluginData as Record<string, unknown>)?.event as {
            rsvpStatus?: string;
            guestCount?: number;
            checkedIn?: boolean;
          })?.rsvpStatus || 'unknown',
          guestCount: ((m.pluginData as Record<string, unknown>)?.event as {
            guestCount?: number;
          })?.guestCount || 0,
          checkedIn: ((m.pluginData as Record<string, unknown>)?.event as {
            checkedIn?: boolean;
          })?.checkedIn || false,
          joinedAt: m.joinedAt,
        })),
        nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
        hasMore,
      };
    }),

  /**
   * Get waitlist
   */
  getWaitlist: protectedProcedure
    .input(getWaitlistSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify user is host
      const membership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId } },
        select: { role: true, status: true },
      });

      if (!membership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view the waitlist',
        });
      }

      const waitlisted = await ctx.db.membership.findMany({
        where: {
          contextId: input.contextId,
          status: 'APPROVED',
          ...(input.cursor && { id: { lt: input.cursor } }),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
        take: (input.limit || 50) + 1,
      });

      // Filter to only waitlisted
      const filtered = waitlisted.filter((m) => {
        const eventData = ((m.pluginData as Record<string, unknown>)?.event as {
          rsvpStatus?: string;
        }) || {};
        return eventData.rsvpStatus === 'waitlist';
      });

      const hasMore = filtered.length > (input.limit || 50);
      const items = hasMore ? filtered.slice(0, -1) : filtered;

      return {
        items: items.map((m, index) => ({
          position: index + 1,
          user: m.user,
          rsvpAt: ((m.pluginData as Record<string, unknown>)?.event as {
            rsvpAt?: string;
          })?.rsvpAt || m.joinedAt.toISOString(),
        })),
        nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
        hasMore,
        totalCount: filtered.length,
      };
    }),

  /**
   * Get event stats
   */
  getStats: publicProcedure
    .input(getStatsSchema)
    .query(async ({ ctx, input }) => {
      const context = await ctx.db.context.findUnique({
        where: { id: input.contextId },
        select: { plugins: true },
      });

      if (!context) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Event not found',
        });
      }

      const eventData = (context.plugins as Record<string, unknown>)?.event as
        | EventPluginData
        | undefined;

      // Get membership counts by status
      const memberships = await ctx.db.membership.findMany({
        where: { contextId: input.contextId },
        select: { pluginData: true, status: true },
      });

      const stats = {
        attending: 0,
        waitlist: 0,
        considering: 0,
        notAttending: 0,
        pending: 0,
        checkedIn: 0,
        totalGuests: 0,
      };

      for (const m of memberships) {
        if (m.status === 'PENDING') {
          stats.pending++;
          continue;
        }
        if (m.status !== 'APPROVED') continue;

        const eventPluginData = ((m.pluginData as Record<string, unknown>)?.event as {
          rsvpStatus?: string;
          guestCount?: number;
          checkedIn?: boolean;
        }) || {};

        switch (eventPluginData.rsvpStatus) {
          case 'attending':
            stats.attending++;
            stats.totalGuests += eventPluginData.guestCount || 0;
            if (eventPluginData.checkedIn) stats.checkedIn++;
            break;
          case 'waitlist':
            stats.waitlist++;
            break;
          case 'considering':
            stats.considering++;
            break;
          case 'not_attending':
            stats.notAttending++;
            break;
        }
      }

      return {
        ...stats,
        capacity: eventData?.capacity ?? null,
        remainingSpots: eventData?.capacity
          ? eventData.capacity - stats.attending
          : null,
        hasWaitlist: eventData?.hasWaitlist ?? false,
      };
    }),
});
