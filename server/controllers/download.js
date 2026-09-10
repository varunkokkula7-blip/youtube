import Download from "../Modals/download.js";
import User from "../Modals/Auth.js";
import Video from "../Modals/video.js";

import fs from "fs";
import path from "path";

// ======================================================
// SUBSCRIPTION LIMITS
// ======================================================

const PLAN_LIMITS = {
  Free: {
    daily: 1,
    monthly: 30,
  },

  Bronze: {
    daily: 3,
    monthly: 90,
  },

  Silver: {
    daily: 5,
    monthly: 150,
  },

  Gold: {
    daily: 10,
    monthly: 300,
  },
};

// ======================================================
// GET CURRENT DATE RANGES
// ======================================================

const getDayStart = () => {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
};

const getMonthStart = () => {
  const date = new Date();

  date.setDate(1);
  date.setHours(0, 0, 0, 0);

  return date;
};

// ======================================================
// DEVICE INFORMATION
// ======================================================

const getDevice = (userAgent = "") => {
  const ua = userAgent.toLowerCase();

  if (ua.includes("mobile")) {
    return "Mobile";
  }

  if (ua.includes("tablet")) {
    return "Tablet";
  }

  return "Desktop";
};

// ======================================================
// BROWSER INFORMATION
// ======================================================

const getBrowser = (userAgent = "") => {
  const ua = userAgent.toLowerCase();

  if (ua.includes("edg")) {
    return "Microsoft Edge";
  }

  if (ua.includes("chrome")) {
    return "Google Chrome";
  }

  if (ua.includes("firefox")) {
    return "Mozilla Firefox";
  }

  if (ua.includes("safari")) {
    return "Safari";
  }

  return "Unknown Browser";
};

// ======================================================
// GET DOWNLOAD INFORMATION
// ======================================================

export const getDownloadInfo = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const plan = user.subscriptionPlan || "Free";

    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.Free;

    const dayStart = getDayStart();
    const monthStart = getMonthStart();

    const dailyCount = await Download.countDocuments({
      userId,
      status: "success",
      downloadedAt: {
        $gte: dayStart,
      },
    });

    const monthlyCount = await Download.countDocuments({
      userId,
      status: "success",
      downloadedAt: {
        $gte: monthStart,
      },
    });

    res.json({
      success: true,

      plan,

      dailyLimit: limits.daily,

      dailyUsed: dailyCount,

      dailyRemaining: Math.max(
        limits.daily - dailyCount,
        0
      ),

      monthlyLimit: limits.monthly,

      monthlyUsed: monthlyCount,

      monthlyRemaining: Math.max(
        limits.monthly - monthlyCount,
        0
      ),
    });
  } catch (error) {
    console.error("Download info error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to get download information",
    });
  }
};

// ======================================================
// GET USER DOWNLOAD HISTORY
// ======================================================

export const getUserDownloads = async (req, res) => {
  try {
    const { userId } = req.params;

    const downloads = await Download.find({
      userId,
      status: "success",
    })
      .populate("videoId")
      .sort({
        downloadedAt: -1,
      });

    res.json({
      success: true,
      downloads,
    });
  } catch (error) {
    console.error("Download history error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load downloads",
    });
  }
};

// ======================================================
// DOWNLOAD VIDEO
// ======================================================

export const downloadVideo = async (req, res) => {
  let downloadRecord = null;

  try {
    const { userId, videoId } = req.params;

    // --------------------------------------------------
    // FIND USER
    // --------------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // --------------------------------------------------
    // CHECK SUBSCRIPTION
    // --------------------------------------------------

    const plan = user.subscriptionPlan || "Free";

    const subscriptionStatus =
      user.subscriptionStatus || "active";

    if (subscriptionStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your subscription is not active",
      });
    }

    // --------------------------------------------------
    // CHECK SUBSCRIPTION EXPIRY
    // --------------------------------------------------

    if (
      user.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt) < new Date()
    ) {
      return res.status(403).json({
        success: false,
        message: "Your subscription has expired",
      });
    }

    // --------------------------------------------------
    // FIND VIDEO
    // --------------------------------------------------

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // --------------------------------------------------
    // VIDEO ACCESSIBILITY
    // --------------------------------------------------

    if (video.isDownloadable === false) {
      return res.status(403).json({
        success: false,
        message: "This video is not available for download",
      });
    }

    // --------------------------------------------------
    // PLAN LIMIT
    // --------------------------------------------------

    const limits =
      PLAN_LIMITS[plan] || PLAN_LIMITS.Free;

    const dayStart = getDayStart();

    const monthStart = getMonthStart();

    // --------------------------------------------------
    // PREVENT DUPLICATE DOWNLOAD COUNT
    // --------------------------------------------------

    const duplicateDownload = await Download.findOne({
      userId,
      videoId,
      status: "success",
      downloadedAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    // --------------------------------------------------
    // DAILY COUNT
    // --------------------------------------------------

    const dailyCount = await Download.countDocuments({
      userId,
      status: {
        $in: ["started", "success"],
      },
      downloadedAt: {
        $gte: dayStart,
      },
    });

    // --------------------------------------------------
    // MONTHLY COUNT
    // --------------------------------------------------

    const monthlyCount = await Download.countDocuments({
      userId,
      status: {
        $in: ["started", "success"],
      },
      downloadedAt: {
        $gte: monthStart,
      },
    });

    // --------------------------------------------------
    // ONLY NEW DOWNLOADS CONSUME QUOTA
    // --------------------------------------------------

    if (!duplicateDownload) {
      if (dailyCount >= limits.daily) {
        return res.status(429).json({
          success: false,
          message: `Daily download limit reached for ${plan} plan`,
          dailyLimit: limits.daily,
          dailyUsed: dailyCount,
          dailyRemaining: 0,
        });
      }

      if (monthlyCount >= limits.monthly) {
        return res.status(429).json({
          success: false,
          message: `Monthly download limit reached for ${plan} plan`,
          monthlyLimit: limits.monthly,
          monthlyUsed: monthlyCount,
          monthlyRemaining: 0,
        });
      }
    }

    // --------------------------------------------------
    // FILE PATH
    // --------------------------------------------------

    let filePath =
      video.filepath || video.path || "";

    filePath = filePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    if (filePath.startsWith("uploads/")) {
      filePath = filePath.substring("uploads/".length);
    }

    const absolutePath = path.resolve(
      process.cwd(),
      "uploads",
      filePath
    );

    // --------------------------------------------------
    // CHECK FILE
    // --------------------------------------------------

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: "Video file not found on server",
      });
    }

    // --------------------------------------------------
    // FILE INFORMATION
    // --------------------------------------------------

    const stats = fs.statSync(absolutePath);

    const originalFileName =
      video.filename ||
      path.basename(absolutePath);

    // --------------------------------------------------
    // DUPLICATE DOWNLOAD
    // --------------------------------------------------

    if (!duplicateDownload) {
      const userAgent =
        req.headers["user-agent"] || "";

      const ipAddress =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "";

      // ------------------------------------------------
      // CREATE DOWNLOAD RECORD
      // ------------------------------------------------

      downloadRecord = await Download.create({
        userId,
        videoId,

        videoTitle:
          video.videotitle || "Untitled Video",

        thumbnail:
          video.thumbnail || "",

        fileName: originalFileName,

        fileSize: stats.size,

        subscriptionPlan: plan,

        status: "started",

        ipAddress: String(ipAddress),

        device: getDevice(userAgent),

        browser: getBrowser(userAgent),

        downloadedAt: new Date(),
      });
    }

    // --------------------------------------------------
    // DOWNLOAD HEADERS
    // --------------------------------------------------

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(
        originalFileName
      )}"`
    );

    res.setHeader(
      "Content-Type",
      video.filetype || "video/mp4"
    );

    res.setHeader(
      "Content-Length",
      stats.size
    );

    // --------------------------------------------------
    // SEND FILE
    // --------------------------------------------------

    const fileStream = fs.createReadStream(
      absolutePath
    );

    fileStream.on("error", async (error) => {
      console.error(
        "Download stream error:",
        error
      );

      if (downloadRecord) {
        await Download.findByIdAndUpdate(
          downloadRecord._id,
          {
            status: "failed",
          }
        );
      }

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Download failed",
        });
      }
    });

    res.on("finish", async () => {
      if (downloadRecord) {
        await Download.findByIdAndUpdate(
          downloadRecord._id,
          {
            status: "success",
          }
        );
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error(
      "Download video error:",
      error
    );

    if (downloadRecord) {
      await Download.findByIdAndUpdate(
        downloadRecord._id,
        {
          status: "failed",
        }
      );
    }

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Unable to download video",
      });
    }
  }
};