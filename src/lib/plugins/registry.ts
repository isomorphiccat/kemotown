/**
 * Plugin Registry
 * Central registry for managing and accessing plugins
 */

import type { Plugin, ContextType } from './types';

/**
 * Central registry for all plugins
 */
export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();

  /**
   * Register a plugin
   */
  register<TData>(plugin: Plugin<TData>): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin "${plugin.id}" already registered, overwriting`);
    }
    this.plugins.set(plugin.id, plugin as Plugin);
  }

  /**
   * Unregister a plugin
   */
  unregister(id: string): boolean {
    return this.plugins.delete(id);
  }

  /**
   * Get plugin by ID
   */
  get(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get typed plugin by ID
   */
  getTyped<TData>(id: string): Plugin<TData> | undefined {
    return this.plugins.get(id) as Plugin<TData> | undefined;
  }

  /**
   * Get all registered plugins
   */
  all(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins compatible with a context type
   */
  forContextType(type: ContextType): Plugin[] {
    return this.all().filter((p) => p.contextTypes.includes(type));
  }

  /**
   * Get default plugin for a context type
   */
  defaultForContextType(type: ContextType): Plugin | undefined {
    const plugins = this.forContextType(type);
    return plugins[0];
  }

  /**
   * Get all plugin IDs
   */
  ids(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if plugin exists
   */
  has(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * Get count of registered plugins
   */
  count(): number {
    return this.plugins.size;
  }

  /**
   * Get all activity types from all plugins
   */
  getAllActivityTypes(): Array<{
    pluginId: string;
    type: string;
    label: string;
    icon: string;
  }> {
    const types: Array<{
      pluginId: string;
      type: string;
      label: string;
      icon: string;
    }> = [];

    for (const plugin of this.plugins.values()) {
      if (plugin.activityTypes) {
        for (const at of plugin.activityTypes) {
          types.push({ pluginId: plugin.id, ...at });
        }
      }
    }

    return types;
  }

  /**
   * Get all address patterns from all plugins
   */
  getAllAddressPatterns(): Array<{
    pluginId: string;
    pattern: string;
    label: string;
    resolver: (contextId: string, userId: string) => Promise<boolean>;
  }> {
    const patterns: Array<{
      pluginId: string;
      pattern: string;
      label: string;
      resolver: (contextId: string, userId: string) => Promise<boolean>;
    }> = [];

    for (const plugin of this.plugins.values()) {
      if (plugin.addressPatterns) {
        for (const ap of plugin.addressPatterns) {
          patterns.push({ pluginId: plugin.id, ...ap });
        }
      }
    }

    return patterns;
  }

  /**
   * Validate plugin data
   */
  async validatePluginData(
    pluginId: string,
    data: unknown,
    context?: unknown
  ): Promise<{ valid: boolean; errors?: string[] }> {
    const plugin = this.get(pluginId);
    if (!plugin) {
      return { valid: false, errors: [`Plugin "${pluginId}" not found`] };
    }

    try {
      plugin.dataSchema.parse(data);
    } catch (error) {
      if (error instanceof Error) {
        return { valid: false, errors: [error.message] };
      }
      return { valid: false, errors: ['Invalid plugin data'] };
    }

    // Run plugin's custom validation if available
    if (plugin.hooks?.validateData && context) {
      return plugin.hooks.validateData(
        data,
        context as Parameters<NonNullable<typeof plugin.hooks.validateData>>[1]
      );
    }

    return { valid: true };
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();

// Helper to get typed plugin
export function getPlugin<TData>(id: string): Plugin<TData> | undefined {
  return pluginRegistry.getTyped<TData>(id);
}
