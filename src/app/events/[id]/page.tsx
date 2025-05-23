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
  attendeesCount: number;
  userRsvpStatus?: string | null;
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

  const renderMarkdown = (text: string) => {
    // Simple markdown parsing for preview
    return text.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mb-2">{line.substring(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold mb-2">{line.substring(3)}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold mb-2">{line.substring(4)}</h3>;
      } else if (line.startsWith('> ')) {
        return <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:text-gray-400 mb-2">{line.substring(2)}</blockquote>;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={index} className="ml-4 mb-1 list-disc">{line.substring(2)}</li>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        // Simple bold/italic parsing
        const processedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        return <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: processedLine }} />;
      }
    });
  };

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
                      <Link href={`/profile/${event.host.username}`} className="hover:text-primary transition-colors">
                        {event.host.furryName || event.host.username}
                      </Link>{' '}
                      주최
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
                    {renderMarkdown(event.description)}
                  </div>
                </div>

                {event.eventRules && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-2">이벤트 규칙</h4>
                    <div className="prose prose-sm max-w-none dark:prose-invert font-korean">
                      {renderMarkdown(event.eventRules)}
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
            {/* RSVP Section for Non-Hosts */}
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

            {/* Host Management Section */}
            {isHost && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-korean">이벤트 관리</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-korean mb-2">
                        👑 이벤트 주최자
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-korean">
                        참가자들이 RSVP를 보내면 아래 목록에서 확인할 수 있습니다
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <div className="text-lg font-bold text-green-700 dark:text-green-300">
                          {event.rsvps.filter(rsvp => rsvp.status === 'ATTENDING').length}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 font-korean">참가</div>
                      </div>
                      <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                          {event.rsvps.filter(rsvp => rsvp.status === 'CONSIDERING').length}
                        </div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 font-korean">고려중</div>
                      </div>
                      <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <div className="text-lg font-bold text-red-700 dark:text-red-300">
                          {event.rsvps.filter(rsvp => rsvp.status === 'NOT_ATTENDING').length}
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-400 font-korean">불참</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attendees List */}
            <Card>
              <CardHeader>
                <CardTitle className="font-korean">
                  참가자 목록 ({event.rsvps.filter(rsvp => rsvp.status === 'ATTENDING').length}명)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Attending */}
                  {event.rsvps.filter(rsvp => rsvp.status === 'ATTENDING').length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2 font-korean">✓ 참가 확정</h5>
                      <div className="space-y-2">
                        {event.rsvps
                          .filter(rsvp => rsvp.status === 'ATTENDING')
                          .map((rsvp) => (
                            <Link key={rsvp.id} href={`/profile/${rsvp.user.username}`} className="flex items-center space-x-3 p-2 bg-green-50 dark:bg-green-900/20 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                              <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                                <span className="text-green-700 dark:text-green-300 text-sm font-bold">
                                  {(rsvp.user.furryName || rsvp.user.username || '?').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white font-korean truncate">
                                  {rsvp.user.furryName || rsvp.user.username}
                                </p>
                              </div>
                            </Link>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Considering */}
                  {event.rsvps.filter(rsvp => rsvp.status === 'CONSIDERING').length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2 font-korean">🤔 참가 고려중</h5>
                      <div className="space-y-2">
                        {event.rsvps
                          .filter(rsvp => rsvp.status === 'CONSIDERING')
                          .map((rsvp) => (
                            <Link key={rsvp.id} href={`/profile/${rsvp.user.username}`} className="flex items-center space-x-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                                <span className="text-yellow-700 dark:text-yellow-300 text-sm font-bold">
                                  {(rsvp.user.furryName || rsvp.user.username || '?').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white font-korean truncate">
                                  {rsvp.user.furryName || rsvp.user.username}
                                </p>
                              </div>
                            </Link>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Empty state */}
                  {event.rsvps.filter(rsvp => rsvp.status === 'ATTENDING' || rsvp.status === 'CONSIDERING').length === 0 && (
                    <div className="text-center py-6">
                      <div className="text-4xl mb-2">👥</div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-korean">
                        아직 참가자가 없습니다
                      </p>
                      {!isHost && (
                        <p className="text-gray-400 dark:text-gray-500 text-xs font-korean mt-1">
                          첫 번째 참가자가 되어보세요!
                        </p>
                      )}
                    </div>
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