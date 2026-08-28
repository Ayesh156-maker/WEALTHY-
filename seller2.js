import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


// ================= FIREBASE =================

const firebaseConfig = {

    apiKey: "AIzaSyBASJQed83D5iCtGOYES8LfqAv5M0iwUaM",
    authDomain: "mylamborghini.firebaseapp.com",
    projectId: "mylamborghini",
    storageBucket: "mylamborghini.firebasestorage.app",
    messagingSenderId: "817085836076",
    appId: "1:817085836076:web:dafa36f41d1ec24a5c5a89"

};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);



// ================= GET SELLER ID =================

const params = new URLSearchParams(
    window.location.search
);

const sellerId = params.get("id");



if(!sellerId){

    document.body.innerHTML =
    "<h2>Seller not found</h2>";

}
else{

    loadSeller();

}



// ================= LOAD SELLER =================

async function loadSeller(){


try{


// =================================
// LOAD ARTIST INFO
// =================================


const artistRef =
doc(
    db,
    "artists",
    sellerId
);


const artistSnap =
await getDoc(artistRef);



if(artistSnap.exists()){


const artist =
artistSnap.data();



// NAME

const sellerName =
document.getElementById("sellerName");


if(sellerName){

    sellerName.textContent =
    artist.name || "Unknown Artist";

}



// BIO

const story =
document.getElementById("artistStory");


if(story){

    story.textContent =
    artist.bio ||
    "No artist story available";

}



// CATEGORY

const category =
document.getElementById("artStyle");


if(category){

    category.textContent =
    Array.isArray(artist.category)

    ?
    artist.category.join(", ")

    :
    artist.category || "-";

}



// EXPERIENCE

const experience =
document.getElementById("experience");


if(experience){

    experience.textContent =
    artist.experience
    ?
    artist.experience + " Years"
    :
    "-";

}



// LOCATION

const location =
document.getElementById("location");


if(location){

    location.textContent =
    `${artist.city || ""}, ${artist.country || ""}`;

}



// FOLLOWERS

const followers =
document.getElementById("followers");


if(followers){

    followers.textContent =
    artist.followers || 0;

}



}




// =================================
// LOAD STORE INFO
// =================================


const storeRef =
doc(
    db,
    "stores",
    sellerId
);


const storeSnap =
await getDoc(storeRef);



if(storeSnap.exists()){


const store =
storeSnap.data();



// PROFILE IMAGE

const logo =
document.getElementById("sellerLogo");


if(logo){

    logo.src =
    store.logo ||
    "https://via.placeholder.com/200";

}



// BANNER

const banner =
document.getElementById("storeBanner");


if(banner){

    banner.src =
    store.banner ||
    "https://via.placeholder.com/1400x350";

}



// STORE NAME fallback

const sellerName =
document.getElementById("sellerName");


if(sellerName && !sellerName.textContent){

    sellerName.textContent =
    store.name || "Unknown Store";

}


}





// =================================
// LOAD PRODUCTS
// =================================


const productQuery =
query(

collection(db,"products"),

where(
"sellerId",
"==",
sellerId
)

);



const productsSnap =
await getDocs(productQuery);



const groupedProducts = {};



productsSnap.forEach((item)=>{


const product =
item.data();



const category =
product.category || "Other";



if(!groupedProducts[category]){

    groupedProducts[category] = [];

}



groupedProducts[category].push({

    id:item.id,

    ...product

});


});





const container =
document.getElementById(
"categoryProducts"
);



if(!container)
return;



container.innerHTML = "";




if(Object.keys(groupedProducts).length === 0){


container.innerHTML = `

<h3 style="text-align:center">

No Products Available

</h3>

`;

return;


}




// =================================
// SHOW CATEGORY PRODUCTS
// =================================


for(const category in groupedProducts){



const section =
document.createElement("div");


section.className =
"category-section";



section.innerHTML = `


<h2 class="category-title">

${category}

</h2>


<div class="products-grid"></div>


`;



const grid =
section.querySelector(
".products-grid"
);





groupedProducts[category]
.forEach(product=>{


grid.innerHTML += `


<div class="card"

onclick="openProduct('${product.id}')">


<img src="${product.image ||

'https://via.placeholder.com/300'}">



<h3>

${product.brand ||

product.name ||

"Product"}

</h3>



<p class="price">

Rs ${product.price || 0}

</p>



</div>


`;


});



container.appendChild(section);



}




}

catch(error){


console.error(
"Seller Profile Error:",
error
);


}


}



// ================= OPEN PRODUCT =================


window.openProduct = function(id){


window.location.href =
`product.html?id=${id}`;


};