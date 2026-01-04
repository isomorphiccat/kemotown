'use client';

import ProfileForm from '@/components/forms/ProfileForm';
import React from 'react';

const CreateProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="container mx-auto px-4">
        <ProfileForm mode="create" />
      </div>
    </div>
  );
};

export default CreateProfilePage;
