/**
 * Main Layout — Premium "Cozy Forest Town" Theme
 * Sophisticated app shell with refined navigation
 */

import type { ReactNode } from 'react';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface MainLayoutProps {
  children: ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <div className="min-h-screen bg-gradient-mesh grain">
      {/* Subtle decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="blob blob-green w-[500px] h-[500px] -top-40 -right-40 opacity-15" />
        <div className="blob blob-coral w-[350px] h-[350px] bottom-0 -left-28 opacity-10" />
      </div>

      {/* Header */}
      <header className="glass-strong border-b border-warm-200/40 dark:border-forest-800/40 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-forest-600 to-forest-700 rounded-xl shadow-md flex items-center justify-center transform group-hover:scale-105 transition-all duration-200">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-accent-400 to-accent-500 rounded-full border-2 border-cream-50 dark:border-forest-950" />
              </div>
              <span className="text-lg font-display font-bold text-forest-800 dark:text-cream-50 hidden sm:block tracking-tight">
                Kemotown
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/events"
                className="flex items-center gap-2 px-4 py-2 text-warm-600 dark:text-warm-400 hover:text-forest-700 dark:hover:text-forest-400 hover:bg-forest-50/60 dark:hover:bg-forest-900/60 rounded-xl font-medium transition-all duration-200 font-korean"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                이벤트
              </Link>
              <Link
                href="/users"
                className="flex items-center gap-2 px-4 py-2 text-warm-600 dark:text-warm-400 hover:text-forest-700 dark:hover:text-forest-400 hover:bg-forest-50/60 dark:hover:bg-forest-900/60 rounded-xl font-medium transition-all duration-200 font-korean"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                멤버
              </Link>
              {isAuthenticated && (
                <Link
                  href="/events/create"
                  className="ml-2 flex items-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-xl font-medium shadow-[0_4px_12px_-4px_rgba(45,132,45,0.35)] hover:bg-forest-700 hover:shadow-[0_6px_16px_-4px_rgba(45,132,45,0.4)] active:scale-[0.97] transition-all duration-200 font-korean"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  이벤트 만들기
                </Link>
              )}
            </nav>

            {/* Right Side - Auth State */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* Messages */}
                  <Link
                    href="/messages"
                    className="relative p-2.5 text-warm-500 hover:text-forest-600 dark:text-warm-400 dark:hover:text-forest-400 hover:bg-forest-50/60 dark:hover:bg-forest-900/60 rounded-xl transition-all duration-200"
                    aria-label="메시지"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </Link>

                  {/* Notifications */}
                  <NotificationBell />

                  {/* Profile Link */}
                  <Link
                    href={`/profile/${session.user.username || session.user.id}`}
                    className="flex items-center gap-2.5 p-1.5 hover:bg-forest-50/60 dark:hover:bg-forest-900/60 rounded-xl transition-all duration-200"
                  >
                    <div className="relative">
                      {session.user.avatarUrl ? (
                        <Image
                          src={session.user.avatarUrl}
                          alt={session.user.displayName || session.user.username || ''}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-xl object-cover ring-2 ring-cream-100 dark:ring-forest-800"
                          unoptimized
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-forest-100 dark:bg-forest-800 ring-2 ring-cream-100 dark:ring-forest-700 flex items-center justify-center">
                          <span className="text-forest-600 dark:text-forest-400 font-bold text-sm">
                            {(session.user.displayName || session.user.username || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      {/* Online status */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-cream-50 dark:border-forest-950" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-forest-700 dark:text-cream-100 max-w-[100px] truncate">
                      {session.user.displayName || session.user.username}
                    </span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-2.5 bg-forest-600 text-white rounded-xl font-medium shadow-[0_4px_12px_-4px_rgba(45,132,45,0.35)] hover:bg-forest-700 hover:shadow-[0_6px_16px_-4px_rgba(45,132,45,0.4)] active:scale-[0.97] transition-all duration-200 font-korean"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-warm-200/40 dark:border-forest-800/40 px-2 py-2">
          <nav className="flex items-center justify-around">
            <Link
              href="/events"
              className="flex flex-col items-center gap-1 px-4 py-2 text-warm-600 dark:text-warm-400 hover:text-forest-600 dark:hover:text-forest-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span className="text-xs font-medium font-korean">이벤트</span>
            </Link>
            <Link
              href="/users"
              className="flex flex-col items-center gap-1 px-4 py-2 text-warm-600 dark:text-warm-400 hover:text-forest-600 dark:hover:text-forest-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span className="text-xs font-medium font-korean">멤버</span>
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/messages"
                  className="flex flex-col items-center gap-1 px-4 py-2 text-warm-600 dark:text-warm-400 hover:text-forest-600 dark:hover:text-forest-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span className="text-xs font-medium font-korean">메시지</span>
                </Link>
                <Link
                  href="/events/create"
                  className="flex flex-col items-center gap-1 px-4 py-2 text-forest-600 dark:text-forest-400 transition-colors"
                >
                  <div className="w-9 h-9 bg-forest-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium font-korean">만들기</span>
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="flex flex-col items-center gap-1 px-4 py-2 text-forest-600 dark:text-forest-400 transition-colors"
              >
                <div className="w-9 h-9 bg-forest-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </div>
                <span className="text-xs font-medium font-korean">로그인</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-warm-200/40 dark:border-forest-800/40 mt-20">
        <div className="container mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-forest-600 to-forest-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="text-sm text-warm-500 dark:text-warm-400 font-korean">
                한국 퍼리 커뮤니티를 위한 공간
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-warm-400 dark:text-warm-500">
              <Link href="/privacy" className="hover:text-forest-600 dark:hover:text-forest-400 transition-colors font-korean">
                개인정보처리방침
              </Link>
              <Link href="/terms" className="hover:text-forest-600 dark:hover:text-forest-400 transition-colors font-korean">
                이용약관
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
