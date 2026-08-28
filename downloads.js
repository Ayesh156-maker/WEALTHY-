// ================= FIREBASE IMPORTS =================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs
}
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


// ================= FIREBASE CONFIG =================

const firebaseConfig = {
    apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",
    authDomain: "mylamborghini.firebaseapp.com",
    projectId: "mylamborghini",
    storageBucket: "mylamborghini.firebasestorage.app",
    messagingSenderId: "817085836076",
    appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89"
};


// ================= INITIALIZE FIREBASE =================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ================= ELEMENTS =================

const downloadsGrid =
    document.getElementById("downloadsGrid");

const loading =
    document.getElementById("loading");

const emptyDownloads =
    document.getElementById("emptyDownloads");


// ================= AUTH =================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    await loadDownloads(user);

});


// ================= LOAD PURCHASED DIGITAL ART =================

async function loadDownloads(user) {

    try {

        loading.style.display = "block";

        emptyDownloads.style.display = "none";

        downloadsGrid.innerHTML = "";


        // ================= GET BUYER ORDERS =================

        const ordersRef = collection(db, "orders");

        const q = query(
            ordersRef,
            where("buyerEmail", "==", user.email)
        );

        const snapshot = await getDocs(q);


        let downloadCount = 0;


        // ================= LOOP ORDERS =================

        snapshot.forEach((orderDoc) => {

            const order = orderDoc.data();

            // IMPORTANT:
            // Checkout එකේ save වෙන්නේ order.cart

            const cart = order.cart || [];

console.log("ORDER ID:", orderDoc.id);
console.log("FULL ORDER:", order);
console.log("CART:", cart);

cart.forEach((item) => {

    console.log("PRODUCT:", item);
    console.log("NAME:", item.name);
    console.log("CATEGORY:", item.category);
    console.log("DOWNLOAD URL:", item.downloadUrl);

});


            // ================= LOOP CART =================

            cart.forEach((item) => {

                /*
                 * DIGITAL ART ONLY
                 *
                 * downloadUrl තිබිය යුතුයි.
                 */

if (
    item.category?.toLowerCase() === "digital-art" &&
    item.downloadUrl
) {
    downloadCount++;

    createDownloadCard(
        item,
        orderDoc.id,
        order.createdAt
    );
}

            });

        });


        loading.style.display = "none";


        // ================= NO DOWNLOADS =================

        if (downloadCount === 0) {

            emptyDownloads.style.display = "block";

        }


        console.log(
            "Purchased Digital Arts:",
            downloadCount
        );


    } catch (error) {

        console.error(
            "Downloads Error:",
            error
        );


        loading.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            Failed to load downloads.
        `;

    }

}


// ================= CREATE DOWNLOAD CARD =================

function createDownloadCard(
    item,
    orderId,
    createdAt
) {

    const card =
        document.createElement("div");

    card.className =
        "download-card";


    const image =
        item.image ||
        item.imageUrl ||
        "";


    const name =
        item.name ||
        "Digital Artwork";


    const price =
        item.price ||
        0;


    card.innerHTML = `

        <div class="download-image">

            ${
                image
                ?
                `
                <img
                    src="${image}"
                    alt="${name}"
                >
                `
                :
                `
                <div class="no-image">
                    <i class="fas fa-image"></i>
                </div>
                `
            }

        </div>


        <div class="download-info">

            <span class="digital-badge">
                DIGITAL ART
            </span>


            <h2>
                ${name}
            </h2>


            <p class="price">
                Purchased for Rs ${price}
            </p>


            <p class="order-id">
                Order ID: ${orderId}
            </p>


            <a
                href="${item.downloadUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="download-btn"
                download
            >

                <i class="fas fa-download"></i>

                Download Artwork

            </a>

        </div>

    `;


    downloadsGrid.appendChild(card);

}