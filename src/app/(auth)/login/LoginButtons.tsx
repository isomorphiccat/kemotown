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

// Simplified error mapping
const errorMessages: { [key: string]: string } = {
  OAuthSignin: "Error trying to sign in with the OAuth provider.",
  OAuthCallback: "Error during the OAuth callback.",
  OAuthCreateAccount: "Error creating user account with OAuth provider.",
  EmailCreateAccount: "Error creating user account with email provider.",
  Callback: "Error in the callback handler.",
  OAuthAccountNotLinked: "This account is already linked with another provider. Try signing in with the original provider.",
  Default: "An unknown error occurred during authentication."
};

export default function LoginButtons() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorMessage = error && (errorMessages[error] || errorMessages.Default);

  return (
    <>
      {errorMessage && (
        <div style={errorStyle}>
          <p>Login Error:</p>
          <p>{errorMessage}</p>
        </div>
      )}
      <button onClick={() => signIn('google', { callbackUrl: '/' })} style={{ ...buttonStyle, backgroundColor: '#4285F4', color: 'white' }}>
        {/* Optional: Add Google Icon SVG here */}
        Sign in with Google
      </button>
      <button onClick={() => signIn('kakao', { callbackUrl: '/' })} style={{ ...buttonStyle, backgroundColor: '#FEE500', color: '#3C1E1E' }}>
        {/* Optional: Add Kakao Icon SVG here */}
        Sign in with Kakao
      </button>
    </>
  );
}
