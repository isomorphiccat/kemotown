'use client';

/**
 * ProfileSettingsForm Component
 * Form for editing user profile information
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@prisma/client';
import { trpc } from '@/lib/trpc';

interface ProfileSettingsFormProps {
  user: User;
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
    bannerUrl: user.bannerUrl || '',
    species: user.species || '',
    isPublic: user.isPublic ?? true, // Default to public if null
    locale: user.locale ?? 'ko',
  });

  const [interests, setInterests] = useState<string[]>(user.interests || []);
  const [newInterest, setNewInterest] = useState('');

  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    (user.socialLinks as Record<string, string>) || {}
  );

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      router.push(`/profile/${user.username}`);
      router.refresh();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateProfileMutation.mutate({
      displayName: formData.displayName.trim() || undefined,
      bio: formData.bio.trim() || undefined,
      avatarUrl: formData.avatarUrl.trim() || undefined,
      bannerUrl: formData.bannerUrl.trim() || undefined,
      species: formData.species.trim() || undefined,
      interests: interests.length > 0 ? interests : undefined,
      socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      isPublic: formData.isPublic,
      locale: formData.locale as 'ko' | 'en',
    });
  };

  const handleAddInterest = () => {
    const trimmed = newInterest.trim();
    if (trimmed && !interests.includes(trimmed) && interests.length < 20) {
      setInterests([...interests, trimmed]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    if (value.trim()) {
      setSocialLinks({ ...socialLinks, [platform]: value });
    } else {
      const updated = { ...socialLinks };
      delete updated[platform];
      setSocialLinks(updated);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-cream-50/80 dark:bg-forest-900/60 backdrop-blur-sm rounded-2xl border border-warm-200/60 dark:border-forest-800/60 shadow-sm p-6">
        <h2 className="text-xl font-display font-bold text-forest-800 dark:text-cream-100 mb-4 font-korean">기본 정보</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-forest-300 mb-2 font-korean">
              사용자명 (변경 불가)
            </label>
            <input
              type="text"
              value={user.username ?? ''}
              disabled
              className="w-full px-3 py-2 border border-warm-300 dark:border-forest-700 bg-warm-100 dark:bg-forest-800 text-warm-500 dark:text-warm-400 rounded-xl cursor-not-allowed font-korean"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-forest-300 mb-2 font-korean">
              표시 이름 (퍼소나 이름)
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              maxLength={50}
              className="w-full px-3 py-2 border border-warm-300 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-800 dark:text-cream-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 font-korean placeholder:text-warm-400 dark:placeholder:text-warm-500"
              placeholder="퍼소나 이름을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-forest-300 mb-2 font-korean">
              종 (Species)
            </label>
            <input
              type="text"
              value={formData.species}
              onChange={(e) =>
                setFormData({ ...formData, species: e.target.value })
              }
              maxLength={50}
              className="w-full px-3 py-2 border border-warm-300 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-800 dark:text-cream-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 font-korean placeholder:text-warm-400 dark:placeholder:text-warm-500"
              placeholder="예: 늑대, 여우, 고양이"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-forest-300 mb-2 font-korean">
              소개
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 border border-warm-300 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-800 dark:text-cream-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 font-korean placeholder:text-warm-400 dark:placeholder:text-warm-500"
              placeholder="자기소개를 입력하세요"
            />
            <p className="text-xs text-warm-500 dark:text-warm-400 mt-1">
              {formData.bio.length}/500
            </p>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-cream-50/80 dark:bg-forest-900/60 backdrop-blur-sm rounded-2xl border border-warm-200/60 dark:border-forest-800/60 shadow-sm p-6">
        <h2 className="text-xl font-display font-bold text-forest-800 dark:text-cream-100 mb-4 font-korean">이미지</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-forest-300 mb-2 font-korean">
              프로필 사진 URL
            </label>
            <input
              type="url"
              value={formData.avatarUrl}
              onChange={(e) =>
                setFormData({ ...formData, avatarUrl: e.target.value })
              }
              className="w-full px-3 py-2 border border-warm-300 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-800 dark:text-cream-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 font-korean placeholder:text-warm-400 dark:placeholder:text-warm-500"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 dark:text-forest-300 mb-2 font-korean">
              배너 이미지 URL
            </label>
            <input
              type="url"
              value={formData.bannerUrl}
              onChange={(e) =>
                setFormData({ ...formData, bannerUrl: e.target.value })
              }
              className="w-full px-3 py-2 border border-warm-300 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-800 dark:text-cream-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 font-korean placeholder:text-warm-400 dark:placeholder:text-warm-500"
              placeholder="https://example.com/banner.jpg"
            />
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="bg-cream-50/80 dark:bg-forest-900/60 backdrop-blur-sm rounded-2xl border border-warm-200/60 dark:border-forest-800/60 shadow-sm p-6">
        <h2 className="text-xl font-display font-bold text-forest-800 dark:text-cream-100 mb-4 font-korean">관심사</h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInterest();
                }
              }}
              maxLength={30}
              className="flex-1 px-3 py-2 border border-warm-300 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-800 dark:text-cream-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 font-korean placeholder:text-warm-400 dark:placeholder:text-warm-500"
              placeholder="관심사 추가 (최대 20개)"
              disabled={interests.length >= 20}
            />
            <button
              type="button"
              onClick={handleAddInterest}
              disabled={interests.length >= 20}
              className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-korean"
            >
              추가
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center gap-2 bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-300 px-3 py-1.5 rounded-full text-sm font-korean"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(interest)}
                  className="hover:text-forest-900 dark:hover:text-forest-100 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
            {interests.length === 0 && (
              <p className="text-warm-500 dark:text-warm-400 text-sm font-korean">
                아직 추가된 관심사가 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-cream-50/80 dark:bg-forest-900/60 backdrop-blur-sm rounded-2xl border border-warm-200/60 dark:border-forest-800/60 shadow-sm p-6">
        <h2 className="text-xl font-display font-bold text-forest-800 dark:text-cream-100 mb-4 font-korean">소셜 링크</h2>

        <div className="space-y-4">
          {['twitter', 'telegram', 'discord', 'furaffinity', 'instagram', 'website'].map(
            (platform) => (
              <div key={platform}>
                <label className="block text-sm font-medium text-forest-700 dark:text-forest-300 mb-2 capitalize">
                  {platform}
                </label>
                <input
                  type="url"
                  value={socialLinks[platform] || ''}
                  onChange={(e) =>
                    handleSocialLinkChange(platform, e.target.value)
                  }
                  className="w-full px-3 py-2 border border-warm-300 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-800 dark:text-cream-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 placeholder:text-warm-400 dark:placeholder:text-warm-500"
                  placeholder={`https://${platform}.com/username`}
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-cream-50/80 dark:bg-forest-900/60 backdrop-blur-sm rounded-2xl border border-warm-200/60 dark:border-forest-800/60 shadow-sm p-6">
        <h2 className="text-xl font-display font-bold text-forest-800 dark:text-cream-100 mb-4 font-korean">프라이버시</h2>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) =>
                setFormData({ ...formData, isPublic: e.target.checked })
              }
              className="w-5 h-5 rounded border-warm-300 dark:border-forest-600 text-forest-600 focus:ring-forest-500"
            />
            <div>
              <div className="font-medium text-forest-800 dark:text-cream-100 font-korean">공개 프로필</div>
              <div className="text-sm text-warm-600 dark:text-warm-400 font-korean">
                프로필을 모든 사용자에게 공개합니다
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {updateProfileMutation.error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
          {updateProfileMutation.error.message}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-6 py-3 bg-warm-200 dark:bg-forest-800 hover:bg-warm-300 dark:hover:bg-forest-700 text-warm-700 dark:text-warm-200 rounded-xl font-medium transition-colors font-korean"
          disabled={updateProfileMutation.isPending}
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-korean"
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}
