import express from "express";
import Comment from "../Modals/comment.js";

const routes = express.Router();

// ==========================================
// ADD COMMENT
// POST /comment/:videoId
// ==========================================

routes.post("/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId, comment } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required",
      });
    }

    const newComment = await Comment.create({
      viewer: userId,
      videoid: videoId,
      comment: comment.trim(),
    });

    const populatedComment = await Comment.findById(
      newComment._id
    ).populate("viewer", "name email image");

    return res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not add comment",
      error: error.message,
    });
  }
});

// ==========================================
// GET COMMENTS
// GET /comment/:videoId
// ==========================================

routes.get("/:videoId", async (req, res) => {
  try {
    const comments = await Comment.find({
      videoid: req.params.videoId,
    })
      .populate("viewer", "name email image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("Get comments error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not get comments",
      error: error.message,
    });
  }
});

// ==========================================
// DELETE COMMENT
// DELETE /comment/:commentId
// ==========================================

routes.delete("/:commentId", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const existingComment = await Comment.findById(
      req.params.commentId
    );

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Only the owner can delete the comment
    if (
      String(existingComment.viewer) !==
      String(userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comment",
      });
    }

    await Comment.findByIdAndDelete(
      req.params.commentId
    );

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete comment",
      error: error.message,
    });
  }
});

export default routes;