"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://youtube-hiv1.onrender.com";

type PlanName = "Free" | "Bronze" | "Silver" | "Gold";

type Plan = {
  monthly: number;
  quarterly: number;
  yearly: number;
  features: string[];
};

type Subscription = {
  plan: string;
  duration?: string;
  amount?: number;
  currency?: string;
  status: string;
  paymentId?: string;
  orderId?: string;
  invoiceNumber?: string;
  startDate?: string;
  expiryDate?: string;
  renewalDate?: string;
  autoRenew?: boolean;
};

export default function SubscriptionPage() {
  const { user } = useUser();

  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [duration, setDuration] =
    useState<"monthly" | "quarterly" | "yearly">("monthly");

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    loadPlans();

    if (user?._id || user?.id) {
      loadSubscription();
    }
  }, [user]);

  // =====================================================
  // LOAD RAZORPAY
  // =====================================================

  const loadRazorpay = () => {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);

      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  // =====================================================
  // LOAD PLANS
  // =====================================================

  const loadPlans = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/subscription/plans`
      );

      const data = await response.json();

      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("Unable to load plans", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD CURRENT SUBSCRIPTION
  // =====================================================

  const loadSubscription = async () => {
    try {
      const userId = user?._id || user?.id;

      if (!userId) return;

      const response = await fetch(
        `${BACKEND_URL}/subscription/user/${userId}`
      );

      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Unable to load subscription", error);
    }
  };

  // =====================================================
  // SUBSCRIBE
  // =====================================================

  const subscribe = async (plan: PlanName) => {
    try {
      const userId = user?._id || user?.id;

      if (!userId) {
        alert("Please sign in first.");
        return;
      }

      if (plan === "Free") {
        alert("You are already able to use the Free plan.");
        return;
      }

      setPaymentLoading(true);

      const razorpayLoaded = await loadRazorpay();

      if (!razorpayLoaded) {
        alert("Unable to load Razorpay.");
        setPaymentLoading(false);
        return;
      }

      // Create order
      const orderResponse = await fetch(
        `${BACKEND_URL}/subscription/create-order`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId,
            plan,
            duration,
          }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        alert(orderData.message);
        setPaymentLoading(false);
        return;
      }

      // Razorpay options
      const options = {
        key: orderData.key,

        amount: orderData.order.amount,

        currency: orderData.order.currency,

        name: "Your-Tube Clone",

        description: `${plan} Subscription - ${duration}`,

        order_id: orderData.order.id,

        handler: async function (response: any) {
          try {
            const verifyResponse = await fetch(
              `${BACKEND_URL}/subscription/verify-payment`,
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",
                },

                body: JSON.stringify({
                  userId,
                  plan,
                  duration,
                  amount: orderData.amount,
                  email: user?.email,

                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              alert(
                "Payment successful! Your subscription is now active."
              );

              setSubscription(verifyData.subscription);

              await loadSubscription();
            } else {
              alert(verifyData.message);
            }
          } catch (error) {
            console.error(error);

            alert(
              "Payment completed but verification failed."
            );
          } finally {
            setPaymentLoading(false);
          }
        },

        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },

        theme: {
          color: "#ff0000",
        },

        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response: any) {
          console.error(response);

          alert(
            "Payment failed. Please try again."
          );

          setPaymentLoading(false);
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(error);

      alert("Unable to start payment.");

      setPaymentLoading(false);
    }
  };

  // =====================================================
  // CANCEL
  // =====================================================

  const cancelSubscription = async () => {
    try {
      const userId = user?._id || user?.id;

      if (!userId) return;

      const confirmCancel = confirm(
        "Are you sure you want to cancel your subscription?"
      );

      if (!confirmCancel) return;

      const response = await fetch(
        `${BACKEND_URL}/subscription/cancel`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Subscription cancelled successfully.");

        await loadSubscription();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);

      alert("Unable to cancel subscription.");
    }
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (date?: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // DAYS LEFT
  // =====================================================

  const getDaysLeft = () => {
    if (!subscription?.expiryDate) return 0;

    const today = new Date();

    const expiry = new Date(
      subscription.expiryDate
    );

    const difference =
      expiry.getTime() - today.getTime();

    return Math.max(
      0,
      Math.ceil(
        difference / (1000 * 60 * 60 * 24)
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading subscription plans...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">

      {/* HEADER */}

      <div className="max-w-6xl mx-auto text-center mb-10">

        <h1 className="text-4xl font-bold">
          Choose Your Subscription
        </h1>

        <p className="text-gray-400 mt-3">
          Unlock premium videos and enhanced features
        </p>

      </div>

      {/* CURRENT SUBSCRIPTION */}

      {subscription && (
        <div className="max-w-6xl mx-auto mb-10">

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div>

                <p className="text-gray-400">
                  My Subscription
                </p>

                <h2 className="text-3xl font-bold mt-1">
                  {subscription.plan}
                </h2>

                <p className="mt-2">
                  Current Plan: {subscription.plan}
                </p>

                {subscription.plan !== "Free" && (
                  <p className="mt-2">
                    Amount: ₹{subscription.amount || 0} / {subscription.duration}
                  </p>
                )}

                <p className="mt-2">
                  Status:{" "}
                  <span className="text-green-400 font-semibold uppercase">
                    {subscription.status} ✓
                  </span>
                </p>

              </div>

              {subscription.plan !== "Free" &&
                subscription.expiryDate && (
                  <div>

                    <p className="text-gray-400">
                      Started
                    </p>

                    <p className="font-semibold">
                      {formatDate(subscription.startDate)}
                    </p>

                    <p className="text-gray-400 mt-3">Expires</p>
                    <p className="font-semibold">
                      {formatDate(subscription.expiryDate)}
                    </p>
                    <p className="text-green-400 mt-1">
                      {getDaysLeft()} days remaining
                    </p>
                    {subscription.renewalDate && (
                      <p className="text-gray-400 mt-2">
                        Renewal: {formatDate(subscription.renewalDate)}
                      </p>
                    )}

                  </div>
                )}

              {subscription.plan !== "Free" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}
                    className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700"
                  >
                    Upgrade
                  </button>
                  <button
                    onClick={() => subscribe(subscription.plan as PlanName)}
                    className="px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700"
                  >
                    Renew
                  </button>
                  <button
                    onClick={cancelSubscription}
                    className="px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              )}

            </div>

            {subscription.paymentId && (
              <div className="border-t border-gray-800 mt-6 pt-5 grid md:grid-cols-3 gap-4 text-sm">

                <div>
                  <p className="text-gray-500">
                    Payment ID
                  </p>
                  <p className="break-all">
                    {subscription.paymentId}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">
                    Order ID
                  </p>
                  <p className="break-all">
                    {subscription.orderId}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">
                    Invoice
                  </p>
                  <p>
                    {subscription.invoiceNumber}
                  </p>
                </div>

              </div>
            )}

            {subscription.plan !== "Free" && (
              <div className="border-t border-gray-800 mt-6 pt-5 grid sm:grid-cols-2 gap-2 text-sm text-gray-300">
                {(plans[subscription.plan]?.features || []).map((feature) => (
                  <p key={feature}>✓ {feature}</p>
                ))}
              </div>
            )}

          </div>

        </div>
      )}

      {/* DURATION */}

      <div className="max-w-6xl mx-auto flex justify-center mb-8">

        <div className="bg-gray-900 rounded-xl p-1 flex">

          {(["monthly", "quarterly", "yearly"] as const).map(
            (item) => (
              <button
                key={item}
                onClick={() => setDuration(item)}
                className={`px-5 py-2 rounded-lg capitalize ${
                  duration === item
                    ? "bg-red-600"
                    : "text-gray-400"
                }`}
              >
                {item}
              </button>
            )
          )}

        </div>

      </div>

      {/* PLANS */}

      <div id="plans" className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {(
          ["Free", "Bronze", "Silver", "Gold"] as PlanName[]
        ).map((planName) => {

          const plan = plans[planName];

          if (!plan) return null;

          const price = plan[duration];

          const isCurrent =
            subscription?.plan === planName;

          return (
            <div
              key={planName}
              className={`rounded-2xl p-6 border ${
                isCurrent
                  ? "border-red-500"
                  : "border-gray-800"
              } bg-gray-900 flex flex-col`}
            >

              <h2 className="text-2xl font-bold">
                {planName}
              </h2>

              <div className="mt-5">

                <span className="text-4xl font-bold">
                  ₹{price}
                </span>

                {planName !== "Free" && (
                  <span className="text-gray-400">
                    /{duration}
                  </span>
                )}

              </div>

              <div className="mt-6 space-y-3 flex-1">

                {plan.features.map(
                  (feature, index) => (
                    <div
                      key={index}
                      className="flex gap-2 text-gray-300"
                    >
                      <span className="text-green-400">
                        ✓
                      </span>

                      <span>{feature}</span>
                    </div>
                  )
                )}

              </div>

              <button
                disabled={
                  isCurrent ||
                  paymentLoading ||
                  planName === "Free"
                }
                onClick={() =>
                  subscribe(planName)
                }
                className={`mt-8 w-full py-3 rounded-lg font-semibold ${
                  isCurrent
                    ? "bg-gray-700 cursor-not-allowed"
                    : planName === "Free"
                    ? "bg-gray-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isCurrent
                  ? "Current Plan"
                  : planName === "Free"
                  ? "Free Plan"
                  : paymentLoading
                  ? "Processing..."
                  : "Subscribe"}
              </button>

            </div>
          );
        })}

      </div>

    </div>
  );
}