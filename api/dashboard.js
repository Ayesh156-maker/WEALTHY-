// ============================================================
// LEANGELO SELLER DASHBOARD
// ============================================================

// ============================================================
// FIREBASE IMPORTS
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

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
    query,
    where,
    onSnapshot,
    doc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

import {
    setupPresence
} from "./presence.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",

    authDomain:
        "mylamborghini.firebaseapp.com",

    projectId:
        "mylamborghini",

    storageBucket:
        "mylamborghini.firebasestorage.app",

    messagingSenderId:
        "817085836076",

    appId:
        "1:817085836076:web:dafa36f41d1ec24a5c5a89",

    databaseURL:
        "https://mylamborghini-default-rtdb.firebaseio.com"

};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);

const realtimeDB =
    getDatabase(app);

const provider =
    new GoogleAuthProvider();


// ============================================================
// GLOBALS
// ============================================================

let salesChart = null;
let lineChart = null;

let currentUser = null;

let sellerProducts = new Map();

let allSellerOrders = [];


// ============================================================
// GOOGLE LOGIN
// ============================================================

window.googleLogin = async function () {

    try {

        await signInWithPopup(
            auth,
            provider
        );

    }

    catch (error) {

        console.error(
            "GOOGLE LOGIN ERROR:",
            error
        );

        if (typeof showToast === "function") {

            showToast(
                "Login failed ❌"
            );

        }

    }

};


// ============================================================
// LOGOUT
// ============================================================

window.logout = async function () {

    try {

        await signOut(auth);

        window.location.href =
            "landing.html";

    }

    catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

    }

};


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    (user) => {

        currentUser = user;

        const loginBtn =
            document.getElementById(
                "loginBtn"
            );


        // ----------------------------------------------------
        // NOT LOGGED IN
        // ----------------------------------------------------

        if (!user) {

            if (loginBtn) {

                loginBtn.style.display =
                    "block";

            }

            return;

        }


        // ----------------------------------------------------
        // LOGGED IN
        // ----------------------------------------------------

        if (loginBtn) {

            loginBtn.style.display =
                "none";

        }


        console.log(
            "SELLER LOGIN:",
            user.email
        );


        // ----------------------------------------------------
        // PRESENCE
        // ----------------------------------------------------

        setupPresence(
            realtimeDB,
            user
        );


        // ----------------------------------------------------
        // USER PROFILE
        // ----------------------------------------------------

        updateUserProfile(
            user
        );


        // ----------------------------------------------------
        // LOAD STORE
        // ----------------------------------------------------

        loadStoreUI(
            user.uid
        );


        // ----------------------------------------------------
        // LOAD SELLER PRODUCTS
        // ----------------------------------------------------

        listenSellerProducts(
            user.email
        );


        // ----------------------------------------------------
        // LOAD ORDERS
        // ----------------------------------------------------

        listenOrders(
            user.email
        );


        // ----------------------------------------------------
        // LOAD CHATS
        // ----------------------------------------------------

        listenChats(
            user.email
        );

    }
);


// ============================================================
// UPDATE USER PROFILE
// ============================================================

function updateUserProfile(user) {

    const userName =
        document.getElementById(
            "userName"
        );

    const userEmail =
        document.getElementById(
            "userEmail"
        );

    const userPhoto =
        document.getElementById(
            "userPhoto"
        );


    if (userName) {

        userName.innerText =
            user.displayName ||
            "LeanGelo Seller";

    }


    if (userEmail) {

        userEmail.innerText =
            user.email ||
            "Seller";

    }


    if (userPhoto) {

        userPhoto.src =
            user.photoURL ||
            "https://ui-avatars.com/api/?name=Seller&background=dcae3c&color=000";

    }

}


// ============================================================
// STORE UI
// ============================================================

function loadStoreUI(uid) {

    onSnapshot(

        doc(
            db,
            "stores",
            uid
        ),

        (snap) => {

            if (!snap.exists()) {

                return;

            }


            const store =
                snap.data();


            const banner =
                document.getElementById(
                    "dashboardBanner"
                );

            const logo =
                document.getElementById(
                    "userPhoto"
                );

            const name =
                document.getElementById(
                    "dashboardStoreName"
                );


            if (
                banner &&
                store.banner
            ) {

                banner.src =
                    store.banner;

            }


            if (
                logo &&
                store.logo
            ) {

                logo.src =
                    store.logo;

            }


            if (name) {

                name.innerText =
                    store.name ||
                    "My Store";

            }

        },

        (error) => {

            console.error(
                "STORE LOAD ERROR:",
                error
            );

        }

    );

}


// ============================================================
// OPEN STORE
// ============================================================

window.openStore = function () {

    window.location.href =
        "edit-store.html";

};


// ============================================================
// SELLER PRODUCTS
// ============================================================

function listenSellerProducts(
    sellerEmail
) {

    if (!sellerEmail) {

        return;

    }


    const email =
        sellerEmail
            .toLowerCase()
            .trim();


    const q =
        query(
            collection(
                db,
                "products"
            ),
            where(
                "email",
                "==",
                email
            )
        );


    onSnapshot(

        q,

        (snapshot) => {

            sellerProducts.clear();


            let productCount = 0;


            snapshot.forEach(
                (productSnap) => {

                    const product =
                        productSnap.data();


                    productCount++;


                    sellerProducts.set(
                        productSnap.id,
                        {
                            id:
                                productSnap.id,

                            ...product
                        }
                    );

                }
            );


            // ------------------------------------------------
            // PRODUCT COUNT
            // ------------------------------------------------

            const productCountElement =
                document.getElementById(
                    "myProducts"
                );


            if (
                productCountElement
            ) {

                productCountElement.innerText =
                    productCount;

            }


            // ------------------------------------------------
            // OLD PRODUCT LIST
            // ------------------------------------------------

            renderSellerProducts();


            // ------------------------------------------------
            // RE-CALCULATE ORDERS
            // ------------------------------------------------

            if (
                allSellerOrders.length > 0
            ) {

                processOrders(
                    allSellerOrders,
                    email
                );

            }

        },

        (error) => {

            console.error(
                "PRODUCT LISTENER ERROR:",
                error
            );

        }

    );

}


// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderSellerProducts() {

    const productList =
        document.getElementById(
            "myProductList"
        );


    if (!productList) {

        return;

    }


    productList.innerHTML = "";


    sellerProducts.forEach(
        (product) => {

            const image =
                product.imageUrl ||
                product.image ||
                "";


            const name =
                product.brand ||
                product.name ||
                "Artwork";


            const price =
                Number(
                    product.price || 0
                );


            productList.innerHTML += `

                <div class="product-card">

                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(name)}"
                    >

                    <h3>
                        ${escapeHTML(name)}
                    </h3>

                    <p>
                        Rs ${price}
                    </p>

                </div>

            `;

        }
    );

}


// ============================================================
// ORDERS
// ============================================================

// =====================================================
// ORDERS + RECENT ORDERS + CHARTS
// =====================================================

function listenOrders(email) {

    const ordersQuery =
        collection(db, "orders");

    onSnapshot(
        ordersQuery,
        (snapshot) => {

            let orders = 0;
            let earnings = 0;

            const monthly = {
                Jan: 0,
                Feb: 0,
                Mar: 0,
                Apr: 0,
                May: 0,
                Jun: 0,
                Jul: 0,
                Aug: 0,
                Sep: 0,
                Oct: 0,
                Nov: 0,
                Dec: 0
            };

            const recentOrders = [];

            // =================================================
            // READ ORDERS
            // =================================================

            snapshot.forEach((docSnap) => {

                const order = docSnap.data();

                if (!Array.isArray(order.cart)) {
                    return;
                }

                order.cart.forEach((item) => {

                    const sellerEmail =
                        String(
                            item.sellerEmail || ""
                        )
                        .toLowerCase()
                        .trim();

                    // Only this seller's products
                    if (sellerEmail !== email) {
                        return;
                    }

                    const qty =
                        Number(
                            item.quantity || 1
                        );

                    const price =
                        Number(
                            item.price || 0
                        );

                    const itemTotal =
                        price * qty;

                    // =================================================
                    // TOTAL ORDERS
                    // Digital + Non-Digital
                    // =================================================

                    orders += qty;

                    // =================================================
                    // TOTAL EARNINGS
                    // =================================================

                    earnings += itemTotal;

                    // =================================================
                    // MONTHLY REVENUE
                    // =================================================

                    let date;

                    if (
                        order.createdAt &&
                        typeof order.createdAt.toDate === "function"
                    ) {

                        date =
                            order.createdAt.toDate();

                    } else if (
                        order.createdAt
                    ) {

                        date =
                            new Date(
                                order.createdAt
                            );

                    } else {

                        date = new Date();

                    }

                    const month =
                        date.toLocaleString(
                            "en-US",
                            {
                                month: "short"
                            }
                        );

                    if (
                        monthly[month] !== undefined
                    ) {

                        monthly[month] +=
                            itemTotal;

                    }

                    // =================================================
                    // DIGITAL / NON-DIGITAL
                    // =================================================

                    const categoryType =
                        String(
                            item.categoryType || ""
                        )
                        .toLowerCase()
                        .trim();

                    const isDigital =
                        categoryType === "digital";

                    // =================================================
                    // RECENT ORDER OBJECT
                    // =================================================

                    recentOrders.push({

                        orderId:
                            docSnap.id,

                        productName:
                            item.name ||
                            "Artwork",

                        imageUrl:
                            item.imageUrl ||
                            item.image ||
                            "",

                        price:
                            price,

                        quantity:
                            qty,

                        itemTotal:
                            itemTotal,

                        categoryType:
                            isDigital
                                ? "digital"
                                : "non-digital",

                        buyerName:
                            order.buyerName ||
                            order.fullname ||
                            "Customer",

                        buyerEmail:
                            order.buyerEmail ||
                            "",

                        status:
                            order.status ||
                            "pending",

                        createdAt:
                            date

                    });

                });

            });

            // =================================================
            // SORT RECENT ORDERS
            // =================================================

            recentOrders.sort(
                (a, b) =>
                    b.createdAt - a.createdAt
            );

            // =================================================
            // UPDATE TOTAL ORDERS
            // =================================================

            const myOrders =
                document.getElementById(
                    "myOrders"
                );

            if (myOrders) {

                myOrders.innerText =
                    orders;

            }

            // =================================================
            // UPDATE TOTAL EARNINGS
            // =================================================

            const myEarnings =
                document.getElementById(
                    "myEarnings"
                );

            if (myEarnings) {

                myEarnings.innerText =
                    "Rs " +
                    earnings.toLocaleString();

            }

            // =================================================
            // RECENT ORDERS
            // =================================================

            renderRecentOrders(
                recentOrders
            );

            // =================================================
            // UPDATE CHARTS
            // =================================================

            updateCharts(
                Object.keys(monthly),
                Object.values(monthly)
            );

            console.log(
                "TOTAL ORDERS:",
                orders
            );

            console.log(
                "TOTAL EARNINGS:",
                earnings
            );

            console.log(
                "RECENT ORDERS:",
                recentOrders
            );

        },
        (error) => {

            console.error(
                "ORDERS LISTENER ERROR:",
                error
            );

        }
    );

}

// ============================================================
// PROCESS SELLER ORDERS
// ============================================================

function processOrders(
    orders,
    sellerEmail
) {

    let totalOrders = 0;

    let totalEarnings = 0;


    const monthly = {

        Jan: 0,
        Feb: 0,
        Mar: 0,
        Apr: 0,
        May: 0,
        Jun: 0,
        Jul: 0,
        Aug: 0,
        Sep: 0,
        Oct: 0,
        Nov: 0,
        Dec: 0

    };


    const sellerOrders = [];


    // ========================================================
    // LOOP THROUGH ORDERS
    // ========================================================

    orders.forEach(
        (order) => {

            if (
                !Array.isArray(
                    order.cart
                )
            ) {

                return;

            }


            const sellerItems = [];


            // ------------------------------------------------
            // FIND SELLER ITEMS
            // ------------------------------------------------

            order.cart.forEach(
                (item) => {

                    const itemSellerEmail =
                        String(
                            item.sellerEmail ||
                            item.email ||
                            ""
                        )
                        .toLowerCase()
                        .trim();


                    const productId =
                        item.id ||
                        item.productId ||
                        "";


                    const product =
                        sellerProducts.get(
                            productId
                        );


                    const productSellerEmail =
                        product
                            ? String(
                                product.email ||
                                ""
                            )
                            .toLowerCase()
                            .trim()
                            : "";


                    // =================================================
                    // SELLER MATCH
                    // =================================================

                    const belongsToSeller =

                        // New checkout data
                        itemSellerEmail ===
                        sellerEmail

                        ||

                        // Product lookup fallback
                        productSellerEmail ===
                        sellerEmail;


                    if (
                        !belongsToSeller
                    ) {

                        return;

                    }


                    const quantity =
                        Number(
                            item.quantity || 1
                        );


                    const price =
                        Number(
                            item.price || 0
                        );


                    const itemTotal =
                        price *
                        quantity;


                    totalEarnings +=
                        itemTotal;


                    sellerItems.push({

                        ...item,

                        quantity,

                        price,

                        itemTotal

                    });


                    // ------------------------------------------------
                    // MONTHLY REVENUE
                    // ------------------------------------------------

                    const date =
                        convertFirestoreDate(
                            order.createdAt
                        );


                    if (date) {

                        const month =
                            date.toLocaleString(
                                "en-US",
                                {
                                    month: "short"
                                }
                            );


                        if (
                            monthly[month] !==
                            undefined
                        ) {

                            monthly[month] +=
                                itemTotal;

                        }

                    }

                }
            );


            // =================================================
            // THIS ORDER BELONGS TO SELLER
            // =================================================

            if (
                sellerItems.length > 0
            ) {

                // One order = one order
                totalOrders++;


                sellerOrders.push({

                    ...order,

                    sellerItems,

                    sellerTotal:
                        sellerItems.reduce(
                            (
                                sum,
                                item
                            ) =>
                                sum +
                                item.itemTotal,
                            0
                        )

                });

            }

        }
    );


    // ========================================================
    // UPDATE TOTAL ORDERS
    // ========================================================

    const myOrders =
        document.getElementById(
            "myOrders"
        );


    if (myOrders) {

        myOrders.innerText =
            totalOrders;

    }


    // ========================================================
    // UPDATE TOTAL EARNINGS
    // ========================================================

    const myEarnings =
        document.getElementById(
            "myEarnings"
        );


    if (myEarnings) {

        myEarnings.innerText =
            "Rs " +
            formatNumber(
                totalEarnings
            );

    }


    console.log(
        "===================================="
    );

    console.log(
        "SELLER ORDER SUMMARY"
    );

    console.log(
        "Total Orders:",
        totalOrders
    );

    console.log(
        "Total Earnings:",
        totalEarnings
    );

    console.log(
        "Seller Orders:",
        sellerOrders
    );

    console.log(
        "===================================="
    );


    // ========================================================
    // CHART
    // ========================================================

    updateCharts(

        Object.keys(monthly),

        Object.values(monthly)

    );


    // ========================================================
    // RECENT ORDERS
    // ========================================================

    renderRecentOrders(
        sellerOrders
    );

}


// ============================================================
// RECENT ORDERS
// ============================================================

function renderRecentOrders(
    orders
) {

    const box =
        document.getElementById(
            "recentOrders"
        );


    if (!box) {

        return;

    }


    box.innerHTML = "";


    if (
        orders.length === 0
    ) {

        box.innerHTML = `

            <div class="order-loading">

                No orders yet.

            </div>

        `;

        return;

    }


    // --------------------------------------------------------
    // SORT NEWEST FIRST
    // --------------------------------------------------------

    orders.sort(
        (a, b) => {

            const dateA =
                convertFirestoreDate(
                    a.createdAt
                );

            const dateB =
                convertFirestoreDate(
                    b.createdAt
                );


            return (
                (dateB?.getTime() || 0) -
                (dateA?.getTime() || 0)
            );

        }
    );


    // --------------------------------------------------------
    // SHOW ONLY 5
    // --------------------------------------------------------

    const recent =
        orders.slice(
            0,
            5
        );


    recent.forEach(
        (order) => {

            const buyerName =
                order.buyerName ||
                order.fullname ||
                "Customer";


            const buyerEmail =
                order.buyerEmail ||
                "";


            const status =
                order.status ||
                "pending";


            const sellerTotal =
                Number(
                    order.sellerTotal || 0
                );


            const date =
                convertFirestoreDate(
                    order.createdAt
                );


            const dateText =
                date
                    ? formatDate(date)
                    : "Recently";


            const itemCount =
                order.sellerItems
                    ? order.sellerItems.length
                    : 0;


            const firstItem =
                order.sellerItems?.[0];


            const productName =
                firstItem?.name ||
                firstItem?.brand ||
                "Artwork";


            const image =
                firstItem?.imageUrl ||
                firstItem?.image ||
                "";


            box.innerHTML += `

                <div class="recent-order-card">

                    <div
                        class="recent-order-image"
                    >

                        ${
                            image
                            ?

                            `
                            <img
                                src="${escapeHTML(image)}"
                                alt="Artwork"
                            >
                            `

                            :

                            `
                            <i
                                class="fa-solid fa-box"
                            ></i>
                            `
                        }

                    </div>


                    <div
                        class="recent-order-info"
                    >

                        <h3>

                            ${escapeHTML(
                                productName
                            )}

                        </h3>


                        <p>

                            👤
                            ${escapeHTML(
                                buyerName
                            )}

                        </p>


                        ${
                            buyerEmail

                            ?

                            `
                            <small>

                                ${escapeHTML(
                                    buyerEmail
                                )}

                            </small>
                            `

                            :

                            ""
                        }


                        <span>

                            ${itemCount}
                            item${itemCount === 1 ? "" : "s"}

                            •

                            ${dateText}

                        </span>

                    </div>


                    <div
                        class="recent-order-right"
                    >

                        <strong>

                            Rs
                            ${formatNumber(
                                sellerTotal
                            )}

                        </strong>


                        <small
                            class="order-status ${escapeHTML(
                                status
                                    .toLowerCase()
                                    .replace(
                                        /\s+/g,
                                        "-"
                                    )
                            )}"
                        >

                            ${escapeHTML(
                                status
                            )}

                        </small>

                    </div>

                </div>

            `;

        }
    );

}


// ============================================================
// CHARTS
// ============================================================

function updateCharts(
    labels,
    data
) {

    const barCanvas =
        document.getElementById(
            "salesChart"
        );

    const lineCanvas =
        document.getElementById(
            "salesLineChart"
        );


    // ========================================================
    // BAR CHART
    // ========================================================

    if (barCanvas) {

        if (salesChart) {

            salesChart.data.labels =
                labels;

            salesChart.data.datasets[0].data =
                data;

            salesChart.update();

        }

        else {

            salesChart =
                new Chart(
                    barCanvas,
                    {

                        type: "bar",

                        data: {

                            labels,

                            datasets: [

                                {

                                    label:
                                        "Monthly Revenue",

                                    data,

                                    backgroundColor:
                                        "#ffb547",

                                    borderRadius:
                                        12,

                                    borderSkipped:
                                        false,

                                    maxBarThickness:
                                        40

                                }

                            ]

                        },

                        options: {

                            responsive:
                                true,

                            maintainAspectRatio:
                                false,

                            plugins: {

                                legend: {

                                    labels: {

                                        color:
                                            "#ffffff",

                                        font: {

                                            size:
                                                14,

                                            weight:
                                                "bold"

                                        }

                                    }

                                },

                                tooltip: {

                                    backgroundColor:
                                        "#111",

                                    titleColor:
                                        "#fff",

                                    bodyColor:
                                        "#ffb547",

                                    padding:
                                        12,

                                    cornerRadius:
                                        10

                                }

                            },

                            scales: {

                                x: {

                                    ticks: {

                                        color:
                                            "#ffffff"

                                    },

                                    grid: {

                                        color:
                                            "rgba(255,255,255,0.05)"

                                    }

                                },

                                y: {

                                    beginAtZero:
                                        true,

                                    ticks: {

                                        color:
                                            "#ffffff",

                                        callback:
                                            function (
                                                value
                                            ) {

                                                return "Rs " +
                                                    formatNumber(
                                                        value
                                                    );

                                            }

                                    },

                                    grid: {

                                        color:
                                            "rgba(255,255,255,0.08)"

                                    }

                                }

                            }

                        }

                    }
                );

        }

    }


    // ========================================================
    // LINE CHART
    // ========================================================

    if (lineCanvas) {

        const ctx =
            lineCanvas.getContext(
                "2d"
            );


        if (lineChart) {

            lineChart.data.labels =
                labels;

            lineChart.data.datasets[0].data =
                data;

            lineChart.update();

        }

        else {

            const gradient =
                ctx.createLinearGradient(
                    0,
                    0,
                    0,
                    300
                );


            gradient.addColorStop(
                0,
                "rgba(255,181,71,0.6)"
            );


            gradient.addColorStop(
                1,
                "rgba(255,181,71,0)"
            );


            lineChart =
                new Chart(
                    lineCanvas,
                    {

                        type: "line",

                        data: {

                            labels,

                            datasets: [

                                {

                                    label:
                                        "Revenue Trend",

                                    data,

                                    borderColor:
                                        "#ffb547",

                                    backgroundColor:
                                        gradient,

                                    fill:
                                        true,

                                    tension:
                                        0.4,

                                    pointRadius:
                                        5,

                                    pointHoverRadius:
                                        8,

                                    pointBackgroundColor:
                                        "#fff",

                                    pointBorderColor:
                                        "#ffb547",

                                    pointBorderWidth:
                                        3

                                }

                            ]

                        },

                        options: {

                            responsive:
                                true,

                            maintainAspectRatio:
                                false,

                            plugins: {

                                legend: {

                                    labels: {

                                        color:
                                            "#ffffff"

                                    }

                                },

                                tooltip: {

                                    backgroundColor:
                                        "#111",

                                    bodyColor:
                                        "#ffb547",

                                    cornerRadius:
                                        10

                                }

                            },

                            scales: {

                                x: {

                                    ticks: {

                                        color:
                                            "#ffffff"

                                    },

                                    grid: {

                                        color:
                                            "rgba(255,255,255,0.05)"

                                    }

                                },

                                y: {

                                    beginAtZero:
                                        true,

                                    ticks: {

                                        color:
                                            "#ffffff",

                                        callback:
                                            function (
                                                value
                                            ) {

                                                return "Rs " +
                                                    formatNumber(
                                                        value
                                                    );

                                            }

                                    },

                                    grid: {

                                        color:
                                            "rgba(255,255,255,0.08)"

                                    }

                                }

                            }

                        }

                    }
                );

        }

    }

}


// ============================================================
// LIVE CHATS
// ============================================================

function listenChats(
    sellerEmail
) {

    const box =
        document.getElementById(
            "chatSection"
        );

    const msgCount =
        document.getElementById(
            "msgCount"
        );


    if (!sellerEmail) {

        return;

    }


    const email =
        sellerEmail
            .toLowerCase()
            .trim();


    onSnapshot(

        collection(
            db,
            "chats"
        ),

        (snapshot) => {

            let unread = 0;

            const chats = [];


            snapshot.forEach(
                (docSnap) => {

                    const chat =
                        docSnap.data();


                    const seller =
                        String(
                            chat.sellerEmail ||
                            ""
                        )
                        .toLowerCase()
                        .trim();


                    if (
                        seller !==
                        email
                    ) {

                        return;

                    }


                    chats.push({

                        id:
                            docSnap.id,

                        ...chat

                    });


                    unread +=
                        Number(
                            chat.unreadSeller ||
                            0
                        );

                }
            );


            // ------------------------------------------------
            // SORT
            // ------------------------------------------------

            chats.sort(
                (a, b) => {

                    return (

                        (
                            b.updatedAt?.seconds ||
                            0
                        )

                        -

                        (
                            a.updatedAt?.seconds ||
                            0
                        )

                    );

                }
            );


            // ------------------------------------------------
            // UNREAD COUNT
            // ------------------------------------------------

            if (msgCount) {

                msgCount.textContent =
                    unread;

            }


            if (!box) {

                return;

            }


            box.innerHTML = "";


            // ------------------------------------------------
            // NO CHATS
            // ------------------------------------------------

            if (
                chats.length === 0
            ) {

                box.innerHTML = `

                    <div class="order-loading">

                        No messages yet.

                    </div>

                `;

                return;

            }


            // ------------------------------------------------
            // CHAT CARDS
            // ------------------------------------------------

            chats.forEach(
                (chat) => {

                    box.innerHTML += `

                        <div
                            class="chat-card"
                        >

                            <img
                                src="${escapeHTML(
                                    chat.productImage ||
                                    ""
                                )}"
                                class="chat-product"
                                alt="Product"
                            >

                            <h3>

                                ${escapeHTML(
                                    chat.productName ||
                                    "Artwork"
                                )}

                            </h3>


                            <p>

                                👤
                                ${escapeHTML(
                                    chat.buyerName ||
                                    "Buyer"
                                )}

                            </p>


                            <p>

                                📧
                                ${escapeHTML(
                                    chat.buyerEmail ||
                                    ""
                                )}

                            </p>


                            <p>

                                💰
                                Rs
                                ${formatNumber(
                                    chat.price ||
                                    0
                                )}

                            </p>


                            <p>

                                💬
                                ${escapeHTML(
                                    chat.lastMessage ||
                                    "No messages yet"
                                )}

                            </p>


                            <button
                                onclick="openChat('${escapeHTML(
                                    chat.id
                                )}')"
                            >

                                Open Chat

                            </button>

                        </div>

                    `;

                }
            );

        },

        (error) => {

            console.error(
                "CHAT LISTENER ERROR:",
                error
            );

        }

    );

}


// ============================================================
// OPEN CHAT
// ============================================================

window.openChat =
function (id) {

    localStorage.setItem(
        "chatId",
        id
    );


    window.location.href =
        "chat.html";

};


// ============================================================
// PROFILE MENU
// ============================================================

window.toggleProfileMenu =
function () {

    const menu =
        document.getElementById(
            "profileMenu"
        );


    if (!menu) {

        return;

    }


    menu.classList.toggle(
        "show"
    );

};


// ============================================================
// PROFILE DROPDOWN
// ============================================================

window.toggleProfile =
function () {

    const dropdown =
        document.getElementById(
            "profileDropdown"
        );


    if (!dropdown) {

        return;

    }


    dropdown.classList.toggle(
        "active"
    );

};


// ============================================================
// CLOSE PROFILE MENUS
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    () => {

        const userProfile =
            document.getElementById(
                "userProfile"
            );

        const profileMenu =
            document.getElementById(
                "profileMenu"
            );


        if (
            userProfile &&
            profileMenu
        ) {

            userProfile.addEventListener(
                "click",
                (e) => {

                    e.stopPropagation();

                    profileMenu.classList.toggle(
                        "show"
                    );

                }
            );


            document.addEventListener(
                "click",
                () => {

                    profileMenu.classList.remove(
                        "show"
                    );

                }
            );

        }


        // ----------------------------------------------------
        // MOBILE SIDEBAR
        // ----------------------------------------------------

        const toggle =
            document.querySelector(
                ".sidebar-toggle"
            );

        const sidebar =
            document.querySelector(
                ".sidebar"
            );


        if (
            toggle &&
            sidebar
        ) {

            toggle.addEventListener(
                "click",
                () => {

                    sidebar.classList.toggle(
                        "open"
                    );

                }
            );

        }

    }
);


// ============================================================
// THEME SWITCH
// ============================================================

window.toggleTheme =
function () {

    const body =
        document.body;

    const icon =
        document.getElementById(
            "themeIcon"
        );


    body.classList.toggle(
        "dark"
    );


    if (
        body.classList.contains(
            "dark"
        )
    ) {

        if (icon) {

            icon.innerHTML =
                "☀️";

        }


        localStorage.setItem(
            "theme",
            "dark"
        );

    }

    else {

        if (icon) {

            icon.innerHTML =
                "🌙";

        }


        localStorage.setItem(
            "theme",
            "light"
        );

    }

};


// ============================================================
// THEME LOAD
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    () => {

        const savedTheme =
            localStorage.getItem(
                "theme"
            );


        const icon =
            document.getElementById(
                "themeIcon"
            );


        if (
            savedTheme ===
            "dark"
        ) {

            document.body.classList.add(
                "dark"
            );


            if (icon) {

                icon.innerHTML =
                    "☀️";

            }

        }

        else {

            if (icon) {

                icon.innerHTML =
                    "🌙";

            }

        }

    }
);


// ============================================================
// OLD THEME BUTTON SUPPORT
// ============================================================

const themeBtn =
    document.getElementById(
        "themeToggle"
    );


if (themeBtn) {

    themeBtn.onclick =
        function () {

            window.toggleTheme();

        };

}


// ============================================================
// CONVERT FIRESTORE DATE
// ============================================================

function convertFirestoreDate(
    value
) {

    if (!value) {

        return null;

    }


    // Firestore Timestamp
    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    // JS Date
    if (
        value instanceof Date
    ) {

        return value;

    }


    // Timestamp object
    if (
        typeof value.seconds ===
        "number"
    ) {

        return new Date(
            value.seconds * 1000
        );

    }


    // String / number
    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
    date
) {

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ============================================================
// FORMAT NUMBER
// ============================================================

function formatNumber(
    number
) {

    return Number(
        number || 0
    ).toLocaleString(
        "en-LK"
    );

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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


// ============================================================
// DEBUG
// ============================================================

console.log(
    "LeanGelo Seller Dashboard JS Loaded ✅"
);