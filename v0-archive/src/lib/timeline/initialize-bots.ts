/**
 * Initialize system bots on application startup
 */

import { prisma } from '@/lib/db';
import { BotSystem, TimelineService } from '@/lib/timeline';

let initializationPromise: Promise<void> | null = null;

export async function initializeBots() {
  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Create new initialization promise
  initializationPromise = (async () => {
    try {
      const timelineService = new TimelineService(prisma);
      const botSystem = new BotSystem(prisma, timelineService);
      
      // Initialize system-wide bots
      await botSystem.initialize();
      
      console.log('System bots initialized successfully');
    } catch (error) {
      console.error('Failed to initialize system bots:', error);
      // Reset promise on error so it can be retried
      initializationPromise = null;
      throw error;
    }
  })();
  
  return initializationPromise;
}