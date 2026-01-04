/**
 * Delivery Service Tests
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
  deliverActivity,
  deliverActivityWithMentions,
  resolveRecipients,
  previewDelivery,
  deleteDelivery,
  markAsRead,
  markAllAsRead,
  batchDeliverActivities,
  updateDeliveryPriority,
} from './delivery';
import { db } from '@/server/db';
import { pluginRegistry } from '@/lib/plugins/registry';

// Cast for type safety in tests
const mockDb = db as unknown as MockPrismaClient;

describe('Delivery Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for createMany
    mockDb.inboxItem.createMany.mockResolvedValue({ count: 0 });
  });

  describe('deliverActivity', () => {
    it('delivers to direct user addresses', async () => {
      const activity = {
        id: 'act1',
        type: 'CREATE',
        actorId: 'user1',
        to: ['user:user2', 'user:user3'],
        cc: [],
      };

      const count = await deliverActivity(activity);

      expect(count).toBe(2);
      expect(mockDb.inboxItem.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'user2', activityId: 'act1' }),
          expect.objectContaining({ userId: 'user3', activityId: 'act1' }),
        ]),
        skipDuplicates: true,
      });
    });

    it('excludes the actor from delivery', async () => {
      const activity = {
        id: 'act1',
        type: 'CREATE',
        actorId: 'user1',
        to: ['user:user1', 'user:user2'],
        cc: [],
      };

      const count = await deliverActivity(activity);

      expect(count).toBe(1);
      expect(mockDb.inboxItem.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ userId: 'user2' })],
        skipDuplicates: true,
      });
    });

    it('returns 0 for public-only activities', async () => {
      const activity = {
        id: 'act1',
        type: 'CREATE',
        actorId: 'user1',
        to: ['public'],
        cc: [],
      };

      const count = await deliverActivity(activity);

      expect(count).toBe(0);
      expect(mockDb.inboxItem.createMany).not.toHaveBeenCalled();
    });

    it('delivers to followers', async () => {
      mockDb.follow.findMany.mockResolvedValue([
        { followerId: 'follower1' },
        { followerId: 'follower2' },
      ]);

      const activity = {
        id: 'act1',
        type: 'CREATE',
        actorId: 'user1',
        to: ['followers'],
        cc: [],
      };

      const count = await deliverActivity(activity);

      expect(count).toBe(2);
      expect(mockDb.follow.findMany).toHaveBeenCalledWith({
        where: { followingId: 'user1', status: 'ACCEPTED' },
        select: { followerId: true },
      });
    });

    it('delivers to context members', async () => {
      mockDb.membership.findMany.mockResolvedValue([
        { userId: 'member1' },
        { userId: 'member2' },
        { userId: 'member3' },
      ]);

      const activity = {
        id: 'act1',
        type: 'CREATE',
        actorId: 'user1',
        to: ['context:ctx1'],
        cc: [],
      };

      const count = await deliverActivity(activity);

      expect(count).toBe(3);
      expect(mockDb.membership.findMany).toHaveBeenCalledWith({
        where: { contextId: 'ctx1', status: 'APPROVED' },
        select: { userId: true },
      });
    });

    it('filters context members by admins modifier', async () => {
      mockDb.membership.findMany.mockResolvedValue([
        { userId: 'admin1' },
        { userId: 'owner1' },
      ]);

      const activity = {
        id: 'act1',
        type: 'CREATE',
        actorId: 'user1',
        to: ['context:ctx1:admins'],
        cc: [],
      };

      await deliverActivity(activity);

      expect(mockDb.membership.findMany).toHaveBeenCalledWith({
        where: {
          contextId: 'ctx1',
          status: 'APPROVED',
          role: { in: ['OWNER', 'ADMIN'] },
        },
        select: { userId: true },
      });
    });

    it('filters context members by moderators modifier', async () => {
      mockDb.membership.findMany.mockResolvedValue([
        { userId: 'mod1' },
      ]);

      const activity = {
        id: 'act1',
        type: 'CREATE',
        actorId: 'user1',
        to: ['context:ctx1:moderators'],
        cc: [],
      };

      await deliverActivity(activity);

      expect(mockDb.membership.findMany).toHaveBeenCalledWith({
        where: {
          contextId: 'ctx1',
          status: 'APPROVED',
          role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] },
        },
        select: { userId: true },
      });
    });

    it('filters context members by role modifier', async () => {
      mockDb.membership.findMany.mockResolvedValue([{ userId: 'member1' }]);

      const activity = {
        id: 'act1',
        type: 'CREATE',
        actorId: 'user1',
        to: ['context:ctx1:role:MEMBER'],
        cc: [],
      };

      await deliverActivity(activity);

      expect(mockDb.membership.findMany).toHaveBeenCalledWith({
        where: {
          contextId: 'ctx1',
          status: 'APPROVED',
          role: 'MEMBER',
        },
        select: { userId: true },
      });
    });

    it('assigns correct category for LIKE activities', async () => {
      const activity = {
        id: 'act1',
        type: 'LIKE',
        actorId: 'user1',
        to: ['user:user2'],
        cc: [],
      };

      await deliverActivity(activity);

      expect(mockDb.inboxItem.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ category: 'LIKE' })],
        skipDuplicates: true,
      });
    });

    it('assigns correct category for ANNOUNCE activities', async () => {
      const activity = {
        id: 'act1',
        type: 'ANNOUNCE',
        actorId: 'user1',
        to: ['user:user2'],
        cc: [],
      };

      await deliverActivity(activity);

      expect(mockDb.inboxItem.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ category: 'REPOST' })],
        skipDuplicates: true,
      });
    });

    it('assigns correct category for FOLLOW activities', async () => {
      const activity = {
        id: 'act1',
        type: 'FOLLOW',
        actorId: 'user1',
        to: ['user:user2'],
        cc: [],
      };

      await deliverActivity(activity);

      expect(mockDb.inboxItem.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ category: 'FOLLOW' })],
        skipDuplicates: true,
      });
    });

    it('assigns correct category for RSVP activities', async () => {
      const activity = {
        id: 'act1',
        type: 'RSVP',
        actorId: 'user1',
        to: ['user:user2'],
        cc: [],
      };

      await deliverActivity(activity);

      expect(mockDb.inboxItem.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ category: 'EVENT' })],
        skipDuplicates: true,
      });
    });

    it('assigns correct category for JOIN activities', async () => {
      const activity = {
        id: 'act1',
        type: 'JOIN',
        actorId: 'user1',
        to: ['user:user2'],
        cc: [],
      };

      await deliverActivity(activity);

      expect(mockDb.inboxItem.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ category: 'GROUP' })],
        skipDuplicates: true,
      });
    });

    it('deduplicates recipients from multiple addresses', async () => {
      mockDb.follow.findMany.mockResolvedValue([{ followerId: 'user2' }]);

      const activity = {
        id: 'act1',
        type: 'CREATE',
        actorId: 'user1',
        to: ['user:user2', 'followers'],
        cc: [],
      };

      const count = await deliverActivity(activity);

      expect(count).toBe(1); // user2 appears in both, but only delivered once
    });
  });

  describe('deliverActivityWithMentions', () => {
    it('extracts mentions from content and delivers', async () => {
      mockDb.user.findMany.mockResolvedValue([
        { id: 'mentioned1' },
        { id: 'mentioned2' },
      ]);

      const activity = {
        id: 'act1',
        type: 'CREATE',
        actorId: 'user1',
        to: ['public'],
        cc: [],
        object: { content: 'Hello @alice and @bob!' },
      };

      const result = await deliverActivityWithMentions(activity);

      expect(mockDb.user.findMany).toHaveBeenCalledWith({
        where: { username: { in: ['alice', 'bob'] } },
        select: { id: true },
      });

      // Should create mention notifications with priority
      expect(mockDb.inboxItem.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            category: 'MENTION',
            priority: 1,
          }),
        ]),
        skipDuplicates: true,
      });

      expect(result.mentioned).toBe(2);
    });

    it('uses explicit mentions array when provided', async () => {
      mockDb.user.findMany.mockResolvedValue([]);

      const activity = {
        id: 'act1',
        type: 'CREATE',
        actorId: 'user1',
        to: ['public'],
        cc: [],
        object: { mentions: ['alice', 'bob'] },
      };

      await deliverActivityWithMentions(activity);

      expect(mockDb.user.findMany).toHaveBeenCalledWith({
        where: { username: { in: ['alice', 'bob'] } },
        select: { id: true },
      });
    });

    it('excludes actor from mentions', async () => {
      mockDb.user.findMany.mockResolvedValue([{ id: 'user1' }]);

      const activity = {
        id: 'act1',
        type: 'CREATE',
        actorId: 'user1',
        to: ['public'],
        cc: [],
        object: { content: 'Testing @myself' },
      };

      const result = await deliverActivityWithMentions(activity);

      expect(result.mentioned).toBe(0);
    });
  });

  describe('resolveRecipients', () => {
    it('combines recipients from all addresses', async () => {
      mockDb.follow.findMany.mockResolvedValue([{ followerId: 'follower1' }]);
      mockDb.membership.findMany.mockResolvedValue([{ userId: 'member1' }]);

      const activity = {
        actorId: 'user1',
        to: ['user:user2', 'followers'],
        cc: ['context:ctx1'],
      };

      const recipients = await resolveRecipients(activity);

      expect(recipients.size).toBe(3);
      expect(recipients.has('user2')).toBe(true);
      expect(recipients.has('follower1')).toBe(true);
      expect(recipients.has('member1')).toBe(true);
    });
  });

  describe('previewDelivery', () => {
    it('returns delivery preview without creating inbox items', async () => {
      mockDb.follow.findMany.mockResolvedValue([{ followerId: 'f1' }]);

      const activity = {
        actorId: 'user1',
        to: ['public', 'followers'],
        cc: ['context:ctx1', 'user:user2'],
      };

      const preview = await previewDelivery(activity);

      expect(preview.hasPublic).toBe(true);
      expect(preview.hasFollowers).toBe(true);
      expect(preview.contextIds).toEqual(['ctx1']);
      expect(preview.directUserIds).toEqual(['user2']);
      expect(mockDb.inboxItem.createMany).not.toHaveBeenCalled();
    });
  });

  describe('deleteDelivery', () => {
    it('deletes all inbox items for an activity', async () => {
      mockDb.inboxItem.deleteMany.mockResolvedValue({ count: 5 });

      const count = await deleteDelivery('act1');

      expect(count).toBe(5);
      expect(mockDb.inboxItem.deleteMany).toHaveBeenCalledWith({
        where: { activityId: 'act1' },
      });
    });
  });

  describe('markAsRead', () => {
    it('marks specific inbox item as read', async () => {
      mockDb.inboxItem.update.mockResolvedValue({});

      await markAsRead('act1', 'user1');

      expect(mockDb.inboxItem.update).toHaveBeenCalledWith({
        where: {
          userId_activityId: { userId: 'user1', activityId: 'act1' },
        },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('marks all unread items as read', async () => {
      mockDb.inboxItem.updateMany.mockResolvedValue({ count: 10 });

      const count = await markAllAsRead('user1');

      expect(count).toBe(10);
      expect(mockDb.inboxItem.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user1', read: false },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      });
    });

    it('filters by category when provided', async () => {
      mockDb.inboxItem.updateMany.mockResolvedValue({ count: 3 });

      await markAllAsRead('user1', 'MENTION');

      expect(mockDb.inboxItem.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user1', read: false, category: 'MENTION' },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('batchDeliverActivities', () => {
    it('delivers multiple activities efficiently', async () => {
      const activities = [
        { id: 'act1', type: 'CREATE', actorId: 'user1', to: ['user:user2'], cc: [] },
        { id: 'act2', type: 'LIKE', actorId: 'user3', to: ['user:user4'], cc: [] },
      ];

      const count = await batchDeliverActivities(activities);

      expect(count).toBe(2);
      expect(mockDb.inboxItem.createMany).toHaveBeenCalledTimes(1);
    });

    it('returns 0 for empty input', async () => {
      const count = await batchDeliverActivities([]);

      expect(count).toBe(0);
      expect(mockDb.inboxItem.createMany).not.toHaveBeenCalled();
    });
  });

  describe('updateDeliveryPriority', () => {
    it('updates priority for activity inbox items', async () => {
      mockDb.inboxItem.updateMany.mockResolvedValue({ count: 5 });

      const count = await updateDeliveryPriority('act1', 2);

      expect(count).toBe(5);
      expect(mockDb.inboxItem.updateMany).toHaveBeenCalledWith({
        where: { activityId: 'act1' },
        data: { priority: 2 },
      });
    });

    it('filters by category when provided', async () => {
      mockDb.inboxItem.updateMany.mockResolvedValue({ count: 2 });

      await updateDeliveryPriority('act1', 3, 'MENTION');

      expect(mockDb.inboxItem.updateMany).toHaveBeenCalledWith({
        where: { activityId: 'act1', category: 'MENTION' },
        data: { priority: 3 },
      });
    });
  });

  describe('plugin address patterns', () => {
    it('resolves plugin-defined address patterns', async () => {
      mockDb.context.findUnique.mockResolvedValue({
        id: 'ctx1',
        features: ['event-plugin'],
      });

      mockDb.membership.findMany.mockResolvedValue([
        { userId: 'member1' },
        { userId: 'member2' },
      ]);

      const mockResolver = vi.fn()
        .mockResolvedValueOnce(true) // member1 is attendee
        .mockResolvedValueOnce(false); // member2 is not

      const mockPluginRegistry = pluginRegistry as { get: ReturnType<typeof vi.fn> };
      mockPluginRegistry.get.mockReturnValue({
        id: 'event-plugin',
        addressPatterns: [
          {
            pattern: 'context:{id}:attendees',
            label: 'Event Attendees',
            resolver: mockResolver,
          },
        ],
      });

      const activity = {
        id: 'act1',
        type: 'CREATE',
        actorId: 'user1',
        to: ['context:ctx1:attendees'],
        cc: [],
      };

      const count = await deliverActivity(activity);

      expect(count).toBe(1);
      expect(mockResolver).toHaveBeenCalledTimes(2);
    });
  });
});
