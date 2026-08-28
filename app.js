import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    setDoc,
    deleteDoc,
    serverTimestamp,
    increment
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import {
  getDatabase
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";
import {setupPresence} from "./presence.js";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",
  authDomain: "mylamborghini.firebaseapp.com",
  projectId: "mylamborghini",
  storageBucket: "mylamborghini.firebasestorage.app",
  messagingSenderId: "817085836076",
  appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89",
  measurementId: "G-RY79N9C9R1"
};

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const messaging = getMessaging(app);
const realtimeDB = getDatabase(app);


window.auth = auth;
// ================= USER ONLINE STATUS =================

async function updateUserStatus(user,status){

 await setDoc(
  doc(db,"users",user.uid),
  {
    email:user.email,
    name:user.displayName || "User",
    photo:user.photoURL || "",
    online:status,
    lastSeen:serverTimestamp()
  },
  {
    merge:true
  }
 );

}
let allProducts = [];
let recentSearches =
JSON.parse(localStorage.getItem("recentSearches") || "[]");
// ================= CART =================
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
window.cart = cart;

// ================= SECURITY =================
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("dragstart", (e) => e.preventDefault());

// ================= MODALS =================
window.openModal = (id) => document.getElementById(id).style.display = "block";
window.closeModal = (id) => document.getElementById(id).style.display = "none";
window.openCheckout = () => document.getElementById("checkoutModal").style.display = "block";
window.closeCheckout = () => document.getElementById("checkoutModal").style.display = "none";

// ================= CART PANEL =================
window.toggleCart = () => document.getElementById("cartPanel").classList.toggle("active");
window.closeCart = () => document.getElementById("cartPanel").classList.remove("active");

// ================= ADD TO CART =================
// Only called for digital products — routes to checkout.html
window.addToCart = async (
    name,
    price,
    sellerEmail,
    productId,
    category,
    downloadUrl,
    image
) => {

    if (!productId) {
        console.error("Product ID missing");
        return;
    }

    // ================= NORMALIZE DATA =================

    const cleanCategory =
        String(category || "")
            .trim()
            .toLowerCase();

    const cleanDownloadUrl =
        downloadUrl || "";

    // ================= CHECK EXISTING =================

    const existing = cart.find(
        item => item.id === productId
    );

    // ================= ADD / UPDATE =================

    if (existing) {

        existing.quantity =
            (existing.quantity || 1) + 1;

        // Update these too
        existing.category =
            cleanCategory;

        existing.downloadUrl =
            cleanDownloadUrl;

        existing.image =
            image || existing.image;

    } else {

        cart.push({

            id: productId,

            name: name || "",

            price: Number(price) || 0,

             imageUrl: image || "",

            category: cleanCategory,

            downloadUrl: cleanDownloadUrl,

            sellerEmail: sellerEmail || "",

            quantity: 1

        });

    }

    // ================= SAVE =================
// ================= UPDATE PRODUCT POPULARITY =================

const productRef = doc(db,"products",productId);

await setDoc(productRef,{
    cartCount: increment(1)
},{
    merge:true
});
    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    // ================= DEBUG =================

    console.log("========== ADDED TO CART ==========");

    console.log("ID:", productId);

    console.log("NAME:", name);

    console.log("CATEGORY:", cleanCategory);

    console.log("DOWNLOAD URL:", cleanDownloadUrl);

    console.log("FULL CART:", cart);

    console.log("===================================");
showCartNotification(name);
    // ================= UPDATE CART UI =================

    updateCart();

};
// ================= WISHLIST =================

let wishlistIds = new Set();


// Load user's wishlist
async function loadWishlist() {

    const user = auth.currentUser;

    if (!user) {
        wishlistIds = new Set();
        updateWishlistButtons();
        return;
    }

    try {

        const wishlistRef = collection(
            db,
            "users",
            user.uid,
            "wishlist"
        );

        const snapshot = await getDocs(wishlistRef);

        wishlistIds = new Set();

        snapshot.forEach((docSnap) => {
            wishlistIds.add(docSnap.id);
        });

        updateWishlistButtons();

    } catch (error) {

        console.error(
            "Wishlist loading error:",
            error
        );

    }
}


// Add / Remove Wishlist
window.toggleWishlist = async function(productId) {

    const user = auth.currentUser;

    if (!user) {

        showToast("Please login to use Wishlist.");
        return;

    }

    if (!productId) return;

    const wishlistRef = doc(
        db,
        "users",
        user.uid,
        "wishlist",
        productId
    );

    try {

        if (wishlistIds.has(productId)) {

            // REMOVE
            await deleteDoc(wishlistRef);

            wishlistIds.delete(productId);

        } else {

            // ADD
            const product = allProducts.find(
                p => p.id === productId
            );

            if (!product) {

                showToast("Product not found.");
                return;

            }

            await setDoc(wishlistRef, {

                productId: product.id,

                name: product.brand || "Product",

                image: product.image || "",

                price: Number(product.price || 0),

                category: product.category || "",

                sellerEmail: product.sellerEmail || "",

                addedAt: serverTimestamp()

            });

            wishlistIds.add(productId);

        }

        updateWishlistButtons();

    } catch (error) {

        console.error(
            "Wishlist error:",
            error
        );

        showToast(
            "Unable to update Wishlist."
        );

    }

};


// Update all heart buttons
function updateWishlistButtons() {

    document
        .querySelectorAll(".wishlist-btn")
        .forEach(button => {

            const productId =
                button.dataset.productId;

            if (wishlistIds.has(productId)) {

                button.innerHTML = "❤️";
                button.classList.add("active");

            } else {

                button.innerHTML = "🤍";
                button.classList.remove("active");

            }

        });

}
window.removeFromCart = (index) => {
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
};

function updateCart() {
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartItems) return;

  let total = 0;
  cartItems.innerHTML = "";

  cart.forEach((item, i) => {
    total += item.price * (item.quantity || 1);
    cartItems.innerHTML += `
      <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0;padding:8px;background:rgba(255,255,255,0.05);border-radius:6px;">
        <div>
         <b>${item.name}</b><br>
Qty: ${item.quantity || 1}<br>
<span style="color:#fa6338;">
Rs ${item.price * (item.quantity || 1)}
</span>
        </div>
        <button onclick="removeFromCart(${i})" style="background:red;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;">Remove</button>
      </div>
    `;
  });

  if (cartCount) cartCount.innerText = cart.length;
  if (cartTotal) cartTotal.innerText = total;
}

window.updateCart = updateCart;

// ================= CHECKOUT PAGE REDIRECT =================
window.goCheckoutPage = () => {
  if (cart.length === 0) {
    showToast("Your cart is empty!");
    return;
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  window.location.href = "checkout.html";
};

// ================= CONTACT SELLER (non-digital → chat.html) =================
window.contactSeller = async (sellerEmail, productId) => {
showLoading();
  if (!auth.currentUser) {
    showToast("Please login first");
    return;
  }

  const buyer = auth.currentUser;

  // Product එක හොයනවා
  const product = allProducts.find(p => p.id === productId);

  if (!product) {
    showToast("Product not found");
    return;
  }

  const buyerEmail = buyer.email;
  const chatId = `${productId}_${buyerEmail}_${sellerEmail}`;
console.log(product);
  await setDoc(
    doc(db, "chats", chatId),
    {

      // Buyer
      buyerEmail: buyer.email,
      buyerName: buyer.displayName || "",
      buyerPhoto: buyer.photoURL || "",

      // Seller
      sellerEmail: sellerEmail,
      sellerName: product.storeName || product.sellerName || "",
      sellerPhoto: product.storeLogo || product.sellerPhoto || "",
      sellerId: product.sellerId || "",

      // Product
      productId: product.id,
      productName: product.brand,
      productImage: product.imageUrl || "",
      price: Number(product.price),

      // Chat
      lastMessage: "",
      unreadBuyer: 0,
      unreadSeller: 0,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()

    },
    { merge: true }
  );

  localStorage.setItem("chatId", chatId);

setTimeout(()=>{

    window.location.href="chat.html";

},1200);

};
// ================= RENDER PRODUCTS =================
// ================= RENDER PRODUCTS =================
const digitalCategories = [
    "digital-art",
    "ai-art",
    "digital-paintings",
    "digital-illustrations",
    "digital-drawings",
    "3d-art",
    "printable-art",
    "illustrations",
    "character-art",
    "cartoon",
    "anime",
    "fantasy",
    "vector-art",
    "line-art",
    "typography",
    "quotes",
    "motivational-typography",
    "minimal-typography",
    "luxury-typography",
    "modern-typography",
    "inspirational-typography",
    "abstract-art",
    "geometric",
    "minimal-abstract",
    "color-art",
    "modern-abstract",
    "surreal-art"
];
function renderProducts(list) {

    const productsGrid =
        document.getElementById("productsGrid");

    if (!productsGrid) return;

    productsGrid.innerHTML = "";

    list.forEach((p) => {
      console.log("CATEGORY =", p.category);
console.log("PRODUCT =", p);

        let actionButton = "";

        if (isDigitalProduct(p)) {

            actionButton = `
                <button
                    class="cart-btn"
                    onclick='
                        event.stopPropagation();

                        addToCart(
                            ${JSON.stringify(p.brand)},
                            ${Number(p.price)},
                            ${JSON.stringify(p.sellerEmail || p.email || "")},
                            ${JSON.stringify(p.id)},
                            ${JSON.stringify(p.categoryType)},
                            ${JSON.stringify(p.downloadUrl || "")},
                            ${JSON.stringify(p.imageUrl || p.image || p.originalImage || "")}
                        )
                    '
                >
                    🛒 Add to Cart
                </button>
            `;

        } else {

            actionButton = `
                <button
                    class="seller-btn"
                    onclick='
                        event.stopPropagation();

                        contactSeller(
 ${JSON.stringify(p.sellerEmail || "")},
 ${JSON.stringify(p.id)}
)
                    '
                >
                    💬 Contact Seller
                </button>
            `;

        }


        // ================= WISHLIST BUTTON =================

        const isWishlisted =
            wishlistIds.has(p.id);

        const wishlistIcon =
            isWishlisted ? "❤️" : "🤍";


        productsGrid.innerHTML += `

            <div
                class="product-card glass"
              onclick="${
    isDigitalProduct(p)
    ? `openProductPage('${p.id}')`
    : `openContactSellerPage('${p.id}')`
}"
            >

                <div class="product-image">

                   <img
    src="${p.imageUrl || p.image || p.originalImage || ""}"
    onerror="
        this.onerror=null;
        this.src='https://via.placeholder.com/300x200?text=No+Image';
    "
    alt="${p.brand || p.name || "Product"}"
>

                    <!-- WISHLIST -->

                    <button
                        class="wishlist-btn ${
                            isWishlisted ? "active" : ""
                        }"
                        data-product-id="${p.id}"
                        onclick="
                            event.stopPropagation();
                            toggleWishlist('${p.id}');
                        "
                        title="Add to Wishlist"
                    >
                        ${wishlistIcon}
                    </button>

                </div>


                <div class="product-info">

                    <h2>
                        ${p.brand || "Product"}
                    </h2>

                    <p>
                        ${p.description || ""}
                    </p>

                    <div class="price-row">

                        <span class="price">
                            Rs ${p.price || 0}
                        </span>

                    </div>

                    ${actionButton}

                </div>

            </div>

        `;

    });

}
// ================= OPEN PRODUCT PAGE =================
window.openProductPage = (productId) => {
  window.location.href = `product.html?id=${productId}`;
};
// ================= OPEN CONTACT SELLER PAGE =================

window.openContactSellerPage = (productId) => {

    if (!productId) {
        console.error("Product ID missing");
        return;
    }

    window.location.href =
        `contact-seller.html?id=${encodeURIComponent(productId)}`;

};

function smartMatch(product, keyword){

    keyword = keyword.toLowerCase().trim();

    const text = [
        product.brand,
        product.description,
        product.tags,
        product.category,
        product.email,
        product.storeName
    ]
    .join(" ")
    .toLowerCase();

    // Exact Match
    if(text.includes(keyword)) return true;

    // Remove Spaces
    if(text.replace(/\s/g,"").includes(keyword.replace(/\s/g,"")))
        return true;

    // Word Match
    const words = text.split(" ");

    return words.some(word=>word.startsWith(keyword));
}
function getSearchScore(product, keyword){ 

    keyword = keyword.toLowerCase().trim(); 

    let score = 0; 

    const brand = (product.brand || "").toLowerCase();
    const description = (product.description || "").toLowerCase();
    const tags = (product.tags || "").toLowerCase();
    const category = (product.category || "").toLowerCase();
    const seller = (product.storeName || product.sellerName || "").toLowerCase();


    if(brand === keyword) score += 100;
    if(brand.startsWith(keyword)) score += 70;
    if(brand.includes(keyword)) score += 50;

    if(tags.includes(keyword)) score += 35;
    if(category.includes(keyword)) score += 30;
    if(seller.includes(keyword)) score += 25;
    if(description.includes(keyword)) score += 15;


    // ⭐ CART POPULARITY BOOST
    const cartCount = Number(product.cartCount || 0);

    score += cartCount * 10;


    return score; 
}
// ================= FILTER / SEARCH =================
window.filterProducts = () => {

    const searchValue =
        (document.getElementById("searchInput")?.value || "")
        .toLowerCase()
        .trim();


    // NEW CATEGORY DROPDOWN VALUE
    const categoryValue =
        String(window.selectedCategory || "")
        .toLowerCase()
        .trim();


    const filtered = allProducts.filter(product => {

        const productCategory =
            String(product.category || "")
            .toLowerCase()
            .trim();


        // =========================
        // SEARCH MATCH
        // =========================

        const matchesSearch =
            searchValue === "" ||
            smartMatch(product, searchValue);


        // =========================
        // CATEGORY MATCH
        // =========================

     // =========================
// CATEGORY MATCH
// =========================

// =========================
// CATEGORY MATCH
// =========================

let matchesCategory = true;

if (categoryValue !== "") {

    const productCategory = String(product.category || "")
        .trim()
        .toLowerCase();

    const selectedCategory = String(window.selectedCategory || "")
        .trim()
        .toLowerCase();

    // ==========================================
    // DIGITAL ART MAIN CATEGORY
    // ==========================================

    if (selectedCategory === "digital-art") {

        const digitalArtCategories = [

            "digital art",
            "ai art",
            "digital paintings",
            "digital illustrations",
            "digital drawings",
            "digital sketches",
            "3d digital art",
            "digital concept art",
            "digital character art",
            "digital fantasy art",
            "digital surreal art"

        ];

        matchesCategory =
            digitalArtCategories.includes(productCategory);

    }

    // ==========================================
    // OTHER MAIN CATEGORY
    // ==========================================

    else {

        // Convert selected ID to readable category
        const selectedMain =
            Object.values(CATEGORY_DATA).find(
                category => category.id === selectedCategory
            );

        if (selectedMain) {

            // Main category itself
            const mainName =
                Object.keys(CATEGORY_DATA).find(
                    key =>
                        CATEGORY_DATA[key].id === selectedCategory
                );

            const cleanMainName =
                String(mainName || "")
                    .replace(/^[^\w]+/g, "")
                    .trim()
                    .toLowerCase();

            // Check main category
            if (productCategory === cleanMainName) {

                matchesCategory = true;

            } else {

                // Check sub categories
                matchesCategory =
                    selectedMain.children.some(
                        ([icon, name, id]) => {

                            return (
                                id.toLowerCase() === productCategory ||
                                name.toLowerCase() === productCategory
                            );

                        }
                    );

            }

        }

        // ==========================================
        // SUB CATEGORY
        // ==========================================

        else {

            const selectedSub =
                Object.values(CATEGORY_DATA)
                    .flatMap(category => category.children)
                    .find(
                        ([icon, name, id]) =>
                            id.toLowerCase() === selectedCategory
                    );

            if (selectedSub) {

                const [icon, name, id] = selectedSub;

                matchesCategory =
                    productCategory === name.toLowerCase() ||
                    productCategory === id.toLowerCase();

            } else {

                matchesCategory =
                    productCategory === selectedCategory;

            }

        }

    }

}
        // =========================
        // FINAL MATCH
        // =========================

        return (
            matchesSearch &&
            matchesCategory
        );

    });


    // =========================
    // RENDER
    // =========================

    renderProducts(filtered);

};

// ================= LOAD PRODUCTS =================
async function loadProducts() {
    try {

        const snapshot = await getDocs(
            collection(db, "products")
        );

        allProducts = [];

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            const imageUrl =
                data.imageUrl ||
                data.image ||
                data.originalImage ||
                data.productImage ||
                data.photoURL ||
                "";

            allProducts.push({

                id: docSnap.id,

                ...data,

                // ⭐ MAIN PRODUCT IMAGE
                imageUrl: imageUrl,

                category:
                    String(data.category || "")
                        .trim()
                        .toLowerCase()

            });

        });

        if (auth.currentUser) {
            await loadWishlist();
        }

        renderProducts(allProducts);

    } catch (err) {

        console.error(
            "loadProducts error:",
            err
        );

    }
}
loadProducts();
window.goOrders = () => {
    window.location.href = "orders-buyer.html";
};

// ================= AUTH STATE (single listener) =================
// ================= AUTH STATE =================


// ================= LOGIN =================
window.googleLogin = () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      localStorage.setItem("sellerEmail", user.email);
      initNotifications();
    })
    .catch((err) => console.error("Login error:", err));
};

// ================= LOGOUT =================
window.logout = async () => {

  const user = auth.currentUser;

  if(user){

    await updateUserStatus(user,false);

  }


  await signOut(auth);


  localStorage.removeItem("sellerEmail");
  localStorage.removeItem("role");
  localStorage.removeItem("cart");

  location.reload();

};

// ================= PROFILE MENU =================
window.toggleProfileMenu = () => {
  document.getElementById("profileMenu")?.classList.toggle("active");
};

window.addEventListener("click", (e) => {
  const profile = document.getElementById("userProfile");
  const menu = document.getElementById("profileMenu");
  if (profile && menu && !profile.contains(e.target)) {
    menu.classList.remove("active");
  }
});

// ================= SELLER / DASHBOARD =================
window.goSellerPage = () => window.location.href = "seller.html";
window.goDashboard = () => window.location.href = "dashboard.html";

const role = localStorage.getItem("role");
const sellerBtn = document.getElementById("becomeSellerBtn");
if (sellerBtn && role === "seller") sellerBtn.style.display = "none";

// ================= ORDERS (admin) =================
window.loadOrders = async function () {
  const snap = await getDocs(collection(db, "orders"));
  let html = "<h3>Orders</h3>";

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    let cartHTML = "";

    if (data.cart && data.cart.length > 0) {
      data.cart.forEach(item => {
        cartHTML += `
          <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
            <span>${item.name}</span>
            <span>Rs ${item.price}</span>
          </div>
        `;
      });
    } else {
      cartHTML = "<i>No items</i>";
    }

    html += `
      <div class="glass" style="margin:15px;padding:15px;">
        <p><b>Name:</b> ${data.fullname}</p>
        <p><b>Phone:</b> ${data.phone}</p>
        <p><b>Address:</b> ${data.address}</p>
        <p><b>Total:</b> Rs ${data.total}</p>
        <p><b>User:</b> ${data.userName} (${data.userEmail})</p>
        <p><b>Postal:</b> ${data.postal || "-"}</p>
        <h4 style="margin-top:10px;">🛒 Cart Items</h4>
        <div style="margin-top:5px;">${cartHTML}</div>
      </div>
    `;
  });

  document.getElementById("output").innerHTML = html;
};

// ================= IMAGE ZOOM =================
window.zoomImage = (imgSrc) => {
  document.getElementById("zoomModal").style.display = "flex";
  document.getElementById("zoomedImage").src = imgSrc;
};

window.closeZoom = () => {
  document.getElementById("zoomModal").style.display = "none";
};

// ================= NOTIFICATIONS =================
async function initNotifications() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: "BOcBTLUBRWuVC-1LCMFEr3zzZnHpcH8K0bpNTLsgFT9c_K-fdo83885lB1j3j74I775XHJhJsm1daerNcwIDmcA",
      serviceWorkerRegistration: registration
    });

    await addDoc(collection(db, "fcmTokens"), {
      token,
      email: auth.currentUser?.email
    });
  } catch (err) {
    console.error("initNotifications error:", err);
  }
}

onMessage(messaging, (payload) => {
  showToast(payload.notification.title + "\n" + payload.notification.body);
});

// ================= SERVICE WORKER =================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/firebase-messaging-sw.js")
    .then(() => console.log("SW registered"))
    .catch(err => console.error("SW error:", err));
}

// ================= DOM READY =================
document.addEventListener("DOMContentLoaded", () => {
buildCategoryDropdown();

window.selectedCategory = "";

updateCart();


if (
    localStorage.getItem("openCart") === "true"
) {

    document
        .getElementById("cartPanel")
        ?.classList.add("active");

    localStorage.removeItem("openCart");

}

updateSuggestions();
  updateCart();

  const latestCart =
    JSON.parse(localStorage.getItem("cart") || "[]");

  cart = latestCart;

  updateCart();

  if(localStorage.getItem("openCart") === "true"){

    document
      .getElementById("cartPanel")
      ?.classList.add("active");

    localStorage.removeItem("openCart");
  }
  updateSuggestions();

});
// Disable common DevTools shortcuts

document.addEventListener("copy",(e)=>{

    e.preventDefault();

});
document.addEventListener("cut",(e)=>{

    e.preventDefault();

});
document.addEventListener("paste",(e)=>{

    e.preventDefault();

});
document.addEventListener("keyup",(e)=>{

    if(e.key==="PrintScreen"){

        navigator.clipboard.writeText("");

        showToast("Screenshot disabled");

    }

});
window.addEventListener("storage",(e)=>{

    if(e.key==="websiteOpen"){

        showToast("Multiple Tabs Detected");

    }

});

localStorage.setItem("websiteOpen",Date.now());

if(window.top !== window.self){

    window.top.location = window.location;

}
let timer;

function resetTimer(){

    clearTimeout(timer);

    timer=setTimeout(()=>{

        logout();

    },15*60*1000);

}

document.onmousemove=resetTimer;
document.onkeydown=resetTimer;

resetTimer();

let loadingInterval;

function showLoading(){

    const overlay =
document.getElementById("loadingScreen");
    overlay.style.display="flex";

    const dots =
        document.getElementById("loadingDots");

    let count=1;

    loadingInterval=setInterval(()=>{

        count++;

        if(count>3) count=1;

        dots.textContent=".".repeat(count);

    },400);

}

function hideLoading(){

    clearInterval(loadingInterval);

    document.getElementById("loadingOverlay")
        .style.display="none";
}

// ================= SIDEBAR FUNCTIONS =================
window.toggleSidebar = () => {
  const sidebar = document.getElementById("sideBar");
  const overlay = document.getElementById("sidebarOverlay");
  
  if (sidebar && overlay) {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  }
};

window.closeSidebar = () => {
  const sidebar = document.getElementById("sideBar");
  const overlay = document.getElementById("sidebarOverlay");

  if (sidebar && overlay) {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  }
};

// ================= AUTH STATE UPDATE =================
onAuthStateChanged(auth, async (user) => {
  const userProfile = document.getElementById("userProfile");
  const profilePhoto = document.getElementById("profilePhoto");
  const profileName = document.getElementById("profileName");
  const loginBtn = document.getElementById("loginBtn");

  // Sidebar Elements
  const sidebarProfilePhoto = document.getElementById("sidebarProfilePhoto");
  const sidebarUserName = document.getElementById("sidebarUserName");
  const sidebarUserEmail = document.getElementById("sidebarUserEmail");

  if (user) {
    await loadWishlist();
    // Navbar Profile Update
    if (loginBtn) loginBtn.parentElement.style.display = "none";
    if (profilePhoto) profilePhoto.src = user.photoURL || "assets/default-profile.png";
    if (profileName) profileName.textContent = user.displayName || "User";
    if (userProfile) userProfile.style.display = "flex";

    // Sidebar Profile Sync
    if (sidebarProfilePhoto) sidebarProfilePhoto.src = user.photoURL || "assets/default-profile.png";
    if (sidebarUserName) sidebarUserName.textContent = user.displayName || "User";
    if (sidebarUserEmail) sidebarUserEmail.textContent = user.email || "";

    localStorage.setItem("sellerEmail", user.email);
    await updateUserStatus(user, true);
  } else {
    // Logged Out State
    if (loginBtn) loginBtn.parentElement.style.display = "list-item";
    if (userProfile) userProfile.style.display = "none";

    if (sidebarProfilePhoto) sidebarProfilePhoto.src = "assets/default-profile.png";
    if (sidebarUserName) sidebarUserName.textContent = "Guest";
    if (sidebarUserEmail) sidebarUserEmail.textContent = "Not logged in";
  }
});
// ==========================================
// CART NOTIFICATION
// ==========================================

let cartNotificationTimer;

function showCartNotification(productName = "Item") {

    const notification = document.getElementById("cartNotification");
    const text = document.getElementById("cartNotificationText");

    if (!notification) return;

    text.textContent = `${productName} has been added to your cart.`;

    // Reset timer
    clearTimeout(cartNotificationTimer);

    // Show
    notification.classList.add("show");

    // Automatically hide after 3 seconds
    cartNotificationTimer = setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}


function closeCartNotification() {

    const notification = document.getElementById("cartNotification");

    if (notification) {
        notification.classList.remove("show");
    }

    clearTimeout(cartNotificationTimer);
}
// =====================================================
// PRODUCT TYPE & CATEGORY SYSTEM
// =====================================================

// DIGITAL PRODUCT CATEGORIES
const DIGITAL_CATEGORIES = [

    // Digital Art
    "digital-art",
    "ai-art",
    "digital-paintings",
    "digital-illustrations",
    "digital-drawings",
    "printable-art",

    // Illustrations
    "illustrations",
    "character-art",
    "cartoon",
    "anime",
    "fantasy",

    // Typography
    "typography",
    "vector-art",
    "line-art",
    "quotes",
    "motivational-typography",
    "minimal-typography",
    "luxury-typography",
    "modern-typography",
    "inspirational-typography",

    // Digital Posters
    "digital-posters",
    "digital-motivational-posters",
    "digital-movie-posters",
    "digital-celebrity-posters",
    "digital-sports-posters",
    "digital-music-posters",
    "digital-minimal-posters",

    // Photography
    "photography",
    "nature-photography",
    "landscape-photography",
    "wildlife-photography",
    "travel-photography",
    "architecture-photography",
    "portrait-photography",

    // Abstract
    "abstract-art",
    "geometric",
    "minimal-abstract",
    "color-art",
    "modern-abstract",
    "surreal-art",

    // 3D
    "3d-art"
];


// =====================================================
// CHECK WHETHER PRODUCT IS DIGITAL
// =====================================================

// =====================================================
// CHECK WHETHER PRODUCT IS DIGITAL
// =====================================================

function isDigitalProduct(product) {

    const type = String(product.categoryType || "")
        .toLowerCase()
        .trim();

    // Firebase categoryType එක තිබේ නම්
    if (type === "digital") {
        return true;
    }

    if (type === "non-digital") {
        return false;
    }

    // Firebase category
    const category = String(product.category || "")
        .toLowerCase()
        .trim();

    const digitalCategories = [

        // Main
        "digital art",
        "printable art",
        "illustrations",
        "typography",
        "posters",
        "photography",
        "3d art & models",
        "graphics & design",
        "templates",
        "fonts & typography",
        "crafts",
        "digital resources",

        // Digital Art
        "ai art",
        "digital paintings",
        "digital illustrations",
        "digital drawings",
        "digital sketches",
        "3d digital art",
        "digital concept art",
        "digital character art",
        "digital fantasy art",
        "digital surreal art",

        // Other digital
        "wall art",
        "printable wall art",
        "printable posters",
        "printable quotes",
        "character illustration",
        "cartoon illustration",
        "anime illustration",
        "fantasy illustration",
        "quotes",
        "motivational typography",
        "inspirational typography",
        "luxury typography",
        "minimal typography",
        "modern typography"

    ];

    return digitalCategories.includes(category);
}
function updateSuggestions(){

    const box =
    document.getElementById("searchSuggestions");

    if(!box) return;

    box.innerHTML="";

    recentSearches.forEach(item=>{

        const div =
        document.createElement("div");

        div.className="suggestion";

        div.textContent=item;

        div.onclick=()=>{

            document.getElementById("searchInput").value=item;

            filterProducts();

        };

        box.appendChild(div);

    });

}
window.toggleCategories = function(){

    const bar = document.getElementById("categoryBar");
    const btn = document.getElementById("categoryMoreBtn");


    bar.classList.toggle("show");


    if(bar.classList.contains("show")){

        btn.innerHTML="Hide Categories ↑";

    }else{

        btn.innerHTML="More Categories ↓";

    }

}
window.scrollCategories = function(amount){

    const box = document.getElementById("categoryScroll");

    box.scrollBy({

        left: amount,

        behavior:"smooth"

    });

}

// =====================================================
// LEANGELO CATEGORY SYSTEM
// =====================================================

const CATEGORY_DATA = {

    "🎨 Digital Art": {

        id: "digital-art",

        children: [

            ["🤖", "AI Art", "ai-art"],
            ["🖌️", "Digital Paintings", "digital-paintings"],
            ["✍️", "Digital Illustrations", "digital-illustrations"],
            ["✏️", "Digital Drawings", "digital-drawings"],
            ["📝", "Digital Sketches", "digital-sketches"],
            ["🧊", "3D Digital Art", "3d-digital-art"],
            ["💡", "Digital Concept Art", "digital-concept-art"],
            ["🦸", "Digital Character Art", "digital-character-art"],
            ["🐉", "Digital Fantasy Art", "digital-fantasy-art"],
            ["🌀", "Digital Surreal Art", "digital-surreal-art"]

        ]

    },


    "🖨️ Printable Art": {

        id: "printable-art",

        children: [

            ["🖼️", "Printable Wall Art", "printable-wall-art"],
            ["📜", "Printable Posters", "printable-posters"],
            ["💬", "Printable Quotes", "printable-quotes"],
            ["🧸", "Printable Nursery Art", "printable-nursery-art"],
            ["🔲", "Printable Minimal Art", "printable-minimal-art"],
            ["💎", "Printable Luxury Art", "printable-luxury-art"],
            ["🖋️", "Printable Line Art", "printable-line-art"],
            ["🎨", "Printable Abstract Art", "printable-abstract-art"]

        ]

    },


    "✏️ Illustrations": {

        id: "illustrations",

        children: [

            ["🧑", "Character Illustration", "character-illustration"],
            ["👾", "Cartoon Illustration", "cartoon-illustration"],
            ["🥷", "Anime Illustration", "anime-illustration"],
            ["🦄", "Fantasy Illustration", "fantasy-illustration"],
            ["🎈", "Children's Illustration", "childrens-illustration"],
            ["📰", "Editorial Illustration", "editorial-illustration"],
            ["👗", "Fashion Illustration", "fashion-illustration"],
            ["📖", "Book Illustration", "book-illustration"],
            ["📐", "Vector Illustration", "vector-illustration"],
            ["🖊️", "Line Art", "line-art"]

        ]

    },


    "🔤 Typography": {

        id: "typography",

        children: [

            ["💬", "Quotes", "quotes"],
            ["🔥", "Motivational Typography", "motivational-typography"],
            ["🌟", "Inspirational Typography", "inspirational-typography"],
            ["👑", "Luxury Typography", "luxury-typography"],
            ["▫️", "Minimal Typography", "minimal-typography"],
            ["⚡", "Modern Typography", "modern-typography"],
            ["🕌", "Arabic Typography", "arabic-typography"],
            ["✒️", "Calligraphy Typography", "calligraphy-typography"]

        ]

    },


    "🎬 Posters": {

        id: "posters",

        children: [

            ["🚀", "Motivational Posters", "motivational-posters"],
            ["🍿", "Movie Posters", "movie-posters"],
            ["🌟", "Celebrity Posters", "celebrity-posters"],
            ["⚽", "Sports Posters", "sports-posters"],
            ["🎵", "Music Posters", "music-posters"],
            ["🔳", "Minimal Posters", "minimal-posters"],
            ["✨", "Luxury Posters", "luxury-posters"],
            ["🎮", "Gaming Posters", "gaming-posters"]

        ]

    },


    "📷 Photography": {

        id: "photography",

        children: [

            ["👤", "Portraits", "portraits"],
            ["🏔️", "Landscapes", "landscapes"],
            ["🌿", "Nature", "nature"],
            ["🦁", "Wildlife", "wildlife"],
            ["✈️", "Travel", "travel"],
            ["🏛️", "Architecture", "architecture"],
            ["👠", "Fashion", "fashion-photo"],
            ["🏙️", "Street Photography", "street-photography"]

        ]

    },


    "🧊 3D Art & Models": {

        id: "3d-art-models",

        children: [

            ["📦", "3D Models", "3d-models"],
            ["🤖", "3D Characters", "3d-characters"],
            ["🏺", "3D Objects", "3d-objects"],
            ["🌐", "3D Environments", "3d-environments"],
            ["🛋️", "3D Interior Design", "3d-interior-design"],
            ["📱", "3D Product Design", "3d-product-design"],
            ["🏢", "3D Architecture", "3d-architecture"],
            ["🗿", "3D Sculptures", "3d-sculptures"]

        ]

    },


    "💻 Graphics & Design": {

        id: "graphics-design",

        children: [

            ["🔘", "Icons", "icons"],
            ["🏷️", "Logos", "logos"],
            ["📐", "Vector Graphics", "vector-graphics"],
            ["🏁", "Patterns", "patterns"],
            ["📜", "Textures", "textures"],
            ["🖌️", "Brushes", "brushes"],
            ["✂️", "Clipart", "clipart"],
            ["🧩", "Graphic Elements", "graphic-elements"],
            ["🖼️", "Backgrounds", "backgrounds"]

        ]

    },


    "📄 Templates": {

        id: "templates",

        children: [

            ["📱", "Social Media Templates", "social-media-templates"],
            ["🖼️", "Poster Templates", "poster-templates"],
            ["💼", "Business Templates", "business-templates"],
            ["📊", "Presentation Templates", "presentation-templates"],
            ["📑", "Resume Templates", "resume-templates"],
            ["✉️", "Invitation Templates", "invitation-templates"],
            ["🌐", "Website Templates", "website-templates"],
            ["🎨", "Canva Templates", "canva-templates"]

        ]

    },


    "🔤 Fonts & Typography": {

        id: "fonts-typography",

        children: [

            ["🔠", "Fonts", "fonts"],
            ["🖥️", "Display Fonts", "display-fonts"],
            ["✍️", "Handwritten Fonts", "handwritten-fonts"],
            ["💎", "Luxury Fonts", "luxury-fonts"],
            ["▫️", "Minimal Fonts", "minimal-fonts"],
            ["✒️", "Calligraphy Fonts", "calligraphy-fonts"],
            ["🕌", "Arabic Fonts", "arabic-fonts"]

        ]

    },


    "✂️ Crafts": {

        id: "crafts",

        children: [

            ["🏁", "Craft Patterns", "craft-patterns"],
            ["🧵", "Sewing Patterns", "sewing-patterns"],
            ["📐", "Craft Templates", "craft-templates"],
            ["⚡", "Laser Cut Files", "laser-cut-files"],
            ["🎨", "SVG Designs", "svg-designs"],
            ["🔪", "Cricut Designs", "cricut-designs"],
            ["🪡", "Embroidery Designs", "embroidery-designs"]

        ]

    },


    "📦 Digital Resources": {

        id: "resources",

        children: [

            ["🎛️", "Presets", "presets"],
            ["🎬", "LUTs", "luts"],
            ["📸", "Lightroom Presets", "lightroom-presets"],
            ["🪄", "Photoshop Actions", "photoshop-actions"],
            ["🖌️", "Brush Packs", "brush-packs"],
            ["📜", "Texture Packs", "texture-packs"],
            ["📊", "Stock Graphics", "stock-graphics"],
            ["🖼️", "Stock Images", "stock-images"]

        ]

    },


    "🖼️ Physical Art": {

        id: "physical-art",

        children: [

            ["🖼️", "Wall Art", "wall-art"],
            ["🎨", "Paintings", "paintings"],
            ["✏️", "Drawings", "drawings"],
            ["✒️", "Illustrations", "illustrations"],
            ["🗿", "Sculpture", "sculpture"],
            ["🖨️", "Prints", "prints"],
            ["🪵", "Wood Art", "wood-art"],
            ["⚙️", "Metal Art", "metal-art"],
            ["🏺", "Ceramic Art", "ceramic-art"],
            ["🍷", "Glass Art", "glass-art"],
            ["🧵", "Textile Art", "textile-art"],
            ["✒️", "Calligraphy", "calligraphy"],
            ["👤", "Portrait Art", "portrait-art"],
            ["🎁", "Custom Art", "custom-art"],
            ["🏺", "Decorative Art", "decorative-art"],
            ["🏆", "Art Collectibles", "art-collectibles"],
            ["🏛️", "Traditional Art", "traditional-art"]

        ]

    }

};

// =====================================================
// BUILD CATEGORY DROPDOWN
// =====================================================

function buildCategoryDropdown() {

    const container =
        document.getElementById("categoryOptions");

    if (!container) return;

    container.innerHTML = "";

    Object.entries(CATEGORY_DATA).forEach(
        ([mainName, data]) => {

            // MAIN CATEGORY
            const main = document.createElement("div");

            main.className =
                "category-option main-category";

            main.dataset.category = data.id;

            main.innerHTML = `
                <span>${mainName}</span>
            `;

            main.onclick = () => {

                selectCategoryFilter(
                    data.id,
                    mainName
                );

            };

            container.appendChild(main);


            // SUB CATEGORIES
            data.children.forEach(
                ([icon, name, id]) => {

                    const sub =
                        document.createElement("div");

                    sub.className =
                        "category-option sub-category";

                    sub.dataset.category = id;

                    sub.innerHTML = `
                        <span>${icon}</span>
                        <span>${name}</span>
                    `;

                    sub.onclick = () => {

                        selectCategoryFilter(
                            id,
                            `${icon} ${name}`
                        );

                    };

                    container.appendChild(sub);

                }
            );

        }
    );

}
// =====================================================
// CATEGORY DROPDOWN FUNCTIONS
// =====================================================

window.toggleCategoryDropdown = function() {

    const wrapper =
        document.querySelector(
            ".category-dropdown-wrapper"
        );

    const dropdown =
        document.getElementById(
            "categoryDropdown"
        );

    if (!wrapper || !dropdown) return;

    wrapper.classList.toggle("open");

    dropdown.classList.toggle("show");

};
window.selectCategoryFilter = function(
    category,
    label
) {

    // Save selected category
    window.selectedCategory = category;

    // Update button text
    const text =
        document.getElementById(
            "selectedCategoryText"
        );

    if (text) {

        text.textContent =
            label;

    }


    // Active state
    document
        .querySelectorAll(".category-option")
        .forEach(option => {

            option.classList.remove("active");

            if (
                option.dataset.category === category
            ) {

                option.classList.add("active");

            }

        });


    // Close dropdown
    document
        .getElementById("categoryDropdown")
        ?.classList.remove("show");

    document
        .querySelector(".category-dropdown-wrapper")
        ?.classList.remove("open");


    // Filter products
    filterProducts();

};
// =====================================================
// SEARCH CATEGORIES
// =====================================================

window.searchCategories = function() {

    const input =
        document.getElementById(
            "categorySearchInput"
        );

    if (!input) return;

    const keyword =
        input.value
            .toLowerCase()
            .trim();


    document
        .querySelectorAll(
            "#categoryOptions .category-option"
        )
        .forEach(option => {

            const text =
                option.textContent
                    .toLowerCase();

            option.style.display =
                text.includes(keyword)
                    ? "flex"
                    : "none";

        });

};
document.addEventListener(
    "click",
    function(event) {

        const wrapper =
            document.querySelector(
                ".category-dropdown-wrapper"
            );

        if (
            wrapper &&
            !wrapper.contains(event.target)
        ) {

            document
                .getElementById(
                    "categoryDropdown"
                )
                ?.classList.remove("show");

            wrapper.classList.remove("open");

        }

    }
);

