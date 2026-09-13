import "dotenv/config";
import crypto from "crypto";
import Razorpay from "razorpay";

// ======================================================
// RAZORPAY INSTANCE
// ======================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ======================================================
// CREATE ORDER
// POST /api/create-order
// ======================================================

export const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    // Amount must be supplied in paise
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount)) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid number.",
      });
    }

    if (parsedAmount < 100) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum payment amount is 100 paise (₹1).",
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(parsedAmount),
      currency,
      receipt:
        receipt ||
        `receipt_${Date.now()}`,
    });

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error(
      "Razorpay create order error:",
      error
    );

    // Authentication/configuration failure
    if (
      error?.statusCode === 401 ||
      error?.statusCode === 403
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Razorpay authentication failed. Check your Razorpay credentials.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create Razorpay order.",
    });
  }
};

// ======================================================
// VERIFY PAYMENT
// POST /api/verify-payment
// ======================================================

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Check required fields
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "razorpay_order_id, razorpay_payment_id and razorpay_signature are required.",
      });
    }

    // ==================================================
    // HMAC SHA256
    // ==================================================

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    // ==================================================
    // COMPARE SIGNATURES
    // ==================================================

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message:
          "Payment verification failed. Signature mismatch.",
      });
    }

    // ==================================================
    // SUCCESS
    // ==================================================

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      payment: {
        razorpay_order_id,
        razorpay_payment_id,
      },
    });
  } catch (error) {
    console.error(
      "Razorpay payment verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify Razorpay payment.",
    });
  }
};