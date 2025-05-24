/**
 * Test endpoint for bot notifications
 * Only available in development mode
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'user_joined';

  // Test data
  const testData = {
    user_joined: {
      username: 'test-user',
      furryName: 'Test Fox',
      isNewUser: 'true'
    },
    event_created: {
      eventTitle: 'Test Fursuit Walk',
      hostUsername: 'test-host',
      eventId: 'test-event-123'
    },
    event_rsvp: {
      username: 'test-attendee',
      eventTitle: 'Test Meetup',
      status: 'attending',
      eventId: 'test-event-456'
    }
  };

  try {
    const apiKey = process.env.INTERNAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'INTERNAL_API_KEY not configured'
      }, { status: 500 });
    }

    const baseUrl = process.env.NEXTAUTH_URL;
    if (!baseUrl) {
      return NextResponse.json({
        error: 'NEXTAUTH_URL not configured'
      }, { status: 500 });
    }

    const response = await fetch(`${baseUrl}/api/timeline/bot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        type,
        data: testData[type as keyof typeof testData] || testData.user_joined
      })
    });

    const result = await response.json();
    
    return NextResponse.json({
      message: 'Test notification sent',
      type,
      response: result,
      status: response.status
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}