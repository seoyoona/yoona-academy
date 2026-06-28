"use client";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Local-mode certification progress: a richer cousin of lib/progress.ts. Each
 * cert carries a status + percent + earned badge URL + note (lessons are just
 * a boolean set). Stored in localStorage; account mode mirrors it to Postgres.
 */
export type CertStatus = "not_started" | "in_progress" | "completed";

export type CertState = {
  status: CertStatus;
  percent: number;
  badgeUrl?: string;
  notes?: string;
  updatedAt: number;
};

export type CertMap = Record<string, CertState>;

const KEY = "yoona-academy:certs:v1";
const EMPTY: CertMap = {};

let snapshot: CertMap = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function load() {
  try {
    snapshot = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    snapshot = {};
  }
  hydrated = true;
}

function emit() {
  localStorage.setItem(KEY, JSON.stringify(snapshot));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  if (!hydrated) load();
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      load();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  if (!hydrated && typeof window !== "undefined") load();
  return snapshot;
}
function getServerSnapshot() {
  return EMPTY;
}

const DEFAULT: CertState = { status: "not_started", percent: 0, updatedAt: 0 };

/** Patch one cert's state; status drives percent (completed→100, not_started→0). */
export function patchCert(id: string, patch: Partial<CertState>) {
  const prev = snapshot[id] ?? DEFAULT;
  const next: CertState = { ...prev, ...patch, updatedAt: Date.now() };
  if (patch.status === "completed" && patch.percent === undefined)
    next.percent = 100;
  if (patch.status === "not_started" && patch.percent === undefined)
    next.percent = 0;
  // Keep status and percent coherent when percent is what changed.
  if (patch.percent !== undefined && patch.status === undefined) {
    next.percent = Math.max(0, Math.min(100, patch.percent));
    if (next.percent === 100) next.status = "completed";
    else if (next.percent === 0) next.status = "not_started";
    else next.status = "in_progress";
  }
  snapshot = { ...snapshot, [id]: next };
  emit();
}

/** Read the full map without subscribing (for sync). */
export function getCertMap(): CertMap {
  if (!hydrated && typeof window !== "undefined") load();
  return snapshot;
}

/** Replace the whole map (account-mode sync mirrors the server). */
export function replaceCertMap(map: CertMap) {
  snapshot = { ...map };
  emit();
}

/** Subscribe to local changes outside React (for the sync mirror). */
export function subscribeCerts(cb: () => void) {
  return subscribe(cb);
}

export function useCerts() {
  const map = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const get = useCallback((id: string): CertState => map[id] ?? DEFAULT, [map]);
  return { map, get, patch: patchCert };
}
