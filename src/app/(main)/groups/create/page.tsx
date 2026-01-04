/**
 * Create Group Page
 * Form to create a new Group-type context
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Loader2, Shield } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TagInput } from '@/components/forms/TagInput';
import { useSession } from 'next-auth/react';
import type { GroupPluginData, GroupType } from '@/lib/plugins/group/schema';

const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  community: '커뮤니티',
  interest: '관심사',
  regional: '지역',
  species: '종족',
  convention: '컨벤션',
  other: '기타',
};

export default function CreateGroupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('community');
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('PUBLIC');
  const [joinPolicy, setJoinPolicy] = useState<'OPEN' | 'APPROVAL' | 'INVITE'>('OPEN');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [postingGuidelines, setPostingGuidelines] = useState('');

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
      setError('그룹 이름을 입력해주세요');
      return;
    }

    const pluginData: GroupPluginData = {
      groupType,
      tags,
      moderation: {
        requirePostApproval: false,
        allowedMediaTypes: ['image'],
        maxAttachmentsPerPost: 4,
        slowModeSeconds: 0,
        minMemberAgeMinutes: 0,
        enableAutoMod: false,
        bannedWords: [],
        linkWhitelist: [],
      },
      postingGuidelines: postingGuidelines.trim() || undefined,
      welcomeMessage: welcomeMessage.trim() || undefined,
      enablePolls: true,
      enableEvents: true,
      enableAnnouncements: true,
      customRoles: [],
      isDiscoverable: visibility === 'PUBLIC',
      requiredProfileFields: [],
    };

    createMutation.mutate({
      type: 'GROUP',
      name: name.trim(),
      description: description.trim() || undefined,
      visibility,
      joinPolicy,
      pluginId: 'group',
      pluginData,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-warm-600 hover:text-forest-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-korean">그룹 목록</span>
        </Link>
        <h1 className="text-3xl font-bold text-forest-800 dark:text-cream-100 font-korean">
          그룹 만들기
        </h1>
        <p className="text-warm-600 dark:text-warm-400 mt-1 font-korean">
          새로운 그룹을 만들어 커뮤니티를 시작하세요
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
            <Users className="w-5 h-5 text-forest-500" />
            기본 정보
          </h2>

          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean">
              그룹 이름 *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 서울 퍼리 모임"
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
              placeholder="그룹에 대해 설명해주세요..."
              rows={4}
              maxLength={2000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean">
              그룹 유형
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(GROUP_TYPE_LABELS) as GroupType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setGroupType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors font-korean ${
                    groupType === type
                      ? 'bg-forest-600 text-white'
                      : 'bg-warm-100 dark:bg-forest-800 text-forest-700 dark:text-cream-200 hover:bg-warm-200 dark:hover:bg-forest-700'
                  }`}
                >
                  {GROUP_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
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
              suggestions={['퍼리', '그림', '게임', '수트', '온라인', '오프라인', '신규환영', '18+']}
            />
          </div>
        </div>

        {/* Privacy & Access */}
        <div className="bg-cream-50/80 dark:bg-forest-900/60 rounded-2xl border border-warm-200/60 dark:border-forest-800/60 p-6 space-y-4">
          <h2 className="text-lg font-bold text-forest-800 dark:text-cream-100 font-korean flex items-center gap-2">
            <Shield className="w-5 h-5 text-forest-500" />
            공개 및 가입 설정
          </h2>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 font-korean">
              공개 설정
            </label>
            <div className="space-y-2">
              {([
                { value: 'PUBLIC', label: '전체 공개', desc: '누구나 그룹을 찾고 볼 수 있습니다' },
                { value: 'UNLISTED', label: '링크로만 접근', desc: '링크가 있는 사람만 접근할 수 있습니다' },
                { value: 'PRIVATE', label: '비공개', desc: '멤버만 그룹을 볼 수 있습니다' },
              ] as const).map((option) => (
                <label key={option.value} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-warm-100/50 dark:hover:bg-forest-800/50 transition-colors">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === option.value}
                    onChange={() => setVisibility(option.value)}
                    className="w-4 h-4 mt-0.5 text-forest-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-forest-700 dark:text-cream-200 font-korean">
                      {option.label}
                    </span>
                    <p className="text-xs text-warm-500 dark:text-warm-400 font-korean">
                      {option.desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 font-korean">
              가입 방식
            </label>
            <div className="space-y-2">
              {([
                { value: 'OPEN', label: '자유 가입', desc: '누구나 바로 가입할 수 있습니다' },
                { value: 'APPROVAL', label: '승인 필요', desc: '관리자가 가입을 승인해야 합니다' },
                { value: 'INVITE', label: '초대만', desc: '초대받은 사람만 가입할 수 있습니다' },
              ] as const).map((option) => (
                <label key={option.value} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-warm-100/50 dark:hover:bg-forest-800/50 transition-colors">
                  <input
                    type="radio"
                    name="joinPolicy"
                    checked={joinPolicy === option.value}
                    onChange={() => setJoinPolicy(option.value)}
                    className="w-4 h-4 mt-0.5 text-forest-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-forest-700 dark:text-cream-200 font-korean">
                      {option.label}
                    </span>
                    <p className="text-xs text-warm-500 dark:text-warm-400 font-korean">
                      {option.desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Welcome & Guidelines */}
        <div className="bg-cream-50/80 dark:bg-forest-900/60 rounded-2xl border border-warm-200/60 dark:border-forest-800/60 p-6 space-y-4">
          <h2 className="text-lg font-bold text-forest-800 dark:text-cream-100 font-korean">
            환영 메시지 및 규칙
          </h2>

          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean">
              환영 메시지 (선택)
            </label>
            <Textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="새 멤버에게 보여줄 환영 메시지..."
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-warm-500 dark:text-warm-400 mt-1 font-korean">
              새로운 멤버가 가입할 때 표시됩니다
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-cream-200 mb-2 font-korean">
              게시 가이드라인 (선택)
            </label>
            <Textarea
              value={postingGuidelines}
              onChange={(e) => setPostingGuidelines(e.target.value)}
              placeholder="그룹의 게시 규칙이나 가이드라인..."
              rows={4}
              maxLength={5000}
            />
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
              '그룹 만들기'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
