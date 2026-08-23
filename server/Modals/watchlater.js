import mongoose from "mongoose";

const watchLaterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

watchLaterSchema.index(
  { userId: 1, videoId: 1 },
  { unique: true }
);

export default mongoose.model(
  "watchlater",
  watchLaterSchema
);