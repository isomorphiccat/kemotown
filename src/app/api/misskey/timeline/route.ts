import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMisskeyService } from '@/lib/misskey-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const channelId = searchParams.get('channelId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const sinceId = searchParams.get('sinceId') || undefined;
    const untilId = searchParams.get('untilId') || undefined;

    const misskeyService = getMisskeyService();
    const notes = await misskeyService.getTimeline({
      channelId,
      limit,
      sinceId,
      untilId,
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Timeline fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}