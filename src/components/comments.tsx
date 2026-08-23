"use client";

import { useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";

type Viewer = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  image?: string;
};

type CommentType = {
  _id: string;
  videoid: string;
  viewer?: Viewer;
  comment: string;
  createdAt: string;
};

type CommentsProps = {
  videoId: string;
  user?: Viewer | null;
};

const Comments = ({
  videoId,
  user,
}: CommentsProps) => {
  const [comments, setComments] = useState<CommentType[]>(
    []
  );

  const [newComment, setNewComment] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================
  // GET COMMENTS
  // ==========================================

  const loadComments = async () => {
    if (!videoId) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `http://localhost:5000/comment/${videoId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load comments: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.comments)) {
        setComments(data.comments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error(
        "Error loading comments:",
        error
      );

      setError("Could not load comments.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD COMMENTS WHEN VIDEO CHANGES
  // ==========================================

  useEffect(() => {
    loadComments();
  }, [videoId]);

  // ==========================================
  // ADD COMMENT
  // ==========================================

  const handleSubmitComment = async () => {
    if (!user) {
      alert("Please login to comment.");
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    const userId = user._id || user.id;

    if (!userId) {
      alert("User ID is missing. Please login again.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `http://localhost:5000/comment/${videoId}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId,
            comment: newComment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not add comment"
        );
      }

      if (data.success && data.comment) {
        setComments((prev) => [
          data.comment,
          ...prev,
        ]);
      }

      setNewComment("");
    } catch (error) {
      console.error(
        "Error adding comment:",
        error
      );

      alert("Could not add comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // DELETE COMMENT
  // ==========================================

  const handleDelete = async (
    commentId: string
  ) => {
    try {
      const response = await fetch(
        `http://localhost:5000/comment/${commentId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not delete comment"
        );
      }

      setComments((prev) =>
        prev.filter(
          (comment) =>
            comment._id !== commentId
        )
      );
    } catch (error) {
      console.error(
        "Error deleting comment:",
        error
      );

      alert("Could not delete comment.");
    }
  };

  // ==========================================
  // USER INFORMATION
  // ==========================================

  const currentUserId =
    user?._id || user?.id;

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="mt-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">

      {/* ==============================
          COMMENT COUNT
      ============================== */}

      <h2 className="mb-5 text-xl font-semibold">
        {comments.length} Comments
      </h2>

      {/* ==============================
          ADD COMMENT
      ============================== */}

      <div className="mb-7 flex items-start gap-3">

        <Avatar className="h-10 w-10 shrink-0">

          {user?.image && (
            <AvatarImage
              src={user.image}
              alt={user.name || "User"}
            />
          )}

          <AvatarFallback>
            {user?.name
              ?.charAt(0)
              .toUpperCase() || "U"}
          </AvatarFallback>

        </Avatar>

        <div className="flex-1">

          <Textarea
            placeholder={
              user
                ? "Add a comment..."
                : "Login to add a comment"
            }
            value={newComment}
            onChange={(e) =>
              setNewComment(e.target.value)
            }
            disabled={!user || isSubmitting}
            className="min-h-[80px] resize-none"
          />

          <div className="mt-2 flex justify-end">

            <Button
              onClick={handleSubmitComment}
              disabled={
                !user ||
                !newComment.trim() ||
                isSubmitting
              }
            >
              {isSubmitting
                ? "Commenting..."
                : "Comment"}
            </Button>

          </div>

        </div>
      </div>

      {/* ==============================
          LOADING
      ============================== */}

      {loading && (
        <p className="py-5 text-sm text-gray-500">
          Loading comments...
        </p>
      )}

      {/* ==============================
          ERROR
      ============================== */}

      {!loading && error && (
        <p className="py-5 text-sm text-red-500">
          {error}
        </p>
      )}

      {/* ==============================
          NO COMMENTS
      ============================== */}

      {!loading &&
        !error &&
        comments.length === 0 && (
          <div className="py-8 text-center">
            <p className="font-medium text-gray-600">
              No comments yet
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Be the first to comment!
            </p>
          </div>
        )}

      {/* ==============================
          COMMENTS LIST
      ============================== */}

      {!loading &&
        comments.length > 0 && (
          <div className="space-y-6">

            {comments.map((item) => {

              const commenterName =
                item.viewer?.name ||
                item.viewer?.email ||
                "User";

              const commenterImage =
                item.viewer?.image || "";

              const commenterId =
                item.viewer?._id ||
                item.viewer?.id;

              const isOwner =
                currentUserId &&
                commenterId &&
                currentUserId ===
                  commenterId;

              return (
                <div
                  key={item._id}
                  className="flex items-start gap-3"
                >

                  {/* AVATAR */}

                  <Avatar className="h-10 w-10 shrink-0">

                    {commenterImage && (
                      <AvatarImage
                        src={commenterImage}
                        alt={commenterName}
                      />
                    )}

                    <AvatarFallback>
                      {commenterName
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>

                  </Avatar>

                  {/* COMMENT */}

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <h4 className="font-semibold">
                        {commenterName}
                      </h4>

                      <span className="text-xs text-gray-500">
                        {new Date(
                          item.createdAt
                        ).toLocaleString()}
                      </span>

                    </div>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                      {item.comment}
                    </p>

                    {/* ACTIONS */}

                    <div className="mt-2 flex gap-2">

                      <Button
                        variant="ghost"
                        size="sm"
                      >
                        👍
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                      >
                        Reply
                      </Button>

                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDelete(
                              item._id
                            )
                          }
                        >
                          Delete
                        </Button>
                      )}

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

    </div>
  );
};

export default Comments;