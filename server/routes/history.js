import express from "express";
import History from "../Modals/history.js";

const routes = express.Router();

// ======================================================
// ADD VIDEO TO HISTORY
// POST /history/add
// ======================================================

routes.post("/add", async (req, res) => {
  try {
    const { userId, videoId } = req.body;

    if (!userId || !videoId) {
      return res.status(400).json({
        success: false,
        message: "userId and videoId are required",
      });
    }

    // Remove old entry so the newest watch appears first
    await History.deleteOne({
      userId,
      videoId,
    });

    // Create new history entry
    const history = await History.create({
      userId,
      videoId,
      watchedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Video added to history",
      history,
    });
  } catch (error) {
    console.error("Add history error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not add history",
      error: error.message,
    });
  }
});

// ======================================================
// GET USER HISTORY
// GET /history/:userId
// ======================================================

routes.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const history = await History.find({
      userId,
    })
      .populate({
        path: "videoId",
        model: "videofiles",
      })
      .sort({
        watchedAt: -1,
      })
      .exec();

    // Remove entries where the video no longer exists
    const validHistory = history.filter(
      (item) => item.videoId
    );

    return res.status(200).json({
      success: true,
      videos: validHistory,
    });
  } catch (error) {
    console.error("Get history error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not get history",
      error: error.message,
    });
  }
});

// ======================================================
// CLEAR USER HISTORY
// DELETE /history/:userId
// ======================================================

routes.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    await History.deleteMany({
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "History cleared",
    });
  } catch (error) {
    console.error("Clear history error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not clear history",
      error: error.message,
    });
  }
});

export default routes;