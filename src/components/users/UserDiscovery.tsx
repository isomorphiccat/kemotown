'use client';

/**
 * UserDiscovery Component
 * Search and filter users with pagination
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { UserGrid } from './UserGrid';

export function UserDiscovery() {
  const [query, setQuery] = useState('');
  // Note: species and interests filtering not yet implemented in backend
  const [_species, setSpecies] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.user.search.useQuery({
    query: query.trim() || undefined,
    page,
    limit: 20,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const commonInterests = [
    '퍼수트',
    '그림',
    '게임',
    '음악',
    '댄스',
    '코스프레',
    'VRChat',
    '애니메이션',
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
    setPage(1);
  };

  return (
    <div>
      {/* Search & Filter */}
      <div className="bg-cream-50/80 dark:bg-forest-900/60 backdrop-blur-sm rounded-2xl border border-warm-200/60 dark:border-forest-800/60 shadow-sm p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="사용자명 또는 이름으로 검색..."
              className="flex-1 px-4 py-2 border border-warm-300 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-800 dark:text-cream-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 font-korean placeholder:text-warm-400 dark:placeholder:text-warm-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-medium transition-colors font-korean"
            >
              검색
            </button>
          </div>

          {/* Species Filter - Disabled until backend implementation */}
          <div className="opacity-50">
            <label className="block text-sm font-medium text-forest-700 dark:text-forest-300 mb-2 font-korean">
              종 (Species) - 준비 중
            </label>
            <input
              type="text"
              value={_species}
              onChange={(e) => {
                setSpecies(e.target.value);
                setPage(1);
              }}
              placeholder="예: 늑대, 여우, 고양이"
              disabled
              className="w-full px-4 py-2 border border-warm-300 dark:border-forest-700 bg-warm-100 dark:bg-forest-800 text-warm-500 dark:text-warm-400 rounded-xl cursor-not-allowed font-korean placeholder:text-warm-400 dark:placeholder:text-warm-500"
            />
          </div>

          {/* Interest Tags */}
          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-forest-300 mb-2 font-korean">
              관심사
            </label>
            <div className="flex flex-wrap gap-2">
              {commonInterests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors font-korean ${
                    selectedInterests.includes(interest)
                      ? 'bg-forest-600 text-white'
                      : 'bg-warm-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300 hover:bg-warm-200 dark:hover:bg-forest-700'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options - Disabled until backend implementation */}
          <div className="flex gap-4 opacity-50">
            <div className="flex-1">
              <label className="block text-sm font-medium text-forest-700 dark:text-forest-300 mb-2 font-korean">
                정렬 기준 - 준비 중
              </label>
              <select
                disabled
                defaultValue="createdAt"
                className="w-full px-4 py-2 border border-warm-300 dark:border-forest-700 bg-warm-100 dark:bg-forest-800 text-warm-500 dark:text-warm-400 rounded-xl cursor-not-allowed font-korean"
              >
                <option value="createdAt">가입일</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-forest-700 dark:text-forest-300 mb-2 font-korean">
                정렬 순서 - 준비 중
              </label>
              <select
                disabled
                defaultValue="desc"
                className="w-full px-4 py-2 border border-warm-300 dark:border-forest-700 bg-warm-100 dark:bg-forest-800 text-warm-500 dark:text-warm-400 rounded-xl cursor-not-allowed font-korean"
              >
                <option value="desc">내림차순</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
        </div>
      ) : data ? (
        <>
          {/* Results Count */}
          <div className="mb-4 text-warm-600 dark:text-warm-400 font-korean">
            총 {data.pagination.total}명의 사용자
          </div>

          {/* User Grid */}
          <UserGrid
            users={data.users}
            emptyMessage="검색 조건에 맞는 사용자를 찾을 수 없습니다."
          />

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-warm-200 dark:bg-forest-800 hover:bg-warm-300 dark:hover:bg-forest-700 text-warm-700 dark:text-warm-200 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-korean"
              >
                이전
              </button>

              <div className="flex items-center gap-2 px-4">
                <span className="text-warm-600 dark:text-warm-400 font-korean">
                  {page} / {data.pagination.totalPages}
                </span>
              </div>

              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="px-4 py-2 bg-warm-200 dark:bg-forest-800 hover:bg-warm-300 dark:hover:bg-forest-700 text-warm-700 dark:text-warm-200 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-korean"
              >
                다음
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
