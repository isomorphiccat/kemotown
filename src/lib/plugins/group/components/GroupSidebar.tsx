'use client';

/**
 * GroupSidebar Component
 * Sidebar with group info, rules, and member list
 */

import { Users, Shield, Clock, AlertTriangle, Megaphone, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroupRules } from './GroupRules';
import { MemberList } from './MemberList';
import { trpc } from '@/lib/trpc';
import type { PluginContextProps } from '../../types';
import type { GroupPluginData } from '../schema';

export function GroupSidebar({
  context,
  membership,
  pluginData,
}: PluginContextProps) {
  const groupData = pluginData as GroupPluginData;

  const { data: stats } = trpc.groupPlugin.getStats.useQuery(
    { contextId: context.id },
    { enabled: !!context.id }
  );

  const isStaff = membership?.role && ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="card-elevated p-4">
        <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          그룹 정보
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-warm-50 dark:bg-forest-900/30 rounded-lg">
            <p className="text-2xl font-bold text-forest-700 dark:text-forest-300">
              {stats?.totalMembers.toLocaleString() ?? '-'}
            </p>
            <p className="text-xs text-warm-500 mt-0.5">멤버</p>
          </div>
          <div className="text-center p-3 bg-warm-50 dark:bg-forest-900/30 rounded-lg">
            <p className="text-2xl font-bold text-forest-700 dark:text-forest-300">
              {stats?.recentPostCount.toLocaleString() ?? '-'}
            </p>
            <p className="text-xs text-warm-500 mt-0.5">최근 게시글</p>
          </div>
        </div>

        {/* Moderation Info */}
        <div className="mt-4 space-y-2">
          {groupData.moderation?.slowModeSeconds > 0 && (
            <div className="flex items-center gap-2 text-sm text-warm-600 dark:text-warm-400">
              <Clock className="w-4 h-4 text-warm-400" />
              <span>
                슬로우 모드: {Math.floor(groupData.moderation.slowModeSeconds / 60)}분
              </span>
            </div>
          )}
          {groupData.moderation?.requirePostApproval && (
            <div className="flex items-center gap-2 text-sm text-warm-600 dark:text-warm-400">
              <Shield className="w-4 h-4 text-warm-400" />
              <span>게시글 승인 필요</span>
            </div>
          )}
        </div>

        {/* Pending Members (Staff Only) */}
        {isStaff && stats && stats.pendingMembers > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {stats.pendingMembers}명 가입 대기
                </span>
              </div>
              <Button variant="outline" size="sm">
                검토하기
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="card-elevated p-4">
        <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-3">
          그룹 기능
        </h3>
        <div className="space-y-2">
          {groupData.enableAnnouncements && (
            <div className="flex items-center gap-2 text-sm text-warm-600 dark:text-warm-400">
              <Megaphone className="w-4 h-4 text-forest-500" />
              <span>공지사항</span>
            </div>
          )}
          {groupData.enablePolls && (
            <div className="flex items-center gap-2 text-sm text-warm-600 dark:text-warm-400">
              <BarChart2 className="w-4 h-4 text-forest-500" />
              <span>투표</span>
            </div>
          )}
          {groupData.enableEvents && (
            <div className="flex items-center gap-2 text-sm text-warm-600 dark:text-warm-400">
              <Users className="w-4 h-4 text-forest-500" />
              <span>이벤트</span>
            </div>
          )}
        </div>
      </div>

      {/* Rules */}
      {(groupData.pinnedRules || groupData.postingGuidelines) && (
        <div className="card-elevated p-4">
          <GroupRules
            pinnedRules={groupData.pinnedRules}
            postingGuidelines={groupData.postingGuidelines}
          />
        </div>
      )}

      {/* Members */}
      <div className="card-elevated p-4">
        <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          멤버
        </h3>
        <MemberList
          contextId={context.id}
          customRoles={groupData.customRoles}
          initialCount={6}
        />
      </div>
    </div>
  );
}
