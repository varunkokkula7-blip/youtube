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

// IMPORTANT:
// In production this will use your Render backend.
// In local development it can use localhost.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://youtube-hiv1.onrender.com";

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
// COMMENT TYPE
// ======================================================

type Comment = {
  _id: string;

  viewer?: {
    _id?: string;
    name?: string;
    email?: string;
    image?: string;
  };

  videoid: string;
  comment: string;

  createdAt: string;
  updatedAt?: string;
};

// ======================================================
// WATCH PAGE
// ======================================================

export default function WatchPage() {
  const router = useRouter();

  // ======================================================
  // VIDEO ID
  // ======================================================

  const id =
    typeof router.query.id === "string"
      ? router.query.id
      : "";

  // ======================================================
  // USER
  // ======================================================

  const { user } = useUser();

  // ======================================================
  // STATES
  // ======================================================

  const [video, setVideo] = useState<Video | null>(null);

  const [recommended, setRecommended] =
    useState<Video[]>([]);

  const [loading, setLoading] = useState(true);

  const [likeCount, setLikeCount] = useState(0);

  const [dislikeCount, setDislikeCount] =
    useState(0);

  const [liked, setLiked] = useState(false);

  const [disliked, setDisliked] =
    useState(false);

  const [watchLater, setWatchLater] =
    useState(false);

  // ======================================================
  // COMMENTS
  // ======================================================

  const [comments, setComments] =
    useState<Comment[]>([]);

  const [commentText, setCommentText] =
    useState("");

  const [commentLoading, setCommentLoading] =
    useState(false);

  const [commentsLoading, setCommentsLoading] =
    useState(false);

  // ======================================================
  // LIKE / DISLIKE LOADING
  // ======================================================

  const [likeLoading, setLikeLoading] =
    useState(false);

  const [dislikeLoading, setDislikeLoading] =
    useState(false);

  // ======================================================
  // USER ID
  // ======================================================

  const userId =
    user?._id ||
    user?.id ||
    "";

  // ======================================================
  // NORMALIZE VIDEO PATH
  // ======================================================

  const getVideoUrl = (
    filepath?: string
  ): string => {
    if (!filepath) {
      return "";
    }

    let cleanPath = filepath;

    // Convert Windows backslashes to /
    cleanPath = cleanPath.replace(/\\/g, "/");

    // Remove leading slash
    cleanPath = cleanPath.replace(/^\/+/, "");

    // Remove uploads/ if backend already included it
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

  // ======================================================
  // GET ALL VIDEOS
  // ======================================================

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    const getVideos = async () => {
      try {
        setLoading(true);

        console.log(
          "Backend URL:",
          BACKEND_URL
        );

        console.log(
          "Requested video ID:",
          id
        );

        const response = await fetch(
          `${BACKEND_URL}/video/getall`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        console.log(
          "Video API status:",
          response.status
        );

        if (!response.ok) {
          throw new Error(
            `Video API failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        console.log(
          "Video API response:",
          data
        );

        // Support different backend response formats
        let allVideos: Video[] = [];

        if (
          Array.isArray(data)
        ) {
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

        console.log(
          "All videos:",
          allVideos
        );

        const selectedVideo =
          allVideos.find(
            (item) =>
              String(item?._id) ===
              String(id)
          );

        console.log(
          "Selected video:",
          selectedVideo
        );

        if (!selectedVideo) {
          console.error(
            "Video ID was not found:",
            id
          );
        }

        setVideo(
          selectedVideo || null
        );

        setRecommended(
          allVideos.filter(
            (item) =>
              String(item?._id) !==
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

  // ======================================================
  // ADD TO HISTORY
  // ======================================================

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
        const response = await fetch(
          `${BACKEND_URL}/history/add`,
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

        const data =
          await response.json();

        console.log(
          "History response:",
          data
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

  // ======================================================
  // CHECK LIKE
  // ======================================================

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
        const response =
          await fetch(
            `${BACKEND_URL}/like/user/${userId}`
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        console.log(
          "Liked videos:",
          data
        );

        let likedVideos: any[] = [];

        if (
          Array.isArray(data)
        ) {
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

  // ======================================================
  // CHECK WATCH LATER
  // ======================================================

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
              `${BACKEND_URL}/watchlater/user/${userId}`
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          console.log(
            "Watch Later:",
            data
          );

          let savedVideos: any[] =
            [];

          if (
            Array.isArray(data)
          ) {
            savedVideos = data;
          } else if (
            Array.isArray(data?.videos)
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

  // ======================================================
  // GET COMMENTS
  // ======================================================

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
          setCommentsLoading(
            true
          );

          const response =
            await fetch(
              `${BACKEND_URL}/comment/${id}`
            );

          if (!response.ok) {
            throw new Error(
              "Could not get comments"
            );
          }

          const data =
            await response.json();

          console.log(
            "Comments:",
            data
          );

          if (
            Array.isArray(
              data?.comments
            )
          ) {
            setComments(
              data.comments
            );
          } else if (
            Array.isArray(data)
          ) {
            setComments(data);
          } else {
            setComments([]);
          }
        } catch (error) {
          console.error(
            "Get comments error:",
            error
          );

          setComments([]);
        } finally {
          setCommentsLoading(
            false
          );
        }
      };

    getComments();
  }, [
    router.isReady,
    id,
  ]);

  // ======================================================
  // LIKE / DISLIKE
  // ======================================================

  const sendLikeAction = async (
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

      setDislikeLoading(
        true
      );
    }

    try {
      const response =
        await fetch(
          `${BACKEND_URL}/like/${video._id}`,
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

      console.log(
        `${action} response:`,
        data
      );

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
            0
        );

      const newDislikeCount =
        Number(
          data?.Dislike ??
            data?.dislikes ??
            0
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

            Like:
              newLikeCount,

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
        setLikeLoading(
          false
        );
      } else {
        setDislikeLoading(
          false
        );
      }
    }
  };

  // ======================================================
  // LIKE
  // ======================================================

  const handleLike = async () => {
    await sendLikeAction(
      "like"
    );
  };

  // ======================================================
  // DISLIKE
  // ======================================================

  const handleDislike =
    async () => {
      await sendLikeAction(
        "dislike"
      );
    };

  // ======================================================
  // WATCH LATER
  // ======================================================

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
            `${BACKEND_URL}/watchlater/${video._id}`,
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
          "Watch Later response:",
          data
        );

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

  // ======================================================
  // ADD COMMENT
  // ======================================================

  const handleComment =
    async () => {
      if (!userId) {
        alert(
          "Please login to comment."
        );

        return;
      }

      if (
        !commentText.trim()
      ) {
        return;
      }

      if (!video?._id) {
        return;
      }

      if (commentLoading) {
        return;
      }

      setCommentLoading(
        true
      );

      try {
        const response =
          await fetch(
            `${BACKEND_URL}/comment/${video._id}`,
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

        console.log(
          "Comment response:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to add comment"
          );
        }

        if (data?.comment) {
          setComments(
            (previous) => [
              data.comment,
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
        setCommentLoading(
          false
        );
      }
    };

  // ======================================================
  // DELETE COMMENT
  // ======================================================

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
            `${BACKEND_URL}/comment/${commentId}`,
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

        console.log(
          "Delete comment response:",
          data
        );

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

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">
          Loading video...
        </p>
      </div>
    );
  }

  // ======================================================
  // VIDEO NOT FOUND
  // ======================================================

  if (!video) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-500">
            Video not found.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Video ID: {id}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Backend: {BACKEND_URL}
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

  // ======================================================
  // VIDEO URL
  // ======================================================

  const videoUrl =
    getVideoUrl(
      video.filepath
    );

  console.log(
    "Playing video:",
    videoUrl
  );

  // ======================================================
  // SHARE
  // ======================================================

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
          await navigator.share({
            title:
              video.videotitle,
            url:
              window.location
                .href,
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

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div className="min-h-screen bg-white">

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-5">

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <main className="min-w-0 flex-1">

          {/* =================================================
              VIDEO PLAYER
          ================================================= */}

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

          {/* =================================================
              TITLE
          ================================================= */}

          <h1 className="mt-4 text-xl font-bold text-black">
            {video.videotitle}
          </h1>

          {/* =================================================
              CHANNEL + BUTTONS
          ================================================= */}

          <div className="mt-3 flex flex-wrap items-center gap-3">

            {/* CHANNEL */}

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
              className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                liked
                  ? "bg-black text-white"
                  : "bg-gray-100 text-black hover:bg-gray-200"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <ThumbsUp size={18} />

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
              className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                disliked
                  ? "bg-black text-white"
                  : "bg-gray-100 text-black hover:bg-gray-200"
              } disabled:cursor-not-allowed disabled:opacity-60`}
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
              onClick={
                handleShare
              }
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
                <Download
                  size={18}
                />

                Download
              </a>
            )}

            {/* MORE */}

            <button
              type="button"
              className="rounded-full bg-gray-100 p-2 hover:bg-gray-200"
            >
              <MoreHorizontal
                size={20}
              />
            </button>

          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

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

          {/* =================================================
              COMMENTS
          ================================================= */}

          <div className="mt-6">

            <h2 className="mb-5 text-xl font-bold">

              {comments.length}{" "}

              {comments.length ===
              1
                ? "Comment"
                : "Comments"}

            </h2>

            {/* ADD COMMENT */}

            <div className="flex items-center gap-3">

              {/* USER IMAGE */}

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

              {/* INPUT */}

              <input
                type="text"
                value={
                  commentText
                }
                onChange={(
                  event
                ) =>
                  setCommentText(
                    event.target
                      .value
                  )
                }
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

              {/* SEND */}

              <button
                type="button"
                onClick={
                  handleComment
                }
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

            <div className="mt-6 space-y-6">

              {commentsLoading ? (
                <p className="text-sm text-gray-500">
                  Loading comments...
                </p>
              ) : comments.length ===
                0 ? (
                <p className="text-sm text-gray-500">
                  No comments yet.
                  Be the first to
                  comment.
                </p>
              ) : (
                comments.map(
                  (item) => {
                    const commentUserId =
                      item.viewer
                        ?._id ||
                      "";

                    const isOwner =
                      String(
                        commentUserId
                      ) ===
                      String(
                        userId
                      );

                    return (
                      <div
                        key={
                          item._id
                        }
                        className="flex gap-3"
                      >

                        {/* PROFILE */}

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">

                          {item.viewer
                            ?.image ? (
                            <img
                              src={
                                item
                                  .viewer
                                  .image
                              }
                              alt={
                                item
                                  .viewer
                                  .name ||
                                "User"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserCircle
                              size={
                                25
                              }
                            />
                          )}

                        </div>

                        {/* CONTENT */}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="font-semibold">
                              {item
                                .viewer
                                ?.name ||
                                item
                                  .viewer
                                  ?.email ||
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
                            {
                              item.comment
                            }
                          </p>

                          {isOwner && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteComment(
                                  item._id
                                )
                              }
                              className="mt-2 text-xs font-semibold text-gray-500 hover:text-red-500"
                            >
                              Delete
                            </button>
                          )}

                        </div>

                      </div>
                    );
                  }
                )
              )}

            </div>

          </div>

        </main>

        {/* =================================================
            RIGHT SIDE
            RECOMMENDED VIDEOS
        ================================================= */}

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

                    {/* VIDEO */}

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

                    {/* DETAILS */}

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