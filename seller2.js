import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


// ==================================================
// FIREBASE
// ==================================================

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


// ==================================================
// GET SELLER ID
// ==================================================

const params = new URLSearchParams(
    window.location.search
);

const sellerId = params.get("id");


console.log("SELLER ID:", sellerId);


// ==================================================
// CHECK SELLER ID
// ==================================================

if (!sellerId) {

    document.body.innerHTML =
        "<h2>Seller not found</h2>";

} else {

    loadSeller();

}


// ==================================================
// LOAD SELLER
// ==================================================

async function loadSeller() {

    try {

        // ==================================================
        // LOAD ARTIST INFO
        // ==================================================

        const artistRef = doc(
            db,
            "artists",
            sellerId
        );

        const artistSnap =
            await getDoc(artistRef);


        if (artistSnap.exists()) {

            const artist =
                artistSnap.data();

            console.log(
                "ARTIST DATA:",
                artist
            );


            // ==================================================
            // BIO
            // ==================================================

            const story =
                document.getElementById(
                    "artistStory"
                );

            if (story) {

                story.textContent =
                    artist.bio ||
                    "No artist story available";

            }


            // ==================================================
            // CATEGORY
            // ==================================================

            const category =
                document.getElementById(
                    "artStyle"
                );

            if (category) {

                if (
                    Array.isArray(
                        artist.categories
                    )
                ) {

                    category.textContent =
                        artist.categories.join(", ");

                }

                else if (
                    Array.isArray(
                        artist.category
                    )
                ) {

                    category.textContent =
                        artist.category.join(", ");

                }

                else {

                    category.textContent =
                        artist.category ||
                        "-";

                }

            }


            // ==================================================
            // EXPERIENCE
            // ==================================================

            const experience =
                document.getElementById(
                    "experience"
                );

            if (experience) {

                experience.textContent =
                    artist.experience
                        ? artist.experience + " Years"
                        : "-";

            }


            // ==================================================
            // LOCATION
            // ==================================================

            const location =
                document.getElementById(
                    "location"
                );

            if (location) {

                const city =
                    artist.city || "";

                const country =
                    artist.country || "";

                location.textContent =
                    `${city}${city && country ? ", " : ""}${country}`;

            }


            // ==================================================
            // FOLLOWERS
            // ==================================================

            const followers =
                document.getElementById(
                    "followers"
                );

            if (followers) {

                followers.textContent =
                    artist.followers || 0;

            }

        }

        else {

            console.warn(
                "Artist document not found:",
                sellerId
            );

        }


        // ==================================================
        // LOAD STORE INFO
        // ==================================================

        const storeRef = doc(
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


            // ==================================================
            // STORE NAME
            // ==================================================

            const sellerName =
                document.getElementById(
                    "sellerName"
                );

            if (sellerName) {

                sellerName.textContent =
                    store.name ||
                    "Unknown Store";

            }


            // ==================================================
            // STORE LOGO
            // ==================================================

            const logo =
                document.getElementById(
                    "sellerLogo"
                );

            if (logo) {

                if (store.logo) {

                    logo.src =
                        store.logo;

                    console.log(
                        "STORE LOGO:",
                        store.logo
                    );

                }

                else {

                    logo.src =
                        "https://via.placeholder.com/200";

                    console.warn(
                        "Store logo not found."
                    );

                }

            }


            // ==================================================
            // STORE BANNER
            // ==================================================

            const banner =
                document.getElementById(
                    "storeBanner"
                );

            if (banner) {

                if (store.banner) {

                    banner.src =
                        store.banner;

                    console.log(
                        "STORE BANNER:",
                        store.banner
                    );

                }

                else {

                    banner.src =
                        "https://via.placeholder.com/1400x350";

                    console.warn(
                        "Store banner not found."
                    );

                }

            }

        }

        else {

            console.error(
                "Store document not found:",
                sellerId
            );

        }


        // ==================================================
        // LOAD PRODUCTS
        // ==================================================

        const productQuery =
            query(

                collection(
                    db,
                    "products"
                ),

                where(
                    "sellerId",
                    "==",
                    sellerId
                )

            );


        const productsSnap =
            await getDocs(
                productQuery
            );


        console.log(
            "PRODUCT COUNT:",
            productsSnap.size
        );


        // ==================================================
        // GROUP PRODUCTS
        // ==================================================

        const groupedProducts = {};


        productsSnap.forEach(
            (item) => {

                const product =
                    item.data();

                const category =
                    product.category ||
                    "Other";


                if (
                    !groupedProducts[category]
                ) {

                    groupedProducts[category] =
                        [];

                }


                groupedProducts[category].push({

                    id: item.id,

                    ...product

                });

            }
        );


        // ==================================================
        // PRODUCT CONTAINER
        // ==================================================

        const container =
            document.getElementById(
                "categoryProducts"
            );


        if (!container) {

            console.error(
                "categoryProducts container not found."
            );

            return;

        }


        container.innerHTML = "";


        // ==================================================
        // NO PRODUCTS
        // ==================================================

        if (
            Object.keys(
                groupedProducts
            ).length === 0
        ) {

            container.innerHTML = `

                <h3 style="text-align:center">

                    No Products Available

                </h3>

            `;

            return;

        }


        // ==================================================
        // SHOW CATEGORY PRODUCTS
        // ==================================================

        for (
            const category in groupedProducts
        ) {


            const section =
                document.createElement(
                    "div"
                );


            section.className =
                "category-section";


            section.innerHTML = `

                <h2 class="category-title">

                    ${category}

                </h2>

                <div class="products-grid"></div>

            `;


            const grid =
                section.querySelector(
                    ".products-grid"
                );


            groupedProducts[
                category
            ].forEach(
                (product) => {


                    const image =
                        product.imageUrl ||
                        product.image ||
                        "https://via.placeholder.com/300";


                    const productName =
                        product.brand ||
                        product.name ||
                        "Product";


                    const price =
                        product.price || 0;


                    grid.innerHTML += `

                        <div
                            class="card"
                            onclick="openProduct('${product.id}')"
                        >

                            <img
                                src="${image}"
                                alt="${productName}"
                            >

                            <h3>

                                ${productName}

                            </h3>

                            <p class="price">

                                Rs ${price}

                            </p>

                        </div>

                    `;

                }
            );


            container.appendChild(
                section
            );

        }


    }

    catch (error) {

        console.error(
            "Seller Profile Error:",
            error
        );

    }

}


// ==================================================
// OPEN PRODUCT
// ==================================================

window.openProduct = function(id) {

    window.location.href =
        `product.html?id=${encodeURIComponent(id)}`;

};