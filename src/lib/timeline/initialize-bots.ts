/**
 * Initialize system bots on application startup
 */

import { prisma } from '@/lib/db';
import { BotSystem, TimelineService } from '@/lib/timeline';

let initialized = false;

export async function initializeBots() {
  if (initialized) return;
  
  try {
    const timelineService = new TimelineService(prisma);
    const botSystem = new BotSystem(prisma, timelineService);
    
    // Initialize system-wide bots
    await botSystem.initialize();
    
    initialized = true;
    console.log('System bots initialized successfully');
  } catch (error) {
    console.error('Failed to initialize system bots:', error);
  }
}