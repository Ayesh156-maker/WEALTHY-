
import crypto from "crypto";

export default async function handler(req, res) {

    // =========================================
    // METHOD CHECK
    // =========================================

    if (req.method !== "POST") {

        return res.status(405).json({

            success: false,

            message: "Method Not Allowed"

        });

    }


    try {

        // =========================================
        // REQUEST BODY
        // =========================================

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


        // =========================================
        // ENVIRONMENT VARIABLES
        // =========================================

        const merchant_id =
            process.env.PAYHERE_MERCHANT_ID;

        const merchant_secret =
            process.env.PAYHERE_MERCHANT_SECRET;


        // =========================================
        // CREDENTIAL CHECK
        // =========================================

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


        // =========================================
        // REQUIRED DATA CHECK
        // =========================================

        if (!order_id) {

            return res.status(400).json({

                success: false,

                message: "Order ID is required"

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


        // =========================================
        // AMOUNT
        // =========================================

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


        // =========================================
        // CURRENCY
        // =========================================

        const currency =
            "LKR";


        // =========================================
        // MD5 MERCHANT SECRET
        // =========================================

        const hashedSecret =
            crypto
                .createHash("md5")
                .update(merchant_secret)
                .digest("hex")
                .toUpperCase();


        // =========================================
        // PAYHERE HASH
        // =========================================

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


        // =========================================
        // PAYMENT DATA
        // =========================================

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

            order_id:

                order_id,

            items:

                items,

            currency:

                currency,

            amount:

                amountFormatted,

            hash:

                hash

        };


        // =========================================
        // LOG SAFE DATA ONLY
        // =========================================

        console.log(
            "PAYHERE PAYMENT CREATED:",
            {
                order_id:
                    order_id,

                amount:
                    amountFormatted,

                merchant_id:
                    merchant_id
            }
        );


        // =========================================
        // RESPONSE
        // =========================================

        return res.status(200).json({

            success: true,

            payment: payment

        });

    }


    catch (error) {

        console.error(
            "PAYHERE FUNCTION ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error?.message ||
                "PayHere server error"

        });

    }

}

