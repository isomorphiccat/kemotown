import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';
import { uniqueNamesGenerator, adjectives, animals, Config } from 'unique-names-generator';
import { Adapter } from 'next-auth/adapters';

// Custom adapter that handles users without email
const customPrismaAdapter = PrismaAdapter(prisma) as Adapter;

// Override createUser to handle Kakao users without email
const originalCreateUser = customPrismaAdapter.createUser!;
customPrismaAdapter.createUser = async (user) => {
  // For Kakao users without email, generate a placeholder email
  if (!user.email) {
    const timestamp = Date.now();
    user.email = `kakao_${timestamp}@placeholder.local`;
  }
  return originalCreateUser(user);
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: customPrismaAdapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'database', // Use database sessions with Prisma adapter
  },
  callbacks: {
    async jwt({ token, user }) {
      // JWT callback not used with database sessions, but kept for compatibility
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
        token.furryName = (user as { furryName?: string }).furryName;
        token.profilePictureUrl = (user as { profilePictureUrl?: string }).profilePictureUrl || user.image;
      }
      return token;
    },
    async session({ session, user }) {
      // Add user properties to the session from database user
      if (user && session.user) {
        (session.user as { id?: string; username?: string; furryName?: string; profilePictureUrl?: string }).id = user.id;
        (session.user as { id?: string; username?: string; furryName?: string; profilePictureUrl?: string }).username = (user as { username?: string }).username;
        (session.user as { id?: string; username?: string; furryName?: string; profilePictureUrl?: string }).furryName = (user as { furryName?: string }).furryName;
        (session.user as { id?: string; username?: string; furryName?: string; profilePictureUrl?: string }).profilePictureUrl = (user as { profilePictureUrl?: string }).profilePictureUrl;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle mobile OAuth redirects properly
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async signIn({ user, account }) {
      // Only allow OAuth sign-ins from Google and Kakao
      if (account?.provider === 'google' || account?.provider === 'kakao') {
        // Google requires email
        if (account.provider === 'google' && !user?.email) {
          return false;
        }
        // Kakao users might not have email (non-business accounts)
        // They can still sign in using their Kakao ID
        return true;
      }
      
      // Reject other sign-in methods
      return false;
    },
  },
  pages: {
    signIn: '/login', // Specify custom login page
    error: '/login', // Redirect errors to login page
    // newUser: '/profile/create', // Redirect new users to profile creation
  },
  events: {
    async createUser({ user }) {
      // Generate username for new OAuth users
      try {
        // Generate random human-readable username
        const customConfig: Config = {
          dictionaries: [adjectives, animals],
          separator: '-',
          length: 2,
        };
        
        // Ensure username is unique
        let finalUsername: string;
        let attempts = 0;
        do {
          finalUsername = uniqueNamesGenerator(customConfig);
          attempts++;
          // Fallback to timestamp if too many attempts
          if (attempts > 10) {
            finalUsername = `user-${Date.now()}`;
            break;
          }
        } while (await prisma.user.findUnique({ where: { username: finalUsername } }));
        
        // Update the newly created user with username and profile picture
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            username: finalUsername,
            profilePictureUrl: user.image,
          },
        });
        
        // Notify timeline about new user
        try {
          if (!process.env.NEXTAUTH_URL || !process.env.INTERNAL_API_KEY) {
            console.warn(
              'Missing NEXTAUTH_URL or INTERNAL_API_KEY, skipping bot notification'
            );
            return;
          }

          await fetch(`${process.env.NEXTAUTH_URL}/api/timeline/bot`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.INTERNAL_API_KEY,
            },
            body: JSON.stringify({
              type: 'user_joined',
              data: {
                username: finalUsername,
                furryName: null,
                isNewUser: true
              }
            })
          });
        } catch (error) {
          console.error('Failed to notify about new user:', error);
        }
        
        // Username generated successfully
      } catch (error) {
        console.error('Error generating username for new user:', error);
      }
    },
  },
  // Only enable debug in development
  debug: false,
};

export default NextAuth(authOptions);
