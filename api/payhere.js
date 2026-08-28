
import { createHash } from "node:crypto";

export default async function handler(req, res) {

    // =====================================================
    // CORS
    // =====================================================

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    // =====================================================
    // OPTIONS
    // =====================================================

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }


    // =====================================================
    // POST ONLY
    // =====================================================

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            message: "Method Not Allowed"
        });

    }


    try {

        // =================================================
        // REQUEST BODY
        // =================================================

        const body = req.body || {};

        const order_id =
            body.order_id;

        const amount =
            body.amount;

        const items =
            body.items || "LeanGelo Order";

        const first_name =
            body.first_name || "Customer";

        const last_name =
            body.last_name || "Customer";

        const email =
            body.email;

        const phone =
            body.phone;

        const address =
            body.address;

        const city =
            body.city || "Sri Lanka";


        // =================================================
        // ENVIRONMENT VARIABLES
        // =================================================

        const merchant_id =
            process.env.PAYHERE_MERCHANT_ID;

        const merchant_secret =
            process.env.PAYHERE_MERCHANT_SECRET;


        // =================================================
        // CHECK CREDENTIALS
        // =================================================

        if (!merchant_id) {

            return res.status(500).json({
                success: false,
                message:
                    "PAYHERE_MERCHANT_ID is missing"
            });

        }


        if (!merchant_secret) {

            return res.status(500).json({
                success: false,
                message:
                    "PAYHERE_MERCHANT_SECRET is missing"
            });

        }


        // =================================================
        // CHECK REQUIRED PAYMENT DATA
        // =================================================

        if (!order_id) {

            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });

        }


        if (!amount) {

            return res.status(400).json({
                success: false,
                message: "Amount is required"
            });

        }


        if (!email) {

            return res.status(400).json({
                success: false,
                message: "Email is required"
            });

        }


        if (!phone) {

            return res.status(400).json({
                success: false,
                message: "Phone is required"
            });

        }


        if (!address) {

            return res.status(400).json({
                success: false,
                message: "Address is required"
            });

        }


        // =================================================
        // AMOUNT
        // =================================================

        const numericAmount =
            Number(amount);


        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid payment amount"
            });

        }


        const amountFormatted =
            numericAmount.toFixed(2);


        // =================================================
        // CURRENCY
        // =================================================

        const currency =
            "LKR";


        // =================================================
        // HASH MERCHANT SECRET
        // =================================================

        const hashedSecret =
            createHash("md5")
                .update(
                    merchant_secret
                )
                .digest("hex")
                .toUpperCase();


        // =================================================
        // PAYHERE HASH
        // =================================================

        const hash =
            createHash("md5")
                .update(
                    merchant_id +
                    order_id +
                    amountFormatted +
                    currency +
                    hashedSecret
                )
                .digest("hex")
                .toUpperCase();


        // =================================================
        // PAYMENT OBJECT
        // =================================================

        const payment = {

            sandbox:
                true,

            merchant_id:
                merchant_id,

            return_url:
                "https://ayesh-rho.vercel.app/payment-success",

            cancel_url:
                "https://ayesh-rho.vercel.app/payment-cancel",

            notify_url:
                "https://leangelo-payment.vercel.app/api/payhere-notify",

            order_id:
                order_id,

            items:
                items,

            currency:
                currency,

            amount:
                amountFormatted,

            first_name:
                first_name,

            last_name:
                last_name,

            email:
                email,

            phone:
                phone,

            address:
                address,

            city:
                city,

            country:
                "Sri Lanka",

            hash:
                hash

        };


        // =================================================
        // LOG WITHOUT SECRET
        // =================================================

        console.log(
            "PAYHERE PAYMENT CREATED",
            {
                order_id:
                    order_id,

                amount:
                    amountFormatted,

                merchant_id:
                    merchant_id
            }
        );


        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({

            success:
                true,

            payment:
                payment

        });

    }


    catch (error) {

        console.error(
            "PAYHERE FUNCTION ERROR:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                error?.message ||
                "Internal server error"

        });

    }

}
console.log("PAYHERE DEBUG:", {
    merchant_id,
    order_id,
    amount: amountFormatted,
    currency,
    hasMerchantSecret: Boolean(merchant_secret),
    return_url: payment.return_url,
    cancel_url: payment.cancel_url,
    notify_url: payment.notify_url
});

