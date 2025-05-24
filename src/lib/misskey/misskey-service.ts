/**
 * MisskeyService - Core service for interacting with Misskey API
 */

import { 
  MisskeyUser, 
  MisskeyNote, 
  MisskeyChannel, 
  CreateNoteParams, 
  CreateChannelParams,
  ApiError 
} from './types';

export interface MisskeyServiceConfig {
  apiUrl: string;
  adminToken?: string;
}

export interface CreateBotUserParams {
  username: string;
  name: string;
  description: string;
  avatarUrl?: string;
  isBot: boolean;
}

export class MisskeyService {
  private apiUrl: string;
  private adminToken?: string;
  private userTokens: Map<string, string> = new Map();

  constructor(config: MisskeyServiceConfig) {
    this.apiUrl = config.apiUrl;
    this.adminToken = config.adminToken;
  }

  /**
   * Initialize the service and create admin token if needed
   */
  async initialize(): Promise<void> {
    // In production, this would create an admin token via Misskey's API
    // For now, we'll assume it's provided via environment variable
    if (!this.adminToken) {
      throw new Error('Admin token required for Misskey integration');
    }
  }

  /**
   * Make API request to Misskey
   */
  private async apiRequest<T>(
    endpoint: string, 
    params: Record<string, unknown> = {}, 
    token?: string
  ): Promise<T> {
    const url = `${this.apiUrl}/api/${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        i: token || this.adminToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json() as ApiError;
      throw new Error(`Misskey API error: ${error.error.message}`);
    }

    return response.json();
  }

  /**
   * Create or get a user (including bot users)
   */
  async createBotUser(params: CreateBotUserParams): Promise<MisskeyUser> {
    try {
      // First, try to find existing user
      const users = await this.apiRequest<MisskeyUser[]>('users/search', {
        query: params.username,
        limit: 1,
      });

      if (users.length > 0 && users[0].username === params.username) {
        return users[0];
      }

      // Create new bot user
      const user = await this.apiRequest<MisskeyUser>('admin/accounts/create', {
        username: params.username,
        password: this.generateSecurePassword(),
      });

      // Update user profile
      await this.apiRequest('admin/users/update', {
        userId: user.id,
        name: params.name,
        description: params.description,
        isBot: true,
      });

      // Generate API token for the bot
      const { token } = await this.apiRequest<{ token: string }>('admin/users/create-token', {
        userId: user.id,
        name: 'Kemotown Integration',
        permission: ['write:notes', 'read:channels', 'write:channels'],
      });

      this.userTokens.set(user.id, token);

      return user;
    } catch (error) {
      console.error('Failed to create bot user:', error);
      throw error;
    }
  }

  /**
   * Link a Kemotown user to Misskey
   */
  async createUser(kemotownUserId: string, username: string): Promise<MisskeyUser> {
    try {
      // Create regular user account
      const user = await this.apiRequest<MisskeyUser>('admin/accounts/create', {
        username: `kemo_${username}`,
        password: this.generateSecurePassword(),
      });

      // Generate API token for the user
      const { token } = await this.apiRequest<{ token: string }>('admin/users/create-token', {
        userId: user.id,
        name: 'Kemotown Integration',
        permission: ['write:notes', 'read:channels', 'write:channels'],
      });

      this.userTokens.set(kemotownUserId, token);

      return user;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Create a channel for an event
   */
  async createEventChannel(eventId: string, params: CreateChannelParams): Promise<MisskeyChannel> {
    try {
      const channel = await this.apiRequest<MisskeyChannel>('channels/create', params);
      return channel;
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error;
    }
  }

  /**
   * Post a note to timeline
   */
  async createNote(params: CreateNoteParams, userId?: string): Promise<MisskeyNote> {
    const token = userId ? this.userTokens.get(userId) : this.adminToken;
    
    if (!token) {
      throw new Error('No token available for user');
    }

    try {
      const note = await this.apiRequest<MisskeyNote>('notes/create', params, token);
      return note;
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  }

  /**
   * Get timeline (global or channel-specific)
   */
  async getTimeline(options: {
    channelId?: string;
    limit?: number;
    sinceId?: string;
    untilId?: string;
  } = {}): Promise<MisskeyNote[]> {
    const endpoint = options.channelId 
      ? 'channels/timeline' 
      : 'notes/local-timeline';

    try {
      const notes = await this.apiRequest<MisskeyNote[]>(endpoint, {
        channelId: options.channelId,
        limit: options.limit || 20,
        sinceId: options.sinceId,
        untilId: options.untilId,
      });

      return notes;
    } catch (error) {
      console.error('Failed to get timeline:', error);
      throw error;
    }
  }

  /**
   * Get streaming endpoint for real-time updates
   */
  getStreamingUrl(channelId?: string): string {
    const wsUrl = this.apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${wsUrl}/streaming?i=${this.adminToken}${channelId ? `&channel=${channelId}` : ''}`;
  }

  /**
   * Stream timeline updates
   */
  streamTimeline(
    onNote: (note: MisskeyNote) => void,
    options: { channelId?: string } = {}
  ): EventSource {
    const eventSource = new EventSource(this.getStreamingUrl(options.channelId));

    eventSource.addEventListener('note', (event) => {
      const note = JSON.parse(event.data) as MisskeyNote;
      onNote(note);
    });

    eventSource.addEventListener('error', (error) => {
      console.error('Streaming error:', error);
    });

    return eventSource;
  }

  /**
   * Generate secure password for auto-created accounts
   */
  private generateSecurePassword(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}