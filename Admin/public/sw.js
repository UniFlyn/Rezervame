/* Rezervame admin web push service worker */
self.addEventListener("push", (event) => {
  let data = { title: "Rezervame Admin", body: "", url: "/admin/notifications" };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || "",
    icon: "/favicon.ico",
    tag: data.tag || "rezervame-admin",
    data: { url: data.url || "/admin/notifications" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(data.title || "Rezervame Admin", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/admin/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url && "navigate" in client) {
            return client.focus().then(() => client.navigate(targetUrl));
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
