'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  priceKrw?: number;
  attendeeCap?: number;
  hostId: string;
  hostUsername?: string;
  hostFurryName?: string;
  attendeeCount?: number;
  userRsvpStatus?: 'attending' | 'considering' | 'not_attending' | null;
}

interface User {
  id: string;
  username: string;
  furryName?: string;
  profilePictureUrl?: string;
  interestTags?: string[];
}

interface TimelineItem {
  id: string;
  type: 'event_created' | 'user_joined' | 'rsvp_update';
  content: string;
  timestamp: string;
  userId?: string;
  username?: string;
  furryName?: string;
  eventId?: string;
  eventTitle?: string;
}

const Dashboard: React.FC = () => {
  const { data: session } = useSession();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Mock data for now - replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
        
        // Mock upcoming events
        setUpcomingEvents([
          {
            id: '1',
            title: '서울 퍼리 모임',
            description: '홍대에서 만나는 퍼리들의 즐거운 시간',
            startDate: '2025-01-25T19:00:00Z',
            endDate: '2025-01-25T22:00:00Z',
            location: '홍대 카페거리',
            priceKrw: 15000,
            hostId: 'host1',
            hostUsername: 'seoul_furry',
            hostFurryName: '서울늑대',
            attendeeCount: 12,
            attendeeCap: 20
          },
          {
            id: '2',
            title: 'Digital Art Workshop',
            description: 'Learn digital art techniques for furry characters',
            startDate: '2025-01-28T14:00:00Z',
            endDate: '2025-01-28T18:00:00Z',
            location: '온라인 (Discord)',
            priceKrw: 0,
            hostId: 'host2',
            hostUsername: 'artist_fox',
            hostFurryName: '아트폭스',
            attendeeCount: 8,
            attendeeCap: 15
          }
        ]);

        // Mock user's attending events
        setUserEvents([
          {
            id: '1',
            title: '서울 퍼리 모임',
            startDate: '2025-01-25T19:00:00Z',
            endDate: '2025-01-25T22:00:00Z',
            location: '홍대 카페거리',
            hostId: 'host1',
            hostUsername: 'seoul_furry',
            userRsvpStatus: 'attending'
          }
        ]);

        // Mock timeline
        setTimeline([
          {
            id: '1',
            type: 'event_created',
            content: '새로운 이벤트가 생성되었습니다',
            timestamp: '2025-01-22T10:30:00Z',
            username: 'seoul_furry',
            furryName: '서울늑대',
            eventId: '1',
            eventTitle: '서울 퍼리 모임'
          },
          {
            id: '2',
            type: 'user_joined',
            content: '새로운 멤버가 가입했습니다',
            timestamp: '2025-01-22T09:15:00Z',
            username: 'new_member',
            furryName: '새로운친구'
          },
          {
            id: '3',
            type: 'rsvp_update',
            content: '이벤트에 참가 신청했습니다',
            timestamp: '2025-01-22T08:45:00Z',
            username: 'happy_wolf',
            furryName: '행복늑대',
            eventId: '2',
            eventTitle: 'Digital Art Workshop'
          }
        ]);

        // Mock recent users
        setRecentUsers([
          {
            id: '1',
            username: 'art_enthusiast',
            furryName: '예술사랑',
            profilePictureUrl: undefined,
            interestTags: ['art', 'digital', 'character-design']
          },
          {
            id: '2',
            username: 'gaming_fox',
            furryName: '게임폭스',
            profilePictureUrl: undefined,
            interestTags: ['gaming', 'streaming', 'vr']
          },
          {
            id: '3',
            username: 'music_wolf',
            furryName: '음악늑대',
            profilePictureUrl: undefined,
            interestTags: ['music', 'composition', 'live-performance']
          }
        ]);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    return `${Math.floor(diffInHours / 24)}일 전`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300 font-korean">대시보드를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <h1 className="text-2xl font-bold text-primary font-korean">Kemotown</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/users">
                <Button variant="ghost" className="font-korean">멤버 둘러보기</Button>
              </Link>
              <Link href="/profile/me">
                <Button variant="ghost" className="font-korean">내 프로필</Button>
              </Link>
              <Link href="/api/auth/signout">
                <Button variant="outline" className="font-korean">로그아웃</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-korean">
            안녕하세요, {(session?.user as { furryName?: string; name?: string })?.furryName || session?.user?.name}님! 🎉
          </h2>
          <p className="text-gray-600 dark:text-gray-300 font-korean">
            오늘도 즐거운 퍼리 라이프 되세요!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your Events */}
            <Card>
              <CardHeader>
                <CardTitle className="font-korean">내 참여 이벤트</CardTitle>
                <CardDescription className="font-korean">
                  참가 예정인 이벤트들을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userEvents.length > 0 ? (
                  <div className="space-y-4">
                    {userEvents.slice(0, 2).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white font-korean">{event.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 font-korean">
                            {formatDate(event.startDate)} • {event.location}
                          </p>
                          <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-korean mt-2">
                            참가 확정
                          </span>
                        </div>
                        <Link href={`/events/${event.id}`}>
                          <Button variant="outline" size="sm" className="font-korean">자세히</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 dark:text-gray-400 mb-4 font-korean">참가 예정인 이벤트가 없습니다</p>
                    <Link href="/events">
                      <Button className="font-korean">이벤트 둘러보기</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Global Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="font-korean">커뮤니티 타임라인</CardTitle>
                <CardDescription className="font-korean">
                  최근 커뮤니티 활동을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">
                          {item.furryName?.charAt(0) || item.username?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white font-korean">
                          <span className="font-semibold">{item.furryName || item.username}</span>
                          {item.type === 'event_created' && ' 님이 새로운 이벤트를 만들었습니다'}
                          {item.type === 'user_joined' && ' 님이 커뮤니티에 가입했습니다'}
                          {item.type === 'rsvp_update' && ' 님이 이벤트에 참가 신청했습니다'}
                        </p>
                        {item.eventTitle && (
                          <p className="text-sm text-primary font-korean mt-1">&ldquo;{item.eventTitle}&rdquo;</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-korean">
                          {formatTimeAgo(item.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="font-korean">내 프로필</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary text-2xl font-bold">
                      {((session?.user as { furryName?: string; name?: string })?.furryName || session?.user?.name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white font-korean">
                    {(session?.user as { furryName?: string; name?: string })?.furryName || session?.user?.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-korean">
                    @{(session?.user as { username?: string })?.username || 'username'}
                  </p>
                  <Link href="/profile/me" className="mt-4 block">
                    <Button variant="outline" size="sm" className="w-full font-korean">프로필 보기</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="font-korean">다가오는 이벤트</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white font-korean">
                        {event.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-korean">
                        {formatDate(event.startDate)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-korean">
                        {event.attendeeCount}/{event.attendeeCap} 참가
                      </p>
                    </div>
                  ))}
                </div>
                <Link href="/events" className="mt-4 block">
                  <Button variant="ghost" size="sm" className="w-full font-korean">모든 이벤트 보기</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Members */}
            <Card>
              <CardHeader>
                <CardTitle className="font-korean">새로운 멤버</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary text-sm font-bold">
                          {(user.furryName || user.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white font-korean truncate">
                          {user.furryName || user.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-korean">
                          {user.interestTags?.slice(0, 2).join(', ')}
                        </p>
                      </div>
                      <Link href={`/profile/${user.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs font-korean">보기</Button>
                      </Link>
                    </div>
                  ))}
                </div>
                <Link href="/users" className="mt-4 block">
                  <Button variant="ghost" size="sm" className="w-full font-korean">모든 멤버 보기</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;