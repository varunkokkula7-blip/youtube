import mongoose from "mongoose";

const commentReportSchema = new mongoose.Schema(
  {
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
      required: true,
    },

    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "hate",
        "sexual",
        "violence",
        "scam",
        "malicious_link",
        "other",
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

commentReportSchema.index(
  {
    commentId: 1,
    reporterId: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "commentReport",
  commentReportSchema
);