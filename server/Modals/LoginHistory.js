import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    ipAddress: {
      type: String,
      default: "",
    },

    browser: {
      type: String,
      default: "",
    },

    browserVersion: {
      type: String,
      default: "",
    },

    operatingSystem: {
      type: String,
      default: "",
    },

    deviceType: {
      type: String,
      enum: ["Desktop", "Mobile", "Tablet", "Unknown"],
      default: "Unknown",
    },

    deviceModel: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "",
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: ["success", "failed", "otp_required"],
      default: "success",
    },

    loginTime: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,
  }
);

export default mongoose.model("LoginHistory", loginHistorySchema);