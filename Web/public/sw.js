/* Rezervame web push service worker (customer + business panel) */
self.addEventListener("push", (event) => {
  let data = { title: "Rezervame", body: "", url: "/" };
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
    icon: "/logo.png",
    badge: "/logo.png",
    tag: data.tag || "rezervame",
    data: { url: data.url || "/" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(data.title || "Rezervame", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
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
