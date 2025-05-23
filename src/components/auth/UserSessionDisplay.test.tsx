// src/components/auth/UserSessionDisplay.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserSessionDisplay from './UserSessionDisplay';
import { SessionProvider } from 'next-auth/react'; // Import SessionProvider

// Mock next-auth/react
const mockUseSession = jest.fn();
const mockSignOut = jest.fn();

// Mock next/link first
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>,
}));

jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: () => mockUseSession(),
  signOut: (...args: unknown[]) => mockSignOut(...args), // Pass arguments to the mock
}));


describe('UserSessionDisplay', () => {
  beforeEach(() => {
    mockUseSession.mockClear();
    mockSignOut.mockClear();
  });

  it('shows loading state', () => {
    mockUseSession.mockReturnValueOnce({ data: null, status: 'loading' });
    render(<UserSessionDisplay />);
    expect(screen.getByText('Loading session...')).toBeInTheDocument();
  });

  it('shows sign-in button when unauthenticated', () => {
    mockUseSession.mockReturnValueOnce({ data: null, status: 'unauthenticated' });
    render(
      <SessionProvider session={null}> {/* Wrap with SessionProvider */}
        <UserSessionDisplay />
      </SessionProvider>
    );
    expect(screen.getByText('You are not signed in.')).toBeInTheDocument();
    const signInButton = screen.getByRole('button', { name: 'Sign In' });
    expect(signInButton).toBeInTheDocument();
    // Check if the button is wrapped by a link to /login
    expect(signInButton.closest('a')).toHaveAttribute('href', '/login');
  });

  it('shows user info and sign-out button when authenticated', () => {
    const session = {
      user: { name: 'Test User', email: 'test@example.com', id: '123' },
      expires: '2099-01-01T00:00:00.000Z'
    };
    mockUseSession.mockReturnValueOnce({ data: session, status: 'authenticated' });
    render(
      <SessionProvider session={session}> {/* Wrap with SessionProvider */}
        <UserSessionDisplay />
      </SessionProvider>
    );
    // Adjusted text matching: Check for the paragraph containing the text
    const userInfoElement = screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'p' && content.startsWith('Signed in as:');
    });
    expect(userInfoElement).toBeInTheDocument();
    expect(screen.getByText('Test User', { selector: 'strong' })).toBeInTheDocument(); // Ensure "Test User" is present, specifically within a strong tag
    expect(screen.getByText(`(test@example.com)`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });

  it('calls signOut when sign-out button is clicked', () => {
    const session = {
      user: { name: 'Test User', email: 'test@example.com', id: '123' },
      expires: '2099-01-01T00:00:00.000Z'
    };
    mockUseSession.mockReturnValueOnce({ data: session, status: 'authenticated' });
    render(
      <SessionProvider session={session}> {/* Wrap with SessionProvider */}
        <UserSessionDisplay />
      </SessionProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
  });
});
