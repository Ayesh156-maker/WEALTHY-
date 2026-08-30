// ================= FIREBASE IMPORTS =================
import { GoogleGenerativeAI } from 
"https://esm.run/@google/generative-ai";
import { initializeApp } 
  from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import {
  setupPresence
} from "./presence.js";


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
const db = getFirestore(app);
const auth = getAuth(app);
const realtimeDB = getDatabase(app);

// ================= GLOBAL VARIABLES =================
const chatId = localStorage.getItem("chatId");
const messagesDiv = document.getElementById("messages");
const typingIndicator = document.getElementById("typingIndicator");
const genAI = new GoogleGenerativeAI("AQ.Ab8RN6KrESbnK0B8XZ7G1K7DeyeVO8cQI-9b41e-L00kliq0yQ");

const aiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash"
});
let currentRole = "";
let currentChatData = null;
let unsubscribeMessages = null;
let unsubscribeChatDoc = null;
let unsubscribeSellerPresence = null;
let selectedFile = null;
let selectedReply = null;
let reactionMessageId = null;
let sellerOnline = false;
let sending = false;
let aiReplyTimer = null;

const previewBox = document.getElementById("imagePreviewBox");
const previewImage = document.getElementById("imagePreview");
const removePreview = document.getElementById("removePreview");

// Remove Preview Handler
if (removePreview) {
  removePreview.onclick = () => {
    selectedFile = null;
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";
    if (previewBox) previewBox.style.display = "none";
  };
}

// ================= LOGIN CHECK =================
onAuthStateChanged(auth, async (user) => {
  if (!user || !chatId) return;

  await loadChatInfo(user);

  // Setup presence if current user is seller
  if (
    currentChatData &&
    currentChatData.sellerEmail &&
    currentChatData.sellerEmail.toLowerCase() === user.email.toLowerCase()
  ) {
    setupPresence(realtimeDB, user);
  }

  loadMessages(user);
  listenToChatDoc();
});

// ================= LOAD CHAT INFO =================
async function loadChatInfo(user) {
  try {
    const chatRef = doc(db, "chats", chatId);
    const snap = await getDoc(chatRef);

    if (!snap.exists()) {
      console.log("Chat not found");
      return;
    }

    currentChatData = snap.data();

    if (currentChatData.sellerId) {
      listenSellerStatus(currentChatData.sellerId);
    }

    // ROLE CHECK
    if (
      currentChatData.sellerEmail &&
      currentChatData.sellerEmail.toLowerCase() === user.email.toLowerCase()
    ) {
      currentRole = "seller";
    } else {
      currentRole = "buyer";
    }

    // BUYER STORE LOGO FETCHING LOGIC
    let buyerProfileImage = currentChatData.buyerPhoto || "https://placehold.co/100";

    try {
      const storeRef = doc(db, "stores", user.uid);
      const storeSnap = await getDoc(storeRef);
      if (storeSnap.exists() && storeSnap.data().logo) {
        buyerProfileImage = storeSnap.data().logo;
      }
    } catch (e) {
      console.log("Error fetching buyer store logo:", e);
    }

    // DISPLAY OTHER USER PROFILE IN HEADER
    const sellerNameEl = document.getElementById("chatSellerName");
    const sellerPhotoEl = document.getElementById("chatSellerPhoto");

    if (currentRole === "seller") {
      if (sellerNameEl) sellerNameEl.innerText = currentChatData.buyerName || "Buyer";
      if (sellerPhotoEl) sellerPhotoEl.src = buyerProfileImage;
    } else {
      if (sellerNameEl) sellerNameEl.innerText = currentChatData.sellerName || "Seller";
      if (sellerPhotoEl) sellerPhotoEl.src = currentChatData.sellerPhoto || "https://placehold.co/100";
    }

    // UPDATE BUYER HIDDEN FIELDS / SIDEBAR
    const buyerNameEl = document.getElementById("chatBuyerName");
    const buyerPhotoEl = document.getElementById("chatBuyerPhoto");
    if (buyerNameEl) buyerNameEl.innerText = currentChatData.buyerName || "You";
    if (buyerPhotoEl) buyerPhotoEl.src = buyerProfileImage;

    // RESET UNREAD COUNT
    if (currentRole === "seller") {
      await updateDoc(chatRef, { unreadSeller: 0 });
    } else {
      await updateDoc(chatRef, { unreadBuyer: 0 });
    }
  } catch (err) {
    console.error("Error loading chat info:", err);
  }
}

// ================= LOAD MESSAGES =================
function loadMessages(user) {
  if (!messagesDiv) return;

  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const m = docSnap.data();
      const messageId = docSnap.id;

      // Mark unread incoming messages as seen
      if (m.senderEmail !== user.email && m.seen === false) {
        updateDoc(doc(db, "chats", chatId, "messages", messageId), {
          seen: true
        }).catch(err => console.error("Error updating seen status:", err));
      }

      const div = document.createElement("div");
      div.classList.add("msg");

      // Long press for emoji reaction
      let pressTimer;
      div.addEventListener("touchstart", () => {
        pressTimer = setTimeout(() => {
          reactionMessageId = messageId;
          showReactionBar(div);
        }, 600);
      });

      div.addEventListener("touchend", () => {
        clearTimeout(pressTimer);
      });

      // Swipe to reply logic
      let startX = 0;
      let currentX = 0;

      div.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
      });

      div.addEventListener("touchmove", (e) => {
        currentX = e.touches[0].clientX;
        let move = currentX - startX;
        if (move > 0 && move <= 80) {
          div.style.transform = `translateX(${move}px)`;
        }
      });

      div.addEventListener("touchend", () => {
        let distance = currentX - startX;
        div.style.transform = "translateX(0)";
        if (distance > 80) {
          selectedReply = {
            id: messageId,
            text: m.text || (m.fileType === "image" ? "📷 Image" : "📁 Attachment"),
            sender: m.senderEmail
          };
          showReplyPreview();
        }
        startX = 0;
        currentX = 0;
      });

      if (m.senderEmail === user.email) {
        div.classList.add("me");
      } else {
        div.classList.add("other");
      }

      // Avatar
      const img = document.createElement("img");
      img.className = "msg-avatar";
      img.src = m.senderPhotoURL || "https://placehold.co/100";
      div.appendChild(img);

      // Content Box
      const contentDiv = document.createElement("div");
      contentDiv.className = "msg-content";

      // Display reply preview if attached to this message
      if (m.replyTo) {
        const replyQuote = document.createElement("div");
        replyQuote.className = "reply-quote-box";
        replyQuote.style.borderLeft = "3px solid #007bff";
        replyQuote.style.paddingLeft = "6px";
        replyQuote.style.marginBottom = "4px";
        replyQuote.style.fontSize = "0.85em";
        replyQuote.style.opacity = "0.8";
        replyQuote.innerText = `${m.replyTo.sender || 'User'}: ${m.replyTo.text}`;
        contentDiv.appendChild(replyQuote);
      }

      // Text Message
      if (m.text) {
        const textSpan = document.createElement("p");
        textSpan.innerText = m.text;
        contentDiv.appendChild(textSpan);

        if (m.senderEmail === user.email) {
          const tick = document.createElement("span");
          tick.className = "message-tick";
          if (m.seen) {
            tick.innerHTML = " ✓✓";
            tick.style.color = "blue";
          } else {
            tick.innerHTML = " ✓";
            tick.style.color = "gray";
          }
          contentDiv.appendChild(tick);
        }
      }

      // File / Image Attachment
      if (m.fileURL) {
        if (m.fileType === "image") {
          const chatImg = document.createElement("img");
          chatImg.src = m.fileURL;
          chatImg.className = "chat-media-img";
          chatImg.style.maxWidth = "200px";
          chatImg.style.borderRadius = "8px";
          contentDiv.appendChild(chatImg);
        } else {
          const fileLink = document.createElement("a");
          fileLink.href = m.fileURL;
          fileLink.target = "_blank";
          fileLink.innerText = "📁 Download Attachment";
          contentDiv.appendChild(fileLink);
        }
      }

      // Reactions Display
      if (m.reactions && Object.keys(m.reactions).length > 0) {
        const reactionBox = document.createElement("div");
        reactionBox.className = "reaction-display";

        for (const emoji of Object.values(m.reactions)) {
          const span = document.createElement("span");
          span.innerText = emoji;
          span.className = "emoji-reaction";
          reactionBox.appendChild(span);
        }
        contentDiv.appendChild(reactionBox);
      }

      div.appendChild(contentDiv);
      messagesDiv.appendChild(div);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }, (err) => {
    console.error("Error listening to messages:", err);
  });
}

// ================= REPLY & REACTION UI =================
function showReplyPreview() {
  const box = document.getElementById("replyPreview");
  const text = document.getElementById("replyText");

  if (!box || !text || !selectedReply) return;

  text.innerText = `${selectedReply.sender || 'User'}: ${selectedReply.text}`;
  box.style.display = "flex";
}

function showReactionBar(messageDiv) {
  const old = document.getElementById("reactionBar");
  if (old) old.remove();

  const bar = document.createElement("div");
  bar.id = "reactionBar";
  bar.innerHTML = `
    <button>❤️</button>
    <button>👍</button>
    <button>😂</button>
    <button>😮</button>
    <button>🔥</button>
    <button>👎</button>
  `;

  document.body.appendChild(bar);

  const buttons = bar.querySelectorAll("button");
  buttons.forEach(btn => {
    btn.onclick = () => {
      addReaction(reactionMessageId, btn.innerText);
      bar.remove();
    };
  });
}

// Fixed multi-user reaction merge using map syntax
async function addReaction(messageId, emoji) {
  try {
    if (!auth.currentUser || !messageId) return;

    // Sanitize key by replacing periods in email
    const userKey = auth.currentUser.email.replace(/\./g, "_");
    const messageRef = doc(db, "chats", chatId, "messages", messageId);

    await updateDoc(messageRef, {
      [`reactions.${userKey}`]: emoji
    });

    console.log("Reaction saved to Firestore:", emoji);
  } catch (err) {
    console.error("Reaction Firestore Error:", err);
  }
}

// ================= SMART BLOCK CHECK =================
function isSmartBlocked(text) {
  if (!text) return false;
  const t = text.toLowerCase().trim();

  // Phone Numbers
  const phoneRegex = /(\+?\d[\d\s\-]{7,}\d)/;
  // Email
  const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  // URLs
  const urlRegex = /(https?:\/\/|www\.|t\.me|wa\.me|telegram|discord\.gg|instagram\.com|facebook\.com|messenger|viber)/i;
  // Bank Account Numbers
  const bankRegex = /\b\d{8,20}\b/;

  const blockedWords = [
    "whatsapp", "telegram", "signal", "viber", "imo", "wechat", "line",
    "call me", "contact me", "my number", "phone number",
    "bank", "bank account", "account number", "account no", "iban", "swift", "branch",
    "pay outside", "outside payment", "paypal", "payoneer", "western union", "moneygram",
    "cash", "direct transfer", "send money", "commission free", "avoid commission"
  ];

  if (phoneRegex.test(t)) return true;
  if (emailRegex.test(t)) return true;
  if (urlRegex.test(t)) return true;
  if (bankRegex.test(t)) return true;

  return blockedWords.some(word => t.includes(word));
}
async function checkWithAI(message){

try{

const result = await aiModel.generateContent(`

You are a marketplace security AI.

Check this message:

"${message}"

Detect:
- scams
- outside payments
- WhatsApp sharing
- phone numbers
- fraud

Reply only:

ALLOW

or

BLOCK

`);

const response =
result.response.text().trim();

return response.includes("BLOCK");

}
catch(error){

console.error("AI Error:",error);

// AI fail උනොත් normal filter use කරන්න
return isSmartBlocked(message);

}

}
// ================= AI BOT LOGIC =================
function getAIReply(message) {
  if (!message) return "🤖 Thank you for contacting LeanGelo. Seller will reply soon.";
  
  const t = message.toLowerCase();

  if (t.includes("price")) {
    return "🤖 You can check the product price in the product page.";
  }
  if (t.includes("delivery")) {
    return "🤖 Delivery usually takes 3-5 working days.";
  }
  if (t.includes("available")) {
    return "🤖 We will check availability and inform you soon.";
  }

  return "🤖 Thank you for contacting LeanGelo. Seller will reply soon.";
}

async function sendAutoReply(chatId, userMessage) {
  try {
    const replyText = getAIReply(userMessage);
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: replyText,
      senderEmail: "AI",
      senderPhotoURL: "https://cdn-icons-png.flaticon.com/512/4712/4712109.png",
      createdAt: serverTimestamp(),
      seen: false
    });
  } catch (err) {
    console.error("Error sending AI auto reply:", err);
  }
}

// ================= SEND MESSAGE =================
async function sendMessage() {
  if (sending) return;

  const input = document.getElementById("msgInput");
  const text = input ? input.value.trim() : "";

  if (!text && !selectedFile) return;

  // Security & Marketplace Protection Check
  if(text){

const blocked =
await checkWithAI(text);

if(blocked){

showToast(
"Security showToast: This message was blocked."
);

return;

}

}

  // Validate selected file size and type
  if (selectedFile) {
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSizeBytes) {
      showToast("File size exceeds 10MB limit.");
      return;
    }
  }

  sending = true;

  try {
    let fileURL = "";
    let fileType = "";

    // Cloudinary Upload
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", "lean_upload");

      const res = await fetch("https://api.cloudinary.com/v1_1/dxpizcvi5/auto/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Cloudinary upload failed");

      const data = await res.json();
      fileURL = data.secure_url;
      fileType = selectedFile.type.startsWith("image") ? "image" : "file";
    }

    let senderPhoto = auth.currentUser.photoURL || "https://placehold.co/100";

    // Save Message
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: text,
      senderEmail: auth.currentUser.email,
      senderPhotoURL: senderPhoto,
      fileURL: fileURL,
      fileType: fileType,
      replyTo: selectedReply || null,
      createdAt: serverTimestamp(),
      seen: false
    });

    // Debounced AI Auto-Reply if Seller is Offline and Buyer sends message
    if (!sellerOnline && currentRole === "buyer") {
      if (aiReplyTimer) clearTimeout(aiReplyTimer);
      aiReplyTimer = setTimeout(() => {
        sendAutoReply(chatId, text);
      }, 2000);
    }

    // Update Chat Document
    const chatRef = doc(db, "chats", chatId);
    const updateData = {

lastMessage: text || (fileType === "image" ? "📷 Image" : "📁 File"),

lastSender:
auth.currentUser.email,

updatedAt: serverTimestamp()

};

    if (currentRole === "seller") {
      updateData.unreadBuyer = increment(1);
    } else {
      updateData.unreadSeller = increment(1);
    }

    await updateDoc(chatRef, updateData);

    // Reset Form UI
    if (input) input.value = "";
    selectedReply = null;
    selectedFile = null;

    const replyBox = document.getElementById("replyPreview");
    if (replyBox) replyBox.style.display = "none";

    if (previewBox) previewBox.style.display = "none";

    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";

  } catch (err) {
    console.error("Send error:", err);
    showToast("Failed to send message. Please try again.");
  } finally {
    sending = false;
  }
}

// ================= BUTTON & KEYBOARD EVENTS =================
const sendBtn = document.getElementById("sendBtn");
if (sendBtn) sendBtn.addEventListener("click", sendMessage);

const msgInput = document.getElementById("msgInput");
if (msgInput) {
  msgInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Typing Status Listener
  let typingTimer;
  msgInput.addEventListener("input", async () => {
    if (!auth.currentUser || !chatId) return;

    try {
      await updateDoc(doc(db, "chats", chatId), {
        typingBy: auth.currentUser.email
      });
    } catch (e) {
      console.error("Typing status error:", e);
    }

    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      updateDoc(doc(db, "chats", chatId), {
        typingBy: ""
      }).catch(err => console.error("Clear typing error:", err));
    }, 1500);
  });
}

// ================= FILE UPLOAD LISTENER =================
const fileBtn = document.getElementById("fileBtn");
const fileInput = document.getElementById("fileInput");

if (fileBtn && fileInput) {
  fileBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    selectedFile = file;
    if (previewImage) previewImage.src = URL.createObjectURL(file);
    if (previewBox) previewBox.style.display = "block";
  });
}

// ================= TYPING INDICATOR LISTENER =================
if (chatId) {
  onSnapshot(doc(db, "chats", chatId), (snapshot) => {
    const data = snapshot.data();
    if (!data || !auth.currentUser || !typingIndicator) return;

    if (data.typingBy && data.typingBy !== auth.currentUser.email) {
      typingIndicator.innerHTML = "✍️ typing...";
    } else {
      typingIndicator.innerHTML = "";
    }
  });
}

// ================= DELIVERY SYSTEM =================
const deliverBtn = document.getElementById("deliverBtn");
const approveBtn = document.getElementById("approveBtn");

function updateDeliveryUI() {
  if (!currentChatData) return;

  const statusBox = document.getElementById("deliveryStatus");
  const fileBox = document.getElementById("deliveryFileBox");

  if (!statusBox || !fileBox) return;

  if (deliverBtn) deliverBtn.style.display = "none";
  if (approveBtn) approveBtn.style.display = "none";
  fileBox.innerHTML = "";

  const status = currentChatData.status || "active";

  if (status === "active") {
    statusBox.innerHTML = "🟡 Project In Progress";
    if (currentRole === "seller" && deliverBtn) {
      deliverBtn.style.display = "block";
    }
  } else if (status === "delivered") {
    statusBox.innerHTML = "📦 Project Delivered";
    if (currentRole === "buyer" && approveBtn) {
      approveBtn.style.display = "block";
    }

    if (currentChatData.deliveryFile) {
      fileBox.innerHTML = `
        <a href="${currentChatData.deliveryFile}" target="_blank">
          📥 Download Final Project
        </a>
      `;
    }
  } else if (status === "completed") {
    statusBox.innerHTML = "✅ Order Completed";
  }
}

async function deliverProject() {
  const picker = document.createElement("input");
  picker.type = "file";

  picker.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "lean_upload");

      const res = await fetch("https://api.cloudinary.com/v1_1/dxpizcvi5/auto/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      await updateDoc(doc(db, "chats", chatId), {
        status: "delivered",
        deliveryFile: data.secure_url,
        deliveryName: file.name,
        deliveredAt: serverTimestamp()
      });

      showToast("Project Delivered!");
    } catch (err) {
      console.error(err);
      showToast("Delivery upload failed!");
    }
  };

  picker.click();
}

async function approveDelivery() {
  try {
    await updateDoc(doc(db, "chats", chatId), {
      status: "completed",
      completedAt: serverTimestamp()
    });

    showToast("Order Completed 🎉");
  } catch (err) {
    console.error("Approve delivery error:", err);
  }
}

if (deliverBtn) deliverBtn.addEventListener("click", deliverProject);
if (approveBtn) approveBtn.addEventListener("click", approveDelivery);

window.openSellerPage = function () {
  if (!currentChatData) return;

  if (!currentChatData.sellerId) {
    showToast("Seller not found");
    return;
  }

  window.location.href = `seller2.html?id=${currentChatData.sellerId}`;
};

// ================= REALTIME CHAT DOCUMENT LISTENER =================
function listenToChatDoc() {
  if (!chatId) return;

  if (unsubscribeChatDoc) unsubscribeChatDoc();

  unsubscribeChatDoc = onSnapshot(doc(db, "chats", chatId), (snapshot) => {
    if (!snapshot.exists()) return;
    currentChatData = snapshot.data();
    updateDeliveryUI();
  }, (err) => {
    console.error("Error listening to chat doc:", err);
  });
}

// ================= SELLER PRESENCE LISTENER =================
function listenSellerStatus(sellerUid) {
  if (!sellerUid) return;

  if (unsubscribeSellerPresence) {
    unsubscribeSellerPresence();
  }

  const statusRef = ref(realtimeDB, "presence/" + sellerUid);

  unsubscribeSellerPresence = onValue(statusRef, (snapshot) => {
    const data = snapshot.val();
    const statusEl = document.getElementById("sellerOnlineStatus");

    if (data && data.online === true) {
      sellerOnline = true;
      if (statusEl) {
        statusEl.innerHTML = "🟢 Online";
        statusEl.className = "online-status";
      }
    } else {
      sellerOnline = false;
      if (statusEl) {
        statusEl.innerHTML = "⚫ Offline";
        statusEl.className = "offline-status";
      }
    }
  }, (err) => {
    console.error("Error listening to seller status:", err);
  });
}