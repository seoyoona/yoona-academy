import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk middleware is only active when auth is configured; otherwise a no-op
 * pass-through so local-only mode runs without Clerk keys.
 */
const enabled = Boolean(process.env.CLERK_SECRET_KEY);

export default enabled ? clerkMiddleware() : function passthrough() {};

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
