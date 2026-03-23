"use client";

import { useEffect } from "react";

const CONFIRM_MESSAGE =
  "You have unsaved changes. Are you sure you want to leave?";

/**
 * Shows a browser confirmation dialog when the user tries to navigate away
 * or close the tab while there are unsaved changes.
 * Covers: tab close/refresh (beforeunload), browser back/forward (popstate),
 * and Next.js client-side navigation (history.pushState).
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    // Block tab close / refresh
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    // Block browser back/forward navigation
    function handlePopState() {
      if (!window.confirm(CONFIRM_MESSAGE)) {
        // Restore the current URL to cancel the navigation
        history.pushState(null, "", window.location.href);
      }
    }

    // Block Next.js client-side navigation (Link clicks, router.push, etc.)
    const originalPushState = history.pushState.bind(history);
    history.pushState = function (...args: Parameters<typeof history.pushState>) {
      if (window.confirm(CONFIRM_MESSAGE)) {
        return originalPushState(...args);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      history.pushState = originalPushState;
    };
  }, [isDirty]);
}
