
import crypto from "crypto";

export default function handler(req, res) {

    try {

        // ============================================
        // METHOD
        // ============================================

        if (req.method !== "POST") {

            return res.status(405).json({
                success: false,
                message: "Method Not Allowed",
                method: req.method
            });

        }


        // ============================================
        // BODY
        // ============================================

        const body = req.body || {};


        // ============================================
        // ENV
        // ============================================

        const merchant_id =
            process.env.PAYHERE_MERCHANT_ID;

        const merchant_secret =
            process.env.PAYHERE_MERCHANT_SECRET;


        // ============================================
        // CHECK ENV
        // ============================================

        if (!merchant_id) {

            return res.status(500).json({
                success: false,
                message: "PAYHERE_MERCHANT_ID is missing"
            });

        }

        if (!merchant_secret) {

            return res.status(500).json({
                success: false,
                message: "PAYHERE_MERCHANT_SECRET is missing"
            });

        }


        // ============================================
        // INPUT
        // ============================================

        const order_id =
            String(body.order_id || "");

        const amount =
            Number(body.amount);

        const items =
            String(
                body.items ||
                "LeanGelo Order"
            );

        const first_name =
            String(
                body.first_name ||
                "Customer"
            );

        const last_name =
            String(
                body.last_name ||
                "Customer"
            );

        const email =
            String(
                body.email ||
                ""
            );

        const phone =
            String(
                body.phone ||
                ""
            );

        const address =
            String(
                body.address ||
                ""
            );

        const city =
            String(
                body.city ||
                "Colombo"
            );


        // ============================================
        // VALIDATION
        // ============================================

        if (!order_id) {

            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });

        }

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid amount"
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


        // ============================================
        // FORMAT
        // ============================================

        const currency = "LKR";

        const amountFormatted =
            amount.toFixed(2);


        // ============================================
        // MD5 SECRET
        // ============================================

        const hashedSecret =
            crypto
                .createHash("md5")
                .update(
                    merchant_secret,
                    "utf8"
                )
                .digest("hex")
                .toUpperCase();


        // ============================================
        // PAYHERE HASH
        // ============================================

        const hashString =
            merchant_id +
            order_id +
            amountFormatted +
            currency +
            hashedSecret;


        const hash =
            crypto
                .createHash("md5")
                .update(
                    hashString,
                    "utf8"
                )
                .digest("hex")
                .toUpperCase();


        // ============================================
        // PAYMENT
        // ============================================

        const payment = {

            merchant_id,

            return_url:
                "https://ayesh-rho.vercel.app/payment-success",

            cancel_url:
                "https://ayesh-rho.vercel.app/payment-cancel",

            notify_url:
                "https://ayesh-rho.vercel.app/api/payhere-notify",

            first_name,

            last_name,

            email,

            phone,

            address,

            city,

            country:
                "Sri Lanka",

            order_id,

            items,

            currency,

            amount:
                amountFormatted,

            hash

        };


        // ============================================
        // SAFE LOG
        // ============================================

        console.log(
            "PAYHERE PAYMENT CREATED",
            {
                order_id,
                amount: amountFormatted,
                merchant_id
            }
        );


        // ============================================
        // RESPONSE
        // ============================================

        return res.status(200).json({

            success: true,

            payment

        });

    }

    catch (error) {

        // ============================================
        // IMPORTANT DEBUG RESPONSE
        // ============================================

        console.error(
            "PAYHERE FUNCTION ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error?.message ||
                "Unknown server error",

            errorName:
                error?.name ||
                "UnknownError",

            stack:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : error?.stack

        });

    }

}

