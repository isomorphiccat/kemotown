/**
 * Visibility Checker Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrismaClient, type MockPrismaClient } from '@/test/mocks/prisma';

// Mock the database
vi.mock('@/server/db', () => ({
  db: createMockPrismaClient(),
}));

// Mock the plugin registry
vi.mock('@/lib/plugins/registry', () => ({
  pluginRegistry: {
    get: vi.fn(),
  },
}));

// Import after mocking
import {
  canSeeActivity,
  canSeeActivityWithReason,
  filterVisibleActivities,
  anyAddressVisible,
  batchCheckFollowing,
  batchCheckMembership,
} from './visibility';
import { db } from '@/server/db';
import { pluginRegistry } from '@/lib/plugins/registry';

// Cast for type safety in tests
const mockDb = db as unknown as MockPrismaClient;

describe('Visibility Checker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('canSeeActivity', () => {
    describe('public activities', () => {
      it('allows anyone to see public activities (in to)', async () => {
        const activity = { to: ['public'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, null)).toBe(true);
        expect(await canSeeActivity(activity, 'user2')).toBe(true);
        expect(await canSeeActivity(activity, 'user1')).toBe(true);
      });

      it('allows anyone to see public activities (in cc)', async () => {
        const activity = { to: ['followers'], cc: ['public'], actorId: 'user1' };

        expect(await canSeeActivity(activity, null)).toBe(true);
        expect(await canSeeActivity(activity, 'user2')).toBe(true);
      });
    });

    describe('authentication requirement', () => {
      it('requires login for non-public activities', async () => {
        const activity = { to: ['followers'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, null)).toBe(false);
      });

      it('requires login for user-addressed activities', async () => {
        const activity = { to: ['user:user2'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, null)).toBe(false);
      });

      it('requires login for context-addressed activities', async () => {
        const activity = { to: ['context:ctx1'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, null)).toBe(false);
      });
    });

    describe('actor visibility', () => {
      it('allows actor to see their own activities', async () => {
        const activity = { to: ['user:specific'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user1')).toBe(true);
      });

      it('allows actor to see even restricted activities', async () => {
        const activity = { to: ['context:ctx1:admins'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user1')).toBe(true);
      });
    });

    describe('direct user addresses', () => {
      it('allows direct recipients to see activities', async () => {
        const activity = { to: ['user:user2'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(true);
      });

      it('denies non-recipients', async () => {
        const activity = { to: ['user:user2'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user3')).toBe(false);
      });

      it('respects cc addresses', async () => {
        const activity = { to: ['user:user2'], cc: ['user:user3'], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user3')).toBe(true);
      });
    });

    describe('follower addresses', () => {
      it('allows followers to see follower-only activities', async () => {
        mockDb.follow.findUnique.mockResolvedValue({
          id: 'follow1',
          followerId: 'user2',
          followingId: 'user1',
          status: 'ACCEPTED',
        });

        const activity = { to: ['followers'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(true);
      });

      it('denies non-followers', async () => {
        mockDb.follow.findUnique.mockResolvedValue(null);

        const activity = { to: ['followers'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user3')).toBe(false);
      });

      it('denies pending followers', async () => {
        mockDb.follow.findUnique.mockResolvedValue({
          id: 'follow1',
          followerId: 'user2',
          followingId: 'user1',
          status: 'PENDING',
        });

        const activity = { to: ['followers'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(false);
      });
    });

    describe('context addresses', () => {
      it('allows context members to see context activities', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'MEMBER',
          status: 'APPROVED',
        });

        const activity = { to: ['context:ctx1'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(true);
      });

      it('denies non-members', async () => {
        mockDb.membership.findUnique.mockResolvedValue(null);

        const activity = { to: ['context:ctx1'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user3')).toBe(false);
      });

      it('denies pending members', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'MEMBER',
          status: 'PENDING',
        });

        const activity = { to: ['context:ctx1'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(false);
      });

      it('denies banned members', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'MEMBER',
          status: 'BANNED',
        });

        const activity = { to: ['context:ctx1'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(false);
      });
    });

    describe('context:admins modifier', () => {
      it('allows OWNER to see admin-only activities', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'OWNER',
          status: 'APPROVED',
        });

        const activity = { to: ['context:ctx1:admins'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(true);
      });

      it('allows ADMIN to see admin-only activities', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'ADMIN',
          status: 'APPROVED',
        });

        const activity = { to: ['context:ctx1:admins'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(true);
      });

      it('denies MODERATOR for admin-only activities', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'MODERATOR',
          status: 'APPROVED',
        });

        const activity = { to: ['context:ctx1:admins'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(false);
      });

      it('denies MEMBER for admin-only activities', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'MEMBER',
          status: 'APPROVED',
        });

        const activity = { to: ['context:ctx1:admins'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(false);
      });
    });

    describe('context:moderators modifier', () => {
      it('allows OWNER to see moderator-only activities', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'OWNER',
          status: 'APPROVED',
        });

        const activity = { to: ['context:ctx1:moderators'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(true);
      });

      it('allows ADMIN to see moderator-only activities', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'ADMIN',
          status: 'APPROVED',
        });

        const activity = { to: ['context:ctx1:moderators'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(true);
      });

      it('allows MODERATOR to see moderator-only activities', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'MODERATOR',
          status: 'APPROVED',
        });

        const activity = { to: ['context:ctx1:moderators'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(true);
      });

      it('denies MEMBER for moderator-only activities', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'MEMBER',
          status: 'APPROVED',
        });

        const activity = { to: ['context:ctx1:moderators'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(false);
      });
    });

    describe('context:role:ROLE modifier', () => {
      it('allows matching role', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'MODERATOR',
          status: 'APPROVED',
        });

        const activity = { to: ['context:ctx1:role:MODERATOR'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(true);
      });

      it('denies non-matching role', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'MEMBER',
          status: 'APPROVED',
        });

        const activity = { to: ['context:ctx1:role:MODERATOR'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(false);
      });
    });

    describe('plugin address patterns', () => {
      it('resolves plugin-defined address patterns', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'MEMBER',
          status: 'APPROVED',
        });

        mockDb.context.findUnique.mockResolvedValue({
          id: 'ctx1',
          features: ['event-plugin'],
        });

        const mockPluginRegistry = pluginRegistry as { get: ReturnType<typeof vi.fn> };
        mockPluginRegistry.get.mockReturnValue({
          id: 'event-plugin',
          addressPatterns: [
            {
              pattern: 'context:{id}:attendees',
              label: 'Event Attendees',
              resolver: vi.fn().mockResolvedValue(true),
            },
          ],
        });

        const activity = { to: ['context:ctx1:attendees'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(true);
      });

      it('denies when plugin resolver returns false', async () => {
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'MEMBER',
          status: 'APPROVED',
        });

        mockDb.context.findUnique.mockResolvedValue({
          id: 'ctx1',
          features: ['event-plugin'],
        });

        const mockPluginRegistry = pluginRegistry as { get: ReturnType<typeof vi.fn> };
        mockPluginRegistry.get.mockReturnValue({
          id: 'event-plugin',
          addressPatterns: [
            {
              pattern: 'context:{id}:attendees',
              label: 'Event Attendees',
              resolver: vi.fn().mockResolvedValue(false),
            },
          ],
        });

        const activity = { to: ['context:ctx1:attendees'], cc: [], actorId: 'user1' };

        expect(await canSeeActivity(activity, 'user2')).toBe(false);
      });
    });

    describe('multiple addresses', () => {
      it('returns true if any address matches', async () => {
        mockDb.follow.findUnique.mockResolvedValue(null);
        mockDb.membership.findUnique.mockResolvedValue({
          id: 'mem1',
          contextId: 'ctx1',
          userId: 'user2',
          role: 'MEMBER',
          status: 'APPROVED',
        });

        const activity = {
          to: ['followers', 'context:ctx1'],
          cc: [],
          actorId: 'user1',
        };

        expect(await canSeeActivity(activity, 'user2')).toBe(true);
      });
    });
  });

  describe('canSeeActivityWithReason', () => {
    it('returns visibility with reason', async () => {
      const activity = { to: ['public'], cc: [], actorId: 'user1' };

      const result = await canSeeActivityWithReason(activity, null);

      expect(result.visible).toBe(true);
      expect(result.reason).toBe('Public activity');
    });

    it('includes modifier in context reason', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        contextId: 'ctx1',
        userId: 'user2',
        role: 'ADMIN',
        status: 'APPROVED',
      });

      const activity = { to: ['context:ctx1:admins'], cc: [], actorId: 'user1' };

      const result = await canSeeActivityWithReason(activity, 'user2');

      expect(result.visible).toBe(true);
      expect(result.reason).toContain('admins');
    });
  });

  describe('filterVisibleActivities', () => {
    it('returns empty array for empty input', async () => {
      const result = await filterVisibleActivities([], 'user1');

      expect(result).toEqual([]);
    });

    it('filters to only visible activities', async () => {
      mockDb.follow.findUnique.mockResolvedValue(null);
      mockDb.membership.findUnique.mockResolvedValue(null);

      const activities = [
        { id: '1', to: ['public'], cc: [], actorId: 'user1' },
        { id: '2', to: ['followers'], cc: [], actorId: 'user1' },
        { id: '3', to: ['public'], cc: [], actorId: 'user2' },
      ];

      const result = await filterVisibleActivities(activities, 'user3');

      expect(result).toHaveLength(2);
      expect(result.map((a) => a.id)).toEqual(['1', '3']);
    });

    it('returns only public activities for unauthenticated users', async () => {
      const activities = [
        { id: '1', to: ['public'], cc: [], actorId: 'user1' },
        { id: '2', to: ['followers'], cc: [], actorId: 'user1' },
        { id: '3', to: ['user:user2'], cc: [], actorId: 'user1' },
      ];

      const result = await filterVisibleActivities(activities, null);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('anyAddressVisible', () => {
    it('checks if any address would be visible', async () => {
      const result = await anyAddressVisible(['public'], null, 'user1');

      expect(result).toBe(true);
    });

    it('returns false when no addresses visible', async () => {
      mockDb.follow.findUnique.mockResolvedValue(null);

      const result = await anyAddressVisible(['followers'], 'user2', 'user1');

      expect(result).toBe(false);
    });
  });

  describe('batchCheckFollowing', () => {
    it('returns set of followed user IDs', async () => {
      mockDb.follow.findMany.mockResolvedValue([
        { followingId: 'user2' },
        { followingId: 'user3' },
      ]);

      const result = await batchCheckFollowing('user1', ['user2', 'user3', 'user4']);

      expect(result).toEqual(new Set(['user2', 'user3']));
    });

    it('returns empty set for empty input', async () => {
      const result = await batchCheckFollowing('user1', []);

      expect(result).toEqual(new Set());
      expect(mockDb.follow.findMany).not.toHaveBeenCalled();
    });
  });

  describe('batchCheckMembership', () => {
    it('returns map of context IDs to roles', async () => {
      mockDb.membership.findMany.mockResolvedValue([
        { contextId: 'ctx1', role: 'MEMBER' },
        { contextId: 'ctx2', role: 'ADMIN' },
      ]);

      const result = await batchCheckMembership('user1', ['ctx1', 'ctx2', 'ctx3']);

      expect(result.get('ctx1')).toBe('MEMBER');
      expect(result.get('ctx2')).toBe('ADMIN');
      expect(result.has('ctx3')).toBe(false);
    });

    it('returns empty map for empty input', async () => {
      const result = await batchCheckMembership('user1', []);

      expect(result.size).toBe(0);
      expect(mockDb.membership.findMany).not.toHaveBeenCalled();
    });
  });
});
