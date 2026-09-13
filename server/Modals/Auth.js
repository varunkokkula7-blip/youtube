import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ==================================================
    // USER INFORMATION
    // ==================================================

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    image: {
      type: String,
      default: "",
    },

    // ==================================================
    // JOIN DATE
    // ==================================================

    joindate: {
      type: Date,
      default: Date.now,
    },

    // ==================================================
    // SUBSCRIPTION
    // ==================================================

    subscriptionPlan: {
      type: String,
      enum: ["Free", "Bronze", "Silver", "Gold"],
      default: "Free",
    },

    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },

    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },

    // ==================================================
    // THEME PREFERENCE
    // ==================================================

    themePreference: {
      type: String,
      enum: ["light", "dark", null],
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

export default mongoose.model("user", userSchema);