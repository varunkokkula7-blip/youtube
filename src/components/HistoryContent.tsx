"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

type Video = {
  _id: string;
  videotitle: string;
  filename?: string;
  filetype?: string;
  filepath?: string;
  videochanel?: string;
  videochannel?: string;
  Like?: number;
  Dislike?: number;
  views?: number;
  createdAt?: string;
};

type HistoryItem = {
  _id: string;
  createdAt: string;
  videoId?: Video;
  videoid?: Video;
};

type ApiResponse = {
  success?: boolean;
  history?: HistoryItem[];
  videos?: HistoryItem[];
  data?: HistoryItem[];
};

const BACKEND_URL = "http://localhost:5000";

function getVideoUrl(filepath?: string) {
  if (!filepath) return "";

  const cleanPath = filepath
    .replace(/\\/g, "/")
    .replace(/^uploads\//, "")
    .replace(/^\/+/, "");

  return `${BACKEND_URL}/uploads/${cleanPath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export default function HistoryContent() {
  const { user } = useUser();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = user?._id || user?.id || "";

  useEffect(() => {
    const loadHistory = async () => {
      if (!userId) {
        setHistory([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log(
          "Loading history for:",
          userId
        );

        const result =
          await axiosInstance.get<ApiResponse>(
            `/history/${userId}`
          );

        console.log(
          "History API response:",
          result
        );

        const data = Array.isArray(result.history)
          ? result.history
          : Array.isArray(result.videos)
          ? result.videos
          : Array.isArray(result.data)
          ? result.data
          : [];

        setHistory(data);
      } catch (error) {
        console.error(
          "Error loading history:",
          error
        );

        setHistory([]);
        setError(
          "Unable to load watch history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-6 text-center">
        <Clock className="mx-auto mb-4 h-16 w-16 text-gray-400" />

        <h2 className="mb-2 text-xl font-semibold">
          No watch history yet
        </h2>

        <p className="text-gray-600">
          Videos you watch will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Watch history
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {history.length}{" "}
          {history.length === 1
            ? "video"
            : "videos"}
        </p>
      </div>

      <div className="space-y-5">
        {history.map((item) => {
          const video =
            item.videoId || item.videoid;

          if (!video) return null;

          const videoUrl =
            getVideoUrl(video.filepath);

          const channel =
            video.videochanel ||
            video.videochannel ||
            "Tech Channel";

          return (
            <div
              key={item._id}
              className="flex gap-4"
            >
              <Link
                href={`/watch/${video._id}`}
                className="block w-64 shrink-0"
              >
                <div className="relative h-36 w-64 overflow-hidden rounded-lg bg-black">
                  {videoUrl ? (
                    <video
                      className="h-full w-full object-cover"
                      muted
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
                    </video>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-white">
                      Video unavailable
                    </div>
                  )}
                </div>
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/watch/${video._id}`}
                >
                  <h2 className="line-clamp-2 text-lg font-medium hover:text-blue-600">
                    {video.videotitle}
                  </h2>
                </Link>

                <p className="mt-2 text-sm text-gray-600">
                  {channel}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  {(video.views || 0).toLocaleString()} views
                </p>

                <p className="text-sm text-gray-600">
                  {video.createdAt
                    ? formatDistanceToNow(
                        new Date(
                          video.createdAt
                        ),
                        {
                          addSuffix: true,
                        }
                      )
                    : "Recently"}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Watched{" "}
                  {formatDistanceToNow(
                    new Date(item.createdAt),
                    {
                      addSuffix: true,
                    }
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}