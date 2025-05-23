import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';
import { uniqueNamesGenerator, adjectives, animals, Config } from 'unique-names-generator';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
    async signIn() {
      // Allow all sign-ins
      return true;
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
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Generated username "${finalUsername}" for new user ${user.id}`);
        }
      } catch (error) {
        console.error('Error generating username for new user:', error);
      }
    },
  },
  // Enable debug for troubleshooting
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', code, metadata);
      }
    },
  },
};

export default NextAuth(authOptions);
