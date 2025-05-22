'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // For accessing route params and navigation
import Link from 'next/link';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  furryName?: string;
  profilePictureUrl?: string;
  fursuitGallery?: any; // Adjust based on actual structure, string for now
  characterDetails?: any; // Adjust based on actual structure, string for now
  socialMediaLinks?: any; // Adjust based on actual structure, string for now
  interestTags?: string[];
  createdAt: string;
}

const UserProfilePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
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
            throw new Error(errorData.message || `Failed to fetch profile (${response.status})`);
          }
          const data = await response.json();
          setUser(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserProfile();
    } else {
      setIsLoading(false);
      setError("User ID is missing.");
    }
  }, [userId]);

  const renderJsonData = (data: any, title: string) => {
    if (!data) return null;
    let content;
    if (typeof data === 'string') {
      try {
        // Try parsing if it's a JSON string
        content = JSON.stringify(JSON.parse(data), null, 2);
      } catch (e) {
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
        <h3 className="text-lg font-semibold text-slate-700 mt-2">{title}</h3>
        {title.toLowerCase().includes('url') || title.toLowerCase().includes('gallery') ? (
          <Link href={content} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-700 break-all">
            {content}
          </Link>
        ) : (
          <pre className="bg-slate-100 p-2 rounded text-sm text-slate-600 whitespace-pre-wrap break-all">{content}</pre>
        )}
      </div>
    );
  };


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-lg text-slate-700">Loading profile...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-lg text-red-600">Error: {error}</p></div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-lg text-slate-700">User not found.</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-lg p-6 md:p-8">
          <div className="flex flex-col items-center md:flex-row md:items-start">
            {user.profilePictureUrl && (
              <img
                src={user.profilePictureUrl}
                alt={user.furryName || user.username}
                className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover shadow-md md:mr-8 mb-4 md:mb-0"
              />
            )}
            <div className="text-center md:text-left flex-grow">
              <h1 className="text-3xl font-bold text-sky-700">{user.furryName || user.username}</h1>
              {user.furryName && <p className="text-md text-slate-600">@{user.username}</p>}
              <p className="text-sm text-slate-500 mt-1">{user.email}</p>
            </div>
            <Link href={`/profile/edit/${userId}`} className="mt-4 md:mt-0 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">
                Edit Profile
            </Link>
          </div>

          <div className="mt-8 space-y-4">
            {renderJsonData(user.characterDetails, "Character Details")}
            {renderJsonData(user.socialMediaLinks, "Social Media")}
            {renderJsonData(user.fursuitGallery, "Fursuit Gallery")}
            
            {user.interestTags && user.interestTags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mt-2">Interests</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.interestTags.map(tag => (
                    <span key={tag} className="px-3 py-1 text-xs font-medium text-sky-800 bg-sky-100 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 text-right mt-6">
              Joined: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
