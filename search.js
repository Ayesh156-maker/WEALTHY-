import {
    initializeApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",
    authDomain: "mylamborghini.firebaseapp.com",
    projectId: "mylamborghini",
    storageBucket: "mylamborghini.firebasestorage.app",
    messagingSenderId: "817085836076",
    appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89",
    measurementId: "G-RY79N9C9R1"
};


// Use existing Firebase app if available
const app = getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);

const db = getFirestore(app);


// ===============================
// NAVBAR SEARCH
// ===============================

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");


// Search elements නැත්නම් script එක stop කරන්න
if (!searchInput || !searchResults) {
    console.log("Search elements not found");
} else {

    let allProducts = [];


    // Load products once
    async function loadSearchProducts() {

        try {

            const snapshot = await getDocs(
                collection(db, "products")
            );

            allProducts = [];

            snapshot.forEach(docSnap => {

                const product = {
                    id: docSnap.id,
                    ...docSnap.data()
                };

                // Published products only
                if (
                    product.status &&
                    product.status !== "published"
                ) {
                    return;
                }

                allProducts.push(product);

            });

        } catch (error) {

            console.error(
                "Search products loading error:",
                error
            );

        }

    }


    // Escape HTML
    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // Search
    function searchProducts() {

        const keyword =
            searchInput.value.trim().toLowerCase();

        if (!keyword) {

            searchResults.innerHTML = "";
            searchResults.style.display = "none";

            return;

        }


        const words = keyword
            .split(/\s+/)
            .filter(Boolean);


const results = allProducts
    .filter(product => {

        const searchableText = [

            product.brand,
            product.name,
            product.title,

            product.categoryGroup,
            product.categoryType,
            product.category,
            product.subcategory,

            product.tags,
            product.description,

            product.material,
            product.finish,
            product.color,

            product.variantColors,
            product.variantSizes,

            product.country,
            product.sku,

            product.sellerName,
            product.sellerStoreName,
            product.storeName

        ]
        .flat()
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

        // Every search word must match
        return words.every(word =>
            searchableText.includes(word)
        );

    })

    // ⭐ Smart ranking
    .sort((a, b) => {

        const ratingA = Number(a.rating || 0);
        const ratingB = Number(b.rating || 0);

        const reviewsA = Number(a.reviewCount || 0);
        const reviewsB = Number(b.reviewCount || 0);


        // Rating is the main priority
        if (ratingA !== ratingB) {
            return ratingB - ratingA;
        }


        // If ratings are equal,
        // products with more reviews come first
        return reviewsB - reviewsA;

    })

    // Show maximum 8 results
    .slice(0, 8);

        renderSearchResults(results);

    }


    // Render results
    function renderSearchResults(results) {

        if (!results.length) {

            searchResults.innerHTML = `
                <div class="search-item">
                    <span>No products found</span>
                </div>
            `;

            searchResults.style.display = "block";

            return;

        }


        searchResults.innerHTML = results.map(product => {

            const image =
                product.imageUrl ||
                product.image ||
                "profile.png";

            const name =
                product.brand ||
                product.name ||
                product.title ||
                "Product";


            const price =
                Number(product.price || 0)
                    .toLocaleString();


            const rating =
                Number(product.rating || 0)
                    .toFixed(1);


            return `

                <div
                    class="search-item"
                    data-id="${escapeHTML(product.id)}"
                >

                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(name)}"
                    >

                    <div>

                        <strong>
                            ${escapeHTML(name)}
                        </strong>

                        <div>
                            Rs. ${price}
                        </div>

                        <small>
                            ⭐ ${rating}
                        </small>

                    </div>

                </div>

            `;

        }).join("");


        searchResults.style.display = "block";


        // Click product
        searchResults
            .querySelectorAll(".search-item[data-id]")
            .forEach(item => {

                item.addEventListener(
                    "click",
                    () => {

                        const id =
                            item.dataset.id;

                        window.location.href =
                            `product.html?id=${encodeURIComponent(id)}`;

                    }
                );

            });

    }


    // Input search
    searchInput.addEventListener(
        "input",
        searchProducts
    );


    // Search button
    searchBtn?.addEventListener(
        "click",
        searchProducts
    );


    // Enter key
    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                searchProducts();

            }

        }
    );


    // Load products
    loadSearchProducts();


    // Click outside → close results
    document.addEventListener(
        "click",
        event => {

            if (
                !event.target.closest(".nav-search")
            ) {

                searchResults.style.display =
                    "none";

            }

        }
    );

}