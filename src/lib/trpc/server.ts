/**
 * tRPC Server Caller
 * For use in Server Components and Server Actions
 */

import 'server-only';
import { createTRPCContext } from '@/server/trpc';
import { appRouter } from '@/server/api/root';
import { createCallerFactory } from '@/server/trpc';
import { headers } from 'next/headers';

/**
 * Create a server-side caller for use in Server Components
 */
export async function createServerCaller() {
  const createCaller = createCallerFactory(appRouter);

  return createCaller(
    await createTRPCContext({
      req: {
        headers: await headers(),
      },
      resHeaders: new Headers(),
    } as never)
  );
}
