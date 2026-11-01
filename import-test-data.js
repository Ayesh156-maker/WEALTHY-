import {
    initializeApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
    getFirestore,
    collection,
    doc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


const firebaseConfig = {

    apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",

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
    getApps().length
        ? getApps()[0]
        : initializeApp(firebaseConfig);


const db =
    getFirestore(app);


const importBtn =
    document.getElementById("importBtn");


const status =
    document.getElementById("status");


async function importStores(sellers) {

    status.textContent =
        "Creating 30 test stores...";


    let batch =
        writeBatch(db);

    let count = 0;


    for (const seller of sellers) {

        const storeRef =
            doc(
                db,
                "stores",
                seller.id
            );


        batch.set(
            storeRef,
            {

                artistName:
                    seller.name,

                banner:
                    "https://placehold.co/1200x400?text=LeanGelo+Store",

                category:
                    "Art",

                contactEmail:
                    seller.email,

                description:
                    `Test store for ${seller.name}`,

                featuredMessage:
                    "Welcome to our LeanGelo test store.",

                location:
                    "Sri Lanka",

                logo:
                    `https://placehold.co/300x300?text=${encodeURIComponent(
                        seller.name
                    )}`,

                name:
                    seller.store,

                ownerEmail:
                    seller.email,

                ownerId:
                    seller.id,

                ownerName:
                    seller.name,

                sellerId:
                    seller.id,

                socialLink:
                    "",

                updatedAt:
                    new Date()

            }
        );


        count++;


        if (count === 500) {

            await batch.commit();

            batch =
                writeBatch(db);

            count = 0;
        }
    }


    if (count > 0) {

        await batch.commit();

    }


    status.textContent =
        "✅ 30 stores created.\n";
}


async function importProducts(products) {

    const total =
        products.length;


    let batch =
        writeBatch(db);

    let count = 0;

    let imported = 0;


    for (const product of products) {

        const productRef =
            doc(
                collection(
                    db,
                    "products"
                )
            );


        batch.set(
            productRef,
            {
                ...product,

                isTest: true,

                importedAt:
                    new Date()
            }
        );


        count++;

        imported++;


        if (count === 500) {

            await batch.commit();


            status.textContent =
                `Products imported: ${imported} / ${total}`;


            batch =
                writeBatch(db);

            count = 0;
        }
    }


    if (count > 0) {

        await batch.commit();

    }


    status.textContent =
        `✅ Import complete!\n\n` +
        `Stores: 30\n` +
        `Products: ${total}\n\n` +
        `All test products have isTest: true`;
}


async function startImport() {

    importBtn.disabled = true;


    try {

        status.textContent =
            "Reading test-products.json...";


        const response =
            await fetch(
                "test-products.json"
            );


        if (!response.ok) {

            throw new Error(
                "test-products.json not found"
            );
        }


        const data =
            await response.json();


        if (
            !data.sellers ||
            !data.products
        ) {

            throw new Error(
                "Invalid test-products.json format"
            );
        }


        /*
         * Add email to each seller.
         */

        const sellers =
            data.sellers.map(
                (seller, index) => ({

                    ...seller,

                    email:
                        `seller${String(
                            index + 1
                        ).padStart(2, "0")}@leangelo.test`

                })
            );


        await importStores(
            sellers
        );


        await importProducts(
            data.products
        );


    } catch (error) {

        console.error(error);


        status.textContent =
            "❌ Import failed\n\n" +
            error.message;


    } finally {

        importBtn.disabled = false;

    }
}


importBtn.addEventListener(
    "click",
    startImport
);