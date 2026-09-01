import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


/* =========================================
   FIREBASE CONFIGURATION
========================================= */

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
const provider = new GoogleAuthProvider();


/* =========================================
   GET PRODUCT ID & USER STATE
========================================= */

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
let product = null;
let currentUser = null;


/* =========================================
   HELPERS
========================================= */
async function googleLogin() {
    try {
        const result = await signInWithPopup(auth, provider);

        currentUser = result.user;

        showNotification("Welcome " + currentUser.displayName);

    } catch (err) {
        console.error(err);
        showNotification("Login Failed");
    }
}

window.googleLogin = googleLogin;
function setDetail(boxId, elementId, value, suffix = "") {
    const box = document.getElementById(boxId);
    const element = document.getElementById(elementId);

    if (!box || !element) {
        return;
    }

    if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === 0
    ) {
        box.style.display = "none";
        return;
    }

    element.textContent = value + suffix;
    box.style.display = "flex";
}

function showNotification(message) {
    if (typeof showToast === "function") {
        showToast(message);
    } else {
        alert(message);
    }
}


/* =========================================
   LOAD REVIEWS
========================================= */

async function loadReviews() {
    const container = document.getElementById("reviewsContainer");

    if (!container) return;

    try {
        const q = query(
            collection(db, "reviews"),
            where("productId", "==", productId)
        );

        const snap = await getDocs(q);

        const avgRatingEl = document.getElementById("averageRating");
        const revCountEl = document.getElementById("reviewCount");

        if (snap.empty) {
            if (avgRatingEl) avgRatingEl.textContent = "0.0 ⭐";
            if (revCountEl) revCountEl.textContent = "0 Reviews";

            container.innerHTML = "<p style='padding: 10px; color: #777;'>No reviews yet. Be the first to review!</p>";
            return;
        }

        let total = 0;
        let html = "";

        snap.forEach(docSnap => {
            const r = docSnap.data();
            const ratingValue = Number(r.rating || 0);
            total += ratingValue;

            html += `
            <div class="review-card" style="border-bottom: 1px solid #eee; padding: 15px 0;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>${r.userEmail || "Anonymous User"}</strong>
                    <span style="color: #f39c12; font-size: 16px;">${"⭐".repeat(ratingValue)}</span>
                </div>
                <p style="margin-top: 8px; color: #444;">${r.comment || ""}</p>
            </div>
            `;
        });

        const average = (total / snap.size).toFixed(1);

        if (avgRatingEl) {
            avgRatingEl.textContent = `${average} ⭐`;
        }

        if (revCountEl) {
            revCountEl.textContent = `${snap.size} Review${snap.size > 1 ? "s" : ""}`;
        }

        container.innerHTML = html;

    } catch (error) {
        console.error("Error loading reviews:", error);
    }
}


/* =========================================
   SUBMIT REVIEW
========================================= */

async function submitReview() {
    if (!currentUser) {
        showNotification("Please log in to submit a review.");
        return;
    }

    if (!productId) {
        showNotification("Product ID is missing.");
        return;
    }

    const ratingEl = document.getElementById("reviewRating");
    const commentEl = document.getElementById("reviewComment");

    const rating = ratingEl ? Number(ratingEl.value) : 5;
    const comment = commentEl ? commentEl.value.trim() : "";

    if (!comment) {
        showNotification("Please write a comment for your review.");
        return;
    }

    try {
        await addDoc(collection(db, "reviews"), {
            productId: productId,
            userId: currentUser.uid,
            userEmail: currentUser.email || "Anonymous",
            rating: rating,
            comment: comment,
            createdAt: serverTimestamp()
        });

        showNotification("Review added successfully!");

        // Reset Form
        if (commentEl) commentEl.value = "";
        if (ratingEl) ratingEl.value = "5";

        // Reload Reviews
        await loadReviews();

    } catch (error) {
        console.error("Error submitting review:", error);
        showNotification("Failed to submit review. Please try again.");
    }
}


/* =========================================
   LOAD PRODUCT
========================================= */

async function loadProduct() {
    try {
        if (!productId) {
            console.error("Product ID missing from URL.");
            return;
        }

        const snap = await getDoc(doc(db, "products", productId));

        if (!snap.exists()) {
            console.error("Product not found.");
            return;
        }

        /* GET PRODUCT DATA */
        product = snap.data();
        console.log("PRODUCT DATA:", product);

        /* BASIC INFORMATION */
        const productName = document.getElementById("productName");
        if (productName) {
            productName.textContent = product.brand || product.name || "Product";
        }

        const productPrice = document.getElementById("productPrice");
        if (productPrice) {
            productPrice.textContent = "Rs. " + Number(product.price || 0).toLocaleString();
        }

        const productCategory = document.getElementById("productCategory");
        if (productCategory) {
            productCategory.textContent = `${product.categoryGroup || "Non-Digital"} • ${product.category || ""} • ${product.subcategory || ""}`;
        }

        /* IMAGE */
        const image = document.getElementById("productImage");
        if (image) {
            image.src = product.imageUrl || product.image || "";
        }

        /* SPECIFICATIONS & DETAILS */
        setDetail("materialBox", "material", product.material);

        /* DIMENSIONS */
        const dimensions = [
            product.length,
            product.width,
            product.height
        ].filter(
            value => value !== undefined && value !== null && value !== "" && Number(value) > 0
        );

        const dimensionsBox = document.getElementById("dimensionsBox");
        const dimensionsEl = document.getElementById("dimensions");

        if (dimensions.length > 0 && dimensionsBox && dimensionsEl) {
            dimensionsEl.textContent = dimensions.join(" × ") + " cm";
            dimensionsBox.style.display = "flex";
        } else if (dimensionsBox) {
            dimensionsBox.style.display = "none";
        }

        /* WEIGHT, COLOR, FINISH, FRAME, HANDMADE, VARIANTS */
        setDetail("weightBox", "weight", product.weight, " kg");
        setDetail("colorBox", "color", product.color);
        setDetail("finishBox", "finish", product.finish);
        setDetail("frameBox", "frame", product.frame);
        setDetail("handmadeBox", "handmade", product.handmade);
        setDetail("variantColorsBox", "variantColors", product.variantColors);
        setDetail("variantSizesBox", "variantSizes", product.variantSizes);
        setDetail("customizableBox", "customizable", product.customizable);

        /* INVENTORY */
        const stock = document.getElementById("stock");
        const minOrder = document.getElementById("minOrder");

        if (stock) {
            stock.textContent = product.stock !== undefined ? product.stock : "Not specified";
        }

        if (minOrder) {
            minOrder.textContent = product.minOrder !== undefined ? product.minOrder : "1";
        }

        /* SHIPPING */
        setDetail("shippingBox", "shipping", product.shipping);

        const country = document.getElementById("country");
        if (country) {
            country.textContent = product.country || "Not specified";
        }

        const freeShipping = document.getElementById("freeShipping");
        if (freeShipping) {
            freeShipping.textContent = product.freeShipping || "No";
        }

        /* SELLER & DESCRIPTION */
        const sellerName = document.getElementById("sellerName");
        if (sellerName) sellerName.textContent = product.sellerName || "-";

        const sellerStoreName = document.getElementById("sellerStoreName");
        if (sellerStoreName) sellerStoreName.textContent = product.sellerStoreName || product.sellerName || "-";

        const sellerEmail = document.getElementById("sellerEmail");
        if (sellerEmail) sellerEmail.textContent = product.sellerEmail || "-";

        const sellerPhone = document.getElementById("sellerPhone");
        if (sellerPhone) sellerPhone.textContent = product.phone || "-";

        const sku = document.getElementById("sku");
        if (sku) sku.textContent = product.sku || "-";

        const description = document.getElementById("description");
        if (description) {
            description.textContent = product.description || "No description available.";
        }

        /* LOAD REVIEWS */
        await loadReviews();

        console.log("Product loaded successfully.");

    } catch (error) {
        console.error("Error loading product:", error);
    }
}


/* =========================================
   START CHAT
========================================= */

window.startChat = function () {
    if (!productId) {
        showNotification("Product ID not found.");
        return;
    }

    localStorage.setItem("chatProduct", productId);
    window.location.href = "chat.html";
};


/* =========================================
   AUTH & INITIALIZATION
========================================= */

onAuthStateChanged(auth, (user) => {

    currentUser = user;

    const profileImage = document.getElementById("profileImage");
    const loginBox = document.getElementById("loginBox");
    const reviewForm = document.querySelector(".review-form");

    if (profileImage) {
        profileImage.src = user
            ? (user.photoURL || "profile.png")
            : "profile.png";
    }

    if (user) {

        if (loginBox)
            loginBox.style.display = "none";

        if (reviewForm)
            reviewForm.style.display = "block";

    } else {

        if (loginBox)
            loginBox.style.display = "block";

        if (reviewForm)
            reviewForm.style.display = "none";
    }

});

// Setup Submit Button Event Listener
document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.getElementById("submitReview");
    if (submitBtn) {
        submitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            submitReview();
        });
    }
});

// App Start
loadProduct();
document.addEventListener("DOMContentLoaded", () => {

    const submitBtn = document.getElementById("submitReview");

    if (submitBtn) {
        submitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            submitReview();
        });
    }

    const loginBtn = document.getElementById("loginBtn");

    if (loginBtn) {
        loginBtn.addEventListener("click", googleLogin);
    }

});
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async (e) => {

        e.preventDefault();

        await signOut(auth);

        showNotification("Logged Out");

    });

}
function toggleSidebarMenu() {
    document
        .getElementById("profileSidebar")
        .classList.toggle("active");
}

// Global කරන්න
window.toggleSidebarMenu = toggleSidebarMenu;

document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("profileSidebar");
    const profile = document.getElementById("profileImage");

    if (
        sidebar &&
        !sidebar.contains(e.target) &&
        e.target !== profile
    ) {
        sidebar.classList.remove("active");
    }
});
const sidebarImg = document.getElementById("sidebarProfileImage");
const sidebarName = document.getElementById("sidebarUserName");
const sidebarEmail = document.getElementById("sidebarEmail");

onAuthStateChanged(auth,(user)=>{

    if(user){

        sidebarImg.src=user.photoURL || "profile.png";
        sidebarName.textContent=user.displayName || "User";
        sidebarEmail.textContent=user.email;

    }else{

        sidebarImg.src="profile.png";
        sidebarName.textContent="Guest User";
        sidebarEmail.textContent="Please Login";

    }

});
const loginBtn = document.getElementById("loginBtn");

if(loginBtn){

    loginBtn.addEventListener("click",()=>{

        localStorage.setItem(
            "redirectAfterLogin",
            window.location.href
        );

        window.location.href = "artist-login.html";

    });

}