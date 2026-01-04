'use client';

/**
 * UserCard Component
 * Compact user profile card for discovery and lists
 */

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface UserCardProps {
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    bio?: string | null;
    _count?: {
      followers?: number;
      following?: number;
    };
  };
  /** Show compact variant */
  compact?: boolean;
  /** Show follow button */
  showFollowButton?: boolean;
  /** Current user ID for showing follow state */
  currentUserId?: string;
  /** Additional CSS classes */
  className?: string;
}

export function UserCard({
  user,
  compact = false,
  className,
}: UserCardProps) {
  if (compact) {
    return (
      <Link
        href={`/profile/${user.username}`}
        className={cn(
          'flex items-center gap-3 p-2.5 rounded-xl hover:bg-warm-50 dark:hover:bg-forest-900/30 transition-colors',
          className
        )}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-warm-100 dark:bg-forest-800">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName || user.username || ''}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-forest flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {(user.displayName || user.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-forest-800 dark:text-cream-100 truncate text-sm">
            {user.displayName || user.username}
          </h4>
          <p className="text-xs text-warm-500 truncate">
            @{user.username}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/profile/${user.username}`}
      className={cn(
        'block card-elevated p-4 hover:shadow-large transition-shadow',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-warm-100 dark:bg-forest-800">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName || user.username || ''}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-forest flex items-center justify-center">
              <span className="text-white font-bold">
                {(user.displayName || user.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-forest-800 dark:text-cream-100 truncate">
            {user.displayName || user.username}
          </h4>
          <p className="text-sm text-warm-500">@{user.username}</p>
          {user.bio && (
            <p className="mt-2 text-sm text-warm-600 dark:text-warm-400 line-clamp-2">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      {user._count && (
        <div className="mt-3 pt-3 border-t border-warm-100 dark:border-forest-800 flex gap-4 text-sm">
          {typeof user._count.followers === 'number' && (
            <div>
              <span className="font-semibold text-forest-800 dark:text-cream-100">
                {user._count.followers}
              </span>
              <span className="text-warm-500 ml-1">팔로워</span>
            </div>
          )}
          {typeof user._count.following === 'number' && (
            <div>
              <span className="font-semibold text-forest-800 dark:text-cream-100">
                {user._count.following}
              </span>
              <span className="text-warm-500 ml-1">팔로잉</span>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
