/**
 * Auth Debug Endpoint
 * Returns the current auth configuration status at runtime
 * DELETE THIS FILE after debugging is complete
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Check environment variables at runtime
  const config = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,

    // Auth secret
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    secretSource: process.env.AUTH_SECRET ? 'AUTH_SECRET' :
                  process.env.NEXTAUTH_SECRET ? 'NEXTAUTH_SECRET' : 'NONE',

    // OAuth credentials (lengths only, not values)
    google: {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
      clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
    },
    kakao: {
      hasClientId: !!process.env.KAKAO_CLIENT_ID,
      hasClientSecret: !!process.env.KAKAO_CLIENT_SECRET,
      clientIdLength: process.env.KAKAO_CLIENT_ID?.length || 0,
      clientSecretLength: process.env.KAKAO_CLIENT_SECRET?.length || 0,
    },

    // URL configuration
    urls: {
      nextauthUrl: process.env.NEXTAUTH_URL || null,
      authUrl: process.env.AUTH_URL || null,
      vercelUrl: process.env.VERCEL_URL || null,
    },

    // Database
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...' || null,
  };

  return NextResponse.json(config);
}
