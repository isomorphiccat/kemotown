'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserCreateData, UserUpdateData } from '@/lib/validators/user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProfileFormProps {
  mode: 'create' | 'edit';
  userId?: string; // Required for 'edit' mode
  initialData?: Partial<UserCreateData | UserUpdateData>; // To pre-fill form in 'edit' mode
}

const ProfileForm: React.FC<ProfileFormProps> = ({ mode, userId, initialData }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<UserCreateData | UserUpdateData>>(
    initialData || {
      username: '',
      email: '',
      password: '',
      furryName: '',
      profilePictureUrl: '',
      fursuitGallery: '',
      characterDetails: '',
      socialMediaLinks: '',
      interestTags: [],
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        ...initialData,
        password: '', // Clear password for edit mode, user can enter a new one if they wish to change it
        // Keep interestTags as array
        interestTags: initialData.interestTags || [],
      });
    }
  }, [mode, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isComposing && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      const currentTags = Array.isArray(formData.interestTags) ? formData.interestTags : [];
      if (!currentTags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          interestTags: [...currentTags, newTag]
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = Array.isArray(formData.interestTags) ? formData.interestTags : [];
    setFormData(prev => ({
      ...prev,
      interestTags: currentTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const dataToSubmit = {
      ...formData,
      interestTags: Array.isArray(formData.interestTags) 
        ? formData.interestTags 
        : formData.interestTags 
          ? (formData.interestTags as string).split(',').map(tag => tag.trim()).filter(tag => tag) 
          : [],
    };
    
    if (mode === 'edit' && !dataToSubmit.password) {
      delete dataToSubmit.password;
    }

    try {
      const url = mode === 'create' ? '/api/users' : `/api/users/${userId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.errors ? JSON.stringify(result.errors) : result.message || '오류가 발생했습니다.';
        throw new Error(errorMsg);
      }

      setSuccessMessage(mode === 'create' ? '프로필이 성공적으로 생성되었습니다!' : '프로필이 성공적으로 업데이트되었습니다!');
      
      setTimeout(() => {
        if (mode === 'create' && result.id) {
          router.push(`/profile/${result.id}`);
        } else if (mode === 'edit' && userId) {
          router.push(`/profile/${userId}`);
        }
      }, 1500);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link href={mode === 'edit' ? `/profile/${userId}` : '/'} className="inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {mode === 'edit' ? '프로필로 돌아가기' : '홈으로 돌아가기'}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-korean">
            {mode === 'create' ? '프로필 생성' : '프로필 수정'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 font-korean">
            {mode === 'create' ? '새로운 프로필을 만들어보세요' : '프로필 정보를 업데이트하세요'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="font-korean">기본 정보</CardTitle>
                <CardDescription className="font-korean">
                  기본적인 계정 정보를 입력해주세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                    사용자명 *
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    required
                  />
                </div>
                {mode === 'create' && (
                  <>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                        이메일 *
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                        비밀번호 *
                      </label>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                        required
                      />
                    </div>
                  </>
                )}
                {mode === 'edit' && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                      새 비밀번호 (변경하지 않으려면 비워두세요)
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="새 비밀번호 입력"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-korean">퍼슨 정보</CardTitle>
                <CardDescription className="font-korean">
                  퍼리 캐릭터에 대한 정보를 입력해주세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="furryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                    퍼리 이름
                  </label>
                  <input
                    type="text"
                    name="furryName"
                    id="furryName"
                    value={formData.furryName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="캐릭터 이름"
                  />
                </div>
                <div>
                  <label htmlFor="profilePictureUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                    프로필 사진 URL
                  </label>
                  <input
                    type="url"
                    name="profilePictureUrl"
                    id="profilePictureUrl"
                    value={formData.profilePictureUrl}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="https://example.com/image.png"
                  />
                </div>
                <div>
                  <label htmlFor="characterDetails" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                    캐릭터 설명
                  </label>
                  <textarea
                    name="characterDetails"
                    id="characterDetails"
                    value={formData.characterDetails as string}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                    placeholder="종족, 성격, 취미 등을 자유롭게 작성해주세요"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-korean">갤러리 & 소셜</CardTitle>
                <CardDescription className="font-korean">
                  퍼슈트 갤러리와 소셜 미디어 링크를 추가해주세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="fursuitGallery" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                    퍼슈트 갤러리 URL
                  </label>
                  <input
                    type="text"
                    name="fursuitGallery"
                    id="fursuitGallery"
                    value={formData.fursuitGallery as string}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="이미지 URL들을 쉼표로 구분해주세요"
                  />
                </div>
                <div>
                  <label htmlFor="socialMediaLinks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-korean">
                    소셜 미디어 링크
                  </label>
                  <input
                    type="text"
                    name="socialMediaLinks"
                    id="socialMediaLinks"
                    value={formData.socialMediaLinks as string}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="트위터, 텔레그램 등의 링크"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="font-korean">관심사 태그</CardTitle>
                <CardDescription className="font-korean">
                  관심사나 취미를 태그로 추가해주세요. Enter 키를 눌러 태그를 추가할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Array.isArray(formData.interestTags) && formData.interestTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-purple-500 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="태그 입력 후 Enter (예: 아트, 게임, 퍼슈팅)"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 font-korean">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 font-korean">{successMessage}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="font-korean"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-korean"
            >
              {isLoading ? '저장 중...' : (mode === 'create' ? '프로필 생성' : '변경사항 저장')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;
