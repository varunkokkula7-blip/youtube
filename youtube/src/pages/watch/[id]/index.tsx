"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  MoreHorizontal,
  UserCircle,
  Clock,
  Send,
  Flag,
} from "lucide-react";

import { useUser } from "@/lib/AuthContext";

// ======================================================
// BACKEND URL
// ======================================================

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://youtube-hiv1.onrender.com";

// ======================================================
// API URL HELPER
// ======================================================

const getApiUrl = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;

  if (
    typeof BACKEND_URL === "string" &&
    /^https?:\/\//i.test(BACKEND_URL)
  ) {
    return `${BACKEND_URL.replace(/\/$/, "")}${p}`;
  }

  return `http://localhost:5000${p}`;
};

// ======================================================
// VIDEO TYPE
// ======================================================

type Video = {
  _id: string;
  videotitle: string;
  filename?: string;
  filetype?: string;
  filepath?: string;
  filesize?: number;

  videochanel?: string;
  videochannel?: string;

  Like?: number;
  Dislike?: number;
  likes?: number;
  dislikes?: number;

  views?: number;

  uploader?: string;

  createdAt?: string;
  updatedAt?: string;
};

// ======================================================
// USER TYPE
// ======================================================

type CommentUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  location?: string;
  joindeon?: string;
};

// ======================================================
// MENTION USER
// ======================================================

type MentionUser = {
  _id: string;
  name?: string;
  Channelname?: string;
  email?: string;
  image?: string;
};

// ======================================================
// COMMENT TYPE
// ======================================================

type Comment = {
  _id: string;

  viewer?: CommentUser;

  videoid: string;

  comment: string;

  createdAt: string;

  updatedAt?: string;

  likes?: string[];

  dislikes?: string[];

  likeCount?: number;

  dislikeCount?: number;

  parentCommentId?: string | null;

  isEdited?: boolean;

  editedAt?: string | null;

  isDeleted?: boolean;

  mentions?: (string | MentionUser)[];

  moderationStatus?: "visible" | "hidden" | "removed";

  spamScore?: number;

  spamDetected?: boolean;

  maliciousLinkDetected?: boolean;

  reportCount?: number;
};

// ======================================================
// REPORT REASONS
// ======================================================

const REPORT_REASONS = [
  {
    value: "spam",
    label: "Spam",
  },
  {
    value: "harassment",
    label: "Harassment",
  },
  {
    value: "hate",
    label: "Hate speech",
  },
  {
    value: "sexual",
    label: "Sexual content",
  },
  {
    value: "violence",
    label: "Violence",
  },
  {
    value: "scam",
    label: "Scam or fraud",
  },
  {
    value: "malicious_link",
    label: "Malicious link",
  },
  {
    value: "other",
    label: "Other",
  },
];

// ======================================================
// WATCH PAGE
// ======================================================

export default function WatchPage() {
  const router = useRouter();

  const { user } = useUser();

  // ====================================================
  // VIDEO ID
  // ====================================================

  const id =
    typeof router.query.id === "string"
      ? router.query.id
      : "";

  // ====================================================
  // USER ID
  // ====================================================

  const userId =
    user?._id ||
    user?.id ||
    "";

  // ====================================================
  // VIDEO
  // ====================================================

  const [video, setVideo] =
    useState<Video | null>(null);

  const [recommended, setRecommended] =
    useState<Video[]>([]);

  const [loading, setLoading] =
    useState(true);

  // ====================================================
  // VIDEO LIKE / DISLIKE
  // ====================================================

  const [likeCount, setLikeCount] =
    useState(0);

  const [dislikeCount, setDislikeCount] =
    useState(0);

  const [liked, setLiked] =
    useState(false);

  const [disliked, setDisliked] =
    useState(false);

  const [likeLoading, setLikeLoading] =
    useState(false);

  const [dislikeLoading, setDislikeLoading] =
    useState(false);

  // ====================================================
  // WATCH LATER
  // ====================================================

  const [watchLater, setWatchLater] =
    useState(false);

  // ====================================================
  // COMMENTS
  // ====================================================

  const [comments, setComments] =
    useState<Comment[]>([]);

  const [commentText, setCommentText] =
    useState("");

  const [commentLoading, setCommentLoading] =
    useState(false);

  const [commentsLoading, setCommentsLoading] =
    useState(false);

  // ====================================================
  // COMMENT SORTING
  // ====================================================

  const [commentSort, setCommentSort] =
    useState<"newest" | "oldest" | "top">(
      "newest"
    );

  // ====================================================
  // TRANSLATION
  // ====================================================

  const [translatedComments, setTranslatedComments] =
    useState<Record<string, string>>({});

  const [translatingComment, setTranslatingComment] =
    useState<string | null>(null);

  const [translationLanguage, setTranslationLanguage] =
    useState("en");

  // ====================================================
  // COMMENT LIKE / DISLIKE LOADING
  // ====================================================

  const [commentLikeLoading, setCommentLikeLoading] =
    useState<string | null>(null);

  const [commentDislikeLoading, setCommentDislikeLoading] =
    useState<string | null>(null);

  // ====================================================
  // EDIT
  // ====================================================

  const [editingCommentId, setEditingCommentId] =
    useState<string | null>(null);

  const [editingText, setEditingText] =
    useState("");

  const [editLoading, setEditLoading] =
    useState(false);

  // ====================================================
  // REPLY
  // ====================================================

  const [replyingTo, setReplyingTo] =
    useState<Comment | null>(null);

  const [replyText, setReplyText] =
    useState("");

  const [replyLoading, setReplyLoading] =
    useState(false);

  // ====================================================
  // MENTIONS
  // ====================================================

  const [mentionSuggestions, setMentionSuggestions] =
    useState<MentionUser[]>([]);

  const [mentionLoading, setMentionLoading] =
    useState(false);

  const [mentionMode, setMentionMode] =
    useState<"comment" | "reply" | null>(null);

  const [mentionStart, setMentionStart] =
    useState<number | null>(null);

  const [mentionQuery, setMentionQuery] =
    useState("");

  const [commentMentions, setCommentMentions] =
    useState<string[]>([]);

  const [replyMentions, setReplyMentions] =
    useState<string[]>([]);

  // ====================================================
  // REPORT COMMENT
  // ====================================================

  const [reportingCommentId, setReportingCommentId] =
    useState<string | null>(null);

  const [reportReason, setReportReason] =
    useState("spam");

  const [reportDescription, setReportDescription] =
    useState("");

  const [reportLoading, setReportLoading] =
    useState(false);

  const [moderationMessage, setModerationMessage] =
    useState("");

  // ====================================================
  // INPUT REFS
  // ====================================================

  const commentInputRef =
    useRef<HTMLInputElement | null>(null);

  const replyInputRef =
    useRef<HTMLTextAreaElement | null>(null);

  // ====================================================
  // MENTION SEARCH
  // ====================================================

  const updateMentionSearch = (
    value: string,
    cursorPosition: number,
    mode: "comment" | "reply"
  ) => {
    const textBeforeCursor =
      value.slice(0, cursorPosition);

    const match =
      textBeforeCursor.match(
        /(?:^|\s)@([^\n@]*)$/
      );

    if (!match) {
      setMentionSuggestions([]);
      setMentionQuery("");
      setMentionStart(null);
      setMentionMode(null);
      return;
    }

    const query =
      match[1].trim();

    const atIndex =
      textBeforeCursor.lastIndexOf("@");

    setMentionMode(mode);
    setMentionStart(atIndex);
    setMentionQuery(query);
  };

  // ====================================================
  // SEARCH USERS
  // ====================================================

  useEffect(() => {
    if (
      mentionMode === null ||
      mentionStart === null
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        async () => {
          try {
            setMentionLoading(true);

            const response =
              await fetch(
                getApiUrl(
                  `/comment/users/search?q=${encodeURIComponent(
                    mentionQuery
                  )}`
                )
              );

            if (!response.ok) {
              setMentionSuggestions([]);
              return;
            }

            const data =
              await response.json();

            setMentionSuggestions(
              Array.isArray(data?.users)
                ? data.users
                : []
            );
          } catch (error) {
            console.error(
              "Mention search error:",
              error
            );

            setMentionSuggestions([]);
          } finally {
            setMentionLoading(false);
          }
        },
        250
      );

    return () =>
      window.clearTimeout(timer);
  }, [
    mentionMode,
    mentionStart,
    mentionQuery,
  ]);

  // ====================================================
  // VIDEO URL
  // ====================================================

  const getVideoUrl = (
    filepath?: string
  ): string => {
    if (!filepath) {
      return "";
    }

    let cleanPath =
      filepath.replace(/\\/g, "/");

    cleanPath =
      cleanPath.replace(/^\/+/, "");

    cleanPath =
      cleanPath.replace(
        /^uploads\//i,
        ""
      );

    if (!cleanPath) {
      return "";
    }

    const encodedPath =
      cleanPath
        .split("/")
        .map((part) =>
          encodeURIComponent(part)
        )
        .join("/");

    return `${BACKEND_URL.replace(
      /\/$/,
      ""
    )}/uploads/${encodedPath}`;
  };

  // ====================================================
  // LOAD VIDEO
  // ====================================================

  useEffect(() => {
    if (
      !router.isReady ||
      !id
    ) {
      return;
    }

    const getVideos =
      async () => {
        try {
          setLoading(true);

          const response =
            await fetch(
              getApiUrl(
                "/video/getall"
              ),
              {
                method: "GET",
                cache: "no-store",
              }
            );

          if (!response.ok) {
            throw new Error(
              `Video API failed: ${response.status}`
            );
          }

          const data =
            await response.json();

          let allVideos: Video[] =
            [];

          if (
            Array.isArray(data)
          ) {
            allVideos = data;
          } else if (
            Array.isArray(
              data?.videos
            )
          ) {
            allVideos =
              data.videos;
          } else if (
            Array.isArray(
              data?.data
            )
          ) {
            allVideos =
              data.data;
          } else if (
            Array.isArray(
              data?.data?.videos
            )
          ) {
            allVideos =
              data.data.videos;
          }

          const selectedVideo =
            allVideos.find(
              (item) =>
                String(item._id) ===
                String(id)
            );

          setVideo(
            selectedVideo || null
          );

          setRecommended(
            allVideos.filter(
              (item) =>
                String(item._id) !==
                String(id)
            )
          );

          if (selectedVideo) {
            setLikeCount(
              Number(
                selectedVideo.Like ??
                  selectedVideo.likes ??
                  0
              )
            );

            setDislikeCount(
              Number(
                selectedVideo.Dislike ??
                  selectedVideo.dislikes ??
                  0
              )
            );
          }
        } catch (error) {
          console.error(
            "ERROR LOADING VIDEO:",
            error
          );

          setVideo(null);
        } finally {
          setLoading(false);
        }
      };

    getVideos();
  }, [
    router.isReady,
    id,
  ]);

  // ====================================================
  // ADD HISTORY
  // ====================================================

  useEffect(() => {
    if (
      !router.isReady ||
      !id ||
      !userId
    ) {
      return;
    }

    const addHistory =
      async () => {
        try {
          await fetch(
            getApiUrl(
              "/history/add"
            ),
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                userId,
                videoId: id,
              }),
            }
          );
        } catch (error) {
          console.error(
            "History error:",
            error
          );
        }
      };

    addHistory();
  }, [
    router.isReady,
    id,
    userId,
  ]);

  // ====================================================
  // CHECK VIDEO LIKE
  // ====================================================

  useEffect(() => {
    if (
      !router.isReady ||
      !userId ||
      !id
    ) {
      return;
    }

    const checkLike =
      async () => {
        try {
          const response =
            await fetch(
              getApiUrl(
                `/like/user/${userId}`
              )
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          let likedVideos: any[] =
            [];

          if (
            Array.isArray(data)
          ) {
            likedVideos = data;
          } else if (
            Array.isArray(
              data?.videos
            )
          ) {
            likedVideos =
              data.videos;
          } else if (
            Array.isArray(
              data?.likes
            )
          ) {
            likedVideos =
              data.likes;
          }

          const alreadyLiked =
            likedVideos.some(
              (item: any) => {
                const itemVideoId =
                  item?.videoId?._id ||
                  item?.videoid?._id ||
                  item?.videoId ||
                  item?.videoid ||
                  item?._id;

                return (
                  String(
                    itemVideoId
                  ) === String(id)
                );
              }
            );

          setLiked(
            alreadyLiked
          );
        } catch (error) {
          console.error(
            "Check like error:",
            error
          );
        }
      };

    checkLike();
  }, [
    router.isReady,
    id,
    userId,
  ]);

  // ====================================================
  // CHECK WATCH LATER
  // ====================================================

  useEffect(() => {
    if (
      !router.isReady ||
      !userId ||
      !id
    ) {
      return;
    }

    const checkWatchLater =
      async () => {
        try {
          const response =
            await fetch(
              getApiUrl(
                `/watchlater/user/${userId}`
              )
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          let savedVideos: any[] =
            [];

          if (
            Array.isArray(data)
          ) {
            savedVideos = data;
          } else if (
            Array.isArray(
              data?.videos
            )
          ) {
            savedVideos =
              data.videos;
          } else if (
            Array.isArray(
              data?.watchLater
            )
          ) {
            savedVideos =
              data.watchLater;
          }

          const alreadySaved =
            savedVideos.some(
              (item: any) => {
                const itemVideoId =
                  item?.videoId?._id ||
                  item?.videoid?._id ||
                  item?.videoId ||
                  item?.videoid ||
                  item?._id;

                return (
                  String(
                    itemVideoId
                  ) === String(id)
                );
              }
            );

          setWatchLater(
            alreadySaved
          );
        } catch (error) {
          console.error(
            "Check Watch Later error:",
            error
          );
        }
      };

    checkWatchLater();
  }, [
    router.isReady,
    id,
    userId,
  ]);

  // ====================================================
  // GET COMMENTS
  // ====================================================

  useEffect(() => {
    if (
      !router.isReady ||
      !id
    ) {
      return;
    }

    const getComments =
      async () => {
        try {
          setCommentsLoading(true);

          const response =
            await fetch(
              getApiUrl(
                `/comment/video/${id}`
              ),
              {
                method: "GET",
                cache: "no-store",
              }
            );

          if (!response.ok) {
            throw new Error(
              `Comments API failed: ${response.status}`
            );
          }

          const data =
            await response.json();

          let receivedComments: Comment[] =
            [];

          if (
            Array.isArray(
              data?.comments
            )
          ) {
            receivedComments =
              data.comments;
          } else if (
            Array.isArray(data)
          ) {
            receivedComments =
              data;
          }

          const normalizeUserIds =
            (users: unknown) =>
              Array.isArray(users)
                ? users
                    .map(
                      (value: any) =>
                        typeof value ===
                        "string"
                          ? value
                          : value?._id ||
                            value?.id ||
                            ""
                    )
                    .filter(Boolean)
                : [];

          const formatComment =
            (item: any): Comment => {
              const likes =
                normalizeUserIds(
                  item?.likes
                );

              const dislikes =
                normalizeUserIds(
                  item?.dislikes
                );

              return {
                ...item,
                likes,
                dislikes,
                likeCount: Number(
                  item?.likeCount ??
                    likes.length
                ),
                dislikeCount: Number(
                  item?.dislikeCount ??
                    dislikes.length
                ),
              };
            };

          const formattedComments =
            receivedComments.map(
              formatComment
            );

          const repliesByComment =
            await Promise.all(
              formattedComments.map(
                async (comment) => {
                  try {
                    const repliesResponse =
                      await fetch(
                        getApiUrl(
                          `/comment/replies/${comment._id}`
                        ),
                        {
                          method: "GET",
                          cache: "no-store",
                        }
                      );

                    if (
                      !repliesResponse.ok
                    ) {
                      return [];
                    }

                    const repliesData =
                      await repliesResponse.json();

                    return Array.isArray(
                      repliesData?.replies
                    )
                      ? repliesData.replies.map(
                          formatComment
                        )
                      : [];
                  } catch {
                    return [];
                  }
                }
              )
            );

          setComments(
            formattedComments.concat(
              repliesByComment.flat()
            )
          );
        } catch (error) {
          console.error(
            "Get comments error:",
            error
          );

          setComments([]);
        } finally {
          setCommentsLoading(false);
        }
      };

    getComments();
  }, [
    router.isReady,
    id,
  ]);

  // ====================================================
  // VIDEO LIKE / DISLIKE
  // ====================================================

  const sendLikeAction =
    async (
      action:
        | "like"
        | "dislike"
    ) => {
      if (!userId) {
        alert(
          "Please login first."
        );
        return;
      }

      if (!video?._id) {
        return;
      }

      if (action === "like") {
        if (likeLoading) {
          return;
        }

        setLikeLoading(true);
      } else {
        if (dislikeLoading) {
          return;
        }

        setDislikeLoading(true);
      }

      try {
        const response =
          await fetch(
            getApiUrl(
              `/like/${video._id}`
            ),
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                userId,
                action,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Failed to ${action} video`
          );
        }

        const newLikeCount =
          Number(
            data?.Like ??
              data?.likes ??
              data?.video?.Like ??
              likeCount
          );

        const newDislikeCount =
          Number(
            data?.Dislike ??
              data?.dislikes ??
              data?.video?.Dislike ??
              dislikeCount
          );

        setLikeCount(
          Math.max(
            newLikeCount,
            0
          )
        );

        setDislikeCount(
          Math.max(
            newDislikeCount,
            0
          )
        );

        setLiked(
          data?.liked === true
        );

        setDisliked(
          data?.disliked === true
        );

        setVideo(
          (previous) => {
            if (!previous) {
              return previous;
            }

            return {
              ...previous,
              Like: newLikeCount,
              Dislike:
                newDislikeCount,
            };
          }
        );
      } catch (error) {
        console.error(
          `${action} error:`,
          error
        );

        alert(
          `Something went wrong while trying to ${action} the video.`
        );
      } finally {
        if (action === "like") {
          setLikeLoading(false);
        } else {
          setDislikeLoading(false);
        }
      }
    };

  const handleLike =
    async () => {
      await sendLikeAction(
        "like"
      );
    };

  const handleDislike =
    async () => {
      await sendLikeAction(
        "dislike"
      );
    };

  // ====================================================
  // WATCH LATER
  // ====================================================

  const handleWatchLater =
    async () => {
      if (!userId) {
        alert(
          "Please login to use Watch Later."
        );
        return;
      }

      if (!video?._id) {
        return;
      }

      try {
        const response =
          await fetch(
            getApiUrl(
              `/watchlater/${video._id}`
            ),
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                userId,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Watch Later failed"
          );
        }

        setWatchLater(
          data?.added === true
        );
      } catch (error) {
        console.error(
          "Watch Later error:",
          error
        );

        alert(
          "Could not update Watch Later."
        );
      }
    };

  // ====================================================
  // MODERATION ERROR HELPER
  // ====================================================

  const handleModerationError = (
    data: any,
    fallback: string
  ) => {
    if (
      data?.blocked === true
    ) {
      alert(
        data?.message ||
          "Your comment could not be posted."
      );

      return true;
    }

    if (
      data?.reason ===
      "profanity"
    ) {
      alert(
        data?.message ||
          "Your comment contains inappropriate language."
      );

      return true;
    }

    if (
      data?.reason === "spam"
    ) {
      alert(
        data?.message ||
          "Your comment was detected as spam."
      );

      return true;
    }

    if (
      data?.reason ===
      "duplicate"
    ) {
      alert(
        data?.message ||
          "You have already posted a similar comment."
      );

      return true;
    }

    if (
      data?.reason ===
      "malicious_link"
    ) {
      alert(
        data?.message ||
          "Your comment contains a suspicious or malicious link."
      );

      return true;
    }

    if (
      data?.reason ===
      "rate_limit"
    ) {
      alert(
        data?.message ||
          "You are commenting too quickly. Please wait and try again."
      );

      return true;
    }

    if (
      data?.reason ===
      "too_many_requests"
    ) {
      alert(
        data?.message ||
          "Too many requests. Please wait and try again."
      );

      return true;
    }

    if (
      data?.message &&
      typeof data.message ===
        "string"
    ) {
      alert(data.message);
      return true;
    }

    alert(fallback);
    return true;
  };

  const getClientModerationMessage = (
    text: string
  ) => {
    const normalized = text.toLowerCase();

    if (
      /\b(fuck|fucking|fucked|shit|bitch|bastard|asshole|idiot|stupid|dumbass|motherfucker|bullshit)\b/i.test(
        normalized
      )
    ) {
      return "Your comment contains inappropriate language. Please remove offensive words and try again.";
    }

    if (
      /(javascript:|data:text\/html|vbscript:|file:\/\/|powershell|cmd\.exe|\.exe\b|\.scr\b|\.bat\b|\.cmd\b)/i.test(
        normalized
      )
    ) {
      return "Malicious links are not allowed.";
    }

    if (
      /(.)\1{7,}/i.test(text) ||
      [
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
      ].some((phrase) => normalized.includes(phrase))
    ) {
      return "This comment looks like spam. Please write a normal comment and try again.";
    }

    return "";
  };

  // ====================================================
  // ADD COMMENT
  // ====================================================

  const handleComment =
    async () => {
      if (!userId) {
        alert(
          "Please login to comment."
        );
        return;
      }

      if (!commentText.trim()) {
        return;
      }

      const localModerationMessage =
        getClientModerationMessage(commentText);

      if (localModerationMessage) {
        setModerationMessage(localModerationMessage);
        return;
      }

      if (!video?._id) {
        return;
      }

      if (commentLoading) {
        return;
      }

      setCommentLoading(true);

      try {
        const response =
          await fetch(
            getApiUrl(
              `/comment/${video._id}`
            ),
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                userId,
                comment:
                  commentText.trim(),
                language: "en",
                mentions:
                  commentMentions,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          handleModerationError(
            data,
            "Could not add comment."
          );

          return;
        }

        if (data?.comment) {
          const newComment: Comment =
            {
              ...data.comment,
              likes: [],
              dislikes: [],
              likeCount: 0,
              dislikeCount: 0,
              parentCommentId:
                null,
            };

          setComments(
            (previous) => [
              newComment,
              ...previous,
            ]
          );
        }

        setCommentText("");
        setModerationMessage("");
        setCommentMentions([]);
        setMentionSuggestions([]);
        setMentionMode(null);
        setMentionQuery("");
        setMentionStart(null);
      } catch (error) {
        console.error(
          "Comment error:",
          error
        );

        alert(
          "Could not add comment."
        );
      } finally {
        setCommentLoading(false);
      }
    };

  // ====================================================
  // ADD REPLY
  // ====================================================

  const handleReply =
    async () => {
      if (!userId) {
        alert(
          "Please login to reply."
        );
        return;
      }

      if (!video?._id) {
        return;
      }

      if (!replyingTo) {
        return;
      }

      if (!replyText.trim()) {
        return;
      }

      const localModerationMessage =
        getClientModerationMessage(replyText);

      if (localModerationMessage) {
        setModerationMessage(localModerationMessage);
        return;
      }

      if (replyLoading) {
        return;
      }

      const parentCommentId =
        replyingTo._id;

      setReplyLoading(true);

      try {
        const response =
          await fetch(
            getApiUrl(
              `/comment/${parentCommentId}/reply`
            ),
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                userId,
                comment:
                  replyText.trim(),
                language: "en",
                mentions:
                  replyMentions,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          handleModerationError(
            data,
            "Could not add reply."
          );

          return;
        }

        if (data?.reply) {
          setComments(
            (previous) => [
              ...previous,
              {
                ...data.reply,
                likes: [],
                dislikes: [],
                likeCount: 0,
                dislikeCount: 0,
              },
            ]
          );
        }

        setReplyText("");
        setModerationMessage("");
        setReplyMentions([]);
        setMentionSuggestions([]);
        setMentionMode(null);
        setMentionQuery("");
        setMentionStart(null);
        setReplyingTo(null);
      } catch (error) {
        console.error(
          "Reply error:",
          error
        );

        alert(
          "Could not add reply."
        );
      } finally {
        setReplyLoading(false);
      }
    };

  // ====================================================
  // EDIT COMMENT
  // ====================================================

  const handleEditComment =
    async (
      commentId: string,
      existingMentions:
        | (string | MentionUser)[]
        = []
    ) => {
      if (!userId) {
        alert(
          "Please login first."
        );
        return;
      }

      if (!editingText.trim()) {
        alert(
          "Comment cannot be empty."
        );
        return;
      }

      if (editLoading) {
        return;
      }

      setEditLoading(true);

      try {
        const response =
          await fetch(
            getApiUrl(
              `/comment/${commentId}`
            ),
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                userId,
                comment:
                  editingText.trim(),
                mentions:
                  existingMentions
                    .map(
                      (mention) =>
                        typeof mention ===
                        "string"
                          ? mention
                          : mention._id
                    )
                    .filter(Boolean),
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          handleModerationError(
            data,
            "Could not edit comment."
          );

          return;
        }

        if (data?.comment) {
          setComments(
            (previous) =>
              previous.map(
                (item) =>
                  item._id ===
                  commentId
                    ? {
                        ...item,
                        ...data.comment,
                      }
                    : item
              )
          );
        }

        setEditingCommentId(
          null
        );

        setEditingText("");
      } catch (error) {
        console.error(
          "Edit comment error:",
          error
        );

        alert(
          "Could not edit comment."
        );
      } finally {
        setEditLoading(false);
      }
    };

  // ====================================================
  // COMMENT LIKE
  // ====================================================

  const handleCommentLike =
    async (
      commentId: string
    ) => {
      if (!userId) {
        alert(
          "Please login first."
        );
        return;
      }

      if (
        commentLikeLoading ===
        commentId
      ) {
        return;
      }

      setCommentLikeLoading(
        commentId
      );

      try {
        const response =
          await fetch(
            getApiUrl(
              `/comment/${commentId}/like`
            ),
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                userId,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Could not like comment"
          );
        }

        setComments(
          (previous) =>
            previous.map(
              (item) => {
                if (
                  item._id !==
                  commentId
                ) {
                  return item;
                }

                let likes =
                  item.likes || [];

                let dislikes =
                  item.dislikes ||
                  [];

                if (data.liked) {
                  if (
                    !likes.some(
                      (id) =>
                        String(id) ===
                        String(userId)
                    )
                  ) {
                    likes = [
                      ...likes,
                      userId,
                    ];
                  }

                  dislikes =
                    dislikes.filter(
                      (id) =>
                        String(id) !==
                        String(userId)
                    );
                } else {
                  likes =
                    likes.filter(
                      (id) =>
                        String(id) !==
                        String(userId)
                    );
                }

                return {
                  ...item,
                  likes,
                  dislikes,
                  likeCount:
                    Number(
                      data.likeCount ??
                        likes.length
                    ),
                  dislikeCount:
                    Number(
                      data.dislikeCount ??
                        dislikes.length
                    ),
                };
              }
            )
        );
      } catch (error) {
        console.error(
          "Comment like error:",
          error
        );

        alert(
          "Could not like comment."
        );
      } finally {
        setCommentLikeLoading(
          null
        );
      }
    };

  // ====================================================
  // COMMENT DISLIKE
  // ====================================================

  const handleCommentDislike =
    async (
      commentId: string
    ) => {
      if (!userId) {
        alert(
          "Please login first."
        );
        return;
      }

      if (
        commentDislikeLoading ===
        commentId
      ) {
        return;
      }

      setCommentDislikeLoading(
        commentId
      );

      try {
        const response =
          await fetch(
            getApiUrl(
              `/comment/${commentId}/dislike`
            ),
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                userId,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Could not dislike comment"
          );
        }

        setComments(
          (previous) =>
            previous.map(
              (item) => {
                if (
                  item._id !==
                  commentId
                ) {
                  return item;
                }

                let likes =
                  item.likes || [];

                let dislikes =
                  item.dislikes ||
                  [];

                if (
                  data.disliked
                ) {
                  if (
                    !dislikes.some(
                      (id) =>
                        String(id) ===
                        String(userId)
                    )
                  ) {
                    dislikes = [
                      ...dislikes,
                      userId,
                    ];
                  }

                  likes =
                    likes.filter(
                      (id) =>
                        String(id) !==
                        String(userId)
                    );
                } else {
                  dislikes =
                    dislikes.filter(
                      (id) =>
                        String(id) !==
                        String(userId)
                    );
                }

                return {
                  ...item,
                  likes,
                  dislikes,
                  likeCount:
                    Number(
                      data.likeCount ??
                        likes.length
                    ),
                  dislikeCount:
                    Number(
                      data.dislikeCount ??
                        dislikes.length
                    ),
                };
              }
            )
        );
      } catch (error) {
        console.error(
          "Comment dislike error:",
          error
        );

        alert(
          "Could not dislike comment."
        );
      } finally {
        setCommentDislikeLoading(
          null
        );
      }
    };

  // ====================================================
  // SELECT MENTION
  // ====================================================

  const selectMention = (
    selectedUser: MentionUser
  ) => {
    if (
      mentionMode === null ||
      mentionStart === null
    ) {
      return;
    }

    const displayName =
      selectedUser.name?.trim() ||
      selectedUser.Channelname?.trim() ||
      selectedUser.email?.split(
        "@"
      )[0] ||
      "User";

    const mentionText =
      `@${displayName} `;

    if (
      mentionMode ===
      "comment"
    ) {
      const input =
        commentInputRef.current;

      const cursor =
        input?.selectionStart ??
        commentText.length;

      const nextText =
        commentText.slice(
          0,
          mentionStart
        ) +
        mentionText +
        commentText.slice(cursor);

      setCommentText(
        nextText
      );

      setCommentMentions(
        (previous) =>
          previous.includes(
            selectedUser._id
          )
            ? previous
            : [
                ...previous,
                selectedUser._id,
              ]
      );

      setMentionSuggestions([]);
      setMentionMode(null);
      setMentionQuery("");
      setMentionStart(null);

      window.setTimeout(
        () => {
          const nextCursor =
            mentionStart +
            mentionText.length;

          input?.focus();

          input?.setSelectionRange(
            nextCursor,
            nextCursor
          );
        },
        0
      );
    } else {
      const input =
        replyInputRef.current;

      const cursor =
        input?.selectionStart ??
        replyText.length;

      const nextText =
        replyText.slice(
          0,
          mentionStart
        ) +
        mentionText +
        replyText.slice(cursor);

      setReplyText(
        nextText
      );

      setReplyMentions(
        (previous) =>
          previous.includes(
            selectedUser._id
          )
            ? previous
            : [
                ...previous,
                selectedUser._id,
              ]
      );

      setMentionSuggestions([]);
      setMentionMode(null);
      setMentionQuery("");
      setMentionStart(null);

      window.setTimeout(
        () => {
          const nextCursor =
            mentionStart +
            mentionText.length;

          input?.focus();

          input?.setSelectionRange(
            nextCursor,
            nextCursor
          );
        },
        0
      );
    }
  };

  // ====================================================
  // TRANSLATE COMMENT
  // ====================================================

  const translateComment =
    async (
      commentId: string,
      text: string
    ) => {
      try {
        if (!text.trim()) {
          return;
        }

        setTranslatingComment(
          commentId
        );

        const response =
          await fetch(
            getApiUrl(
              "/comment/translate"
            ),
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                text: text.trim(),
                sourceLanguage:
                  "en",
                targetLanguage:
                  translationLanguage,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Translation failed"
          );
        }

        setTranslatedComments(
          (previous) => ({
            ...previous,
            [commentId]:
              data.translatedText,
          })
        );
      } catch (error) {
        console.error(
          "Translation error:",
          error
        );

        alert(
          "Unable to translate comment"
        );
      } finally {
        setTranslatingComment(
          null
        );
      }
    };

  // ====================================================
  // DELETE COMMENT
  // ====================================================

  const handleDeleteComment =
    async (
      commentId: string
    ) => {
      if (!userId) {
        alert(
          "Please login first."
        );
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this comment?"
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await fetch(
            getApiUrl(
              `/comment/${commentId}`
            ),
            {
              method: "DELETE",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                userId,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Could not delete comment"
          );
        }

        setComments(
          (previous) =>
            previous.filter(
              (item) =>
                item._id !==
                commentId
            )
        );

        if (
          replyingTo?._id ===
          commentId
        ) {
          setReplyingTo(null);
          setReplyText("");
          setReplyMentions([]);
          setMentionSuggestions([]);
          setMentionMode(null);
          setMentionQuery("");
          setMentionStart(null);
        }
      } catch (error) {
        console.error(
          "Delete comment error:",
          error
        );

        alert(
          "Could not delete comment."
        );
      }
    };

  // ====================================================
  // REPORT COMMENT - TASK 12
  // ====================================================

  const handleReportComment =
    async (
      commentId: string
    ) => {
      if (!userId) {
        alert(
          "Please login to report a comment."
        );
        return;
      }

      if (reportLoading) {
        return;
      }

      setReportLoading(true);

      try {
        const response =
          await fetch(
            getApiUrl(
              `/comment/${commentId}/report`
            ),
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                userId,
                reason:
                  reportReason,
                description:
                  reportDescription.trim(),
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          alert(
            data?.message ||
              "Could not report comment."
          );

          return;
        }

        alert(
          data?.message ||
            "Comment reported successfully."
        );

        setReportingCommentId(
          null
        );

        setReportReason(
          "spam"
        );

        setReportDescription(
          ""
        );
      } catch (error) {
        console.error(
          "Report comment error:",
          error
        );

        alert(
          "Could not report comment."
        );
      } finally {
        setReportLoading(false);
      }
    };

  // ====================================================
  // SHARE
  // ====================================================

  const handleShare =
    async () => {
      try {
        if (
          typeof navigator ===
          "undefined"
        ) {
          return;
        }

        if (
          navigator.share
        ) {
          await navigator.share(
            {
              title:
                video?.videotitle ||
                "Video",
              url:
                window.location.href,
            }
          );
        } else if (
          navigator.clipboard
        ) {
          await navigator.clipboard.writeText(
            window.location.href
          );

          alert(
            "Video link copied!"
          );
        }
      } catch (error) {
        console.error(
          "Share error:",
          error
        );
      }
    };

  // ====================================================
  // RENDER COMMENT TEXT
  // ====================================================

  const renderCommentText = (
    item: Comment
  ) => {
    const mentions =
      (item.mentions || [])
        .map((mention) => {
          if (
            typeof mention ===
            "string"
          ) {
            return {
              _id: mention,
              name: "",
            };
          }

          return {
            _id: mention._id,
            name:
              mention.name?.trim() ||
              mention.Channelname?.trim() ||
              mention.email?.split(
                "@"
              )[0] ||
              "User",
          };
        })
        .filter(
          (mention) =>
            mention._id
        );

    if (
      mentions.length === 0
    ) {
      return item.comment;
    }

    const parts: Array<{
      text: string;
      mention?: boolean;
    }> = [];

    let remaining =
      item.comment;

    mentions.forEach(
      (mention) => {
        if (!mention.name) {
          return;
        }

        const token =
          `@${mention.name}`;

        const index =
          remaining
            .toLowerCase()
            .indexOf(
              token.toLowerCase()
            );

        if (index === -1) {
          return;
        }

        if (index > 0) {
          parts.push({
            text:
              remaining.slice(
                0,
                index
              ),
          });
        }

        parts.push({
          text:
            remaining.slice(
              index,
              index +
                token.length
            ),
          mention: true,
        });

        remaining =
          remaining.slice(
            index +
              token.length
          );
      }
    );

    if (remaining) {
      parts.push({
        text: remaining,
      });
    }

    if (
      parts.length === 0
    ) {
      return item.comment;
    }

    return parts.map(
      (part, index) =>
        part.mention ? (
          <span
            key={`mention-${index}`}
            className="font-semibold text-blue-600"
          >
            {part.text}
          </span>
        ) : (
          <span
            key={`text-${index}`}
          >
            {part.text}
          </span>
        )
    );
  };

  // ====================================================
  // SORT COMMENTS
  // ====================================================

  const mainComments =
    comments.filter(
      (item) =>
        !item.parentCommentId
    );

  const sortedMainComments =
    [...mainComments].sort(
      (a, b) => {
        if (
          commentSort === "top"
        ) {
          const aLikes =
            Number(
              a.likeCount ??
                a.likes?.length ??
                0
            );

          const bLikes =
            Number(
              b.likeCount ??
                b.likes?.length ??
                0
            );

          if (
            bLikes !==
            aLikes
          ) {
            return (
              bLikes -
              aLikes
            );
          }
        }

        const aTime =
          new Date(
            a.createdAt
          ).getTime();

        const bTime =
          new Date(
            b.createdAt
          ).getTime();

        return commentSort ===
          "oldest"
          ? aTime - bTime
          : bTime - aTime;
      }
    );

  // ====================================================
  // GET REPLIES
  // ====================================================

  const getReplies = (
    commentId: string
  ) => {
    return comments.filter(
      (item) =>
        String(
          item.parentCommentId
        ) ===
        String(commentId)
    );
  };

  // ====================================================
  // RENDER COMMENT
  // ====================================================

  const renderComment = (
    item: Comment,
    isReply = false
  ) => {
    const commentUserId =
      item.viewer?._id ||
      item.viewer?.id ||
      "";

    const isOwner =
      String(
        commentUserId
      ) ===
      String(userId);

    const currentLikeCount =
      Number(
        item.likeCount ??
          item.likes?.length ??
          0
      );

    const currentDislikeCount =
      Number(
        item.dislikeCount ??
          item.dislikes?.length ??
          0
      );

    const currentUserLiked =
      (item.likes || []).some(
        (likeId) =>
          String(likeId) ===
          String(userId)
      );

    const currentUserDisliked =
      (
        item.dislikes || []
      ).some(
        (dislikeId) =>
          String(dislikeId) ===
          String(userId)
      );

    const userName =
      item.viewer?.name ||
      item.viewer?.email ||
      "User";

    const replies =
      getReplies(item._id);

    return (
      <div
        key={item._id}
        className={
          isReply
            ? "ml-12 border-l-2 border-gray-200 pl-4"
            : ""
        }
      >
        <div className="flex gap-3">

          {/* PROFILE */}

          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
            {item.viewer?.image ? (
              <img
                src={
                  item.viewer.image
                }
                alt={userName}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircle
                size={25}
                className="text-gray-500"
              />
            )}
          </div>

          {/* CONTENT */}

          <div className="min-w-0 flex-1">

            {/* USER INFO */}

            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">
                {userName}
              </p>

              {item.viewer
                ?.location && (
                <span className="text-xs text-gray-400">
                  •{" "}
                  {
                    item.viewer
                      .location
                  }
                </span>
              )}

              <span className="text-xs text-gray-400">
                {item.createdAt
                  ? new Date(
                      item.createdAt
                    ).toLocaleDateString()
                  : ""}
              </span>

              {item.isEdited && (
                <span className="text-xs text-gray-400">
                  (edited)
                </span>
              )}
            </div>

            {/* EDIT */}

            {editingCommentId ===
            item._id ? (
              <div className="mt-2">
                <textarea
                  value={
                    editingText
                  }
                  onChange={(
                    event
                  ) =>
                    setEditingText(
                      event.target
                        .value
                    )
                  }
                  rows={2}
                  className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-black"
                />

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleEditComment(
                        item._id,
                        item.mentions ||
                          []
                      )
                    }
                    disabled={
                      editLoading ||
                      !editingText.trim()
                    }
                    className="rounded-full bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {editLoading
                      ? "Saving..."
                      : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCommentId(
                        null
                      );
                      setEditingText(
                        ""
                      );
                    }}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* COMMENT TEXT */}

                <div className="mt-1">
                  <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
                    {renderCommentText(
                      item
                    )}
                  </p>

                  {/* TRANSLATION */}

                  {translatedComments[
                    item._id
                  ] && (
                    <div className="mt-2 rounded-lg border-l-2 border-gray-300 bg-gray-50 px-3 py-2">
                      <p className="mb-1 text-xs font-semibold text-gray-500">
                        Translation
                      </p>

                      <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
                        {
                          translatedComments[
                            item._id
                          ]
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* ACTIONS */}

                <div className="mt-2 flex flex-wrap items-center gap-2">

                  {/* LIKE */}

                  <button
                    type="button"
                    onClick={() =>
                      handleCommentLike(
                        item._id
                      )
                    }
                    disabled={
                      commentLikeLoading ===
                      item._id
                    }
                    className={
                      currentUserLiked
                        ? "flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-white"
                        : "flex items-center gap-1 rounded-full px-3 py-1.5 text-gray-600 hover:bg-gray-100"
                    }
                  >
                    <ThumbsUp
                      size={16}
                    />

                    <span className="text-xs">
                      {
                        currentLikeCount
                      }
                    </span>
                  </button>

                  {/* DISLIKE */}

                  <button
                    type="button"
                    onClick={() =>
                      handleCommentDislike(
                        item._id
                      )
                    }
                    disabled={
                      commentDislikeLoading ===
                      item._id
                    }
                    className={
                      currentUserDisliked
                        ? "flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-white"
                        : "flex items-center gap-1 rounded-full px-3 py-1.5 text-gray-600 hover:bg-gray-100"
                    }
                  >
                    <ThumbsDown
                      size={16}
                    />

                    <span className="text-xs">
                      {
                        currentDislikeCount
                      }
                    </span>
                  </button>

                  {/* REPLY */}

                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(
                        item
                      );

                      setReplyText(
                        ""
                      );

                      setReplyMentions(
                        []
                      );

                      setMentionSuggestions(
                        []
                      );

                      setMentionMode(
                        null
                      );

                      setMentionQuery(
                        ""
                      );

                      setMentionStart(
                        null
                      );

                      setEditingCommentId(
                        null
                      );
                    }}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-gray-100"
                  >
                    Reply
                  </button>

                  {/* TRANSLATE */}

                  <button
                    type="button"
                    onClick={() =>
                      translateComment(
                        item._id,
                        item.comment
                      )
                    }
                    disabled={
                      translatingComment ===
                      item._id
                    }
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {translatingComment ===
                    item._id
                      ? "Translating..."
                      : translatedComments[
                            item._id
                          ]
                        ? "Translate again"
                        : "Translate"}
                  </button>

                  {/* EDIT */}

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCommentId(
                          item._id
                        );

                        setEditingText(
                          item.comment
                        );

                        setReplyingTo(
                          null
                        );
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-gray-100"
                    >
                      Edit
                    </button>
                  )}

                  {/* DELETE */}

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteComment(
                          item._id
                        )
                      }
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}

                  {/* REPORT - TASK 12 */}

                  {!isOwner &&
                    userId && (
                      <button
                        type="button"
                        onClick={() => {
                          setReportingCommentId(
                            item._id
                          );

                          setReportReason(
                            "spam"
                          );

                          setReportDescription(
                            ""
                          );
                        }}
                        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                      >
                        <Flag
                          size={14}
                        />

                        Report
                      </button>
                    )}
                </div>

                {/* REPORT FORM */}

                {reportingCommentId ===
                  item._id && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <h4 className="font-semibold text-gray-900">
                      Report this comment
                    </h4>

                    <p className="mt-1 text-xs text-gray-500">
                      Select a reason for reporting this comment.
                    </p>

                    <select
                      value={
                        reportReason
                      }
                      onChange={(
                        event
                      ) =>
                        setReportReason(
                          event.target
                            .value
                        )
                      }
                      className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
                    >
                      {REPORT_REASONS.map(
                        (reason) => (
                          <option
                            key={
                              reason.value
                            }
                            value={
                              reason.value
                            }
                          >
                            {
                              reason.label
                            }
                          </option>
                        )
                      )}
                    </select>

                    <textarea
                      value={
                        reportDescription
                      }
                      onChange={(
                        event
                      ) =>
                        setReportDescription(
                          event.target
                            .value
                        )
                      }
                      placeholder="Additional details (optional)"
                      maxLength={500}
                      rows={3}
                      className="mt-3 w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:border-black"
                    />

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleReportComment(
                            item._id
                          )
                        }
                        disabled={
                          reportLoading
                        }
                        className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {reportLoading
                          ? "Reporting..."
                          : "Submit Report"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setReportingCommentId(
                            null
                          );

                          setReportReason(
                            "spam"
                          );

                          setReportDescription(
                            ""
                          );
                        }}
                        className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* REPLY BOX */}

            {replyingTo?._id ===
              item._id && (
              <div className="relative mt-4 flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                  {user?.image ? (
                    <img
                      src={
                        user.image
                      }
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle
                      size={22}
                      className="text-gray-500"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <textarea
                    ref={
                      replyInputRef
                    }
                    value={
                      replyText
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event.target
                          .value;

                      const cursor =
                        event.target
                          .selectionStart ??
                        value.length;

                      setReplyText(
                        value
                      );
                      setModerationMessage(
                        getClientModerationMessage(value)
                      );

                      updateMentionSearch(
                        value,
                        cursor,
                        "reply"
                      );
                    }}
                    placeholder={`Reply to ${userName}...`}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-black"
                  />

                  {/* REPLY MENTION SUGGESTIONS */}

                  {mentionMode ===
                    "reply" &&
                    (mentionLoading ||
                      mentionSuggestions.length >
                        0) && (
                      <div className="absolute z-50 mt-1 max-h-60 w-[min(360px,80vw)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                        {mentionLoading ? (
                          <p className="px-3 py-2 text-sm text-gray-500">
                            Searching users...
                          </p>
                        ) : (
                          mentionSuggestions.map(
                            (
                              suggestion
                            ) => {
                              const suggestionName =
                                suggestion.name?.trim() ||
                                suggestion.Channelname?.trim() ||
                                suggestion.email?.split(
                                  "@"
                                )[0] ||
                                "User";

                              return (
                                <button
                                  key={
                                    suggestion._id
                                  }
                                  type="button"
                                  onMouseDown={(
                                    event
                                  ) => {
                                    event.preventDefault();

                                    selectMention(
                                      suggestion
                                    );
                                  }}
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-100"
                                >
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                                    {suggestion.image ? (
                                      <img
                                        src={
                                          suggestion.image
                                        }
                                        alt={
                                          suggestionName
                                        }
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <UserCircle
                                        size={
                                          22
                                        }
                                        className="text-gray-500"
                                      />
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">
                                      {
                                        suggestionName
                                      }
                                    </p>

                                    {suggestion.email && (
                                      <p className="truncate text-xs text-gray-500">
                                        {
                                          suggestion.email
                                        }
                                      </p>
                                    )}
                                  </div>
                                </button>
                              );
                            }
                          )
                        )}
                      </div>
                    )}

                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={
                        handleReply
                      }
                      disabled={
                        replyLoading ||
                        !replyText.trim() ||
                        Boolean(moderationMessage)
                      }
                      className="rounded-full bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {replyLoading
                        ? "Replying..."
                        : "Reply"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(
                          null
                        );

                        setReplyText(
                          ""
                        );
                        setModerationMessage(
                          ""
                        );

                        setReplyMentions(
                          []
                        );

                        setMentionSuggestions(
                          []
                        );

                        setMentionMode(
                          null
                        );

                        setMentionQuery(
                          ""
                        );

                        setMentionStart(
                          null
                        );
                      }}
                      className="rounded-full border border-gray-300 px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {replyingTo && moderationMessage && (
              <p
                className="mt-2 text-sm font-medium text-red-600"
                role="alert"
              >
                {moderationMessage}
              </p>
            )}

            {/* REPLIES */}

            {replies.length >
              0 && (
              <div className="mt-5 space-y-5">
                {replies.map(
                  (reply) =>
                    renderComment(
                      reply,
                      true
                    )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">
          Loading video...
        </p>
      </div>
    );
  }

  // ====================================================
  // VIDEO NOT FOUND
  // ====================================================

  if (!video) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Video not found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Video ID: {id}
          </p>

          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-black px-5 py-2 text-white"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // ====================================================
  // VIDEO URL
  // ====================================================

  const videoUrl =
    getVideoUrl(
      video.filepath
    );

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto flex max-w-[1600px] gap-6">

        {/* ==================================================
            MAIN
        ================================================== */}

        <main className="min-w-0 flex-1">

          {/* VIDEO */}

          <div className="overflow-hidden rounded-xl bg-black">
            {videoUrl ? (
              <video
                key={videoUrl}
                className="aspect-video w-full bg-black"
                controls
                playsInline
                preload="metadata"
              >
                <source
                  src={videoUrl}
                  type={
                    video.filetype ||
                    "video/mp4"
                  }
                />

                Your browser does not support the video element.
              </video>
            ) : (
              <div className="flex aspect-video items-center justify-center text-white">
                Video unavailable
              </div>
            )}
          </div>

          {/* TITLE */}

          <h1 className="mt-4 text-xl font-bold text-black">
            {video.videotitle}
          </h1>

          {/* CHANNEL + BUTTONS */}

          <div className="mt-3 flex flex-wrap items-center gap-3">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                <UserCircle
                  size={25}
                />
              </div>

              <div>
                <p className="font-semibold">
                  {video.videochanel ||
                    video.videochannel ||
                    "Tech Channel"}
                </p>

                <p className="text-sm text-gray-500">
                  1.2M subscribers
                </p>
              </div>
            </div>

            {/* SUBSCRIBE */}

            <button
              type="button"
              className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white"
            >
              Subscribe
            </button>

            {/* LIKE */}

            <button
              type="button"
              onClick={
                handleLike
              }
              disabled={
                likeLoading
              }
              className={
                liked
                  ? "flex items-center gap-2 rounded-full bg-black px-4 py-2 text-white"
                  : "flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-black hover:bg-gray-200"
              }
            >
              <ThumbsUp
                size={18}
              />

              <span>
                {likeCount.toLocaleString()}
              </span>
            </button>

            {/* DISLIKE */}

            <button
              type="button"
              onClick={
                handleDislike
              }
              disabled={
                dislikeLoading
              }
              className={
                disliked
                  ? "flex items-center gap-2 rounded-full bg-black px-4 py-2 text-white"
                  : "flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-black hover:bg-gray-200"
              }
            >
              <ThumbsDown
                size={18}
              />

              <span>
                {dislikeCount.toLocaleString()}
              </span>
            </button>

            {/* WATCH LATER */}

            <button
              type="button"
              onClick={
                handleWatchLater
              }
              className={
                watchLater
                  ? "flex items-center gap-2 rounded-full bg-black px-4 py-2 text-white"
                  : "flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-black"
              }
            >
              <Clock
                size={18}
              />

              <span>
                {watchLater
                  ? "Saved"
                  : "Watch later"}
              </span>
            </button>

            {/* SHARE */}

            <button
              type="button"
              onClick={
                handleShare
              }
              className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 hover:bg-gray-200"
            >
              <Share2
                size={18}
              />

              Share
            </button>

            {/* DOWNLOAD */}

            {videoUrl && (
              <a
                href={videoUrl}
                download={
                  video.filename ||
                  "video.mp4"
                }
                className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 hover:bg-gray-200"
              >
                <Download
                  size={18}
                />

                Download
              </a>
            )}

            <button
              type="button"
              className="rounded-full bg-gray-100 p-2 hover:bg-gray-200"
            >
              <MoreHorizontal
                size={20}
              />
            </button>
          </div>

          {/* DESCRIPTION */}

          <div className="mt-4 rounded-xl bg-gray-100 p-4">
            <div className="mb-2 flex gap-3 text-sm font-semibold">
              <span>
                {(
                  video.views ||
                  0
                ).toLocaleString()}{" "}
                views
              </span>

              <span>
                {video.createdAt
                  ? new Date(
                      video.createdAt
                    ).toLocaleDateString()
                  : ""}
              </span>
            </div>

            <p className="text-sm text-gray-700">
              This video was uploaded to your YouTube Clone.
            </p>
          </div>

          {/* ==================================================
              COMMENTS
          ================================================== */}

          <section className="mt-8">

            <h2 className="mb-5 text-xl font-bold">
              {comments.length}{" "}
              {comments.length ===
              1
                ? "Comment"
                : "Comments"}
            </h2>

            {/* TRANSLATION */}

            <div className="mb-4 flex items-center gap-2">
              <label
                htmlFor="comment-translation-language"
                className="text-sm font-medium text-gray-600"
              >
                Translate to:
              </label>

              <select
                id="comment-translation-language"
                value={
                  translationLanguage
                }
                onChange={(
                  event
                ) => {
                  setTranslationLanguage(
                    event.target
                      .value
                  );

                  setTranslatedComments(
                    {}
                  );
                }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-black"
              >
                <option value="en">
                  English
                </option>

                <option value="te">
                  Telugu
                </option>

                <option value="hi">
                  Hindi
                </option>

                <option value="ta">
                  Tamil
                </option>

                <option value="kn">
                  Kannada
                </option>

                <option value="ml">
                  Malayalam
                </option>

                <option value="fr">
                  French
                </option>

                <option value="de">
                  German
                </option>

                <option value="es">
                  Spanish
                </option>
              </select>
            </div>

            {/* SORTING */}

            <div className="mb-5 flex items-center gap-2">
              <label
                htmlFor="comment-sort"
                className="text-sm font-medium text-gray-600"
              >
                Sort by:
              </label>

              <select
                id="comment-sort"
                value={
                  commentSort
                }
                onChange={(
                  event
                ) =>
                  setCommentSort(
                    event.target
                      .value as
                      | "newest"
                      | "oldest"
                      | "top"
                  )
                }
                className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-black"
              >
                <option value="newest">
                  Newest
                </option>

                <option value="oldest">
                  Oldest
                </option>

                <option value="top">
                  Top comments
                </option>
              </select>
            </div>

            {/* ADD COMMENT */}

            <div className="relative flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                {user?.image ? (
                  <img
                    src={
                      user.image
                    }
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle
                    size={25}
                  />
                )}
              </div>

              <input
                ref={
                  commentInputRef
                }
                type="text"
                value={
                  commentText
                }
                onChange={(
                  event
                ) => {
                  const value =
                    event.target
                      .value;

                  const cursor =
                    event.target
                      .selectionStart ??
                    value.length;

                  setCommentText(
                    value
                  );
                  setModerationMessage(
                    getClientModerationMessage(value)
                  );

                  updateMentionSearch(
                    value,
                    cursor,
                    "comment"
                  );
                }}
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                      "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();

                    handleComment();
                  }
                }}
                placeholder={
                  userId
                    ? "Add a comment..."
                    : "Login to comment..."
                }
                disabled={
                  !userId ||
                  commentLoading
                }
                className="w-full border-b border-gray-300 px-2 py-3 outline-none focus:border-black disabled:cursor-not-allowed disabled:bg-gray-50"
              />

              {/* COMMENT MENTIONS */}

              {mentionMode ===
                "comment" &&
                (mentionLoading ||
                  mentionSuggestions.length >
                    0) && (
                  <div className="absolute z-50 mt-14 max-h-60 w-[min(360px,80vw)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                    {mentionLoading ? (
                      <p className="px-3 py-2 text-sm text-gray-500">
                        Searching users...
                      </p>
                    ) : (
                      mentionSuggestions.map(
                        (
                          suggestion
                        ) => {
                          const suggestionName =
                            suggestion.name?.trim() ||
                            suggestion.Channelname?.trim() ||
                            suggestion.email?.split(
                              "@"
                            )[0] ||
                            "User";

                          return (
                            <button
                              key={
                                suggestion._id
                              }
                              type="button"
                              onMouseDown={(
                                event
                              ) => {
                                event.preventDefault();

                                selectMention(
                                  suggestion
                                );
                              }}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-100"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                                {suggestion.image ? (
                                  <img
                                    src={
                                      suggestion.image
                                    }
                                    alt={
                                      suggestionName
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <UserCircle
                                    size={
                                      22
                                    }
                                    className="text-gray-500"
                                  />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {
                                    suggestionName
                                  }
                                </p>

                                {suggestion.email && (
                                  <p className="truncate text-xs text-gray-500">
                                    {
                                      suggestion.email
                                    }
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        }
                      )
                    )}
                  </div>
                )}

              <button
                type="button"
                onClick={
                  handleComment
                }
                disabled={
                  !userId ||
                  commentLoading ||
                  !commentText.trim() ||
                  Boolean(moderationMessage)
                }
                className="rounded-full bg-black p-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send
                  size={18}
                />
              </button>
            </div>

            {!replyingTo && moderationMessage && (
              <p
                className="mt-2 text-sm font-medium text-red-600"
                role="alert"
              >
                {moderationMessage}
              </p>
            )}

            {/* COMMENTS LIST */}

            <div className="mt-7 space-y-6">
              {commentsLoading ? (
                <p className="text-sm text-gray-500">
                  Loading comments...
                </p>
              ) : sortedMainComments.length ===
                0 ? (
                <p className="text-sm text-gray-500">
                  No comments yet. Be the first to comment.
                </p>
              ) : (
                sortedMainComments.map(
                  (item) =>
                    renderComment(
                      item
                    )
                )
              )}
            </div>
          </section>
        </main>

        {/* ==================================================
            RECOMMENDED VIDEOS
        ================================================== */}

        <aside className="hidden w-[360px] shrink-0 lg:block">
          <div className="space-y-4">

            {recommended.map(
              (item) => {
                const itemUrl =
                  getVideoUrl(
                    item.filepath
                  );

                return (
                  <Link
                    key={
                      item._id
                    }
                    href={`/watch/${item._id}`}
                    className="flex gap-3"
                  >
                    <div className="w-[160px] shrink-0 overflow-hidden rounded-lg bg-black">
                      {itemUrl ? (
                        <video
                          className="h-[90px] w-full object-cover"
                          muted
                          preload="metadata"
                        >
                          <source
                            src={
                              itemUrl
                            }
                            type={
                              item.filetype ||
                              "video/mp4"
                            }
                          />
                        </video>
                      ) : (
                        <div className="flex h-[90px] items-center justify-center text-xs text-white">
                          Video
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-sm font-semibold">
                        {
                          item.videotitle
                        }
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {item.videochanel ||
                          item.videochannel ||
                          "Tech Channel"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {(
                          item.views ||
                          0
                        ).toLocaleString()}{" "}
                        views
                      </p>
                    </div>
                  </Link>
                );
              }
            )}

          </div>
        </aside>
      </div>
    </div>
  );
}