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
    serverTimestamp,
    orderBy,
    onSnapshot
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
   NOTIFICATION SYSTEM
========================================= */

let notificationUnsubscribe = null;


/* =========================================
   LOAD USER NOTIFICATIONS
========================================= */

function loadNotifications() {

    if (notificationUnsubscribe) {
        notificationUnsubscribe();
        notificationUnsubscribe = null;
    }

    const user = auth.currentUser;

    if (!user) {
        updateNotificationBadge(0);
        return;
    }

    const notificationRef = collection(
        db,
        "users",
        user.uid,
        "notifications"
    );

    const notificationQuery = query(
        notificationRef,
        orderBy("createdAt", "desc")
    );

    notificationUnsubscribe = onSnapshot(
        notificationQuery,
        (snapshot) => {

            const list =
                document.getElementById(
                    "notificationList"
                );

            let unread = 0;

            if (list) {
                list.innerHTML = "";
            }

            snapshot.forEach((docSnap) => {

                const data = docSnap.data();

                const notificationId =
                    docSnap.id;

                if (data.read === false) {
                    unread++;
                }

                if (list) {

                    const item =
                        document.createElement("div");

                    item.className =
                        "notification-message";

                    item.dataset.id =
                        notificationId;

                    const title =
                        document.createElement("strong");

                    title.textContent =
                        data.title || "Notification";

                    const message =
                        document.createElement("p");

                    message.textContent =
                        data.message || "";

                    item.appendChild(title);
                    item.appendChild(message);

                    item.addEventListener(
                        "click",
                        () => {

                            openNotification(
                                notificationId
                            );

                        }
                    );

                    list.appendChild(item);
                }

            });

            updateNotificationBadge(unread);

        },
        (error) => {

            console.error(
                "Notification listener error:",
                error
            );

        }
    );
}


/* =========================================
   UPDATE NOTIFICATION BADGE
========================================= */

function updateNotificationBadge(count) {

    const badges =
        document.querySelectorAll(
            ".notification-badge"
        );

    badges.forEach((badge) => {

        badge.textContent = count;

        if (count > 0) {

            badge.style.display = "flex";

        } else {

            badge.style.display = "none";

        }

    });

}


/* =========================================
   OPEN NOTIFICATION
========================================= */

window.openNotification = function(
    notificationId
) {

    if (!notificationId) return;

    window.location.href =
        `notification.html?id=${encodeURIComponent(
            notificationId
        )}`;

};


/* =========================================
   CREATE NOTIFICATION
========================================= */

window.createNotification = async function(
    userId,
    title,
    message,
    type = "system",
    link = ""
) {

    if (!userId) {
        console.error(
            "Notification user ID missing."
        );
        return;
    }

    try {

        await addDoc(
            collection(
                db,
                "users",
                userId,
                "notifications"
            ),
            {

                title:
                    title || "Notification",

                message:
                    message || "",

                type,

                link,

                read: false,

                createdAt:
                    serverTimestamp()

            }
        );

        console.log(
            "Notification created successfully."
        );

    } catch (error) {

        console.error(
            "Create notification error:",
            error
        );

    }

};


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
   SUBMIT REVIEW
========================================= */

let submittingReview = false;

async function submitReview() {

    if (submittingReview) return;

    if (!currentUser) {

        showNotification(
            "Please log in to submit a review."
        );

        return;
    }

    if (!productId) {

        showNotification(
            "Product ID is missing."
        );

        return;
    }

    const ratingEl =
        document.getElementById("reviewRating");

    const commentEl =
        document.getElementById("reviewComment");

    const submitBtn =
        document.getElementById("submitReview");

    const rating =
        Number(ratingEl?.value || 5);

    const comment =
        commentEl?.value.trim() || "";

    if (!comment) {

        showNotification(
            "Please write a comment for your review."
        );

        return;
    }

    if (rating < 1 || rating > 5) {

        showNotification(
            "Please select a valid rating."
        );

        return;
    }

    try {

        submittingReview = true;

        if (submitBtn) {

            submitBtn.disabled = true;

            submitBtn.textContent =
                "Submitting...";

        }

        await addDoc(
            collection(db, "reviews"),
            {

                productId,

                userId:
                    currentUser.uid,

                userName:
                    currentUser.displayName ||
                    "Anonymous User",

                userEmail:
                    currentUser.email ||
                    "Anonymous",

                userPhoto:
                    currentUser.photoURL ||
                    "",

                rating,

                comment,

                createdAt:
                    serverTimestamp()

            }
        );

        showNotification(
            "Review added successfully! ⭐"
        );

        if (commentEl)
            commentEl.value = "";

        if (ratingEl)
            ratingEl.value = "5";

        await loadReviews();

    } catch (error) {

        console.error(
            "Error submitting review:",
            error
        );

        showNotification(
            "Failed to submit review. Please try again."
        );

    } finally {

        submittingReview = false;

        if (submitBtn) {

            submitBtn.disabled = false;

            submitBtn.textContent =
                "Submit Review";

        }

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
        /* =========================================
   LOAD SELLER STORE LOGO
========================================= */

const sellerId =
    product.sellerId ||
    product.artistUID ||
    product.sellerUID;

if (sellerId) {

    try {

        const storeRef =
            doc(
                db,
                "stores",
                sellerId
            );

        const storeSnap =
            await getDoc(storeRef);

        if (storeSnap.exists()) {

            const store =
                storeSnap.data();

            console.log(
                "STORE DATA:",
                store
            );

            const storeLogo =
                document.getElementById(
                    "storeLogo"
                );

            if (storeLogo) {

                if (store.logo) {

                    storeLogo.src =
                        store.logo;

                    console.log(
                        "STORE LOGO:",
                        store.logo
                    );

                } else {

                    storeLogo.src =
                        "profile.png";

                    console.warn(
                        "Store logo not found."
                    );

                }

            }

            // Store Name
            const sellerStoreName =
                document.getElementById(
                    "sellerStoreName"
                );

            if (sellerStoreName) {

                sellerStoreName.textContent =
                    store.name ||
                    product.sellerStoreName ||
                    product.sellerName ||
                    "Store";

            }

        } else {

            console.warn(
                "Store document not found:",
                sellerId
            );

        }

    } catch (error) {

        console.error(
            "Error loading store:",
            error
        );

    }

}

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

    loadNotifications();


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
/* =========================================
   VISIT SELLER STORE
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const visitStoreBtn =
        document.getElementById("visitStoreBtn");

    if (!visitStoreBtn) {
        console.warn("Visit Store button not found.");
        return;
    }

    visitStoreBtn.addEventListener("click", () => {

        if (!product) {
            showNotification(
                "Product information is still loading..."
            );
            return;
        }

        console.log("Product:", product);

        const sellerId =
            product.sellerId ||
            product.artistUID ||
            product.sellerUID;

        if (!sellerId) {

            console.error(
                "Seller ID missing from product:",
                product
            );

            showNotification(
                "Seller store information not available."
            );

            return;
        }

        console.log(
            "Opening seller store:",
            sellerId
        );

        window.location.href =
            `seller2.html?id=${encodeURIComponent(sellerId)}`;

    });

});
/* =========================================
   LOAD REVIEWS
========================================= */

async function loadReviews() {

    const container =
        document.getElementById("reviewsContainer");

    const averageRating =
        document.getElementById("averageRating");

    const reviewCount =
        document.getElementById("reviewCount");

    if (!container || !productId) return;

    try {

        const reviewsQuery = query(
            collection(db, "reviews"),
            where("productId", "==", productId)
        );

        const snapshot =
            await getDocs(reviewsQuery);

        /* NO REVIEWS */

        if (snapshot.empty) {

            if (averageRating)
                averageRating.textContent = "0.0 ⭐";

            if (reviewCount)
                reviewCount.textContent = "0 Reviews";

            container.innerHTML = `
                <p style="
                    padding:20px;
                    text-align:center;
                    color:#888;
                ">
                    No reviews yet.
                    Be the first to review this product! ⭐
                </p>
            `;

            return;
        }

        let totalRating = 0;

        const reviews = [];

        snapshot.forEach(reviewDoc => {

            const data =
                reviewDoc.data();

            const rating =
                Number(data.rating || 0);

            totalRating += rating;

            reviews.push({
                ...data,
                rating
            });

        });

        /* NEWEST FIRST */

        reviews.sort((a, b) => {

            const aTime =
                a.createdAt?.seconds || 0;

            const bTime =
                b.createdAt?.seconds || 0;

            return bTime - aTime;

        });

        /* AVERAGE */

        const average =
            (totalRating / reviews.length)
                .toFixed(1);

        if (averageRating) {

            averageRating.textContent =
                `${average} ⭐`;

        }

        if (reviewCount) {

            reviewCount.textContent =
                `${reviews.length} Review${
                    reviews.length === 1
                        ? ""
                        : "s"
                }`;

        }

        container.innerHTML = "";

        /* DISPLAY REVIEWS */

        reviews.forEach(review => {

            const card =
                document.createElement("div");

            card.className =
                "review-card";

            const header =
                document.createElement("div");

            header.style.cssText = `
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:10px;
            `;

            const user =
                document.createElement("strong");

            user.textContent =
                review.userName ||
                review.userEmail ||
                "Anonymous User";

            const stars =
                document.createElement("span");

            stars.style.cssText = `
                color:#f39c12;
                white-space:nowrap;
            `;

            stars.textContent =
                "⭐".repeat(
                    Math.max(
                        0,
                        Math.min(5, review.rating)
                    )
                );

            header.appendChild(user);
            header.appendChild(stars);

            const comment =
                document.createElement("p");

            comment.textContent =
                review.comment || "";

            const date =
                document.createElement("small");

            if (review.createdAt) {

                date.textContent =
                    review.createdAt
                        .toDate()
                        .toLocaleDateString(
                            "en-US",
                            {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                            }
                        );

            }

            card.appendChild(header);
            card.appendChild(comment);
            card.appendChild(date);

            container.appendChild(card);

        });

    } catch (error) {

        console.error(
            "Error loading reviews:",
            error
        );

        container.innerHTML = `
            <p style="color:red;">
                Failed to load reviews.
            </p>
        `;

    }

}
/* =========================================
   NOTIFICATION DROPDOWN
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const notificationBtn =
        document.getElementById("notificationBtn");

    const notificationDropdown =
        document.getElementById("notificationDropdown");

    if (!notificationBtn || !notificationDropdown) {
        return;
    }

    notificationBtn.addEventListener("click", (e) => {

        e.stopPropagation();

        notificationDropdown.classList.toggle("active");

    });

    document.addEventListener("click", (e) => {

        if (
            !notificationDropdown.contains(e.target) &&
            e.target !== notificationBtn
        ) {

            notificationDropdown.classList.remove("active");

        }

    });

});

