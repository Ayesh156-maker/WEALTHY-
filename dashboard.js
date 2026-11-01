// ============================================================
// LEANGELO SELLER DASHBOARD
// FIREBASE + FIRESTORE REAL-TIME DASHBOARD
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

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
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


// ============================================================
// FIREBASE
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",
  authDomain: "mylamborghini.firebaseapp.com",
  projectId: "mylamborghini",
  storageBucket: "mylamborghini.firebasestorage.app",
  messagingSenderId: "817085836076",
  appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();


// ============================================================
// GLOBALS
// ============================================================

let salesChart = null;
let lineChart = null;

let currentUser = null;

let unsubscribeStore = null;
let unsubscribeProducts = null;
let unsubscribeOrders = null;
let unsubscribeChats = null;


// ============================================================
// HELPERS
// ============================================================

function $(id) {
  return document.getElementById(id);
}


function money(value) {

  const number = Number(value || 0);

  return "Rs " + number.toLocaleString("en-LK", {
    maximumFractionDigits: 2
  });
}


function safeText(value) {

  if (value === undefined || value === null) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function getDate(value) {

  if (!value) {
    return null;
  }

  if (value?.toDate) {
    return value.toDate();
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000);
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}


function isToday(date) {

  if (!date) return false;

  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}


function isThisMonth(date) {

  if (!date) return false;

  const now = new Date();

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}


function normalizeEmail(email) {

  return String(email || "")
    .toLowerCase()
    .trim();
}


function isMySellerItem(item) {

  if (!currentUser) {
    return false;
  }

  const myEmail = normalizeEmail(currentUser.email);
  const myUid = currentUser.uid;

  const sellerEmail = normalizeEmail(
    item.sellerEmail ||
    item.email ||
    item.seller?.email
  );

  const sellerId =
    item.sellerId ||
    item.artistUID ||
    item.sellerUID ||
    item.seller?.uid;

  return (
    sellerEmail === myEmail ||
    sellerId === myUid
  );
}


function getOrderDate(order) {

  return getDate(
    order.createdAt ||
    order.timestamp ||
    order.orderDate ||
    order.date
  );
}


function getItemStatus(item, order) {

  return String(
    item.status ||
    order.status ||
    "pending"
  )
    .toLowerCase()
    .trim();
}


function isCancelled(status) {

  return [
    "cancelled",
    "canceled",
    "rejected"
  ].includes(status);
}


function setText(id, value) {

  const element = $(id);

  if (element) {
    element.textContent = value;
  }
}


// ============================================================
// LOGIN
// ============================================================

window.googleLogin = async () => {

  try {

    await signInWithPopup(auth, provider);

  } catch (error) {

    console.error("Google Login Error:", error);

    alert("Login failed. Please try again.");

  }

};


// ============================================================
// LOGOUT
// ============================================================

window.logout = async () => {

  try {

    await signOut(auth);

  } catch (error) {

    console.error("Logout Error:", error);

  }

};


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(auth, (user) => {

  currentUser = user;

  const loginBtn = $("loginBtn");
  const userProfile = $("userProfile");

  if (!user) {

    if (loginBtn) {
      loginBtn.style.display = "block";
    }

    if (userProfile) {
      userProfile.style.display = "none";
    }

    clearDashboard();

    stopListeners();

    return;
  }


  // ----------------------------------------------------------
  // USER UI
  // ----------------------------------------------------------

  if (loginBtn) {
    loginBtn.style.display = "none";
  }

  if (userProfile) {
    userProfile.style.display = "block";
  }


  setText(
    "userName",
    user.displayName || "Seller"
  );

  setText(
    "userEmail",
    user.email || ""
  );

  setText(
    "welcomeName",
    user.displayName?.split(" ")[0] || "Seller"
  );


  const userPhoto = $("userPhoto");
  const userAvatarClick = $("userAvatarClick");

  const profilePhoto =
    user.photoURL || "profile.png";

  if (userPhoto) {
    userPhoto.src = profilePhoto;
  }

  if (userAvatarClick) {
    userAvatarClick.src = profilePhoto;
  }


  // ----------------------------------------------------------
  // START REAL-TIME DATA
  // ----------------------------------------------------------

  stopListeners();

  listenStore(user.uid);

  listenProducts();

  listenOrders();

  listenChats();

});


// ============================================================
// STOP PREVIOUS LISTENERS
// ============================================================

function stopListeners() {

  if (unsubscribeStore) {
    unsubscribeStore();
    unsubscribeStore = null;
  }

  if (unsubscribeProducts) {
    unsubscribeProducts();
    unsubscribeProducts = null;
  }

  if (unsubscribeOrders) {
    unsubscribeOrders();
    unsubscribeOrders = null;
  }

  if (unsubscribeChats) {
    unsubscribeChats();
    unsubscribeChats = null;
  }

}


// ============================================================
// STORE - REAL TIME
// ============================================================

function listenStore(uid) {

  unsubscribeStore = onSnapshot(
    doc(db, "stores", uid),

    (snapshot) => {

      if (!snapshot.exists()) {

        console.log("No store document found.");

        return;
      }

      const store = snapshot.data();

      const storeName =
        store.name ||
        store.storeName ||
        "My Store";

      const logo =
        store.logo ||
        store.logoUrl ||
        "profile.png";

      const banner =
        store.banner ||
        store.bannerUrl ||
        "";


      // Sidebar
      setText(
        "dashboardStoreName",
        storeName
      );


      // Store overview
      setText(
        "storeOverviewName",
        storeName
      );

      setText(
        "storeOverviewDescription",
        store.description ||
        "Your seller store"
      );


      const overviewLogo =
        $("storeOverviewLogo");

      if (overviewLogo) {
        overviewLogo.src = logo;
      }


      // Dashboard banner
      const dashboardBanner =
        $("dashboardBanner");

      if (dashboardBanner) {

        if (banner) {
          dashboardBanner.src = banner;
          dashboardBanner.style.display = "block";
        } else {
          dashboardBanner.removeAttribute("src");
        }

      }

    },

    (error) => {

      console.error(
        "Store listener error:",
        error
      );

    }
  );

}


// ============================================================
// PRODUCTS - REAL TIME
// ============================================================

function listenProducts() {

  unsubscribeProducts = onSnapshot(
    collection(db, "products"),

    (snapshot) => {

      const products = [];

      snapshot.forEach((docSnap) => {

        const product = {
          id: docSnap.id,
          ...docSnap.data()
        };

        if (!isMySellerItem(product)) {
          return;
        }

        products.push(product);

      });


      console.log(
        "Live products:",
        products.length
      );


      renderProducts(products);

      renderTopProducts(products);

      renderInventoryAlerts(products);

    },

    (error) => {

      console.error(
        "Products listener error:",
        error
      );

    }
  );

}


// ============================================================
// PRODUCTS UI
// ============================================================

function renderProducts(products) {

  setText(
    "myProducts",
    products.length
  );


  const growth = $("productGrowth");

  if (growth) {

    growth.textContent =
      products.length === 1
        ? "1 listed product"
        : `${products.length} listed products`;

  }


  const container =
    $("myProductList");

  if (!container) {
    return;
  }


  if (products.length === 0) {

    container.innerHTML = `
      <div class="empty-state">
        No products yet
      </div>
    `;

    return;
  }


  // Latest products first
  products.sort((a, b) => {

    const aDate =
      getDate(a.createdAt)?.getTime() || 0;

    const bDate =
      getDate(b.createdAt)?.getTime() || 0;

    return bDate - aDate;

  });


  // Dashboard shows first 12
  const visibleProducts =
    products.slice(0, 12);


  container.innerHTML =
    visibleProducts.map(product => {

      const image =
        product.imageUrl ||
        product.image ||
        "profile.png";

      const name =
        product.brand ||
        product.name ||
        "Unnamed Product";

      const price =
        Number(product.price || 0);


      return `
        <div class="product-card">

          <div class="product-image-wrap">

            <img
              src="${safeText(image)}"
              alt="${safeText(name)}"
              loading="lazy"
              onerror="this.src='profile.png'"
            >

          </div>

          <div class="product-card-content">

            <h3>
              ${safeText(name)}
            </h3>

            <p>
              ${money(price)}
            </p>

          </div>

        </div>
      `;

    }).join("");

}


// ============================================================
// TOP PRODUCTS
// ============================================================

function renderTopProducts(products) {

  const container =
    $("topProducts");

  if (!container) {
    return;
  }


  if (!products.length) {

    container.innerHTML = `
      <div class="empty-state">
        No product performance data yet
      </div>
    `;

    return;
  }


  const sorted =
    [...products]
      .sort(
        (a, b) =>
          Number(b.sales || b.soldCount || b.cartCount || 0) -
          Number(a.sales || a.soldCount || a.cartCount || 0)
      )
      .slice(0, 5);


  container.innerHTML =
    sorted.map((product, index) => {

      const name =
        product.brand ||
        product.name ||
        "Product";

      const image =
        product.imageUrl ||
        product.image ||
        "profile.png";

      const sales =
        Number(
          product.sales ||
          product.soldCount ||
          product.cartCount ||
          0
        );


      return `
        <div class="top-product-item">

          <div class="top-product-rank">
            #${index + 1}
          </div>

          <img
            src="${safeText(image)}"
            alt="${safeText(name)}"
            onerror="this.src='profile.png'"
          >

          <div>
            <strong>
              ${safeText(name)}
            </strong>

            <small>
              ${sales} sales
            </small>
          </div>

        </div>
      `;

    }).join("");

}


// ============================================================
// INVENTORY ALERTS
// ============================================================

function renderInventoryAlerts(products) {

  const container =
    $("lowStockProducts");

  if (!container) {
    return;
  }


  const lowStock = products.filter(product => {

    const stock =
      Number(
        product.stock ??
        product.quantity ??
        product.inventory ??
        0
      );

    const unlimited =
      product.stock === undefined &&
      product.quantity === undefined &&
      product.inventory === undefined;

    if (unlimited) {
      return false;
    }

    return stock <= 5;

  });


  if (!lowStock.length) {

    container.innerHTML = `
      <div class="empty-state">
        No inventory alerts
      </div>
    `;

    return;
  }


  container.innerHTML =
    lowStock.map(product => {

      const name =
        product.brand ||
        product.name ||
        "Product";

      const stock =
        Number(
          product.stock ??
          product.quantity ??
          product.inventory ??
          0
        );


      return `
        <div class="low-stock-item">

          <div>
            <strong>
              ${safeText(name)}
            </strong>

            <small>
              Only ${stock} item${stock === 1 ? "" : "s"} left
            </small>
          </div>

          <span>
            ${stock === 0 ? "OUT OF STOCK" : "LOW STOCK"}
          </span>

        </div>
      `;

    }).join("");

}


// ============================================================
// ORDERS - REAL TIME
// ============================================================

function listenOrders() {

  unsubscribeOrders = onSnapshot(
    collection(db, "orders"),

    (snapshot) => {

      const sellerOrders = [];

      snapshot.forEach((docSnap) => {

        const order = {
          id: docSnap.id,
          ...docSnap.data()
        };


        if (!Array.isArray(order.cart)) {
          return;
        }


        const sellerItems =
          order.cart.filter(item =>
            isMySellerItem(item)
          );


        if (!sellerItems.length) {
          return;
        }


        sellerOrders.push({
          ...order,
          sellerItems
        });

      });


      console.log(
        "Live seller orders:",
        sellerOrders.length
      );


      updateOrderDashboard(
        sellerOrders
      );

    },

    (error) => {

      console.error(
        "Orders listener error:",
        error
      );

    }
  );

}


// ============================================================
// ORDER CALCULATIONS
// ============================================================

function getSellerOrderTotal(order) {

  return order.sellerItems.reduce(
    (total, item) => {

      const price =
        Number(item.price || 0);

      const quantity =
        Number(item.quantity || 1);

      return total + price * quantity;

    },
    0
  );

}


function updateOrderDashboard(orders) {

  let totalOrders = 0;
  let totalEarnings = 0;

  let todayRevenue = 0;
  let monthRevenue = 0;

  let pending = 0;
  let processing = 0;
  let shipped = 0;
  let completed = 0;
  let cancelled = 0;


  const monthlyRevenue = {
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


  // ----------------------------------------------------------
  // LOOP ORDERS
  // ----------------------------------------------------------

  orders.forEach(order => {

    const orderDate =
      getOrderDate(order);

    const orderTotal =
      getSellerOrderTotal(order);


    totalOrders +=
      order.sellerItems.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 1),
        0
      );


    const orderStatuses =
      order.sellerItems.map(item =>
        getItemStatus(item, order)
      );


    orderStatuses.forEach(status => {

      if (isCancelled(status)) {
        cancelled++;
      }

      else if (
        status === "completed" ||
        status === "complete" ||
        status === "delivered"
      ) {
        completed++;
      }

      else if (
        status === "shipped" ||
        status === "shipping"
      ) {
        shipped++;
      }

      else if (
        status === "processing" ||
        status === "confirmed"
      ) {
        processing++;
      }

      else {
        pending++;
      }

    });


    // --------------------------------------------------------
    // REVENUE
    // Cancelled orders are excluded.
    // --------------------------------------------------------

    const validItems =
      order.sellerItems.filter(item =>
        !isCancelled(
          getItemStatus(item, order)
        )
      );


    const validRevenue =
      validItems.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
          Number(item.quantity || 1),
        0
      );


    totalEarnings += validRevenue;


    if (orderDate) {

      if (isToday(orderDate)) {
        todayRevenue += validRevenue;
      }


      if (isThisMonth(orderDate)) {
        monthRevenue += validRevenue;
      }


      const month =
        orderDate.toLocaleString(
          "en-US",
          { month: "short" }
        );


      if (monthlyRevenue[month] !== undefined) {
        monthlyRevenue[month] += validRevenue;
      }

    }

  });


  // ==========================================================
  // UPDATE MAIN STATS
  // ==========================================================

  setText(
    "myOrders",
    totalOrders
  );

  setText(
    "myEarnings",
    money(totalEarnings)
  );


  setText(
    "todayRevenue",
    money(todayRevenue)
  );

  setText(
    "monthRevenue",
    money(monthRevenue)
  );


  setText(
    "pendingOrders",
    pending
  );

  setText(
    "pendingOrders2",
    pending
  );

  setText(
    "processingOrders",
    processing
  );

  setText(
    "shippedOrders",
    shipped
  );

  setText(
    "completedOrders",
    completed
  );

  setText(
    "cancelledOrders",
    cancelled
  );


  setText(
    "orderStatusSummary",
    `${pending} pending • ${completed} completed`
  );


  // ==========================================================
  // CHARTS
  // ==========================================================

  updateCharts(
    Object.keys(monthlyRevenue),
    Object.values(monthlyRevenue)
  );


  // ==========================================================
  // RECENT ORDERS
  // ==========================================================

  renderRecentOrders(orders);

}


// ============================================================
// RECENT ORDERS
// ============================================================

function renderRecentOrders(orders) {

  const container =
    $("recentOrders");

  if (!container) {
    return;
  }


  const sorted =
    [...orders]
      .sort((a, b) => {

        const aTime =
          getOrderDate(a)?.getTime() || 0;

        const bTime =
          getOrderDate(b)?.getTime() || 0;

        return bTime - aTime;

      })
      .slice(0, 8);


  if (!sorted.length) {

    container.innerHTML = `
      <div class="empty-state">
        No orders yet
      </div>
    `;

    return;
  }


  container.innerHTML =
    sorted.map(order => {

      const total =
        getSellerOrderTotal(order);

      const date =
        getOrderDate(order);


      const firstItem =
        order.sellerItems[0];


      const customer =
        order.buyerName ||
        order.customerName ||
        order.userName ||
        order.buyerEmail ||
        "Customer";


      const status =
        getItemStatus(
          firstItem,
          order
        );


      const formattedStatus =
        status.charAt(0).toUpperCase() +
        status.slice(1);


      return `
        <div class="recent-order-item">

          <div>

            <strong>
              ${safeText(customer)}
            </strong>

            <small>
              ${date ? date.toLocaleString() : ""}
            </small>

          </div>

          <div>

            <strong>
              ${money(total)}
            </strong>

            <span class="order-status">
              ${safeText(formattedStatus)}
            </span>

          </div>

        </div>
      `;

    }).join("");

}


// ============================================================
// CHARTS
// ============================================================

function updateCharts(labels, data) {

  const barCanvas =
    $("salesChart");

  const lineCanvas =
    $("salesLineChart");


  if (!barCanvas || !lineCanvas) {
    return;
  }


  // ----------------------------------------------------------
  // BAR CHART
  // ----------------------------------------------------------

  if (salesChart) {

    salesChart.data.labels = labels;

    salesChart.data.datasets[0].data =
      data;

    salesChart.update();

  } else {

    salesChart = new Chart(
      barCanvas,
      {
        type: "bar",

        data: {
          labels,

          datasets: [
            {
              label: "Monthly Revenue",

              data,

              backgroundColor: "#EAB308",

              borderRadius: 12,

              borderSkipped: false,

              maxBarThickness: 42
            }
          ]
        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            legend: {
              labels: {
                color: "#ffffff"
              }
            },

            tooltip: {

              backgroundColor: "#111827",

              titleColor: "#ffffff",

              bodyColor: "#EAB308",

              padding: 12,

              cornerRadius: 10,

              callbacks: {

                label: context =>
                  " " +
                  money(context.raw)

              }

            }

          },

          scales: {

            x: {

              ticks: {
                color: "#ffffff"
              },

              grid: {
                color:
                  "rgba(255,255,255,0.05)"
              }

            },

            y: {

              beginAtZero: true,

              ticks: {

                color: "#ffffff",

                callback: value =>
                  "Rs " +
                  Number(value).toLocaleString()

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


  // ----------------------------------------------------------
  // LINE CHART
  // ----------------------------------------------------------

  if (lineChart) {

    lineChart.data.labels = labels;

    lineChart.data.datasets[0].data =
      data;

    lineChart.update();

  } else {

    const ctx =
      lineCanvas.getContext("2d");


    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        0,
        300
      );


    gradient.addColorStop(
      0,
      "rgba(234,179,8,0.45)"
    );

    gradient.addColorStop(
      1,
      "rgba(234,179,8,0)"
    );


    lineChart = new Chart(
      lineCanvas,
      {
        type: "line",

        data: {

          labels,

          datasets: [
            {

              label: "Revenue Trend",

              data,

              borderColor: "#EAB308",

              backgroundColor: gradient,

              fill: true,

              tension: 0.4,

              pointRadius: 4,

              pointHoverRadius: 7,

              pointBackgroundColor:
                "#ffffff",

              pointBorderColor:
                "#EAB308",

              pointBorderWidth: 3

            }
          ]

        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            legend: {

              labels: {
                color: "#ffffff"
              }

            },

            tooltip: {

              backgroundColor:
                "#111827",

              bodyColor:
                "#EAB308",

              cornerRadius: 10,

              callbacks: {

                label: context =>
                  " " +
                  money(context.raw)

              }

            }

          },

          scales: {

            x: {

              ticks: {
                color: "#ffffff"
              },

              grid: {
                color:
                  "rgba(255,255,255,0.05)"
              }

            },

            y: {

              beginAtZero: true,

              ticks: {

                color: "#ffffff",

                callback: value =>
                  "Rs " +
                  Number(value).toLocaleString()

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


// ============================================================
// CHATS - REAL TIME
// ============================================================

function listenChats() {

  unsubscribeChats = onSnapshot(
    collection(db, "chats"),

    (snapshot) => {

      const chats = [];

      let unread = 0;


      snapshot.forEach(docSnap => {

        const chat = {
          id: docSnap.id,
          ...docSnap.data()
        };


        const sellerEmail =
          normalizeEmail(
            chat.sellerEmail
          );


        const sellerId =
          chat.sellerId ||
          chat.sellerUID;


        const belongsToSeller =
          sellerEmail ===
            normalizeEmail(currentUser?.email)
          ||
          sellerId === currentUser?.uid;


        if (!belongsToSeller) {
          return;
        }


        chats.push(chat);

        unread +=
          Number(chat.unreadSeller || 0);

      });


      chats.sort((a, b) => {

        const aTime =
          getDate(a.updatedAt)?.getTime() || 0;

        const bTime =
          getDate(b.updatedAt)?.getTime() || 0;

        return bTime - aTime;

      });


      setText(
        "msgCount",
        unread
      );


      const unreadBadge =
        document.querySelector(
          ".unread-badge"
        );

      if (unreadBadge) {
        unreadBadge.textContent =
          unread;
      }


      renderChats(chats);

    },

    (error) => {

      console.error(
        "Chats listener error:",
        error
      );

    }
  );

}


// ============================================================
// CHAT UI
// ============================================================

function renderChats(chats) {

  const box =
    $("chatSection");

  if (!box) {
    return;
  }


  if (!chats.length) {

    box.innerHTML = `
      <div class="empty-state">
        No chats yet
      </div>
    `;

    return;
  }


  box.innerHTML =
    chats.slice(0, 12).map(chat => {

      const unread =
        Number(chat.unreadSeller || 0);


      const date =
        getDate(chat.updatedAt);


      return `
        <div class="chat-card">

          <div class="chat-top">

            <h3>
              👤
              ${safeText(
                chat.buyerName ||
                chat.buyerEmail ||
                "Customer"
              )}
            </h3>

            ${
              unread > 0
                ? `<span class="red-dot"></span>`
                : ""
            }

          </div>


          <p class="last-msg">

            💬
            ${safeText(
              chat.lastMessage ||
              "No messages"
            )}

          </p>


          <small>
            ${
              date
                ? date.toLocaleString()
                : ""
            }
          </small>


          <br><br>


          <button
            onclick="openChat('${safeText(chat.id)}')"
          >
            Open Chat
          </button>

        </div>
      `;

    }).join("");

}


// ============================================================
// OPEN CHAT
// ============================================================

window.openChat = (id) => {

  localStorage.setItem(
    "chatId",
    id
  );

  window.location.href =
    `chat.html?id=${encodeURIComponent(id)}`;

};


// ============================================================
// PROFILE MENU
// ============================================================

window.toggleProfileMenu = function () {

  const menu =
    $("profileMenu");

  if (!menu) {
    return;
  }

  menu.classList.toggle("show");

};


window.openStore = () => {

  window.location.href =
    "edit-store.html";

};


window.goDashboard = () => {

  window.location.href =
    "dashboard.html";

};


document.addEventListener(
  "click",
  (event) => {

    const profile =
      $("userProfile");

    const menu =
      $("profileMenu");

    if (!profile || !menu) {
      return;
    }


    if (!profile.contains(event.target)) {

      menu.classList.remove(
        "show"
      );

    }

  }
);


// ============================================================
// CLEAR DASHBOARD WHEN LOGGED OUT
// ============================================================

function clearDashboard() {

  setText("userName", "Seller");

  setText(
    "userEmail",
    "Not logged in"
  );

  setText(
    "welcomeName",
    "Seller"
  );

  setText(
    "myProducts",
    "0"
  );

  setText(
    "myOrders",
    "0"
  );

  setText(
    "myEarnings",
    "Rs 0"
  );

  setText(
    "todayRevenue",
    "Rs 0"
  );

  setText(
    "monthRevenue",
    "Rs 0"
  );

  setText(
    "pendingOrders",
    "0"
  );

  setText(
    "pendingOrders2",
    "0"
  );

  setText(
    "processingOrders",
    "0"
  );

  setText(
    "shippedOrders",
    "0"
  );

  setText(
    "completedOrders",
    "0"
  );

  setText(
    "cancelledOrders",
    "0"
  );

  setText(
    "msgCount",
    "0"
  );

}


// ============================================================
// INITIAL LOG
// ============================================================

console.log(
  "🚀 LeanGelo Seller Dashboard loaded"
);