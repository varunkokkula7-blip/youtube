import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },

    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    language: {
      type: String,
      default: "en",
    },

    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
      default: null,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    // ================================
    // MODERATION
    // ================================

    moderationStatus: {
      type: String,
      enum: ["visible", "hidden", "removed"],
      default: "visible",
    },

    spamScore: {
      type: Number,
      default: 0,
    },

    spamDetected: {
      type: Boolean,
      default: false,
    },

    maliciousLinkDetected: {
      type: Boolean,
      default: false,
    },

    reportCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("comment", commentSchema);