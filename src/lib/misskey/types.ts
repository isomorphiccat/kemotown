/**
 * Misskey integration types for Kemotown
 */

export interface MisskeyUser {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  isBot: boolean;
  createdAt: string;
}

export interface MisskeyNote {
  id: string;
  createdAt: string;
  userId: string;
  user: MisskeyUser;
  text: string | null;
  cw: string | null;
  visibility: 'public' | 'home' | 'followers' | 'specified';
  localOnly: boolean;
  channelId?: string | null;
  replyId?: string | null;
  renoteId?: string | null;
  files: MisskeyFile[];
  fileIds: string[];
  reactionCount: number;
  reactions: Record<string, number>;
}

export interface MisskeyFile {
  id: string;
  createdAt: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

export interface MisskeyChannel {
  id: string;
  createdAt: string;
  name: string;
  description?: string | null;
  bannerId?: string | null;
  notesCount: number;
  usersCount: number;
}

export interface CreateNoteParams {
  text?: string;
  cw?: string;
  visibility?: 'public' | 'home' | 'followers' | 'specified';
  localOnly?: boolean;
  channelId?: string;
  replyId?: string;
  renoteId?: string;
  fileIds?: string[];
}

export interface CreateChannelParams {
  name: string;
  description?: string;
  bannerId?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    id: string;
  };
}