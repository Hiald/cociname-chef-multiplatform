import { apiService } from '../services/api.service';

const PUSH_ENDPOINT_KEY = 'push_endpoint';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function subscribePushNotifications(chefId: number): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed with the same endpoint to avoid duplicates
    const existing = await registration.pushManager.getSubscription();
    const storedEndpoint = localStorage.getItem(PUSH_ENDPOINT_KEY);
    if (existing && existing.endpoint === storedEndpoint) return;

    // Get VAPID public key from backend
    const vapidResponse = await apiService.getPushVapidPublicKey();
    if (!vapidResponse.success || !vapidResponse.data?.publicKey) return;

    const applicationServerKey = urlBase64ToUint8Array(vapidResponse.data.publicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    const subJson = subscription.toJSON();
    const endpoint = subJson.endpoint ?? '';
    const p256dh = subJson.keys?.p256dh ?? '';
    const auth = subJson.keys?.auth ?? '';

    localStorage.setItem(PUSH_ENDPOINT_KEY, endpoint);

    await apiService.subscribePush({
      chefId,
      endpoint,
      p256dh,
      auth,
      userAgent: navigator.userAgent.slice(0, 200),
    });
  } catch (error) {
    console.error('[Push] Error subscribing:', error);
  }
}

export async function unsubscribePushNotifications(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await apiService.unsubscribePush(subscription.endpoint);
    }

    localStorage.removeItem(PUSH_ENDPOINT_KEY);
  } catch (error) {
    console.error('[Push] Error unsubscribing:', error);
  }
}
