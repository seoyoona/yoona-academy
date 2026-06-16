import "server-only";
import { auth } from "@clerk/nextjs/server";
import { authEnabled } from "./auth-config";

/** Current signed-in user id, or null when auth is off / signed out. */
export async function currentUserId(): Promise<string | null> {
  if (!authEnabled) return null;
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}
