/**
 * Groups Page (/groups)
 * Lists all public Group-type contexts
 */

import { auth } from '@/lib/auth';
import { GroupsPageClient } from './GroupsPageClient';

export const metadata = {
  title: '그룹 | 케모타운',
  description: '케모타운의 다양한 커뮤니티 그룹에 참여하세요',
};

export default async function GroupsPage() {
  const session = await auth();

  return (
    <GroupsPageClient
      currentUserId={session?.user?.id}
    />
  );
}
