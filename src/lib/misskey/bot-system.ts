/**
 * Bot System for Kemotown Timeline Integration
 * Provides a generalized bot interface for system and event-specific notifications
 */

import { MisskeyService } from './misskey-service';
import { CreateNoteParams, MisskeyUser } from './types';

export enum BotType {
  SYSTEM = 'system',
  WELCOME = 'welcome',
  EVENT_NOTIFICATION = 'event_notification',
  EVENT_MODERATOR = 'event_moderator',
  EVENT_HELPER = 'event_helper',
}

export interface Bot {
  id: string;
  type: BotType;
  user: MisskeyUser;
  channelId?: string;
  
  post(content: string, options?: Partial<CreateNoteParams>): Promise<void>;
  postWithTemplate(template: string, variables: Record<string, string>, options?: Partial<CreateNoteParams>): Promise<void>;
}

export interface BotConfig {
  username: string;
  displayName: string;
  description: string;
  avatarUrl?: string;
}

export class BotSystem {
  private bots: Map<string, Bot> = new Map();
  private misskeyService: MisskeyService;
  
  // Predefined bot configurations
  private static readonly BOT_CONFIGS: Record<BotType, BotConfig> = {
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
    [BotType.EVENT_NOTIFICATION]: {
      username: 'event_notify',
      displayName: 'Event Notification',
      description: 'Event updates and announcements',
      avatarUrl: '/images/bots/event-bot.png',
    },
    [BotType.EVENT_MODERATOR]: {
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

  constructor(misskeyService: MisskeyService) {
    this.misskeyService = misskeyService;
  }

  /**
   * Initialize system-wide bots
   */
  async initialize(): Promise<void> {
    // Create system bot
    this.systemBot = await this.createBot(BotType.SYSTEM);
    
    // Create welcome bot
    this.welcomeBot = await this.createBot(BotType.WELCOME);
  }

  /**
   * Get or create a bot of specified type
   */
  private async createBot(type: BotType, channelId?: string): Promise<Bot> {
    const botKey = `${type}${channelId ? `:${channelId}` : ''}`;
    
    if (this.bots.has(botKey)) {
      return this.bots.get(botKey)!;
    }

    const config = BotSystem.BOT_CONFIGS[type];
    const botUsername = channelId 
      ? `${config.username}_${channelId.substring(0, 8)}`
      : config.username;

    // Create or get existing bot user
    const botUser = await this.misskeyService.createBotUser({
      username: botUsername,
      name: config.displayName,
      description: config.description,
      avatarUrl: config.avatarUrl,
      isBot: true,
    });

    const bot: Bot = {
      id: botUser.id,
      type,
      user: botUser,
      channelId,
      
      post: async (content: string, options?: Partial<CreateNoteParams>) => {
        await this.misskeyService.createNote({
          text: content,
          channelId: channelId,
          localOnly: true,
          ...options,
        }, botUser.id);
      },
      
      postWithTemplate: async (
        template: string, 
        variables: Record<string, string>, 
        options?: Partial<CreateNoteParams>
      ) => {
        let content = template;
        for (const [key, value] of Object.entries(variables)) {
          content = content.replace(new RegExp(`{${key}}`, 'g'), value);
        }
        await bot.post(content, options);
      },
    };

    this.bots.set(botKey, bot);
    return bot;
  }

  /**
   * Create an event-specific bot
   */
  async createEventBot(eventId: string, type: BotType, channelId: string): Promise<Bot> {
    if (![BotType.EVENT_NOTIFICATION, BotType.EVENT_MODERATOR, BotType.EVENT_HELPER].includes(type)) {
      throw new Error(`Invalid bot type for event: ${type}`);
    }
    
    return this.createBot(type, channelId);
  }

  /**
   * Get system bot (singleton)
   */
  private _systemBot?: Bot;
  get systemBot(): Bot {
    if (!this._systemBot) {
      throw new Error('Bot system not initialized');
    }
    return this._systemBot;
  }
  private set systemBot(bot: Bot) {
    this._systemBot = bot;
  }

  /**
   * Get welcome bot (singleton)
   */
  private _welcomeBot?: Bot;
  get welcomeBot(): Bot {
    if (!this._welcomeBot) {
      throw new Error('Bot system not initialized');
    }
    return this._welcomeBot;
  }
  private set welcomeBot(bot: Bot) {
    this._welcomeBot = bot;
  }

  /**
   * Post common system notifications
   */
  async notifyUserJoined(username: string, furryName?: string): Promise<void> {
    const displayName = furryName ? `${furryName} (@${username})` : `@${username}`;
    await this.systemBot.postWithTemplate(
      '🎉 {displayName} joined Kemotown! Welcome to our community!',
      { displayName }
    );
  }

  async notifyEventCreated(eventTitle: string, hostUsername: string, eventId: string): Promise<void> {
    await this.systemBot.postWithTemplate(
      '📅 New event: "{eventTitle}" by @{hostUsername}\n🔗 [View Event](/events/{eventId})',
      { eventTitle, hostUsername, eventId }
    );
  }

  async notifyEventRsvp(
    username: string, 
    eventTitle: string, 
    status: 'attending' | 'considering' | 'not_attending'
  ): Promise<void> {
    const emoji = status === 'attending' ? '✅' : status === 'considering' ? '🤔' : '❌';
    const action = status === 'attending' ? 'is attending' 
                 : status === 'considering' ? 'is considering' 
                 : 'cannot attend';
    
    await this.systemBot.postWithTemplate(
      '{emoji} @{username} {action} "{eventTitle}"',
      { emoji, username, action, eventTitle }
    );
  }
}