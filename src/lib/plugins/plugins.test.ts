/**
 * Plugin System Tests
 * Tests for plugin registration, validation, and data handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginRegistry, pluginRegistry, getPlugin } from './registry';
import { eventPlugin } from './event';
import { groupPlugin } from './group';
import { conventionPlugin } from './convention';
import { eventDataSchema, defaultEventData } from './event/schema';
import { groupDataSchema, defaultGroupData } from './group/schema';
import { conventionDataSchema, defaultConventionData } from './convention/schema';
import type { Plugin } from './types';
import { z } from 'zod';

// =============================================================================
// Plugin Registry Tests
// =============================================================================

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    // Create a fresh registry for each test
    registry = new PluginRegistry();
  });

  describe('register()', () => {
    it('should register a plugin', () => {
      const mockPlugin: Plugin = {
        id: 'test',
        name: 'Test Plugin',
        description: 'A test plugin',
        version: '1.0.0',
        contextTypes: ['GROUP'],
        dataSchema: z.object({}),
        defaultData: {},
      };

      registry.register(mockPlugin);
      expect(registry.has('test')).toBe(true);
    });

    it('should warn when overwriting an existing plugin', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockPlugin: Plugin = {
        id: 'duplicate',
        name: 'Plugin 1',
        description: 'First',
        version: '1.0.0',
        contextTypes: ['GROUP'],
        dataSchema: z.object({}),
        defaultData: {},
      };

      registry.register(mockPlugin);
      registry.register({ ...mockPlugin, name: 'Plugin 2' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Plugin "duplicate" already registered, overwriting'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('get()', () => {
    it('should return undefined for non-existent plugin', () => {
      expect(registry.get('non-existent')).toBeUndefined();
    });

    it('should return the registered plugin', () => {
      const mockPlugin: Plugin = {
        id: 'test-get',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
        contextTypes: ['EVENT'],
        dataSchema: z.object({}),
        defaultData: {},
      };

      registry.register(mockPlugin);
      expect(registry.get('test-get')).toBe(mockPlugin);
    });
  });

  describe('forContextType()', () => {
    it('should filter plugins by context type', () => {
      const eventOnlyPlugin: Plugin = {
        id: 'event-only',
        name: 'Event Only',
        description: 'Only for events',
        version: '1.0.0',
        contextTypes: ['EVENT'],
        dataSchema: z.object({}),
        defaultData: {},
      };

      const groupOnlyPlugin: Plugin = {
        id: 'group-only',
        name: 'Group Only',
        description: 'Only for groups',
        version: '1.0.0',
        contextTypes: ['GROUP'],
        dataSchema: z.object({}),
        defaultData: {},
      };

      registry.register(eventOnlyPlugin);
      registry.register(groupOnlyPlugin);

      const eventPlugins = registry.forContextType('EVENT');
      expect(eventPlugins).toHaveLength(1);
      expect(eventPlugins[0].id).toBe('event-only');

      const groupPlugins = registry.forContextType('GROUP');
      expect(groupPlugins).toHaveLength(1);
      expect(groupPlugins[0].id).toBe('group-only');
    });
  });

  describe('getAllActivityTypes()', () => {
    it('should aggregate activity types from all plugins', () => {
      const plugin1: Plugin = {
        id: 'plugin1',
        name: 'Plugin 1',
        description: 'Test',
        version: '1.0.0',
        contextTypes: ['EVENT'],
        dataSchema: z.object({}),
        defaultData: {},
        activityTypes: [
          { type: 'TYPE_A', label: 'Type A', icon: 'icon-a' },
        ],
      };

      const plugin2: Plugin = {
        id: 'plugin2',
        name: 'Plugin 2',
        description: 'Test',
        version: '1.0.0',
        contextTypes: ['GROUP'],
        dataSchema: z.object({}),
        defaultData: {},
        activityTypes: [
          { type: 'TYPE_B', label: 'Type B', icon: 'icon-b' },
          { type: 'TYPE_C', label: 'Type C', icon: 'icon-c' },
        ],
      };

      registry.register(plugin1);
      registry.register(plugin2);

      const allTypes = registry.getAllActivityTypes();
      expect(allTypes).toHaveLength(3);
      expect(allTypes.map((t) => t.type)).toEqual(['TYPE_A', 'TYPE_B', 'TYPE_C']);
    });
  });

  describe('validatePluginData()', () => {
    it('should return error for non-existent plugin', async () => {
      const result = await registry.validatePluginData('non-existent', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plugin "non-existent" not found');
    });

    it('should validate data against schema', async () => {
      const plugin: Plugin<{ name: string }> = {
        id: 'validate-test',
        name: 'Validate Test',
        description: 'Test',
        version: '1.0.0',
        contextTypes: ['GROUP'],
        dataSchema: z.object({ name: z.string().min(1) }),
        defaultData: { name: 'default' },
      };

      registry.register(plugin);

      // Valid data
      const validResult = await registry.validatePluginData('validate-test', {
        name: 'valid',
      });
      expect(validResult.valid).toBe(true);

      // Invalid data (empty name)
      const invalidResult = await registry.validatePluginData('validate-test', {
        name: '',
      });
      expect(invalidResult.valid).toBe(false);
    });
  });
});

// =============================================================================
// Event Plugin Tests
// =============================================================================

describe('EventPlugin', () => {
  describe('schema validation', () => {
    it('should validate valid event data', () => {
      const validData = {
        ...defaultEventData,
        startAt: '2026-02-01T14:00:00Z',
        endAt: '2026-02-01T18:00:00Z',
        locationType: 'physical',
        location: {
          name: 'Cozy Cafe',
          address: 'Seoul, South Korea',
          isPublic: true,
        },
      };

      const result = eventDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid event data', () => {
      const invalidData = {
        startAt: 'not-a-date',
        endAt: '2026-02-01T18:00:00Z',
        locationType: 'physical',
      };

      const result = eventDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should apply defaults correctly', () => {
      const minimalData = {
        startAt: '2026-02-01T14:00:00Z',
        endAt: '2026-02-01T18:00:00Z',
        locationType: 'online' as const,
      };

      const result = eventDataSchema.parse(minimalData);
      expect(result.timezone).toBe('Asia/Seoul');
      expect(result.isAllDay).toBe(false);
      expect(result.cost).toBe(0);
      expect(result.hasWaitlist).toBe(true);
    });
  });

  describe('plugin definition', () => {
    it('should have correct id and context types', () => {
      expect(eventPlugin.id).toBe('event');
      expect(eventPlugin.contextTypes).toContain('EVENT');
    });

    it('should define activity types', () => {
      expect(eventPlugin.activityTypes).toBeDefined();
      expect(eventPlugin.activityTypes?.some((t) => t.type === 'RSVP')).toBe(true);
      expect(eventPlugin.activityTypes?.some((t) => t.type === 'CHECKIN')).toBe(true);
    });

    it('should define address patterns', () => {
      expect(eventPlugin.addressPatterns).toBeDefined();
      expect(
        eventPlugin.addressPatterns?.some((p) => p.pattern.includes('hosts'))
      ).toBe(true);
      expect(
        eventPlugin.addressPatterns?.some((p) => p.pattern.includes('attendees'))
      ).toBe(true);
    });

    it('should define permissions', () => {
      expect(eventPlugin.permissions).toBeDefined();
      expect(
        eventPlugin.permissions?.some((p) => p.id === 'manage_rsvps')
      ).toBe(true);
      expect(
        eventPlugin.permissions?.some((p) => p.id === 'check_in')
      ).toBe(true);
    });

    it('should define membership fields', () => {
      expect(eventPlugin.membershipFields).toBeDefined();
      expect(
        eventPlugin.membershipFields?.some((f) => f.field === 'rsvpStatus')
      ).toBe(true);
      expect(
        eventPlugin.membershipFields?.some((f) => f.field === 'paymentStatus')
      ).toBe(true);
    });
  });
});

// =============================================================================
// Group Plugin Tests
// =============================================================================

describe('GroupPlugin', () => {
  describe('schema validation', () => {
    it('should validate valid group data', () => {
      const validData = {
        ...defaultGroupData,
        groupType: 'community',
        tags: ['furry', 'korean'],
        moderation: {
          ...defaultGroupData.moderation,
          slowModeSeconds: 60,
        },
      };

      const result = groupDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate custom roles', () => {
      const dataWithRoles = {
        ...defaultGroupData,
        customRoles: [
          { name: 'VIP', color: '#FF5500', permissions: [] },
          { name: 'Artist', color: '#00FF55', permissions: ['post_art'] },
        ],
      };

      const result = groupDataSchema.safeParse(dataWithRoles);
      expect(result.success).toBe(true);
    });

    it('should reject invalid color format', () => {
      const invalidData = {
        ...defaultGroupData,
        customRoles: [
          { name: 'Bad', color: 'not-a-color', permissions: [] },
        ],
      };

      const result = groupDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('plugin definition', () => {
    it('should have correct id and context types', () => {
      expect(groupPlugin.id).toBe('group');
      expect(groupPlugin.contextTypes).toContain('GROUP');
    });

    it('should define activity types', () => {
      expect(groupPlugin.activityTypes).toBeDefined();
      expect(
        groupPlugin.activityTypes?.some((t) => t.type === 'ANNOUNCEMENT')
      ).toBe(true);
      expect(groupPlugin.activityTypes?.some((t) => t.type === 'POLL')).toBe(true);
    });

    it('should define moderation permissions', () => {
      expect(groupPlugin.permissions).toBeDefined();
      expect(
        groupPlugin.permissions?.some((p) => p.id === 'moderate_posts')
      ).toBe(true);
      expect(
        groupPlugin.permissions?.some((p) => p.id === 'issue_warnings')
      ).toBe(true);
    });
  });
});

// =============================================================================
// Convention Plugin Tests
// =============================================================================

describe('ConventionPlugin', () => {
  describe('schema validation', () => {
    it('should validate valid convention data', () => {
      const validData = {
        ...defaultConventionData,
        scheduleDays: ['2026-02-01T00:00:00Z', '2026-02-02T00:00:00Z', '2026-02-03T00:00:00Z'],
        venueAddress: 'Coex Convention Center, Seoul',
        enableWhoIsHere: true,
      };

      const result = conventionDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate schedule items', () => {
      const dataWithSchedule = {
        ...defaultConventionData,
        schedule: [
          {
            id: 'cltest123456789012345',
            title: 'Opening Ceremony',
            startAt: '2026-02-01T10:00:00Z',
            endAt: '2026-02-01T11:00:00Z',
            location: 'Main Hall',
            category: 'Ceremony',
            hosts: [],
            requiresRsvp: false,
            tags: [],
          },
        ],
      };

      const result = conventionDataSchema.safeParse(dataWithSchedule);
      expect(result.success).toBe(true);
    });

    it('should validate dealers', () => {
      const dataWithDealers = {
        ...defaultConventionData,
        dealers: [
          {
            id: 'cltest123456789012345',
            name: 'Test Artist',
            tableNumber: 'A-12',
            category: 'Art',
          },
        ],
      };

      const result = conventionDataSchema.safeParse(dataWithDealers);
      expect(result.success).toBe(true);
    });

    it('should validate room parties', () => {
      const dataWithParties = {
        ...defaultConventionData,
        roomParties: [
          {
            id: 'cltest123456789012345',
            name: 'Dance Party',
            hostId: 'cluser123456789012345',
            startAt: '2026-02-01T21:00:00Z',
            isPublic: true,
            ageRestricted: false,
            tags: [],
          },
        ],
      };

      const result = conventionDataSchema.safeParse(dataWithParties);
      expect(result.success).toBe(true);
    });

    it('should reject invalid schedule item (missing required fields)', () => {
      const invalidData = {
        ...defaultConventionData,
        schedule: [
          {
            id: 'cltest123456789012345',
            // Missing title, startAt, endAt
          },
        ],
      };

      const result = conventionDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should apply defaults correctly', () => {
      const minimalData = {};

      const result = conventionDataSchema.parse(minimalData);
      expect(result.schedule).toEqual([]);
      expect(result.scheduleDays).toEqual([]);
      expect(result.dealers).toEqual([]);
      expect(result.roomParties).toEqual([]);
      expect(result.enableWhoIsHere).toBe(true);
      expect(result.allowUserParties).toBe(true);
      expect(result.whoIsHereRadius).toBe(0);
    });
  });

  describe('plugin definition', () => {
    it('should have correct id and context types', () => {
      expect(conventionPlugin.id).toBe('convention');
      expect(conventionPlugin.contextTypes).toContain('CONVENTION');
    });

    it('should define activity types', () => {
      expect(conventionPlugin.activityTypes).toBeDefined();
      expect(
        conventionPlugin.activityTypes?.some((t) => t.type === 'SCHEDULE_UPDATE')
      ).toBe(true);
      expect(
        conventionPlugin.activityTypes?.some((t) => t.type === 'ROOM_PARTY')
      ).toBe(true);
      expect(
        conventionPlugin.activityTypes?.some((t) => t.type === 'CHECK_IN')
      ).toBe(true);
    });

    it('should define address patterns', () => {
      expect(conventionPlugin.addressPatterns).toBeDefined();
      expect(
        conventionPlugin.addressPatterns?.some((p) => p.pattern.includes('staff'))
      ).toBe(true);
      expect(
        conventionPlugin.addressPatterns?.some((p) => p.pattern.includes('here'))
      ).toBe(true);
      expect(
        conventionPlugin.addressPatterns?.some((p) => p.pattern.includes('dealers'))
      ).toBe(true);
    });

    it('should define permissions', () => {
      expect(conventionPlugin.permissions).toBeDefined();
      expect(
        conventionPlugin.permissions?.some((p) => p.id === 'manage_schedule')
      ).toBe(true);
      expect(
        conventionPlugin.permissions?.some((p) => p.id === 'manage_dealers')
      ).toBe(true);
      expect(
        conventionPlugin.permissions?.some((p) => p.id === 'approve_parties')
      ).toBe(true);
      expect(
        conventionPlugin.permissions?.some((p) => p.id === 'check_in_attendees')
      ).toBe(true);
    });

    it('should define membership fields', () => {
      expect(conventionPlugin.membershipFields).toBeDefined();
      expect(
        conventionPlugin.membershipFields?.some((f) => f.field === 'checkedIn')
      ).toBe(true);
      expect(
        conventionPlugin.membershipFields?.some((f) => f.field === 'isHereNow')
      ).toBe(true);
      expect(
        conventionPlugin.membershipFields?.some((f) => f.field === 'savedScheduleItems')
      ).toBe(true);
    });

    it('should register UI components', () => {
      expect(conventionPlugin.components).toBeDefined();
      expect(conventionPlugin.components?.ContextSidebar).toBeDefined();
      expect(conventionPlugin.components?.ContextCard).toBeDefined();
    });
  });
});

// =============================================================================
// Global Plugin Registry Tests
// =============================================================================

describe('Global pluginRegistry', () => {
  it('should be a singleton', () => {
    expect(pluginRegistry).toBeDefined();
    expect(typeof pluginRegistry.register).toBe('function');
  });
});

describe('getPlugin helper', () => {
  it('should return typed plugin', () => {
    // Register a test plugin
    pluginRegistry.register({
      id: 'typed-test',
      name: 'Typed Test',
      description: 'Test',
      version: '1.0.0',
      contextTypes: ['GROUP'],
      dataSchema: z.object({ value: z.number() }),
      defaultData: { value: 42 },
    });

    const plugin = getPlugin<{ value: number }>('typed-test');
    expect(plugin).toBeDefined();
    expect(plugin?.defaultData.value).toBe(42);
  });
});
