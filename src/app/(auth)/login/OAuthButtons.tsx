/**
 * OAuth Login Buttons — Premium Client Component
 * Beautiful OAuth buttons with refined styling and loading states
 */

'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export function OAuthButtons() {
  const [isLoading, setIsLoading] = useState<'google' | 'kakao' | null>(null);

  const handleOAuthSignIn = async (provider: 'google' | 'kakao') => {
    setIsLoading(provider);
    try {
      await signIn(provider, { callbackUrl: '/' });
    } catch (error) {
      console.error(`[OAuth] ${provider} sign-in error:`, error);
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Google Login */}
      <button
        type="button"
        onClick={() => handleOAuthSignIn('google')}
        disabled={isLoading !== null}
        className="w-full group flex items-center justify-center gap-3 px-5 py-4 bg-white dark:bg-forest-900 border-2 border-warm-200/80 dark:border-forest-700/80 rounded-2xl shadow-[0_2px_12px_-4px_rgba(26,68,32,0.06)] hover:border-forest-300 dark:hover:border-forest-600 hover:shadow-[0_8px_24px_-8px_rgba(26,68,32,0.12)] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-warm-200/80 disabled:hover:shadow-[0_2px_12px_-4px_rgba(26,68,32,0.06)]"
      >
        {isLoading === 'google' ? (
          <div className="w-5 h-5 rounded-full border-2 border-forest-200 border-t-forest-600 animate-spin" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span className="text-warm-700 dark:text-cream-100 font-medium font-korean group-hover:text-forest-700 dark:group-hover:text-forest-300 transition-colors">
          Google로 계속하기
        </span>
      </button>

      {/* Kakao Login */}
      <button
        type="button"
        onClick={() => handleOAuthSignIn('kakao')}
        disabled={isLoading !== null}
        className="w-full group flex items-center justify-center gap-3 px-5 py-4 bg-[#FEE500] rounded-2xl shadow-[0_4px_16px_-4px_rgba(254,229,0,0.4)] hover:bg-[#FFEB3B] hover:shadow-[0_8px_24px_-4px_rgba(254,229,0,0.5)] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#FEE500] disabled:hover:shadow-[0_4px_16px_-4px_rgba(254,229,0,0.4)]"
      >
        {isLoading === 'kakao' ? (
          <div className="w-5 h-5 rounded-full border-2 border-[#191919]/20 border-t-[#191919] animate-spin" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#191919"
              d="M12 3c-5.52 0-10 3.59-10 8 0 2.73 1.76 5.14 4.42 6.52-.19.72-.69 2.6-.79 3-.13.5.18.49.38.36.16-.1 2.44-1.66 3.43-2.34.84.12 1.7.18 2.56.18 5.52 0 10-3.59 10-8S17.52 3 12 3"
            />
          </svg>
        )}
        <span className="text-[#191919] font-medium font-korean">
          카카오로 계속하기
        </span>
      </button>
    </div>
  );
}
