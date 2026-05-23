"use client";

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { syncBrowserPushIfEnabled, type PushAuthRole } from "@/lib/web-push";

/** Keeps push subscription in sync when the user is logged in and has opted in. */
export function WebPushManager({ role = "USER" }: { role?: PushAuthRole }) {
  const { isLoggedIn, isHydrated } = useAuth();

  useEffect(() => {
    if (role !== "USER") return;
    if (!isHydrated || !isLoggedIn) return;
    void syncBrowserPushIfEnabled("USER");
  }, [isHydrated, isLoggedIn, role]);

  return null;
}
