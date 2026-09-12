import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  userId: string;
}

/**
 * Threads the current chat request's userId into tool execute() calls
 * without changing the `tool()` call signature (the Vercel AI SDK's tool
 * context generic would require restructuring every tool definition and the
 * streamText call together). AsyncLocalStorage propagates across the
 * await/Promise chains streamText's tool execution runs through, including
 * the mock trace's setTimeout-based delays.
 */
export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContext.getStore();
}
