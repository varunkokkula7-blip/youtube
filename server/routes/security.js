import express from "express";

import {
  getLoginHistory,
  getTrustedDevices,
  removeTrustedDevice,
  changeTheme,
} from "../controllers/security.js";

const router = express.Router();

router.get(
  "/login-history/:userId",
  getLoginHistory
);

router.get(
  "/trusted-devices/:userId",
  getTrustedDevices
);

router.delete(
  "/trusted-devices/:id",
  removeTrustedDevice
);

router.put(
  "/theme/:userId",
  changeTheme
);

export default router;