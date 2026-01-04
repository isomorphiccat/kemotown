/**
 * Address Parser
 * Parses and creates address strings for activity targeting
 */

import type { ParsedAddress, Address } from './types';

/**
 * Parse an address string into structured data
 */
export function parseAddress(address: string): ParsedAddress {
  const raw = address;

  // Public address
  if (address === 'public') {
    return { type: 'public', raw };
  }

  // Followers address
  if (address === 'followers') {
    return { type: 'followers', raw };
  }

  // User address: user:{id}
  if (address.startsWith('user:')) {
    return {
      type: 'user',
      id: address.slice(5),
      raw,
    };
  }

  // Context address: context:{id} or context:{id}:{modifier}
  if (address.startsWith('context:')) {
    const remainder = address.slice(8);
    const colonIndex = remainder.indexOf(':');

    if (colonIndex === -1) {
      return {
        type: 'context',
        id: remainder,
        raw,
      };
    }

    return {
      type: 'context',
      id: remainder.slice(0, colonIndex),
      modifier: remainder.slice(colonIndex + 1),
      raw,
    };
  }

  // Unknown address type
  return { type: 'unknown', raw };
}

/**
 * Address creation helpers
 */
export const createAddress = {
  /**
   * Create public address
   */
  public: (): Address => 'public',

  /**
   * Create followers address
   */
  followers: (): Address => 'followers',

  /**
   * Create user address
   */
  user: (userId: string): Address => `user:${userId}`,

  /**
   * Create context address (all members)
   */
  context: (contextId: string): Address => `context:${contextId}`,

  /**
   * Create context:admins address
   */
  contextAdmins: (contextId: string): Address => `context:${contextId}:admins`,

  /**
   * Create context:moderators address
   */
  contextModerators: (contextId: string): Address =>
    `context:${contextId}:moderators`,

  /**
   * Create context:role:{role} address
   */
  contextRole: (contextId: string, role: string): Address =>
    `context:${contextId}:role:${role}`,
};

/**
 * Check if address is public
 */
export function isPublicAddress(addresses: string[]): boolean {
  return addresses.includes('public');
}

/**
 * Check if address targets followers
 */
export function isFollowersAddress(addresses: string[]): boolean {
  return addresses.includes('followers');
}

/**
 * Extract all context IDs from addresses
 */
export function extractContextIds(addresses: string[]): string[] {
  const ids: string[] = [];

  for (const addr of addresses) {
    const parsed = parseAddress(addr);
    if (parsed.type === 'context' && parsed.id) {
      ids.push(parsed.id);
    }
  }

  return [...new Set(ids)];
}

/**
 * Extract all user IDs from addresses
 */
export function extractUserIds(addresses: string[]): string[] {
  const ids: string[] = [];

  for (const addr of addresses) {
    const parsed = parseAddress(addr);
    if (parsed.type === 'user' && parsed.id) {
      ids.push(parsed.id);
    }
  }

  return [...new Set(ids)];
}

/**
 * Check if an address targets a specific user
 */
export function addressTargetsUser(
  addresses: string[],
  userId: string
): boolean {
  return addresses.includes(`user:${userId}`);
}

/**
 * Check if an address targets a specific context
 */
export function addressTargetsContext(
  addresses: string[],
  contextId: string
): boolean {
  return addresses.some((addr) => {
    const parsed = parseAddress(addr);
    return parsed.type === 'context' && parsed.id === contextId;
  });
}

/**
 * Combine multiple address arrays, removing duplicates
 */
export function combineAddresses(...addressArrays: string[][]): string[] {
  const combined = new Set<string>();
  for (const arr of addressArrays) {
    for (const addr of arr) {
      combined.add(addr);
    }
  }
  return [...combined];
}
