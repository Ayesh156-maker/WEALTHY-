// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
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
  orderBy,
  onSnapshot,
  limit
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",
  authDomain: "mylamborghini.firebaseapp.com",
  projectId: "mylamborghini",
  storageBucket: "mylamborghini.firebasestorage.app",
  messagingSenderId: "817085836076",
  appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89"
};

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ================= AUTH CHECK =================
onAuthStateChanged(auth, async (user) => {
if (user) {
    console.log("Buyer Login:", user.email);

    await loadBuyerProfile(user.uid);
    await loadOrders(user.email);
    await loadDigitalDownloads(user.email);
    loadRecentChats(user.email);

    // ================= REALTIME WISHLIST COUNT =================
    loadWishlistCount(user.uid);
} else {
    window.location.href = "artist-login.html";
  }
});

// ================= LOAD PROFILE =================
async function loadBuyerProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));

    if (snap.exists()) {
      const data = snap.data();
      const name = data.name || "Buyer";

      document.getElementById("buyerName").innerText = name;
      document.getElementById("profileName").innerText = name;
      document.getElementById("profileEmail").innerText = data.email || "";
      document.getElementById("credits").innerText = data.credits || 0;

      if (data.photo) {
        document.getElementById("profileImage").src = data.photo;
        document.getElementById("buyerProfileImage").src = data.photo;
      }
    }
  } catch (error) {
    console.log("Profile Error:", error);
  }
}

// ================= LOAD ORDERS =================
async function loadOrders(email) {
  try {
    const q = query(
      collection(db, "orders"),
      where("buyerEmail", "==", email)
    );

    const result = await getDocs(q);
    let html = "";
    let count = 0;

    result.forEach((order) => {
      count++;
      const data = order.data();
      let items = "";

      if (data.cart) {
        data.cart.forEach(item => {
          items += item.name + "<br>";
        });
      }

      html += `
        <tr>
          <td>${items || "Order"}</td>
          <td>Rs.${data.total || 0}</td>
        </tr>
      `;
    });

    const orderBox = document.getElementById("recentOrders");
    if (orderBox) {
      orderBox.innerHTML = html || `<tr><td colspan="2">No Orders</td></tr>`;
    }

    const total = document.getElementById("totalOrders");
    if (total) {
      total.innerText = count;
    }
  } catch (error) {
    console.log("Order Error:", error);
  }
}

// ================= LOAD PURCHASED DIGITAL DOWNLOADS =================
async function loadDigitalDownloads(email) {
  try {
    const q = query(
      collection(db, "orders"),
      where("buyerEmail", "==", email)
    );

    const result = await getDocs(q);
    let html = "";
    let count = 0;

    result.forEach((order) => {
      const data = order.data();

      if (data.cart) {
        data.cart.forEach(item => {
          if (item.downloadUrl) {
            count++;
            html += `
              <div class="download-card">
                <img 
                  src="${item.image || 'https://placehold.co/250'}"
                  alt="${item.name}"
                  style="width:250px; height:180px; object-fit:cover; border-radius:15px;"
                >
                <div>
                  <h3>${item.name}</h3>
                  <p>Digital Artwork Purchased</p>
                  <a href="${item.downloadUrl}" target="_blank">
                    <button><i class="fas fa-download"></i> Download</button>
                  </a>
                </div>
              </div>
            `;
          }
        });
      }
    });

    const box = document.getElementById("downloads");
    if (box) {
      box.innerHTML = count > 0 ? html : `<p>No Purchased Digital Downloads</p>`;
    }

    console.log("Digital Downloads:", count);
  } catch (error) {
    console.log("Digital Download Error:", error);
  }
}

// ================= LOAD RECENT CHATS =================
function loadRecentChats(email) {
  try {
    const q = query(
      collection(db, "chats"),
      where("buyerEmail", "==", email),
      orderBy("updatedAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
      let html = "";
      let count = 0;

      snapshot.forEach((chat) => {
        const data = chat.data();
        count++;

        html += `
          <div class="chat-card">
            <div class="chat-info">
              <h3>${data.sellerName || "Seller"}</h3>
              <p>${data.lastMessage || "New Message"}</p>
            </div>
            <button class="chat-btn" onclick="openChat('${chat.id}')">
              <i class="fas fa-comments"></i> Chat
            </button>
          </div>
        `;
      });

      const box = document.getElementById("recentChats");
      if (box) {
        box.innerHTML = count > 0 ? html : `<p>No Recent Chats</p>`;
      }

      console.log("Realtime Chats:", count);
    }, (error) => {
      console.log("Realtime Chat Error:", error);
    });
  } catch (error) {
    console.log("Recent Chat Error:", error);
  }
}

// ================= LOAD WISHLIST COUNT =================
function loadWishlistCount(uid) {
    try {

        const wishlistRef = collection(
            db,
            "users",
            uid,
            "wishlist"
        );

        onSnapshot(
            wishlistRef,
            (snapshot) => {

                const count = snapshot.size;

                const wishlistCount =
                    document.getElementById("wishlistCount");

                if (wishlistCount) {
                    wishlistCount.innerText = count;
                }

                console.log("Wishlist Count:", count);
            },
            (error) => {
                console.log(
                    "Wishlist Realtime Error:",
                    error
                );
            }
        );

    } catch (error) {
        console.log(
            "Wishlist Count Error:",
            error
        );
    }
}
// ================= OPEN CHAT =================
window.openChat = function(chatId) {
  localStorage.setItem("chatId", chatId);
  window.location.href = "chat.html";
};

// ================= LOGOUT =================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = () => {
    signOut(auth).then(() => {
      window.location.href = "artist-login.html";
    });
  };
}
// ================= EDIT PROFILE =================
const editProfileBtn = document.getElementById("editProfileBtn");

if (editProfileBtn) {
    editProfileBtn.onclick = () => {
        window.location.href = "customize.html";
    };
}
