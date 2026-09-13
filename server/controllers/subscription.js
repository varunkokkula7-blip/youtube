import "dotenv/config";
import crypto from "crypto";
import Razorpay from "razorpay";
import Subscription from "../Modals/subscription.js";
import { sendSubscriptionEmail } from "../utils/sendSubscriptionEmail.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =====================================================
// PLAN DETAILS
// =====================================================

const plans = {
  Free: {
    monthly: 0,
    quarterly: 0,
    yearly: 0,
    features: [
      "Limited premium videos",
      "Standard streaming quality",
      "Limited downloads",
      "Ads supported",
    ],
  },

  Bronze: {
    monthly: 99,
    quarterly: 249,
    yearly: 999,
    features: [
      "HD streaming",
      "Premium videos",
      "Offline downloads",
      "Higher daily limits",
    ],
  },

  Silver: {
    monthly: 199,
    quarterly: 499,
    yearly: 1799,
    features: [
      "Full HD streaming",
      "Unlimited video access",
      "Offline downloads",
      "Ad-free viewing",
      "Priority content access",
    ],
  },

  Gold: {
    monthly: 399,
    quarterly: 999,
    yearly: 3499,
    features: [
      "4K streaming",
      "Unlimited downloads",
      "Ad-free viewing",
      "Priority access",
      "Exclusive premium courses",
      "Faster streaming",
      "Highest daily usage limits",
    ],
  },
};

// =====================================================
// GET PLANS
// =====================================================

export const getPlans = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      plans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to load subscription plans",
    });
  }
};

// =====================================================
// GET CURRENT SUBSCRIPTION
// =====================================================

export const getSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    let subscription = await Subscription.findOne({
      userId,
      status: "active",
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.json({
        success: true,
        subscription: {
          plan: "Free",
          status: "active",
          amount: 0,
        },
      });
    }

    // Automatically expire subscription
    if (
      subscription.expiryDate &&
      new Date(subscription.expiryDate) < new Date()
    ) {
      subscription.status = "expired";
      await subscription.save();

      return res.json({
        success: true,
        subscription: {
          plan: "Free",
          status: "active",
          amount: 0,
        },
      });
    }

    res.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to get subscription",
    });
  }
};

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

export const createOrder = async (req, res) => {
  try {
    const { userId, plan, duration } = req.body;

    if (!userId || !plan || !duration) {
      return res.status(400).json({
        success: false,
        message: "userId, plan and duration are required",
      });
    }

    if (!plans[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    if (!plans[plan][duration]) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription duration",
      });
    }

    const amount = plans[plan][duration];

    if (amount === 0) {
      return res.status(400).json({
        success: false,
        message: "Free plan does not require payment",
      });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
      plan,
      duration,
      amount,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create payment order",
    });
  }
};

// =====================================================
// VERIFY PAYMENT
// =====================================================

export const verifyPayment = async (req, res) => {
  try {
    const {
      userId,
      plan,
      duration,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !userId ||
      !plan ||
      !duration ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete payment information",
      });
    }

    // Generate signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    if (
      !plans[plan] ||
      !Object.prototype.hasOwnProperty.call(plans[plan], duration)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan or duration",
      });
    }

    const amount = plans[plan][duration];

    // Prevent duplicate payment
    const existingPayment = await Subscription.findOne({
      paymentId: razorpay_payment_id,
    });

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: "This payment has already been processed",
      });
    }

    // Calculate dates
    const startDate = new Date();
    const expiryDate = new Date(startDate);

    if (duration === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    if (duration === "quarterly") {
      expiryDate.setMonth(expiryDate.getMonth() + 3);
    }

    if (duration === "yearly") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const invoiceNumber = `INV-${Date.now()}`;

    // Cancel old active subscriptions
    await Subscription.updateMany(
      {
        userId,
        status: "active",
      },
      {
        $set: {
          status: "cancelled",
        },
      }
    );

    const subscription = await Subscription.create({
      userId,
      plan,
      duration,
      amount,
      currency: "INR",
      status: "active",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      invoiceNumber,
      startDate,
      expiryDate,
      renewalDate: expiryDate,
      autoRenew: false,
    });

    if (req.body.email) {
      await sendSubscriptionEmail(req.body.email, subscription);
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      subscription,
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to verify payment",
    });
  }
};

// =====================================================
// CANCEL SUBSCRIPTION
// =====================================================

export const cancelSubscription = async (req, res) => {
  try {
    const { userId } = req.body;

    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    subscription.autoRenew = false;
    subscription.status = "cancelled";

    await subscription.save();

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      subscription,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to cancel subscription",
    });
  }
};

// =====================================================
// GET TRANSACTION HISTORY
// =====================================================

export const getTransactions = async (req, res) => {
  try {
    const { userId } = req.params;

    const transactions = await Subscription.find({
      userId,
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to load transaction history",
    });
  }
};