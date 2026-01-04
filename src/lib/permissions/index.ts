/**
 * Permission System
 * Context-based permission checking for Kemotown v2
 */

import type { Permission, CorePermission, PermissionContext, PermissionResult, MemberRole } from './types';
import { ROLE_PERMISSIONS } from './types';
import { pluginRegistry } from '../plugins';
import { db } from '@/server/db';

export type {
  Permission,
  CorePermission,
  PluginPermissionString,
  PermissionContext,
  PermissionResult,
} from './types';

export {
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  isHigherRole,
  isEqualOrHigherRole,
  getRolesAtOrAbove,
  getRolesBelow,
} from './types';

/**
 * Check if a role has a specific core permission
 */
export function roleHasPermission(
  role: MemberRole,
  permission: CorePermission
): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  return rolePerms.includes(permission);
}

/**
 * Check if a role has a plugin permission
 */
export function roleHasPluginPermission(
  role: MemberRole,
  permission: string
): boolean {
  // Parse plugin permission: plugin.{pluginId}.{permissionId}
  const parts = permission.split('.');
  if (parts.length !== 3 || parts[0] !== 'plugin') {
    return false;
  }

  const [, pluginId, permissionId] = parts;
  const plugin = pluginRegistry.get(pluginId);

  if (!plugin?.permissions) {
    return false;
  }

  const pluginPerm = plugin.permissions.find((p) => p.id === permissionId);
  return pluginPerm?.defaultRoles.includes(role) ?? false;
}

/**
 * Check permission with context
 * This is the main permission check function
 */
export function checkPermission(
  ctx: PermissionContext,
  permission: Permission
): boolean {
  // Must have membership
  if (!ctx.membership) {
    return false;
  }

  // Must be approved
  if (ctx.membership.status !== 'APPROVED') {
    return false;
  }

  // Check custom permission overrides first
  if (ctx.membership.permissions) {
    if (permission in ctx.membership.permissions) {
      return ctx.membership.permissions[permission];
    }
  }

  // Check if it's a plugin permission
  if (permission.startsWith('plugin.')) {
    return roleHasPluginPermission(ctx.membership.role, permission);
  }

  // Check core permission
  return roleHasPermission(ctx.membership.role, permission as CorePermission);
}

/**
 * Get all permissions for a role (including plugin permissions)
 */
export function getPermissionsForRole(
  role: MemberRole,
  enabledPlugins: string[] = []
): Permission[] {
  const permissions: Permission[] = [...ROLE_PERMISSIONS[role]];

  // Add plugin permissions
  for (const pluginId of enabledPlugins) {
    const plugin = pluginRegistry.get(pluginId);
    if (plugin?.permissions) {
      for (const perm of plugin.permissions) {
        if (perm.defaultRoles.includes(role)) {
          permissions.push(`plugin.${pluginId}.${perm.id}` as Permission);
        }
      }
    }
  }

  return permissions;
}

/**
 * Get all permissions for a membership (with custom overrides)
 */
export function getMembershipPermissions(
  ctx: PermissionContext,
  enabledPlugins: string[] = []
): Permission[] {
  if (!ctx.membership || ctx.membership.status !== 'APPROVED') {
    return [];
  }

  const basePermissions = getPermissionsForRole(
    ctx.membership.role,
    enabledPlugins
  );

  // Apply custom overrides
  if (ctx.membership.permissions) {
    const result = [...basePermissions];

    for (const [perm, granted] of Object.entries(ctx.membership.permissions)) {
      if (granted && !result.includes(perm as Permission)) {
        result.push(perm as Permission);
      } else if (!granted) {
        const idx = result.indexOf(perm as Permission);
        if (idx !== -1) {
          result.splice(idx, 1);
        }
      }
    }

    return result;
  }

  return basePermissions;
}

// =============================================================================
// Database-Backed Permission Checks
// =============================================================================

/**
 * Check if user has permission in context (with database lookup)
 *
 * This fetches the membership from the database and checks permissions.
 * Use this in route handlers and tRPC procedures where you don't have
 * the membership already loaded.
 */
export async function hasPermission(
  userId: string,
  contextId: string,
  permission: Permission
): Promise<boolean> {
  const result = await hasPermissionWithReason(userId, contextId, permission);
  return result.allowed;
}

/**
 * Check permission with detailed reason
 */
export async function hasPermissionWithReason(
  userId: string,
  contextId: string,
  permission: Permission
): Promise<PermissionResult> {
  const membership = await db.membership.findUnique({
    where: { contextId_userId: { contextId, userId } },
    include: {
      context: { select: { features: true, ownerId: true } },
    },
  });

  // Not a member
  if (!membership) {
    return { allowed: false, reason: 'Not a member of this context' };
  }

  // Not approved
  if (membership.status !== 'APPROVED') {
    return { allowed: false, reason: `Membership status is ${membership.status}` };
  }

  // Build permission context
  const ctx: PermissionContext = {
    userId,
    contextId,
    membership: {
      role: membership.role,
      status: membership.status,
      permissions: membership.permissions as Record<string, boolean> | undefined,
    },
  };

  // Use in-memory check
  if (checkPermission(ctx, permission)) {
    return { allowed: true };
  }

  return { allowed: false, reason: `Role ${membership.role} lacks permission ${permission}` };
}

/**
 * Get all permissions for user in context (with database lookup)
 */
export async function getPermissionsFromDb(
  userId: string,
  contextId: string
): Promise<Permission[]> {
  const membership = await db.membership.findUnique({
    where: { contextId_userId: { contextId, userId } },
    include: {
      context: { select: { features: true } },
    },
  });

  if (!membership || membership.status !== 'APPROVED') {
    return [];
  }

  const ctx: PermissionContext = {
    userId,
    contextId,
    membership: {
      role: membership.role,
      status: membership.status,
      permissions: membership.permissions as Record<string, boolean> | undefined,
    },
  };

  return getMembershipPermissions(ctx, membership.context.features);
}

/**
 * Check if user can perform action on activity
 * (Combines permission check with ownership check)
 */
export async function canActOnActivity(
  userId: string,
  contextId: string,
  activityActorId: string,
  action: 'edit' | 'delete' | 'pin'
): Promise<PermissionResult> {
  const isOwner = userId === activityActorId;

  switch (action) {
    case 'edit':
      if (isOwner) {
        return hasPermissionWithReason(userId, contextId, 'activity.edit_own');
      }
      return { allowed: false, reason: 'Cannot edit activities by other users' };

    case 'delete':
      if (isOwner) {
        return hasPermissionWithReason(userId, contextId, 'activity.delete_own');
      }
      return hasPermissionWithReason(userId, contextId, 'activity.delete_any');

    case 'pin':
      return hasPermissionWithReason(userId, contextId, 'activity.pin');
  }
}

/**
 * Check multiple permissions at once
 */
export async function hasAllPermissions(
  userId: string,
  contextId: string,
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(userId, contextId, permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  contextId: string,
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(userId, contextId, permission)) {
      return true;
    }
  }
  return false;
}

// =============================================================================
// tRPC Middleware Factory
// =============================================================================

/**
 * Create a tRPC middleware that requires a specific permission
 *
 * Usage in tRPC router:
 * ```typescript
 * const protectedProcedure = t.procedure
 *   .input(z.object({ contextId: z.string() }))
 *   .use(requirePermission('activity.create'));
 * ```
 */
export function requirePermission(permission: Permission) {
  return async ({
    ctx,
    next,
    input,
  }: {
    ctx: { session?: { user?: { id?: string } } };
    next: (opts: { ctx: Record<string, unknown> }) => unknown;
    input: { contextId: string };
  }) => {
    const userId = ctx.session?.user?.id;

    if (!userId) {
      throw new Error('Unauthorized: Not logged in');
    }

    const result = await hasPermissionWithReason(userId, input.contextId, permission);

    if (!result.allowed) {
      throw new Error(`Forbidden: ${result.reason}`);
    }

    return next({
      ctx: {
        ...ctx,
        permission,
        hasPermission: true,
      },
    });
  };
}

/**
 * Create a middleware that requires any of the specified permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return async ({
    ctx,
    next,
    input,
  }: {
    ctx: { session?: { user?: { id?: string } } };
    next: (opts: { ctx: Record<string, unknown> }) => unknown;
    input: { contextId: string };
  }) => {
    const userId = ctx.session?.user?.id;

    if (!userId) {
      throw new Error('Unauthorized: Not logged in');
    }

    const hasAny = await hasAnyPermission(userId, input.contextId, permissions);

    if (!hasAny) {
      throw new Error(`Forbidden: Requires one of: ${permissions.join(', ')}`);
    }

    return next({
      ctx: {
        ...ctx,
        permissions,
        hasPermission: true,
      },
    });
  };
}

/**
 * Create a middleware that requires membership (any approved role)
 */
export function requireMembership() {
  return requirePermission('context.view');
}
