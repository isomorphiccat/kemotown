/**
 * Home Page (v2)
 * Timeline-centric home with public/home feed and discovery
 */

import { auth } from '@/lib/auth';
import { HomePageClient } from './HomePageClient';

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <HomePageClient
      currentUserId={user?.id}
      userAvatar={user?.avatarUrl}
      userDisplayName={user?.displayName || user?.username}
      username={user?.username}
    />
  );
}
