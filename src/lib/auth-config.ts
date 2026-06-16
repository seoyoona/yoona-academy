/**
 * Isomorphic flag — true when Clerk auth ("account mode") is configured.
 * Safe in both client and server (reads a public env var).
 */
export const authEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
