'use client';

/**
 * MemberList Component
 * Displays group members with roles
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Crown, Shield, Star, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface CustomRole {
  name: string;
  color: string;
  permissions?: string[];
}

interface MemberListProps {
  contextId: string;
  customRoles?: CustomRole[];
  initialCount?: number;
}

// Standard role icons
const roleIcons: Record<string, typeof Crown> = {
  OWNER: Crown,
  ADMIN: Shield,
  MODERATOR: Star,
};

const roleLabels: Record<string, string> = {
  OWNER: '오너',
  ADMIN: '관리자',
  MODERATOR: '모더레이터',
  MEMBER: '멤버',
  GUEST: '게스트',
};

export function MemberList({
  contextId,
  customRoles = [],
  initialCount = 8,
}: MemberListProps) {
  const [showAll, setShowAll] = useState(false);

  const { data: members, isLoading } = trpc.membership.list.useQuery(
    { contextId, status: 'APPROVED', limit: 50 },
    { enabled: !!contextId }
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-warm-100 dark:bg-forest-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!members || members.items.length === 0) {
    return (
      <div className="text-center py-6">
        <Users className="w-10 h-10 mx-auto text-warm-300 mb-2" />
        <p className="text-sm text-warm-500">아직 멤버가 없습니다</p>
      </div>
    );
  }

  // Sort: staff first, then by join date
  const sortedMembers = [...members.items].sort((a, b) => {
    const roleOrder = { OWNER: 0, ADMIN: 1, MODERATOR: 2, MEMBER: 3, GUEST: 4 };
    const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 5;
    const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 5;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  const displayMembers = showAll
    ? sortedMembers
    : sortedMembers.slice(0, initialCount);
  const hasMore = sortedMembers.length > initialCount;

  return (
    <div className="space-y-2">
      {displayMembers.map((member) => {
        const RoleIcon = roleIcons[member.role];
        const customRole = (
          member.pluginData as { group?: { customRole?: string } }
        )?.group?.customRole;
        const customRoleData = customRoles.find((r) => r.name === customRole);

        return (
          <Link
            key={member.id}
            href={`/profile/${member.user.username}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-warm-50 dark:hover:bg-forest-900/30 transition-colors"
          >
            {/* Avatar */}
            {member.user.avatarUrl ? (
              <Image
                src={member.user.avatarUrl}
                alt={member.user.displayName || member.user.username || ''}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-forest flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {(member.user.displayName || member.user.username || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-forest-800 dark:text-cream-100 truncate">
                  {member.user.displayName || member.user.username}
                </p>
                {RoleIcon && (
                  <RoleIcon
                    className={cn(
                      'w-3.5 h-3.5 shrink-0',
                      member.role === 'OWNER' && 'text-yellow-500',
                      member.role === 'ADMIN' && 'text-blue-500',
                      member.role === 'MODERATOR' && 'text-purple-500'
                    )}
                  />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-warm-500">@{member.user.username}</span>
                {customRoleData && (
                  <span
                    className="px-1.5 py-0.5 rounded text-white text-[10px] font-medium"
                    style={{ backgroundColor: customRoleData.color }}
                  >
                    {customRoleData.name}
                  </span>
                )}
              </div>
            </div>

            {/* Role Badge */}
            {member.role !== 'MEMBER' && member.role !== 'GUEST' && (
              <span className="text-xs text-warm-400">{roleLabels[member.role]}</span>
            )}
          </Link>
        );
      })}

      {/* Show More/Less */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm font-medium text-forest-600 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 flex items-center justify-center gap-1 transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>접기</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>{sortedMembers.length - initialCount}명 더 보기</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
