/**
 * Address Parser Tests
 */

import { describe, it, expect } from 'vitest';
import {
  parseAddress,
  createAddress,
  isPublicAddress,
  extractContextIds,
  extractUserIds,
  addressTargetsUser,
  combineAddresses,
} from './parser';

describe('parseAddress', () => {
  it('parses public address', () => {
    const result = parseAddress('public');
    expect(result).toEqual({
      type: 'public',
      raw: 'public',
    });
  });

  it('parses followers address', () => {
    const result = parseAddress('followers');
    expect(result).toEqual({
      type: 'followers',
      raw: 'followers',
    });
  });

  it('parses user address', () => {
    const result = parseAddress('user:abc123');
    expect(result).toEqual({
      type: 'user',
      id: 'abc123',
      raw: 'user:abc123',
    });
  });

  it('parses context address without modifier', () => {
    const result = parseAddress('context:ctx123');
    expect(result).toEqual({
      type: 'context',
      id: 'ctx123',
      raw: 'context:ctx123',
    });
  });

  it('parses context address with admins modifier', () => {
    const result = parseAddress('context:ctx123:admins');
    expect(result).toEqual({
      type: 'context',
      id: 'ctx123',
      modifier: 'admins',
      raw: 'context:ctx123:admins',
    });
  });

  it('parses context address with role modifier', () => {
    const result = parseAddress('context:ctx123:role:MODERATOR');
    expect(result).toEqual({
      type: 'context',
      id: 'ctx123',
      modifier: 'role:MODERATOR',
      raw: 'context:ctx123:role:MODERATOR',
    });
  });

  it('returns unknown for unrecognized addresses', () => {
    const result = parseAddress('something:else');
    expect(result).toEqual({
      type: 'unknown',
      raw: 'something:else',
    });
  });
});

describe('createAddress', () => {
  it('creates public address', () => {
    expect(createAddress.public()).toBe('public');
  });

  it('creates followers address', () => {
    expect(createAddress.followers()).toBe('followers');
  });

  it('creates user address', () => {
    expect(createAddress.user('user123')).toBe('user:user123');
  });

  it('creates context address', () => {
    expect(createAddress.context('ctx123')).toBe('context:ctx123');
  });

  it('creates context:admins address', () => {
    expect(createAddress.contextAdmins('ctx123')).toBe('context:ctx123:admins');
  });

  it('creates context:role address', () => {
    expect(createAddress.contextRole('ctx123', 'MODERATOR')).toBe(
      'context:ctx123:role:MODERATOR'
    );
  });
});

describe('isPublicAddress', () => {
  it('returns true when public is in addresses', () => {
    expect(isPublicAddress(['public', 'user:123'])).toBe(true);
  });

  it('returns false when public is not in addresses', () => {
    expect(isPublicAddress(['followers', 'user:123'])).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(isPublicAddress([])).toBe(false);
  });
});

describe('extractContextIds', () => {
  it('extracts context IDs from addresses', () => {
    const addresses = [
      'public',
      'context:ctx1',
      'user:user1',
      'context:ctx2:admins',
      'context:ctx1', // duplicate
    ];
    const ids = extractContextIds(addresses);
    expect(ids).toEqual(['ctx1', 'ctx2']);
  });

  it('returns empty array when no context addresses', () => {
    expect(extractContextIds(['public', 'user:123'])).toEqual([]);
  });
});

describe('extractUserIds', () => {
  it('extracts user IDs from addresses', () => {
    const addresses = ['public', 'user:user1', 'context:ctx1', 'user:user2'];
    const ids = extractUserIds(addresses);
    expect(ids).toEqual(['user1', 'user2']);
  });
});

describe('addressTargetsUser', () => {
  it('returns true when user is targeted', () => {
    expect(addressTargetsUser(['public', 'user:abc'], 'abc')).toBe(true);
  });

  it('returns false when user is not targeted', () => {
    expect(addressTargetsUser(['public', 'user:xyz'], 'abc')).toBe(false);
  });
});

describe('combineAddresses', () => {
  it('combines multiple address arrays', () => {
    const result = combineAddresses(
      ['public', 'user:1'],
      ['user:2', 'public'], // duplicate public
      ['context:ctx1']
    );
    expect(result.sort()).toEqual(
      ['context:ctx1', 'public', 'user:1', 'user:2'].sort()
    );
  });

  it('returns empty array for empty inputs', () => {
    expect(combineAddresses()).toEqual([]);
    expect(combineAddresses([], [])).toEqual([]);
  });
});
