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
    addDoc,
    serverTimestamp
} from
"https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {

    apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",

    authDomain: "mylamborghini.firebaseapp.com",

    projectId: "mylamborghini",

    storageBucket: "mylamborghini.firebasestorage.app",

    messagingSenderId: "817085836076",

    appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89",

    measurementId: "G-RY79N9C9R1"

};



// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// =====================================================
// EXPORT
// =====================================================

export {
    app,
    auth,
    db,
    onAuthStateChanged,
    collection,
    addDoc,
    serverTimestamp
};