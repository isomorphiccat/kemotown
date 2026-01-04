/**
 * Auth.js v5 Configuration
 * Handles authentication with Google and Kakao OAuth providers
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Kakao from 'next-auth/providers/kakao';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/server/db';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';

/**
 * Generate a unique username for new users
 */
async function generateUniqueUsername(): Promise<string> {
  let attempts = 0;
  let username: string;

  do {
    username = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: '-',
      length: 2,
    });
    attempts++;

    // Fallback to timestamp if too many attempts
    if (attempts > 10) {
      username = `user-${Date.now()}`;
      break;
    }

    // Check if username exists
    const existing = await db.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existing) break;
  } while (true);

  return username;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  cookies: {
    pkceCodeVerifier: {
      name: 'authjs.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      // Only allow OAuth sign-ins
      if (account?.provider === 'google' || account?.provider === 'kakao') {
        // Google requires email
        if (account.provider === 'google' && !user?.email) {
          return false;
        }
        // Kakao users might not have email (non-business accounts)
        // They can still sign in using their Kakao ID
        return true;
      }
      return false;
    },
    async session({ session, user }) {
      // Add user properties to the session
      if (session.user) {
        session.user.id = user.id;
        // Cast to access custom fields
        const dbUser = user as {
          id: string;
          username?: string;
          displayName?: string;
          avatarUrl?: string;
        };
        session.user.username = dbUser.username;
        session.user.displayName = dbUser.displayName;
        session.user.avatarUrl = dbUser.avatarUrl;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Generate username for new OAuth users
      try {
        const username = await generateUniqueUsername();

        await db.user.update({
          where: { id: user.id },
          data: {
            username,
            avatarUrl: user.image,
          },
        });

        // TODO: Send welcome notification via bot system
        console.log(`[Auth] New user created: @${username}`);
      } catch (error) {
        console.error('[Auth] Error generating username:', error);
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
});

// Export auth config for middleware
export { auth as getServerSession };
