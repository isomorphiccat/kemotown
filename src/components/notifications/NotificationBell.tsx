'use client';

/**
 * NotificationBell Component
 * Header notification icon with unread count badge using inbox router
 */

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotificationList } from './NotificationList';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Get unread count using inbox router
  const { data: unreadCounts, refetch } = trpc.inbox.unreadCount.useQuery(
    undefined,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-notification-bell]')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  const handleToggle = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      refetch(); // Refetch when opening
    }
  };

  const unreadCount = unreadCounts?.total ?? 0;

  return (
    <div className={cn('relative', className)} data-notification-bell>
      {/* Bell button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 text-warm-600 dark:text-warm-400 hover:text-forest-800 dark:hover:text-cream-100 hover:bg-warm-100 dark:hover:bg-forest-800 rounded-lg transition-colors"
        aria-label="알림"
      >
        <Bell className="w-6 h-6" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-accent-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-cream-50 dark:bg-forest-950 rounded-xl shadow-xl border border-warm-200/60 dark:border-forest-800/60 z-50 overflow-hidden">
          <NotificationList onClose={() => setShowDropdown(false)} />
        </div>
      )}
    </div>
  );
}
