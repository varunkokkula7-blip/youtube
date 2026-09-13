import express from "express";
import mongoose from "mongoose";

import Comment from "../Modals/comment.js";
import User from "../Modals/Auth.js";
import CommentReport from "../Modals/commentReport.js";

const router = express.Router();

// ======================================================
// BASIC HELPERS
// ======================================================

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

const getUserId = (req) => {
  return (
    req.body?.userId ||
    req.body?.viewer ||
    req.body?.user ||
    req.query?.userId ||
    req.headers["x-user-id"] ||
    ""
  );
};

// ======================================================
// COMMENT SORTING
// ======================================================

const sortComments = (comments, sort = "newest") => {
  const result = [...comments];

  if (sort === "oldest") {
    return result.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    );
  }

  if (sort === "top") {
    return result.sort((a, b) => {
      const aLikes = a.likes?.length || 0;
      const bLikes = b.likes?.length || 0;

      if (bLikes !== aLikes) {
        return bLikes - aLikes;
      }

      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    });
  }

  return result.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );
};

// ======================================================
// TASK 9 — PROFANITY FILTER
// ======================================================

const PROFANITY_WORDS = [
  "fuck",
  "fucking",
  "fucked",
  "shit",
  "bitch",
  "bastard",
  "asshole",
  "idiot",
  "stupid",
  "dumbass",
  "motherfucker",
  "bullshit",
];

const normalizeModerationText = (text) => {
  return String(text || "")
    .toLowerCase()
    .replace(/[@]/g, "a")
    .replace(/[0-9]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const findProfanity = (text) => {
  const normalized = normalizeModerationText(text);

  if (!normalized) {
    return null;
  }

  const words = normalized.split(/\s+/);

  for (const badWord of PROFANITY_WORDS) {
    if (words.includes(badWord)) {
      return badWord;
    }
  }

  return null;
};

// ======================================================
// TASK 10 — SPAM DETECTION
// ======================================================

const normalizeSpamText = (text) => {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

const isRepeatedCharacters = (text) => {
  return /(.)\1{7,}/i.test(text);
};

const hasSpamPattern = (text) => {
  const lower = text.toLowerCase();

  const spamWords = [
    "free money",
    "click here",
    "earn money",
    "make money fast",
    "subscribe my channel",
    "visit my channel",
    "dm me",
    "whatsapp me",
    "telegram me",
    "you won",
    "claim prize",
  ];

  return spamWords.some((word) =>
    lower.includes(word)
  );
};

// ======================================================
// TASK 11 — MALICIOUS LINK DETECTION
// ======================================================

const hasMaliciousLink = (text) => {
  const lower = String(text || "").toLowerCase();

  const dangerousPatterns = [
    "javascript:",
    "data:text/html",
    "vbscript:",
    "file://",
    "powershell",
    "cmd.exe",
    ".exe",
    ".scr",
    ".bat",
    ".cmd",
  ];

  if (
    dangerousPatterns.some((pattern) =>
      lower.includes(pattern)
    )
  ) {
    return true;
  }

  const urls =
    lower.match(
      /https?:\/\/[^\s]+/gi
    ) || [];

  for (const url of urls) {
    try {
      const parsed = new URL(url);

      const hostname =
        parsed.hostname.toLowerCase();

      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.")
      ) {
        return true;
      }

      if (
        parsed.protocol !== "http:" &&
        parsed.protocol !== "https:"
      ) {
        return true;
      }
    } catch {
      return true;
    }
  }

  return false;
};

// ======================================================
// TASK 10 — DUPLICATE DETECTION
// ======================================================

const checkDuplicateComment = async ({
  userId,
  videoId,
  text,
}) => {
  const normalized = normalizeSpamText(text);

  const recentComments =
    await Comment.find({
      viewer: userId,
      videoid: videoId,
      createdAt: {
        $gte: new Date(
          Date.now() - 10 * 60 * 1000
        ),
      },
      isDeleted: false,
    })
      .select("comment")
      .lean();

  return recentComments.some(
    (item) =>
      normalizeSpamText(item.comment) ===
      normalized
  );
};

// ======================================================
// TASK 11 — RATE LIMITING
// ======================================================

const rateLimitMap = new Map();

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_ACTIONS_PER_MINUTE = 5;

const checkRateLimit = (userId) => {
  const now = Date.now();

  const existing =
    rateLimitMap.get(String(userId)) || [];

  const recent = existing.filter(
    (time) =>
      now - time < RATE_LIMIT_WINDOW
  );

  if (
    recent.length >=
    MAX_ACTIONS_PER_MINUTE
  ) {
    rateLimitMap.set(
      String(userId),
      recent
    );

    return false;
  }

  recent.push(now);

  rateLimitMap.set(
    String(userId),
    recent
  );

  return true;
};

// ======================================================
// MODERATION CHECK
// ======================================================

const moderateText = async ({
  userId,
  videoId,
  text,
  res,
}) => {
  // PROFANITY

  const profanity =
    findProfanity(text);

  if (profanity) {
    res.status(400).json({
      success: false,
      blocked: true,
      reason: "profanity",
      message:
        "Your comment contains inappropriate language. Please remove offensive words and try again.",
    });

    return false;
  }

  // MALICIOUS LINK

  if (hasMaliciousLink(text)) {
    res.status(400).json({
      success: false,
      blocked: true,
      reason: "malicious_link",
      message:
        "Malicious links are not allowed.",
    });

    return false;
  }

  // RATE LIMIT

  if (!checkRateLimit(userId)) {
    res.status(429).json({
      success: false,
      blocked: true,
      reason: "rate_limit",
      message:
        "Too many comments. Please try again later.",
    });

    return false;
  }

  // DUPLICATE

  const duplicate =
    await checkDuplicateComment({
      userId,
      videoId,
      text,
    });

  if (duplicate) {
    res.status(400).json({
      success: false,
      blocked: true,
      reason: "duplicate",
      message:
        "You have already posted the same comment recently.",
    });

    return false;
  }

  // SPAM

  if (
    isRepeatedCharacters(text) ||
    hasSpamPattern(text)
  ) {
    res.status(400).json({
      success: false,
      blocked: true,
      reason: "spam",
      message:
        "This comment looks like spam. Please write a normal comment and try again.",
    });

    return false;
  }

  return true;
};

// ======================================================
// TRANSLATION
// KEEP YOUR EXISTING TRANSLATION IMPLEMENTATION HERE
// ======================================================

router.post("/translate", async (req, res) => {
  try {
    const {
      text,
      sourceLanguage,
      targetLanguage,
    } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required.",
      });
    }

    // If English is selected, no translation is required.
    if (
      !targetLanguage ||
      targetLanguage === sourceLanguage ||
      targetLanguage === "en"
    ) {
      return res.json({
        success: true,
        translatedText: text,
      });
    }

    const translationUrl =
      "https://translate.googleapis.com/translate_a/single" +
      `?client=gtx&sl=auto&tl=${encodeURIComponent(targetLanguage)}` +
      `&dt=t&q=${encodeURIComponent(text.trim())}`;

    let translatedText = "";

    try {
      const translationResponse = await fetch(translationUrl);

      if (translationResponse.ok) {
        const translationData = await translationResponse.json();
        translatedText = Array.isArray(translationData?.[0])
          ? translationData[0]
              .filter(
                (part) =>
                  Array.isArray(part) &&
                  typeof part[0] === "string"
              )
              .map((part) => part[0])
              .join("")
              .trim()
          : "";
      }
    } catch (error) {
      console.warn("Primary translation service unavailable:", error.message);
    }

    if (!translatedText) {
      const fallbackUrl =
        "https://api.mymemory.translated.net/get" +
        `?q=${encodeURIComponent(text.trim())}` +
        `&langpair=${encodeURIComponent(
          `${sourceLanguage && sourceLanguage !== "auto" ? sourceLanguage : "en"}|${targetLanguage}`
        )}`;

      const fallbackResponse = await fetch(fallbackUrl);

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        translatedText =
          typeof fallbackData?.responseData?.translatedText === "string"
            ? fallbackData.responseData.translatedText.trim()
            : "";
      }
    }

    if (!translatedText) {
      throw new Error("No translation was returned by the available services.");
    }

    return res.json({
      success: true,
      translatedText,
    });
  } catch (error) {
    console.error(
      "Translation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Translation failed.",
    });
  }
});

// ======================================================
// GET COMMENTS FOR VIDEO
// ======================================================

router.get("/video/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const sort =
      req.query.sort || "newest";

    if (!isValidObjectId(videoId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID.",
      });
    }

    const comments =
      await Comment.find({
        videoid: videoId,
        isDeleted: false,
        moderationStatus: "visible",
      })
        .populate(
          "viewer",
          "_id name email image location joindeon"
        )
        .populate(
          "mentions",
          "_id name Channelname email image"
        )
        .lean();

    const sorted =
      sortComments(comments, sort);

    const formatted = sorted.map(
      (item) => ({
        ...item,
        likeCount:
          item.likes?.length || 0,
        dislikeCount:
          item.dislikes?.length || 0,
      })
    );

    return res.json({
      success: true,
      comments: formatted,
    });
  } catch (error) {
    console.error(
      "Get comments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Could not load comments.",
    });
  }
});

// ======================================================
// GET REPLIES
// ======================================================

router.get(
  "/replies/:commentId",
  async (req, res) => {
    try {
      const { commentId } =
        req.params;

      if (
        !isValidObjectId(commentId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid comment ID.",
        });
      }

      const replies =
        await Comment.find({
          parentCommentId:
            commentId,
          isDeleted: false,
          moderationStatus:
            "visible",
        })
          .populate(
            "viewer",
            "_id name email image location joindeon"
          )
          .populate(
            "mentions",
            "_id name Channelname email image"
          )
          .lean();

      return res.json({
        success: true,
        replies: replies.map(
          (item) => ({
            ...item,
            likeCount:
              item.likes?.length ||
              0,
            dislikeCount:
              item.dislikes?.length ||
              0,
          })
        ),
      });
    } catch (error) {
      console.error(
        "Get replies error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not load replies.",
      });
    }
  }
);

// ======================================================
// CREATE COMMENT
// ======================================================

router.post(
  "/:videoId",
  async (req, res) => {
    try {
      const { videoId } =
        req.params;

      const userId =
        getUserId(req);

      const {
        comment,
        mentions = [],
        language = "en",
      } = req.body;

      if (
        !isValidObjectId(videoId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid video ID.",
        });
      }

      if (
        !isValidObjectId(userId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      if (!comment?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Comment cannot be empty.",
        });
      }

      const allowed =
        await moderateText({
          userId,
          videoId,
          text: comment.trim(),
          res,
        });

      if (!allowed) {
        return;
      }

      const validMentions =
        Array.isArray(mentions)
          ? mentions.filter(
              (id) =>
                isValidObjectId(id)
            )
          : [];

      const newComment =
        await Comment.create({
          viewer: userId,
          videoid: videoId,
          comment: comment.trim(),
          mentions: validMentions,
          language,
          parentCommentId: null,
        });

      const populated =
        await Comment.findById(
          newComment._id
        )
          .populate(
            "viewer",
            "_id name email image location joindeon"
          )
          .populate(
            "mentions",
            "_id name Channelname email image"
          )
          .lean();

      return res.status(201).json({
        success: true,
        comment: {
          ...populated,
          likes: [],
          dislikes: [],
          likeCount: 0,
          dislikeCount: 0,
        },
      });
    } catch (error) {
      console.error(
        "Create comment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not create comment.",
      });
    }
  }
);

// ======================================================
// CREATE REPLY
// ======================================================

router.post(
  "/:commentId/reply",
  async (req, res) => {
    try {
      const {
        commentId,
      } = req.params;

      const userId =
        getUserId(req);

      const {
        comment,
        mentions = [],
        language = "en",
      } = req.body;

      if (
        !isValidObjectId(commentId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid parent comment ID.",
        });
      }

      const parent =
        await Comment.findById(
          commentId
        );

      if (!parent) {
        return res.status(404).json({
          success: false,
          message:
            "Parent comment not found.",
        });
      }

      if (
        !isValidObjectId(userId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      if (!comment?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Reply cannot be empty.",
        });
      }

      const allowed =
        await moderateText({
          userId,
          videoId: parent.videoid,
          text: comment.trim(),
          res,
        });

      if (!allowed) {
        return;
      }

      const validMentions =
        Array.isArray(mentions)
          ? mentions.filter(
              (id) =>
                isValidObjectId(id)
            )
          : [];

      const reply =
        await Comment.create({
          viewer: userId,
          videoid: parent.videoid,
          comment: comment.trim(),
          mentions: validMentions,
          language,
          parentCommentId:
            parent._id,
        });

      const populated =
        await Comment.findById(
          reply._id
        )
          .populate(
            "viewer",
            "_id name email image location joindeon"
          )
          .populate(
            "mentions",
            "_id name Channelname email image"
          )
          .lean();

      return res.status(201).json({
        success: true,
        reply: {
          ...populated,
          likes: [],
          dislikes: [],
          likeCount: 0,
          dislikeCount: 0,
        },
      });
    } catch (error) {
      console.error(
        "Create reply error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not create reply.",
      });
    }
  }
);

// ======================================================
// COMMENT LIKE
// ======================================================

router.post(
  "/:commentId/like",
  async (req, res) => {
    try {
      const {
        commentId,
      } = req.params;

      const userId =
        getUserId(req);

      if (
        !isValidObjectId(
          commentId
        ) ||
        !isValidObjectId(userId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid comment or user ID.",
        });
      }

      const comment =
        await Comment.findById(
          commentId
        );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message:
            "Comment not found.",
        });
      }

      const alreadyLiked =
        comment.likes.some(
          (id) =>
            String(id) ===
            String(userId)
        );

      comment.dislikes =
        comment.dislikes.filter(
          (id) =>
            String(id) !==
            String(userId)
        );

      if (alreadyLiked) {
        comment.likes =
          comment.likes.filter(
            (id) =>
              String(id) !==
              String(userId)
          );
      } else {
        comment.likes.push(userId);
      }

      await comment.save();

      return res.json({
        success: true,
        liked: !alreadyLiked,
        likesCount:
          comment.likes.length,
        dislikesCount:
          comment.dislikes.length,
        likeCount:
          comment.likes.length,
        dislikeCount:
          comment.dislikes.length,
      });
    } catch (error) {
      console.error(
        "Comment like error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not like comment.",
      });
    }
  }
);

// ======================================================
// COMMENT DISLIKE
// ======================================================

router.post(
  "/:commentId/dislike",
  async (req, res) => {
    try {
      const {
        commentId,
      } = req.params;

      const userId =
        getUserId(req);

      if (
        !isValidObjectId(
          commentId
        ) ||
        !isValidObjectId(userId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid comment or user ID.",
        });
      }

      const comment =
        await Comment.findById(
          commentId
        );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message:
            "Comment not found.",
        });
      }

      const alreadyDisliked =
        comment.dislikes.some(
          (id) =>
            String(id) ===
            String(userId)
        );

      comment.likes =
        comment.likes.filter(
          (id) =>
            String(id) !==
            String(userId)
        );

      if (alreadyDisliked) {
        comment.dislikes =
          comment.dislikes.filter(
            (id) =>
              String(id) !==
              String(userId)
          );
      } else {
        comment.dislikes.push(
          userId
        );
      }

      await comment.save();

      return res.json({
        success: true,
        disliked:
          !alreadyDisliked,
        likesCount:
          comment.likes.length,
        dislikesCount:
          comment.dislikes.length,
        likeCount:
          comment.likes.length,
        dislikeCount:
          comment.dislikes.length,
      });
    } catch (error) {
      console.error(
        "Comment dislike error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not dislike comment.",
      });
    }
  }
);

// ======================================================
// EDIT COMMENT
// ======================================================

router.put(
  "/:commentId",
  async (req, res) => {
    try {
      const {
        commentId,
      } = req.params;

      const userId =
        getUserId(req);

      const {
        comment,
        mentions = [],
      } = req.body;

      if (
        !isValidObjectId(
          commentId
        ) ||
        !isValidObjectId(userId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid comment or user ID.",
        });
      }

      if (!comment?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Comment cannot be empty.",
        });
      }

      const existing =
        await Comment.findById(
          commentId
        );

      if (!existing) {
        return res.status(404).json({
          success: false,
          message:
            "Comment not found.",
        });
      }

      if (
        String(existing.viewer) !==
        String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only edit your own comment.",
        });
      }

      // Only perform profanity/link checks
      // here. Duplicate/rate limit is mainly
      // for new posts.
      const profanity =
        findProfanity(
          comment.trim()
        );

      if (profanity) {
        return res.status(400).json({
          success: false,
          blocked: true,
          reason: "profanity",
          message:
            "Your comment contains inappropriate language. Please remove offensive words and try again.",
        });
      }

      if (
        hasMaliciousLink(
          comment.trim()
        )
      ) {
        return res.status(400).json({
          success: false,
          blocked: true,
          reason:
            "malicious_link",
          message:
            "Malicious links are not allowed.",
        });
      }

      const validMentions =
        Array.isArray(mentions)
          ? mentions.filter(
              (id) =>
                isValidObjectId(id)
            )
          : [];

      existing.comment =
        comment.trim();

      existing.mentions =
        validMentions;

      existing.isEdited = true;

      existing.editedAt =
        new Date();

      await existing.save();

      const populated =
        await Comment.findById(
          existing._id
        )
          .populate(
            "viewer",
            "_id name email image location joindeon"
          )
          .populate(
            "mentions",
            "_id name Channelname email image"
          )
          .lean();

      return res.json({
        success: true,
        comment: {
          ...populated,
          likeCount:
            populated?.likes?.length ||
            0,
          dislikeCount:
            populated?.dislikes
              ?.length || 0,
        },
      });
    } catch (error) {
      console.error(
        "Edit comment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not edit comment.",
      });
    }
  }
);

// ======================================================
// DELETE COMMENT
// ======================================================

router.delete(
  "/:commentId",
  async (req, res) => {
    try {
      const {
        commentId,
      } = req.params;

      const userId =
        getUserId(req);

      if (
        !isValidObjectId(
          commentId
        ) ||
        !isValidObjectId(userId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid comment or user ID.",
        });
      }

      const comment =
        await Comment.findById(
          commentId
        );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message:
            "Comment not found.",
        });
      }

      if (
        String(comment.viewer) !==
        String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only delete your own comment.",
        });
      }

      comment.isDeleted =
        true;

      comment.moderationStatus =
        "removed";

      await comment.save();

      return res.json({
        success: true,
        message:
          "Comment deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete comment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not delete comment.",
      });
    }
  }
);

// ======================================================
// SEARCH USERS FOR MENTIONS
// ======================================================

router.get(
  "/users/search",
  async (req, res) => {
    try {
      const q =
        String(
          req.query.q || ""
        ).trim();

      if (!q) {
        return res.json({
          success: true,
          users: [],
        });
      }

      const regex =
        new RegExp(
          q.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ),
          "i"
        );

      const users =
        await User.find({
          $or: [
            { name: regex },
            { Channelname: regex },
            { email: regex },
          ],
        })
          .select(
            "_id name Channelname email image"
          )
          .limit(10)
          .lean();

      return res.json({
        success: true,
        users,
      });
    } catch (error) {
      console.error(
        "User search error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not search users.",
      });
    }
  }
);

// ======================================================
// TASK 12 — REPORT COMMENT
// ======================================================

router.post(
  "/:commentId/report",
  async (req, res) => {
    try {
      const {
        commentId,
      } = req.params;

      const userId =
        getUserId(req);

      const {
        reason,
        description = "",
      } = req.body;

      const allowedReasons = [
        "spam",
        "harassment",
        "hate",
        "sexual",
        "violence",
        "scam",
        "malicious_link",
        "other",
      ];

      if (
        !isValidObjectId(
          commentId
        ) ||
        !isValidObjectId(userId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid comment or user ID.",
        });
      }

      if (
        !allowedReasons.includes(
          reason
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid report reason.",
        });
      }

      const comment =
        await Comment.findById(
          commentId
        );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message:
            "Comment not found.",
        });
      }

      if (
        String(comment.viewer) ===
        String(userId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot report your own comment.",
        });
      }

      try {
        await CommentReport.create({
          commentId,
          reporterId: userId,
          reason,
          description:
            String(
              description
            ).slice(0, 500),
        });
      } catch (error) {
        if (
          error?.code === 11000
        ) {
          return res.status(400).json({
            success: false,
            message:
              "You have already reported this comment.",
          });
        }

        throw error;
      }

      await Comment.findByIdAndUpdate(
        commentId,
        {
          $inc: {
            reportCount: 1,
          },
        }
      );

      return res.json({
        success: true,
        message:
          "Comment reported successfully.",
      });
    } catch (error) {
      console.error(
        "Report comment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not report comment.",
      });
    }
  }
);

export default router;