"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { getCertMap, replaceCertMap, subscribeCerts } from "@/lib/cert-progress";
import {
  mergeServerCertProgress,
  setServerCertProgress,
} from "@/app/actions/cert-progress";

/**
 * Account-mode cert sync: on sign-in, reconcile local ↔ server (newer wins),
 * then mirror every local change back (debounced). Mirrors ProgressSync.
 */
export function CertProgressSync() {
  const { isLoaded, isSignedIn } = useAuth();
  const synced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || synced.current) return;
    synced.current = true;

    let unsubscribe = () => {};
    let timer: ReturnType<typeof setTimeout>;

    (async () => {
      const merged = await mergeServerCertProgress(getCertMap());
      replaceCertMap(merged);
      unsubscribe = subscribeCerts(() => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          void setServerCertProgress(getCertMap());
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
