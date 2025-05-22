'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // For accessing route params and navigation
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  furryName?: string;
  profilePictureUrl?: string;
  fursuitGallery?: Record<string, unknown>; // Adjust based on actual structure, string for now
  characterDetails?: Record<string, unknown>; // Adjust based on actual structure, string for now
  socialMediaLinks?: Record<string, unknown>; // Adjust based on actual structure, string for now
  interestTags?: string[];
  createdAt: string;
}

const UserProfilePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId = params.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError(null);
      
      // Handle "me" case - redirect to current user's profile
      if (userId === 'me') {
        if (status === 'loading') {
          setIsLoading(true);
          return; // Wait for session to load
        }
        
        if (status === 'unauthenticated' || !session?.user) {
          router.push('/login');
          return;
        }
        
        const currentUserId = (session.user as { id?: string })?.id;
        if (currentUserId) {
          router.replace(`/profile/${currentUserId}`);
          return;
        } else {
          setError("프로필을 불러올 수 없습니다. 다시 로그인해 주세요.");
          setIsLoading(false);
          return;
        }
      }

      // Fetch user profile for specific ID
      if (!userId) {
        setError("User ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch profile (${response.status})`);
        }
        const data = await response.json();
        setUser(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, session, status, router]);

  const renderJsonData = (data: Record<string, unknown> | string, title: string) => {
    if (!data) return null;
    let content;
    if (typeof data === 'string') {
      try {
        // Try parsing if it's a JSON string
        content = JSON.stringify(JSON.parse(data), null, 2);
      } catch {
        // If not a valid JSON string, display as is (it might be a simple string or URL)
        content = data;
      }
    } else if (typeof data === 'object') {
      content = JSON.stringify(data, null, 2);
    } else {
      content = String(data);
    }
  
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mt-2 font-korean">{title}</h3>
        {title.toLowerCase().includes('url') || title.toLowerCase().includes('gallery') ? (
          <Link href={content} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 break-all">
            {content}
          </Link>
        ) : (
          <pre className="bg-gray-50 p-2 rounded text-sm text-gray-600 whitespace-pre-wrap break-all">{content}</pre>
        )}
      </div>
    );
  };


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 to-amber-50"><p className="text-lg text-gray-700 font-korean">프로필을 불러오는 중...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 to-amber-50"><p className="text-lg text-red-600 font-korean">오류: {error}</p></div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 to-amber-50"><p className="text-lg text-gray-700 font-korean">사용자를 찾을 수 없습니다.</p></div>;
  }

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
        <div className="max-w-2xl mx-auto bg-white shadow-lg hover:shadow-xl transition-shadow rounded-lg p-6 md:p-8">
          <div className="flex flex-col items-center md:flex-row md:items-start">
            {user.profilePictureUrl && (
              <img
                src={user.profilePictureUrl}
                alt={user.furryName || user.username}
                className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover shadow-md md:mr-8 mb-4 md:mb-0"
              />
            )}
            <div className="text-center md:text-left flex-grow">
              <h1 className="text-3xl font-bold text-primary font-korean">{user.furryName || user.username}</h1>
              {user.furryName && <p className="text-md text-gray-600 font-korean">@{user.username}</p>}
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>
            </div>
            <Link href={`/profile/edit/${userId}`} className="mt-4 md:mt-0 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm font-korean">
                프로필 편집
            </Link>
          </div>

          <div className="mt-8 space-y-4">
            {user.characterDetails && renderJsonData(user.characterDetails, "Character Details")}
            {user.socialMediaLinks && renderJsonData(user.socialMediaLinks, "Social Media")}
            {user.fursuitGallery && renderJsonData(user.fursuitGallery, "Fursuit Gallery")}
            
            {user.interestTags && user.interestTags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mt-2 font-korean">관심사</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.interestTags.map(tag => (
                    <span key={tag} className="px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full font-korean">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 text-right mt-6 font-korean">
              가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
