/**
 * Bumps Page
 * Display bumps received by this user
 *
 * NOTE: Bump feature is coming soon - Bump model not yet in Prisma schema
 */

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Construction } from 'lucide-react';

interface BumpsPageProps {
  params: Promise<{ username: string }>;
}

export default function BumpsPage({ params }: BumpsPageProps) {
  const { username } = use(params);
  const router = useRouter();

  // Get user by username first
  const { data: user } = trpc.user.getByUsername.useQuery({ username });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-warm-500 dark:text-warm-400 font-korean">사용자를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로
        </Button>
        <h1 className="text-2xl font-display font-bold text-forest-800 dark:text-cream-100 font-korean">
          {user.displayName || user.username}님이 받은 범프
        </h1>
      </div>

      {/* Coming Soon Notice */}
      <div className="text-center py-16 bg-cream-50/80 dark:bg-forest-900/60 rounded-xl border border-warm-200/60 dark:border-forest-800/60">
        <div className="flex justify-center gap-2 mb-4">
          <Sparkles className="w-12 h-12 text-accent-400" />
          <Construction className="w-12 h-12 text-warm-400 dark:text-warm-500" />
        </div>
        <h2 className="text-xl font-display font-bold text-forest-800 dark:text-cream-100 font-korean mb-2">
          범프 기능 준비중
        </h2>
        <p className="text-warm-500 dark:text-warm-400 font-korean max-w-md mx-auto">
          이벤트에서 만난 퍼리들과 &quot;범프&quot;를 교환하여 연결을 기록하는 기능이 곧 추가됩니다!
        </p>
        <p className="text-sm text-warm-400 dark:text-warm-500 font-korean mt-4">
          Coming Soon
        </p>
      </div>
    </div>
  );
}
