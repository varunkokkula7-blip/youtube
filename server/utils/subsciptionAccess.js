import Subscription from "../Modals/subscription.js";

const planRank = {
  Free: 0,
  Bronze: 1,
  Silver: 2,
  Gold: 3,
};

export const checkSubscriptionAccess = async (
  userId,
  requiredPlan
) => {
  const subscription = await Subscription.findOne({
    userId,
    status: "active",
  }).sort({
    createdAt: -1,
  });

  if (!subscription) {
    return false;
  }

  if (
    subscription.expiryDate &&
    new Date(subscription.expiryDate) < new Date()
  ) {
    subscription.status = "expired";
    await subscription.save();

    return false;
  }

  return (
    planRank[subscription.plan] >=
    planRank[requiredPlan]
  );
};