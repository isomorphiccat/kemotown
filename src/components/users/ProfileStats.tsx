'use client';

/**
 * ProfileStats Component (v2)
 * Display user statistics (followers, following, contexts)
 */

import Link from 'next/link';

interface ProfileStatsProps {
  stats: {
    followers: number;
    following: number;
    ownedContexts: number;
    joinedContexts: number;
  };
  username: string | null;
}

export function ProfileStats({ stats, username }: ProfileStatsProps) {
  const statItems = [
    {
      label: '팔로워',
      value: stats.followers,
      href: `/profile/${username}/followers`,
    },
    {
      label: '팔로잉',
      value: stats.following,
      href: `/profile/${username}/following`,
    },
    {
      label: '운영 중',
      value: stats.ownedContexts,
      href: `/profile/${username}/owned`,
    },
    {
      label: '참여 중',
      value: stats.joinedContexts,
      href: `/profile/${username}/joined`,
    },
  ];

  return (
    <div className="bg-cream-50/80 dark:bg-forest-900/60 backdrop-blur-sm rounded-2xl border border-warm-200/60 dark:border-forest-800/60 shadow-sm p-6 mb-6">
      <h2 className="text-xl font-display font-bold text-forest-800 dark:text-cream-100 mb-4 font-korean">통계</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="text-center p-4 bg-warm-100/60 dark:bg-forest-800/60 rounded-xl hover:bg-warm-200/60 dark:hover:bg-forest-700/60 transition-colors border border-warm-200/40 dark:border-forest-700/40"
          >
            <div className="text-2xl font-bold text-forest-600 dark:text-forest-400">
              {item.value}
            </div>
            <div className="text-sm text-warm-600 dark:text-warm-400 mt-1 font-korean">{item.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
