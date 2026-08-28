  import {
    getFirestore,
    collection,
    addDoc
  } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
  // 🔥 IMPORTS (FIRST!)
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
  import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged 
  } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

  // 🔥 FIREBASE CONFIG
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
  const provider = new GoogleAuthProvider();
  const db = getFirestore(app);
  window.auth = auth; // 🔥 VERY IMPORTANT
  


  // 🔥 INIT


  // ✅ LOGIN FUNCTION (ONLY ONE!)
  window.googleLogin = function () {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;

        document.getElementById("userName").innerText = user.displayName;
        document.getElementById("userPhoto").src = user.photoURL;
        document.getElementById("userPhoto").style.display = "block";

        document.getElementById("googleLoginBtn").innerText = "Logged In ✅";
      })
      .catch((error) => {
        showToast(error.message);
        console.log(error);
      });
  };
  onAuthStateChanged(auth, (user) => {
    const nameEl = document.getElementById("userName");
    const photoEl = document.getElementById("userPhoto");
    const loginBtn = document.getElementById("googleLoginBtn");

    if (!nameEl || !photoEl || !loginBtn) return;

    if (user) {
      nameEl.innerText = user.displayName || "";
      photoEl.src = user.photoURL || "";
      photoEl.style.display = "block";
      loginBtn.innerText = "Logged In ✅";
    } else {
      nameEl.innerText = "";
      photoEl.style.display = "none";
      loginBtn.innerText = "Login";
    }
  });
  async function placeOrder() {
      const orderCart = [...cart];

      const orderData = {
        total: orderCart.reduce((sum, i) => sum + i.price, 0)
         
          
          
      };

    

      await saveOrder(orderData);

      showToast("Order placed successfully ✅");

      cart = [];
      updateCart();
      closeCheckout();
  }
window.saveOrder = async function(orderData) {
  const user = auth.currentUser;

  if (!user) {
    showToast("Login first");
    return;
  }

  try {
    await addDoc(collection(db, "orders"), {
      fullname: orderData.fullname,
      address: orderData.address,
      phone: orderData.phone,
      total: orderData.total,
      userName: orderData.userName,
      userEmail: orderData.userEmail,
      cart: orderData.cart  // 🔥 THIS LINE
    });

    console.log("Order saved ✅");
  } catch (e) {
    console.log("Firestore error:", e);
  }
};