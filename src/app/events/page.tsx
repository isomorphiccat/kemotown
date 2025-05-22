'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  locationAddress?: string;
  cost: number;
  attendeeCap?: number;
  host: {
    id: string;
    username?: string;
    furryName?: string;
    profilePictureUrl?: string;
  };
  _count: {
    rsvps: number;
  };
}

interface EventsResponse {
  events: Event[];
  currentPage: number;
  totalPages: number;
  totalEvents: number;
}

const EventsPage: React.FC = () => {
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(true);

  const fetchEvents = async (page = 1, search = '', upcoming = true) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search && { search }),
        ...(upcoming && { upcoming: 'true' })
      });

      const response = await fetch(`/api/events?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data: EventsResponse = await response.json();
      setEvents(data.events);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1, searchQuery, showUpcomingOnly);
  }, [searchQuery, showUpcomingOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents(1, searchQuery, showUpcomingOnly);
  };

  const handlePageChange = (page: number) => {
    fetchEvents(page, searchQuery, showUpcomingOnly);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300 font-korean">이벤트를 불러오는 중...</p>
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
              <Link href="/">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
              </Link>
              <h1 className="text-2xl font-bold text-primary font-korean">이벤트</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  <Link href="/events/create">
                    <Button className="font-korean">이벤트 만들기</Button>
                  </Link>
                  <Link href="/">
                    <Button variant="ghost" className="font-korean">대시보드</Button>
                  </Link>
                </>
              ) : (
                <Link href="/login">
                  <Button className="font-korean">로그인</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                  이벤트 검색
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이벤트 제목이나 설명으로 검색..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center font-korean">
                  <input
                    type="checkbox"
                    checked={showUpcomingOnly}
                    onChange={(e) => setShowUpcomingOnly(e.target.checked)}
                    className="mr-2"
                  />
                  다가오는 이벤트만 보기
                </label>
                <Button type="submit" className="font-korean">검색</Button>
              </div>
            </form>
          </div>
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="font-korean line-clamp-2">
                      {event.title}
                    </CardTitle>
                    <CardDescription className="font-korean">
                      {event.host.furryName || event.host.username} 주최
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-korean line-clamp-3">
                        {event.description}
                      </p>
                      
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 font-korean">
                        <span>📅 {formatDate(event.startDate)}</span>
                      </div>
                      
                      {event.locationAddress && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 font-korean">
                          <span>📍 {event.locationAddress}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary font-korean">
                          {formatPrice(event.cost)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-korean">
                          {event._count.rsvps}/{event.attendeeCap || '∞'} 참가
                        </span>
                      </div>
                      
                      <Link href={`/events/${event.id}`} className="block">
                        <Button className="w-full font-korean">자세히 보기</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="font-korean"
                >
                  이전
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                      className="font-korean"
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="font-korean"
                >
                  다음
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🗓️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 font-korean">
              이벤트가 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 font-korean">
              {searchQuery ? '검색 조건에 맞는 이벤트가 없습니다.' : '아직 등록된 이벤트가 없습니다.'}
            </p>
            {session && (
              <Link href="/events/create">
                <Button className="font-korean">첫 번째 이벤트 만들어보기</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;