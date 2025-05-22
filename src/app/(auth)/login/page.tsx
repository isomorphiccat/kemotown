import { signIn } from 'next-auth/react'; // This client component hook will be used in a client component
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginButtons from './LoginButtons'; // We'll create this client component

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // If the user is already logged in, redirect to the home page or a dashboard
  if (session) {
    redirect('/');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <h1>Login to Kemotown</h1>
      {/* TODO: Add error message display here if needed, e.g., based on query params */}
      <LoginButtons />
      <p style={{ marginTop: '20px', fontSize: '0.8em', color: '#555' }}>
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
