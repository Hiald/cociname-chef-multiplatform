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

  const targetUrl = self.location.origin + '/#/reservation';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing window if one is open
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'PUSH_NAVIGATE', url: '/#/reservation' });
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
