/**
 * Create Event Page
 * Form to create a new Event-type context
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Globe, Loader2, Users } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/forms/DateTimePicker';
import { TagInput } from '@/components/forms/TagInput';
import { useSession } from 'next-auth/react';
import type { EventPluginData } from '@/lib/plugins/event/schema';

type LocationType = 'physical' | 'online' | 'hybrid';

export default function CreateEventPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState<Date | undefined>(undefined);
  const [endAt, setEndAt] = useState<Date | undefined>(undefined);
  const [locationType, setLocationType] = useState<LocationType>('physical');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [onlineUrl, setOnlineUrl] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [cost, setCost] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('PUBLIC');
  const [joinPolicy, setJoinPolicy] = useState<'OPEN' | 'APPROVAL'>('OPEN');

  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.context.create.useMutation({
    onSuccess: (context) => {
      router.push(`/c/${context.slug}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-forest-500 mx-auto" />
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('이벤트 이름을 입력해주세요');
      return;
    }

    if (!startAt) {
      setError('시작 날짜를 선택해주세요');
      return;
    }

    if (!endAt) {
      setError('종료 날짜를 선택해주세요');
      return;
    }

    if (endAt <= startAt) {
      setError('종료 시간은 시작 시간보다 이후여야 합니다');
      return;
    }

    if (locationType !== 'online' && !locationName.trim()) {
      setError('장소 이름을 입력해주세요');
      return;
    }

    if (locationType !== 'physical' && !onlineUrl.trim()) {
      setError('온라인 참여 URL을 입력해주세요');
      return;
    }

    const pluginData: EventPluginData = {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      timezone: 'Asia/Seoul',
      isAllDay: false,
      locationType,
      location: locationType !== 'online' ? {
        name: locationName,
        address: locationAddress || undefined,
        isPublic: true,
      } : undefined,
      onlineUrl: locationType !== 'physical' ? onlineUrl : undefined,
      capacity: capacity ? Number(capacity) : undefined,
      cost,
      currency: 'KRW',
      paymentRequired: cost > 0,
      rsvpOptions: ['attending', 'not_attending'],
      requiresApproval: joinPolicy === 'APPROVAL',
      hasWaitlist: true,
      allowGuestPlus: false,
      maxGuestsPerRsvp: 0,
      tags,
    };

    createMutation.mutate({
      type: 'EVENT',
      name: name.trim(),
      description: description.trim() || undefined,
      visibility,
      joinPolicy,
      pluginId: 'event',
      pluginData,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-warm-600 hover:text-forest-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-korean">이벤트 목록</span>
        </Link>
        <h1 className="text-3xl font-bold text-forest-800 dark:text-cream-100 font-korean">
          이벤트 만들기
        </h1>
        <p className="text-warm-600 dark:text-warm-400 mt-1 font-korean">
          새로운 이벤트를 만들어 커뮤니티와 공유하세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 font-korean">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-cream-50/80 dark:bg-forest-900/60 rounded-2xl border border-warm-200/60 dark:border-forest-800/60 p-6 space-y-4">
          <h2 className="text-lg font-bold text-forest-800 dark:text-cream-100 font-korean flex items-center gap-2">
            <Calendar className="w-5 h-5 text-forest-500" />
            기본 정보
          </h2>

          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean">
              이벤트 이름 *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 서울 퍼밋 2024"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean">
              설명
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이벤트에 대해 설명해주세요..."
              rows={4}
              maxLength={2000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean">
              태그
            </label>
            <TagInput
              value={tags}
              onChange={setTags}
              maxTags={10}
              placeholder="태그를 입력하고 Enter"
              suggestions={['퍼밋', '온라인', '오프라인', '그림', '게임', '수트', '소규모', '대규모']}
            />
          </div>
        </div>

        {/* Date/Time */}
        <div className="bg-cream-50/80 dark:bg-forest-900/60 rounded-2xl border border-warm-200/60 dark:border-forest-800/60 p-6 space-y-4">
          <h2 className="text-lg font-bold text-forest-800 dark:text-cream-100 font-korean">
            날짜 및 시간
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean">
                시작 *
              </label>
              <DateTimePicker
                value={startAt}
                onChange={setStartAt}
                showTime
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean">
                종료 *
              </label>
              <DateTimePicker
                value={endAt}
                onChange={setEndAt}
                showTime
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-cream-50/80 dark:bg-forest-900/60 rounded-2xl border border-warm-200/60 dark:border-forest-800/60 p-6 space-y-4">
          <h2 className="text-lg font-bold text-forest-800 dark:text-cream-100 font-korean flex items-center gap-2">
            <MapPin className="w-5 h-5 text-forest-500" />
            장소
          </h2>

          <div className="flex gap-2">
            {(['physical', 'online', 'hybrid'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setLocationType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors font-korean ${
                  locationType === type
                    ? 'bg-forest-600 text-white'
                    : 'bg-warm-100 dark:bg-forest-800 text-forest-700 dark:text-cream-200 hover:bg-warm-200 dark:hover:bg-forest-700'
                }`}
              >
                {type === 'physical' && '오프라인'}
                {type === 'online' && '온라인'}
                {type === 'hybrid' && '하이브리드'}
              </button>
            ))}
          </div>

          {locationType !== 'online' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean">
                  장소 이름 *
                </label>
                <Input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="예: 코엑스 컨벤션홀"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean">
                  주소
                </label>
                <Input
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="예: 서울시 강남구 삼성동 159"
                  maxLength={500}
                />
              </div>
            </div>
          )}

          {locationType !== 'physical' && (
            <div>
              <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean flex items-center gap-2">
                <Globe className="w-4 h-4" />
                온라인 참여 URL *
              </label>
              <Input
                type="url"
                value={onlineUrl}
                onChange={(e) => setOnlineUrl(e.target.value)}
                placeholder="예: https://zoom.us/j/..."
              />
            </div>
          )}
        </div>

        {/* Capacity & Cost */}
        <div className="bg-cream-50/80 dark:bg-forest-900/60 rounded-2xl border border-warm-200/60 dark:border-forest-800/60 p-6 space-y-4">
          <h2 className="text-lg font-bold text-forest-800 dark:text-cream-100 font-korean flex items-center gap-2">
            <Users className="w-5 h-5 text-forest-500" />
            참가 설정
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean">
                정원 (선택)
              </label>
              <Input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : '')}
                placeholder="제한 없음"
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean">
                참가비 (원)
              </label>
              <Input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value) || 0)}
                min={0}
                step={1000}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 font-korean">
              참가 방식
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="joinPolicy"
                  checked={joinPolicy === 'OPEN'}
                  onChange={() => setJoinPolicy('OPEN')}
                  className="w-4 h-4 text-forest-600"
                />
                <span className="text-sm text-forest-700 dark:text-cream-200 font-korean">자유 참가</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="joinPolicy"
                  checked={joinPolicy === 'APPROVAL'}
                  onChange={() => setJoinPolicy('APPROVAL')}
                  className="w-4 h-4 text-forest-600"
                />
                <span className="text-sm text-forest-700 dark:text-cream-200 font-korean">승인 필요</span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 font-korean">
              공개 설정
            </label>
            <div className="flex gap-4 flex-wrap">
              {(['PUBLIC', 'UNLISTED', 'PRIVATE'] as const).map((v) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === v}
                    onChange={() => setVisibility(v)}
                    className="w-4 h-4 text-forest-600"
                  />
                  <span className="text-sm text-forest-700 dark:text-cream-200 font-korean">
                    {v === 'PUBLIC' && '전체 공개'}
                    {v === 'UNLISTED' && '링크로만 접근'}
                    {v === 'PRIVATE' && '비공개'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-forest-600 hover:bg-forest-700 text-white"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              '이벤트 만들기'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
