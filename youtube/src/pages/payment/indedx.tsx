"use client";

import { useState } from "react";
import Script from "next/script";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://youtube-hiv1.onrender.com";

const RAZORPAY_KEY_ID =
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // ====================================================
  // START PAYMENT
  // ====================================================

  const handlePayment = async () => {
    if (loading) {
      return;
    }

    if (!RAZORPAY_KEY_ID) {
      setMessage(
        "Razorpay Key ID is not configured."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // ==================================================
      // ₹99 = 9900 PAISE
      // ==================================================

      const amount = 9900;

      // ==================================================
      // CREATE ORDER
      // ==================================================

      const orderResponse = await fetch(
        `${BACKEND_URL}/api/create-order`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            amount,
            currency: "INR",
            receipt: `youtube_${Date.now()}`,
          }),
        }
      );

      const orderData =
        await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData?.message ||
            "Unable to create payment order."
        );
      }

      // ==================================================
      // RAZORPAY OPTIONS
      // ==================================================

      const options = {
        key: RAZORPAY_KEY_ID,

        amount: orderData.amount,

        currency: orderData.currency,

        name: "Your-Tube Clone",

        description:
          "Your-Tube Premium Subscription",

        order_id:
          orderData.order_id,

        handler: async (
          response: any
        ) => {
          try {
            // ==========================================
            // VERIFY PAYMENT
            // ==========================================

            const verifyResponse =
              await fetch(
                `${BACKEND_URL}/api/verify-payment`,
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    razorpay_order_id:
                      response.razorpay_order_id,

                    razorpay_payment_id:
                      response.razorpay_payment_id,

                    razorpay_signature:
                      response.razorpay_signature,
                  }),
                }
              );

            const verifyData =
              await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData?.message ||
                  "Payment verification failed."
              );
            }

            if (verifyData.success) {
              setMessage(
                "Payment successful and verified! ✓"
              );

              alert(
                "Payment successful and verified!"
              );
            } else {
              throw new Error(
                verifyData?.message ||
                  "Payment verification failed."
              );
            }
          } catch (error) {
            console.error(
              "Verification error:",
              error
            );

            setMessage(
              error instanceof Error
                ? error.message
                : "Payment verification failed."
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);

            setMessage(
              "Payment was cancelled."
            );
          },
        },

        theme: {
          color: "#ff0000",
        },
      };

      // ==================================================
      // OPEN RAZORPAY
      // ==================================================

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay Checkout is not loaded yet."
        );
      }

      const razorpay =
        new window.Razorpay(options);

      // ==================================================
      // PAYMENT FAILED
      // ==================================================

      razorpay.on(
        "payment.failed",
        (response: any) => {
          console.error(
            "Payment failed:",
            response
          );

          setMessage(
            response?.error?.description ||
              "Payment failed. Please try again."
          );

          setLoading(false);
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start payment."
      );

      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">

        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8">

          <h1 className="text-3xl font-bold text-center">
            Your-Tube Premium
          </h1>

          <p className="text-gray-400 text-center mt-3">
            Unlock premium features
          </p>

          <div className="text-center mt-8">

            <p className="text-gray-400">
              Premium Plan
            </p>

            <p className="text-4xl font-bold mt-2">
              ₹99
            </p>

            <p className="text-gray-500">
              Monthly
            </p>

          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full mt-8 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 py-3 rounded-lg font-semibold"
          >
            {loading
              ? "Processing..."
              : "Pay ₹99"}
          </button>

          {message && (
            <div className="mt-5 p-4 bg-gray-800 rounded-lg text-center">
              {message}
            </div>
          )}

        </div>

      </main>
    </>
  );
}