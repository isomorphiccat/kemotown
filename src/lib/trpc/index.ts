/**
 * tRPC Exports
 * Only export client utilities from barrel file.
 * Server utilities must be imported directly from './server' in Server Components.
 */

export { trpc } from './client';
// DO NOT export server utilities here - they contain 'server-only' imports
// Import directly: import { createServerCaller } from '@/lib/trpc/server';
