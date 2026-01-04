/**
 * Context Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { createMockPrismaClient, type MockPrismaClient } from '@/test/mocks/prisma';
import { pluginRegistry } from '@/lib/plugins';
import { z } from 'zod';

// Mock the database
vi.mock('@/server/db', () => ({
  db: createMockPrismaClient(),
}));

// Import after mocking
import { contextService } from './context.service';
import { db } from '@/server/db';

// Cast for type safety in tests
const mockDb = db as unknown as MockPrismaClient;

// Test data
const mockUser = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: null,
};

const mockContext = {
  id: 'ctx-1',
  type: 'GROUP' as const,
  slug: 'test-group',
  handle: null,
  name: 'Test Group',
  description: 'A test group',
  avatarUrl: null,
  bannerUrl: null,
  ownerId: 'user-1',
  visibility: 'PUBLIC' as const,
  joinPolicy: 'OPEN' as const,
  plugins: {},
  features: [],
  isArchived: false,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: mockUser,
  _count: { memberships: 1 },
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
};

// Mock plugin
const mockPlugin = {
  id: 'test-plugin',
  name: 'Test Plugin',
  description: 'A test plugin',
  version: '1.0.0',
  contextTypes: ['GROUP' as const, 'EVENT' as const],
  dataSchema: z.object({
    setting: z.string().optional(),
  }),
  defaultData: {},
  hooks: {},
};

describe('contextService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Register test plugin
    pluginRegistry.register(mockPlugin);
  });

  describe('getById', () => {
    it('returns context when found', async () => {
      mockDb.context.findUnique.mockResolvedValue(mockContext);

      const result = await contextService.getById('ctx-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('ctx-1');
      expect(result?.name).toBe('Test Group');
    });

    it('returns null when not found', async () => {
      mockDb.context.findUnique.mockResolvedValue(null);

      const result = await contextService.getById('nonexistent');

      expect(result).toBeNull();
    });

    it('includes user membership when userId provided', async () => {
      mockDb.context.findUnique.mockResolvedValue(mockContext);
      mockDb.membership.findUnique.mockResolvedValue(mockMembership);

      const result = await contextService.getById('ctx-1', 'user-1');

      expect(result?.userMembership).toBeDefined();
      expect(result?.userMembership?.role).toBe('OWNER');
    });
  });

  describe('getBySlug', () => {
    it('returns context when found', async () => {
      mockDb.context.findUnique
        .mockResolvedValueOnce(mockContext) // First call in getBySlug
        .mockResolvedValueOnce(mockContext); // Second call in getById

      const result = await contextService.getBySlug('test-group');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('test-group');
    });
  });

  describe('canAccess', () => {
    it('returns true for public context', async () => {
      mockDb.context.findUnique.mockResolvedValue({
        ...mockContext,
        visibility: 'PUBLIC',
      });

      const result = await contextService.canAccess('ctx-1');

      expect(result).toBe(true);
    });

    it('returns true for unlisted context', async () => {
      mockDb.context.findUnique.mockResolvedValue({
        ...mockContext,
        visibility: 'UNLISTED',
      });

      const result = await contextService.canAccess('ctx-1');

      expect(result).toBe(true);
    });

    it('returns false for private context without membership', async () => {
      mockDb.context.findUnique.mockResolvedValue({
        ...mockContext,
        visibility: 'PRIVATE',
      });
      mockDb.membership.findUnique.mockResolvedValue(null);

      const result = await contextService.canAccess('ctx-1', 'user-2');

      expect(result).toBe(false);
    });

    it('returns true for private context with approved membership', async () => {
      mockDb.context.findUnique.mockResolvedValue({
        ...mockContext,
        visibility: 'PRIVATE',
      });
      mockDb.membership.findUnique.mockResolvedValue(mockMembership);

      const result = await contextService.canAccess('ctx-1', 'user-1');

      expect(result).toBe(true);
    });

    it('returns false for nonexistent context', async () => {
      mockDb.context.findUnique.mockResolvedValue(null);

      const result = await contextService.canAccess('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('returns paginated contexts', async () => {
      mockDb.context.findMany.mockResolvedValue([mockContext]);

      const result = await contextService.list({ limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeUndefined();
    });

    it('returns nextCursor when more items exist', async () => {
      const contexts = Array(11)
        .fill(null)
        .map((_, i) => ({ ...mockContext, id: `ctx-${i}` }));
      mockDb.context.findMany.mockResolvedValue(contexts);

      const result = await contextService.list({ limit: 10 });

      expect(result.items).toHaveLength(10);
      expect(result.nextCursor).toBe('ctx-9');
    });

    it('filters by type', async () => {
      mockDb.context.findMany.mockResolvedValue([mockContext]);

      await contextService.list({ type: 'GROUP' });

      expect(mockDb.context.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'GROUP' }),
        })
      );
    });
  });

  describe('join', () => {
    it('creates membership for open context', async () => {
      mockDb.context.findUnique.mockResolvedValue({
        ...mockContext,
        joinPolicy: 'OPEN',
      });
      mockDb.membership.findUnique.mockResolvedValue(null);
      mockDb.membership.create.mockResolvedValue({
        ...mockMembership,
        role: 'MEMBER',
        status: 'APPROVED',
      });

      const result = await contextService.join('ctx-1', 'user-2');

      expect(result.pending).toBe(false);
      expect(result.membership.status).toBe('APPROVED');
    });

    it('creates pending membership for approval-required context', async () => {
      mockDb.context.findUnique.mockResolvedValue({
        ...mockContext,
        joinPolicy: 'APPROVAL',
      });
      mockDb.membership.findUnique.mockResolvedValue(null);
      mockDb.membership.create.mockResolvedValue({
        ...mockMembership,
        role: 'MEMBER',
        status: 'PENDING',
      });

      const result = await contextService.join('ctx-1', 'user-2');

      expect(result.pending).toBe(true);
    });

    it('throws for closed context', async () => {
      mockDb.context.findUnique.mockResolvedValue({
        ...mockContext,
        joinPolicy: 'CLOSED',
      });

      await expect(contextService.join('ctx-1', 'user-2')).rejects.toThrow(
        TRPCError
      );
    });

    it('throws for invite-only context', async () => {
      mockDb.context.findUnique.mockResolvedValue({
        ...mockContext,
        joinPolicy: 'INVITE',
      });

      await expect(contextService.join('ctx-1', 'user-2')).rejects.toThrow(
        TRPCError
      );
    });

    it('throws if already a member', async () => {
      mockDb.context.findUnique.mockResolvedValue(mockContext);
      mockDb.membership.findUnique.mockResolvedValue(mockMembership);

      await expect(contextService.join('ctx-1', 'user-1')).rejects.toThrow(
        'Already a member'
      );
    });
  });

  describe('leave', () => {
    it('updates membership status to LEFT', async () => {
      mockDb.context.findUnique.mockResolvedValue(mockContext);
      mockDb.membership.findUnique.mockResolvedValue({
        ...mockMembership,
        userId: 'user-2',
        role: 'MEMBER',
      });
      mockDb.membership.update.mockResolvedValue({
        ...mockMembership,
        status: 'LEFT',
      });

      await contextService.leave('ctx-1', 'user-2');

      expect(mockDb.membership.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'LEFT' },
        })
      );
    });

    it('throws if owner tries to leave', async () => {
      mockDb.context.findUnique.mockResolvedValue(mockContext);

      await expect(contextService.leave('ctx-1', 'user-1')).rejects.toThrow(
        'Owner cannot leave'
      );
    });

    it('throws if not a member', async () => {
      mockDb.context.findUnique.mockResolvedValue(mockContext);
      mockDb.membership.findUnique.mockResolvedValue(null);

      await expect(contextService.leave('ctx-1', 'user-2')).rejects.toThrow(
        'Not a member'
      );
    });
  });

  describe('archive', () => {
    it('archives context when called by owner', async () => {
      mockDb.context.findUnique.mockResolvedValue(mockContext);
      mockDb.context.update.mockResolvedValue({
        ...mockContext,
        isArchived: true,
      });

      await contextService.archive('ctx-1', 'user-1');

      expect(mockDb.context.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isArchived: true }),
        })
      );
    });

    it('throws if not owner', async () => {
      mockDb.context.findUnique.mockResolvedValue(mockContext);

      await expect(contextService.archive('ctx-1', 'user-2')).rejects.toThrow(
        'Only the owner can archive'
      );
    });
  });
});
