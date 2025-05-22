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
    strategy: 'jwt', // Use JWT for better middleware compatibility
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to JWT token when user first signs in
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
        token.furryName = (user as { furryName?: string }).furryName;
        token.profilePictureUrl = (user as { profilePictureUrl?: string }).profilePictureUrl || user.image;
      } else if (token.id) {
        // On subsequent requests, refresh user data from database
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, username: true, furryName: true, profilePictureUrl: true, email: true, name: true }
          });
          if (dbUser) {
            token.username = dbUser.username;
            token.furryName = dbUser.furryName;
            token.profilePictureUrl = dbUser.profilePictureUrl;
          } else {
            // User not found in database, this shouldn't happen but handle gracefully
            console.warn('User not found in database for token ID:', token.id);
          }
        } catch (error) {
          console.error('Error refreshing user data in JWT callback:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID and custom properties to the session from JWT token
      if (token && session.user) {
        (session.user as { id?: string; username?: string; furryName?: string; profilePictureUrl?: string }).id = token.id as string;
        (session.user as { id?: string; username?: string; furryName?: string; profilePictureUrl?: string }).username = token.username as string;
        (session.user as { id?: string; username?: string; furryName?: string; profilePictureUrl?: string }).furryName = token.furryName as string;
        (session.user as { id?: string; username?: string; furryName?: string; profilePictureUrl?: string }).profilePictureUrl = token.profilePictureUrl as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Auto-create username for OAuth users if they don't have one
      if (account?.provider) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
          });
          
          if (existingUser && !existingUser.username) {
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
            
            await prisma.user.update({
              where: { id: user.id },
              data: { 
                username: finalUsername,
                profilePictureUrl: user.image || existingUser.profilePictureUrl,
              },
            });
            
            // Update the user object with the new username for this session
            (user as { username?: string }).username = finalUsername;
          }
        } catch (error) {
          console.error('Error creating username for OAuth user:', error);
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/login', // Specify custom login page
    // newUser: '/profile/create', // Redirect new users to profile creation
  },
  // Disable debug temporarily to reduce console noise
  debug: false,
};

export default NextAuth(authOptions);
