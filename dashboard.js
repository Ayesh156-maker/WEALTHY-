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
  getDocs,
  doc,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// ================= FIREBASE =================
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

// ================= GLOBALS =================
let salesChart = null;
let lineChart = null;

// ================= LOGIN =================
window.googleLogin = async () => {
  await signInWithPopup(auth, provider);
};

// ================= LOGOUT =================
window.logout = async () => {
  await signOut(auth);

  const loginBtn = document.getElementById("loginBtn");
  if(loginBtn) loginBtn.style.display = "block";
};

// ================= AUTH =================
onAuthStateChanged(auth, (user) => {

  const loginBtn = document.getElementById("loginBtn");

  if (!user) {
    if(loginBtn) loginBtn.style.display = "block";
    return;
  }

  if(loginBtn) loginBtn.style.display = "none";

  const email = user.email.toLowerCase().trim();

  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");
  const userPhoto = document.getElementById("userPhoto");

  if (userName) userName.innerText = user.displayName || "";
  if (userEmail) userEmail.innerText = user.email || "";
  if (userPhoto) userPhoto.src = user.photoURL || "";

  loadStoreUI(user.uid);
  loadDashboard(email);
  listenChats(email);
  listenOrders(email);
});

// ================= STORE UI =================
function loadStoreUI(uid) {
  onSnapshot(doc(db, "stores", uid), (snap) => {
    if (!snap.exists()) return;

    const store = snap.data();

    const banner = document.getElementById("dashboardBanner");
    const logo = document.getElementById("userPhoto");
    const name = document.getElementById("dashboardStoreName");

    if (banner) banner.src = store.banner || "";
    if (logo) logo.src = store.logo || "";
    if (name) name.innerText = store.name || "My Store";
  });
}
// ================= OPEN STORE =================
window.openStore = () => {
  window.location.href = "edit-store.html";
};
window.addEventListener("DOMContentLoaded", () => {

  const userProfile = document.getElementById("userProfile");
  const profileMenu = document.getElementById("profileMenu");

  if (userProfile && profileMenu) {

    userProfile.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      profileMenu.classList.remove("show");
    });

  }

});
// ================= PRODUCTS =================
function loadDashboard(email) {
  const q = query(collection(db, "products"), where("email", "==", email));

  getDocs(q).then((snap) => {
    let html = "";
    let count = 0;

    snap.forEach((d) => {
      const p = d.data();
      count++;

      html += `
        <div class="product-card">
          <img src="${p.image}" />
          <h3>${p.brand}</h3>
          <p>Rs ${p.price}</p>
        </div>
      `;
    });

    const productCount = document.getElementById("myProducts");
    const productList = document.getElementById("myProductList");

    if (productCount) productCount.innerText = count;
    if (productList) productList.innerHTML = html;
  });
}

// ================= ORDERS + CHARTS =================
function listenOrders(email) {
  onSnapshot(collection(db, "orders"), (snapshot) => {

    let orders = 0;
    let earnings = 0;

    const monthly = {
      Jan:0, Feb:0, Mar:0, Apr:0, May:0, Jun:0,
      Jul:0, Aug:0, Sep:0, Oct:0, Nov:0, Dec:0
    };

    snapshot.forEach((docSnap) => {
      const order = docSnap.data();
      if (!order.cart) return;

      
      order.cart.forEach((item) => {
console.log(item);
console.log(email);
  if (item.sellerEmail === email) {

    const qty = Number(item.quantity || 1);
    const price = Number(item.price || 0);

    // Quantity අනුව Orders Count
    orders += qty;

    // Quantity අනුව Earnings
    earnings += price * qty;

    const date = order.createdAt?.toDate
      ? order.createdAt.toDate()
      : new Date(order.createdAt);

    const month = date.toLocaleString("en-US", {
      month: "short"
    });

    monthly[month] += price * qty;
  }

});
    });

    const myOrders = document.getElementById("myOrders");
    const myEarnings = document.getElementById("myEarnings");

    if (myOrders) myOrders.innerText = orders;
    if (myEarnings) myEarnings.innerText = "Rs " + earnings;

    updateCharts(Object.keys(monthly), Object.values(monthly));
  });
}

// ================= CHARTS =================
function updateCharts(labels, data) {

  const barCtx = document.getElementById("salesChart");
  const lineCtx = document.getElementById("salesLineChart");

  if (!barCtx || !lineCtx) return;

  if (salesChart) {
    salesChart.data.labels = labels;
    salesChart.data.datasets[0].data = data;
    salesChart.update();
  } else {
    salesChart = new Chart(barCtx, {
  type: "bar",
  data: {
    labels,
    datasets: [{
      label: "Monthly Revenue",
      data,
      backgroundColor: "#ffb547",
      borderRadius: 12,
      borderSkipped: false,
      maxBarThickness: 40
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        labels: {
          color: "#ffffff",
          font: {
            size: 14,
            weight: "bold"
          }
        }
      },
      tooltip: {
        backgroundColor: "#111",
        titleColor: "#fff",
        bodyColor: "#ffb547",
        padding: 12,
        cornerRadius: 10
      }
    },

    scales: {
      x: {
        ticks: {
          color: "#ffffff"
        },
        grid: {
          color: "rgba(255,255,255,0.05)"
        }
      },

      y: {
        beginAtZero: true,
        ticks: {
          color: "#ffffff"
        },
        grid: {
          color: "rgba(255,255,255,0.08)"
        }
      }
    }
  }
});
  }

  if (lineChart) {
    lineChart.data.labels = labels;
    lineChart.data.datasets[0].data = data;
    lineChart.update();
  } else {

    const ctx = lineCtx.getContext("2d");

    const gradient = ctx.createLinearGradient(0,0,0,300);
    gradient.addColorStop(0, "rgba(255,181,71,0.6)");
    gradient.addColorStop(1, "rgba(255,181,71,0)");

    lineChart = new Chart(lineCtx, {
  type: "line",
  data: {
    labels,
    datasets: [{
      label: "Revenue Trend",
      data,
      borderColor: "#ffb547",
      backgroundColor: gradient,
      fill: true,

      tension: 0.4,
      pointRadius: 5,
      pointHoverRadius: 8,
      pointBackgroundColor: "#fff",
      pointBorderColor: "#ffb547",
      pointBorderWidth: 3
    }]
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
        backgroundColor: "#111",
        bodyColor: "#ffb547",
        cornerRadius: 10
      }
    },

    scales: {
      x: {
        ticks: {
          color: "#ffffff"
        },
        grid: {
          color: "rgba(255,255,255,0.05)"
        }
      },

      y: {
        beginAtZero: true,
        ticks: {
          color: "#ffffff"
        },
        grid: {
          color: "rgba(255,255,255,0.08)"
        }
      }
    }
  }
});
  }
}

// ================= LIVE CHATS =================
function listenChats(email) {

  const box = document.getElementById("chatSection");
  const msgCount = document.getElementById("msgCount");

  onSnapshot(collection(db, "chats"), (snapshot) => {

    let unread = 0;
    let chats = [];

    snapshot.forEach((docSnap) => {

      const chat = docSnap.data();

      if (
        (chat.sellerEmail || "")
          .toLowerCase()
          .trim() !== email
      ) return;

      chats.push({
        id: docSnap.id,
        ...chat
      });

      unread += Number(chat.unreadSeller || 0);
    });

    chats.sort(
      (a, b) =>
      (b.updatedAt?.seconds || 0) -
      (a.updatedAt?.seconds || 0)
    );

    if (msgCount) {
      msgCount.textContent = unread;
    }

    if (!box) return;

    box.innerHTML = "";

    chats.forEach(chat => {

      box.innerHTML += `
<div class="chat-card">

  <div class="chat-top">

    <h3>
      👤 ${chat.buyerName || chat.buyerEmail || "Customer"}
    </h3>

    ${
      Number(chat.unreadSeller || 0) > 0
      ? `<span class="red-dot"></span>`
      : ``
    }

  </div>

  <p class="last-msg">
    💬 ${chat.lastMessage || "No messages"}
  </p>

  <small>
    ${
      chat.updatedAt
      ? new Date(chat.updatedAt.seconds * 1000).toLocaleString()
      : ""
    }
  </small>

  <br><br>

  <button onclick="openChat('${chat.id}')">
    Open Chat
  </button>

</div>
`;
    });

  });

}

// ================= OPEN CHAT =================
window.openChat = (id) => {
  localStorage.setItem("chatId", id);
  window.location.href = "chat.html";
};
window.toggleProfileMenu = function () {
  const menu = document.getElementById("profileMenu");
  if (!menu) return;

  menu.classList.toggle("show");
};