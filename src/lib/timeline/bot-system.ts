/**
 * Bot System for Kemotown Timeline
 * Implements a factory pattern for creating different types of bots
 */

import { PrismaClient, BotType, BotUser } from '@prisma/client';
import { TimelineService } from './timeline-service';

export interface BotConfig {
  username: string;
  displayName: string;
  description: string;
  avatarUrl?: string;
  botType: BotType;
  eventId?: string;
}

export interface Bot {
  id: string;
  user: BotUser;
  post: (content: string, eventId?: string) => Promise<void>;
  postWithTemplate: (template: string, variables: Record<string, string>, eventId?: string) => Promise<void>;
}

export class BotSystem {
  private prisma: PrismaClient;
  private timelineService: TimelineService;
  private bots: Map<string, Bot> = new Map();

  // Predefined bot configurations
  private static readonly BOT_CONFIGS: Record<BotType, Omit<BotConfig, 'botType' | 'eventId'>> = {
    [BotType.SYSTEM]: {
      username: 'system',
      displayName: 'Kemotown System',
      description: 'Official Kemotown system notifications',
      avatarUrl: '/images/bots/system-bot.png',
    },
    [BotType.WELCOME]: {
      username: 'welcome',
      displayName: 'Welcome Bot',
      description: 'Welcomes new members to Kemotown',
      avatarUrl: '/images/bots/welcome-bot.png',
    },
    [BotType.EVENT_NOTIFY]: {
      username: 'event_notify',
      displayName: 'Event Notification',
      description: 'Event updates and announcements',
      avatarUrl: '/images/bots/event-bot.png',
    },
    [BotType.EVENT_MOD]: {
      username: 'event_mod',
      displayName: 'Event Moderator',
      description: 'Helps maintain event guidelines',
      avatarUrl: '/images/bots/moderator-bot.png',
    },
    [BotType.EVENT_HELPER]: {
      username: 'event_helper',
      displayName: 'Event Helper',
      description: 'Provides event information and assistance',
      avatarUrl: '/images/bots/helper-bot.png',
    },
  };

  constructor(prisma: PrismaClient, timelineService: TimelineService) {
    this.prisma = prisma;
    this.timelineService = timelineService;
  }

  /**
   * Initialize system-wide bots
   */
  async initialize(): Promise<void> {
    // Create or get system bot
    await this.getOrCreateBot(BotType.SYSTEM);
    
    // Create or get welcome bot
    await this.getOrCreateBot(BotType.WELCOME);
  }

  /**
   * Get or create a bot of specified type
   */
  async getOrCreateBot(type: BotType, eventId?: string): Promise<Bot> {
    const botKey = `${type}${eventId ? `:${eventId}` : ''}`;
    
    // Check if bot already exists in memory
    if (this.bots.has(botKey)) {
      return this.bots.get(botKey)!;
    }

    const config = BotSystem.BOT_CONFIGS[type];
    if (!config) {
      throw new Error(`No bot configuration found for BotType "${type}"`);
    }
    const botUsername = eventId 
      ? `${config.username}_${eventId.substring(0, 8)}`
      : config.username;

    // Check if bot user exists in database
    let botUser = await this.prisma.botUser.findUnique({
      where: { username: botUsername }
    });

    // Create bot user if it doesn't exist
    if (!botUser) {
      botUser = await this.prisma.botUser.create({
        data: {
          username: botUsername,
          displayName: config.displayName,
          description: config.description || '',
          avatarUrl: config.avatarUrl,
          botType: type,
          eventId: eventId,
          isActive: true,
        }
      });
    }

    // Create bot instance
    const bot: Bot = {
      id: botUser.id,
      user: botUser,
      
      post: async (content: string, postEventId?: string) => {
        await this.timelineService.createPost({
          content,
          botUserId: botUser.id,
          eventId: postEventId || eventId,
          isBot: true,
          botType: type,
        });
      },
      
      postWithTemplate: async (
        template: string, 
        variables: Record<string, string>, 
        postEventId?: string
      ) => {
        // Validate template is from a trusted source
        const allowedTemplates = [
          '🎉 {displayName} joined Kemotown! Welcome to our community!',
          '📅 New event: "{eventTitle}" by @{hostUsername}\n🔗 [View Event](/events/{eventId})',
          '{emoji} @{username} {action} "{eventTitle}"',
          'Hello {displayName}! 👋 Welcome to Kemotown! 🦊🐺🐱\n\nFeel free to introduce yourself, check out upcoming events, or create your own! If you have any questions, our community is here to help. Enjoy your stay! 💖',
          '🎉 Welcome to the {eventTitle} event timeline!\n\n' +
          'This is where you can chat with other attendees, share updates, and ask questions. ' +
          'Please keep discussions relevant to this event and be respectful to all participants. ' +
          'Have fun! 💖'
        ];
        
        if (!allowedTemplates.includes(template)) {
          throw new Error('Unauthorized template used');
        }
        
        let content = template;
        for (const [key, value] of Object.entries(variables)) {
          // Sanitize variable values to prevent injection
          const sanitizedValue = value.replace(/[<>&"']/g, (char) => {
            const entities: Record<string, string> = {
              '<': '&lt;',
              '>': '&gt;',
              '&': '&amp;',
              '"': '&quot;',
              "'": '&#x27;'
            };
            return entities[char] || char;
          });
          content = content.replace(new RegExp(`{${key}}`, 'g'), sanitizedValue);
        }
        await bot.post(content, postEventId);
      },
    };

    this.bots.set(botKey, bot);
    return bot;
  }

  /**
   * Create an event-specific bot
   */
  async createEventBot(eventId: string, type: BotType): Promise<Bot> {
    const eventBotTypes: BotType[] = [BotType.EVENT_NOTIFY, BotType.EVENT_MOD, BotType.EVENT_HELPER];
    if (!eventBotTypes.includes(type)) {
      throw new Error(`Invalid bot type for event: ${type}`);
    }
    
    return this.getOrCreateBot(type, eventId);
  }

  /**
   * Get system bot
   */
  async getSystemBot(): Promise<Bot> {
    return this.getOrCreateBot(BotType.SYSTEM);
  }

  /**
   * Get welcome bot
   */
  async getWelcomeBot(): Promise<Bot> {
    return this.getOrCreateBot(BotType.WELCOME);
  }

  /**
   * Post common system notifications
   */
  async notifyUserJoined(username: string, furryName?: string): Promise<void> {
    const bot = await this.getSystemBot();
    const displayName = furryName ? `${furryName} (@${username})` : `@${username}`;
    await bot.postWithTemplate(
      '🎉 {displayName} joined Kemotown! Welcome to our community!',
      { displayName }
    );
  }

  async notifyEventCreated(eventTitle: string, hostUsername: string, eventId: string): Promise<void> {
    const bot = await this.getSystemBot();
    await bot.postWithTemplate(
      '📅 New event: "{eventTitle}" by @{hostUsername}\n🔗 [View Event](/events/{eventId})',
      { eventTitle, hostUsername, eventId }
    );
  }

  async notifyEventRsvp(
    username: string, 
    eventTitle: string, 
    status: 'attending' | 'considering' | 'not_attending',
    eventId?: string
  ): Promise<void> {
    const emoji = status === 'attending' ? '✅' : status === 'considering' ? '🤔' : '❌';
    const action = status === 'attending' ? 'is attending' 
                 : status === 'considering' ? 'is considering' 
                 : 'cannot attend';
    
    const bot = await this.getSystemBot();
    await bot.postWithTemplate(
      '{emoji} @{username} {action} "{eventTitle}"',
      { emoji, username, action, eventTitle },
      eventId
    );
  }

  /**
   * Welcome a new user
   */
  async welcomeUser(username: string, furryName?: string): Promise<void> {
    const bot = await this.getWelcomeBot();
    const displayName = furryName || username;
    await bot.postWithTemplate(
      'Hello {displayName}! 👋 Welcome to Kemotown! 🦊🐺🐱\n\nFeel free to introduce yourself, check out upcoming events, or create your own! If you have any questions, our community is here to help. Enjoy your stay! 💖',
      { displayName }
    );
  }
}