"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

import { useUser } from "@/lib/AuthContext";

// ======================================================
// BACKEND URL
// ======================================================

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://youtube-hiv1.onrender.com";

// Helper: return an absolute API URL. Prefer an absolute BACKEND_URL when available.
// If no BACKEND_URL is configured, fall back to http://localhost:5000 so client requests reach the backend
// during local development instead of the Next dev server.
const getApiUrl = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;

  // Prefer an explicit absolute BACKEND_URL
  if (typeof BACKEND_URL === "string" && /^https?:\/\//i.test(BACKEND_URL)) {
    return `${BACKEND_URL.replace(/\/$/, "")}${p}`;
  }

  // On server-side, if BACKEND_URL is non-empty and not absolute, still return it (edge case)
  if (typeof window === "undefined") {
    if (BACKEND_URL) {
      return `${BACKEND_URL.replace(/\/$/, "")}${p}`;
    }
    // Default server-side backend
    return `http://localhost:5000${p}`;
  }

  // Client-side: prefer BACKEND_URL when it is absolute; otherwise use http://localhost:5000 during dev
  if (BACKEND_URL && /^https?:\/\//i.test(BACKEND_URL)) {
    return `${BACKEND_URL.replace(/\/$/, "")}${p}`;
  }

  // Final safe fallback for the browser
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
};

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
  // VIDEO STATES
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
  // COMMENT LIKE LOADING
  // ====================================================

  const [commentLikeLoading, setCommentLikeLoading] =
    useState<string | null>(null);

  const [commentDislikeLoading, setCommentDislikeLoading] =
    useState<string | null>(null);

  // ====================================================
  // GET VIDEO URL
  // ====================================================

  const getVideoUrl = (
    filepath?: string
  ): string => {
    if (!filepath) {
      return "";
    }

    let cleanPath = filepath;

    cleanPath = cleanPath.replace(/\\/g, "/");

    cleanPath = cleanPath.replace(/^\/+/, "");

    cleanPath = cleanPath.replace(
      /^uploads\//i,
      ""
    );

    if (!cleanPath) {
      return "";
    }

    const encodedPath = cleanPath
      .split("/")
      .map((part) =>
        encodeURIComponent(part)
      )
      .join("/");

    return `${BACKEND_URL}/uploads/${encodedPath}`;
  };

  // ====================================================
  // GET ALL VIDEOS
  // ====================================================

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    const getVideos = async () => {
      try {
        setLoading(true);

        const response = await fetch(getApiUrl(`/video/getall`), { method: "GET", cache: "no-store" });

        if (!response.ok) {
          throw new Error(
            `Video API failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        let allVideos: Video[] = [];

        if (Array.isArray(data)) {
          allVideos = data;
        } else if (
          Array.isArray(data?.videos)
        ) {
          allVideos = data.videos;
        } else if (
          Array.isArray(data?.data)
        ) {
          allVideos = data.data;
        } else if (
          Array.isArray(data?.data?.videos)
        ) {
          allVideos = data.data.videos;
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
  }, [router.isReady, id]);

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

    const addHistory = async () => {
      try {
        await fetch(
          getApiUrl(`/history/add`),
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

    const checkLike = async () => {
      try {
        const response = await fetch(
          getApiUrl(`/like/user/${userId}`)
        );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        let likedVideos: any[] = [];

        if (Array.isArray(data)) {
          likedVideos = data;
        } else if (
          Array.isArray(data?.videos)
        ) {
          likedVideos = data.videos;
        } else if (
          Array.isArray(data?.likes)
        ) {
          likedVideos = data.likes;
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
                String(itemVideoId) ===
                String(id)
              );
            }
          );

        setLiked(alreadyLiked);
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
              getApiUrl(`/watchlater/user/${userId}`)
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          let savedVideos: any[] =
            [];

          if (Array.isArray(data)) {
            savedVideos = data;
          } else if (
            Array.isArray(data?.videos)
          ) {
            savedVideos = data.videos;
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
                  String(itemVideoId) ===
                  String(id)
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

    const getComments = async () => {
      try {
        setCommentsLoading(true);

        const response =
          await fetch(
            getApiUrl(`/comment/${id}`),
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
          receivedComments = data;
        }

        const formattedComments =
          receivedComments.map(
            (item: any) => ({
              ...item,

              likes:
                item?.likes || [],

              dislikes:
                item?.dislikes || [],

              likeCount:
                Number(
                  item?.likeCount ??
                    item?.likes?.length ??
                    0
                ),

              dislikeCount:
                Number(
                  item?.dislikeCount ??
                    item?.dislikes?.length ??
                    0
                ),
            })
          );

        setComments(
          formattedComments
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

  const sendLikeAction = async (
    action: "like" | "dislike"
  ) => {
    if (!userId) {
      alert("Please login first.");
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
          getApiUrl(`/like/${video._id}`),
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

  const handleLike = async () => {
    await sendLikeAction("like");
  };

  const handleDislike = async () => {
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
            getApiUrl(`/watchlater/${video._id}`),
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
            getApiUrl(`/comment/${video._id}`),
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
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to add comment"
          );
        }

        if (data?.comment) {
          const newComment: Comment = {
            ...data.comment,
            likes: [],
            dislikes: [],
            likeCount: 0,
            dislikeCount: 0,
          };

          setComments(
            (previous) => [
              newComment,
              ...previous,
            ]
          );
        }

        setCommentText("");
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
            getApiUrl(`/comment/${commentId}/like`),
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

        console.log(
          "COMMENT LIKE:",
          data
        );

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

                return {
                  ...item,

                  likeCount:
                    Number(
                      data.likeCount ??
                        0
                    ),

                  dislikeCount:
                    Number(
                      data.dislikeCount ??
                        0
                    ),

                  likes:
                    data.liked
                      ? [
                          ...(item.likes ||
                            []),
                          userId,
                        ]
                      : (
                          item.likes ||
                          []
                        ).filter(
                          (id) =>
                            String(id) !==
                            String(userId)
                        ),

                  dislikes:
                    (
                      item.dislikes ||
                      []
                    ).filter(
                      (id) =>
                        String(id) !==
                        String(userId)
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
            getApiUrl(`/comment/${commentId}/dislike`),
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

        console.log(
          "COMMENT DISLIKE:",
          data
        );

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

                return {
                  ...item,

                  likeCount:
                    Number(
                      data.likeCount ??
                        0
                    ),

                  dislikeCount:
                    Number(
                      data.dislikeCount ??
                        0
                    ),

                  dislikes:
                    data.disliked
                      ? [
                          ...(item.dislikes ||
                            []),
                          userId,
                        ]
                      : (
                          item.dislikes ||
                          []
                        ).filter(
                          (id) =>
                            String(id) !==
                            String(userId)
                        ),

                  likes:
                    (
                      item.likes ||
                      []
                    ).filter(
                      (id) =>
                        String(id) !==
                        String(userId)
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

      try {
        const response =
          await fetch(
            getApiUrl(`/comment/${commentId}`),
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

        if (navigator.share) {
          await navigator.share({
            title:
              video?.videotitle ||
              "Video",
            url:
              window.location.href,
          });
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
    getVideoUrl(video.filepath);

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto flex max-w-[1600px] gap-6">

        {/* MAIN CONTENT */}

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

                Your browser does not
                support the video element.
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
                <UserCircle size={25} />
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

            <button
              type="button"
              className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white"
            >
              Subscribe
            </button>

            {/* VIDEO LIKE */}

            <button
              type="button"
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                liked
                  ? "bg-black text-white"
                  : "bg-gray-100 text-black hover:bg-gray-200"
              }`}
            >
              <ThumbsUp size={18} />

              <span>
                {likeCount.toLocaleString()}
              </span>
            </button>

            {/* VIDEO DISLIKE */}

            <button
              type="button"
              onClick={handleDislike}
              disabled={dislikeLoading}
              className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                disliked
                  ? "bg-black text-white"
                  : "bg-gray-100 text-black hover:bg-gray-200"
              }`}
            >
              <ThumbsDown size={18} />

              <span>
                {dislikeCount.toLocaleString()}
              </span>
            </button>

            {/* WATCH LATER */}

            <button
              type="button"
              onClick={handleWatchLater}
              className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                watchLater
                  ? "bg-black text-white"
                  : "bg-gray-100 text-black hover:bg-gray-200"
              }`}
            >
              <Clock size={18} />

              <span>
                {watchLater
                  ? "Saved"
                  : "Watch later"}
              </span>
            </button>

            {/* SHARE */}

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 hover:bg-gray-200"
            >
              <Share2 size={18} />
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
                <Download size={18} />
                Download
              </a>
            )}

            <button
              type="button"
              className="rounded-full bg-gray-100 p-2 hover:bg-gray-200"
            >
              <MoreHorizontal size={20} />
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
              This video was uploaded
              to your YouTube Clone.
            </p>
          </div>

          {/* ==================================================
              COMMENTS
          ================================================== */}

          <section className="mt-8">

            <h2 className="mb-5 text-xl font-bold">
              {comments.length}{" "}
              {comments.length === 1
                ? "Comment"
                : "Comments"}
            </h2>

            {/* ADD COMMENT */}

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle size={25} />
                )}
              </div>

              <input
                type="text"
                value={commentText}
                onChange={(event) =>
                  setCommentText(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
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

              <button
                type="button"
                onClick={handleComment}
                disabled={
                  !userId ||
                  commentLoading ||
                  !commentText.trim()
                }
                className="rounded-full bg-black p-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>

            {/* COMMENTS LIST */}

            <div className="mt-7 space-y-6">

              {commentsLoading ? (
                <p className="text-sm text-gray-500">
                  Loading comments...
                </p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No comments yet. Be
                  the first to comment.
                </p>
              ) : (
                comments.map((item) => {

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
                      (id) =>
                        String(id) ===
                        String(userId)
                    );

                  const currentUserDisliked =
                    (
                      item.dislikes ||
                      []
                    ).some(
                      (id) =>
                        String(id) ===
                        String(userId)
                    );

                  return (
                    <div
                      key={item._id}
                      className="flex gap-3"
                    >

                      {/* PROFILE */}

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">

                        {item.viewer?.image ? (
                          <img
                            src={
                              item.viewer.image
                            }
                            alt={
                              item.viewer.name ||
                              "User"
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserCircle
                            size={25}
                          />
                        )}

                      </div>

                      {/* COMMENT */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="font-semibold">
                            {item.viewer?.name ||
                              item.viewer?.email ||
                              "User"}
                          </p>

                          <span className="text-xs text-gray-400">
                            {item.createdAt
                              ? new Date(
                                  item.createdAt
                                ).toLocaleDateString()
                              : ""}
                          </span>

                        </div>

                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                          {item.comment}
                        </p>

                        {/* COMMENT ACTIONS */}

                        <div className="mt-2 flex items-center gap-3">

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
                            className={`flex items-center gap-1 rounded-full px-2 py-1 transition ${
                              currentUserLiked
                                ? "bg-black text-white"
                                : "text-gray-600 hover:bg-gray-100 hover:text-black"
                            }`}
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
                            className={`flex items-center gap-1 rounded-full px-2 py-1 transition ${
                              currentUserDisliked
                                ? "bg-black text-white"
                                : "text-gray-600 hover:bg-gray-100 hover:text-black"
                            }`}
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

                          {/* DELETE */}

                          {isOwner && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteComment(
                                  item._id
                                )
                              }
                              className="text-xs font-semibold text-gray-500 hover:text-red-500"
                            >
                              Delete
                            </button>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                })
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
                    key={item._id}
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
                            src={itemUrl}
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
                        {item.videotitle}
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