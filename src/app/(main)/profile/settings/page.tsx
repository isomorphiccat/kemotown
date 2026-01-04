/**
 * Profile Settings Page
 * Allow users to edit their profile information
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { createServerCaller } from '@/lib/trpc/server';
import { ProfileSettingsForm } from '@/components/users/ProfileSettingsForm';

export const metadata = {
  title: '프로필 설정 - Kemotown',
  description: '프로필 정보를 수정합니다',
};

export default async function ProfileSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch current user data
  const trpc = await createServerCaller();
  const user = await trpc.user.getCurrentUser();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-forest-800 dark:text-cream-100 font-korean">프로필 설정</h1>
        <p className="text-warm-600 dark:text-warm-400 mt-2 font-korean">
          회원님의 프로필 정보를 관리하세요
        </p>
      </div>

      <ProfileSettingsForm user={user} />
    </div>
  );
}
