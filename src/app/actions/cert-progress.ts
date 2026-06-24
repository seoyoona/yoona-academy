"use server";
import { and, eq, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { certProgress } from "@/db/schema";
import { currentUserId } from "@/lib/auth";
import type { CertMap, CertState, CertStatus } from "@/lib/cert-progress";

function rowToState(r: {
  status: CertStatus;
  percent: number;
  badgeUrl: string | null;
  notes: string | null;
  updatedAt: Date;
}): CertState {
  return {
    status: r.status,
    percent: r.percent,
    badgeUrl: r.badgeUrl ?? undefined,
    notes: r.notes ?? undefined,
    updatedAt: r.updatedAt.getTime(),
  };
}

async function serverMap(userId: string): Promise<CertMap> {
  const rows = await db!
    .select()
    .from(certProgress)
    .where(eq(certProgress.userId, userId));
  return Object.fromEntries(rows.map((r) => [r.certId, rowToState(r)]));
}

/**
 * On sign-in, reconcile local and server cert progress: the newer `updatedAt`
 * wins per cert, then push the merged map back so both sides converge.
 */
export async function mergeServerCertProgress(local: CertMap): Promise<CertMap> {
  const userId = await currentUserId();
  if (!db || !userId) return local;

  const server = await serverMap(userId);
  const merged: CertMap = { ...server };
  for (const [id, l] of Object.entries(local)) {
    const s = server[id];
    if (!s || l.updatedAt > s.updatedAt) merged[id] = l;
  }
  await setServerCertProgress(merged);
  return merged;
}

/** Mirror the authoritative cert map to the server (upsert all, prune the rest). */
export async function setServerCertProgress(map: CertMap): Promise<void> {
  const userId = await currentUserId();
  if (!db || !userId) return;

  const ids = Object.keys(map);
  if (ids.length === 0) {
    await db.delete(certProgress).where(eq(certProgress.userId, userId));
    return;
  }

  await db
    .delete(certProgress)
    .where(and(eq(certProgress.userId, userId), notInArray(certProgress.certId, ids)));

  await db
    .insert(certProgress)
    .values(
      ids.map((certId) => {
        const s = map[certId];
        return {
          userId,
          certId,
          status: s.status,
          percent: s.percent,
          badgeUrl: s.badgeUrl ?? null,
          notes: s.notes ?? null,
          updatedAt: new Date(s.updatedAt || Date.now()),
        };
      }),
    )
    .onConflictDoUpdate({
      target: [certProgress.userId, certProgress.certId],
      set: {
        status: sqlExcluded("status"),
        percent: sqlExcluded("percent"),
        badgeUrl: sqlExcluded("badge_url"),
        notes: sqlExcluded("notes"),
        updatedAt: sqlExcluded("updated_at"),
      },
    });
}

// Small helper so the upsert reads the incoming row's value (EXCLUDED.<col>).
import { sql } from "drizzle-orm";
function sqlExcluded(col: string) {
  return sql.raw(`excluded.${col}`);
}
