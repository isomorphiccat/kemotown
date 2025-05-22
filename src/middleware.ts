import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // If no specific checks beyond authentication are needed for the matched routes,
    // just return NextResponse.next() to continue.
    // This is implicitly handled by withAuth if the user is authenticated.
    // If the user is not authenticated, withAuth will redirect to the login page.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // If there is a token, the user is authorized
    },
    pages: {
      signIn: '/login', // Redirect to this page if not authorized
    },
  }
);

// Define which paths this middleware should apply to
export const config = {
  matcher: [
    '/profile/:path*', // Protects all routes under /profile
    '/events/create',   // Example: Protects the event creation page
    // Add other paths that require authentication
    // '/dashboard/:path*',
  ],
};
