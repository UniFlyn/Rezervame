import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

export type PushAuthRole = "USER" | "BUSINESS" | "ADMIN";

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

export async function fetchPushStatus(role: PushAuthRole = "USER"): Promise<PushStatus | null> {
  try {
    return await apiGet<PushStatus>("/push/status", role);
  } catch {
    return null;
  }
}

export async function getVapidPublicKey(): Promise<string | null> {
  const cfg = await fetchPushServerConfig();
  return cfg.publicKey;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  return registration;
}

export async function subscribeBrowserPush(role: PushAuthRole = "USER"): Promise<boolean> {
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

  const registration = await registerServiceWorker();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  await apiPost(
    "/push/subscribe",
    {
      endpoint: json.endpoint,
      keys: json.keys,
    },
    role,
  );

  return true;
}

export async function unsubscribeBrowserPush(role: PushAuthRole = "USER"): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    const endpoint = subscription?.endpoint;
    if (subscription) {
      await subscription.unsubscribe();
    }
    await apiDelete(
      endpoint ? `/push/unsubscribe?endpoint=${encodeURIComponent(endpoint)}` : "/push/unsubscribe",
      role,
    );
  } catch {
    await apiPatch("/push/preferences", { enabled: false }, role);
  }
}

export async function setBrowserPushEnabled(
  enabled: boolean,
  role: PushAuthRole = "USER",
): Promise<PushStatus | null> {
  if (enabled) {
    await subscribeBrowserPush(role);
    return fetchPushStatus(role);
  }
  await unsubscribeBrowserPush(role);
  return fetchPushStatus(role);
}

export async function sendTestBrowserPush(
  role: PushAuthRole = "USER",
): Promise<{ sent: number; failed: number }> {
  return apiPost<{ sent: number; failed: number }>("/push/test", {}, role);
}

export async function syncBrowserPushIfEnabled(role: PushAuthRole = "USER"): Promise<void> {
  if (!isBrowserPushSupported()) return;
  const status = await fetchPushStatus(role);
  if (!status?.enabled || !status.configured) return;
  if (Notification.permission !== "granted") return;
  try {
    await subscribeBrowserPush(role);
  } catch {
    // ignore background sync errors
  }
}
