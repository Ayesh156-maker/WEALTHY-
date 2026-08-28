// =====================================================
// LEANGELO SETTINGS
// Firebase Auth + Firestore
// =====================================================

// =====================================================
// FIREBASE IMPORTS
// =====================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    updatePassword,
    updateProfile,
    signOut,
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


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
// ELEMENTS
// =====================================================

const nameInput =
    document.getElementById("name");

const phoneInput =
    document.getElementById("phone");

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const profileAvatar =
    document.getElementById("profileAvatar");

const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const changePasswordBtn =
    document.getElementById("changePasswordBtn");

const passwordModal =
    document.getElementById("passwordModal");

const closePasswordModal =
    document.getElementById("closePasswordModal");

const updatePasswordBtn =
    document.getElementById("updatePasswordBtn");

const newPassword =
    document.getElementById("newPassword");

const confirmPassword =
    document.getElementById("confirmPassword");

const logoutBtn =
    document.getElementById("logoutBtn");

const deleteAccountBtn =
    document.getElementById("deleteAccountBtn");

const orderNotifications =
    document.getElementById("orderNotifications");

const messageNotifications =
    document.getElementById("messageNotifications");

const promotionNotifications =
    document.getElementById("promotionNotifications");

const themeSelect =
    document.getElementById("themeSelect");

const languageSelect =
    document.getElementById("languageSelect");


// =====================================================
// CURRENT USER
// =====================================================

let currentUser = null;


// =====================================================
// DEFAULT SETTINGS
// =====================================================

const DEFAULT_SETTINGS = {

    notifications: {

        orders: true,

        messages: true,

        promotions: false

    },

    theme: "dark",

    language: "en"

};


// =====================================================
// TOAST MESSAGE
// =====================================================

function showToast(message, type = "success") {

    let toast =
        document.getElementById("settingsToast");


    if (!toast) {

        toast =
            document.createElement("div");

        toast.id =
            "settingsToast";

        document.body.appendChild(toast);

    }


    toast.textContent =
        message;


    toast.className =
        `settings-toast ${type}`;


    requestAnimationFrame(() => {

        toast.classList.add("show");

    });


    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}


// =====================================================
// GET INITIAL
// =====================================================

function getInitial(name) {

    if (!name) {

        return "U";

    }


    return name
        .trim()
        .charAt(0)
        .toUpperCase();

}


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            currentUser = null;

            profileName.textContent =
                "Not Logged In";

            profileEmail.textContent =
                "No account found";

            profileAvatar.textContent =
                "?";

            if (saveProfileBtn) {

                saveProfileBtn.disabled =
                    true;

            }

            return;

        }


        currentUser =
            user;


        if (saveProfileBtn) {

            saveProfileBtn.disabled =
                false;

        }


        // Firebase Auth information

        profileEmail.textContent =
            user.email ||
            "No email";


        const authName =
            user.displayName ||
            "User";


        profileName.textContent =
            authName;


        profileAvatar.textContent =
            getInitial(authName);


        nameInput.value =
            user.displayName ||
            "";


        // Load Firestore settings

        await loadSettings(user);

    }
);


// =====================================================
// LOAD SETTINGS
// =====================================================

async function loadSettings(user) {

    try {

        const artistRef =
            doc(
                db,
                "artists",
                user.uid
            );


        const snapshot =
            await getDoc(
                artistRef
            );


        if (!snapshot.exists()) {

            applyDefaultSettings();

            return;

        }


        const data =
            snapshot.data();


        // =================================================
        // PROFILE
        // =================================================

        const savedName =
            data.name ||
            user.displayName ||
            "User";


        nameInput.value =
            savedName;


        phoneInput.value =
            data.phone ||
            "";


        profileName.textContent =
            savedName;


        profileEmail.textContent =
            data.email ||
            user.email ||
            "No email";


        profileAvatar.textContent =
            getInitial(savedName);


        // =================================================
        // SETTINGS
        // =================================================

        const settings =
            data.settings ||
            {};


        const notifications =
            settings.notifications ||
            DEFAULT_SETTINGS.notifications;


        orderNotifications.checked =
            notifications.orders ??
            true;


        messageNotifications.checked =
            notifications.messages ??
            true;


        promotionNotifications.checked =
            notifications.promotions ??
            false;


        // Theme

        const theme =
            settings.theme ||
            localStorage.getItem("theme") ||
            "dark";


        themeSelect.value =
            theme;


        applyTheme(theme);


        // Language

        const language =
            settings.language ||
            localStorage.getItem("language") ||
            "en";


        languageSelect.value =
            language;


        applyLanguage(language);


        // Account information

        loadAccountInformation(
            user,
            data
        );

    }

    catch (error) {

        console.error(
            "LOAD SETTINGS ERROR:",
            error
        );


        showToast(
            "Unable to load your settings.",
            "error"
        );

    }

}


// =====================================================
// DEFAULT SETTINGS
// =====================================================

function applyDefaultSettings() {

    orderNotifications.checked =
        DEFAULT_SETTINGS.notifications.orders;

    messageNotifications.checked =
        DEFAULT_SETTINGS.notifications.messages;

    promotionNotifications.checked =
        DEFAULT_SETTINGS.notifications.promotions;

    themeSelect.value =
        DEFAULT_SETTINGS.theme;

    languageSelect.value =
        DEFAULT_SETTINGS.language;

    applyTheme(
        DEFAULT_SETTINGS.theme
    );

    applyLanguage(
        DEFAULT_SETTINGS.language
    );

}


// =====================================================
// LOAD ACCOUNT INFORMATION
// =====================================================

function loadAccountInformation(user, data) {

    console.log(
        "================================="
    );

    console.log(
        "LeanGelo Account"
    );

    console.log(
        "UID:",
        user.uid
    );

    console.log(
        "Email:",
        user.email
    );

    console.log(
        "Created:",
        user.metadata?.creationTime
    );

    console.log(
        "Last Login:",
        user.metadata?.lastSignInTime
    );

    console.log(
        "================================="
    );

}


// =====================================================
// SAVE PROFILE
// =====================================================

if (saveProfileBtn) {

    saveProfileBtn.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                showToast(
                    "No logged-in user found.",
                    "error"
                );

                return;

            }


            const name =
                nameInput.value.trim();


            const phone =
                phoneInput.value.trim();


            if (!name) {

                showToast(
                    "Please enter your name.",
                    "error"
                );

                nameInput.focus();

                return;

            }


            try {

                saveProfileBtn.disabled =
                    true;

                saveProfileBtn.textContent =
                    "Saving...";


                // =================================================
                // UPDATE FIREBASE AUTH PROFILE
                // =================================================

                await updateProfile(
                    currentUser,
                    {
                        displayName: name
                    }
                );


                // =================================================
                // UPDATE FIRESTORE
                // =================================================

                await setDoc(
                    doc(
                        db,
                        "artists",
                        currentUser.uid
                    ),
                    {

                        uid:
                            currentUser.uid,

                        name:
                            name,

                        email:
                            currentUser.email ||
                            "",

                        phone:
                            phone,

                        updatedAt:
                            serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );


                // =================================================
                // UPDATE UI
                // =================================================

                profileName.textContent =
                    name;


                profileAvatar.textContent =
                    getInitial(name);


                showToast(
                    "Profile updated successfully!"
                );

            }

            catch (error) {

                console.error(
                    "SAVE PROFILE ERROR:",
                    error
                );


                showToast(
                    "Failed to update profile.",
                    "error"
                );

            }

            finally {

                saveProfileBtn.disabled =
                    false;

                saveProfileBtn.textContent =
                    "Save Changes";

            }

        }
    );

}


// =====================================================
// PASSWORD MODAL
// =====================================================

if (changePasswordBtn) {

    changePasswordBtn.addEventListener(
        "click",
        () => {

            newPassword.value =
                "";

            confirmPassword.value =
                "";

            passwordModal.classList.add(
                "active"
            );

            setTimeout(() => {

                newPassword.focus();

            }, 100);

        }
    );

}


// =====================================================
// CLOSE PASSWORD MODAL
// =====================================================

function closePasswordWindow() {

    passwordModal.classList.remove(
        "active"
    );

    newPassword.value =
        "";

    confirmPassword.value =
        "";

}


if (closePasswordModal) {

    closePasswordModal.addEventListener(
        "click",
        closePasswordWindow
    );

}


if (passwordModal) {

    passwordModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                passwordModal
            ) {

                closePasswordWindow();

            }

        }
    );

}


// =====================================================
// PASSWORD STRENGTH
// =====================================================

function getPasswordStrength(password) {

    if (!password) {

        return {
            score: 0,
            text: ""
        };

    }


    let score = 0;


    if (password.length >= 6) {

        score++;

    }


    if (password.length >= 10) {

        score++;

    }


    if (/[A-Z]/.test(password)) {

        score++;

    }


    if (/[0-9]/.test(password)) {

        score++;

    }


    if (/[^A-Za-z0-9]/.test(password)) {

        score++;

    }


    if (score <= 2) {

        return {
            score: score,
            text: "Weak"
        };

    }


    if (score <= 4) {

        return {
            score: score,
            text: "Medium"
        };

    }


    return {
        score: score,
        text: "Strong"
    };

}


// =====================================================
// PASSWORD CHANGE
// =====================================================

if (updatePasswordBtn) {

    updatePasswordBtn.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                showToast(
                    "No logged-in user found.",
                    "error"
                );

                return;

            }


            const password =
                newPassword.value;


            const confirm =
                confirmPassword.value;


            if (!password) {

                showToast(
                    "Please enter a new password.",
                    "error"
                );

                return;

            }


            if (password.length < 6) {

                showToast(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                return;

            }


            if (password !== confirm) {

                showToast(
                    "Passwords do not match.",
                    "error"
                );

                return;

            }


            try {

                updatePasswordBtn.disabled =
                    true;

                updatePasswordBtn.textContent =
                    "Updating...";


                await updatePassword(
                    currentUser,
                    password
                );


                closePasswordWindow();


                showToast(
                    "Password changed successfully!"
                );

            }

            catch (error) {

                console.error(
                    "PASSWORD ERROR:",
                    error
                );


                if (
                    error.code ===
                    "auth/requires-recent-login"
                ) {

                    showToast(
                        "Please login again before changing your password.",
                        "error"
                    );

                }

                else if (
                    error.code ===
                    "auth/weak-password"
                ) {

                    showToast(
                        "Your password is too weak.",
                        "error"
                    );

                }

                else if (
                    error.code ===
                    "auth/operation-not-allowed"
                ) {

                    showToast(
                        "Password login is not enabled for this account.",
                        "error"
                    );

                }

                else {

                    showToast(
                        "Failed to change password.",
                        "error"
                    );

                }

            }

            finally {

                updatePasswordBtn.disabled =
                    false;

                updatePasswordBtn.textContent =
                    "Update Password";

            }

        }
    );

}


// =====================================================
// SAVE NOTIFICATION SETTINGS
// =====================================================

async function saveNotificationSettings() {

    if (!currentUser) {

        return;

    }


    try {

        await setDoc(
            doc(
                db,
                "artists",
                currentUser.uid
            ),
            {

                settings: {

                    notifications: {

                        orders:
                            orderNotifications.checked,

                        messages:
                            messageNotifications.checked,

                        promotions:
                            promotionNotifications.checked

                    }

                }

            },
            {
                merge: true
            }
        );


        showToast(
            "Notification settings saved."
        );

    }

    catch (error) {

        console.error(
            "NOTIFICATION ERROR:",
            error
        );


        showToast(
            "Failed to save notification settings.",
            "error"
        );

    }

}


// =====================================================
// NOTIFICATION EVENTS
// =====================================================

if (orderNotifications) {

    orderNotifications.addEventListener(
        "change",
        saveNotificationSettings
    );

}


if (messageNotifications) {

    messageNotifications.addEventListener(
        "change",
        saveNotificationSettings
    );

}


if (promotionNotifications) {

    promotionNotifications.addEventListener(
        "change",
        saveNotificationSettings
    );

}


// =====================================================
// APPLY THEME
// =====================================================

function applyTheme(theme) {

    if (theme === "light") {

        document.body.classList.add(
            "light-theme"
        );

    }

    else {

        document.body.classList.remove(
            "light-theme"
        );

    }

    localStorage.setItem(
        "theme",
        theme
    );

}


// =====================================================
// SAVE THEME
// =====================================================

if (themeSelect) {

    themeSelect.addEventListener(
        "change",
        async () => {

            if (!currentUser) {

                return;

            }


            const theme =
                themeSelect.value;


            applyTheme(theme);


            try {

                await setDoc(
                    doc(
                        db,
                        "artists",
                        currentUser.uid
                    ),
                    {

                        settings: {

                            theme:
                                theme

                        }

                    },
                    {
                        merge: true
                    }
                );


                showToast(
                    `Theme changed to ${theme}.`
                );

            }

            catch (error) {

                console.error(
                    "THEME ERROR:",
                    error
                );


                showToast(
                    "Failed to save theme.",
                    "error"
                );

            }

        }
    );

}


// =====================================================
// APPLY LANGUAGE
// =====================================================

function applyLanguage(language) {

    document.documentElement.lang =
        language;


    // =================================================
    // Currently English is the main page language.
    // Sinhala translations can be expanded here.
    // =================================================

    if (language === "si") {

        console.log(
            "🇱🇰 Sinhala language selected."
        );

    }

    else {

        console.log(
            "🇬🇧 English language selected."
        );

    }

}


// =====================================================
// SAVE LANGUAGE
// =====================================================

if (languageSelect) {

    languageSelect.addEventListener(
        "change",
        async () => {

            if (!currentUser) {

                return;

            }


            const language =
                languageSelect.value;


            applyLanguage(
                language
            );


            try {

                await setDoc(
                    doc(
                        db,
                        "artists",
                        currentUser.uid
                    ),
                    {

                        settings: {

                            language:
                                language

                        }

                    },
                    {
                        merge: true
                    }
                );


                localStorage.setItem(
                    "language",
                    language
                );


                showToast(
                    language === "si"
                        ? "භාෂා සැකසුම සුරැකුණා."
                        : "Language preference saved."
                );

            }

            catch (error) {

                console.error(
                    "LANGUAGE ERROR:",
                    error
                );


                showToast(
                    "Failed to save language.",
                    "error"
                );

            }

        }
    );

}


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmed) {

                return;

            }


            try {

                logoutBtn.disabled =
                    true;

                logoutBtn.textContent =
                    "Logging out...";


                await signOut(
                    auth
                );


                localStorage.removeItem(
                    "theme"
                );

                localStorage.removeItem(
                    "language"
                );


                window.location.href =
                    "index.html";

            }

            catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );


                showToast(
                    "Logout failed.",
                    "error"
                );


                logoutBtn.disabled =
                    false;

                logoutBtn.textContent =
                    "Logout";

            }

        }
    );

}


// =====================================================
// DELETE ACCOUNT
// =====================================================

if (deleteAccountBtn) {

    deleteAccountBtn.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                showToast(
                    "No logged-in user found.",
                    "error"
                );

                return;

            }


            const firstConfirm =
                confirm(
                    "Are you sure you want to delete your LeanGelo account?"
                );


            if (!firstConfirm) {

                return;

            }


            const secondConfirm =
                confirm(
                    "⚠️ This action cannot be undone.\n\nYour account information will be permanently deleted.\n\nContinue?"
                );


            if (!secondConfirm) {

                return;

            }


            try {

                deleteAccountBtn.disabled =
                    true;

                deleteAccountBtn.textContent =
                    "Deleting...";


                // =================================================
                // DELETE FIRESTORE ARTIST DOCUMENT
                // =================================================

                await deleteDoc(
                    doc(
                        db,
                        "artists",
                        currentUser.uid
                    )
                );


                // =================================================
                // DELETE FIREBASE AUTH ACCOUNT
                // =================================================

                await deleteUser(
                    currentUser
                );


                localStorage.clear();


                showToast(
                    "Your LeanGelo account has been deleted successfully."
                );


                window.location.href =
                    "index.html";

            }

            catch (error) {

                console.error(
                    "DELETE ACCOUNT ERROR:",
                    error
                );


                if (
                    error.code ===
                    "auth/requires-recent-login"
                ) {

                    showToast(
                        "For security, please login again and then delete your account.",
                        "error"
                    );

                }

                else {

                    showToast(
                        "Unable to delete your account.",
                        "error"
                    );

                }


                deleteAccountBtn.disabled =
                    false;

                deleteAccountBtn.textContent =
                    "Delete Account";

            }

        }
    );

}


// =====================================================
// LOAD LOCAL SETTINGS IMMEDIATELY
// =====================================================

const localTheme =
    localStorage.getItem("theme");


if (localTheme && themeSelect) {

    themeSelect.value =
        localTheme;

    applyTheme(
        localTheme
    );

}


const localLanguage =
    localStorage.getItem("language");


if (localLanguage && languageSelect) {

    languageSelect.value =
        localLanguage;

    applyLanguage(
        localLanguage
    );

}


// =====================================================
// KEYBOARD SUPPORT
// =====================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            passwordModal?.classList.contains("active")
        ) {

            closePasswordWindow();

        }

    }
);


// =====================================================
// DONE
// =====================================================

console.log(
    "✅ LeanGelo Settings System Loaded."
);