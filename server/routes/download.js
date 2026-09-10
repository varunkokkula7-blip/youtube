import express from "express";

import {
  downloadVideo,
  getDownloadInfo,
  getUserDownloads,
} from "../controllers/download.js";

const router = express.Router();

// Get current user's quota
router.get(
  "/info/:userId",
  getDownloadInfo
);

// Get user's downloaded videos
router.get(
  "/user/:userId",
  getUserDownloads
);

// Download video
router.get(
  "/:userId/:videoId",
  downloadVideo
);

export default router;