/**
 * NextAuth.js Type Extensions
 * Extends the default session types with custom user properties
 */

import 'next-auth';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username?: string;
      displayName?: string;
      avatarUrl?: string;
    } & DefaultSession['user'];
  }

  interface User {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  }
}
