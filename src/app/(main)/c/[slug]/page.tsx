/**
 * Context Page (/c/[slug])
 * Unified page for Groups, Events, and Conventions
 */

import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { contextService } from '@/server/services/context.service';
import { ContextPageClient } from './ContextPageClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ContextPage({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch context with user's membership
  const context = await contextService.getBySlug(resolvedParams.slug, userId);

  if (!context) {
    notFound();
  }

  // Check access for private contexts
  if (context.visibility === 'PRIVATE') {
    if (!userId) {
      // Show login prompt for private contexts
      return (
        <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
          <h1 className="text-2xl font-bold text-forest-800 dark:text-cream-100 mb-4">
            비공개 공간입니다
          </h1>
          <p className="text-warm-600 dark:text-warm-400 mb-6">
            이 공간을 보려면 로그인이 필요합니다.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-forest-600 hover:bg-forest-700 text-white font-medium rounded-xl transition-colors"
          >
            로그인하기
          </a>
        </div>
      );
    }

    // Check membership for private contexts
    const canAccess = await contextService.canAccess(context.id, userId);
    if (!canAccess) {
      return (
        <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
          <h1 className="text-2xl font-bold text-forest-800 dark:text-cream-100 mb-4">
            접근이 제한되었습니다
          </h1>
          <p className="text-warm-600 dark:text-warm-400">
            이 공간에 참여하려면 초대가 필요합니다.
          </p>
        </div>
      );
    }
  }

  return (
    <ContextPageClient
      context={context}
      currentUserId={userId}
      userAvatar={session?.user?.image}
      userDisplayName={session?.user?.name}
    />
  );
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const context = await contextService.getBySlug(resolvedParams.slug);

  if (!context) {
    return { title: 'Not Found' };
  }

  return {
    title: `${context.name} | 케모타운`,
    description: context.description || `${context.name} - 케모타운에서 만나요`,
    openGraph: {
      title: context.name,
      description: context.description || undefined,
      images: context.bannerUrl ? [context.bannerUrl] : undefined,
    },
  };
}
