import video from "../Modals/video.js";
import history from "../Modals/history.js";

// ======================================================
// ADD VIDEO TO HISTORY
// POST /history/:videoId
// ======================================================

export const handlehistory = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "Video ID is required",
      });
    }

    // Check video exists
    const existingVideo = await video.findById(videoId);

    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check whether this video is already in history
    const existingHistory = await history.findOne({
      userId,
      videoId,
    });

    if (existingHistory) {
      // Update watched time instead of creating duplicates
      existingHistory.watchedAt = new Date();
      await existingHistory.save();
    } else {
      await history.create({
        userId,
        videoId,
        watchedAt: new Date(),
      });
    }

    // Increase video views
    await video.findByIdAndUpdate(videoId, {
      $inc: {
        views: 1,
      },
    });

    return res.status(200).json({
      success: true,
      history: true,
      message: "Video added to history",
    });
  } catch (error) {
    console.error("History error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// ======================================================
// INCREASE VIDEO VIEW
// GET /history/view/:videoId
// ======================================================

export const handleview = async (req, res) => {
  const { videoId } = req.params;

  try {
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "Video ID is required",
      });
    }

    const existingVideo = await video.findById(videoId);

    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    await video.findByIdAndUpdate(videoId, {
      $inc: {
        views: 1,
      },
    });

    return res.status(200).json({
      success: true,
      message: "View counted",
    });
  } catch (error) {
    console.error("View error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// ======================================================
// GET USER HISTORY
// GET /history/:userId
// ======================================================

export const getallhistoryVideo = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const historyVideos = await history
      .find({
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

    // Remove history records where the video was deleted
    const validHistory = historyVideos.filter(
      (item) => item.videoId
    );

    return res.status(200).json({
      success: true,
      videos: validHistory,
    });
  } catch (error) {
    console.error(
      "Get history videos error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};