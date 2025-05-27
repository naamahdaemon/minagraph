import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { onMessage, getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHO1ADBXCoEDheIbti99TZ2dTaDhNVkbE",
  authDomain: "paymentlink-ab03d.firebaseapp.com",
  projectId: "paymentlink-ab03d",
  storageBucket: "paymentlink-ab03d.firebasestorage.app",
  messagingSenderId: "648184826463",
  appId: "1:648184826463:web:2edefbe49f127e48dae9ea"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Enregistrement du SW et récupération du token FCM
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(async (registration) => {
    const token = await getToken(messaging, {
      vapidKey: 'BBrIqZPF9RHcrGpk78BQKmut_tL8p058HCLyHy2Ayg_ToRvAiewihSACqmerldGeDfzKgH7Uis5r0wcc0Rui23I',
      serviceWorkerRegistration: registration
    });

    console.log("[FCM] Token:", token);

    const userId = getOrCreateUserId();
    await fetch('https://akirion.com:4665/api/store-fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '0e74cb18-74fa-458e-8adb-f3a8096c0678'
      },
      body: JSON.stringify({ userId, fcmToken: token })
    });
  }).catch(console.error);
}

// ID utilisateur persistant
function getOrCreateUserId() {
  let id = localStorage.getItem("mge_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("mge_user_id", id);
  }
  return id;
}

onMessage(messaging, (payload) => {
  console.log("[FCM] Foreground message received: ", payload);

  const { title, body } = payload.data || {};
  
  if (!title || !body) {
    console.warn('[UI] Ignored invalid foreground notification:', payload);
    return;
  }
  
  const data = { title: title || "Notification", body: body || "", icon: "/icons/icon-192.png" };

  // ✅ Show toast popup
  showToastNotification(data.title, data.body);


  // Optional: also show browser notification
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.showNotification(data.title, { body: data.body, icon: data.icon });
  }
    });
  }
  
  // Save in DB (because page is open)
  saveNotificationToStorage(data)
    .then(updateNotificationBadge)
    .catch(console.error);
});
