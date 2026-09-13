import express from "express";

import {
  getPlans,
  getSubscription,
  createOrder,
  verifyPayment,
  cancelSubscription,
  getTransactions,
} from "../controllers/subscription.js";

const router = express.Router();

router.get("/plans", getPlans);

router.get("/user/:userId", getSubscription);

router.post("/create-order", createOrder);

router.post("/verify-payment", verifyPayment);

router.post("/cancel", cancelSubscription);

router.get("/transactions/:userId", getTransactions);

export default router;