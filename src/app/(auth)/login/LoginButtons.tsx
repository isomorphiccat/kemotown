'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation'; // To read error messages

// Basic button styling, can be replaced with UI library components
const buttonStyle = {
  padding: '10px 20px',
  margin: '10px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  cursor: 'pointer',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const errorStyle = {
    color: 'red',
    margin: '10px 0',
    padding: '10px',
    border: '1px solid red',
    borderRadius: '5px',
    backgroundColor: '#ffebeb'
}

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
    <>
      {errorMessage && (
        <div style={errorStyle}>
          <p>Login Error:</p>
          <p>{errorMessage}</p>
          {error && (
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Error code: {error}
            </p>
          )}
        </div>
      )}
      <button onClick={handleGoogleSignIn} style={{ ...buttonStyle, backgroundColor: '#4285F4', color: 'white' }}>
        {/* Optional: Add Google Icon SVG here */}
        Sign in with Google
      </button>
      <button onClick={handleKakaoSignIn} style={{ ...buttonStyle, backgroundColor: '#FEE500', color: '#3C1E1E' }}>
        {/* Optional: Add Kakao Icon SVG here */}
        Sign in with Kakao
      </button>
    </>
  );
}
