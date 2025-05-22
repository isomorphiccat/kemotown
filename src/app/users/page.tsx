'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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

const UsersDirectoryPage: React.FC = () => {
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
    } catch (err: any) {
      setError(err.message);
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
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-sky-700 mb-8">User Directory</h1>
        
        <UserSearch onSearch={handleSearch} initialQuery={currentSearchQuery} />

        {isLoading && <p className="text-center text-slate-700">Loading users...</p>}
        {error && <p className="text-center text-red-600">Error: {error}</p>}

        {!isLoading && !error && users.length === 0 && (
          <p className="text-center text-slate-600">No users found matching your criteria.</p>
        )}

        {!isLoading && !error && users.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {users.map((user) => (
                <Link key={user.id} href={`/profile/${user.id}`} passHref>
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 cursor-pointer">
                    <div className="h-48 w-full bg-slate-200 flex items-center justify-center">
                      {user.profilePictureUrl ? (
                        <img
                          src={user.profilePictureUrl}
                          alt={user.furryName || user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-500 text-2xl">?</span> // Placeholder
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-sky-600 truncate" title={user.furryName || user.username}>
                        {user.furryName || user.username}
                      </h3>
                      {user.furryName && (
                        <p className="text-sm text-slate-500 truncate" title={user.username}>@{user.username}</p>
                      )}
                      {user.interestTags && user.interestTags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {user.interestTags.slice(0, 3).map(tag => ( // Show max 3 tags
                            <span key={tag} className="px-2 py-0.5 text-xs font-medium text-sky-800 bg-sky-100 rounded-full">
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
                className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UsersDirectoryPage;
