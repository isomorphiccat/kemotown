/**
 * Permission System Tests
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
  checkPermission,
  roleHasPermission,
  roleHasPluginPermission,
  getPermissionsForRole,
  getMembershipPermissions,
  hasPermission,
  hasPermissionWithReason,
  getPermissionsFromDb,
  canActOnActivity,
  hasAllPermissions,
  hasAnyPermission,
  requirePermission,
  requireAnyPermission,
  requireMembership,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  isHigherRole,
  isEqualOrHigherRole,
  getRolesAtOrAbove,
  getRolesBelow,
} from './index';
import { db } from '@/server/db';
import { pluginRegistry } from '@/lib/plugins/registry';
import type { PermissionContext } from './types';

// Cast for type safety in tests
const mockDb = db as unknown as MockPrismaClient;

describe('Permission System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Role Hierarchy Tests
  // =========================================================================

  describe('Role Hierarchy', () => {
    it('has correct role order', () => {
      expect(ROLE_HIERARCHY).toEqual([
        'OWNER',
        'ADMIN',
        'MODERATOR',
        'MEMBER',
        'GUEST',
      ]);
    });

    it('isHigherRole returns true for higher roles', () => {
      expect(isHigherRole('OWNER', 'ADMIN')).toBe(true);
      expect(isHigherRole('ADMIN', 'MODERATOR')).toBe(true);
      expect(isHigherRole('MODERATOR', 'MEMBER')).toBe(true);
    });

    it('isHigherRole returns false for equal or lower roles', () => {
      expect(isHigherRole('ADMIN', 'OWNER')).toBe(false);
      expect(isHigherRole('MEMBER', 'MEMBER')).toBe(false);
    });

    it('isEqualOrHigherRole includes same role', () => {
      expect(isEqualOrHigherRole('ADMIN', 'ADMIN')).toBe(true);
      expect(isEqualOrHigherRole('OWNER', 'MEMBER')).toBe(true);
    });

    it('getRolesAtOrAbove returns correct roles', () => {
      expect(getRolesAtOrAbove('MODERATOR')).toEqual([
        'OWNER',
        'ADMIN',
        'MODERATOR',
      ]);
    });

    it('getRolesBelow returns correct roles', () => {
      expect(getRolesBelow('MODERATOR')).toEqual(['MEMBER', 'GUEST']);
    });
  });

  // =========================================================================
  // Role Permissions Tests
  // =========================================================================

  describe('Role Permissions', () => {
    it('OWNER has all permissions', () => {
      const ownerPerms = ROLE_PERMISSIONS.OWNER;
      expect(ownerPerms).toContain('context.delete');
      expect(ownerPerms).toContain('member.update_role');
    });

    it('ADMIN cannot delete context', () => {
      const adminPerms = ROLE_PERMISSIONS.ADMIN;
      expect(adminPerms).not.toContain('context.delete');
    });

    it('MEMBER can create activities', () => {
      const memberPerms = ROLE_PERMISSIONS.MEMBER;
      expect(memberPerms).toContain('activity.create');
    });

    it('GUEST can only view', () => {
      expect(ROLE_PERMISSIONS.GUEST).toEqual(['context.view']);
    });
  });

  // =========================================================================
  // In-Memory Permission Checks
  // =========================================================================

  describe('roleHasPermission', () => {
    it('returns true for valid role permission', () => {
      expect(roleHasPermission('OWNER', 'context.delete')).toBe(true);
    });

    it('returns false for invalid role permission', () => {
      expect(roleHasPermission('MEMBER', 'context.delete')).toBe(false);
    });
  });

  describe('roleHasPluginPermission', () => {
    it('returns true when role has plugin permission', () => {
      const mockPluginRegistry = pluginRegistry as { get: ReturnType<typeof vi.fn> };
      mockPluginRegistry.get.mockReturnValue({
        id: 'events',
        permissions: [
          {
            id: 'manage_rsvp',
            name: 'Manage RSVPs',
            description: 'Can manage event RSVPs',
            defaultRoles: ['OWNER', 'ADMIN'],
          },
        ],
      });

      expect(roleHasPluginPermission('ADMIN', 'plugin.events.manage_rsvp')).toBe(true);
    });

    it('returns false when role lacks plugin permission', () => {
      const mockPluginRegistry = pluginRegistry as { get: ReturnType<typeof vi.fn> };
      mockPluginRegistry.get.mockReturnValue({
        id: 'events',
        permissions: [
          {
            id: 'manage_rsvp',
            name: 'Manage RSVPs',
            description: 'Can manage event RSVPs',
            defaultRoles: ['OWNER', 'ADMIN'],
          },
        ],
      });

      expect(roleHasPluginPermission('MEMBER', 'plugin.events.manage_rsvp')).toBe(false);
    });

    it('returns false for invalid permission format', () => {
      expect(roleHasPluginPermission('ADMIN', 'invalid.permission')).toBe(false);
    });
  });

  describe('checkPermission', () => {
    it('returns false without membership', () => {
      const ctx: PermissionContext = {
        userId: 'user1',
        contextId: 'ctx1',
      };

      expect(checkPermission(ctx, 'activity.create')).toBe(false);
    });

    it('returns false for non-approved membership', () => {
      const ctx: PermissionContext = {
        userId: 'user1',
        contextId: 'ctx1',
        membership: {
          role: 'MEMBER',
          status: 'PENDING',
        },
      };

      expect(checkPermission(ctx, 'activity.create')).toBe(false);
    });

    it('returns true for approved membership with permission', () => {
      const ctx: PermissionContext = {
        userId: 'user1',
        contextId: 'ctx1',
        membership: {
          role: 'MEMBER',
          status: 'APPROVED',
        },
      };

      expect(checkPermission(ctx, 'activity.create')).toBe(true);
    });

    it('respects custom permission overrides (grant)', () => {
      const ctx: PermissionContext = {
        userId: 'user1',
        contextId: 'ctx1',
        membership: {
          role: 'MEMBER',
          status: 'APPROVED',
          permissions: {
            'activity.pin': true, // Grant permission not normally available
          },
        },
      };

      expect(checkPermission(ctx, 'activity.pin')).toBe(true);
    });

    it('respects custom permission overrides (revoke)', () => {
      const ctx: PermissionContext = {
        userId: 'user1',
        contextId: 'ctx1',
        membership: {
          role: 'ADMIN',
          status: 'APPROVED',
          permissions: {
            'member.ban': false, // Revoke normally available permission
          },
        },
      };

      expect(checkPermission(ctx, 'member.ban')).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('returns core permissions for role', () => {
      const perms = getPermissionsForRole('MEMBER');

      expect(perms).toContain('context.view');
      expect(perms).toContain('activity.create');
      expect(perms).not.toContain('member.ban');
    });

    it('includes plugin permissions when plugins specified', () => {
      const mockPluginRegistry = pluginRegistry as { get: ReturnType<typeof vi.fn> };
      mockPluginRegistry.get.mockReturnValue({
        id: 'events',
        permissions: [
          {
            id: 'view_rsvps',
            name: 'View RSVPs',
            description: 'Can view event RSVPs',
            defaultRoles: ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'],
          },
        ],
      });

      const perms = getPermissionsForRole('MEMBER', ['events']);

      expect(perms).toContain('plugin.events.view_rsvps');
    });
  });

  describe('getMembershipPermissions', () => {
    it('returns empty array for non-approved membership', () => {
      const ctx: PermissionContext = {
        userId: 'user1',
        contextId: 'ctx1',
        membership: {
          role: 'MEMBER',
          status: 'PENDING',
        },
      };

      expect(getMembershipPermissions(ctx)).toEqual([]);
    });

    it('applies custom permission overrides', () => {
      const ctx: PermissionContext = {
        userId: 'user1',
        contextId: 'ctx1',
        membership: {
          role: 'MEMBER',
          status: 'APPROVED',
          permissions: {
            'activity.create': false, // Revoke
            'activity.pin': true, // Grant
          },
        },
      };

      const perms = getMembershipPermissions(ctx);

      expect(perms).not.toContain('activity.create');
      expect(perms).toContain('activity.pin');
    });
  });

  // =========================================================================
  // Database-Backed Permission Checks
  // =========================================================================

  describe('hasPermission (DB)', () => {
    it('returns false for non-member', async () => {
      mockDb.membership.findUnique.mockResolvedValue(null);

      const result = await hasPermission('user1', 'ctx1', 'activity.create');

      expect(result).toBe(false);
    });

    it('returns false for pending member', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        userId: 'user1',
        contextId: 'ctx1',
        role: 'MEMBER',
        status: 'PENDING',
        permissions: null,
        context: { features: [] },
      });

      const result = await hasPermission('user1', 'ctx1', 'activity.create');

      expect(result).toBe(false);
    });

    it('returns true for approved member with permission', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        userId: 'user1',
        contextId: 'ctx1',
        role: 'MEMBER',
        status: 'APPROVED',
        permissions: null,
        context: { features: [] },
      });

      const result = await hasPermission('user1', 'ctx1', 'activity.create');

      expect(result).toBe(true);
    });
  });

  describe('hasPermissionWithReason (DB)', () => {
    it('returns reason for non-member', async () => {
      mockDb.membership.findUnique.mockResolvedValue(null);

      const result = await hasPermissionWithReason('user1', 'ctx1', 'activity.create');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Not a member');
    });

    it('returns reason for lacking permission', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        userId: 'user1',
        contextId: 'ctx1',
        role: 'GUEST',
        status: 'APPROVED',
        permissions: null,
        context: { features: [] },
      });

      const result = await hasPermissionWithReason('user1', 'ctx1', 'activity.create');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('GUEST');
      expect(result.reason).toContain('activity.create');
    });
  });

  describe('getPermissionsFromDb', () => {
    it('returns empty array for non-member', async () => {
      mockDb.membership.findUnique.mockResolvedValue(null);

      const perms = await getPermissionsFromDb('user1', 'ctx1');

      expect(perms).toEqual([]);
    });

    it('returns permissions for approved member', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        userId: 'user1',
        contextId: 'ctx1',
        role: 'MEMBER',
        status: 'APPROVED',
        permissions: null,
        context: { features: [] },
      });

      const perms = await getPermissionsFromDb('user1', 'ctx1');

      expect(perms).toContain('context.view');
      expect(perms).toContain('activity.create');
    });
  });

  describe('canActOnActivity', () => {
    beforeEach(() => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        userId: 'user1',
        contextId: 'ctx1',
        role: 'MEMBER',
        status: 'APPROVED',
        permissions: null,
        context: { features: [] },
      });
    });

    it('allows editing own activity', async () => {
      const result = await canActOnActivity('user1', 'ctx1', 'user1', 'edit');

      expect(result.allowed).toBe(true);
    });

    it('denies editing others activity', async () => {
      const result = await canActOnActivity('user1', 'ctx1', 'user2', 'edit');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('other users');
    });

    it('allows deleting own activity', async () => {
      const result = await canActOnActivity('user1', 'ctx1', 'user1', 'delete');

      expect(result.allowed).toBe(true);
    });

    it('checks delete_any for deleting others activity', async () => {
      const result = await canActOnActivity('user1', 'ctx1', 'user2', 'delete');

      expect(result.allowed).toBe(false); // MEMBER lacks delete_any
    });

    it('allows moderator to delete any activity', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        userId: 'user1',
        contextId: 'ctx1',
        role: 'MODERATOR',
        status: 'APPROVED',
        permissions: null,
        context: { features: [] },
      });

      const result = await canActOnActivity('user1', 'ctx1', 'user2', 'delete');

      expect(result.allowed).toBe(true);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true when all permissions granted', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        userId: 'user1',
        contextId: 'ctx1',
        role: 'MEMBER',
        status: 'APPROVED',
        permissions: null,
        context: { features: [] },
      });

      const result = await hasAllPermissions('user1', 'ctx1', [
        'context.view',
        'activity.create',
      ]);

      expect(result).toBe(true);
    });

    it('returns false when any permission denied', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        userId: 'user1',
        contextId: 'ctx1',
        role: 'MEMBER',
        status: 'APPROVED',
        permissions: null,
        context: { features: [] },
      });

      const result = await hasAllPermissions('user1', 'ctx1', [
        'context.view',
        'member.ban', // MEMBER doesn't have this
      ]);

      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true when at least one permission granted', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        userId: 'user1',
        contextId: 'ctx1',
        role: 'MEMBER',
        status: 'APPROVED',
        permissions: null,
        context: { features: [] },
      });

      const result = await hasAnyPermission('user1', 'ctx1', [
        'member.ban', // MEMBER doesn't have this
        'activity.create', // MEMBER has this
      ]);

      expect(result).toBe(true);
    });

    it('returns false when no permissions granted', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        userId: 'user1',
        contextId: 'ctx1',
        role: 'GUEST',
        status: 'APPROVED',
        permissions: null,
        context: { features: [] },
      });

      const result = await hasAnyPermission('user1', 'ctx1', [
        'member.ban',
        'activity.create',
      ]);

      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // tRPC Middleware Tests
  // =========================================================================

  describe('requirePermission middleware', () => {
    it('throws for unauthenticated users', async () => {
      const middleware = requirePermission('activity.create');

      const ctx = { session: {} };
      const next = vi.fn();
      const input = { contextId: 'ctx1' };

      await expect(middleware({ ctx, next, input })).rejects.toThrow('Unauthorized');
    });

    it('throws for users without permission', async () => {
      mockDb.membership.findUnique.mockResolvedValue(null);

      const middleware = requirePermission('activity.create');

      const ctx = { session: { user: { id: 'user1' } } };
      const next = vi.fn();
      const input = { contextId: 'ctx1' };

      await expect(middleware({ ctx, next, input })).rejects.toThrow('Forbidden');
    });

    it('calls next for users with permission', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        userId: 'user1',
        contextId: 'ctx1',
        role: 'MEMBER',
        status: 'APPROVED',
        permissions: null,
        context: { features: [] },
      });

      const middleware = requirePermission('activity.create');

      const ctx = { session: { user: { id: 'user1' } } };
      const next = vi.fn().mockResolvedValue('success');
      const input = { contextId: 'ctx1' };

      const result = await middleware({ ctx, next, input });

      expect(next).toHaveBeenCalled();
      expect(result).toBe('success');
    });
  });

  describe('requireAnyPermission middleware', () => {
    it('allows access with any matching permission', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        userId: 'user1',
        contextId: 'ctx1',
        role: 'MEMBER',
        status: 'APPROVED',
        permissions: null,
        context: { features: [] },
      });

      const middleware = requireAnyPermission(['member.ban', 'activity.create']);

      const ctx = { session: { user: { id: 'user1' } } };
      const next = vi.fn().mockResolvedValue('success');
      const input = { contextId: 'ctx1' };

      const result = await middleware({ ctx, next, input });

      expect(result).toBe('success');
    });

    it('rejects when no permissions match', async () => {
      mockDb.membership.findUnique.mockResolvedValue({
        id: 'mem1',
        userId: 'user1',
        contextId: 'ctx1',
        role: 'GUEST',
        status: 'APPROVED',
        permissions: null,
        context: { features: [] },
      });

      const middleware = requireAnyPermission(['member.ban', 'activity.create']);

      const ctx = { session: { user: { id: 'user1' } } };
      const next = vi.fn();
      const input = { contextId: 'ctx1' };

      await expect(middleware({ ctx, next, input })).rejects.toThrow('Requires one of');
    });
  });

  describe('requireMembership middleware', () => {
    it('is an alias for requirePermission(context.view)', () => {
      const membershipMiddleware = requireMembership();
      const viewMiddleware = requirePermission('context.view');

      // Both should be functions
      expect(typeof membershipMiddleware).toBe('function');
      expect(typeof viewMiddleware).toBe('function');
    });
  });
});
