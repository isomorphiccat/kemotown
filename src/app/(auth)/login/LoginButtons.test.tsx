// src/app/(auth)/login/LoginButtons.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import LoginButtons from './LoginButtons';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

describe('LoginButtons', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    mockSignIn.mockClear();
    mockUseSearchParams.mockClear();
    // Reset useSearchParams to default mock implementation for each test
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it('renders Google and Kakao sign-in buttons', () => {
    render(<LoginButtons />);
    expect(screen.getByText('Google로 로그인')).toBeInTheDocument();
    expect(screen.getByText('카카오로 로그인')).toBeInTheDocument();
  });

  it('calls signIn with "google" when Google button is clicked', () => {
    render(<LoginButtons />);
    fireEvent.click(screen.getByText('Google로 로그인'));
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/', redirect: true });
  });

  it('calls signIn with "kakao" when Kakao button is clicked', () => {
    render(<LoginButtons />);
    fireEvent.click(screen.getByText('카카오로 로그인'));
    expect(mockSignIn).toHaveBeenCalledWith('kakao', { callbackUrl: '/', redirect: true });
  });

  it('displays an error message if error query param is present', () => {
    const searchParams = new URLSearchParams();
    searchParams.set('error', 'OAuthAccountNotLinked');
    mockUseSearchParams.mockReturnValueOnce(searchParams);
    
    render(<LoginButtons />);
    expect(screen.getByText('로그인 오류')).toBeInTheDocument();
    expect(screen.getByText(/This account is already linked with another provider./)).toBeInTheDocument();
  });
});
