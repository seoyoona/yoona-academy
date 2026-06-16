"use server";
import { and, eq, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { progress } from "@/db/schema";
import { currentUserId } from "@/lib/auth";

/**
 * Merge local (browser) progress into the signed-in user's server record and
 * return the union — called once on sign-in so devices converge.
 */
export async function mergeServerProgress(localIds: string[]): Promise<string[]> {
  const userId = await currentUserId();
  if (!db || !userId) return localIds;

  if (localIds.length) {
    await db
      .insert(progress)
      .values(
        localIds.map((lessonId) => ({
          userId,
          lessonId,
          status: "completed" as const,
          completedAt: new Date(),
        })),
      )
      .onConflictDoNothing();
  }

  const rows = await db
    .select({ lessonId: progress.lessonId })
    .from(progress)
    .where(eq(progress.userId, userId));
  return rows.map((r) => r.lessonId);
}

/** Mirror the authoritative set of completed lessons to the server. */
export async function setServerProgress(ids: string[]): Promise<void> {
  const userId = await currentUserId();
  if (!db || !userId) return;

  if (ids.length === 0) {
    await db.delete(progress).where(eq(progress.userId, userId));
    return;
  }
  await db
    .delete(progress)
    .where(and(eq(progress.userId, userId), notInArray(progress.lessonId, ids)));
  await db
    .insert(progress)
    .values(
      ids.map((lessonId) => ({
        userId,
        lessonId,
        status: "completed" as const,
        completedAt: new Date(),
      })),
    )
    .onConflictDoNothing();
}
