'use client';

/**
 * InterestTags Component
 * Display and manage user interest tags
 */

interface InterestTagsProps {
  interests: string[];
  editable?: boolean;
  onRemove?: (tag: string) => void;
}

export function InterestTags({
  interests,
  editable = false,
  onRemove,
}: InterestTagsProps) {
  if (interests.length === 0 && !editable) {
    return null;
  }

  return (
    <div className="bg-cream-50/80 dark:bg-forest-900/60 backdrop-blur-sm rounded-2xl border border-warm-200/60 dark:border-forest-800/60 shadow-sm p-6 mb-6">
      <h2 className="text-xl font-display font-bold text-forest-800 dark:text-cream-100 mb-4 font-korean">관심사</h2>
      <div className="flex flex-wrap gap-2">
        {interests.map((interest) => (
          <span
            key={interest}
            className="inline-flex items-center gap-2 bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300 px-3 py-1.5 rounded-full text-sm font-korean"
          >
            {interest}
            {editable && onRemove && (
              <button
                onClick={() => onRemove(interest)}
                className="hover:text-forest-900 dark:hover:text-forest-100 transition-colors"
                aria-label={`${interest} 제거`}
              >
                ×
              </button>
            )}
          </span>
        ))}
        {editable && interests.length === 0 && (
          <p className="text-warm-500 dark:text-warm-400 text-sm font-korean">
            아직 추가된 관심사가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
