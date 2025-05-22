'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For navigation
import { UserCreateData, UserUpdateData } from '@/lib/validators/user'; // Assuming Zod types are exported

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
      fursuitGallery: '', // Simple text input for now
      characterDetails: '', // Simple text input for now
      socialMediaLinks: '', // Simple text input for now
      interestTags: [], // Array of strings
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Prepare data, converting interestTags from string to array
    const dataToSubmit = {
      ...formData,
      interestTags: Array.isArray(formData.interestTags) 
        ? formData.interestTags 
        : formData.interestTags 
          ? (formData.interestTags as string).split(',').map(tag => tag.trim()).filter(tag => tag) 
          : [],
      // For JSON fields, ensure they are parsed if needed, or handle as strings if API expects that for simplicity
      // For this implementation, we are sending them as strings and assuming the API can handle it or they are simple URLs.
      // If they were complex JSON objects, we'd parse them:
      // fursuitGallery: formData.fursuitGallery ? JSON.parse(formData.fursuitGallery as string) : undefined,
      // characterDetails: formData.characterDetails ? JSON.parse(formData.characterDetails as string) : undefined,
      // socialMediaLinks: formData.socialMediaLinks ? JSON.parse(formData.socialMediaLinks as string) : undefined,
    };
    
    // Remove empty password string if not being changed
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
        const errorMsg = result.errors ? JSON.stringify(result.errors) : result.message || 'An error occurred.';
        throw new Error(errorMsg);
      }

      setSuccessMessage(mode === 'create' ? 'Profile created successfully!' : 'Profile updated successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        if (mode === 'create' && result.id) {
          router.push(`/profile/${result.id}`);
        } else if (mode === 'edit' && userId) {
          router.push(`/profile/${userId}`);
        }
      }, 1500);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none";
  const labelStyle = "block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-8 max-w-2xl mx-auto bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-800">
        {mode === 'create' ? 'Create Your Profile' : 'Edit Your Profile'}
      </h2>

      <div>
        <label htmlFor="username" className={labelStyle}>Username</label>
        <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} className={inputStyle} required />
      </div>
      <div>
        <label htmlFor="email" className={labelStyle}>Email</label>
        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputStyle} required />
      </div>
      <div>
        <label htmlFor="password" className={labelStyle}>{mode === 'create' ? 'Password' : 'New Password (leave blank to keep current)'}</label>
        <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} className={inputStyle} placeholder={mode === 'edit' ? 'Enter new password' : ''} />
      </div>
      <div>
        <label htmlFor="furryName" className={labelStyle}>Furry Name</label>
        <input type="text" name="furryName" id="furryName" value={formData.furryName} onChange={handleChange} className={inputStyle} />
      </div>
      <div>
        <label htmlFor="profilePictureUrl" className={labelStyle}>Profile Picture URL</label>
        <input type="url" name="profilePictureUrl" id="profilePictureUrl" value={formData.profilePictureUrl} onChange={handleChange} className={inputStyle} placeholder="https://example.com/image.png"/>
      </div>
      <div>
        <label htmlFor="fursuitGallery" className={labelStyle}>Fursuit Gallery (URLs, comma-separated)</label>
        <input type="text" name="fursuitGallery" id="fursuitGallery" value={formData.fursuitGallery as string} onChange={handleChange} className={inputStyle} placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"/>
      </div>
      <div>
        <label htmlFor="characterDetails" className={labelStyle}>Character Details (e.g., species, bio - as text or JSON string)</label>
        <textarea name="characterDetails" id="characterDetails" value={formData.characterDetails as string} onChange={handleChange} className={inputStyle + " h-24"} placeholder='{"species": "Fox", "bio": "Friendly and loves art."}' />
      </div>
      <div>
        <label htmlFor="socialMediaLinks" className={labelStyle}>Social Media Links (e.g., Twitter, Telegram - as text or JSON string)</label>
        <input type="text" name="socialMediaLinks" id="socialMediaLinks" value={formData.socialMediaLinks as string} onChange={handleChange} className={inputStyle} placeholder='{"twitter": "https://twitter.com/username", "telegram": "https://t.me/username"}'/>
      </div>
      <div>
        <label htmlFor="interestTags" className={labelStyle}>Interest Tags (comma-separated)</label>
        <input type="text" name="interestTags" id="interestTags" value={Array.isArray(formData.interestTags) ? formData.interestTags.join(', ') : formData.interestTags || ''} onChange={handleChange} className={inputStyle} placeholder="art, gaming, fursuiting" />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      {successMessage && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}

      <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400">
        {isLoading ? 'Submitting...' : (mode === 'create' ? 'Create Profile' : 'Save Changes')}
      </button>
    </form>
  );
};

export default ProfileForm;
