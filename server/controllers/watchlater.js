import watchlater from "../Modals/watchlater.js";
import video from "../Modals/video.js";

// ======================================================
// ADD / REMOVE WATCH LATER
// POST /watchlater/:videoId
// ======================================================

export const handlewatchlater = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;

  try {
    if (!userId || !videoId) {
      return res.status(400).json({
        success: false,
        message: "userId and videoId are required",
      });
    }

    // Check that the video exists
    const existingVideo = await video.findById(videoId);

    if (!existingVideo) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check whether already in Watch Later
    const existing = await watchlater.findOne({
      userId,
      videoId,
    });

    // ==================================================
    // REMOVE FROM WATCH LATER
    // ==================================================

    if (existing) {
      await watchlater.findByIdAndDelete(
        existing._id
      );

      return res.status(200).json({
        success: true,
        watchlater: false,
        message: "Removed from Watch Later",
      });
    }

    // ==================================================
    // ADD TO WATCH LATER
    // ==================================================

    await watchlater.create({
      userId,
      videoId,
    });

    return res.status(200).json({
      success: true,
      watchlater: true,
      message: "Added to Watch Later",
    });
  } catch (error) {
    console.error(
      "Watch later error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL WATCH LATER VIDEOS
// GET /watchlater/:userId
// ======================================================

export const getallwatchlater = async (
  req,
  res
) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const videos = await watchlater
      .find({
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

    // Remove records where video was deleted
    const validVideos = videos.filter(
      (item) => item.videoId
    );

    return res.status(200).json({
      success: true,
      videos: validVideos,
    });
  } catch (error) {
    console.error(
      "Get Watch Later error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};