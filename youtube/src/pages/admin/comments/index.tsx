"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

type Report = {
  _id: string;

  reason: string;

  description?: string;

  status: string;

  createdAt: string;

  reporterId?: {
    _id: string;
    name?: string;
    email?: string;
  };

  commentId?: {
    _id: string;

    comment: string;

    createdAt: string;

    viewer?: {
      _id: string;
      name?: string;
      email?: string;
    };
  };
};

export default function AdminCommentsPage() {
  const { user } = useUser();

  const userId =
    user?._id ||
    user?.id ||
    "";

  const [reports, setReports] =
    useState<Report[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const getApiUrl = (
    path: string
  ) => {
    return `${BACKEND_URL.replace(
      /\/$/,
      ""
    )}${path}`;
  };

  const loadReports = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          getApiUrl(
            `/admin/comments/reports?userId=${encodeURIComponent(
              userId
            )}`
          ),
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Could not load reports."
        );
      }

      setReports(
        Array.isArray(data?.reports)
          ? data.reports
          : []
      );
    } catch (error) {
      console.error(
        "Admin reports error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Could not load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [userId]);

  const hideComment = async (
    commentId: string
  ) => {
    try {
      const response =
        await fetch(
          getApiUrl(
            `/admin/comments/comments/${commentId}/hide`
          ),
          {
            method: "PATCH",
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
            "Could not hide comment."
        );
      }

      alert(
        "Comment hidden successfully."
      );

      await loadReports();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not hide comment."
      );
    }
  };

  const removeComment = async (
    commentId: string
  ) => {
    const confirmed =
      window.confirm(
        "Remove this comment permanently from the visible comment list?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          getApiUrl(
            `/admin/comments/comments/${commentId}`
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
            "Could not remove comment."
        );
      }

      alert(
        "Comment removed successfully."
      );

      await loadReports();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not remove comment."
      );
    }
  };

  const markReviewed = async (
    reportId: string
  ) => {
    try {
      const response =
        await fetch(
          getApiUrl(
            `/admin/comments/reports/${reportId}/review`
          ),
          {
            method: "PATCH",
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
            "Could not update report."
        );
      }

      await loadReports();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not update report."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h1 className="text-xl font-bold text-red-600">
            Admin Access
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            Comment Moderation
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review reported comments.
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center">
            <p className="text-gray-500">
              No reported comments.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {reports.map(
              (report) => (
                <div
                  key={report._id}
                  className="rounded-xl border bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        Report reason:{" "}
                        <span className="capitalize">
                          {report.reason.replace(
                            "_",
                            " "
                          )}
                        </span>
                      </p>

                      <p className="text-xs text-gray-500">
                        Reported by:{" "}
                        {report.reporterId
                          ?.name ||
                          report.reporterId
                            ?.email ||
                          "Unknown user"}
                      </p>
                    </div>

                    <span
                      className={
                        report.status ===
                        "pending"
                          ? "rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700"
                          : "rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
                      }
                    >
                      {report.status}
                    </span>
                  </div>

                  <div className="mt-4 rounded-lg bg-gray-50 p-4">
                    <p className="text-sm font-semibold">
                      Comment
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                      {report.commentId
                        ?.comment ||
                        "Comment removed"}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      Comment author:{" "}
                      {report.commentId
                        ?.viewer?.name ||
                        report.commentId
                          ?.viewer?.email ||
                        "Unknown"}
                    </p>
                  </div>

                  {report.description && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold">
                        Report details
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {report.description}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {report.commentId && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            hideComment(
                              report
                                .commentId!
                                ._id
                            )
                          }
                          className="rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Hide Comment
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeComment(
                              report
                                .commentId!
                                ._id
                            )
                          }
                          className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Remove Comment
                        </button>
                      </>
                    )}

                    {report.status ===
                      "pending" && (
                      <button
                        type="button"
                        onClick={() =>
                          markReviewed(
                            report._id
                          )
                        }
                        className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold"
                      >
                        Mark Reviewed
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}