"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import {
  fetchPushServerConfig,
  fetchPushStatus,
  isBrowserPushSupported,
  sendTestBrowserPush,
  setBrowserPushEnabled,
  type PushAuthRole,
  type PushServerConfig,
  type PushStatus,
} from "@/lib/web-push";
import { toast } from "sonner";

type BrowserPushSettingsProps = {
  language?: string;
  role?: PushAuthRole;
  compact?: boolean;
};

export function BrowserPushSettings({
  language = "en",
  role = "USER",
  compact = false,
}: BrowserPushSettingsProps) {
  const supported = isBrowserPushSupported();
  const [serverConfig, setServerConfig] = useState<PushServerConfig | null>(null);
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const cfg = await fetchPushServerConfig();
    setServerConfig(cfg);
    const s = await fetchPushStatus(role);
    setStatus(
      s ?? {
        configured: cfg.configured,
        enabled: false,
        subscribed: false,
        subscriptionCount: 0,
      },
    );
    setLoading(false);
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  const enabled = status?.enabled && status?.subscribed;

  const handleToggle = async () => {
    if (!supported) return;
    setBusy(true);
    try {
      if (enabled) {
        await setBrowserPushEnabled(false, role);
        toast.success(
          language === "en" ? "Browser push disabled" : "Notificaciones del navegador desactivadas",
        );
      } else {
        await setBrowserPushEnabled(true, role);
        toast.success(
          language === "en" ? "Browser push enabled" : "Notificaciones del navegador activadas",
        );
      }
      await load();
    } catch (e) {
      toast.error(
        language === "en" ? "Could not update push settings" : "No se pudo actualizar las notificaciones",
        { description: e instanceof Error ? e.message : String(e) },
      );
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    try {
      const result = await sendTestBrowserPush(role);
      if (result.sent > 0) {
        toast.success(language === "en" ? "Test notification sent" : "Notificación de prueba enviada");
      } else {
        toast.error(
          language === "en"
            ? "No active subscription — enable push first"
            : "Sin suscripción activa — active las notificaciones primero",
        );
      }
    } catch (e) {
      toast.error(
        language === "en" ? "Test failed" : "Prueba fallida",
        { description: e instanceof Error ? e.message : String(e) },
      );
    } finally {
      setBusy(false);
    }
  };

  if (!supported) {
    return (
      <p className="text-xs font-bold text-slate-400">
        {language === "en"
          ? "Browser push is not supported in this browser."
          : "Las notificaciones del navegador no son compatibles con este navegador."}
      </p>
    );
  }

  if (!serverConfig?.configured) {
    return (
      <p className="text-xs font-bold text-amber-600">
        {language === "en"
          ? "Push is not configured on the server (admin must set VAPID keys)."
          : "Push no está configurado en el servidor (el admin debe configurar las claves VAPID)."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4 cursor-pointer">
        <div className="flex items-center gap-3">
          {enabled ? (
            <Bell className="text-[#ff5a5f]" size={20} />
          ) : (
            <BellOff className="text-slate-400" size={20} />
          )}
          <div>
            <span className="text-sm font-bold text-slate-800 block">
              {language === "en" ? "Browser push notifications" : "Notificaciones push del navegador"}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {language === "en"
                ? "Booking alerts even when this tab is closed"
                : "Alertas de reservas aunque esta pestaña esté cerrada"}
            </span>
          </div>
        </div>
        {loading || busy ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : (
          <input
            type="checkbox"
            checked={!!enabled}
            onChange={() => void handleToggle()}
            className="h-5 w-5 rounded border-slate-300 text-[#ff5a5f] focus:ring-[#ff5a5f]"
          />
        )}
      </label>
      {enabled ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleTest()}
          className="text-xs font-black uppercase tracking-widest text-[#ff5a5f] hover:underline disabled:opacity-50"
        >
          {language === "en" ? "Send test notification" : "Enviar notificación de prueba"}
        </button>
      ) : null}
    </div>
  );
}
