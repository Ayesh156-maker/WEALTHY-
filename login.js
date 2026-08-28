import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
 apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",
  authDomain: "mylamborghini.firebaseapp.com",
  projectId: "mylamborghini",
  storageBucket: "mylamborghini.firebasestorage.app",
  messagingSenderId: "817085836076",
  appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89",
  measurementId: "G-RY79N9C9R1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// 🔵 REGISTER USER ONLY
document.getElementById("registerBtn").addEventListener("click", async () => {
  try {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    currentUser = userCred.user;

    showToast("User Registered! Now Save Store Data");

  } catch (err) {
    showToast(err.message);
  }
});


// 🟢 SAVE STORE DATA
document.getElementById("saveBtn").addEventListener("click", async () => {

  if (!auth.currentUser) {
    showToast("Please register or login first!");
    return;
  }

  const uid = auth.currentUser.uid;

 const storeData = {

  // ⏰ System Info (always top in DB)
  createdAt: serverTimestamp(),

  // 👤 Owner Info (identity layer)
  owner: {
    name: document.getElementById("ownerName").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    country: document.getElementById("country").value,
    postalCode: document.getElementById("postalCode").value,
  },

  // 🏪 Store Info (main business data)
  store: {
    name: document.getElementById("storeName").value,
    category: document.getElementById("storeCategory").value,
    description: document.getElementById("storeDesc").value,
  },

  // 💳 Payment Info (financial layer)
  payment: {
    bankName: document.getElementById("bankName").value,
    accountNumber: document.getElementById("accountNumber").value,
    paypal: document.getElementById("paypal").value,
  },

  // 🚚 Shipping Info (logistics layer)
  shipping: {
    countries: document.getElementById("shippingCountries").value,
    rule: document.getElementById("shippingRule").value,
  }
};

  try {
    await setDoc(doc(db, "stores", uid), storeData);
    showToast("Store Saved Successfully!");
    window.location.href = "dashboard.html";

  } catch (err) {
    showToast(err.message);
  }
});