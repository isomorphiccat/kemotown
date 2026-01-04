/**
 * Plugin System Type Definitions
 * Core interfaces for the Kemotown v2 plugin architecture
 */

import type { z } from 'zod';
import type { ComponentType } from 'react';
import type { ContextType, MemberRole } from '@prisma/client';

// Re-export for convenience
export type { ContextType, MemberRole } from '@prisma/client';

// =============================================================================
// Core Plugin Interface
// =============================================================================

/**
 * Plugin definition interface
 * Plugins extend Context functionality with custom features
 */
export interface Plugin<TData = unknown> {
  /** Unique plugin identifier */
  id: string;

  /** Display name */
  name: string;

  /** Description */
  description: string;

  /** Version string (semver) */
  version: string;

  /** Compatible context types */
  contextTypes: ContextType[];

  /** Zod schema for plugin data validation (output type must be TData) */
  dataSchema: z.ZodType<TData, z.ZodTypeDef, unknown>;

  /** Default data for new contexts */
  defaultData: TData;

  /** Custom activity types this plugin introduces */
  activityTypes?: PluginActivityType[];

  /** Custom address patterns for targeting */
  addressPatterns?: PluginAddressPattern[];

  /** React components for UI extension */
  components?: PluginComponents;

  /** Lifecycle hooks */
  hooks?: PluginHooks<TData>;

  /** Permission definitions */
  permissions?: PluginPermission[];

  /** Membership field extensions */
  membershipFields?: PluginMembershipField[];
}

// =============================================================================
// Plugin Sub-Types
// =============================================================================

/**
 * Custom activity type definition
 */
export interface PluginActivityType {
  /** Activity type string (e.g., 'RSVP', 'CHECKIN') */
  type: string;
  /** Human-readable label */
  label: string;
  /** Icon name (lucide-react) */
  icon: string;
  /** Optional description */
  description?: string;
}

/**
 * Custom address pattern for plugin-specific targeting
 */
export interface PluginAddressPattern {
  /** Pattern string, e.g., "context:{id}:attendees" */
  pattern: string;
  /** Human-readable label */
  label: string;
  /** Async resolver to check if user matches pattern */
  resolver: (contextId: string, userId: string) => Promise<boolean>;
}

/**
 * Plugin permission definition
 */
export interface PluginPermission {
  /** Permission ID (e.g., 'manage_rsvps') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this permission allows */
  description: string;
  /** Which roles have this permission by default */
  defaultRoles: MemberRole[];
}

/**
 * Plugin membership field extension
 * Allows plugins to store custom data per-membership
 */
export interface PluginMembershipField {
  /** Field name in pluginData JSON */
  field: string;
  /** Human-readable label */
  label: string;
  /** Field type */
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'json';
  /** Enum values (if type is 'enum') */
  enumValues?: string[];
  /** Default value */
  defaultValue?: unknown;
  /** Is field required? */
  required?: boolean;
}

// =============================================================================
// Plugin Components
// =============================================================================

/**
 * Plugin UI component definitions
 * Components are injected into Context pages
 */
export interface PluginComponents {
  /** Context page header extension */
  ContextHeader?: ComponentType<PluginContextProps>;

  /** Context page sidebar */
  ContextSidebar?: ComponentType<PluginContextProps>;

  /** Context settings panel */
  ContextSettings?: ComponentType<PluginContextProps>;

  /** Context card in listings */
  ContextCard?: ComponentType<PluginContextProps>;

  /** Context creation form fields */
  CreateForm?: ComponentType<PluginFormProps>;

  /** Post action buttons */
  PostActions?: ComponentType<PluginPostProps>;

  /** Custom post renderer for plugin activity types */
  PostRenderer?: ComponentType<PluginPostProps>;

  /** Member card extension */
  MemberCard?: ComponentType<PluginMemberProps>;
}

// =============================================================================
// Component Props
// =============================================================================

export interface PluginContextProps {
  context: ContextData;
  membership?: MembershipData | null;
  pluginData: unknown;
}

export interface PluginFormProps {
  data: unknown;
  onChange: (data: unknown) => void;
  errors?: Record<string, string>;
}

export interface PluginPostProps {
  activity: ActivityData;
  context?: ContextData;
}

export interface PluginMemberProps {
  membership: MembershipData;
  pluginData: unknown;
}

// Simplified data types for component props
export interface ContextData {
  id: string;
  type: ContextType;
  slug: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  plugins: Record<string, unknown>;
  features: string[];
}

export interface MembershipData {
  id: string;
  role: MemberRole;
  status: string;
  pluginData: Record<string, unknown>;
}

export interface ActivityData {
  id: string;
  type: string;
  object: unknown;
  actorId: string;
  published: Date;
}

// =============================================================================
// Plugin Lifecycle Hooks
// =============================================================================

/**
 * Plugin lifecycle hooks
 * Called at various points in context/membership lifecycle
 */
export interface PluginHooks<TData> {
  /** Called when context is created */
  onContextCreate?: (context: ContextData, data: TData) => Promise<void>;

  /** Called when context is updated */
  onContextUpdate?: (
    context: ContextData,
    data: TData,
    prevData: TData
  ) => Promise<void>;

  /** Called when context is deleted/archived */
  onContextDelete?: (context: ContextData) => Promise<void>;

  /** Called when user joins context */
  onMemberJoin?: (
    membership: MembershipData,
    context: ContextData
  ) => Promise<void>;

  /** Called when user leaves context */
  onMemberLeave?: (
    membership: MembershipData,
    context: ContextData
  ) => Promise<void>;

  /** Called when activity is created in context */
  onActivityCreate?: (
    activity: ActivityData,
    context: ContextData
  ) => Promise<void>;

  /** Validate plugin data before save */
  validateData?: (
    data: TData,
    context: ContextData
  ) => Promise<{ valid: boolean; errors?: string[] }>;
}
