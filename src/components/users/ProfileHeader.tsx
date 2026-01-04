'use client';

/**
 * ProfileHeader Component
 * User profile header with banner, avatar, and action buttons
 */

import Image from 'next/image';
import Link from 'next/link';
import { User } from '@prisma/client';
import { FollowButton } from './FollowButton';
import { BumpButton } from './BumpButton';
import { useSession } from 'next-auth/react';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const { data: session } = useSession();

  return (
    <div className="bg-cream-50/80 dark:bg-forest-900/60 backdrop-blur-sm rounded-2xl border border-warm-200/60 dark:border-forest-800/60 shadow-sm overflow-hidden mb-6">
      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-r from-forest-500 via-forest-600 to-forest-700 dark:from-forest-700 dark:via-forest-800 dark:to-forest-900">
        {user.bannerUrl && (
          <Image
            src={user.bannerUrl}
            alt="프로필 배너"
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="absolute -top-16 left-6">
          <div className="relative w-32 h-32 rounded-full border-4 border-cream-50 dark:border-forest-900 bg-cream-50 dark:bg-forest-900 overflow-hidden shadow-lg">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName ?? user.username ?? 'User'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-100 to-forest-200 dark:from-forest-800 dark:to-forest-700">
                <span className="text-4xl font-bold text-forest-500 dark:text-forest-400">
                  {(user.displayName ?? user.username ?? 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-4 gap-2">
          {!isOwnProfile && session?.user && (
            <>
              <FollowButton targetUserId={user.id} />
              <BumpButton receiverId={user.id} />
            </>
          )}
          {isOwnProfile && (
            <Link
              href="/profile/settings"
              className="px-4 py-2 bg-warm-100 dark:bg-forest-800 hover:bg-warm-200 dark:hover:bg-forest-700 text-warm-700 dark:text-warm-200 rounded-xl font-medium transition-colors font-korean"
            >
              프로필 수정
            </Link>
          )}
        </div>

        {/* User Info */}
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-forest-800 dark:text-cream-100">
            {user.displayName ?? user.username}
          </h1>
          <p className="text-warm-500 dark:text-warm-400">@{user.username}</p>

          {/* Species */}
          {user.species && (
            <div className="mt-2">
              <span className="inline-block bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300 text-sm px-3 py-1 rounded-full font-korean">
                {user.species}
              </span>
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <p className="mt-4 text-warm-600 dark:text-warm-300 whitespace-pre-wrap font-korean">{user.bio}</p>
          )}

          {/* Joined Date */}
          <p className="mt-4 text-sm text-warm-500 dark:text-warm-400 font-korean">
            {new Date(user.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
            })}
            에 가입
          </p>
        </div>
      </div>
    </div>
  );
}
