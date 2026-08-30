// ==========================================
// CART SYSTEM
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadCart();

});


// ==========================================
// LOAD CART
// ==========================================

function loadCart() {

    const cartItems = document.getElementById("cartItems");
    const emptyCart = document.getElementById("emptyCart");
    const cartLayout = document.getElementById("cartLayout");

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    console.log("CART:", cart);

    // Empty cart
    if (cart.length === 0) {

        emptyCart.style.display = "block";
        cartLayout.style.display = "none";

        updateSummary([]);

        return;
    }

    emptyCart.style.display = "none";
    cartLayout.style.display = "grid";

    cartItems.innerHTML = "";

    let subtotal = 0;
    let itemCount = 0;


    // ==========================================
    // DISPLAY PRODUCTS
    // ==========================================

    cart.forEach((product, index) => {

        const price = Number(product.price) || 0;
        const quantity = Number(product.quantity) || 1;

        subtotal += price * quantity;
        itemCount += quantity;


        const item = document.createElement("div");

        item.className = "cart-item";


        item.innerHTML = `

            <div class="cart-image">

                <img
                    src="${product.imageUrl || ''}"
                    alt="${product.name || "Product"}"
                >

            </div>


            <div class="cart-info">

                <h3>
                    ${product.name || "Untitled Product"}
                </h3>

                ${
                    product.category
                    ?
                    `<p class="category">
                        ${product.category}
                    </p>`
                    :
                    ""
                }


                <p class="price">
                    Rs ${price.toLocaleString()}
                </p>


                <div class="quantity-box">

                    <button
                        onclick="decreaseQuantity(${index})"
                    >
                        −
                    </button>


                    <span>
                        ${quantity}
                    </span>


                    <button
                        onclick="increaseQuantity(${index})"
                    >
                        +
                    </button>

                </div>


                <button
                    class="remove-btn"
                    onclick="removeFromCart(${index})"
                >
                    🗑️ Remove
                </button>

            </div>

        `;


        cartItems.appendChild(item);

    });


    // ==========================================
    // UPDATE SUMMARY
    // ==========================================

    document.getElementById("itemCount").innerText = itemCount;

    document.getElementById("subtotal").innerText =
        subtotal.toLocaleString();

    document.getElementById("total").innerText =
        subtotal.toLocaleString();


    // Save total for checkout page
    localStorage.setItem("cartTotal", subtotal);

}


// ==========================================
// INCREASE QUANTITY
// ==========================================

window.increaseQuantity = function(index) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    if (!cart[index]) return;


    cart[index].quantity =
        (Number(cart[index].quantity) || 1) + 1;


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    loadCart();

};


// ==========================================
// DECREASE QUANTITY
// ==========================================

window.decreaseQuantity = function(index) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    if (!cart[index]) return;


    let quantity =
        Number(cart[index].quantity) || 1;


    if (quantity > 1) {

        cart[index].quantity = quantity - 1;

    } else {

        cart.splice(index, 1);

    }


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    loadCart();

};


// ==========================================
// REMOVE PRODUCT
// ==========================================

window.removeFromCart = function(index) {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    if (!cart[index]) return;


    cart.splice(index, 1);


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    loadCart();

};


// ==========================================
// CHECKOUT
// ==========================================

window.goCheckout = function() {

    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    if (cart.length === 0) {

        showToast("Your cart is empty!");

        return;
    }


    window.location.href = "checkout.html";

};