"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { syncBrowserPushIfEnabled } from "@/lib/web-push";

export function WebPushManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/admin/login") return;
    if (!localStorage.getItem("admin_token")) return;
    void syncBrowserPushIfEnabled();
  }, [pathname]);

  return null;
}
