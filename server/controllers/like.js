import video from "../Modals/video.js";
import Like from "../Modals/like.js";

// ==========================================
// LIKE / DISLIKE VIDEO
// ==========================================

export const handlelike = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId, action } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID required",
      });
    }

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "Video ID required",
      });
    }

    if (action !== "like" && action !== "dislike") {
      return res.status(400).json({
        success: false,
        message: "Action must be like or dislike",
      });
    }

    const foundVideo = await video.findById(videoId);

    if (!foundVideo) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Find user's existing action
    const existingAction = await Like.findOne({
      userId,
      videoId,
    });

    // ==========================================
    // USER ALREADY CLICKED LIKE/DISLIKE
    // ==========================================

    if (existingAction) {
      // Same button clicked again -> remove action
      if (existingAction.action === action) {
        await Like.deleteOne({
          _id: existingAction._id,
        });

        if (action === "like") {
          await video.findByIdAndUpdate(videoId, {
            $inc: {
              Like: -1,
            },
          });
        } else {
          await video.findByIdAndUpdate(videoId, {
            $inc: {
              Dislike: -1,
            },
          });
        }

        const updatedVideo =
          await video.findById(videoId);

        return res.status(200).json({
          success: true,
          liked: false,
          disliked: false,
          Like: Math.max(
            updatedVideo.Like || 0,
            0
          ),
          Dislike: Math.max(
            updatedVideo.Dislike || 0,
            0
          ),
        });
      }

      // ==========================================
      // CHANGE LIKE -> DISLIKE
      // ==========================================

      if (
        existingAction.action === "like" &&
        action === "dislike"
      ) {
        await video.findByIdAndUpdate(videoId, {
          $inc: {
            Like: -1,
            Dislike: 1,
          },
        });

        existingAction.action = "dislike";
        await existingAction.save();
      }

      // ==========================================
      // CHANGE DISLIKE -> LIKE
      // ==========================================

      else if (
        existingAction.action === "dislike" &&
        action === "like"
      ) {
        await video.findByIdAndUpdate(videoId, {
          $inc: {
            Like: 1,
            Dislike: -1,
          },
        });

        existingAction.action = "like";
        await existingAction.save();
      }

      const updatedVideo =
        await video.findById(videoId);

      return res.status(200).json({
        success: true,
        liked: action === "like",
        disliked: action === "dislike",
        Like: Math.max(
          updatedVideo.Like || 0,
          0
        ),
        Dislike: Math.max(
          updatedVideo.Dislike || 0,
          0
        ),
      });
    }

    // ==========================================
    // FIRST ACTION
    // ==========================================

    await Like.create({
      userId,
      videoId,
      action,
    });

    if (action === "like") {
      await video.findByIdAndUpdate(videoId, {
        $inc: {
          Like: 1,
        },
      });
    } else {
      await video.findByIdAndUpdate(videoId, {
        $inc: {
          Dislike: 1,
        },
      });
    }

    const updatedVideo =
      await video.findById(videoId);

    return res.status(200).json({
      success: true,
      liked: action === "like",
      disliked: action === "dislike",
      Like: Math.max(
        updatedVideo.Like || 0,
        0
      ),
      Dislike: Math.max(
        updatedVideo.Dislike || 0,
        0
      ),
    });
  } catch (error) {
    console.error(
      "Like/Dislike error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Could not update like/dislike",
      error: error.message,
    });
  }
};

// ==========================================
// GET USER'S LIKED VIDEOS
// ==========================================

export const getallLikedVideo = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID required",
      });
    }

    const likedVideos = await Like.find({
      userId,
      action: "like",
    })
      .populate({
        path: "videoId",
        model: "videofiles",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      videos: likedVideos,
    });
  } catch (error) {
    console.error(
      "Get liked videos error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Could not get liked videos",
      error: error.message,
    });
  }
};