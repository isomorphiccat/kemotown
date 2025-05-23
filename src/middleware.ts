import { NextResponse } from 'next/server';

// Temporarily disable middleware-level authentication to avoid conflicts
// Authentication will be handled purely on the client side
export function middleware() {
  return NextResponse.next();
}

// Empty matcher means middleware runs on all routes but does nothing
export const config = {
  matcher: [],
};
