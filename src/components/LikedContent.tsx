"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThumbsUp } from "lucide-react";

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

type LikedItem = {
  _id: string;
  videoId?: Video;
  videoid?: Video;
  createdAt?: string;
};

type ApiResponse = {
  success?: boolean;
  videos?: LikedItem[];
  data?: LikedItem[];
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

export default function LikedContent() {
  const { user } = useUser();

  const [likedVideos, setLikedVideos] = useState<LikedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = user?._id || user?.id || "";

  useEffect(() => {
    const loadLikedVideos = async () => {
      if (!userId) {
        setLikedVideos([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log("Loading liked videos for:", userId);

        // IMPORTANT:
        // Backend route is /like/user/:userId
        const result =
          await axiosInstance.get<ApiResponse>(
            `/like/user/${userId}`
          );

        console.log("Liked API response:", result);

        const data = Array.isArray(result.videos)
          ? result.videos
          : Array.isArray(result.data)
          ? result.data
          : [];

        setLikedVideos(data);
      } catch (error) {
        console.error(
          "Error loading liked videos:",
          error
        );

        setLikedVideos([]);
        setError("Unable to load liked videos.");
      } finally {
        setLoading(false);
      }
    };

    loadLikedVideos();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        Loading liked videos...
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

  if (likedVideos.length === 0) {
    return (
      <div className="p-6 text-center">
        <ThumbsUp className="mx-auto mb-4 h-16 w-16 text-gray-400" />

        <h2 className="mb-2 text-xl font-semibold">
          No liked videos yet
        </h2>

        <p className="text-gray-600">
          Videos you like will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center gap-3">
        <ThumbsUp className="h-7 w-7" />

        <div>
          <h1 className="text-2xl font-semibold">
            Liked videos
          </h1>

          <p className="text-sm text-gray-500">
            {likedVideos.length}{" "}
            {likedVideos.length === 1
              ? "video"
              : "videos"}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {likedVideos.map((item) => {
          const video = item.videoId || item.videoid;

          if (!video) return null;

          const videoUrl = getVideoUrl(video.filepath);

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
                <div className="h-36 w-64 overflow-hidden rounded-lg bg-black">
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

              <div className="min-w-0 pt-1">
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}