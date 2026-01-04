'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserProfile {
  id: string;
  username: string;
  furryName?: string;
  profilePictureUrl?: string;
  fursuitGallery?: Record<string, unknown>;
  characterDetails?: Record<string, unknown>;
  socialMediaLinks?: Record<string, unknown>;
  interestTags?: string[];
  createdAt: string;
}

const UserProfilePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const username = params.username as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError(null);
      
      // Handle "me" case - redirect to current user's profile
      if (username === 'me') {
        if (status === 'loading') {
          setIsLoading(true);
          return; // Wait for session to load
        }
        
        if (status === 'unauthenticated' || !session?.user) {
          router.push('/login');
          return;
        }
        
        const currentUsername = (session.user as { username?: string })?.username;
        
        if (currentUsername) {
          router.replace(`/profile/${currentUsername}`);
          return;
        } else {
          setError("프로필을 불러올 수 없습니다. 사용자명을 찾을 수 없습니다. 다시 로그인해 주세요.");
          setIsLoading(false);
          return;
        }
      }

      // Fetch user profile for specific username
      if (!username) {
        setError("사용자명이 누락되었습니다.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${username}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch profile (${response.status})`);
        }
        const data = await response.json();
        setUser(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, session, status, router]);

  const isOwnProfile = session?.user && (session.user as { username?: string }).username === username;

  const renderField = (data: Record<string, unknown> | string, title: string, icon: string) => {
    if (!data) return null;
    
    let content;
    if (typeof data === 'string') {
      content = data;
    } else if (typeof data === 'object') {
      content = JSON.stringify(data, null, 2);
    } else {
      content = String(data);
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-korean flex items-center gap-2">
            <span>{icon}</span>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {title.includes('링크') || title.includes('갤러리') ? (
            <Link 
              href={content} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:text-primary/80 break-all font-korean"
            >
              {content}
            </Link>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all font-korean">
                {content}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
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
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
              </Link>
              <h1 className="text-2xl font-bold text-primary font-korean">프로필</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="font-korean">대시보드</Button>
              </Link>
              <Link href="/events">
                <Button variant="ghost" className="font-korean">이벤트</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header Card */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  {user.profilePictureUrl ? (
                    <Image
                      src={user.profilePictureUrl}
                      alt={user.furryName || user.username}
                      width={128}
                      height={128}
                      className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-700">
                      <span className="text-primary text-4xl font-bold">
                        {(user.furryName || user.username).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white font-korean mb-2">
                    {user.furryName || user.username}
                  </h1>
                  {user.furryName && (
                    <p className="text-lg text-gray-600 dark:text-gray-300 font-korean mb-2">
                      @{user.username}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-korean">
                    {new Date(user.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long'
                    })}에 가입
                  </p>
                </div>

                {/* Edit Button */}
                {isOwnProfile && (
                  <div className="flex-shrink-0">
                    <Link href={`/profile/edit/${user.username}`}>
                      <Button className="font-korean">프로필 편집</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Interest Tags */}
            {user.interestTags && user.interestTags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-korean flex items-center gap-2">
                    <span>🏷️</span>
                    관심사
                  </CardTitle>
                  <CardDescription className="font-korean">
                    {user.furryName || user.username}님의 관심 분야
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.interestTags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full font-korean hover:bg-primary/20 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Character Details */}
            {user.characterDetails && renderField(user.characterDetails, "캐릭터 정보", "🦊")}
            
            {/* Social Media Links */}
            {user.socialMediaLinks && renderField(user.socialMediaLinks, "소셜 미디어 링크", "🔗")}
            
            {/* Fursuit Gallery */}
            {user.fursuitGallery && renderField(user.fursuitGallery, "퍼슈트 갤러리", "📸")}
          </div>

          {/* Empty State */}
          {!user.interestTags?.length && !user.characterDetails && !user.socialMediaLinks && !user.fursuitGallery && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="text-6xl mb-4">🏗️</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 font-korean">
                    프로필 준비 중
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 font-korean">
                    {isOwnProfile 
                      ? "프로필을 꾸며보세요! 관심사, 캐릭터 정보 등을 추가할 수 있습니다."
                      : "아직 프로필 정보가 등록되지 않았습니다."
                    }
                  </p>
                  {isOwnProfile && (
                    <Link href={`/profile/edit/${user.username}`}>
                      <Button className="font-korean">프로필 편집하기</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
