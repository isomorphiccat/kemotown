'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MisskeyNote } from '@/lib/misskey/types';
import { AlertCircle, MessageSquare, Heart, Repeat2, MoreHorizontal } from 'lucide-react';

interface MisskeyTimelineProps {
  channelId?: string;
  limit?: number;
  className?: string;
  showPostForm?: boolean;
}

export function MisskeyTimeline({ 
  channelId, 
  limit = 20, 
  className = '',
  showPostForm = true 
}: MisskeyTimelineProps) {
  const [notes, setNotes] = useState<MisskeyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  // Fetch timeline
  const fetchTimeline = useCallback(async () => {
    try {
      const endpoint = channelId 
        ? `/api/misskey/timeline?channelId=${channelId}&limit=${limit}`
        : `/api/misskey/timeline?limit=${limit}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      
      const data = await response.json();
      setNotes(data.notes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [channelId, limit]);

  // Post new note
  const handlePost = async () => {
    if (!postContent.trim() || posting) return;

    setPosting(true);
    try {
      const response = await fetch('/api/misskey/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: postContent,
          channelId,
        }),
      });

      if (!response.ok) throw new Error('Failed to post');

      setPostContent('');
      await fetchTimeline(); // Refresh timeline
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  // Set up real-time updates
  useEffect(() => {
    fetchTimeline();

    // Set up EventSource for real-time updates
    const eventSource = new EventSource(
      `/api/misskey/stream?${channelId ? `channelId=${channelId}` : ''}`
    );

    eventSource.addEventListener('note', (event) => {
      const newNote = JSON.parse(event.data) as MisskeyNote;
      setNotes(prev => [newNote, ...prev].slice(0, limit));
    });

    eventSource.addEventListener('error', () => {
      console.error('Stream connection error');
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [channelId, limit, fetchTimeline]);

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-muted h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Post form */}
      {showPostForm && (
        <Card className="p-4">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <Button 
              onClick={handlePost} 
              disabled={!postContent.trim() || posting}
              size="sm"
            >
              {posting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </Card>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No posts yet. Be the first to share something!</p>
          </Card>
        ) : (
          notes.map((note) => (
            <TimelineNote key={note.id} note={note} />
          ))
        )}
      </div>
    </div>
  );
}

function TimelineNote({ note }: { note: MisskeyNote }) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            {note.user.avatarUrl ? (
              <Image 
                src={note.user.avatarUrl} 
                alt={note.user.name || note.user.username}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <span className="text-sm font-medium">
                {(note.user.name || note.user.username).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {note.user.name || note.user.username}
            </span>
            <span className="text-xs text-muted-foreground">
              @{note.user.username}
            </span>
            {note.user.isBot && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                BOT
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {format(new Date(note.createdAt), 'MMM d, h:mm a')}
            </span>
          </div>

          {/* Note text */}
          {note.cw && (
            <details className="mb-2">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                CW: {note.cw}
              </summary>
              <div className="mt-2">
                <p className="text-sm whitespace-pre-wrap break-words">{note.text}</p>
              </div>
            </details>
          )}
          
          {!note.cw && note.text && (
            <p className="text-sm whitespace-pre-wrap break-words">{note.text}</p>
          )}

          {/* Files */}
          {note.files.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {note.files.map(file => (
                <div key={file.id} className="relative w-full h-32">
                  <Image 
                    src={file.thumbnailUrl || file.url} 
                    alt={file.name}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-4">
            <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">Reply</span>
            </button>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Repeat2 className="h-4 w-4" />
              <span className="text-xs">Renote</span>
            </button>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Heart className="h-4 w-4" />
              <span className="text-xs">{note.reactionCount || 0}</span>
            </button>
            <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}