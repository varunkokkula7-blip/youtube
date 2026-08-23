import comment from "../Modals/comment.js";

// ==========================================
// ADD COMMENT
// ==========================================

export const addcomment = async (req, res) => {
  const { videoId } = req.params;
  const { userId, comment: commentText } =
    req.body;

  try {
    if (!userId || !videoId || !commentText) {
      return res.status(400).json({
        message:
          "userId, videoId and comment are required",
      });
    }

    const newComment = await comment.create({
      videoid: videoId,
      viewer: userId,
      comment: commentText,
    });

    const populatedComment =
      await comment
        .findById(newComment._id)
        .populate("viewer");

    return res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    console.error(
      "Add comment error:",
      error
    );

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

// ==========================================
// GET COMMENTS
// ==========================================

export const getcomments = async (req, res) => {
  const { videoId } = req.params;

  try {
    const comments = await comment
      .find({
        videoid: videoId,
      })
      .populate("viewer")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error(
      "Get comments error:",
      error
    );

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

// ==========================================
// DELETE COMMENT
// ==========================================

export const deletecomment = async (req, res) => {
  const { commentId } = req.params;

  try {
    await comment.findByIdAndDelete(commentId);

    return res.status(200).json({
      success: true,
      message: "Comment deleted",
    });
  } catch (error) {
    console.error(
      "Delete comment error:",
      error
    );

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};