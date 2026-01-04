'use client';

/**
 * BumpModal Component
 * Modal for creating a bump with method selection
 *
 * NOTE: Bump feature is coming soon - Bump model not yet in Prisma schema
 */

import { Sparkles, Construction } from 'lucide-react';

interface BumpModalProps {
  receiverId: string;
  eventId?: string;
  onClose: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BumpModal({ receiverId, eventId, onClose }: BumpModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-cream-50 dark:bg-forest-950 rounded-2xl border border-warm-200/60 dark:border-forest-800/60 max-w-md w-full p-6 shadow-xl">
        <h2 className="text-2xl font-display font-bold text-forest-800 dark:text-cream-100 mb-4 font-korean">범프</h2>

        {/* Coming Soon Notice */}
        <div className="text-center py-8">
          <div className="flex justify-center gap-2 mb-4">
            <Sparkles className="w-10 h-10 text-accent-400" />
            <Construction className="w-10 h-10 text-warm-400 dark:text-warm-500" />
          </div>
          <h3 className="text-lg font-display font-bold text-forest-800 dark:text-cream-100 font-korean mb-2">
            범프 기능 준비중
          </h3>
          <p className="text-warm-500 dark:text-warm-400 font-korean mb-6">
            이벤트에서 만난 퍼리들과 &quot;범프&quot;를 교환하여 연결을 기록하는 기능이 곧 추가됩니다!
          </p>
          <p className="text-sm text-warm-400 dark:text-warm-500 font-korean">
            Coming Soon
          </p>
        </div>

        {/* Close Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 bg-warm-200 dark:bg-forest-800 hover:bg-warm-300 dark:hover:bg-forest-700 text-warm-700 dark:text-warm-200 rounded-xl font-medium transition-colors font-korean"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
