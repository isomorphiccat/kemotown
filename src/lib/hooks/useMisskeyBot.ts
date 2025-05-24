import { useCallback } from 'react';

interface NotificationOptions {
  userJoined?: { username: string; furryName?: string };
  eventCreated?: { eventTitle: string; hostUsername: string; eventId: string };
  eventRsvp?: { username: string; eventTitle: string; status: 'attending' | 'considering' | 'not_attending' };
}

export function useMisskeyBot() {
  const postNotification = useCallback(async (options: NotificationOptions) => {
    try {
      const response = await fetch('/api/misskey/bot/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error('Failed to post notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Bot notification error:', error);
      throw error;
    }
  }, []);

  return { postNotification };
}