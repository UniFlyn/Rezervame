"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, ApiUnauthorizedError } from "@/lib/api";
import { PageLoader } from "@/components/admin/AppLoader";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    async function run() {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        await apiGet<{ role: string }>("/auth/admin-session");
        if (!cancelled) setReady(true);
      } catch (err) {
        if (err instanceof ApiUnauthorizedError) return;
        if (typeof window !== "undefined") localStorage.removeItem("admin_token");
        router.replace("/admin/login");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return <PageLoader label="Loading…" />;
  }

  return <>{children}</>;
}
