```javascript
import crypto from "crypto";

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
    // PREFLIGHT
    // =====================================================

    if (req.method === "OPTIONS") {

        return res.status(200).end();

    }


    // =====================================================
    // ONLY POST
    // =====================================================

    if (req.method !== "POST") {

        return res.status(405).json({

            success: false,

            message: "Method Not Allowed"

        });

    }


    try {

        // =================================================
        // REQUEST DATA
        // =================================================

        const {
            order_id,
            amount,
            items,
            first_name,
            last_name,
            email,
            phone,
            address,
            city
        } = req.body || {};


        // =================================================
        // VALIDATE REQUIRED DATA
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

        if (!first_name) {

            return res.status(400).json({
                success: false,
                message: "First name is required"
            });

        }

        if (!last_name) {

            return res.status(400).json({
                success: false,
                message: "Last name is required"
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

        if (!city) {

            return res.status(400).json({
                success: false,
                message: "City is required"
            });

        }


        // =================================================
        // GET PAYHERE CREDENTIALS
        // =================================================

        const merchant_id =
            process.env.PAYHERE_MERCHANT_ID;

        const merchant_secret =
            process.env.PAYHERE_MERCHANT_SECRET;


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
        // AMOUNT VALIDATION
        // =================================================

        const numericAmount =
            Number(amount);


        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment amount"

            });

        }


        const amountFormatted =
            numericAmount.toFixed(2);


        // =================================================
        // CURRENCY
        // =================================================

        const currency = "LKR";


        // =================================================
        // HASH MERCHANT SECRET
        // =================================================

        const hashedSecret =
            crypto
                .createHash("md5")
                .update(
                    merchant_secret
                )
                .digest("hex")
                .toUpperCase();


        // =================================================
        // GENERATE PAYHERE HASH
        // =================================================

        const hash =
            crypto
                .createHash("md5")
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
        // PAYHERE PAYMENT DATA
        // =================================================

        const payment = {

            sandbox: true,

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

                items ||
                `LeanGelo Order ${order_id}`,

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
        // DEBUG
        // =================================================

        console.log(
            "PAYHERE PAYMENT CREATED:",
            {
                order_id,
                amount: amountFormatted,
                merchant_id
            }
        );


        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            payment: payment

        });

    }

    catch (error) {

        console.error(
            "PAYHERE API ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Internal server error"

        });

    }

}
```
