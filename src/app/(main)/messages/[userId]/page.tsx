'use client';

/**
 * Conversation Page
 * Full chat view with a specific user
 */

import { use } from 'react';
import { ChatView } from '@/components/dm';

interface ConversationPageProps {
  params: Promise<{ userId: string }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { userId } = use(params);

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatView participantId={userId} />
    </div>
  );
}
