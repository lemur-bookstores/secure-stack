import { initTRPC } from '@trpc/server';
import type { SecureStack } from '@lemur-bookstores/secure-stack-core';

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

export function createTRPCRouter(_secureStack: SecureStack) {
  // This function will convert SecureStack routers to tRPC routers
  // For now, returning a simple router for testing
  return router({
    version: publicProcedure.query(() => {
      return '0.0.1';
    }),
  });
}
