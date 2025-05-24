/**
 * Bot Notification API Route
 * POST /api/timeline/bot - Send bot notifications
 * Internal API for system events
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { BotSystem, TimelineService } from '@/lib/timeline';
import { BotType } from '@prisma/client';
import { z } from 'zod';
import { initializeBots } from '@/lib/timeline/initialize-bots';

// Input validation schema
const botNotificationSchema = z.object({
  type: z.enum(['user_joined', 'event_created', 'event_rsvp', 'welcome', 'create_event_bots']),
  data: z.record(z.string())
});

export async function POST(request: NextRequest) {
  try {
    // This is an internal API - require API key authentication in all environments
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.INTERNAL_API_KEY;
    
    if (!expectedKey) {
      console.error('INTERNAL_API_KEY environment variable is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    

    // Parse and validate request body
    const body = await request.json();
    const { type, data } = botNotificationSchema.parse(body);

    // Ensure bots are initialized
    await initializeBots();
    
    // Initialize services
    const timelineService = new TimelineService(prisma);
    const botSystem = new BotSystem(prisma, timelineService);

    // Handle different notification types
    switch (type) {
      case 'user_joined':
        await botSystem.notifyUserJoined(data.username, data.furryName);
        if (data.isNewUser === 'true') {
          await botSystem.welcomeUser(data.username, data.furryName);
        }
        break;

      case 'event_created':
        await botSystem.notifyEventCreated(
          data.eventTitle,
          data.hostUsername,
          data.eventId
        );
        break;

      case 'create_event_bots':
        // Create event-specific bots for the event
        await botSystem.createEventBot(data.eventId, BotType.EVENT_NOTIFY);
        await botSystem.createEventBot(data.eventId, BotType.EVENT_HELPER);
        
        // Post welcome message to event timeline
        const eventNotifyBot = await botSystem.getOrCreateBot(BotType.EVENT_NOTIFY, data.eventId);
        await eventNotifyBot.postWithTemplate(
          '🎉 Welcome to the {eventTitle} event timeline!\n\n' +
          'This is where you can chat with other attendees, share updates, and ask questions. ' +
          'Please keep discussions relevant to this event and be respectful to all participants. ' +
          'Have fun! 💖',
          { eventTitle: data.eventTitle },
          data.eventId
        );
        break;

      case 'event_rsvp':
        await botSystem.notifyEventRsvp(
          data.username,
          data.eventTitle,
          data.status as 'attending' | 'considering' | 'not_attending',
          data.eventId
        );
        break;

      case 'welcome':
        await botSystem.welcomeUser(data.username, data.furryName);
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Bot notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}