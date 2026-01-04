/**
 * Header Component — "Cozy Forest Town" Theme
 * Reusable navigation header with user menu
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, User, LogOut, Settings, Bell, Calendar, Users } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full glass-strong border-b border-warm-200/50 dark:border-forest-800/50',
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo and Mobile Menu */}
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMenuClick}
              aria-label="메뉴 열기"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-forest rounded-xl shadow-soft flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-base">K</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-400 rounded-full border-2 border-cream-50 dark:border-forest-950" />
            </div>
            <span className="text-lg font-display font-bold text-gradient hidden sm:block">
              Kemotown
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/events"
            className="flex items-center gap-2 px-4 py-2 text-warm-600 dark:text-warm-400 hover:text-forest-600 dark:hover:text-forest-400 hover:bg-forest-50 dark:hover:bg-forest-900/50 rounded-lg font-medium transition-all duration-200"
          >
            <Calendar className="h-4 w-4" />
            <span className="font-korean">이벤트</span>
          </Link>
          <Link
            href="/users"
            className="flex items-center gap-2 px-4 py-2 text-warm-600 dark:text-warm-400 hover:text-forest-600 dark:hover:text-forest-400 hover:bg-forest-50 dark:hover:bg-forest-900/50 rounded-lg font-medium transition-all duration-200"
          >
            <Users className="h-4 w-4" />
            <span className="font-korean">커뮤니티</span>
          </Link>
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-warm-500 hover:text-forest-600 dark:text-warm-400 dark:hover:text-forest-400"
                aria-label="알림"
              >
                <Bell className="h-5 w-5" />
                {/* Uncomment when notifications exist */}
                {/* <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full" /> */}
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-xl p-1.5 h-auto">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar
                          src={session.user.avatarUrl || session.user.image}
                          alt={session.user.displayName || session.user.name || ''}
                          size="sm"
                          className="ring-2 ring-cream-100 dark:ring-forest-800"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-cream-50 dark:border-forest-950" />
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-forest-700 dark:text-cream-100 max-w-[100px] truncate">
                        {session.user.displayName || session.user.name}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-large">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-forest-800 dark:text-cream-100">{session.user.displayName || session.user.name}</p>
                      <p className="text-xs text-warm-500 dark:text-warm-400 truncate">
                        {session.user.username ? `@${session.user.username}` : session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-warm-200 dark:bg-forest-800" />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                    <Link href={`/profile/${session.user.id}`} className="flex items-center gap-2">
                      <User className="h-4 w-4 text-forest-600 dark:text-forest-400" />
                      <span className="font-korean">내 프로필</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                    <Link href="/profile/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-forest-600 dark:text-forest-400" />
                      <span className="font-korean">설정</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-warm-200 dark:bg-forest-800" />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="cursor-pointer rounded-lg text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="font-korean">로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild className="rounded-xl">
              <Link href="/login" className="font-korean">로그인</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
