/**
 * Permission System Types
 * Defines permissions for context-based access control
 */

import type { MemberRole } from '@prisma/client';

// Re-export for convenience
export type { MemberRole } from '@prisma/client';

// =============================================================================
// Core Permissions
// =============================================================================

/**
 * Core system permissions
 * These are built-in permissions that apply to all contexts
 */
export type CorePermission =
  // Context permissions
  | 'context.view'
  | 'context.edit'
  | 'context.delete'
  | 'context.manage_members'
  // Activity permissions
  | 'activity.create'
  | 'activity.edit_own'
  | 'activity.delete_own'
  | 'activity.delete_any'
  | 'activity.pin'
  // Member permissions
  | 'member.invite'
  | 'member.approve'
  | 'member.ban'
  | 'member.update_role';

/**
 * Plugin permission format: plugin.{pluginId}.{permissionId}
 */
export type PluginPermissionString = `plugin.${string}.${string}`;

/**
 * Combined permission type
 */
export type Permission = CorePermission | PluginPermissionString;

// =============================================================================
// Role Definitions
// =============================================================================

/**
 * Role hierarchy (lower index = higher privilege)
 */
export const ROLE_HIERARCHY: MemberRole[] = [
  'OWNER',
  'ADMIN',
  'MODERATOR',
  'MEMBER',
  'GUEST',
];

/**
 * Default permissions by role
 */
export const ROLE_PERMISSIONS: Record<MemberRole, CorePermission[]> = {
  OWNER: [
    'context.view',
    'context.edit',
    'context.delete',
    'context.manage_members',
    'activity.create',
    'activity.edit_own',
    'activity.delete_own',
    'activity.delete_any',
    'activity.pin',
    'member.invite',
    'member.approve',
    'member.ban',
    'member.update_role',
  ],
  ADMIN: [
    'context.view',
    'context.edit',
    'context.manage_members',
    'activity.create',
    'activity.edit_own',
    'activity.delete_own',
    'activity.delete_any',
    'activity.pin',
    'member.invite',
    'member.approve',
    'member.ban',
    'member.update_role',
  ],
  MODERATOR: [
    'context.view',
    'activity.create',
    'activity.edit_own',
    'activity.delete_own',
    'activity.delete_any',
    'member.approve',
    'member.ban',
  ],
  MEMBER: [
    'context.view',
    'activity.create',
    'activity.edit_own',
    'activity.delete_own',
  ],
  GUEST: ['context.view'],
};

// =============================================================================
// Permission Check Types
// =============================================================================

/**
 * Permission check context
 */
export interface PermissionContext {
  userId: string;
  contextId: string;
  membership?: {
    role: MemberRole;
    status: string;
    permissions?: Record<string, boolean>;
  };
}

/**
 * Permission check result
 */
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Check if role A is higher than role B
 */
export function isHigherRole(roleA: MemberRole, roleB: MemberRole): boolean {
  const indexA = ROLE_HIERARCHY.indexOf(roleA);
  const indexB = ROLE_HIERARCHY.indexOf(roleB);
  return indexA < indexB;
}

/**
 * Check if role A is equal or higher than role B
 */
export function isEqualOrHigherRole(
  roleA: MemberRole,
  roleB: MemberRole
): boolean {
  const indexA = ROLE_HIERARCHY.indexOf(roleA);
  const indexB = ROLE_HIERARCHY.indexOf(roleB);
  return indexA <= indexB;
}

/**
 * Get all roles equal or higher than given role
 */
export function getRolesAtOrAbove(role: MemberRole): MemberRole[] {
  const index = ROLE_HIERARCHY.indexOf(role);
  return ROLE_HIERARCHY.slice(0, index + 1);
}

/**
 * Get all roles below given role
 */
export function getRolesBelow(role: MemberRole): MemberRole[] {
  const index = ROLE_HIERARCHY.indexOf(role);
  return ROLE_HIERARCHY.slice(index + 1);
}
