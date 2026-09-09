import express from "express";

import { login } from "../controllers/auth.js";
import User from "../Modals/Auth.js";

const routes = express.Router();

// ===============================
// LOGIN
// ===============================
routes.post("/login", login);

// ===============================
// SEARCH USERS FOR @MENTIONS
// Example:
// GET /user/search?q=rahul
// ===============================
routes.get("/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.json({
        success: true,
        users: [],
      });
    }

    const users = await User.find({
      $or: [
        {
          name: {
            $regex: query,
            $options: "i",
          },
        },
        {
          Channelname: {
            $regex: query,
            $options: "i",
          },
        },
        {
          email: {
            $regex: query,
            $options: "i",
          },
        },
      ],
    })
      .select("_id name Channelname email image")
      .limit(10);

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("User search error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search users",
    });
  }
});

export default routes;