"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { MaintenancePage } from "@/components/MaintenancePage";
import { fetchSiteStatus, type SiteStatus } from "@/lib/siteStatus";

const POLL_MS = 30_000;

/** Blocks visitor (guest) traffic when Admin enables maintenance mode. Business panel routes are exempt. */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const { isLoggedIn, isHydrated } = useAuth();
  const [status, setStatus] = useState<SiteStatus | null>(null);

  const isBusinessRoute = pathname.startsWith("/business");

  const loadStatus = useCallback(async () => {
    setStatus(await fetchSiteStatus());
  }, []);

  useEffect(() => {
    if (isBusinessRoute) return;
    void loadStatus();
    const id = window.setInterval(() => void loadStatus(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadStatus();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isBusinessRoute, loadStatus]);

  if (isBusinessRoute) {
    return <>{children}</>;
  }

  if (!isHydrated) {
    return <>{children}</>;
  }

  if (isLoggedIn) {
    return <>{children}</>;
  }

  if (status?.maintenanceMode) {
    return <MaintenancePage platformName={status.platformBranding} />;
  }

  return <>{children}</>;
}
