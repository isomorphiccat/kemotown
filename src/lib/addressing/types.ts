/**
 * Addressing System Types
 * Defines address formats for activity visibility and delivery
 */

// =============================================================================
// Address Types
// =============================================================================

export type AddressType =
  | 'public'
  | 'followers'
  | 'user'
  | 'context'
  | 'unknown';

/**
 * Parsed address structure
 */
export interface ParsedAddress {
  /** Address type */
  type: AddressType;
  /** ID (for user, context types) */
  id?: string;
  /** Modifier (for context subtypes like :admins, :role:MODERATOR) */
  modifier?: string;
  /** Original raw address string */
  raw: string;
}

/**
 * Type-safe address string types
 */
export type Address =
  | 'public'
  | 'followers'
  | `user:${string}`
  | `context:${string}`
  | `context:${string}:${string}`;

// =============================================================================
// Visibility Types
// =============================================================================

/**
 * Visibility check result
 */
export interface VisibilityResult {
  /** Can the user see this activity? */
  visible: boolean;
  /** Reason for visibility/invisibility */
  reason?: string;
}

/**
 * Delivery result
 */
export interface DeliveryResult {
  /** Number of recipients delivered to */
  delivered: number;
  /** Number of mentions detected */
  mentioned: number;
  /** Any errors during delivery */
  errors?: string[];
}

// =============================================================================
// Context Address Modifiers
// =============================================================================

/**
 * Standard context address modifiers
 */
export const CONTEXT_MODIFIERS = {
  /** All admins (OWNER, ADMIN) */
  ADMINS: 'admins',
  /** All moderators+ (OWNER, ADMIN, MODERATOR) */
  MODERATORS: 'moderators',
  /** Role-specific prefix */
  ROLE_PREFIX: 'role:',
} as const;

export type ContextModifier =
  | typeof CONTEXT_MODIFIERS.ADMINS
  | typeof CONTEXT_MODIFIERS.MODERATORS
  | `${typeof CONTEXT_MODIFIERS.ROLE_PREFIX}${string}`;
