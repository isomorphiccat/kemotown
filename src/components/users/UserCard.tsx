'use client';

/**
 * UserCard Component
 * Display user information in a card format for listings
 */

import Image from 'next/image';
import Link from 'next/link';

// Simple user type that works with both full User and search results
interface SimpleUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  species?: string | null;
  interests?: string[] | null;
  _count?: {
    hostedEvents?: number;
  };
}

interface UserCardProps {
  user: SimpleUser;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="block group"
    >
      <div className="bg-cream-50/80 dark:bg-forest-900/60 backdrop-blur-sm rounded-2xl border border-warm-200/60 dark:border-forest-800/60 overflow-hidden transition-all hover:shadow-lg hover:border-warm-300 dark:hover:border-forest-700">
        {/* Avatar */}
        <div className="relative aspect-square bg-gradient-to-br from-forest-100 to-forest-200 dark:from-forest-800 dark:to-forest-700">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName ?? user.username ?? 'User'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl font-bold text-forest-500 dark:text-forest-400">
                {(user.displayName ?? user.username ?? 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Name & Username */}
          <div className="mb-2">
            <h3 className="font-bold text-lg text-forest-800 dark:text-cream-100 truncate">
              {user.displayName ?? user.username}
            </h3>
            <p className="text-sm text-warm-500 dark:text-warm-400">@{user.username}</p>
          </div>

          {/* Species */}
          {user.species && (
            <div className="mb-2">
              <span className="inline-block bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300 text-xs px-2 py-1 rounded-full font-korean">
                {user.species}
              </span>
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-warm-600 dark:text-warm-400 line-clamp-2 mb-3 font-korean">
              {user.bio}
            </p>
          )}

          {/* Stats */}
          {user._count && (
            <div className="flex gap-4 text-xs text-warm-500 dark:text-warm-400 border-t border-warm-200/60 dark:border-forest-800/60 pt-2 font-korean">
              <div>
                <span className="font-semibold text-forest-700 dark:text-cream-100">
                  {user._count.hostedEvents ?? 0}
                </span>{' '}
                이벤트
              </div>
            </div>
          )}

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {user.interests.slice(0, 3).map((interest) => (
                <span
                  key={interest}
                  className="text-xs bg-warm-100 dark:bg-forest-800 text-warm-600 dark:text-warm-300 px-2 py-0.5 rounded font-korean"
                >
                  {interest}
                </span>
              ))}
              {user.interests.length > 3 && (
                <span className="text-xs text-warm-400 dark:text-warm-500 font-korean">
                  +{user.interests.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
