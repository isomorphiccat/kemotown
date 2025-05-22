'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // For accessing route params
import ProfileForm from '@/components/forms/ProfileForm';
import { UserUpdateData } from '@/lib/validators/user'; // Zod type for update

const EditProfilePage: React.FC = () => {
  const params = useParams();
  const userId = params.id as string;

  const [initialData, setInitialData] = useState<Partial<UserUpdateData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      const fetchUserProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/users/${userId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch profile for editing (${response.status})`);
          }
          const data = await response.json();
          // The form expects password to be empty unless changing,
          // and other fields should match UserUpdateData structure.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password, ...formData } = data; 
          setInitialData(formData);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserProfile();
    } else {
        setError("User ID is missing.");
        setIsLoading(false);
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex justify-center items-center">
        <p className="text-lg text-gray-700 dark:text-gray-300 font-korean">프로필 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex justify-center items-center">
        <p className="text-lg text-red-600 font-korean">오류: {error}</p>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex justify-center items-center">
        <p className="text-lg text-gray-700 dark:text-gray-300 font-korean">프로필 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return <ProfileForm mode="edit" userId={userId} initialData={initialData} />;
};

export default EditProfilePage;
