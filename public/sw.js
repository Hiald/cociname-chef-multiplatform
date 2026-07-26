// Service Worker — Cociname Chef
// Handles Web Push notifications from cociname-admin-api

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = { title: 'Cociname', body: 'Tienes una nueva notificación.', url: '/' };
  try {
    payload = event.data.json();
  } catch {
    payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [200, 100, 200],
    data: { url: payload.url },
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rawPath = (event.notification.data && event.notification.data.url) || '/reservation';
  const cleanPath = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
  // La app usa HashRouter: las rutas viven detrás del '#'.
  const targetUrl = self.location.origin + '/#' + cleanPath;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (!client.url.startsWith(self.location.origin)) continue;

        if ('navigate' in client) {
          return client
            .navigate(targetUrl)
            .then((navigated) => (navigated && 'focus' in navigated ? navigated.focus() : null))
            .catch(() => ('focus' in client ? client.focus() : null));
        }

        if ('focus' in client) return client.focus();
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
