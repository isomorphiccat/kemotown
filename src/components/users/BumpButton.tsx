'use client';

/**
 * BumpButton Component
 * Button to create a bump (in-person interaction confirmation)
 */

import { useState } from 'react';
import { BumpModal } from './BumpModal';

interface BumpButtonProps {
  receiverId: string;
  eventId?: string;
}

export function BumpButton({ receiverId, eventId }: BumpButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        범프
      </button>

      {isModalOpen && (
        <BumpModal
          receiverId={receiverId}
          eventId={eventId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
