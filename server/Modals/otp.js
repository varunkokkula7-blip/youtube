import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
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

    otpHash: {
      type: String,
      required: true,
    },

    challengeToken: {
      type: String,
      required: true,
    },

    deviceToken: {
      type: String,
      default: "",
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("OTP", otpSchema);
