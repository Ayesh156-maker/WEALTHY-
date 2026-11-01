// ===============================
// LeanGelo Push Notifications
// ===============================

import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);


// ===============================
// FIREBASE CONFIG
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",
  authDomain: "mylamborghini.firebaseapp.com",
  projectId: "mylamborghini",
  messagingSenderId: "817085836076",
  appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89"
};



const messaging = getMessaging(app);
const auth = getAuth(app);
const db = getFirestore(app);


// ===============================
// ASK NOTIFICATION PERMISSION
// ===============================

async function enablePushNotifications(user) {

  try {

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("🔕 Notification permission denied.");
      return;
    }

    console.log("🔔 Notification permission granted.");


    // ===============================
    // GET FCM TOKEN
    // ===============================

    const token = await getToken(messaging, {
      vapidKey: "BAOvvXxpNgZSZf7HRpo2Zkirh_OuGczO-XRpDjYHnXJ5YQ6_HY2e3DZCsQFybHq3cOUwx_ea7ll29bPjRShOdU0"
    });


    if (!token) {
      console.log("❌ FCM token not available.");
      return;
    }


    console.log("✅ FCM Token:", token);


    // ===============================
    // SAVE TOKEN
    // ===============================

    await setDoc(
      doc(db, "users", user.uid, "fcmTokens", token),
      {
        token: token,
        createdAt: serverTimestamp(),
        platform: "web"
      }
    );

    console.log("✅ FCM token saved to Firestore.");

  } catch (error) {

    console.error(
      "❌ Push notification setup error:",
      error
    );

  }

}


// ===============================
// AUTH STATE
// ===============================

onAuthStateChanged(auth, (user) => {

  if (user) {

    console.log(
      "👤 Logged in:",
      user.email
    );

    enablePushNotifications(user);

  } else {

    console.log("👤 User not logged in.");

  }

});


// ===============================
// FOREGROUND MESSAGE
// ===============================

onMessage(messaging, (payload) => {

  console.log(
    "🔔 LeanGelo notification received:",
    payload
  );

  if (Notification.permission === "granted") {

    new Notification(
      payload.notification?.title || "LeanGelo",
      {
        body:
          payload.notification?.body ||
          "You have a new notification."
      }
    );

  }

});