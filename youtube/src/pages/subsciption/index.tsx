import { useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://youtube-hiv1.onrender.com";

type Plan = {
  name: "Free" | "Bronze" | "Silver" | "Gold";
  limit: number;
  description: string;
};

const plans: Plan[] = [
  {
    name: "Free",
    limit: 1,
    description: "1 video download per day",
  },
  {
    name: "Bronze",
    limit: 5,
    description: "5 video downloads per day",
  },
  {
    name: "Silver",
    limit: 10,
    description: "10 video downloads per day",
  },
  {
    name: "Gold",
    limit: 20,
    description: "20 video downloads per day",
  },
];

export default function SubscriptionPage() {
  const { user } = useUser();

  const [currentPlan, setCurrentPlan] = useState("Free");
  const [status, setStatus] = useState("active");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [message, setMessage] = useState("");

  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadSubscription();
  }, [userId]);

  const loadSubscription = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/subscription/${userId}`
      );

      const data = await response.json();

      if (data.success) {
        setCurrentPlan(data.subscriptionPlan || "Free");
        setStatus(data.subscriptionStatus || "active");
        setExpiresAt(data.subscriptionExpiresAt || null);
      }
    } catch (error) {
      console.error("Subscription loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const changePlan = async (plan: string) => {
    if (!userId) {
      setMessage("Please sign in first.");
      return;
    }

    if (plan === currentPlan) {
      setMessage(`You are already using the ${plan} plan.`);
      return;
    }

    setChanging(true);
    setMessage("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/subscription/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Failed to change plan.");
        return;
      }

      setCurrentPlan(data.subscriptionPlan);
      setStatus(data.subscriptionStatus);
      setExpiresAt(data.subscriptionExpiresAt || null);

      setMessage(
        `Successfully changed to ${data.subscriptionPlan} plan.`
      );
    } catch (error) {
      console.error("Plan change error:", error);
      setMessage("Unable to change subscription.");
    } finally {
      setChanging(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">
          Subscription Plans
        </h1>

        <p className="mt-4 text-gray-600">
          Please sign in to manage your subscription.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <p>Loading subscription...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-center text-3xl font-bold">
          Subscription Plans
        </h1>

        <p className="mt-2 text-center text-gray-600">
          Choose a plan for your video downloads
        </p>

        {/* Current subscription */}
        <div className="mx-auto mt-8 max-w-xl rounded-xl border bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">
            Current Subscription
          </h2>

          <div className="mt-4 space-y-2">
            <p>
              <strong>Plan:</strong> {currentPlan}
            </p>

            <p>
              <strong>Status:</strong> {status}
            </p>

            <p>
              <strong>Download limit:</strong>{" "}
              {plans.find((p) => p.name === currentPlan)?.limit || 1}{" "}
              per day
            </p>

            {expiresAt && (
              <p>
                <strong>Expires:</strong>{" "}
                {new Date(expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mx-auto mt-6 max-w-xl rounded-lg border bg-white p-4 text-center">
            {message}
          </div>
        )}

        {/* Plans */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.name;

            return (
              <div
                key={plan.name}
                className={`rounded-xl border bg-white p-6 shadow transition ${
                  isCurrent
                    ? "ring-2 ring-black"
                    : "hover:shadow-lg"
                }`}
              >
                <h2 className="text-2xl font-bold">
                  {plan.name}
                </h2>

                <p className="mt-4 text-3xl font-bold">
                  {plan.limit}
                </p>

                <p className="text-gray-600">
                  downloads/day
                </p>

                <p className="mt-4 min-h-[48px] text-sm text-gray-600">
                  {plan.description}
                </p>

                <button
                  onClick={() => changePlan(plan.name)}
                  disabled={isCurrent || changing}
                  className={`mt-6 w-full rounded-lg px-4 py-3 font-semibold ${
                    isCurrent
                      ? "cursor-not-allowed bg-gray-300 text-gray-700"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {isCurrent
                    ? "Current Plan"
                    : changing
                    ? "Updating..."
                    : `Choose ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}