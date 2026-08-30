

// =================================================
// FIREBASE IMPORTS
// =================================================

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
    getDocs,
    onSnapshot,
    orderBy
}
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


// =================================================
// FIREBASE CONFIG
// =================================================

const firebaseConfig = {

    apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",

    authDomain: "mylamborghini.firebaseapp.com",

    projectId: "mylamborghini",

    storageBucket: "mylamborghini.firebasestorage.app",

    messagingSenderId: "817085836076",

    appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89",

    measurementId: "G-RY79N9C9R1"

};


// =================================================
// INITIALIZE FIREBASE
// =================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// =================================================
// ELEMENTS
// =================================================

const ordersContainer =
    document.getElementById("ordersContainer");


// =================================================
// AUTH CHECK
// =================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        if (ordersContainer) {

            ordersContainer.innerHTML = `

                <div class="empty">

                    <div class="empty-icon">
                        🔐
                    </div>

                    <h2>
                        Please Login
                    </h2>

                    <p>
                        Login to view your orders.
                    </p>

                </div>

            `;

        }

        showRecentOrdersEmpty();

        return;
    }


    console.log("=================================");
    console.log("LOGGED USER");
    console.log("UID:", user.uid);
    console.log("EMAIL:", user.email);
    console.log("=================================");


    // =============================================
    // LOAD ORDERS
    // =============================================

    await loadOrders(user);


    // =============================================
    // LOAD RECENT CHATS
    // =============================================

    loadRecentChats(user.email);

});


// =================================================
// LOAD ORDERS
// =================================================

async function loadOrders(user) {

    try {

        const ordersRef =
            collection(db, "orders");


        // =========================================
        // POSSIBLE CUSTOMER FIELDS
        // =========================================

        const queries = [

            query(
                ordersRef,
                where("email", "==", user.email)
            ),

            query(
                ordersRef,
                where("userEmail", "==", user.email)
            ),

            query(
                ordersRef,
                where("buyerEmail", "==", user.email)
            ),

            query(
                ordersRef,
                where("customerEmail", "==", user.email)
            ),

            query(
                ordersRef,
                where("uid", "==", user.uid)
            ),

            query(
                ordersRef,
                where("userId", "==", user.uid)
            ),

            query(
                ordersRef,
                where("buyerId", "==", user.uid)
            )

        ];


        // =========================================
        // GET ALL QUERIES
        // Promise.allSettled = ONE ERROR WON'T
        // STOP THE OTHER QUERIES
        // =========================================

        const snapshots =
            await Promise.allSettled(
                queries.map(q => getDocs(q))
            );


        // =========================================
        // REMOVE DUPLICATES
        // =========================================

        const orderMap =
            new Map();


        snapshots.forEach(
            (result, index) => {

                if (
                    result.status === "fulfilled"
                ) {

                    const snapshot =
                        result.value;


                    console.log(
                        "Query",
                        index + 1,
                        "found:",
                        snapshot.size
                    );


                    snapshot.forEach(
                        (docSnap) => {

                            if (
                                !orderMap.has(
                                    docSnap.id
                                )
                            ) {

                                orderMap.set(
                                    docSnap.id,
                                    docSnap.data()
                                );

                            }

                        }
                    );

                }

                else {

                    console.warn(
                        "Query",
                        index + 1,
                        "failed:",
                        result.reason
                    );

                }

            }
        );


        console.log(
            "TOTAL UNIQUE ORDERS:",
            orderMap.size
        );


        // =========================================
        // NO ORDERS
        // =========================================

        if (orderMap.size === 0) {

            console.log(
                "⚠️ No matching orders found."
            );


            showEmpty();

            showRecentOrdersEmpty();

            return;

        }


        // =========================================
        // PRODUCTS ARRAY
        // =========================================

        let products = [];


        // =========================================
        // READ ORDERS
        // =========================================

        orderMap.forEach(
            (order, orderId) => {

                console.log(
                    "ORDER FOUND:",
                    orderId,
                    order
                );


                // =================================
                // CART ORDER
                // =================================

                if (
                    Array.isArray(order.cart)
                ) {

                    order.cart.forEach(
                        (product) => {

                            products.push({

                                ...product,

                                orderId:
                                    orderId,

                                orderStatus:
                                    order.status ||
                                    order.orderStatus ||
                                    "Processing",

                                createdAt:
                                    order.createdAt,

                                orderTotal:
                                    order.total ||
                                    order.orderTotal ||
                                    0

                            });

                        }
                    );

                }


                // =================================
                // PRODUCTS ARRAY
                // =================================

                else if (
                    Array.isArray(order.products)
                ) {

                    order.products.forEach(
                        (product) => {

                            products.push({

                                ...product,

                                orderId:
                                    orderId,

                                orderStatus:
                                    order.status ||
                                    order.orderStatus ||
                                    "Processing",

                                createdAt:
                                    order.createdAt,

                                orderTotal:
                                    order.total ||
                                    order.orderTotal ||
                                    0

                            });

                        }
                    );

                }


                // =================================
                // SINGLE PRODUCT ORDER
                // =================================

                else {

                    products.push({

                        ...order,

                        orderId:
                            orderId,

                        orderStatus:
                            order.status ||
                            order.orderStatus ||
                            "Processing",

                        createdAt:
                            order.createdAt,

                        orderTotal:
                            order.total ||
                            order.orderTotal ||
                            0

                    });

                }

            }
        );


        console.log(
            "TOTAL PRODUCTS:",
            products.length
        );


        // =========================================
        // NO PRODUCTS
        // =========================================

        if (products.length === 0) {

            showEmpty();

            showRecentOrdersEmpty();

            return;

        }


        // =========================================
        // RENDER CATEGORY ORDERS
        // =========================================

        renderCategories(products);


        // =========================================
        // RENDER RECENT ORDERS
        // =========================================

        renderRecentOrders(orderMap);

    }


    catch (error) {

        console.error(
            "❌ Orders loading error:",
            error
        );


        if (ordersContainer) {

            ordersContainer.innerHTML = `

                <div class="empty">

                    <div class="empty-icon">
                        ⚠️
                    </div>

                    <h2>
                        Unable to Load Orders
                    </h2>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>

            `;

        }


        showRecentOrdersError(
            error.message
        );

    }

}


// =================================================
// RECENT ORDERS
// =================================================

// =================================================
// RECENT ORDERS
// =================================================

function renderRecentOrders(orderMap) {

    const recentOrders =
        document.getElementById(
            "recentOrders"
        );


    if (!recentOrders) {

        console.warn(
            "⚠️ recentOrders element not found."
        );

        return;

    }


    let orders = [];


    // =============================================
    // MAP → ARRAY
    // =============================================

    orderMap.forEach(
        (order, orderId) => {

            orders.push({

                ...order,

                orderId: orderId

            });

        }
    );


    // =============================================
    // SORT NEWEST FIRST
    // =============================================

    orders.sort(
        (a, b) => {

            return (
                getTimestamp(
                    b.createdAt
                ) -

                getTimestamp(
                    a.createdAt
                )
            );

        }
    );


    // =============================================
    // SHOW ONLY 5
    // =============================================

    const recent =
        orders.slice(0, 5);


    // =============================================
    // EMPTY
    // =============================================

    if (recent.length === 0) {

        showRecentOrdersEmpty();

        return;

    }


    let html = "";


    // =============================================
    // CREATE ROWS
    // =============================================

    recent.forEach(
        (order) => {

            // =====================================
            // GET PRODUCT NAMES
            // =====================================

            const productNames =
                getOrderProductNames(order);


            // =====================================
            // PRODUCT HTML
            // =====================================

            let productHTML = "";


            productNames.forEach(
                (name, index) => {

                    productHTML += `

                        <div
                            class="recent-product-name"
                        >

                            ${escapeHTML(name)}

                        </div>

                    `;

                }
            );


            // =====================================
            // TOTAL
            // =====================================

            let total =
                order.total;


            if (
                total === undefined ||
                total === null ||
                total === ""
            ) {

                total =
                    order.orderTotal;

            }


            if (
                total === undefined ||
                total === null ||
                total === ""
            ) {

                total = 0;

            }


            total =
                Number(total) || 0;


            // =====================================
            // STATUS
            // =====================================

            const status =
                order.status ||
                order.orderStatus ||
                "Processing";


            // =====================================
            // DATE
            // =====================================

            const date =
                formatDate(
                    order.createdAt
                );


            // =====================================
            // STATUS CLASS
            // =====================================

            const statusClass =
                getStatusClass(status);


            // =====================================
            // TABLE ROW
            // =====================================

            html += `

                <tr>

                    <!-- =========================
                         ORDER ID + PRODUCT NAME
                    ========================== -->

                    <td>

                        <strong
                            class="recent-order-id"
                        >

                            #
                            ${escapeHTML(
                                String(
                                    order.orderId
                                )
                            )}

                        </strong>


                        <div
                            class="recent-products"
                        >

                            ${productHTML}

                        </div>

                    </td>


                    <!-- =========================
                         TOTAL
                    ========================== -->

                    <td>

                        <strong>

                            Rs.
                            ${total.toLocaleString(
                                "en-LK"
                            )}

                        </strong>

                    </td>


                    <!-- =========================
                         STATUS
                    ========================== -->

                    <td>

                        <span
                            class="
                                order-status
                                ${statusClass}
                            "
                        >

                            ${escapeHTML(
                                formatStatus(
                                    status
                                )
                            )}

                        </span>

                    </td>


                    <!-- =========================
                         DATE
                    ========================== -->

                    <td>

                        <strong>

                            ${date}

                        </strong>

                    </td>

                </tr>

            `;

        }
    );


    // =============================================
    // INSERT
    // =============================================

    recentOrders.innerHTML =
        html;


    // =============================================
    // TOTAL ORDERS
    // =============================================

    const totalOrders =
        document.getElementById(
            "totalOrders"
        );


    if (totalOrders) {

        totalOrders.innerText =
            orders.length;

    }

}


// =================================================
// GET PRODUCT NAMES FROM ORDER
// =================================================

function getOrderProductNames(order) {

    const names = [];


    // =============================================
    // CART
    // =============================================

    if (
        Array.isArray(order.cart)
    ) {

        order.cart.forEach(
            (item) => {

                const name =
                    getProductName(item);


                if (name) {

                    names.push(name);

                }

            }
        );

    }


    // =============================================
    // PRODUCTS ARRAY
    // =============================================

    else if (
        Array.isArray(order.products)
    ) {

        order.products.forEach(
            (item) => {

                const name =
                    getProductName(item);


                if (name) {

                    names.push(name);

                }

            }
        );

    }


    // =============================================
    // SINGLE PRODUCT
    // =============================================

    else {

        const name =
            getProductName(order);


        if (name) {

            names.push(name);

        }

    }


    // =============================================
    // REMOVE DUPLICATES
    // =============================================

    return [
        ...new Set(names)
    ];

}


// =================================================
// GET ACTUAL PRODUCT NAME
// =================================================

function getProductName(product) {

    if (!product) {

        return "";

    }


    // =============================================
    // MOST COMMON FIRESTORE FIELD NAMES
    // =============================================

    const possibleNames = [

        product.name,

        product.productName,

        product.productTitle,

        product.title,

        product.itemName,

        product.product,

        product.artName,

        product.artTitle,

        product.displayName

    ];


    for (
        const value of possibleNames
    ) {

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {

            return String(value).trim();

        }

    }


    return "";

}


// =================================================
// FORMAT STATUS
// =================================================

function formatStatus(status) {

    const value =
        String(status)
            .trim()
            .toLowerCase();


    const map = {

        pending:
            "Succeed",

    };


    return (
        map[value] ||
        (
            value.charAt(0)
                .toUpperCase() +

            value.slice(1)
        )
    );

}


// =================================================
// STATUS CSS CLASS
// =================================================

function getStatusClass(status) {

    const value =
        String(status)
            .trim()
            .toLowerCase();


    if (value === "pending") {

        return "pending";

    }


    if (value === "processing") {

        return "processing";

    }


    if (
        value === "shipped"
    ) {

        return "shipped";

    }


    if (
        value === "delivered" ||
        value === "completed"
    ) {

        return "completed";

    }


    if (
        value === "cancelled" ||
        value === "canceled" ||
        value === "rejected"
    ) {

        return "cancelled";

    }


    return "processing";

}


// =================================================
// RECENT ORDERS EMPTY
// =================================================

function showRecentOrdersEmpty() {

    const box =
        document.getElementById(
            "recentOrders"
        );


    if (!box) return;


    box.innerHTML = `

        <tr>

            <td
                colspan="4"
                style="
                    text-align:center;
                    padding:30px;
                "
            >

                No Orders

            </td>

        </tr>

    `;


    const totalOrders =
        document.getElementById(
            "totalOrders"
        );


    if (totalOrders) {

        totalOrders.innerText = "0";

    }

}


// =================================================
// RECENT ORDERS ERROR
// =================================================

function showRecentOrdersError(message) {

    const box =
        document.getElementById(
            "recentOrders"
        );


    if (!box) return;


    box.innerHTML = `

        <tr>

            <td
                colspan="4"
                style="
                    text-align:center;
                    padding:30px;
                "
            >

                Unable to load orders

                <br>

                <small>

                    ${escapeHTML(
                        message
                    )}

                </small>

            </td>

        </tr>

    `;

}


// =================================================
// LOAD RECENT CHATS
// =================================================

function loadRecentChats(email) {

    try {

        const chatsRef =
            collection(
                db,
                "chats"
            );


        const q =
            query(

                chatsRef,

                where(
                    "buyerEmail",
                    "==",
                    email
                ),

                orderBy(
                    "updatedAt",
                    "desc"
                )

            );


        // =========================================
        // REALTIME CHAT LISTENER
        // =========================================

        onSnapshot(

            q,

            (snapshot) => {

                let html = "";

                let count = 0;


                snapshot.forEach(
                    (chat) => {

                        const data =
                            chat.data();


                        count++;


                        html += `

                            <div
                                class="chat-card"
                            >

                                <div
                                    class="chat-info"
                                >

                                    <h3>

                                        ${escapeHTML(
                                            data.sellerName ||
                                            "Seller"
                                        )}

                                    </h3>


                                    <p>

                                        ${escapeHTML(
                                            data.lastMessage ||
                                            "New Message"
                                        )}

                                    </p>

                                </div>


                                <button

                                    class="chat-btn"

                                    data-chat-id="
                                        ${escapeHTML(
                                            chat.id
                                        )}
                                    "

                                >

                                    <i
                                        class="fas fa-comments"
                                    ></i>

                                    Chat

                                </button>

                            </div>

                        `;

                    }
                );


                const box =
                    document.getElementById(
                        "recentChats"
                    );


                if (box) {

                    box.innerHTML =
                        count > 0

                            ? html

                            : `
                                <p>
                                    No Recent Chats
                                </p>
                            `;


                    // =================================
                    // CHAT BUTTON EVENTS
                    // =================================

                    box.querySelectorAll(
                        ".chat-btn"
                    ).forEach(
                        (button) => {

                            button.addEventListener(
                                "click",
                                () => {

                                    const chatId =
                                        button.dataset.chatId;


                                    openChat(
                                        chatId
                                    );

                                }
                            );

                        }
                    );

                }


                console.log(
                    "Realtime Chats:",
                    count
                );

            },


            (error) => {

                console.error(
                    "❌ Realtime Chat Error:",
                    error
                );


                const box =
                    document.getElementById(
                        "recentChats"
                    );


                if (box) {

                    box.innerHTML = `

                        <p>
                            Unable to load chats
                        </p>

                    `;

                }

            }

        );

    }


    catch (error) {

        console.error(
            "❌ Recent Chat Error:",
            error
        );

    }

}


// =================================================
// OPEN CHAT
// =================================================

function openChat(chatId) {

    localStorage.setItem(
        "chatId",
        chatId
    );


    window.location.href =
        "chat.html";

}


window.openChat =
    openChat;


// =================================================
// RENDER CATEGORIES
// =================================================

function renderCategories(products) {

    const categories = {};


    // =============================================
    // GROUP PRODUCTS
    // =============================================

    products.forEach(
        (product) => {

            const category =
                formatCategory(
                    product.category ||
                    "Other"
                );


            if (
                !categories[category]
            ) {

                categories[category] = [];

            }


            categories[category]
                .push(product);

        }
    );


    // =============================================
    // CLEAR
    // =============================================

    if (ordersContainer) {

        ordersContainer.innerHTML = "";

    }


    // =============================================
    // CATEGORY ORDER
    // =============================================

    const categoryOrder = [

        "Wall Art",

        "Digital Art",

        "Canvas",

        "Posters",

        "Other"

    ];


    const sortedCategories =
        Object.keys(categories)
            .sort(
                (a, b) => {

                    const ia =
                        categoryOrder
                            .indexOf(a);

                    const ib =
                        categoryOrder
                            .indexOf(b);


                    if (
                        ia === -1 &&
                        ib === -1
                    ) {

                        return a.localeCompare(
                            b
                        );

                    }


                    if (ia === -1) {

                        return 1;

                    }


                    if (ib === -1) {

                        return -1;

                    }


                    return ia - ib;

                }
            );


    // =============================================
    // CREATE SECTIONS
    // =============================================

    sortedCategories.forEach(
        (category) => {

            const section =
                document.createElement(
                    "section"
                );


            section.className =
                "category-section";


            section.innerHTML = `

                <div
                    class="category-title"
                >

                    <span
                        class="category-icon"
                    >

                        ${getCategoryIcon(
                            category
                        )}

                    </span>


                    <span
                        class="category-name"
                    >

                        ${escapeHTML(
                            category
                        )}

                    </span>


                    <span
                        class="category-count"
                    >

                        ${
                            categories[
                                category
                            ].length
                        }

                    </span>

                </div>


                <div
                    class="orders-grid"
                ></div>

            `;


            const grid =
                section.querySelector(
                    ".orders-grid"
                );


            categories[
                category
            ].forEach(
                (product) => {

                    grid.appendChild(
                        createOrderCard(
                            product
                        )
                    );

                }
            );


            if (ordersContainer) {

                ordersContainer.appendChild(
                    section
                );

            }

        }
    );

}


// =================================================
// ORDER CARD
// =================================================

function createOrderCard(product) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "order-card";


    const image =
        product.image ||
        product.imageUrl ||
        product.productImage ||
        "assets/default-product.png";


    const name =
        product.name ||
        product.productName ||
        "Unnamed Product";


    const rawPrice =
        product.price !== undefined

            ? product.price

            : (
                product.orderTotal ||
                0
            );


    const price =
        `Rs. ${Number(
            rawPrice
        ).toLocaleString(
            "en-LK"
        )}`;


    const status =
        product.orderStatus ||
        "Processing";


    const date =
        formatDate(
            product.createdAt
        );


    card.innerHTML = `

        <div class="order-top">

            <div class="order-id">

                Order #

                ${escapeHTML(
                    String(
                        product.orderId
                    )
                )}

            </div>


            <div class="status">

                ${escapeHTML(
                    formatStatus(
                        status
                    )
                )}

            </div>

        </div>


        <div class="order-product">

            <img

                class="product-image"

                src="${escapeHTML(
                    image
                )}"

                alt="${escapeHTML(
                    name
                )}"

                onerror="
                    this.src='assets/default-product.png'
                "

            >


            <div
                class="product-info"
            >

                <div
                    class="product-name"
                >

                    ${escapeHTML(
                        name
                    )}

                </div>


                <div
                    class="product-category"
                >

                    ${escapeHTML(
                        formatCategory(
                            product.category ||
                            "Other"
                        )
                    )}

                </div>


                <div
                    class="product-price"
                >

                    ${price}

                </div>


                <div
                    class="order-date"
                >

                    Ordered:

                    ${date}

                </div>

            </div>

        </div>

    `;


    return card;

}


// =================================================
// EMPTY ORDERS
// =================================================

function showEmpty() {

    if (!ordersContainer) return;


    ordersContainer.innerHTML = `

        <div class="empty">

            <div class="empty-icon">
                📦
            </div>


            <h2>
                No Orders Yet
            </h2>


            <p>
                Your purchased products will
                appear here.
            </p>

        </div>

    `;

}


// =================================================
// CATEGORY FORMAT
// =================================================

function formatCategory(category) {

    const value =
        String(category)
            .trim()
            .toLowerCase();


    const map = {

        "wall-art":
            "Wall Art",

        "wall art":
            "Wall Art",

        "wallarts":
            "Wall Art",

        "wall arts":
            "Wall Art",


        "digital-art":
            "Digital Art",

        "digital art":
            "Digital Art",

        "digitalarts":
            "Digital Art",

        "digital arts":
            "Digital Art",


        "canvas":
            "Canvas",


        "poster":
            "Posters",

        "posters":
            "Posters"

    };


    return (
        map[value] ||

        (
            value.charAt(0)
                .toUpperCase() +

            value.slice(1)
        )
    );

}


// =================================================
// CATEGORY ICON
// =================================================

function getCategoryIcon(category) {

    const icons = {

        "Wall Art":
            "🖼️",

        "Digital Art":
            "🎨",

        "Canvas":
            "🖌️",

        "Posters":
            "📜",

        "Other":
            "📦"

    };


    return (
        icons[category] ||
        "📦"
    );

}


// =================================================
// DATE
// =================================================

function formatDate(timestamp) {

    if (!timestamp) {

        return "Unknown";

    }


    try {

        let date;


        // =========================================
        // FIRESTORE TIMESTAMP
        // =========================================

        if (
            typeof timestamp.toDate ===
            "function"
        ) {

            date =
                timestamp.toDate();

        }


        // =========================================
        // FIRESTORE TIMESTAMP OBJECT
        // =========================================

        else if (
            timestamp.seconds !== undefined
        ) {

            date =
                new Date(
                    timestamp.seconds * 1000
                );

        }


        // =========================================
        // NORMAL DATE
        // =========================================

        else {

            date =
                new Date(timestamp);

        }


        if (
            isNaN(
                date.getTime()
            )
        ) {

            return "Unknown";

        }


        return date.toLocaleDateString(
            "en-GB",
            {

                day: "2-digit",

                month: "short",

                year: "numeric"

            }
        );

    }


    catch {

        return "Unknown";

    }

}


// =================================================
// TIMESTAMP FOR SORTING
// =================================================

function getTimestamp(timestamp) {

    if (!timestamp) {

        return 0;

    }


    try {

        // =========================================
        // FIRESTORE TIMESTAMP
        // =========================================

        if (
            typeof timestamp.toMillis ===
            "function"
        ) {

            return timestamp.toMillis();

        }


        // =========================================
        // FIRESTORE TIMESTAMP
        // =========================================

        if (
            typeof timestamp.toDate ===
            "function"
        ) {

            return timestamp
                .toDate()
                .getTime();

        }


        // =========================================
        // SECONDS OBJECT
        // =========================================

        if (
            timestamp.seconds !== undefined
        ) {

            return (
                Number(
                    timestamp.seconds
                ) * 1000
            );

        }


        // =========================================
        // NORMAL DATE
        // =========================================

        const date =
            new Date(timestamp);


        return (
            date.getTime() || 0
        );

    }


    catch {

        return 0;

    }

}


// =================================================
// ESCAPE HTML
// =================================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}

