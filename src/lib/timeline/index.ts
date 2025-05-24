/**
 * Timeline module exports
 */

export * from './bot-system';
export * from './timeline-service';

// Re-export types
export type { Bot, BotConfig } from './bot-system';
export type { 
  CreatePostInput, 
  TimelinePostWithRelations, 
  GetTimelineOptions 
} from './timeline-service';