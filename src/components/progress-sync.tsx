"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  getCompletedIds,
  replaceProgress,
  subscribeProgress,
} from "@/lib/progress";
import { mergeServerProgress, setServerProgress } from "@/app/actions/progress";

/**
 * Account-mode sync: on sign-in, merge local progress with the server (union),
 * then mirror every local change back to the server (debounced). Rendered only
 * inside ClerkProvider. No-op while signed out — local storage keeps working.
 */
export function ProgressSync() {
  const { isLoaded, isSignedIn } = useAuth();
  const synced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || synced.current) return;
    synced.current = true;

    let unsubscribe = () => {};
    let timer: ReturnType<typeof setTimeout>;

    (async () => {
      const union = await mergeServerProgress(getCompletedIds());
      replaceProgress(union);
      unsubscribe = subscribeProgress(() => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          void setServerProgress(getCompletedIds());
        }, 800);
      });
    })();

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [isLoaded, isSignedIn]);

  return null;
}
