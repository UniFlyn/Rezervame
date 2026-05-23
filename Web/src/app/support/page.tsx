"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Canonical customer support URL is /customer-service */
export default function SupportRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/customer-service");
  }, [router]);
  return null;
}
