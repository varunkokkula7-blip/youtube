import express from "express";
import mongoose from "mongoose";

import Comment from "../Modals/comment.js";
import CommentReport from "../Modals/commentReport.js";
import User from "../Modals/Auth.js";

const router = express.Router();

// ======================================================
// ADMIN CHECK
// ======================================================

const isAdmin = async (userId) => {
  if (
    !userId ||
    !mongoose.Types.ObjectId.isValid(
      userId
    )
  ) {
    return false;
  }

  const user =
    await User.findById(userId)
      .select("email")
      .lean();

  if (!user) {
    return false;
  }

  const adminEmail =
    process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    return false;
  }

  return (
    String(user.email)
      .toLowerCase()
      .trim() ===
    String(adminEmail)
      .toLowerCase()
      .trim()
  );
};

// ======================================================
// ADMIN REPORT LIST
// ======================================================

router.get(
  "/reports",
  async (req, res) => {
    try {
      const userId =
        req.query.userId;

      if (
        !(await isAdmin(userId))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin access required.",
        });
      }

      const reports =
        await CommentReport.find()
          .populate(
            "reporterId",
            "_id name email image"
          )
          .populate({
            path: "commentId",
            populate: {
              path: "viewer",
              select:
                "_id name email image",
            },
          })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.json({
        success: true,
        reports,
      });
    } catch (error) {
      console.error(
        "Admin reports error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not load reports.",
      });
    }
  }
);

// ======================================================
// HIDE COMMENT
// ======================================================

router.patch(
  "/comments/:commentId/hide",
  async (req, res) => {
    try {
      const userId =
        req.body?.userId;

      if (
        !(await isAdmin(userId))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin access required.",
        });
      }

      const {
        commentId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          commentId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid comment ID.",
        });
      }

      const comment =
        await Comment.findByIdAndUpdate(
          commentId,
          {
            moderationStatus:
              "hidden",
          },
          {
            new: true,
          }
        );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message:
            "Comment not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Comment hidden successfully.",
      });
    } catch (error) {
      console.error(
        "Hide comment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not hide comment.",
      });
    }
  }
);

// ======================================================
// REMOVE COMMENT
// ======================================================

router.delete(
  "/comments/:commentId",
  async (req, res) => {
    try {
      const userId =
        req.body?.userId;

      if (
        !(await isAdmin(userId))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin access required.",
        });
      }

      const {
        commentId,
      } = req.params;

      const comment =
        await Comment.findByIdAndUpdate(
          commentId,
          {
            isDeleted: true,
            moderationStatus:
              "removed",
          },
          {
            new: true,
          }
        );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message:
            "Comment not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Comment removed successfully.",
      });
    } catch (error) {
      console.error(
        "Remove comment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not remove comment.",
      });
    }
  }
);

// ======================================================
// MARK REPORT REVIEWED
// ======================================================

router.patch(
  "/reports/:reportId/review",
  async (req, res) => {
    try {
      const userId =
        req.body?.userId;

      if (
        !(await isAdmin(userId))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin access required.",
        });
      }

      const report =
        await CommentReport.findByIdAndUpdate(
          req.params.reportId,
          {
            status: "reviewed",
          },
          {
            new: true,
          }
        );

      if (!report) {
        return res.status(404).json({
          success: false,
          message:
            "Report not found.",
        });
      }

      return res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error(
        "Review report error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not update report.",
      });
    }
  }
);

export default router;