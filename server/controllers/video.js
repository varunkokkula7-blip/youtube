import video from "../Modals/video.js";

// ======================================================
// UPLOAD VIDEO
// ======================================================

export const uploadvideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an MP4 video file only",
      });
    }

    const newVideo = new video({
      videotitle: req.body.videotitle || "Untitled Video",

      filename: req.file.filename,

      filepath: req.file.path,

      filetype: req.file.mimetype,

      filesize: req.file.size,

      videochanel:
        req.body.videochanel ||
        req.body.videochannel ||
        "Tech Channel",

      uploader: req.body.uploader || "user",

      Like: 0,

      Dislike: 0,

      views: 0,
    });

    await newVideo.save();

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      video: newVideo,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL VIDEOS
// ======================================================

export const getallvideo = async (req, res) => {
  try {
    const files = await video
      .find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      videos: files,
    });
  } catch (error) {
    console.error("Get videos error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// ======================================================
// LIKE VIDEO
// ======================================================

export const likevideo = async (req, res) => {
  try {
    const { id } = req.params;

    const foundVideo = await video.findById(id);

    if (!foundVideo) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    foundVideo.Like =
      Number(foundVideo.Like || 0) + 1;

    await foundVideo.save();

    return res.status(200).json({
      success: true,
      message: "Video liked",

      Like: foundVideo.Like,

      Dislike: Number(foundVideo.Dislike || 0),

      liked: true,

      disliked: false,
    });
  } catch (error) {
    console.error("Like error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// ======================================================
// DISLIKE VIDEO
// ======================================================

export const dislikevideo = async (req, res) => {
  try {
    const { id } = req.params;

    const foundVideo = await video.findById(id);

    if (!foundVideo) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    foundVideo.Dislike =
      Number(foundVideo.Dislike || 0) + 1;

    await foundVideo.save();

    return res.status(200).json({
      success: true,
      message: "Video disliked",

      Like: Number(foundVideo.Like || 0),

      Dislike: foundVideo.Dislike,

      liked: false,

      disliked: true,
    });
  } catch (error) {
    console.error("Dislike error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};