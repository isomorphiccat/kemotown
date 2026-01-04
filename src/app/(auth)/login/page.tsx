/**
 * Login Page — Premium "Cozy Forest Town" Theme
 * Beautiful OAuth authentication with refined, warm design
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { OAuthButtons } from './OAuthButtons';

export default async function LoginPage() {
  const session = await auth();

  // Redirect if already logged in
  if (session?.user) {
    redirect('/');
  }

  return (
    <div className="relative p-8 md:p-10 rounded-[2rem] bg-white/80 dark:bg-forest-900/80 backdrop-blur-md border border-white/60 dark:border-forest-800/60 shadow-[0_8px_40px_-12px_rgba(26,68,32,0.12)] overflow-hidden">
      {/* Decorative gradient corners */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-forest-100/60 to-transparent dark:from-forest-800/40 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent-100/50 to-transparent dark:from-accent-900/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="text-center mb-10">
          {/* Logo Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-forest-600 to-forest-700 rounded-2xl shadow-[0_8px_24px_-8px_rgba(45,132,45,0.4)] mb-6">
            <span className="text-white font-bold text-2xl">K</span>
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-forest-800 dark:text-cream-50 mb-2.5 font-korean tracking-tight">
            환영합니다!
          </h1>
          <p className="text-warm-500 dark:text-warm-400 font-korean">
            소셜 계정으로 간편하게 시작하세요
          </p>
        </div>

        {/* OAuth Buttons — Client Component for reliable cookie handling */}
        <OAuthButtons />

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm-300/60 dark:via-forest-700/60 to-transparent" />
          <span className="text-xs text-warm-400 dark:text-warm-500 font-korean font-medium px-2">또는</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm-300/60 dark:via-forest-700/60 to-transparent" />
        </div>

        {/* Browse without login */}
        <Link
          href="/events"
          className="group w-full flex items-center justify-center gap-2.5 px-5 py-3.5 text-warm-600 dark:text-warm-400 hover:text-forest-700 dark:hover:text-forest-400 font-medium rounded-xl hover:bg-forest-50/60 dark:hover:bg-forest-900/60 transition-all duration-200 font-korean"
        >
          <svg className="w-4.5 h-4.5 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>로그인 없이 둘러보기</span>
        </Link>

        {/* Terms */}
        <div className="mt-10 pt-6 border-t border-warm-200/60 dark:border-forest-800/60 text-center">
          <p className="text-sm text-warm-400 dark:text-warm-500 font-korean leading-relaxed">
            로그인하면{' '}
            <Link href="/terms" className="text-forest-600 dark:text-forest-400 hover:underline underline-offset-2">
              이용약관
            </Link>
            과{' '}
            <Link href="/privacy" className="text-forest-600 dark:text-forest-400 hover:underline underline-offset-2">
              개인정보처리방침
            </Link>
            에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
