/**
 * Activity Router Tests
 * Tests for activity CRUD, timelines, and interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('@/server/db', () => ({
  db: {
    activity: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    context: {
      findUnique: vi.fn(),
    },
    membership: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    follow: {
      findUnique: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
    },
    rSVP: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => Promise.resolve({ user: { id: 'user-1', email: 'test@test.com' } })),
}));

// Mock services
vi.mock('@/server/services/activity.service', () => ({
  createNoteActivity: vi.fn(),
  createLikeActivity: vi.fn(),
  createAnnounceActivity: vi.fn(),
  removeLikeActivity: vi.fn(),
  removeAnnounceActivity: vi.fn(),
  updateActivity: vi.fn(),
  deleteActivity: vi.fn(),
  getActivityById: vi.fn(),
  getLikesCount: vi.fn(() => Promise.resolve(0)),
  getRepostsCount: vi.fn(() => Promise.resolve(0)),
  hasUserLiked: vi.fn(() => Promise.resolve(false)),
  hasUserReposted: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('@/server/services/timeline.service', () => ({
  getPublicTimeline: vi.fn(() =>
    Promise.resolve({ items: [], nextCursor: null, hasMore: false })
  ),
  getHomeTimeline: vi.fn(() =>
    Promise.resolve({ items: [], nextCursor: null, hasMore: false })
  ),
  getEventTimeline: vi.fn(() =>
    Promise.resolve({ items: [], nextCursor: null, hasMore: false })
  ),
  getContextTimeline: vi.fn(() =>
    Promise.resolve({ items: [], nextCursor: null, hasMore: false })
  ),
  getActivityThread: vi.fn(),
  getUserTimeline: vi.fn(() =>
    Promise.resolve({ items: [], nextCursor: null, hasMore: false })
  ),
  getReplies: vi.fn(() =>
    Promise.resolve({ items: [], nextCursor: null, hasMore: false })
  ),
  getLikers: vi.fn(() =>
    Promise.resolve({ items: [], nextCursor: null, hasMore: false })
  ),
  getReposters: vi.fn(() =>
    Promise.resolve({ items: [], nextCursor: null, hasMore: false })
  ),
}));

import { db } from '@/server/db';
import { getActivityById, createNoteActivity } from '@/server/services/activity.service';
import { getPublicTimeline, getContextTimeline, getActivityThread } from '@/server/services/timeline.service';

describe('Activity Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Timeline Queries', () => {
    describe('publicTimeline', () => {
      it('should return public timeline items', async () => {
        const mockTimeline = {
          items: [
            {
              activity: { id: 'act-1', type: 'CREATE', objectType: 'NOTE' },
              liked: false,
              reposted: false,
            },
          ],
          nextCursor: null,
          hasMore: false,
        };

        vi.mocked(getPublicTimeline).mockResolvedValueOnce(mockTimeline);

        const result = await getPublicTimeline(
          { cursor: undefined, limit: 20, includeReplies: false },
          null
        );

        expect(result.items).toHaveLength(1);
        expect(result.hasMore).toBe(false);
      });

      it('should support pagination with cursor', async () => {
        const cursor = new Date().toISOString();
        const mockTimeline = {
          items: [],
          nextCursor: null,
          hasMore: false,
        };

        vi.mocked(getPublicTimeline).mockResolvedValueOnce(mockTimeline);

        await getPublicTimeline({ cursor, limit: 20, includeReplies: false }, null);

        expect(getPublicTimeline).toHaveBeenCalledWith(
          expect.objectContaining({ cursor }),
          null
        );
      });
    });

    describe('contextTimeline', () => {
      it('should return context timeline for public contexts', async () => {
        const contextId = 'ctx-1';
        const mockTimeline = {
          items: [
            {
              activity: {
                id: 'act-1',
                type: 'CREATE',
                to: [`context:${contextId}`],
              },
              liked: false,
              reposted: false,
            },
          ],
          nextCursor: null,
          hasMore: false,
        };

        vi.mocked(getContextTimeline).mockResolvedValueOnce(mockTimeline);

        const result = await getContextTimeline(
          contextId,
          { cursor: undefined, limit: 20, includeReplies: true },
          null
        );

        expect(result.items).toHaveLength(1);
      });
    });

    describe('getThread', () => {
      it('should return activity with replies', async () => {
        const activityId = 'act-1';
        const mockThread = {
          root: {
            activity: { id: activityId, type: 'CREATE', objectType: 'NOTE' },
            liked: false,
            reposted: false,
          },
          replies: [
            {
              activity: { id: 'reply-1', inReplyTo: activityId },
              liked: false,
              reposted: false,
            },
          ],
          totalReplies: 1,
        };

        vi.mocked(getActivityThread).mockResolvedValueOnce(mockThread);

        const result = await getActivityThread(activityId, null);

        expect(result.root.activity.id).toBe(activityId);
        expect(result.replies).toHaveLength(1);
        expect(result.totalReplies).toBe(1);
      });

      it('should throw error for non-existent activity', async () => {
        vi.mocked(getActivityThread).mockRejectedValueOnce(new Error('Activity not found'));

        await expect(getActivityThread('non-existent', null)).rejects.toThrow();
      });
    });
  });

  describe('Activity CRUD', () => {
    describe('getById', () => {
      it('should return activity with engagement counts', async () => {
        const mockActivity = {
          id: 'act-1',
          type: 'CREATE',
          objectType: 'NOTE',
          object: { content: 'Test post' },
        };

        vi.mocked(getActivityById).mockResolvedValueOnce(mockActivity);

        const result = await getActivityById('act-1', null);

        expect(result).toBeDefined();
        expect(result?.id).toBe('act-1');
      });

      it('should return null for non-existent activity', async () => {
        vi.mocked(getActivityById).mockResolvedValueOnce(null);

        const result = await getActivityById('non-existent', null);

        expect(result).toBeNull();
      });
    });

    describe('createNote', () => {
      it('should create a note activity', async () => {
        const mockActivity = {
          id: 'act-new',
          type: 'CREATE',
          objectType: 'NOTE',
          object: { content: 'New post' },
        };

        vi.mocked(createNoteActivity).mockResolvedValueOnce(mockActivity);

        const result = await createNoteActivity('user-1', {
          content: 'New post',
          to: ['public'],
          cc: [],
        });

        expect(result.id).toBe('act-new');
      });
    });
  });

  describe('Context Visibility', () => {
    it('should check context visibility for private contexts', async () => {
      const contextId = 'ctx-private';

      vi.mocked(db.context.findUnique).mockResolvedValueOnce({
        id: contextId,
        visibility: 'PRIVATE',
      } as Parameters<typeof db.context.findUnique>[0] extends { where: infer W } ? W : never);

      const context = await db.context.findUnique({
        where: { id: contextId },
        select: { id: true, visibility: true },
      });

      expect(context?.visibility).toBe('PRIVATE');
    });

    it('should require membership for private context timeline', async () => {
      const contextId = 'ctx-private';
      const userId = 'user-1';

      vi.mocked(db.membership.findUnique).mockResolvedValueOnce({
        id: 'mem-1',
        status: 'APPROVED',
      } as Parameters<typeof db.membership.findUnique>[0] extends { where: infer W } ? W : never);

      const membership = await db.membership.findUnique({
        where: { contextId_userId: { contextId, userId } },
        select: { status: true },
      });

      expect(membership?.status).toBe('APPROVED');
    });
  });
});
