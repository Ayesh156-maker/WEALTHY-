// ==================================================
// LEANGELO TOAST NOTIFICATION
// ==================================================

(function () {

    const style = document.createElement("style");

    style.textContent = `
        .toast-message {
            position: fixed;
            top: 25px;
            right: 25px;
            z-index: 999999;

            min-width: 280px;
            max-width: 400px;

            padding: 15px 20px;

            background: #111;
            color: #fff;

            border: 1px solid #d4af37;
            border-radius: 10px;

            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;

            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);

            opacity: 0;
            transform: translateX(120%);

            transition:
                opacity 0.3s ease,
                transform 0.3s ease;
        }

        .toast-message.show {
            opacity: 1;
            transform: translateX(0);
        }

        .toast-message.error {
            border-color: #ff4d4d;
        }

        .toast-message.warning {
            border-color: #ffc107;
        }
    `;

    document.head.appendChild(style);


    window.showToast = function (message, type = "success") {

        const toast = document.createElement("div");

        toast.className = "toast-message";

        if (type === "error") {
            toast.classList.add("error");
        }

        if (type === "warning") {
            toast.classList.add("warning");
        }

        toast.textContent = message;

        document.body.appendChild(toast);


        setTimeout(() => {
            toast.classList.add("show");
        }, 10);


        setTimeout(() => {

            toast.classList.remove("show");

            setTimeout(() => {
                toast.remove();
            }, 300);

        }, 3000);

    };

})();