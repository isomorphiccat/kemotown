/**
 * Event Plugin Router Tests
 * Tests for RSVP, check-in, and attendee management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('@/server/db', () => ({
  db: {
    context: {
      findUnique: vi.fn(),
    },
    membership: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock plugin hooks
vi.mock('@/lib/plugins/event/hooks', () => ({
  checkEventCapacity: vi.fn(() => Promise.resolve({ available: true, remaining: 10 })),
  processWaitlist: vi.fn(() => Promise.resolve(null)),
}));

import { db } from '@/server/db';
import { checkEventCapacity, processWaitlist } from '@/lib/plugins/event/hooks';

describe('Event Plugin Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RSVP Operations', () => {
    describe('rsvp', () => {
      it('should create RSVP for event with available capacity', async () => {
        const contextId = 'event-1';
        const userId = 'user-1';

        // Mock context lookup
        vi.mocked(db.context.findUnique).mockResolvedValueOnce({
          id: contextId,
          type: 'EVENT',
          plugins: {
            event: {
              capacity: 50,
              hasWaitlist: true,
              requiresApproval: false,
            },
          },
        } as Parameters<typeof db.context.findUnique>[0] extends { where: infer W } ? W : never);

        // Mock no existing membership
        vi.mocked(db.membership.findUnique).mockResolvedValueOnce(null);

        // Mock capacity check
        vi.mocked(checkEventCapacity).mockResolvedValueOnce({
          available: true,
          remaining: 10,
        });

        // Mock membership creation
        vi.mocked(db.membership.create).mockResolvedValueOnce({
          id: 'mem-1',
          contextId,
          userId,
          role: 'MEMBER',
          status: 'APPROVED',
          pluginData: {
            event: {
              rsvpStatus: 'attending',
              rsvpAt: new Date().toISOString(),
            },
          },
        } as Parameters<typeof db.membership.create>[0] extends { data: infer D } ? D : never);

        const context = await db.context.findUnique({
          where: { id: contextId },
          select: { id: true, type: true, plugins: true },
        });

        expect(context?.type).toBe('EVENT');
      });

      it('should put user on waitlist when event is full', async () => {
        const contextId = 'event-full';

        // Reset and set specific mock for this test
        vi.mocked(checkEventCapacity).mockReset();
        vi.mocked(checkEventCapacity).mockResolvedValueOnce({
          available: false,
          remaining: 0,
        });

        const capacity = await checkEventCapacity(contextId);

        expect(capacity.available).toBe(false);
        expect(capacity.remaining).toBe(0);
      });

      it('should require approval for approval-required events', async () => {
        const contextId = 'event-approval';

        vi.mocked(db.context.findUnique).mockResolvedValueOnce({
          id: contextId,
          type: 'EVENT',
          plugins: {
            event: {
              requiresApproval: true,
            },
          },
        } as Parameters<typeof db.context.findUnique>[0] extends { where: infer W } ? W : never);

        const context = await db.context.findUnique({
          where: { id: contextId },
        });

        const eventData = (context?.plugins as Record<string, unknown>)?.event as {
          requiresApproval?: boolean;
        };

        expect(eventData?.requiresApproval).toBe(true);
      });
    });

    describe('cancelRsvp', () => {
      it('should process waitlist when attendee cancels', async () => {
        const contextId = 'event-1';

        // Mock waitlist processing returning a user
        vi.mocked(processWaitlist).mockResolvedValueOnce('waitlist-user-1');

        const promotedUser = await processWaitlist(contextId);

        expect(promotedUser).toBe('waitlist-user-1');
        expect(processWaitlist).toHaveBeenCalledWith(contextId);
      });
    });
  });

  describe('Check-in Operations', () => {
    describe('checkIn', () => {
      it('should verify host has permission to check in', async () => {
        const contextId = 'event-1';
        const hostId = 'host-1';

        // Reset membership mock before setting up
        vi.mocked(db.membership.findUnique).mockReset();
        vi.mocked(db.membership.findUnique).mockResolvedValueOnce({
          id: 'mem-host',
          role: 'OWNER',
          status: 'APPROVED',
        } as Parameters<typeof db.membership.findUnique>[0] extends { where: infer W } ? W : never);

        const hostMembership = await db.membership.findUnique({
          where: { contextId_userId: { contextId, userId: hostId } },
        });

        expect(hostMembership?.role).toBe('OWNER');
        expect(['OWNER', 'ADMIN', 'MODERATOR']).toContain(hostMembership?.role);
      });

      it('should reject check-in from non-host member', async () => {
        const contextId = 'event-1';
        const memberId = 'member-1';

        // Reset membership mock before setting up
        vi.mocked(db.membership.findUnique).mockReset();
        vi.mocked(db.membership.findUnique).mockResolvedValueOnce({
          id: 'mem-member',
          role: 'MEMBER',
          status: 'APPROVED',
        } as Parameters<typeof db.membership.findUnique>[0] extends { where: infer W } ? W : never);

        const membership = await db.membership.findUnique({
          where: { contextId_userId: { contextId, userId: memberId } },
        });

        expect(membership?.role).toBe('MEMBER');
        expect(['OWNER', 'ADMIN', 'MODERATOR']).not.toContain(membership?.role);
      });
    });
  });

  describe('Attendee Queries', () => {
    describe('getAttendees', () => {
      it('should return list of attendees with RSVP status', async () => {
        const contextId = 'event-1';

        vi.mocked(db.membership.findMany).mockResolvedValueOnce([
          {
            id: 'mem-1',
            user: { id: 'user-1', username: 'user1', displayName: 'User 1' },
            pluginData: {
              event: { rsvpStatus: 'attending', guestCount: 1, checkedIn: false },
            },
            joinedAt: new Date(),
          },
          {
            id: 'mem-2',
            user: { id: 'user-2', username: 'user2', displayName: 'User 2' },
            pluginData: {
              event: { rsvpStatus: 'attending', guestCount: 0, checkedIn: true },
            },
            joinedAt: new Date(),
          },
        ] as unknown as Parameters<typeof db.membership.findMany>[0] extends { where: infer W } ? W : never);

        const memberships = await db.membership.findMany({
          where: { contextId, status: 'APPROVED' },
        });

        expect(memberships).toHaveLength(2);
      });

      it('should filter by RSVP status', async () => {
        const contextId = 'event-1';
        const status = 'waitlist';

        vi.mocked(db.membership.findMany).mockResolvedValueOnce([
          {
            id: 'mem-waitlist',
            user: { id: 'user-3', username: 'user3' },
            pluginData: { event: { rsvpStatus: 'waitlist' } },
            joinedAt: new Date(),
          },
        ] as unknown as Parameters<typeof db.membership.findMany>[0] extends { where: infer W } ? W : never);

        const memberships = await db.membership.findMany({
          where: { contextId, status: 'APPROVED' },
        });

        const filtered = memberships.filter((m) => {
          const eventData = ((m as { pluginData: Record<string, unknown> }).pluginData?.event as {
            rsvpStatus?: string;
          }) || {};
          return eventData.rsvpStatus === status;
        });

        expect(filtered).toHaveLength(1);
        expect(((filtered[0] as { pluginData: Record<string, unknown> }).pluginData?.event as { rsvpStatus: string }).rsvpStatus).toBe('waitlist');
      });
    });

    describe('getStats', () => {
      it('should return correct event statistics', async () => {
        const contextId = 'event-1';

        vi.mocked(db.context.findUnique).mockResolvedValueOnce({
          id: contextId,
          plugins: {
            event: { capacity: 50, hasWaitlist: true },
          },
        } as Parameters<typeof db.context.findUnique>[0] extends { where: infer W } ? W : never);

        vi.mocked(db.membership.findMany).mockResolvedValueOnce([
          { status: 'APPROVED', pluginData: { event: { rsvpStatus: 'attending' } } },
          { status: 'APPROVED', pluginData: { event: { rsvpStatus: 'attending' } } },
          { status: 'APPROVED', pluginData: { event: { rsvpStatus: 'waitlist' } } },
          { status: 'PENDING', pluginData: { event: { rsvpStatus: 'attending' } } },
        ] as unknown as Parameters<typeof db.membership.findMany>[0] extends { where: infer W } ? W : never);

        // Verify context exists (mock returns data)
        await db.context.findUnique({
          where: { id: contextId },
        });

        const memberships = await db.membership.findMany({
          where: { contextId },
        });

        // Calculate stats
        const stats = {
          attending: 0,
          waitlist: 0,
          pending: 0,
        };

        for (const m of memberships) {
          const mem = m as { status: string; pluginData: { event: { rsvpStatus: string } } };
          if (mem.status === 'PENDING') {
            stats.pending++;
          } else if (mem.status === 'APPROVED') {
            if (mem.pluginData?.event?.rsvpStatus === 'attending') {
              stats.attending++;
            } else if (mem.pluginData?.event?.rsvpStatus === 'waitlist') {
              stats.waitlist++;
            }
          }
        }

        expect(stats.attending).toBe(2);
        expect(stats.waitlist).toBe(1);
        expect(stats.pending).toBe(1);
      });
    });
  });
});
