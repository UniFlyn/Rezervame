"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import {
  fetchPushServerConfig,
  fetchPushStatus,
  isBrowserPushSupported,
  sendTestBrowserPush,
  setBrowserPushEnabled,
  type PushServerConfig,
  type PushStatus,
} from "@/lib/web-push";
import { toastError, toastSuccess } from "@/lib/toast";

export function BrowserPushSettings({ compact = false }: { compact?: boolean }) {
  const supported = isBrowserPushSupported();
  const [serverConfig, setServerConfig] = useState<PushServerConfig | null>(null);
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setStatusError(null);
    const cfg = await fetchPushServerConfig();
    setServerConfig(cfg);
    if (typeof window !== "undefined" && localStorage.getItem("admin_token")) {
      const s = await fetchPushStatus();
      if (s) {
        setStatus(s);
      } else {
        setStatus({
          configured: cfg.configured,
          enabled: false,
          subscribed: false,
          subscriptionCount: 0,
        });
        setStatusError("Could not load your push subscription. Try refreshing or sign in again.");
      }
    } else {
      setStatus({
        configured: cfg.configured,
        enabled: false,
        subscribed: false,
        subscriptionCount: 0,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enabled = status?.enabled && status?.subscribed;

  const handleToggle = async () => {
    if (!supported) return;
    setBusy(true);
    try {
      if (enabled) {
        await setBrowserPushEnabled(false);
        toastSuccess("Browser push disabled");
      } else {
        await setBrowserPushEnabled(true);
        toastSuccess("Browser push enabled", "You will receive admin alerts in this browser.");
      }
      await load();
    } catch (e) {
      toastError("Push setup failed", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!supported) {
    return (
      <p className="text-xs text-slate-500">Browser push is not supported here.</p>
    );
  }

  if (!serverConfig?.configured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        <p className="font-semibold">Push notifications are not set up yet.</p>
        <p className="mt-1 text-amber-800">Contact your administrator to enable browser alerts.</p>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {statusError ? (
        <p className="text-xs text-slate-500">{statusError}</p>
      ) : null}
      <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
        <div className="flex items-center gap-2">
          {enabled ? <Bell className="h-4 w-4 text-blue-600" /> : <BellOff className="h-4 w-4 text-slate-400" />}
          <span className="text-sm font-semibold text-slate-800">Browser push (this admin)</span>
        </div>
        {loading || busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <input
            type="checkbox"
            checked={!!enabled}
            onChange={() => void handleToggle()}
            className="h-4 w-4 accent-blue-600"
          />
        )}
      </label>
      {enabled ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await sendTestBrowserPush();
              toastSuccess(
                r.sent > 0 ? "Test notification sent" : "No delivery",
                r.sent > 0 ? undefined : "Enable push and allow notifications first.",
              );
            } catch (e) {
              toastError("Test failed", String(e));
            } finally {
              setBusy(false);
            }
          }}
          className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-50"
        >
          Send test notification
        </button>
      ) : null}
    </div>
  );
}
