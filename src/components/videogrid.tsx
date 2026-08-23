"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Video = {
  _id: string;
  videotitle: string;
  filename?: string;
  filetype?: string;
  filepath: string;
  filesize?: number;
  videochanel?: string;
  videochannel?: string;
  Like?: number;
  Dislike?: number;
  views?: number;
  uploader?: string;
  createdAt?: string;
  updatedAt?: string;
};

type VideoResponse = {
  success?: boolean;
  videos?: Video[];
};

export default function VideoGrid() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getVideos = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/video/getall"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch videos");
        }

        const data: VideoResponse =
          await response.json();

        console.log(
          "Videos from backend:",
          data
        );

        if (Array.isArray(data.videos)) {
          setVideos(data.videos);
        } else {
          setVideos([]);
        }
      } catch (error) {
        console.error(
          "Error loading videos:",
          error
        );

        setError(
          "Unable to load videos."
        );

        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    getVideos();
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">
          Loading videos...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          {error}
        </p>
      </div>
    );
  }

  // ==========================================
  // NO VIDEOS
  // ==========================================

  if (videos.length === 0) {
    return (
      <div className="p-6">
        <p className="text-gray-500">
          No videos found.
        </p>
      </div>
    );
  }

  // ==========================================
  // VIDEO GRID
  // ==========================================

  return (
    <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => {
        // ======================================
        // CLEAN FILE PATH
        // ======================================

        let cleanPath =
          video.filepath || "";

        // Windows \ -> /
        cleanPath = cleanPath.replace(
          /\\/g,
          "/"
        );

        // Remove "uploads/" if it already exists
        cleanPath = cleanPath.replace(
          /^uploads\//,
          ""
        );

        // Remove leading slash
        cleanPath = cleanPath.replace(
          /^\/+/,
          ""
        );

        // ======================================
        // VIDEO URL
        // ======================================

        const videoUrl = cleanPath
          ? `http://localhost:5000/uploads/${cleanPath
              .split("/")
              .map(encodeURIComponent)
              .join("/")}`
          : "";

        console.log(
          "Video:",
          video.videotitle
        );

        console.log(
          "File path:",
          video.filepath
        );

        console.log(
          "Video URL:",
          videoUrl
        );

        return (
          <Link
            key={video._id}
            href={`/watch/${video._id}`}
            className="block"
          >
            <div className="overflow-hidden rounded-xl bg-white shadow-md transition hover:shadow-lg">

              {/* ==================================
                  VIDEO PREVIEW
              ================================== */}

              <div className="bg-black">
                {videoUrl ? (
                  <video
                    className="h-48 w-full object-cover"
                    preload="metadata"
                    muted
                    playsInline
                    controls
                  >
                    <source
                      src={videoUrl}
                      type={
                        video.filetype ||
                        "video/mp4"
                      }
                    />

                    Your browser does not
                    support the video tag.
                  </video>
                ) : (
                  <div className="flex h-48 items-center justify-center text-white">
                    Video unavailable
                  </div>
                )}
              </div>

              {/* ==================================
                  VIDEO INFORMATION
              ================================== */}

              <div className="p-3">

                <h3 className="line-clamp-2 text-lg font-semibold text-black">
                  {video.videotitle ||
                    "Untitled video"}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {video.videochanel ||
                    video.videochannel ||
                    "Tech Channel"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {(video.views || 0).toLocaleString()}{" "}
                  views
                </p>

              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}