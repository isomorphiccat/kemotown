'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UserSearch from '@/components/search/UserSearch'; // Assuming path is correct
import { useRouter, useSearchParams } from 'next/navigation'; // For handling query params

interface User {
  id: string;
  username: string;
  furryName?: string | null;
  profilePictureUrl?: string | null;
  interestTags?: string[] | null;
}

interface FetchUsersResponse {
  users: User[];
  currentPage: number;
  totalPages: number;
  totalUsers: number;
}

const UsersDirectoryContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Get initial search query from URL params
  const initialSearchQuery = searchParams.get('search') || '';
  const [currentSearchQuery, setCurrentSearchQuery] = useState(initialSearchQuery);

  const fetchUsers = useCallback(async (query: string, page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      params.append('page', page.toString());
      params.append('limit', '20'); // Or make this configurable

      const response = await fetch(`/api/users?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      const data: FetchUsersResponse = await response.json();
      setUsers(data.users);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      setUsers([]); // Clear users on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch users when component mounts or search query/page changes
    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
    fetchUsers(currentSearchQuery, pageFromUrl);
  }, [currentSearchQuery, fetchUsers, searchParams]);

  const handleSearch = (query: string) => {
    setCurrentSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
    // Update URL query parameters
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`/users?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    // Update URL query parameters
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/users?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className="text-2xl font-bold text-primary font-korean">Kemotown</h1>
          </div>
          <div className="flex space-x-4 items-center">
            <Link href="/">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary font-korean">
                홈으로
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-korean">
            사용자 둘러보기
          </h2>
          <p className="text-gray-600 dark:text-gray-300 font-korean">
            Kemotown 커뮤니티의 멤버들을 만나보세요
          </p>
        </div>
        
        <UserSearch onSearch={handleSearch} initialQuery={currentSearchQuery} />

        {isLoading && <p className="text-center text-gray-700 font-korean">사용자를 불러오는 중...</p>}
        {error && <p className="text-center text-red-600 font-korean">오류: {error}</p>}

        {!isLoading && !error && users.length === 0 && (
          <p className="text-center text-gray-600 font-korean">검색 조건에 맞는 사용자가 없습니다.</p>
        )}

        {!isLoading && !error && users.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {users.map((user) => (
                <Link key={user.id} href={`/profile/${user.username}`} passHref>
                  <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer border-none">
                    <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
                      {user.profilePictureUrl ? (
                        <Image
                          src={user.profilePictureUrl}
                          alt={user.furryName || user.username}
                          width={192}
                          height={192}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary text-2xl font-bold">
                            {(user.furryName || user.username || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-primary truncate font-korean" title={user.furryName || user.username}>
                        {user.furryName || user.username}
                      </h3>
                      {user.furryName && (
                        <p className="text-sm text-gray-500 truncate font-korean" title={user.username}>@{user.username}</p>
                      )}
                      {user.interestTags && user.interestTags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {user.interestTags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 text-xs font-medium text-primary bg-primary/10 rounded-full font-korean">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-12 flex justify-center items-center space-x-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed font-korean"
              >
                이전
              </button>
              <span className="text-sm text-gray-700 font-korean">
                {currentPage} / {totalPages} 페이지
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed font-korean"
              >
                다음
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const UsersDirectoryPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 flex items-center justify-center"><p className="text-gray-700 font-korean">사용자를 불러오는 중...</p></div>}>
      <UsersDirectoryContent />
    </Suspense>
  );
};

export default UsersDirectoryPage;
