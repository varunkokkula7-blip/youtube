import express from "express";

import {
  getSubscription,
  changeSubscription,
} from "../controllers/subscription.js";

const router = express.Router();

// Get user's current subscription
router.get("/:userId", getSubscription);

// Change user's subscription
router.put("/:userId", changeSubscription);

export default router;