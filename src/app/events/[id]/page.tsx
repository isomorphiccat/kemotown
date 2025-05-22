'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EventDetail {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  locationAddress?: string;
  naverMapUrl?: string;
  isLocationPublic: boolean;
  cost: number;
  attendeeCap?: number;
  eventRules?: string;
  tags: string[];
  host: {
    id: string;
    username?: string;
    furryName?: string;
    profilePictureUrl?: string;
  };
  rsvps: Array<{
    id: string;
    status: string;
    user: {
      id: string;
      username?: string;
      furryName?: string;
      profilePictureUrl?: string;
    };
  }>;
  userRsvpStatus?: string | null;
  attendeesCount: number;
}

const EventDetailPage: React.FC = () => {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const eventId = params.id as string;

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/events');
          return;
        }
        throw new Error('Failed to fetch event');
      }

      const data: EventDetail = await response.json();
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      router.push('/events');
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleRSVP = async (status: 'ATTENDING' | 'CONSIDERING' | 'NOT_ATTENDING') => {
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      setRsvpLoading(true);
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'RSVP 처리 중 오류가 발생했습니다');
        return;
      }

      // Refresh event data to show updated RSVP status
      await fetchEvent();
    } catch (error) {
      console.error('Error updating RSVP:', error);
      alert('RSVP 처리 중 오류가 발생했습니다');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleCancelRSVP = async () => {
    if (!session) return;

    try {
      setRsvpLoading(true);
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'RSVP 취소 중 오류가 발생했습니다');
        return;
      }

      // Refresh event data to show updated RSVP status
      await fetchEvent();
    } catch (error) {
      console.error('Error cancelling RSVP:', error);
      alert('RSVP 취소 중 오류가 발생했습니다');
    } finally {
      setRsvpLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    if (price === 0) return '무료';
    return `₩${price.toLocaleString()}`;
  };

  const getRSVPStatusText = (status: string) => {
    switch (status) {
      case 'ATTENDING': return '참가 확정';
      case 'CONSIDERING': return '참가 고려중';
      case 'NOT_ATTENDING': return '참가 안함';
      default: return status;
    }
  };

  const getRSVPStatusColor = (status: string) => {
    switch (status) {
      case 'ATTENDING': return 'bg-green-100 text-green-800';
      case 'CONSIDERING': return 'bg-yellow-100 text-yellow-800';
      case 'NOT_ATTENDING': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300 font-korean">이벤트를 불러오는 중...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300 font-korean">이벤트를 찾을 수 없습니다</p>
      </div>
    );
  }

  const isHost = session?.user && (session.user as { id?: string }).id === event.host.id;
  const isEventPast = new Date(event.startDate) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/events">
                <Button variant="ghost" className="font-korean">← 이벤트 목록</Button>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {isHost && (
                <Link href={`/events/edit/${event.id}`}>
                  <Button variant="outline" className="font-korean">수정</Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="ghost" className="font-korean">대시보드</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold font-korean mb-2">
                      {event.title}
                    </CardTitle>
                    <CardDescription className="text-lg font-korean">
                      {event.host.furryName || event.host.username} 주최
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary font-korean mb-1">
                      {formatPrice(event.cost)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-korean">
                      {event.attendeesCount}/{event.attendeeCap || '∞'} 참가
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="font-korean">이벤트 상세</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-1">시작 시간</h4>
                    <p className="text-gray-600 dark:text-gray-300 font-korean">📅 {formatDate(event.startDate)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-1">종료 시간</h4>
                    <p className="text-gray-600 dark:text-gray-300 font-korean">📅 {formatDate(event.endDate)}</p>
                  </div>
                </div>
                
                {event.locationAddress && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-1">장소</h4>
                    <p className="text-gray-600 dark:text-gray-300 font-korean">📍 {event.locationAddress}</p>
                    {event.naverMapUrl && (
                      <a 
                        href={event.naverMapUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-korean text-sm"
                      >
                        네이버 지도에서 보기 →
                      </a>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-2">설명</h4>
                  <div className="prose prose-sm max-w-none dark:prose-invert font-korean">
                    {event.description.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>

                {event.eventRules && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-2">이벤트 규칙</h4>
                    <div className="prose prose-sm max-w-none dark:prose-invert font-korean">
                      {event.eventRules.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {event.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-2">태그</h4>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm font-korean"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RSVP Section */}
            {!isHost && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-korean">참가 신청</CardTitle>
                </CardHeader>
                <CardContent>
                  {!session ? (
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-300 mb-4 font-korean">
                        참가 신청하려면 로그인하세요
                      </p>
                      <Link href="/login">
                        <Button className="w-full font-korean">로그인</Button>
                      </Link>
                    </div>
                  ) : isEventPast ? (
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-300 font-korean">
                        이미 종료된 이벤트입니다
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {event.userRsvpStatus && (
                        <div className="text-center mb-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-korean ${getRSVPStatusColor(event.userRsvpStatus)}`}>
                            현재 상태: {getRSVPStatusText(event.userRsvpStatus)}
                          </span>
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => handleRSVP('ATTENDING')}
                        disabled={rsvpLoading}
                        className="w-full bg-green-600 hover:bg-green-700 font-korean"
                      >
                        {rsvpLoading ? '처리중...' : '참가하기'}
                      </Button>
                      
                      <Button 
                        onClick={() => handleRSVP('CONSIDERING')}
                        disabled={rsvpLoading}
                        variant="outline"
                        className="w-full font-korean"
                      >
                        {rsvpLoading ? '처리중...' : '참가 고려중'}
                      </Button>
                      
                      <Button 
                        onClick={() => handleRSVP('NOT_ATTENDING')}
                        disabled={rsvpLoading}
                        variant="outline"
                        className="w-full font-korean"
                      >
                        {rsvpLoading ? '처리중...' : '참가 안함'}
                      </Button>

                      {event.userRsvpStatus && (
                        <Button 
                          onClick={handleCancelRSVP}
                          disabled={rsvpLoading}
                          variant="ghost"
                          className="w-full text-red-600 hover:text-red-700 font-korean"
                        >
                          {rsvpLoading ? '처리중...' : 'RSVP 취소'}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Attendees List */}
            <Card>
              <CardHeader>
                <CardTitle className="font-korean">참가자 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {event.rsvps
                    .filter(rsvp => rsvp.status === 'ATTENDING')
                    .map((rsvp) => (
                      <div key={rsvp.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary text-sm font-bold">
                            {(rsvp.user.furryName || rsvp.user.username || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white font-korean truncate">
                            {rsvp.user.furryName || rsvp.user.username}
                          </p>
                        </div>
                      </div>
                    ))}
                  
                  {event.rsvps.filter(rsvp => rsvp.status === 'ATTENDING').length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-korean">
                      아직 참가자가 없습니다
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;