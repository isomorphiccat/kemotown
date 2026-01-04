'use client';

/**
 * GroupCard Component
 * Card for displaying groups in listings and discovery
 */

import Link from 'next/link';
import Image from 'next/image';
import { Users, Lock, Globe, Shield, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PluginContextProps } from '../../types';
import type { GroupPluginData, GroupType } from '../schema';

interface GroupCardProps extends PluginContextProps {
  /** Show compact variant */
  compact?: boolean;
  /** Member count */
  memberCount?: number;
  /** Additional CSS classes */
  className?: string;
}

const groupTypeLabels: Record<GroupType, string> = {
  community: '커뮤니티',
  interest: '관심사',
  regional: '지역',
  species: '종족',
  convention: '행사',
  other: '기타',
};

const groupTypeColors: Record<GroupType, string> = {
  community: 'bg-forest-500',
  interest: 'bg-accent-500',
  regional: 'bg-blue-500',
  species: 'bg-purple-500',
  convention: 'bg-orange-500',
  other: 'bg-warm-400',
};

export function GroupCard({
  context,
  pluginData,
  compact = false,
  memberCount,
  className,
}: GroupCardProps) {
  const groupData = pluginData as GroupPluginData;
  const isPrivate = context.features?.includes('private') ?? false;

  if (compact) {
    return (
      <Link
        href={`/c/${context.slug}`}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl hover:bg-warm-50 dark:hover:bg-forest-900/30 transition-colors',
          className
        )}
      >
        {/* Avatar */}
        {context.avatarUrl ? (
          <Image
            src={context.avatarUrl}
            alt=""
            width={48}
            height={48}
            className="w-12 h-12 rounded-lg object-cover"
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-forest flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-forest-800 dark:text-cream-100 truncate">
              {context.name}
            </h4>
            {isPrivate && <Lock className="w-3.5 h-3.5 text-warm-400 shrink-0" />}
          </div>
          <p className="text-xs text-warm-500 flex items-center gap-1.5 mt-0.5">
            <Users className="w-3 h-3" />
            {memberCount?.toLocaleString() ?? '?'} 멤버
            {groupData.groupType && (
              <>
                <span>•</span>
                {groupTypeLabels[groupData.groupType]}
              </>
            )}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/c/${context.slug}`}
      className={cn(
        'block card-elevated hover:shadow-large transition-shadow overflow-hidden',
        className
      )}
    >
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-br from-forest-400 to-forest-600">
        {context.bannerUrl && (
          <Image
            src={context.bannerUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        )}

        {/* Type Badge */}
        {groupData.groupType && (
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                'px-2 py-1 text-xs font-medium text-white rounded-lg shadow-md',
                groupTypeColors[groupData.groupType]
              )}
            >
              {groupTypeLabels[groupData.groupType]}
            </span>
          </div>
        )}

        {/* Privacy Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 text-xs font-medium bg-card/90 backdrop-blur-sm rounded-lg shadow-md flex items-center gap-1">
            {isPrivate ? (
              <>
                <Lock className="w-3 h-3 text-warm-500" />
                <span className="text-warm-600 dark:text-warm-400">비공개</span>
              </>
            ) : (
              <>
                <Globe className="w-3 h-3 text-forest-500" />
                <span className="text-forest-600 dark:text-forest-400">공개</span>
              </>
            )}
          </span>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-6 left-4">
          {context.avatarUrl ? (
            <Image
              src={context.avatarUrl}
              alt=""
              width={56}
              height={56}
              className="w-14 h-14 rounded-xl border-4 border-card object-cover shadow-md"
              unoptimized
            />
          ) : (
            <div className="w-14 h-14 rounded-xl border-4 border-card bg-gradient-forest flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-8 pb-4 px-4">
        <h3 className="font-semibold text-forest-800 dark:text-cream-100 truncate">
          {context.name}
        </h3>

        {context.description && (
          <p className="text-sm text-warm-500 mt-1 line-clamp-2">
            {context.description}
          </p>
        )}

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-warm-600 dark:text-warm-400">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-warm-400" />
            <span>{memberCount?.toLocaleString() ?? '?'} 멤버</span>
          </div>

          {groupData.moderation?.requirePostApproval && (
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-warm-400" />
              <span>승인제</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {groupData.tags && groupData.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {groupData.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-warm-100 dark:bg-forest-800 text-warm-500 rounded flex items-center gap-1"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {groupData.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-warm-400">
                +{groupData.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
