/**
 * Direct Message Types
 * Shared types for DM components
 */

/**
 * Participant in a conversation
 */
export interface DMParticipant {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

/**
 * Message attachment
 */
export interface DMAttachment {
  id: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  alt: string | null;
}

/**
 * A single message in a conversation
 */
export interface DMMessage {
  id: string;
  content: string;
  published: Date;
  updated: Date;
  isFromMe: boolean;
  read: boolean;
  sender: DMParticipant;
  attachments: DMAttachment[];
}

/**
 * Conversation preview (for list view)
 */
export interface DMConversation {
  participant: DMParticipant;
  lastMessage: {
    id: string;
    content: string;
    published: Date;
    isFromMe: boolean;
  } | null;
  unreadCount: number;
}

/**
 * Get display name for a participant
 */
export function getParticipantDisplayName(participant: DMParticipant): string {
  return participant.displayName || participant.username || '알 수 없음';
}

/**
 * Get initials for avatar fallback
 */
export function getParticipantInitials(participant: DMParticipant): string {
  const name = getParticipantDisplayName(participant);
  return name.charAt(0).toUpperCase();
}

/**
 * Format message preview (truncate if too long)
 */
export function formatMessagePreview(content: string, maxLength: number = 50): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
}
