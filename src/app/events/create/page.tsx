'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

const CreateEventPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Debug logging
  console.log('Create event page - status:', status);
  console.log('Create event page - session:', session);

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

  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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

  const formatDateTimeForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
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
          alert(errorData.message || '이벤트 생성 중 오류가 발생했습니다');
        }
        return;
      }

      const newEvent = await response.json();
      router.push(`/events/${newEvent.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('이벤트 생성 중 오류가 발생했습니다');
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300 font-korean">로딩 중...</p>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300 font-korean">로그인이 필요합니다...</p>
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
              <Link href="/events">
                <Button variant="ghost" className="font-korean">← 이벤트 목록</Button>
              </Link>
              <h1 className="text-2xl font-bold text-primary font-korean">이벤트 만들기</h1>
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
              <Link href="/">
                <Button variant="ghost" className="font-korean">대시보드</Button>
              </Link>
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
                  이벤트가 어떻게 보일지 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-korean mb-2">
                      {formData.title || '이벤트 제목'}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 font-korean">
                      {(session.user as { furryName?: string; name?: string })?.furryName || session.user?.name} 주최
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
            /* Edit Mode */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-korean">기본 정보</CardTitle>
                  <CardDescription className="font-korean">
                    이벤트의 기본 정보를 입력하세요
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
                      placeholder="예: 서울 퍼리 모임"
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
                        min={formatDateTimeForInput(new Date())}
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
                        min={formData.startDate || formatDateTimeForInput(new Date())}
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
                    마크다운을 사용하여 이벤트를 상세히 설명하세요. **굵게**, *기울임*, # 제목, - 목록 등을 사용할 수 있습니다.
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
                      placeholder="이벤트에 대한 자세한 설명을 마크다운으로 작성하세요.&#10;&#10;예:&#10;# 서울 퍼리 모임&#10;&#10;홍대에서 만나는 즐거운 퍼리 모임입니다!&#10;&#10;## 일정&#10;- 19:00 집합&#10;- 19:30 자기소개&#10;- 20:00 게임 및 대화&#10;&#10;**준비물**: 좋은 마음가짐"
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
                  <CardDescription className="font-korean">
                    이벤트 장소와 참가 관련 정보를 입력하세요
                  </CardDescription>
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
                      placeholder="예: 서울시 마포구 홍대입구역 2번 출구"
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
                      placeholder="https://map.naver.com/..."
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
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean"
                      />
                      {errors.cost && (
                        <p className="text-red-600 text-sm mt-1 font-korean">{errors.cost[0]}</p>
                      )}
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
                        placeholder="제한 없음"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean"
                      />
                      {errors.attendeeCap && (
                        <p className="text-red-600 text-sm mt-1 font-korean">{errors.attendeeCap[0]}</p>
                      )}
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
                  <CardDescription className="font-korean">
                    이벤트 규칙과 태그를 설정하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="eventRules" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                      이벤트 규칙 (선택사항)
                    </label>
                    <textarea
                      id="eventRules"
                      name="eventRules"
                      value={formData.eventRules}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="예:&#10;- 정중한 언행을 부탁드립니다&#10;- 사진 촬영 시 허락을 구해주세요&#10;- 늦을 경우 미리 연락해주세요"
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
                      placeholder="태그를 입력하고 Enter를 누르세요 (예: 모임, 게임, 음식)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white font-korean"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-korean">
                      Enter를 눌러 태그를 추가하세요
                    </p>
                    
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
              <div className="flex justify-end space-x-4">
                <Link href="/events">
                  <Button type="button" variant="outline" className="font-korean">
                    취소
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="font-korean"
                >
                  {loading ? '생성 중...' : '이벤트 만들기'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;