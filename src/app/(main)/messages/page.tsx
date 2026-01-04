'use client';

/**
 * Messages Page
 * Lists all DM conversations
 */

import { ConversationList } from '@/components/dm';

export default function MessagesPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ConversationList />
    </div>
  );
}
