'use client';

/**
 * MobileNav Component
 * Fixed bottom navigation bar for mobile devices
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, PlusSquare, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  /** Is user authenticated */
  isAuthenticated: boolean;
  /** User's username for profile link */
  username?: string | null;
  /** Unread notification count */
  notificationCount?: number;
  /** Additional CSS classes */
  className?: string;
}

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  requiresAuth?: boolean;
  matchPath?: string;
}

const navItems: NavItem[] = [
  {
    href: '/',
    icon: Home,
    label: '홈',
    matchPath: '/',
  },
  {
    href: '/events',
    icon: Calendar,
    label: '이벤트',
    matchPath: '/events',
  },
  {
    href: '/events/create',
    icon: PlusSquare,
    label: '만들기',
    requiresAuth: true,
  },
  {
    href: '/notifications',
    icon: Bell,
    label: '알림',
    requiresAuth: true,
    matchPath: '/notifications',
  },
  {
    href: '/profile',
    icon: User,
    label: '프로필',
    requiresAuth: true,
    matchPath: '/profile',
  },
];

export function MobileNav({
  isAuthenticated,
  username,
  notificationCount = 0,
  className,
}: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.matchPath) {
      return pathname === item.matchPath || pathname.startsWith(item.matchPath + '/');
    }
    return pathname === item.href;
  };

  const getHref = (item: NavItem) => {
    if (item.href === '/profile' && username) {
      return `/profile/${username}`;
    }
    if (!isAuthenticated && item.requiresAuth) {
      return '/login';
    }
    return item.href;
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-card/95 backdrop-blur-md border-t border-warm-200 dark:border-forest-800',
        'pb-safe', // iOS safe area
        className
      )}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          // Hide auth-required items for non-authenticated users (except profile becomes login)
          if (item.requiresAuth && !isAuthenticated && item.href !== '/profile') {
            return null;
          }

          const Icon = item.icon;
          const active = isActive(item);
          const href = getHref(item);
          const showBadge = item.href === '/notifications' && notificationCount > 0;

          // Special styling for create button
          if (item.href === '/events/create') {
            return (
              <Link
                key={item.href}
                href={href}
                className="flex flex-col items-center justify-center -mt-3"
              >
                <div className="w-12 h-12 rounded-xl bg-forest-600 shadow-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-medium text-forest-600 dark:text-forest-400 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center w-16 py-2 transition-colors',
                active
                  ? 'text-forest-600 dark:text-forest-400'
                  : 'text-warm-400 dark:text-warm-500'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-6 h-6 transition-transform',
                    active && 'scale-110'
                  )}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-1 font-medium',
                  active && 'font-semibold'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Login button for non-authenticated users */}
        {!isAuthenticated && (
          <Link
            href="/login"
            className="flex flex-col items-center justify-center w-16 py-2 text-forest-600 dark:text-forest-400"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] mt-1 font-medium">로그인</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
