import User from "../Modals/Auth.js";

const PLAN_LIMITS = {
  Free: 1,
  Bronze: 5,
  Silver: 10,
  Gold: 20,
};

// Get current subscription
export const getSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const plan = user.subscriptionPlan || "Free";

    return res.json({
      success: true,
      subscriptionPlan: plan,
      subscriptionStatus: user.subscriptionStatus || "active",
      subscriptionExpiresAt: user.subscriptionExpiresAt || null,
      dailyDownloadLimit: PLAN_LIMITS[plan] || 1,
    });
  } catch (error) {
    console.error("Get subscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get subscription",
    });
  }
};

// Change subscription plan
export const changeSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;

    const validPlans = ["Free", "Bronze", "Silver", "Gold"];

    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.subscriptionPlan = plan;
    user.subscriptionStatus = "active";

    // Free plan does not expire
    if (plan === "Free") {
      user.subscriptionExpiresAt = null;
    } else {
      // Paid plans are valid for 30 days
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      user.subscriptionExpiresAt = expiryDate;
    }

    await user.save();

    return res.json({
      success: true,
      message: `Subscription changed to ${plan}`,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      dailyDownloadLimit: PLAN_LIMITS[plan],
    });
  } catch (error) {
    console.error("Change subscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change subscription",
    });
  }
};