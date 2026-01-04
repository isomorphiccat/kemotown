/**
 * Plugin System Exports
 * Main entry point for the plugin system
 */

import { pluginRegistry } from './registry';
import { eventPlugin } from './event';
import { groupPlugin } from './group';

// =============================================================================
// Plugin Initialization
// =============================================================================

let initialized = false;

/**
 * Initialize and register all plugins
 * Called once at application startup
 */
export function initializePlugins(): void {
  if (initialized) {
    return;
  }

  // Register built-in plugins
  pluginRegistry.register(eventPlugin);
  pluginRegistry.register(groupPlugin);

  initialized = true;
  console.log(
    `[Plugins] Initialized ${pluginRegistry.count()} plugins:`,
    pluginRegistry.ids()
  );
}

// Auto-initialize when this module is imported
initializePlugins();

/**
 * Check if plugins are initialized
 */
export function isPluginsInitialized(): boolean {
  return initialized;
}

/**
 * Ensure plugins are initialized (call this before accessing plugins)
 */
export function ensurePluginsInitialized(): void {
  if (!initialized) {
    initializePlugins();
  }
}

// =============================================================================
// Exports
// =============================================================================

export { pluginRegistry, getPlugin } from './registry';

// Plugin exports
export { eventPlugin } from './event';
export { groupPlugin } from './group';

// Type exports
export type {
  Plugin,
  PluginActivityType,
  PluginAddressPattern,
  PluginPermission,
  PluginMembershipField,
  PluginComponents,
  PluginHooks,
  PluginContextProps,
  PluginFormProps,
  PluginPostProps,
  PluginMemberProps,
  ContextData,
  MembershipData,
  ActivityData,
} from './types';
