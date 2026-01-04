/**
 * User Profile Page
 * Display user profile with stats, interests, and social links
 */

import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { createServerCaller } from '@/lib/trpc/server';
import { ProfileHeader } from '@/components/users/ProfileHeader';
import { ProfileStats } from '@/components/users/ProfileStats';
import { InterestTags } from '@/components/users/InterestTags';
import { SocialLinks } from '@/components/users/SocialLinks';

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth();
  const { username } = params;

  // Fetch user data
  const trpc = await createServerCaller();

  let user;
  try {
    user = await trpc.user.getByUsername({ username });
  } catch {
    notFound();
  }

  // Check if this is the current user's profile
  const isOwnProfile = session?.user?.id === user.id;

  // Redirect to login if trying to view a private profile
  if (!user.isPublic && !isOwnProfile) {
    if (!session) {
      redirect('/login');
    }
    notFound();
  }

  // Fetch user stats
  const stats = await trpc.user.getStats({ userId: user.id });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <ProfileStats stats={stats} username={user.username} />

          {/* Fursuit Photos */}
          {user.fursuitPhotos && user.fursuitPhotos.length > 0 && (
            <div className="card-elevated p-6 mb-6">
              <h2 className="text-xl font-display font-bold text-forest-800 dark:text-cream-100 mb-4">
                퍼수트 갤러리
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {user.fursuitPhotos.map((photo: string, index: number) => (
                  <div
                    key={index}
                    className="relative aspect-square bg-cream-100 dark:bg-forest-900/50 rounded-xl overflow-hidden"
                  >
                    <Image
                      src={photo}
                      alt={`퍼수트 사진 ${index + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-200"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <InterestTags interests={user.interests || []} />
          <SocialLinks socialLinks={user.socialLinks as Record<string, string> | null} />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = params;

  try {
    const trpc = await createServerCaller();
    const user = await trpc.user.getByUsername({ username });

    return {
      title: `${user.displayName || user.username} (@${user.username}) - Kemotown`,
      description: user.bio || `${user.displayName || user.username}님의 프로필`,
    };
  } catch {
    return {
      title: '사용자를 찾을 수 없습니다 - Kemotown',
    };
  }
}
