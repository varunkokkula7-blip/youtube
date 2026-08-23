import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },

  name: {
    type: String,
  },

  Channelname: {
    type: String,
  },

  description: {
    type: String,
  },

  image: {
    type: String,
  },

  joindeon: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("user", userSchema);