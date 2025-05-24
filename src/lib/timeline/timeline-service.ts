/**
 * Timeline Service for Kemotown
 * Handles timeline posts, reactions, and mentions
 */

import { PrismaClient, TimelinePost, ChannelType, BotType, Prisma } from '@prisma/client';

export interface CreatePostInput {
  content: string;
  userId?: string;
  botUserId?: string;
  eventId?: string;
  isBot?: boolean;
  botType?: BotType;
}

export interface TimelinePostWithRelations extends TimelinePost {
  user?: {
    id: string;
    username: string | null;
    furryName: string | null;
    profilePictureUrl: string | null;
  } | null;
  botUser?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  event?: {
    id: string;
    title: string;
  } | null;
  reactions: {
    id: string;
    emoji: string;
    userId: string;
  }[];
  mentions: {
    id: string;
    mentionedId: string;
    mentionedUser: {
      id: string;
      username: string | null;
    };
  }[];
  _count: {
    reactions: number;
  };
}

export interface GetTimelineOptions {
  eventId?: string;
  limit?: number;
  cursor?: string;
  includeReactions?: boolean;
  includeMentions?: boolean;
}

export class TimelineService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new timeline post
   */
  async createPost(input: CreatePostInput): Promise<TimelinePostWithRelations> {
    // Extract mentions from content
    const mentionMatches = input.content.match(/@(\w+)/g) || [];
    const mentionUsernames = mentionMatches.map(m => m.substring(1));

    // Find mentioned users
    const mentionedUsers = await this.prisma.user.findMany({
      where: {
        username: {
          in: mentionUsernames
        }
      },
      select: {
        id: true,
        username: true
      }
    });

    // Validate that either userId or botUserId is provided, but not both
    if (!input.userId && !input.botUserId) {
      throw new Error('Either userId or botUserId must be provided');
    }
    if (input.userId && input.botUserId) {
      throw new Error('Cannot specify both userId and botUserId');
    }

    // Create the post with mentions
    const post = await this.prisma.timelinePost.create({
      data: {
        content: input.content,
        userId: input.userId,
        botUserId: input.botUserId,
        eventId: input.eventId,
        channelType: input.eventId ? ChannelType.EVENT : ChannelType.GLOBAL,
        isBot: input.isBot || false,
        botType: input.botType,
        mentions: {
          create: mentionedUsers.map(user => ({
            mentionedId: user.id
          }))
        }
      },
      include: this.getPostInclude(true, true)
    });

    return post as unknown as TimelinePostWithRelations;
  }

  /**
   * Get timeline posts
   */
  async getTimeline(options: GetTimelineOptions = {}): Promise<{
    posts: TimelinePostWithRelations[];
    nextCursor?: string;
  }> {
    const {
      eventId,
      limit = 20,
      cursor,
      includeReactions = true,
      includeMentions = true
    } = options;

    const where: Prisma.TimelinePostWhereInput = {
      channelType: eventId ? ChannelType.EVENT : ChannelType.GLOBAL,
      eventId: eventId || null
    };

    // Add cursor-based pagination
    if (cursor) {
      where.createdAt = {
        lt: new Date(cursor)
      };
    }

    const posts = await this.prisma.timelinePost.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit + 1, // Fetch one extra to determine if there's a next page
      include: this.getPostInclude(includeReactions, includeMentions)
    });

    // Determine if there's a next page
    let nextCursor: string | undefined;
    if (posts.length > limit) {
      const nextPost = posts.pop();
      nextCursor = nextPost?.createdAt.toISOString();
    }

    return {
      posts: posts as unknown as TimelinePostWithRelations[],
      nextCursor
    };
  }

  /**
   * Get a single post by ID
   */
  async getPost(postId: string): Promise<TimelinePostWithRelations | null> {
    const post = await this.prisma.timelinePost.findUnique({
      where: { id: postId },
      include: this.getPostInclude(true, true)
    });

    return post as unknown as TimelinePostWithRelations | null;
  }

  /**
   * Add a reaction to a post
   */
  async addReaction(postId: string, userId: string, emoji: string): Promise<void> {
    await this.prisma.reaction.create({
      data: {
        postId,
        userId,
        emoji
      }
    });
  }

  /**
   * Remove a reaction from a post
   */
  async removeReaction(postId: string, userId: string, emoji: string): Promise<void> {
    await this.prisma.reaction.delete({
      where: {
        postId_userId_emoji: {
          postId,
          userId,
          emoji
        }
      }
    });
  }

  /**
   * Get posts mentioning a specific user
   */
  async getMentions(userId: string, limit: number = 20): Promise<TimelinePostWithRelations[]> {
    const posts = await this.prisma.timelinePost.findMany({
      where: {
        mentions: {
          some: {
            mentionedId: userId
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: this.getPostInclude(true, true)
    });

    return posts as unknown as TimelinePostWithRelations[];
  }

  /**
   * Delete a post (only by the author or admin)
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    // Verify ownership
    const post = await this.prisma.timelinePost.findUnique({
      where: { id: postId },
      select: { userId: true }
    });

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.userId !== userId) {
      throw new Error('Unauthorized to delete this post');
    }

    await this.prisma.timelinePost.delete({
      where: { id: postId }
    });
  }

  /**
   * Helper to get consistent include options for posts
   */
  private getPostInclude(includeReactions: boolean, includeMentions: boolean) {
    return {
      user: {
        select: {
          id: true,
          username: true,
          furryName: true,
          profilePictureUrl: true
        }
      },
      botUser: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      },
      event: {
        select: {
          id: true,
          title: true
        }
      },
      reactions: includeReactions ? {
        select: {
          id: true,
          emoji: true,
          userId: true
        }
      } : false,
      mentions: includeMentions ? {
        select: {
          id: true,
          mentionedId: true,
          mentionedUser: {
            select: {
              id: true,
              username: true
            }
          }
        }
      } : false,
      _count: {
        select: {
          reactions: true
        }
      }
    };
  }
}