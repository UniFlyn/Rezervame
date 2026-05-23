"use client";

import { useEffect, useState } from "react";
import { syncBrowserPushIfEnabled } from "@/lib/web-push";

export function BusinessWebPushManager() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(Boolean(localStorage.getItem("business_token")));
  }, []);

  useEffect(() => {
    if (!active) return;
    void syncBrowserPushIfEnabled("BUSINESS");
  }, [active]);

  return null;
}
