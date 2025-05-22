'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import React from 'react';

const buttonStyle = {
  padding: '8px 15px',
  margin: '5px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  cursor: 'pointer',
  fontSize: '14px',
};

const sessionInfoStyle = {
    padding: '10px',
    margin: '10px',
    border: '1px solid #eee',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    flexDirection: 'column' as const, // Explicitly type flexDirection
    alignItems: 'center',
    gap: '10px'
}

export default function UserSessionDisplay() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p>Loading session...</p>;
  }

  if (session) {
    return (
      <div style={sessionInfoStyle}>
        <p>Signed in as: <strong>{session.user?.name || session.user?.email || (session.user as { id?: string })?.id}</strong></p>
        {session.user?.email && <p><small>({session.user.email})</small></p>}
        <button
          onClick={() => signOut({ callbackUrl: '/' })} // Redirect to home after sign out
          style={{ ...buttonStyle, backgroundColor: '#f44336', color: 'white' }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div style={sessionInfoStyle}>
      <p>You are not signed in.</p>
      <Link href="/login">
        <button style={{ ...buttonStyle, backgroundColor: '#4CAF50', color: 'white' }}>
          Sign In
        </button>
      </Link>
    </div>
  );
}
