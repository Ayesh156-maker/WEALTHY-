import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",
  authDomain: "mylamborghini.firebaseapp.com",
  projectId: "mylamborghini",
  storageBucket: "mylamborghini.appspot.com",
  messagingSenderId: "817085836076",
  appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89"
};

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

// ================= CLOUDINARY UPLOAD =================
async function uploadImage(file) {

  const cloudName = "dxpizcvi5";
  const uploadPreset = "ayeshleangelo";

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(url, {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  return data.secure_url;
}

// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    showToast("Please login first");
    window.location.href = "landing.html";
    return;
  }

  currentUser = user;

  await loadStore();
});

// ================= LOAD STORE =================
async function loadStore() {

  try {

    const storeRef = doc(db, "stores", currentUser.uid);
    const snap = await getDoc(storeRef);

    if (!snap.exists()) return;

    const store = snap.data();

    const storeName = document.getElementById("storeName");
    const storeDescription = document.getElementById("storeDescription");
    const logoPreview = document.getElementById("logoPreview");
    const bannerPreview = document.getElementById("bannerPreview");
    const logoInput = document.getElementById("storeLogo");
    const bannerInput = document.getElementById("storeBanner");
    

    if (storeName) storeName.value = store.name || "";
    if (storeDescription) storeDescription.value = store.description || "";

    if (logoInput) logoInput.value = store.logo || "";
    if (bannerInput) bannerInput.value = store.banner || "";

    if (logoPreview)
      logoPreview.src = store.logo || "https://via.placeholder.com/150";

    if (bannerPreview)
      bannerPreview.src = store.banner || "https://via.placeholder.com/1200x300";

  } catch (err) {
    console.log(err);
  }
}

// ================= SAVE STORE =================
const saveBtn = document.getElementById("saveStoreBtn");

if (saveBtn) {
  saveBtn.addEventListener("click", saveStore);
}

async function saveStore() {

  try {

    const storeName = document.getElementById("storeName").value;
    const description = document.getElementById("storeDescription").value;

    const logoInputFile = document.getElementById("logoFile");
const bannerInputFile = document.getElementById("bannerFile");

const logoFile = logoInputFile ? logoInputFile.files[0] : null;
const bannerFile = bannerInputFile ? bannerInputFile.files[0] : null;

    let logoUrl = "";
    let bannerUrl = "";

    if (logoFile) {
      logoUrl = await uploadImage(logoFile);
    }

    if (bannerFile) {
      bannerUrl = await uploadImage(bannerFile);
    }

    await setDoc(
      doc(db, "stores", currentUser.uid),
      {
        ownerId: currentUser.uid,
        ownerName: currentUser.displayName || "",
        ownerEmail: currentUser.email || "",
        name: storeName,
        description: description,
         sellerId: auth.currentUser.uid,
        ...(logoUrl && { logo: logoUrl }),
        ...(bannerUrl && { banner: bannerUrl }),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    showToast("Store Saved Successfully");

  } catch (err) {
    console.log(err);
    showToast(err.message);
  }
}

// ================= LIVE PREVIEW =================
const logoInput = document.getElementById("storeLogo");
if (logoInput) {
  logoInput.addEventListener("input", (e) => {
    const preview = document.getElementById("logoPreview");
    if (preview) {
      preview.src = e.target.value || "https://via.placeholder.com/150";
    }
  });
}

const bannerInput = document.getElementById("storeBanner");
if (bannerInput) {
  bannerInput.addEventListener("input", (e) => {
    const preview = document.getElementById("bannerPreview");
    if (preview) {
      preview.src = e.target.value || "https://via.placeholder.com/1200x300";
    }
  });
}