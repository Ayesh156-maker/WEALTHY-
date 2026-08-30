// ======================================================
// FIREBASE IMPORTS
// ======================================================

import {
    initializeApp
}
from
"https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";


import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
}
from
"https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


import {
    getAuth,
    onAuthStateChanged
}
from
"https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";


// ======================================================
// FIREBASE CONFIG
// ======================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",

    authDomain:
        "mylamborghini.firebaseapp.com",

    projectId:
        "mylamborghini",

    storageBucket:
        "mylamborghini.appspot.com",

    messagingSenderId:
        "817085836076",

    appId:
        "1:817085836076:web:dafa36f41d1ec24a5c5a89"
};


// ======================================================
// INITIALIZE FIREBASE
// ======================================================

const app =
    initializeApp(firebaseConfig);

const db =
    getFirestore(app);

const auth =
    getAuth(app);


// ======================================================
// CURRENT USER
// ======================================================

let currentUser = null;


// ======================================================
// HTML ELEMENTS
// ======================================================

const saveStoreBtn =
    document.getElementById(
        "saveStoreBtn"
    );

const saveText =
    document.getElementById(
        "saveText"
    );

const loader =
    document.getElementById(
        "loader"
    );


const storeName =
    document.getElementById(
        "storeName"
    );

const storeDescription =
    document.getElementById(
        "storeDescription"
    );


const artistName =
    document.getElementById(
        "artistName"
    );

const locationInput =
    document.getElementById(
        "location"
    );

const socialLink =
    document.getElementById(
        "socialLink"
    );

const contactEmail =
    document.getElementById(
        "contactEmail"
    );

const featuredMessage =
    document.getElementById(
        "featuredMessage"
    );


const fileLogo =
    document.getElementById(
        "fileLogo"
    );

const fileBanner =
    document.getElementById(
        "fileBanner"
    );


const logoPreview =
    document.getElementById(
        "logoPreview"
    );

const bannerPreview =
    document.getElementById(
        "bannerPreview"
    );


// ======================================================
// CLOUDINARY CONFIG
// ======================================================

const CLOUDINARY_CLOUD_NAME =
    "dxpizcvi5";

const CLOUDINARY_UPLOAD_PRESET =
    "ayeshleangelo";


// ======================================================
// CLOUDINARY IMAGE UPLOAD
// ======================================================

async function uploadImage(file) {

    if (!file) {

        return "";
    }


    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );


    const response =
        await fetch(

            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,

            {
                method: "POST",

                body: formData
            }
        );


    if (!response.ok) {

        throw new Error(
            "Cloudinary image upload failed."
        );
    }


    const data =
        await response.json();


    if (!data.secure_url) {

        throw new Error(
            "Cloudinary did not return an image URL."
        );
    }


    return data.secure_url;
}


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            showToast(
                "Please login first."
            );

            window.location.href =
                "landing.html";

            return;
        }


        currentUser = user;


        console.log(
            "Logged in user:",
            currentUser.uid
        );


        await loadStore();
    }
);


// ======================================================
// LOAD EXISTING STORE
// ======================================================

async function loadStore() {

    try {

        const storeRef =
            doc(
                db,
                "stores",
                currentUser.uid
            );


        const snap =
            await getDoc(storeRef);


        if (!snap.exists()) {

            console.log(
                "No existing store found."
            );

            return;
        }


        const store =
            snap.data();


        // ==================================================
        // STORE INFORMATION
        // ==================================================

        storeName.value =
            store.name || "";


        storeDescription.value =
            store.description || "";


        // ==================================================
        // ARTIST INFORMATION
        // ==================================================

        artistName.value =
            store.artistName || "";


        locationInput.value =
            store.location || "";


        socialLink.value =
            store.socialLink || "";


        contactEmail.value =
            store.contactEmail || "";


        // ==================================================
        // FEATURED MESSAGE
        // ==================================================

        featuredMessage.value =
            store.featuredMessage || "";


        // ==================================================
        // LOGO
        // ==================================================

        if (store.logo) {

            logoPreview.src =
                store.logo;
        }


        // ==================================================
        // BANNER
        // ==================================================

        if (store.banner) {

            bannerPreview.src =
                store.banner;
        }


        console.log(
            "Store loaded:",
            store
        );

    }

    catch (error) {

        console.error(
            "Load store error:",
            error
        );

        showToast(
            "Could not load your store."
        );
    }
}


// ======================================================
// SAVE STORE BUTTON
// ======================================================

saveStoreBtn.addEventListener(
    "click",
    saveStore
);


// ======================================================
// SAVE STORE
// ======================================================

async function saveStore() {

    if (!currentUser) {

        showToast(
            "Please login first."
        );

        return;
    }


    // ==================================================
    // DISABLE BUTTON
    // ==================================================

    saveStoreBtn.disabled =
        true;

    loader.style.display =
        "inline-block";

    saveText.innerText =
        "Saving...";


    try {

        // ==================================================
        // GET VALUES
        // ==================================================

        const storeNameValue =
            storeName.value.trim();


        const descriptionValue =
            storeDescription.value.trim();


        const artistNameValue =
            artistName.value.trim();


        const locationValue =
            locationInput.value.trim();


        const socialLinkValue =
            socialLink.value.trim();


        const contactEmailValue =
            contactEmail.value.trim();


        const featuredMessageValue =
            featuredMessage.value.trim();


        // ==================================================
        // BASIC VALIDATION
        // ==================================================

        if (!storeNameValue) {

            throw new Error(
                "Please enter your Store Name."
            );
        }


        if (!descriptionValue) {

            throw new Error(
                "Please enter your Store Description."
            );
        }


        // ==================================================
        // GET FILES
        // ==================================================

        const logoFile =
            fileLogo.files[0];


        const bannerFile =
            fileBanner.files[0];


        // ==================================================
        // UPLOAD LOGO
        // ==================================================

        let logoUrl = "";


        if (logoFile) {

            saveText.innerText =
                "Uploading Logo...";


            logoUrl =
                await uploadImage(
                    logoFile
                );
        }


        // ==================================================
        // UPLOAD BANNER
        // ==================================================

        let bannerUrl = "";


        if (bannerFile) {

            saveText.innerText =
                "Uploading Banner...";


            bannerUrl =
                await uploadImage(
                    bannerFile
                );
        }


        // ==================================================
        // STORE DATA
        // ==================================================

        saveText.innerText =
            "Saving Store...";


        const storeData = {

            // ==================================================
            // OWNER
            // ==================================================

            ownerId:
                currentUser.uid,

            ownerEmail:
                currentUser.email || "",


            // ==================================================
            // STORE
            // ==================================================

            name:
                storeNameValue,

            description:
                descriptionValue,


            // ==================================================
            // ARTIST
            // ==================================================

            artistName:
                artistNameValue,

            location:
                locationValue,


            // ==================================================
            // CONTACT
            // ==================================================

            socialLink:
                socialLinkValue,

            contactEmail:
                contactEmailValue,


            // ==================================================
            // FEATURED
            // ==================================================

            featuredMessage:
                featuredMessageValue,


            // ==================================================
            // TIMESTAMP
            // ==================================================

            updatedAt:
                serverTimestamp()
        };


        // ==================================================
        // ONLY UPDATE IMAGE IF NEW IMAGE WAS UPLOADED
        // ==================================================

        if (logoUrl) {

            storeData.logo =
                logoUrl;
        }


        if (bannerUrl) {

            storeData.banner =
                bannerUrl;
        }


        // ==================================================
        // SAVE FIRESTORE
        // ==================================================

        await setDoc(

            doc(
                db,
                "stores",
                currentUser.uid
            ),

            storeData,

            {
                merge: true
            }
        );


        // ==================================================
        // SUCCESS
        // ==================================================

        saveText.innerText =
            "Saved Successfully!";


        showToast(
            "Your Luxury Store has been saved successfully! 💎"
        );


        // Dashboard
        window.location.href =
            "dashboard.html";


    }

    catch (error) {

        console.error(
            "Save Store Error:",
            error
        );


        showToast(
            error.message ||
            "Something went wrong while saving."
        );
    }


    finally {

        saveStoreBtn.disabled =
            false;

        loader.style.display =
            "none";

        saveText.innerText =
            "Save Luxury Store";
    }
}


// ======================================================
// LOGO LIVE PREVIEW
// ======================================================

fileLogo.addEventListener(
    "change",
    () => {

        const file =
            fileLogo.files[0];


        if (!file) {

            return;
        }


        logoPreview.src =
            URL.createObjectURL(file);
    }
);


// ======================================================
// BANNER LIVE PREVIEW
// ======================================================

fileBanner.addEventListener(
    "change",
    () => {

        const file =
            fileBanner.files[0];


        if (!file) {

            return;
        }


        bannerPreview.src =
            URL.createObjectURL(file);
    }
);