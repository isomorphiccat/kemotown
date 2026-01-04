/**
 * Membership Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockPrismaClient, type MockPrismaClient } from '@/test/mocks/prisma';

// Mock the database
vi.mock('@/server/db', () => ({
  db: createMockPrismaClient(),
}));

// Import after mocking
import { membershipService } from './membership.service';
import { db } from '@/server/db';

// Cast for type safety in tests
const mockDb = db as unknown as MockPrismaClient;

// Test data
const mockUser = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: null,
  species: 'Fox',
  lastActiveAt: new Date(),
};

const mockContext = {
  id: 'ctx-1',
  type: 'GROUP' as const,
  slug: 'test-group',
  name: 'Test Group',
  ownerId: 'user-1',
  visibility: 'PUBLIC' as const,
  joinPolicy: 'OPEN' as const,
  plugins: {},
  features: [],
  isArchived: false,
};

const mockMembership = {
  id: 'mem-1',
  contextId: 'ctx-1',
  userId: 'user-1',
  role: 'OWNER' as const,
  status: 'APPROVED' as const,
  permissions: null,
  notifyPosts: true,
  notifyMentions: true,
  notifyEvents: true,
  pluginData: {},
  joinedAt: new Date(),
  approvedAt: new Date(),
  approvedBy: null,
  user: mockUser,
};

describe('membershipService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('returns membership when found', async () => {
      mockDb.membership.findUnique.mockResolvedValue(mockMembership);

      const result = await membershipService.get('ctx-1', 'user-1');

      expect(result).toBeDefined();
      expect(result?.role).toBe('OWNER');
      expect(result?.user.username).toBe('testuser');
    });

    it('returns null when not found', async () => {
      mockDb.membership.findUnique.mockResolvedValue(null);

      const result = await membershipService.get('ctx-1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('returns paginated memberships', async () => {
      mockDb.membership.findMany.mockResolvedValue([mockMembership]);

      const result = await membershipService.list({
        contextId: 'ctx-1',
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeUndefined();
    });

    it('returns nextCursor when more items exist', async () => {
      const memberships = Array(11)
        .fill(null)
        .map((_, i) => ({ ...mockMembership, id: `mem-${i}` }));
      mockDb.membership.findMany.mockResolvedValue(memberships);

      const result = await membershipService.list({
        contextId: 'ctx-1',
        limit: 10,
      });

      expect(result.items).toHaveLength(10);
      expect(result.nextCursor).toBe('mem-9');
    });

    it('filters by status', async () => {
      mockDb.membership.findMany.mockResolvedValue([mockMembership]);

      await membershipService.list({
        contextId: 'ctx-1',
        status: 'PENDING',
      });

      expect(mockDb.membership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        })
      );
    });

    it('filters by role', async () => {
      mockDb.membership.findMany.mockResolvedValue([mockMembership]);

      await membershipService.list({
        contextId: 'ctx-1',
        role: 'ADMIN',
      });

      expect(mockDb.membership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'ADMIN' }),
        })
      );
    });
  });

  describe('countByStatus', () => {
    it('returns counts for each status', async () => {
      mockDb.membership.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: 5 },
        { status: 'PENDING', _count: 2 },
      ]);

      const result = await membershipService.countByStatus('ctx-1');

      expect(result.APPROVED).toBe(5);
      expect(result.PENDING).toBe(2);
      expect(result.BANNED).toBe(0);
      expect(result.LEFT).toBe(0);
    });
  });

  describe('updateRole', () => {
    it('updates member role when actor is owner', async () => {
      mockDb.membership.findUnique
        .mockResolvedValueOnce({ ...mockMembership, role: 'OWNER' }) // actor
        .mockResolvedValueOnce({ ...mockMembership, id: 'mem-2', userId: 'user-2', role: 'MEMBER' }); // target
      mockDb.context.findUnique.mockResolvedValue(mockContext);
      mockDb.membership.update.mockResolvedValue({
        ...mockMembership,
        id: 'mem-2',
        userId: 'user-2',
        role: 'MODERATOR',
      });

      const result = await membershipService.updateRole(
        'ctx-1',
        'user-2',
        'MODERATOR',
        'user-1'
      );

      expect(result.role).toBe('MODERATOR');
    });

    it('throws when actor is not admin or owner', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        ...mockMembership,
        role: 'MEMBER',
      });

      await expect(
        membershipService.updateRole('ctx-1', 'user-2', 'MODERATOR', 'user-3')
      ).rejects.toThrow('Insufficient permissions');
    });

    it('throws when trying to change owner role', async () => {
      mockDb.membership.findUnique
        .mockResolvedValueOnce({ ...mockMembership, role: 'ADMIN' }) // actor
        .mockResolvedValueOnce({ ...mockMembership, role: 'OWNER' }); // target
      mockDb.context.findUnique.mockResolvedValue(mockContext);

      await expect(
        membershipService.updateRole('ctx-1', 'user-1', 'ADMIN', 'user-2')
      ).rejects.toThrow('Cannot change owner role');
    });

    it('throws when non-owner tries to promote to admin', async () => {
      mockDb.membership.findUnique
        .mockResolvedValueOnce({ ...mockMembership, role: 'ADMIN' }) // actor
        .mockResolvedValueOnce({ ...mockMembership, id: 'mem-2', userId: 'user-2', role: 'MEMBER' }); // target
      mockDb.context.findUnique.mockResolvedValue({ ...mockContext, ownerId: 'user-3' });

      await expect(
        membershipService.updateRole('ctx-1', 'user-2', 'ADMIN', 'user-1')
      ).rejects.toThrow('Only the owner can promote');
    });
  });

  describe('approve', () => {
    it('approves pending membership', async () => {
      mockDb.membership.findUnique
        .mockResolvedValueOnce({ ...mockMembership, role: 'ADMIN' }) // actor
        .mockResolvedValueOnce({ ...mockMembership, id: 'mem-2', userId: 'user-2', status: 'PENDING' }); // target
      mockDb.membership.update.mockResolvedValue({
        ...mockMembership,
        id: 'mem-2',
        userId: 'user-2',
        status: 'APPROVED',
        approvedBy: 'user-1',
      });
      mockDb.context.findUnique.mockResolvedValue(mockContext);

      const result = await membershipService.approve('ctx-1', 'user-2', 'user-1');

      expect(result.status).toBe('APPROVED');
      expect(mockDb.membership.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'APPROVED',
            approvedBy: 'user-1',
          }),
        })
      );
    });

    it('throws when membership is not pending', async () => {
      mockDb.membership.findUnique
        .mockResolvedValueOnce({ ...mockMembership, role: 'ADMIN' }) // actor
        .mockResolvedValueOnce({ ...mockMembership, status: 'APPROVED' }); // target

      await expect(
        membershipService.approve('ctx-1', 'user-2', 'user-1')
      ).rejects.toThrow('not pending');
    });

    it('throws when actor lacks permission', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        ...mockMembership,
        role: 'MEMBER',
      });

      await expect(
        membershipService.approve('ctx-1', 'user-2', 'user-3')
      ).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('ban', () => {
    it('bans member when actor has permission', async () => {
      mockDb.membership.findUnique
        .mockResolvedValueOnce({ ...mockMembership, role: 'ADMIN' }) // actor
        .mockResolvedValueOnce({ ...mockMembership, id: 'mem-2', userId: 'user-2', role: 'MEMBER' }); // target
      mockDb.context.findUnique.mockResolvedValue({ ...mockContext, ownerId: 'user-3' });
      mockDb.membership.update.mockResolvedValue({
        ...mockMembership,
        id: 'mem-2',
        userId: 'user-2',
        status: 'BANNED',
      });

      const result = await membershipService.ban('ctx-1', 'user-2', 'user-1');

      expect(result.status).toBe('BANNED');
    });

    it('throws when trying to ban owner', async () => {
      mockDb.membership.findUnique
        .mockResolvedValueOnce({ ...mockMembership, role: 'ADMIN' }) // actor
        .mockResolvedValueOnce({ ...mockMembership, role: 'OWNER' }); // target
      mockDb.context.findUnique.mockResolvedValue(mockContext);

      await expect(
        membershipService.ban('ctx-1', 'user-1', 'user-2')
      ).rejects.toThrow('Cannot ban the owner');
    });

    it('throws when trying to ban equal or higher role', async () => {
      mockDb.membership.findUnique
        .mockResolvedValueOnce({ ...mockMembership, role: 'MODERATOR' }) // actor
        .mockResolvedValueOnce({ ...mockMembership, id: 'mem-2', userId: 'user-2', role: 'ADMIN' }); // target
      mockDb.context.findUnique.mockResolvedValue({ ...mockContext, ownerId: 'user-3' });

      await expect(
        membershipService.ban('ctx-1', 'user-2', 'user-1')
      ).rejects.toThrow('Cannot ban member with equal or higher role');
    });
  });

  describe('unban', () => {
    it('unbans banned member', async () => {
      mockDb.membership.findUnique
        .mockResolvedValueOnce({ ...mockMembership, role: 'ADMIN' }) // actor
        .mockResolvedValueOnce({ ...mockMembership, id: 'mem-2', userId: 'user-2', status: 'BANNED' }); // target
      mockDb.membership.update.mockResolvedValue({
        ...mockMembership,
        id: 'mem-2',
        userId: 'user-2',
        status: 'APPROVED',
      });

      const result = await membershipService.unban('ctx-1', 'user-2', 'user-1');

      expect(result.status).toBe('APPROVED');
    });

    it('throws when member is not banned', async () => {
      mockDb.membership.findUnique
        .mockResolvedValueOnce({ ...mockMembership, role: 'ADMIN' }) // actor
        .mockResolvedValueOnce({ ...mockMembership, status: 'APPROVED' }); // target

      await expect(
        membershipService.unban('ctx-1', 'user-2', 'user-1')
      ).rejects.toThrow('not banned');
    });
  });

  describe('updateNotifications', () => {
    it('updates notification preferences', async () => {
      mockDb.membership.update.mockResolvedValue({
        ...mockMembership,
        notifyPosts: false,
        notifyMentions: true,
      });

      const result = await membershipService.updateNotifications(
        'ctx-1',
        'user-1',
        { notifyPosts: false }
      );

      expect(result.notifyPosts).toBe(false);
      expect(mockDb.membership.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ notifyPosts: false }),
        })
      );
    });
  });

  describe('getUserMemberships', () => {
    it('returns user memberships with context info', async () => {
      mockDb.membership.findMany.mockResolvedValue([
        {
          ...mockMembership,
          context: {
            id: 'ctx-1',
            type: 'GROUP',
            slug: 'test-group',
            name: 'Test Group',
            avatarUrl: null,
          },
        },
      ]);

      const result = await membershipService.getUserMemberships('user-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].context.name).toBe('Test Group');
    });
  });
});
