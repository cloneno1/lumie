self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.svg',
      badge: '/favicon.svg',
      data: {
        url: data.url || '/'
      },
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'Xem chi tiết' },
        { action: 'close', title: 'Đóng' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Lumie Store', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
