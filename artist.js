// ======================================================
// FIREBASE IMPORTS
// ======================================================

import {
    initializeApp
}
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";


import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";


import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


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
        "mylamborghini.firebasestorage.app",

    messagingSenderId:
        "817085836076",

    appId:
        "1:817085836076:web:dafa36f41d1ec24a5c5a89",

    measurementId:
        "G-RY79N9C9R1"
};


// ======================================================
// INITIALIZE FIREBASE
// ======================================================

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


// ======================================================
// GOOGLE PROVIDER
// ======================================================

const googleProvider =
    new GoogleAuthProvider();


// ======================================================
// CLOUDINARY
// ======================================================

const CLOUDINARY_CLOUD_NAME =
    "dxpizcvi5";

const CLOUDINARY_UPLOAD_PRESET =
    "artist_login_details";


// ======================================================
// FORM ELEMENTS
// ======================================================

const form =
    document.getElementById("artistForm");

const googleSignInBtn =
    document.getElementById("googleSignInBtn");

const googleStatus =
    document.getElementById("googleStatus");

const emailInput =
    document.getElementById("email");

const nameInput =
    document.getElementById("name");

const submitBtn =
    document.getElementById("submitBtn");

const btnText =
    document.getElementById("btnText");

const loader =
    document.getElementById("loader");


// ======================================================
// GOOGLE USER
// ======================================================

let googleUser = null;


// ======================================================
// SELECTED CATEGORIES
// ======================================================

const categorySelect =
    document.getElementById("category");

const selectedBox =
    document.getElementById(
        "selectedCategories"
    );

const categoryLabel =
    document.getElementById(
        "categoryLabel"
    );

let selectedCategories = [];


// ======================================================
// UPDATE CATEGORY UI
// ======================================================

function updateCategories() {

    selectedBox.innerHTML = "";


    selectedCategories.forEach(
        (category, index) => {

            const tag =
                document.createElement("div");

            tag.className =
                "categoryTag";


            tag.innerHTML = `

                <span>
                    ${category}
                </span>

                <span
                    data-index="${index}"
                    class="removeCategory"
                >
                    ×
                </span>

            `;


            selectedBox.appendChild(tag);

        }
    );


    categoryLabel.textContent =
        `Art Categories * (${selectedCategories.length}/5)`;


    if (
        selectedCategories.length >= 5
    ) {

        categorySelect.style.display =
            "none";

    } else {

        categorySelect.style.display =
            "block";
    }
}


// ======================================================
// CATEGORY SELECT
// ======================================================

categorySelect.addEventListener(
    "change",
    () => {

        const value =
            categorySelect.value;


        if (!value) {
            return;
        }


        if (
            selectedCategories.includes(value)
        ) {

            categorySelect.value = "";

            return;
        }


        if (
            selectedCategories.length >= 5
        ) {

            showToast(
                "You can select maximum 5 categories."
            );

            categorySelect.value = "";

            return;
        }


        selectedCategories.push(value);

        categorySelect.value = "";

        updateCategories();

    }
);


// ======================================================
// REMOVE CATEGORY
// ======================================================

selectedBox.addEventListener(
    "click",
    (e) => {

        if (
            e.target.classList.contains(
                "removeCategory"
            )
        ) {

            const index =
                Number(
                    e.target.dataset.index
                );


            selectedCategories.splice(
                index,
                1
            );


            updateCategories();

        }

    }
);


// ======================================================
// CLOUDINARY UPLOAD
// ======================================================

async function uploadToCloudinary(
    file,
    folder
) {

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


    formData.append(
        "folder",
        folder
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
            "Cloudinary upload failed."
        );
    }


    const data =
        await response.json();


    return data.secure_url;
}


// ======================================================
// GOOGLE SIGN IN
// ======================================================

googleSignInBtn.addEventListener(
    "click",
    async () => {

        try {

            googleSignInBtn.disabled =
                true;

            googleSignInBtn.textContent =
                "Connecting to Google...";


            const result =
                await signInWithPopup(
                    auth,
                    googleProvider
                );


            const user =
                result.user;


            googleUser =
                user;


            console.log(
                "Google User:",
                user
            );


            // ==================================================
            // CHECK EXISTING ARTIST
            // ==================================================

            const artistRef =
                doc(
                    db,
                    "artists",
                    user.uid
                );


            const artistSnap =
                await getDoc(
                    artistRef
                );


            // ==================================================
            // EXISTING ARTIST
            // ==================================================

            if (
                artistSnap.exists()
            ) {

                googleStatus.innerHTML = `
                    <span style="color:green;">
                        ✓ Google account verified
                    </span>
                `;


                emailInput.value =
                    user.email || "";


                if (
                    !nameInput.value
                ) {

                    nameInput.value =
                        user.displayName || "";

                }


                submitBtn.disabled =
                    false;


                btnText.textContent =
                    "Update Artist Profile";


                showToast(
                    "This Google account is already registered as an artist."
                );


                return;
            }


            // ==================================================
            // NEW GOOGLE ACCOUNT
            // ==================================================

            googleStatus.innerHTML = `
                <span style="color:green;">
                    ✓ Google account verified
                </span>
            `;


            emailInput.value =
                user.email || "";


            if (
                !nameInput.value
            ) {

                nameInput.value =
                    user.displayName || "";

            }


            submitBtn.disabled =
                false;


            btnText.textContent =
                "Become an Artist";


            googleSignInBtn.textContent =
                "✓ Google Account Verified";


            googleSignInBtn.style.background =
                "#1f9d55";


        } catch (error) {

            console.error(
                "Google Sign-In Error:",
                error
            );


            googleUser =
                null;


            googleSignInBtn.disabled =
                false;


            googleSignInBtn.textContent =
                "Continue with Google";


            if (
                error.code ===
                "auth/popup-closed-by-user"
            ) {

                showToast(
                    "Google sign-in was cancelled."
                );

            }

            else if (
                error.code ===
                "auth/popup-blocked"
            ) {

                showToast(
                    "Your browser blocked the Google popup. Please allow popups for this website."
                );

            }

            else {

                showToast(
                    "Google sign-in failed: " +
                    error.message
                );

            }

        }

    }
);


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            googleUser =
                null;

            return;
        }


        // Only accept Google users
        // on this registration page

        const isGoogleUser =
            user.providerData.some(
                provider =>
                    provider.provider ===
                    "google.com"
            );


        if (!isGoogleUser) {

            return;
        }


        googleUser =
            user;


        emailInput.value =
            user.email || "";


        if (
            !nameInput.value
        ) {

            nameInput.value =
                user.displayName || "";

        }


        googleStatus.innerHTML = `
            <span style="color:green;">
                ✓ Google account verified
            </span>
        `;


        submitBtn.disabled =
            false;


        btnText.textContent =
            "Become an Artist";


        googleSignInBtn.textContent =
            "✓ Google Account Verified";

    }
);


// ======================================================
// FORM SUBMIT
// ======================================================

form.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();


        // ==================================================
        // MUST HAVE GOOGLE ACCOUNT
        // ==================================================

        if (!googleUser) {

            showToast(
                "Please verify your Google account first."
            );

            return;
        }


        // ==================================================
        // VERIFY CURRENT USER
        // ==================================================

        const currentUser =
            auth.currentUser;


        if (
            !currentUser ||
            currentUser.uid !==
            googleUser.uid
        ) {

            showToast(
                "Google verification expired. Please sign in again."
            );

            return;
        }


        // ==================================================
        // BUTTON
        // ==================================================

        submitBtn.disabled =
            true;

        loader.style.display =
            "inline-block";

        btnText.textContent =
            "Creating Artist Profile...";


        try {

            // ==================================================
            // GET BASIC DATA
            // ==================================================

            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();

const phone =
    iti.getNumber();

            const country =
                document
                    .getElementById("country")
                    .value
                    .trim();


            const city =
                document
                    .getElementById("city")
                    .value
                    .trim();


            const address =
                document
                    .getElementById("address")
                    .value
                    .trim();


            const postalCode =
                document
                    .getElementById("postalCode")
                    .value
                    .trim();


            const bio =
                document
                    .getElementById("bio")
                    .value
                    .trim();


            const experience =
                Number(
                    document
                        .getElementById(
                            "experience"
                        )
                        .value
                );


            const commission =
                document
                    .getElementById(
                        "commission"
                    )
                    .value;


            // ==================================================
            // FILES
            // ==================================================


            const portfolioFiles =
                document
                    .getElementById(
                        "portfolio"
                    )
                    .files;


            // ==================================================
            // VALIDATION
            // ==================================================

            if (
                selectedCategories.length === 0
            ) {

                showToast(
                    "Please select at least one art category."
                );

                throw new Error(
                    "No categories selected."
                );
            }


            if (
                selectedCategories.length > 5
            ) {

                showToast(
                    "You can select maximum 5 categories."
                );

                throw new Error(
                    "Too many categories."
                );
            }


      

            // ==================================================
            // CHECK EMAIL
            // ==================================================

            if (
                email !==
                googleUser.email.toLowerCase()
            ) {

                showToast(
                    "The email does not match your Google account."
                );

                throw new Error(
                    "Google email mismatch."
                );
            }


      

            // ==================================================
            // STEP 2
            // PORTFOLIO
            // ==================================================

            let portfolioImages = [];


            if (
                portfolioFiles.length > 0
            ) {

                btnText.textContent =
                    "Uploading Portfolio...";


                for (
                    let i = 0;
                    i < portfolioFiles.length;
                    i++
                ) {

                    const file =
                        portfolioFiles[i];


                    const imageURL =
                        await uploadToCloudinary(
                            file,
                            `leangelo/artists/${googleUser.uid}/portfolio`
                        );


                    portfolioImages.push({

                        name:
                            file.name,

                        url:
                            imageURL

                    });

                }

            }


            // ==================================================
            // STEP 3
            // FIRESTORE DATA
            // ==================================================

            btnText.textContent =
                "Saving Artist Profile...";


            const artistData = {

                // ==================================================
                // ACCOUNT
                // ==================================================

                uid:
                    googleUser.uid,

                role:
                    "artist",

                status:
                    "pending",

                authProvider:
                    "google",

                // ==================================================
                // PERSONAL
                // ==================================================

                name:
                    name,

                email:
                    googleUser.email,

                phone:
                    phone,

                // ==================================================
                // LOCATION
                // ==================================================

                country:
                    country,

                city:
                    city,

                address:
                    address,

                postalCode:
                    postalCode,

                // ==================================================
                // PROFILE
                // ==================================================

    

                googlePhotoURL:
                    googleUser.photoURL || "",

                bio:
                    bio,

                // ==================================================
                // ART
                // ==================================================

                categories:
                    selectedCategories,

                category:
                    selectedCategories,

                // ==================================================
                // EXPERIENCE
                // ==================================================

                experience:
                    experience,

                // ==================================================
                // COMMISSION
                // ==================================================

                commission:
                    commission,

                // ==================================================
                // PORTFOLIO
                // ==================================================

                portfolio:
                    portfolioImages,

                // ==================================================
                // STATISTICS
                // ==================================================

                totalProducts:
                    0,

                totalSales:
                    0,

                totalEarnings:
                    0,

                totalViews:
                    0,

                // ==================================================
                // TIMESTAMPS
                // ==================================================

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            };
// ======================================================
// SAVE REGISTRATION SESSION
// ======================================================

sessionStorage.setItem(
    "artistEmail",
    googleUser.email
);

sessionStorage.setItem(
    "artistUID",
    googleUser.uid
);

sessionStorage.setItem(
    "artistRegistrationData",
    JSON.stringify({
        uid: googleUser.uid,
        name: name,
        email: googleUser.email,
        phone: phone,
        country: country,
        city: city,
        address: address,
        postalCode: postalCode,
        bio: bio,
        categories: selectedCategories,
        experience: experience,
        commission: commission,
        portfolio: portfolioImages,
        profilePhoto: ""
    })
);

            // ==================================================
            // SAVE FIRESTORE
            // ==================================================

            await setDoc(
                doc(
                    db,
                    "artists",
                    googleUser.uid
                ),
                artistData
            );
// ==================================================
// SAVE OTP SESSION
// ==================================================

sessionStorage.setItem(
    "artistEmail",
    googleUser.email
);

sessionStorage.setItem(
    "artistUID",
    googleUser.uid
);

console.log(
    "Artist OTP session saved:",
    googleUser.email,
    googleUser.uid
);// ==================================================
// SAVE OTP SESSION
// ==================================================

sessionStorage.setItem(
    "artistEmail",
    googleUser.email
);

sessionStorage.setItem(
    "artistUID",
    googleUser.uid
);

console.log(
    "Artist OTP session saved:",
    googleUser.email,
    googleUser.uid
);

            console.log(
                "Artist saved:",
                artistData
            );


            // ==================================================
            // SUCCESS
            // ==================================================

            btnText.textContent =
                "Artist Account Created!";


           showToast(
    "Your registration details have been saved. Please verify your email."
);

window.location.href =
    "artist-otp.html";


        } catch (error) {

            console.error(
                "Artist Registration Error:",
                error
            );


            // ==================================================
            // ERROR MESSAGE
            // ==================================================

            if (
                error.message ===
                "Cloudinary upload failed."
            ) {

                showToast(
                    "Image upload failed. Please check your Cloudinary settings."
                );

            }

            else if (
                error.message ===
                "No categories selected."
            ) {

                // Already shown

            }

           
            else {

                showToast(
                    "Registration failed: " +
                    error.message
                );

            }


            // ==================================================
            // RESET BUTTON
            // ==================================================

            submitBtn.disabled =
                false;

            loader.style.display =
                "none";

            btnText.textContent =
                "Become an Artist";

        }

    }
);


// ======================================================
// INITIAL CATEGORY UI
// ======================================================

updateCategories();


// ======================================================
// COUNTRY / CITY
// ======================================================

const countrySelect =
    document.getElementById("country");

const citySelect =
    document.getElementById("city");


const COUNTRIES_API =
    "https://countriesnow.space/api/v0.1/countries";


const CITIES_API =
    "https://countriesnow.space/api/v0.1/countries/cities";


// ======================================================
// LOAD COUNTRIES
// ======================================================

async function loadCountries() {

    try {

        countrySelect.innerHTML = `
            <option value="">
                Loading countries...
            </option>
        `;


        const response =
            await fetch(
                COUNTRIES_API
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load countries"
            );

        }


        const data =
            await response.json();


        countrySelect.innerHTML = `
            <option value="">
                Select Country
            </option>
        `;


        data.data.forEach(
            country => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    country.country;


                option.textContent =
                    country.country;


                countrySelect.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Country loading error:",
            error
        );


        countrySelect.innerHTML = `
            <option value="">
                Unable to load countries
            </option>
        `;


        showToast(
            "Could not load countries. Please refresh the page."
        );

    }

}


// ======================================================
// COUNTRY CHANGE
// ======================================================

countrySelect.addEventListener(
    "change",
    async () => {

        const country =
            countrySelect.value;


        citySelect.innerHTML = `
            <option value="">
                Loading cities...
            </option>
        `;


        citySelect.disabled =
            true;


        if (!country) {

            citySelect.innerHTML = `
                <option value="">
                    Select country first
                </option>
            `;

            return;
        }


        try {

            const response =
                await fetch(
                    CITIES_API,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({
                                country:
                                    country
                            })

                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to load cities"
                );

            }


            const data =
                await response.json();


            citySelect.innerHTML = `
                <option value="">
                    Select City
                </option>
            `;


            const cities =
                [
                    ...new Set(
                        data.data
                    )
                ];


            cities
                .sort()
                .forEach(
                    city => {

                        const option =
                            document.createElement(
                                "option"
                            );


                        option.value =
                            city;


                        option.textContent =
                            city;


                        citySelect.appendChild(
                            option
                        );

                    }
                );


            citySelect.disabled =
                false;


        } catch (error) {

            console.error(
                "City loading error:",
                error
            );


            citySelect.innerHTML = `
                <option value="">
                    Unable to load cities
                </option>
            `;


            citySelect.disabled =
                true;


            showToast(
                "Could not load cities for this country."
            );

        }

    }
);


// ======================================================
// LOAD COUNTRIES ON PAGE LOAD
// ======================================================

loadCountries();
const phoneInput =
    document.getElementById("phone");

const iti =
    window.intlTelInput(
        phoneInput,
        {
            initialCountry: "lk",

            preferredCountries: [
                "lk",
                "in",
                "us",
                "gb",
                "au"
            ],

            separateDialCode: true,

            nationalMode: true,

            autoPlaceholder: "polite",

            formatOnDisplay: true,

            utilsScript:
                "https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.2/build/js/utils.js"
        }
    );
// ======================================================
// PHONE NUMBER VALIDATION
// ======================================================

// ======================================================
// PHONE NUMBER INPUT LIMIT + VALIDATION
// ======================================================


// ==================================================
// PHONE NUMBER VALIDATION
// ==================================================

if (!phoneInput.value.trim()) {

    showToast(
        "Please enter your phone number."
    );

    phoneInput.focus();

    throw new Error(
        "Phone number is required."
    );
}


// Check valid phone number
if (!iti.isValidNumber()) {

    showToast(
        "Please enter a valid phone number for the selected country."
    );

    phoneInput.focus();

    throw new Error(
        "Invalid phone number."
    );
}