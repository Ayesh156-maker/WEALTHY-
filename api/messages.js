// ================= FIREBASE IMPORTS =================

import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot,
    orderBy
} from
"https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


// ================= FIREBASE CONFIG =================

const firebaseConfig = {
  apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",
  authDomain: "mylamborghini.firebaseapp.com",
  projectId: "mylamborghini",
  storageBucket: "mylamborghini.firebasestorage.app",
  messagingSenderId: "817085836076",
  appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89"
};



// ================= INITIALIZE =================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ================= ELEMENTS =================

const messagesList =
    document.getElementById("messagesList");

const chatCount =
    document.getElementById("chatCount");


// ================= AUTH =================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    loadRecentChats(user);

});
function loadRecentChats(user) {

    const chatsRef = collection(db, "chats");

    const q = query(

        chatsRef,

        where("buyerEmail", "==", user.email),

        orderBy("updatedAt", "desc")

    );


    onSnapshot(q, (snapshot) => {

        messagesList.innerHTML = "";

        chatCount.textContent =
            `${snapshot.size} chat${snapshot.size === 1 ? "" : "s"}`;


        console.log("Chats found:", snapshot.size);


        if (snapshot.empty) {

            messagesList.innerHTML = `

                <div class="empty-messages">

                    <i class="fas fa-comments"></i>

                    <h3>No messages yet</h3>

                    <p>
                        Your conversations with sellers
                        will appear here.
                    </p>

                </div>

            `;

            return;

        }


        snapshot.forEach((docSnap) => {

            const chat = docSnap.data();

            console.log("Chat:", docSnap.id, chat);

            createChatItem(docSnap.id, chat, user);

        });

    }, (error) => {

        console.error("Messages error:", error);

        messagesList.innerHTML = `

            <div class="empty-messages">

                <i class="fas fa-exclamation-triangle"></i>

                <h3>Unable to load messages</h3>

                <p>
                    ${error.message}
                </p>

            </div>

        `;

    });

}
// ================= CREATE CHAT ITEM =================

function createChatItem(chatId, chat, user) {

    const div = document.createElement("div");

    div.className = "message-item";


    const otherUserName =
        chat.sellerUid === user.uid
            ? (chat.sellerName || "Seller")
            : (chat.buyerName || "Buyer");


    const otherUserImage =
        chat.sellerUid === user.uid
            ? (chat.sellerImage || "https://via.placeholder.com/60")
            : (chat.buyerImage || "https://via.placeholder.com/60");


    const lastMessage =
        chat.lastMessage || "No messages yet";


    const time =
        formatTime(chat.updatedAt);


    div.innerHTML = `

        <img
            src="${otherUserImage}"
            class="chat-avatar"
            onerror="this.src='https://via.placeholder.com/60'"
        >


        <div class="chat-info">

            <div class="chat-top">

                <h3>
                    ${escapeHTML(otherUserName)}
                </h3>

                <span class="chat-time">
                    ${time}
                </span>

            </div>


            <p class="last-message">

                ${escapeHTML(lastMessage)}

            </p>

        </div>


        <i class="fas fa-chevron-right chat-arrow"></i>

    `;


    div.addEventListener("click", () => {

        window.location.href =
            `chat.html?chatId=${encodeURIComponent(chatId)}`;

    });


    messagesList.appendChild(div);

}


// ================= TIME =================

function formatTime(timestamp) {

    if (!timestamp) return "";

    try {

        const date = timestamp.toDate();

        return date.toLocaleString([], {

            month: "short",

            day: "numeric",

            hour: "2-digit",

            minute: "2-digit"

        });

    } catch {

        return "";

    }

}


// ================= SECURITY =================

function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;

}