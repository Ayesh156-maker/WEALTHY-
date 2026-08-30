import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


/* =========================================
   FIREBASE
========================================= */

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


const app =
    initializeApp(firebaseConfig);


const db =
    getFirestore(app);
    
const auth = getAuth(app);


/* =========================================
   GET PRODUCT ID
========================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const productId =
    params.get("id");


let product = null;


/* =========================================
   HELPER
========================================= */

function setDetail(
    boxId,
    elementId,
    value,
    suffix = ""
) {

    const box =
        document.getElementById(boxId);

    const element =
        document.getElementById(elementId);


    if (!box || !element) {
        return;
    }


    if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === 0
    ) {

        box.style.display = "none";

        return;
    }


    element.textContent =
        value + suffix;


    box.style.display =
        "flex";
}


/* =========================================
   LOAD PRODUCT
========================================= */

async function loadProduct() {

    try {

        if (!productId) {

            console.error(
                "Product ID missing from URL."
            );

            return;
        }


        const snap =
            await getDoc(
                doc(
                    db,
                    "products",
                    productId
                )
            );


        if (!snap.exists()) {

            console.error(
                "Product not found."
            );

            return;
        }


        /* =====================================
           GET PRODUCT DATA
        ===================================== */

        product =
            snap.data();


        console.log(
            "PRODUCT DATA:",
            product
        );


        /* =====================================
           BASIC INFORMATION
        ===================================== */

        document.getElementById(
            "productName"
        ).textContent =
            product.brand ||
            product.name ||
            "Product";


        document.getElementById(
            "productPrice"
        ).textContent =
            "Rs. " +
            Number(
                product.price || 0
            ).toLocaleString();


        document.getElementById(
            "productCategory"
        ).textContent =
            `${product.categoryGroup || "Non-Digital"} • ${
                product.category || ""
            } • ${
                product.subcategory || ""
            }`;


        /* =====================================
           IMAGE
        ===================================== */

        const image =
            document.getElementById(
                "productImage"
            );


        image.src =
            product.imageUrl ||
            product.image ||
            "";


        /* =====================================
           PRODUCT SPECIFICATIONS
        ===================================== */

        setDetail(
            "materialBox",
            "material",
            product.material
        );


        /* =====================================
           DIMENSIONS
        ===================================== */

        const dimensions = [

            product.length,

            product.width,

            product.height

        ].filter(
            value =>
                value !== undefined &&
                value !== null &&
                value !== "" &&
                Number(value) > 0
        );


        if (
            dimensions.length > 0
        ) {

            document.getElementById(
                "dimensions"
            ).textContent =
                dimensions.join(" × ") +
                " cm";


            document.getElementById(
                "dimensionsBox"
            ).style.display =
                "flex";

        } else {

            document.getElementById(
                "dimensionsBox"
            ).style.display =
                "none";
        }


        /* =====================================
           WEIGHT
        ===================================== */

        setDetail(
            "weightBox",
            "weight",
            product.weight,
            " kg"
        );


        /* =====================================
           COLOR
        ===================================== */

        setDetail(
            "colorBox",
            "color",
            product.color
        );


        /* =====================================
           FINISH
        ===================================== */

        setDetail(
            "finishBox",
            "finish",
            product.finish
        );


        /* =====================================
           FRAME
        ===================================== */

        setDetail(
            "frameBox",
            "frame",
            product.frame
        );


        /* =====================================
           HANDMADE
        ===================================== */

        setDetail(
            "handmadeBox",
            "handmade",
            product.handmade
        );


        /* =====================================
           VARIANTS
        ===================================== */

        setDetail(
            "variantColorsBox",
            "variantColors",
            product.variantColors
        );


        setDetail(
            "variantSizesBox",
            "variantSizes",
            product.variantSizes
        );


        setDetail(
            "customizableBox",
            "customizable",
            product.customizable
        );


        /* =====================================
           INVENTORY
        ===================================== */

        const stock =
            document.getElementById(
                "stock"
            );


        const minOrder =
            document.getElementById(
                "minOrder"
            );


        if (stock) {

            stock.textContent =
                product.stock !== undefined
                    ? product.stock
                    : "Not specified";

        }


        if (minOrder) {

            minOrder.textContent =
                product.minOrder !== undefined
                    ? product.minOrder
                    : "1";

        }


        /* =====================================
           SHIPPING
        ===================================== */

  setDetail(
    "shippingBox",
    "shipping",
    product.shipping
);


        if (
            document.getElementById(
                "country"
            )
        ) {

            document.getElementById(
                "country"
            ).textContent =
                product.country ||
                "Not specified";

        }


        if (
            document.getElementById(
                "freeShipping"
            )
        ) {

            document.getElementById(
                "freeShipping"
            ).textContent =
                product.freeShipping ||
                "No";

        }


        /* =====================================
           DESCRIPTION
        ===================================== */

        const description =
            document.getElementById(
                "description"
            );
        document.getElementById("sellerName").textContent =
    product.sellerName || "-";

document.getElementById("sellerStoreName").textContent =
    product.sellerName || "-";

const sellerEmail = document.getElementById("sellerEmail");
if (sellerEmail) {
    sellerEmail.textContent = product.sellerEmail || "-";
}

const sellerPhone = document.getElementById("sellerPhone");
if (sellerPhone) {
    sellerPhone.textContent = product.phone || "-";
}

const sku = document.getElementById("sku");
if (sku) {
    sku.textContent = product.sku || "-";
}


        if (description) {

            description.textContent =
                product.description ||
                "No description available.";

        }


        console.log(
            "Product loaded successfully."
        );

    }

    catch (error) {

        console.error(
            "Error loading product:",
            error
        );

    }

}


/* =========================================
   START CHAT
========================================= */

window.startChat =
    function () {

        if (!productId) {

            showToast(
                "Product ID not found."
            );

            return;
        }


        localStorage.setItem(
            "chatProduct",
            productId
        );


        window.location.href =
            "chat.html";

    };


/* =========================================
   START
========================================= */

loadProduct();

/* =========================================
   LOAD PROFILE IMAGE
========================================= */

function loadProfileImage(){

    const profileImage =
        document.getElementById("profileImage");


    if(!profileImage){
        return;
    }


    onAuthStateChanged(auth,(user)=>{


        if(user){

            profileImage.src =
                user.photoURL ||
                "profile.png";


        }else{

            profileImage.src =
                "profile.png";

        }


    });

}


loadProfileImage();