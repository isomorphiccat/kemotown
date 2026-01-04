/**
 * Events Page (/events)
 * Lists all public Event-type contexts
 */

import { auth } from '@/lib/auth';
import { EventsPageClient } from './EventsPageClient';

export const metadata = {
  title: '이벤트 | 케모타운',
  description: '케모타운에서 열리는 이벤트들을 확인하세요',
};

export default async function EventsPage() {
  const session = await auth();

  return (
    <EventsPageClient
      currentUserId={session?.user?.id}
    />
  );
}
