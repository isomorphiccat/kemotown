'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

// Enhanced error mapping with mobile-specific messages
const errorMessages: { [key: string]: string } = {
  OAuthSignin: "Error connecting to Google/Kakao. Please try again.",
  OAuthCallback: "Login was interrupted. Please try signing in again.",
  OAuthCreateAccount: "Unable to create your account. Please try again or contact support.",
  EmailCreateAccount: "Error creating user account with email provider.",
  Callback: "Login callback failed. Please try again.",
  OAuthAccountNotLinked: "This account is already linked with another provider. Try signing in with the original provider.",
  AccessDenied: "Access was denied. Please try again.",
  Configuration: "Login service is temporarily unavailable. Please try again later.",
  Default: "Login failed. Please try again or contact support if the problem persists."
};

export default function LoginButtons() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorMessage = error && (errorMessages[error] || errorMessages.Default);

  const handleGoogleSignIn = () => {
    signIn('google', { 
      callbackUrl: '/',
      redirect: true
    });
  };

  const handleKakaoSignIn = () => {
    signIn('kakao', { 
      callbackUrl: '/',
      redirect: true
    });
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <p className="font-semibold mb-1">로그인 오류</p>
          <p className="text-sm">{errorMessage}</p>
          {error && (
            <p className="text-xs text-muted-foreground mt-2">
              오류 코드: {error}
            </p>
          )}
        </div>
      )}
      
      <Button 
        onClick={handleGoogleSignIn} 
        className="w-full bg-[#4285F4] hover:bg-[#357ae8] text-white font-medium py-6 text-base"
        size="lg"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google로 로그인
      </Button>
      
      <Button 
        onClick={handleKakaoSignIn} 
        className="w-full bg-[#FEE500] hover:bg-[#fdd800] text-[#3C1E1E] font-medium py-6 text-base"
        size="lg"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c-5.27 0-9.55 3.39-9.55 7.57 0 2.67 1.76 5.01 4.4 6.35l-.95 3.48c-.08.29.21.54.49.41l3.85-1.82c.56.08 1.15.13 1.76.13 5.27 0 9.55-3.39 9.55-7.57S17.27 3 12 3z"/>
        </svg>
        카카오로 로그인
      </Button>
    </div>
  );
}
