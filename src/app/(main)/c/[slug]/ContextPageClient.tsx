'use client';

/**
 * Context Page Client Component
 * Interactive client-side part of the context page
 */

import { useState } from 'react';
import { MessageSquare, Calendar, Users, Info } from 'lucide-react';
import { ContextHeader } from '@/components/context/ContextHeader';
import { TimelineV2 } from '@/components/timeline/TimelineV2';
import { ActivityComposer } from '@/components/timeline/ActivityComposer';
import { cn } from '@/lib/utils';
import type { ContextWithMembership } from '@/server/services/context.service';

interface ContextPageClientProps {
  context: ContextWithMembership;
  currentUserId?: string;
  userAvatar?: string | null;
  userDisplayName?: string | null;
}

type TabId = 'timeline' | 'events' | 'members' | 'about';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof MessageSquare;
}

const tabs: Tab[] = [
  { id: 'timeline', label: '타임라인', icon: MessageSquare },
  { id: 'events', label: '이벤트', icon: Calendar },
  { id: 'members', label: '멤버', icon: Users },
  { id: 'about', label: '소개', icon: Info },
];

export function ContextPageClient({
  context,
  currentUserId,
  userAvatar,
  userDisplayName,
}: ContextPageClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('timeline');
  const [, setRefreshKey] = useState(0);

  const isMember = context.userMembership?.status === 'APPROVED';

  const handleMembershipChange = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-card border-b border-warm-200 dark:border-forest-800">
        <div className="container max-w-4xl mx-auto">
          <ContextHeader
            context={context}
            currentUserId={currentUserId}
            onMembershipChange={handleMembershipChange}
          />

          {/* Tabs */}
          <div className="flex gap-1 px-4 sm:px-6 overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                    isActive
                      ? 'border-forest-500 text-forest-600 dark:text-forest-400'
                      : 'border-transparent text-warm-500 hover:text-forest-600 dark:hover:text-forest-400'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto py-6 px-4">
        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {/* Composer (only for members) */}
            {isMember && currentUserId && (
              <ActivityComposer
                avatarUrl={userAvatar}
                displayName={userDisplayName}
                contextId={context.id}
                placeholder={`${context.name}에 글을 작성해보세요...`}
              />
            )}

            {/* Timeline */}
            <TimelineV2
              type="context"
              contextId={context.id}
              currentUserId={currentUserId}
            />
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-warm-300 mb-4" />
            <h3 className="text-lg font-semibold text-warm-600 dark:text-warm-400 mb-2">
              이벤트
            </h3>
            <p className="text-warm-500">
              이 공간의 예정된 이벤트가 표시됩니다.
            </p>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-warm-300 mb-4" />
            <h3 className="text-lg font-semibold text-warm-600 dark:text-warm-400 mb-2">
              {context._count.memberships} 멤버
            </h3>
            <p className="text-warm-500">
              멤버 목록은 준비 중입니다.
            </p>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-forest-800 dark:text-cream-100 mb-4">
              소개
            </h3>
            {context.description ? (
              <p className="text-warm-600 dark:text-warm-400 whitespace-pre-wrap">
                {context.description}
              </p>
            ) : (
              <p className="text-warm-500 italic">
                소개 내용이 없습니다.
              </p>
            )}

            <hr className="my-6 border-warm-200 dark:border-forest-800" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-warm-500">유형</span>
                <p className="font-medium text-forest-800 dark:text-cream-100">
                  {context.features.includes('event') ? '이벤트' : '그룹'}
                </p>
              </div>
              <div>
                <span className="text-warm-500">공개 범위</span>
                <p className="font-medium text-forest-800 dark:text-cream-100">
                  {context.visibility === 'PRIVATE' ? '비공개' : '공개'}
                </p>
              </div>
              <div>
                <span className="text-warm-500">가입 정책</span>
                <p className="font-medium text-forest-800 dark:text-cream-100">
                  {context.joinPolicy === 'OPEN' && '누구나 참여'}
                  {context.joinPolicy === 'APPROVAL' && '승인 필요'}
                  {context.joinPolicy === 'INVITE' && '초대만'}
                  {context.joinPolicy === 'CLOSED' && '가입 불가'}
                </p>
              </div>
              <div>
                <span className="text-warm-500">멤버 수</span>
                <p className="font-medium text-forest-800 dark:text-cream-100">
                  {context._count.memberships}명
                </p>
              </div>
            </div>

            {context.owner && (
              <>
                <hr className="my-6 border-warm-200 dark:border-forest-800" />
                <div>
                  <span className="text-sm text-warm-500">운영자</span>
                  <p className="font-medium text-forest-800 dark:text-cream-100">
                    {context.owner.displayName || context.owner.username}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
