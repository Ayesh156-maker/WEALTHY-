import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
}
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
}
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",
  authDomain: "mylamborghini.firebaseapp.com",
  projectId: "mylamborghini",
  storageBucket: "mylamborghini.firebasestorage.app",
  messagingSenderId: "817085836076",
  appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const provider =
  new GoogleAuthProvider();

window.googleLogin =
async () => {

  try {

    await signInWithPopup(
      auth,
      provider
    );

  } catch(err){

    showToast(err.message);

  }

};

window.logout =
async () => {

  await signOut(auth);

};

onAuthStateChanged(
  auth,
  async (user)=>{

    const loginBtn =
      document.getElementById(
        "loginBtn"
      );

    const profileBox =
      document.getElementById(
        "profileBox"
      );

    if(user){

      localStorage.setItem(
        "sellerEmail",
        user.email
          .toLowerCase()
          .trim()
      );

      loginBtn.style.display =
        "none";

      profileBox.style.display =
        "flex";

      document.getElementById(
        "userName"
      ).innerText =
        user.displayName;

      document.getElementById(
        "userEmail"
      ).innerText =
        user.email;

      document.getElementById(
        "userPhoto"
      ).src =
        user.photoURL;

      loadProducts();

    } else {

      loginBtn.style.display =
        "block";

      profileBox.style.display =
        "none";

    }

  }
);
function loadStoreUI(uid) {
  onSnapshot(doc(db, "stores", uid), (snap) => {
    if (!snap.exists()) return;

    const store = snap.data();

    const banner = document.getElementById("dashboardBanner");
    const logo = document.getElementById("userPhoto");
    const name = document.getElementById("dashboardStoreName");

    if (banner) banner.src = store.banner || "";
    if (logo) logo.src = store.logo || "";
    if (name) name.innerText = store.name || "My Store";
  });
}
async function loadProducts(){

  const sellerEmail =
    localStorage.getItem(
      "sellerEmail"
    );

  if(!sellerEmail){

    document.getElementById(
      "productsGrid"
    ).innerHTML =
    "<h3>Please login first</h3>";

    return;
  }

  const q = query(
    collection(db,"products"),
    where(
      "email",
      "==",
      sellerEmail
    )
  );

  const snap =
    await getDocs(q);

  let html = "";

  snap.forEach((docSnap)=>{

    const p =
      docSnap.data();

    html += `

      <div class="product-card">

        <img src="${p.image}" alt="">

        <h3>${p.brand}</h3>

        <p>
          Rs ${p.price}
        </p>

        <div class="actions">

          <button
            onclick="goEditProduct('${docSnap.id}')">
            Edit
          </button>

          <button
            onclick="deleteProduct('${docSnap.id}')">
            Delete
          </button>

        </div>

      </div>

    `;
  });

  if(html === ""){

    html =
      "<h2>No Products Found</h2>";

  }

  document.getElementById(
    "productsGrid"
  ).innerHTML =
    html;
}

window.goEditProduct =
(id)=>{

  localStorage.setItem(
    "editProductId",
    id
  );

  window.location.href =
    "edit-product.html";
};

window.deleteProduct =
async (id)=>{

  const ok =
    confirm(
      "Delete Product?"
    );

  if(!ok) return;

  await deleteDoc(
    doc(
      db,
      "products",
      id
    )
  );

  loadProducts();
};