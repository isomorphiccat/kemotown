'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TimelinePost {
  id: string;
  content: string;
  channelType: string;
  isBot: boolean;
  botType?: string;
  createdAt: string;
  user?: {
    id: string;
    username: string | null;
    furryName: string | null;
    profilePictureUrl: string | null;
  } | null;
  botUser?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  event?: {
    id: string;
    title: string;
  } | null;
  reactions: Array<{
    id: string;
    emoji: string;
    userId: string;
  }>;
  reactionCount: number;
  mentions: Array<{
    id: string;
    username: string | null;
  }>;
}

interface TimelineProps {
  eventId?: string;
  limit?: number;
  showPostForm?: boolean;
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ 
  eventId, 
  limit = 20, 
  showPostForm = true,
  className 
}) => {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial posts
  const fetchPosts = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams();
      if (eventId) params.append('eventId', eventId);
      params.append('limit', limit.toString());
      if (cursor) params.append('cursor', cursor);

      const response = await fetch(`/api/timeline?${params}`);
      if (!response.ok) throw new Error('Failed to fetch timeline');

      const data = await response.json();
      
      if (cursor) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [eventId, limit]);

  // Fetch current user ID
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/users/me')
        .then(res => res.json())
        .then(data => setCurrentUserId(data.id))
        .catch(err => console.error('Failed to fetch user ID:', err));
    }
  }, [session?.user?.email]);

  // Set up real-time updates with reconnection
  useEffect(() => {
    fetchPosts();

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 2000; // 2 seconds

    const setupSSE = () => {
      const params = new URLSearchParams();
      if (eventId) params.append('eventId', eventId);
      
      const eventSource = new EventSource(`/api/timeline/stream?${params}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        reconnectAttempts = 0; // Reset on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_post') {
            // Add new post to the beginning of the list
            setPosts(prev => [data.post, ...prev]);
          } else if (data.type === 'reaction_update') {
            // Update reactions for a specific post
            setPosts(prev => prev.map(post => {
              if (post.id === data.postId) {
                const updatedReactions = data.action === 'add'
                  ? [...post.reactions, data.reaction]
                  : post.reactions.filter(r => 
                      !(r.userId === data.reaction.userId && r.emoji === data.reaction.emoji)
                    );
                
                return {
                  ...post,
                  reactions: updatedReactions,
                  reactionCount: updatedReactions.length
                };
              }
              return post;
            }));
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        
        // Attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts}) in ${reconnectDelay}ms...`);
          setTimeout(setupSSE, reconnectDelay);
        } else {
          console.error('Max reconnection attempts reached. Real-time updates disabled.');
        }
      };
    };

    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [eventId, fetchPosts]);

  // Handle post submission
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || posting) return;

    setPosting(true);
    try {
      const response = await fetch('/api/timeline/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postContent.trim(),
          eventId
        })
      });

      if (!response.ok) throw new Error('Failed to create post');

      setPostContent('');
      // The new post will be added via SSE
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setPosting(false);
    }
  };

  // Handle reaction toggle
  const handleReaction = async (postId: string, emoji: string, hasReacted: boolean) => {
    try {
      const url = `/api/timeline/posts/${postId}/reactions${hasReacted ? `?emoji=${emoji}` : ''}`;
      const response = await fetch(url, {
        method: hasReacted ? 'DELETE' : 'POST',
        headers: hasReacted ? {} : { 'Content-Type': 'application/json' },
        body: hasReacted ? undefined : JSON.stringify({ emoji })
      });

      if (!response.ok) throw new Error('Failed to update reaction');
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  // Load more posts
  const loadMore = () => {
    if (nextCursor && !loadingMore) {
      setLoadingMore(true);
      fetchPosts(nextCursor);
    }
  };

  // Render post content with mentions as links
  const renderContent = (content: string) => {
    return content.split(/(@\w+)/g).map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);
        return (
          <Link
            key={index}
            href={`/profile/${username}`}
            className="text-primary hover:underline"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <p className="text-gray-500 font-korean">타임라인을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Post Form */}
      {showPostForm && session && (
        <Card className="p-4">
          <form onSubmit={handlePost} className="space-y-3">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="무슨 생각을 하고 계신가요?"
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-korean"
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-korean">
                {postContent.length}/500
              </span>
              <Button 
                type="submit" 
                disabled={!postContent.trim() || posting}
                className="font-korean"
              >
                {posting ? '게시 중...' : '게시하기'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Timeline Posts */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 font-korean">
              아직 게시물이 없습니다. 첫 번째 게시물을 작성해보세요!
            </p>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    post.isBot ? "bg-blue-100" : "bg-primary/10"
                  )}>
                    <span className={cn(
                      "text-sm font-bold",
                      post.isBot ? "text-blue-600" : "text-primary"
                    )}>
                      {post.isBot ? '🤖' : 
                       post.user ? (post.user.furryName || post.user.username || '?').charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-baseline space-x-2 mb-1">
                    <Link 
                      href={post.isBot ? '#' : post.user ? `/profile/${post.user.username}` : '#'}
                      className={cn(
                        "font-semibold",
                        post.isBot ? "text-blue-600 cursor-default" : "text-gray-900 dark:text-white hover:underline"
                      )}
                    >
                      <span className="font-korean">
                        {post.isBot && post.botUser ? post.botUser.displayName :
                         post.user ? (post.user.furryName || post.user.username || 'Anonymous') : 'Anonymous'}
                      </span>
                    </Link>
                    {post.user?.username && !post.isBot && (
                      <span className="text-sm text-gray-500">@{post.user.username}</span>
                    )}
                    {post.isBot && post.botType && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-korean">
                        {post.botType === 'SYSTEM' ? '시스템' :
                         post.botType === 'WELCOME' ? '환영봇' :
                         post.botType === 'EVENT_NOTIFY' ? '이벤트 알림' :
                         post.botType === 'EVENT_MOD' ? '이벤트 관리' :
                         '도우미'}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">·</span>
                    <time className="text-sm text-gray-500 font-korean">
                      {formatDistanceToNow(new Date(post.createdAt), { 
                        addSuffix: true,
                        locale: ko 
                      })}
                    </time>
                  </div>

                  {/* Post content */}
                  <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words font-korean">
                    {renderContent(post.content)}
                  </div>

                  {/* Event link */}
                  {post.event && (
                    <Link 
                      href={`/events/${post.event.id}`}
                      className="inline-flex items-center mt-2 text-sm text-primary hover:underline font-korean"
                    >
                      📅 {post.event.title}
                    </Link>
                  )}

                  {/* Reactions */}
                  <div className="flex items-center space-x-4 mt-3">
                    {['👍', '❤️', '😂', '😮', '😢'].map((emoji) => {
                      const userReaction = post.reactions.find(
                        r => r.emoji === emoji && r.userId === currentUserId
                      );
                      const count = post.reactions.filter(r => r.emoji === emoji).length;

                      return (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(post.id, emoji, !!userReaction)}
                          className={cn(
                            "flex items-center space-x-1 px-2 py-1 rounded transition-colors",
                            userReaction 
                              ? "bg-primary/10 text-primary" 
                              : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <span>{emoji}</span>
                          {count > 0 && (
                            <span className="text-sm">{count}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {nextCursor && (
        <div className="text-center pt-4">
          <Button 
            onClick={loadMore} 
            variant="outline"
            disabled={loadingMore}
            className="font-korean"
          >
            {loadingMore ? '불러오는 중...' : '더 보기'}
          </Button>
        </div>
      )}
    </div>
  );
};