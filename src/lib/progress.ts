"use client";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Local-mode progress: completed lesson ids in localStorage. Zero backend, works
 * offline, syncs across tabs. When account mode (DB + auth) is enabled this is
 * the seam to swap for server-synced progress.
 */
const KEY = "yoona-academy:progress:v1";
const EMPTY: Record<string, true> = {};

let snapshot: Record<string, true> = EMPTY;
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

export function setLessonComplete(id: string, complete: boolean) {
  if (complete) snapshot = { ...snapshot, [id]: true };
  else {
    const next = { ...snapshot };
    delete next[id];
    snapshot = next;
  }
  emit();
}

/** Read the current completed ids without subscribing (for sync). */
export function getCompletedIds(): string[] {
  if (!hydrated && typeof window !== "undefined") load();
  return Object.keys(snapshot);
}

/** Replace the whole set (used by account-mode sync to mirror the server). */
export function replaceProgress(ids: string[]) {
  snapshot = Object.fromEntries(ids.map((id) => [id, true as const]));
  emit();
}

/** Subscribe to local changes outside React (for the sync mirror). */
export function subscribeProgress(cb: () => void) {
  return subscribe(cb);
}

export function useProgress() {
  const map = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isComplete = useCallback((id: string) => Boolean(map[id]), [map]);
  const toggle = useCallback(
    (id: string) => setLessonComplete(id, !map[id]),
    [map],
  );
  const countOf = useCallback(
    (ids: string[]) => ids.reduce((n, id) => n + (map[id] ? 1 : 0), 0),
    [map],
  );
  return {
    map,
    isComplete,
    toggle,
    countOf,
    totalCompleted: Object.keys(map).length,
  };
}
