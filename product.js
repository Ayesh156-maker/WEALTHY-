import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  startAt,
  endAt,
  limit
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
let currentProduct = null;

document.addEventListener("DOMContentLoaded", () => {
  if (productId) {
    loadProduct();
  } else {
    document.body.innerHTML = "<h1 style='color:white;text-align:center;margin-top:50px;'>Product ID Missing</h1>";
  }
  
  updateCartCount();
  renderCart();
  
  document.getElementById("addCartBtn")?.addEventListener("click", addToCart);
  document.getElementById("buyNowBtn")?.addEventListener("click", buyNow);
  document.getElementById("submitReview")?.addEventListener("click", submitReview);
  document.getElementById("searchInput")
.addEventListener("input", searchProducts);

document.getElementById("searchBtn")
.addEventListener("click", () => {

    const value =
    document.getElementById("searchInput").value;

    if(value.trim()!=""){
        searchProducts();
    }

});
});

async function loadProduct() {
  try {
    const snap = await getDoc(doc(db, "products", productId));

    if (!snap.exists()) {
      document.body.innerHTML = "<h1 style='color:white;text-align:center;margin-top:50px;'>Product Not Found</h1>";
      return;
    }

    const p = snap.data();
    currentProduct = { id: productId, ...p, sellerEmail: p.email };

    // Update Elements
    document.getElementById("productTitle").textContent = p.brand || p.title || "Unnamed Product";
    document.getElementById("productPrice").textContent = `Rs ${(p.price || 0).toLocaleString()}`;
    document.getElementById("productCategory").textContent =
    p.category || "Uncategorized";
    document.getElementById("productDescription").textContent = p.description || "No description available for this item.";
    
    const img = document.getElementById("productImage");
    img.src = p.imageUrl || "https://via.placeholder.com/500x400?text=No+Image";
    img.onerror = () => { img.src = "https://via.placeholder.com/500x400?text=Image+Error"; };

    // Fetch Seller Data
    if (p.sellerId) {
      const storeSnap = await getDoc(doc(db, "stores", p.sellerId));
      if (storeSnap.exists()) {
        const store = storeSnap.data();
        document.getElementById("sellerNameTop").textContent = store.ownerName || "Official Store";
        document.getElementById("sellerNameCard").textContent = store.storeName || store.ownerName || "Official Store";
        document.getElementById("sellerLogo").src = store.logo || "https://via.placeholder.com/80";
      }
    }

    await loadReviews();
    await loadRelatedProducts(p.category);

  } catch (err) {
    console.error("Error loading product:", err);
  }
}

async function loadReviews() {
  const reviewsContainer = document.getElementById("reviewsContainer");
  const q = query(collection(db, "reviews"), where("productId", "==", productId));

  try {
    const snap = await getDocs(q);

    if (snap.empty) {
      document.getElementById("reviewCount").textContent = "0 Reviews";
      document.getElementById("averageRating").textContent = "0.0 ⭐";
      reviewsContainer.innerHTML = "<p style='color:var(--text-muted);'>No reviews yet for this product.</p>";
      return;
    }

    let total = 0;
    let html = "";

    snap.forEach(docSnap => {
      const review = docSnap.data();
      total += Number(review.rating || 0);

      html += `
        <div class="review-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>${review.userEmail || 'Verified Customer'}</strong>
            <span style="color: gold;">${"⭐".repeat(review.rating || 0)}</span>
          </div>
          <p style="margin-top:8px;">${review.comment}</p>
        </div>
      `;
    });

    const average = (total / snap.size).toFixed(1);
    document.getElementById("reviewCount").textContent = `${snap.size} Reviews`;
    document.getElementById("averageRating").textContent = `${average} ⭐`;
    reviewsContainer.innerHTML = html;

  } catch (err) {
    console.error("Error loading reviews:", err);
  }
}

async function submitReview() {
  const user = auth.currentUser;
  if (!user) {
    showToast("Please log in to submit a review.");
    return;
  }

  const rating = Number(document.getElementById("reviewRating").value);
  const comment = document.getElementById("reviewComment").value.trim();

  if (!comment) {
    showToast("Please write a comment.");
    return;
  }

  try {
   await addDoc(collection(db, "reviews"), {
  productId,
  userId: user.uid,
  userEmail: user.email || "Unknown User",
  rating,
  comment,
  createdAt: serverTimestamp()
});

    document.getElementById("reviewComment").value = "";
    await loadReviews();
  } catch (err) {
    console.error("Review submission error:", err);
    showToast("Failed to submit review.");
  }
}

window.changeQty = function(change) {
  const qtyInput = document.getElementById("qtyInput");
  let qty = Number(qtyInput.value) + change;
  if (qty < 1) qty = 1;
  qtyInput.value = qty;
};

function addToCart() {
  if (!currentProduct) return;

  const qty = Number(document.getElementById("qtyInput").value);
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const existing = cart.find(item => item.id === currentProduct.id);

  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      id: currentProduct.id,
      name: currentProduct.brand || currentProduct.title,
      price: Number(currentProduct.price || 0),
      image: currentProduct.imageUrl,
      quantity: qty,
      sellerEmail: currentProduct.sellerEmail
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
  toggleCart();
}

function buyNow() {
  addToCart();
  window.location.href = "checkout.html";
}

function toggleCart() {
  document.getElementById("cartPopup").classList.toggle("active");
}

function renderCart() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const container = document.getElementById("cartPopupItems");
  const totalEl = document.getElementById("cartPopupTotal");

  container.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    container.innerHTML = "<p style='color:var(--text-muted); margin-top:20px;'>Cart is currently empty.</p>";
    totalEl.innerText = "0";
    return;
  }

  cart.forEach((item, index) => {
    total += item.price * item.quantity;
    container.innerHTML += `
<div class="cart-item">

    <img src="${item.image}">

    <div class="cart-info">

        <h4>${item.name}</h4>

        <div class="cart-price">
            Rs ${item.price.toLocaleString()}
        </div>

        <small>
            Qty : ${item.quantity}
        </small>

    </div>

    <button
        class="remove-btn"
        onclick="removeItem(${index})">

        Delete

    </button>

</div>
`;
  });

  totalEl.innerText = total.toLocaleString();
}

window.removeItem = function(index) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
  updateCartCount();
};

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const count = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  document.getElementById("cartCount").innerText = count;
}

window.openSellerPage = function() {
  if (currentProduct?.sellerId) {
    window.location.href = `seller2.html?id=${currentProduct.sellerId}`;
  } else {
    showToast("Seller details not available.");
  }
};

window.toggleCart = toggleCart;

async function loadRelatedProducts(category) {

  if (!category) return;

  const container = document.getElementById("relatedProducts");

  try {

    const q = query(
      collection(db, "products"),
      where("category", "==", category)
    );

    const snap = await getDocs(q);

    container.innerHTML = "";

    if (snap.empty) {
      container.innerHTML = "<p>No related products.</p>";
      return;
    }

    snap.forEach(docSnap => {

      // Current product එක skip කරනවා
      if (docSnap.id === productId) return;

      const p = docSnap.data();

      container.innerHTML += `
        <div class="related-card"
             onclick="window.location.href='product.html?id=${docSnap.id}'">

          <img src="${p.imageUrl || 'https://via.placeholder.com/250'}">

          <h3>${p.brand || p.title || "Product"}</h3>

          <p>Rs ${(p.price || 0).toLocaleString()}</p>

        </div>
      `;

    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load related products.</p>";
  }

}
async function searchProducts(){

    const keyword =
    document.getElementById("searchInput")
    .value.trim();

    const results =
    document.getElementById("searchResults");

    if(keyword===""){
        results.innerHTML="";
        return;
    }

    const q = query(
        collection(db,"products"),
        orderBy("brand"),
        startAt(keyword),
        endAt(keyword + "\uf8ff"),
        limit(8)
    );

    const snap = await getDocs(q);

    results.innerHTML="";

    if(snap.empty){

        results.innerHTML=
        "<div class='search-item'>No Products</div>";

        return;
    }

    snap.forEach(docSnap=>{

        const p=docSnap.data();

        results.innerHTML +=`

        <div class="search-item"
        onclick="window.location='product.html?id=${docSnap.id}'">

            <img src="${p.imageUrl}">

            <div>

                <strong>${p.brand}</strong>

                <br>

                Rs ${Number(p.price).toLocaleString()}

            </div>

        </div>

        `;

    });

}
function loadUserProfile(){

    const img =
        document.getElementById("profileImage");


    if(!img){
        return;
    }


    onAuthStateChanged(auth,(user)=>{


        if(user){

            img.src =
                user.photoURL ||
                "profile.png";

        }
        else{

            img.src =
                "profile.png";

        }


    });

}


loadUserProfile();