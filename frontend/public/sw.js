// public/sw.js

// 🔔 1. Web Push Notification එක Receive වන විට
self.addEventListener('push', (event) => {
  let data = {};

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data = {
      title: '🚌 Bus Live Tracking',
      body: event.data ? event.data.text() : 'Bus updates are available!'
    };
  }

  const title = data.title || '🚌 Bus Live Tracking';
  const options = {
    body: data.body || 'Bus updates are available!',
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/logo192.png',
    vibrate: [100, 50, 100], // Mobile vibration pattern
    data: {
      url: data.url || '/' // Push payload එකෙන් එවන Link එක (eg: '/passenger-dashboard')
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 👆 2. User Notification එක උඩ Click කළ විට App එක Open වීම
self.addEventListener('notificationclick', (event) => {
  // Notification එක Auto Close කිරීම
  event.notification.close();

  // Notification Data එකේ තියෙන Target URL එක ලබා ගැනීම
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. App එක දැනටමත් Browser Tab එකක Open වෙලා තියෙනවා නම් ඒ Tab එකට Focus කිරීම
      for (let client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. Open වෙලා නැත්නම් අලුතෙන්ම Window/Tab එකකින් URL එක Open කිරීම
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});