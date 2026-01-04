'use client';

/**
 * UserGrid Component
 * Grid layout for displaying multiple users with pagination
 */

import { UserCard } from './UserCard';

// Simple user type for search results
interface SimpleUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  species?: string | null;
}

interface UserGridProps {
  users: SimpleUser[];
  emptyMessage?: string;
}

export function UserGrid({ users, emptyMessage = '사용자를 찾을 수 없습니다.' }: UserGridProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-warm-500 dark:text-warm-400 text-lg font-korean">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
