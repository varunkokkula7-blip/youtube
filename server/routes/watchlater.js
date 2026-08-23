import express from "express";
import WatchLater from "../Modals/watchlater.js";

const routes = express.Router();

// ======================================================
// ADD / REMOVE WATCH LATER
// POST /watchlater/:videoId
// ======================================================

routes.post("/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId } = req.body;

    if (!videoId || !userId) {
      return res.status(400).json({
        success: false,
        message: "videoId and userId are required",
      });
    }

    // Check existing Watch Later entry
    const existing = await WatchLater.findOne({
      videoId,
      userId,
    });

    // ==================================================
    // REMOVE
    // ==================================================

    if (existing) {
      await WatchLater.deleteOne({
        _id: existing._id,
      });

      return res.status(200).json({
        success: true,
        added: false,
        message: "Removed from Watch Later",
      });
    }

    // ==================================================
    // ADD
    // ==================================================

    const watchLater = await WatchLater.create({
      videoId,
      userId,
    });

    return res.status(201).json({
      success: true,
      added: true,
      message: "Added to Watch Later",
      watchLater,
    });
  } catch (error) {
    console.error("Watch later error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update Watch Later",
      error: error.message,
    });
  }
});

// ======================================================
// GET WATCH LATER VIDEOS
// GET /watchlater/user/:userId
// ======================================================

routes.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const watchLater = await WatchLater.find({
      userId,
    })
      .populate({
        path: "videoId",
        model: "videofiles",
      })
      .sort({
        createdAt: -1,
      })
      .exec();

    // Remove records where the video no longer exists
    const validVideos = watchLater.filter(
      (item) => item.videoId
    );

    return res.status(200).json({
      success: true,
      videos: validVideos,
    });
  } catch (error) {
    console.error(
      "Get watch later error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Could not get Watch Later",
      error: error.message,
    });
  }
});

export default routes;