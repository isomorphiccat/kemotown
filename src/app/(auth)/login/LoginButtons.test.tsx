// src/app/(auth)/login/LoginButtons.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginButtons from './LoginButtons';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null), // Default to no error
  })),
}));

describe('LoginButtons', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    const { signIn } = require('next-auth/react');
    const { useSearchParams } = require('next/navigation');
    (signIn as jest.Mock).mockClear();
    (useSearchParams as jest.Mock).mockClear();
    // Reset useSearchParams to default mock implementation for each test
    (useSearchParams as jest.Mock).mockImplementation(() => ({
        get: jest.fn(() => null),
    }));
  });

  it('renders Google and Kakao sign-in buttons', () => {
    render(<LoginButtons />);
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Kakao')).toBeInTheDocument();
  });

  it('calls signIn with "google" when Google button is clicked', () => {
    const { signIn } = require('next-auth/react');
    render(<LoginButtons />);
    fireEvent.click(screen.getByText('Sign in with Google'));
    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/' });
  });

  it('calls signIn with "kakao" when Kakao button is clicked', () => {
    const { signIn } = require('next-auth/react');
    render(<LoginButtons />);
    fireEvent.click(screen.getByText('Sign in with Kakao'));
    expect(signIn).toHaveBeenCalledWith('kakao', { callbackUrl: '/' });
  });

  it('displays an error message if error query param is present', () => {
    const { useSearchParams } = require('next/navigation');
    (useSearchParams as jest.Mock).mockReturnValueOnce({
      get: jest.fn((param: string) => param === 'error' ? 'OAuthAccountNotLinked' : null),
    });
    render(<LoginButtons />);
    expect(screen.getByText('Login Error:')).toBeInTheDocument();
    expect(screen.getByText(/This account is already linked with another provider./)).toBeInTheDocument();
  });
});
