"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { PageLoader } from "@/components/admin/AppLoader";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    async function run() {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const isLogin = pathname === "/admin/login";

      if (!token) {
        if (!isLogin) router.replace("/admin/login");
        if (!cancelled) setReady(true);
        return;
      }

      try {
        await apiGet<{ role: string }>("/auth/admin-session");
        if (cancelled) return;
        if (isLogin) router.replace("/admin/dashboard");
        else setReady(true);
      } catch {
        if (typeof window !== "undefined") localStorage.removeItem("admin_token");
        if (!isLogin) router.replace("/admin/login");
        if (!cancelled) setReady(true);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return <PageLoader label="Loading…" />;
  }

  return <>{children}</>;
}
