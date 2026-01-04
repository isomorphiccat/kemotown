/**
 * User Discovery Page
 * Browse and search users in the community
 */

import { Suspense } from 'react';
import { UserDiscovery } from '@/components/users/UserDiscovery';

export const metadata = {
  title: '사용자 찾기 - Kemotown',
  description: '커뮤니티의 다른 사용자를 찾아보세요',
};

export default function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-forest-800 dark:text-cream-100">사용자 찾기</h1>
        <p className="text-warm-500 dark:text-warm-400 font-korean mt-2">
          커뮤니티의 다른 멤버들을 찾아보세요
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-500"></div>
          </div>
        }
      >
        <UserDiscovery />
      </Suspense>
    </div>
  );
}
