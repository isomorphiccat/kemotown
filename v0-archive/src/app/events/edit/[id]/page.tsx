'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  locationAddress: string;
  naverMapUrl: string;
  isLocationPublic: boolean;
  cost: number;
  attendeeCap: number | null;
  eventRules: string;
  tags: string[];
}

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
  };
}

const EditEventPage: React.FC = () => {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [event, setEvent] = useState<EventDetail | null>(null);

  const eventId = params.id as string;

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    locationAddress: '',
    naverMapUrl: '',
    isLocationPublic: true,
    cost: 0,
    attendeeCap: null,
    eventRules: '',
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');

  // Fetch event data on mount
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;

      try {
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/events');
            return;
          }
          throw new Error('Failed to fetch event');
        }

        const eventData: EventDetail = await response.json();
        
        // Check if current user is the host
        if (!session?.user || (session.user as { id?: string }).id !== eventData.host.id) {
          router.push(`/events/${eventId}`);
          return;
        }

        setEvent(eventData);
        
        // Populate form with existing data
        setFormData({
          title: eventData.title,
          description: eventData.description,
          startDate: new Date(eventData.startDate).toISOString().slice(0, 16),
          endDate: new Date(eventData.endDate).toISOString().slice(0, 16),
          locationAddress: eventData.locationAddress || '',
          naverMapUrl: eventData.naverMapUrl || '',
          isLocationPublic: eventData.isLocationPublic,
          cost: eventData.cost,
          attendeeCap: eventData.attendeeCap || null,
          eventRules: eventData.eventRules || '',
          tags: eventData.tags,
        });
      } catch (error) {
        console.error('Error fetching event:', error);
        router.push('/events');
      } finally {
        setInitialLoading(false);
      }
    };

    if (session) {
      fetchEvent();
    }
  }, [eventId, session, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!session && !initialLoading) {
      router.push('/login');
    }
  }, [session, router, initialLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      const numValue = value === '' ? (name === 'attendeeCap' ? null : 0) : Number(value);
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          alert(errorData.message || '이벤트 수정 중 오류가 발생했습니다');
        }
        return;
      }

      router.push(`/events/${eventId}`);
    } catch (error) {
      console.error('Error updating event:', error);
      alert('이벤트 수정 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || '이벤트 삭제 중 오류가 발생했습니다');
        return;
      }

      router.push('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('이벤트 삭제 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdownPreview = (text: string) => {
    // Simple markdown parsing for preview
    return text.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mb-2">{line.substring(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold mb-2">{line.substring(3)}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold mb-2">{line.substring(4)}</h3>;
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 mb-1">• {line.substring(2)}</li>;
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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300 font-korean">이벤트를 불러오는 중...</p>
      </div>
    );
  }

  if (!session || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300 font-korean">이벤트를 찾을 수 없거나 권한이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href={`/events/${eventId}`}>
                <Button variant="ghost" className="font-korean">← 이벤트로 돌아가기</Button>
              </Link>
              <h1 className="text-2xl font-bold text-primary font-korean">이벤트 수정</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="font-korean"
              >
                {showPreview ? '편집' : '미리보기'}
              </Button>
              <Button 
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="font-korean"
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {showPreview ? (
            /* Preview Mode */
            <Card>
              <CardHeader>
                <CardTitle className="font-korean">미리보기</CardTitle>
                <CardDescription className="font-korean">
                  수정된 이벤트가 어떻게 보일지 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-korean mb-2">
                      {formData.title || '이벤트 제목'}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 font-korean">
                      {event.host.furryName || event.host.username} 주최
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-1">시작 시간</h4>
                      <p className="text-gray-600 dark:text-gray-300 font-korean">
                        {formData.startDate ? new Date(formData.startDate).toLocaleDateString('ko-KR', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '날짜를 선택하세요'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-1">종료 시간</h4>
                      <p className="text-gray-600 dark:text-gray-300 font-korean">
                        {formData.endDate ? new Date(formData.endDate).toLocaleDateString('ko-KR', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '날짜를 선택하세요'}
                      </p>
                    </div>
                  </div>

                  {formData.locationAddress && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-1">장소</h4>
                      <p className="text-gray-600 dark:text-gray-300 font-korean">📍 {formData.locationAddress}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-1">참가비</h4>
                    <p className="text-2xl font-bold text-primary font-korean">
                      {formData.cost === 0 ? '무료' : `₩${formData.cost.toLocaleString()}`}
                    </p>
                  </div>

                  {formData.description && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-2">설명</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert font-korean border p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        {renderMarkdownPreview(formData.description)}
                      </div>
                    </div>
                  )}

                  {formData.eventRules && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-2">이벤트 규칙</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert font-korean border p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        {renderMarkdownPreview(formData.eventRules)}
                      </div>
                    </div>
                  )}

                  {formData.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white font-korean mb-2">태그</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
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
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Edit Mode - Same form as create page but with populated data */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-korean">기본 정보</CardTitle>
                  <CardDescription className="font-korean">
                    이벤트의 기본 정보를 수정하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                      이벤트 제목 *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean"
                      required
                    />
                    {errors.title && (
                      <p className="text-red-600 text-sm mt-1 font-korean">{errors.title[0]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                        시작 시간 *
                      </label>
                      <input
                        type="datetime-local"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean"
                        required
                      />
                      {errors.startDate && (
                        <p className="text-red-600 text-sm mt-1 font-korean">{errors.startDate[0]}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                        종료 시간 *
                      </label>
                      <input
                        type="datetime-local"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        min={formData.startDate}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean"
                        required
                      />
                      {errors.endDate && (
                        <p className="text-red-600 text-sm mt-1 font-korean">{errors.endDate[0]}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-korean">이벤트 설명</CardTitle>
                  <CardDescription className="font-korean">
                    마크다운을 사용하여 이벤트를 상세히 설명하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                      설명 *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean font-mono text-sm"
                      required
                    />
                    {errors.description && (
                      <p className="text-red-600 text-sm mt-1 font-korean">{errors.description[0]}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Location & Logistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-korean">장소 및 세부사항</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="locationAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                      장소
                    </label>
                    <input
                      type="text"
                      id="locationAddress"
                      name="locationAddress"
                      value={formData.locationAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean"
                    />
                  </div>

                  <div>
                    <label htmlFor="naverMapUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                      네이버 지도 링크
                    </label>
                    <input
                      type="url"
                      id="naverMapUrl"
                      name="naverMapUrl"
                      value={formData.naverMapUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                        참가비 (원)
                      </label>
                      <input
                        type="number"
                        id="cost"
                        name="cost"
                        value={formData.cost}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean"
                      />
                    </div>

                    <div>
                      <label htmlFor="attendeeCap" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                        최대 참가자 수
                      </label>
                      <input
                        type="number"
                        id="attendeeCap"
                        name="attendeeCap"
                        value={formData.attendeeCap || ''}
                        onChange={handleInputChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isLocationPublic"
                      name="isLocationPublic"
                      checked={formData.isLocationPublic}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <label htmlFor="isLocationPublic" className="text-sm text-gray-700 dark:text-gray-300 font-korean">
                      장소를 공개적으로 표시
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Rules & Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-korean">추가 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="eventRules" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                      이벤트 규칙
                    </label>
                    <textarea
                      id="eventRules"
                      name="eventRules"
                      value={formData.eventRules}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                      태그
                    </label>
                    <input
                      type="text"
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="태그를 입력하고 Enter를 누르세요"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean"
                    />
                    
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-full text-sm font-korean"
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 text-primary hover:text-primary/70"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex justify-between">
                <div className="flex space-x-4">
                  <Link href={`/events/${eventId}`}>
                    <Button type="button" variant="outline" className="font-korean">
                      취소
                    </Button>
                  </Link>
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="font-korean"
                >
                  {loading ? '수정 중...' : '이벤트 수정'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditEventPage;