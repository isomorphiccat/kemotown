/**
 * Auth Layout — Premium "Cozy Forest Town" Theme
 * Beautiful authentication wrapper with ambient decorations
 */

import type { ReactNode } from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-mesh grain overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Floating blobs */}
        <div className="blob blob-green w-[600px] h-[600px] -top-48 -right-48 opacity-20 float" />
        <div className="blob blob-coral w-[400px] h-[400px] bottom-1/3 -left-32 opacity-15 float-slow float-delay-1" />
        <div className="blob blob-cream w-[500px] h-[500px] -bottom-32 right-1/3 opacity-20 float float-delay-2" />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 pattern-dots opacity-[0.03]" />
      </div>

      {/* Navigation */}
      <header className="relative z-20 container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-forest-600 to-forest-700 rounded-xl shadow-[0_4px_16px_-4px_rgba(45,132,45,0.35)] flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-accent-400 to-accent-500 rounded-full border-2 border-cream-50 dark:border-forest-950" />
            </div>
            <span className="text-xl font-display font-bold text-forest-800 dark:text-cream-50 tracking-tight">
              Kemotown
            </span>
          </Link>

          <Link
            href="/"
            className="group flex items-center gap-2 px-4 py-2.5 text-warm-600 hover:text-forest-700 dark:text-warm-400 dark:hover:text-forest-400 font-medium rounded-xl hover:bg-forest-50/60 dark:hover:bg-forest-900/50 transition-all duration-200"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="font-korean">홈으로</span>
          </Link>
        </nav>
      </header>

      {/* Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8">
        <div className="w-full max-w-md animate-fade-in-up">
          {children}
        </div>
      </main>

      {/* Footer note */}
      <footer className="relative z-10 pb-8 text-center">
        <p className="text-warm-400 dark:text-warm-500 text-sm font-korean">
          © 2025 Kemotown. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
