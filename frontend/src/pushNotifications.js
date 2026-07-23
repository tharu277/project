import axios from 'axios';

const PUBLIC_VAPID_KEY = 'YOUR_GENERATED_PUBLIC_KEY_HERE'; // මෙතනට Backend එකෙන් ගත් Public Key එක දාන්න

// Base64 string එක Uint8Array බවට හරවන helper function එක
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      // 1. Register Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // 2. Request Notification Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Push Notification permission was denied.');
        return;
      }

      // 3. Subscribe to Push Manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      // 4. Send Subscription details to Backend
      await axios.post('http://localhost:5000/api/notifications/subscribe', subscription);
      console.log('User Subscribed to System Push Notifications successfully!');
      alert('🔔 Live Push Notifications enabled successfully!');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  } else {
    console.warn('Push Notifications are not supported in this browser.');
  }
}