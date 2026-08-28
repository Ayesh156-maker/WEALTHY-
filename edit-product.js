import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
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
const db = getFirestore(app);

const productId =
  localStorage.getItem(
    "editProductId"
  );

async function loadProduct() {

  if (!productId) {
    showToast("Product not found");
    return;
  }

  const productRef =
    doc(
      db,
      "products",
      productId
    );

  const snap =
    await getDoc(productRef);

  if (!snap.exists()) {
    showToast("Product not found");
    return;
  }

  const p = snap.data();

document.getElementById("brand").value =
  p.brand || "";

document.getElementById("price").value =
  p.price || "";

document.getElementById("image").value =
  p.image || "";

document.getElementById("description").value =
  p.description || "";

/* PRODUCT VIEW */
document.getElementById(
  "previewImage"
).src =
  p.image || "";
  document
.getElementById("image")
.addEventListener("input",(e)=>{

  document.getElementById(
    "previewImage"
  ).src =
    e.target.value;

});
}
loadProduct();

document
.getElementById("editForm")
.addEventListener(
  "submit",
  async (e)=>{

    e.preventDefault();

    await updateDoc(
      doc(
        db,
        "products",
        productId
      ),
      {
        brand:
          document.getElementById(
            "brand"
          ).value,

        price:
          Number(
            document.getElementById(
              "price"
            ).value
          ),

        image:
          document.getElementById(
            "image"
          ).value,

        description:
          document.getElementById(
            "description"
          ).value
      }
    );

    showToast(
      "Product Updated Successfully"
    );

    window.location.href =
      "products.html";

  }
);