import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

export type PushStatus = {
  configured: boolean;
  enabled: boolean;
  subscribed: boolean;
  subscriptionCount: number;
};

export function isBrowserPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export type PushServerConfig = {
  configured: boolean;
  publicKey: string | null;
};

/** Public endpoint — does not require admin session. */
export async function fetchPushServerConfig(): Promise<PushServerConfig> {
  try {
    const res = await apiGet<PushServerConfig>("/public/push/vapid-public-key");
    return {
      configured: res.configured === true && Boolean(res.publicKey),
      publicKey: res.publicKey ?? null,
    };
  } catch {
    return { configured: false, publicKey: null };
  }
}

export async function fetchPushStatus(): Promise<PushStatus | null> {
  try {
    return await apiGet<PushStatus>("/push/status");
  } catch {
    return null;
  }
}

export async function getVapidPublicKey(): Promise<string | null> {
  const cfg = await fetchPushServerConfig();
  return cfg.publicKey;
}

export async function subscribeBrowserPush(): Promise<boolean> {
  if (!isBrowserPushSupported()) {
    throw new Error("This browser does not support push notifications.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was denied.");
  }
  const publicKey = await getVapidPublicKey();
  if (!publicKey) {
    throw new Error("Push notifications are not configured on the server yet.");
  }
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  const json = subscription.toJSON();
  await apiPost("/push/subscribe", {
    endpoint: json.endpoint,
    keys: json.keys,
  });
  return true;
}

export async function unsubscribeBrowserPush(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    const endpoint = subscription?.endpoint;
    if (subscription) await subscription.unsubscribe();
    await apiDelete(
      endpoint ? `/push/unsubscribe?endpoint=${encodeURIComponent(endpoint)}` : "/push/unsubscribe",
    );
  } catch {
    await apiPatch("/push/preferences", { enabled: false });
  }
}

export async function setBrowserPushEnabled(enabled: boolean): Promise<PushStatus | null> {
  if (enabled) {
    await subscribeBrowserPush();
    return fetchPushStatus();
  }
  await unsubscribeBrowserPush();
  return fetchPushStatus();
}

export async function sendTestBrowserPush(): Promise<{ sent: number; failed: number }> {
  return apiPost<{ sent: number; failed: number }>("/push/test", {});
}

export async function syncBrowserPushIfEnabled(): Promise<void> {
  if (!isBrowserPushSupported()) return;
  if (!localStorage.getItem("admin_token")) return;
  const status = await fetchPushStatus();
  if (!status?.enabled || !status.configured) return;
  if (Notification.permission !== "granted") return;
  try {
    await subscribeBrowserPush();
  } catch {
    //
  }
}
