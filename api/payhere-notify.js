
import crypto from "crypto";

export default async function handler(req, res) {

    // =====================================================
    // ONLY POST
    // =====================================================

    if (req.method !== "POST") {

        return res.status(405).send(
            "Method Not Allowed"
        );

    }


    try {

        // =================================================
        // PAYHERE SENDS FORM-URLENCODED DATA
        // =================================================

        const body = req.body || {};


        const merchant_id =
            String(body.merchant_id || "");


        const order_id =
            String(body.order_id || "");


        const payment_id =
            String(body.payment_id || "");


        const payhere_amount =
            String(body.payhere_amount || "");


        const payhere_currency =
            String(body.payhere_currency || "");


        const status_code =
            String(body.status_code || "");


        const md5sig =
            String(body.md5sig || "");


        const status_message =
            String(body.status_message || "");


        const method =
            String(body.method || "");


        // =================================================
        // GET MERCHANT SECRET
        // =================================================

        const merchant_secret =
            process.env.PAYHERE_MERCHANT_SECRET;


        if (!merchant_secret) {

            console.error(
                "PAYHERE_MERCHANT_SECRET is missing"
            );

            return res.status(500).send(
                "Merchant secret missing"
            );

        }


        // =================================================
        // BASIC VALIDATION
        // =================================================

        if (
            !merchant_id ||
            !order_id ||
            !payhere_amount ||
            !payhere_currency ||
            !status_code ||
            !md5sig
        ) {

            console.error(
                "Invalid PayHere notification",
                body
            );

            return res.status(400).send(
                "Invalid notification"
            );

        }


        // =================================================
        // VERIFY MERCHANT ID
        // =================================================

        const expectedMerchantId =
            process.env.PAYHERE_MERCHANT_ID;


        if (
            expectedMerchantId &&
            merchant_id !== expectedMerchantId
        ) {

            console.error(
                "Merchant ID mismatch"
            );

            return res.status(400).send(
                "Merchant ID mismatch"
            );

        }


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
        // GENERATE LOCAL MD5SIG
        // =================================================

        const localMd5Sig =
            crypto
                .createHash("md5")
                .update(
                    merchant_id +
                    order_id +
                    payhere_amount +
                    payhere_currency +
                    status_code +
                    hashedSecret
                )
                .digest("hex")
                .toUpperCase();


        // =================================================
        // VERIFY PAYHERE SIGNATURE
        // =================================================

        if (
            localMd5Sig !==
            md5sig.toUpperCase()
        ) {

            console.error(
                "INVALID PAYHERE MD5SIG",
                {
                    order_id,
                    status_code
                }
            );

            return res.status(400).send(
                "Invalid signature"
            );

        }


        // =================================================
        // VERIFIED PAYMENT
        // =================================================

        console.log(
            "PAYHERE NOTIFICATION VERIFIED",
            {
                order_id,
                payment_id,
                amount: payhere_amount,
                currency: payhere_currency,
                status_code,
                status_message,
                method
            }
        );


        // =================================================
        // PAYMENT STATUS
        // =================================================

        let paymentStatus =
            "unknown";


        if (status_code === "2") {

            paymentStatus =
                "paid";

        }

        else if (status_code === "0") {

            paymentStatus =
                "pending";

        }

        else if (status_code === "-1") {

            paymentStatus =
                "cancelled";

        }

        else if (status_code === "-2") {

            paymentStatus =
                "failed";

        }

        else if (status_code === "-3") {

            paymentStatus =
                "chargedback";

        }


        // =================================================
        // IMPORTANT
        // =================================================

        /*
         * Payment notification is now VERIFIED.
         *
         * For now we log the verified result.
         *
         * Next step:
         * Save/update this order in Firestore.
         */


        console.log(
            "FINAL PAYMENT STATUS:",
            paymentStatus
        );


        // =================================================
        // SUCCESS RESPONSE TO PAYHERE
        // =================================================

        return res.status(200).send(
            "OK"
        );

    }


    catch (error) {

        console.error(
            "PAYHERE NOTIFY ERROR:",
            error
        );


        return res.status(500).send(
            "Server Error"
        );

    }

}

