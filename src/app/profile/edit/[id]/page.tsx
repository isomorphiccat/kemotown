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
    return <div className="flex justify-center items-center min-h-screen"><p className="text-lg text-slate-700">Loading profile for editing...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-lg text-red-600">Error: {error}</p></div>;
  }

  if (!initialData) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-lg text-slate-700">Could not load profile data.</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="container mx-auto px-4">
        <ProfileForm mode="edit" userId={userId} initialData={initialData} />
      </div>
    </div>
  );
};

export default EditProfilePage;
