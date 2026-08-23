"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

type Video = {
  _id: string;
  videotitle: string;
  filename: string;
  filetype: string;
  filepath: string;
  filesize: string;
  videochanel: string;
  Like: number;
  views: number;
  uploader: string;
  createdAt: string;
};

type SearchResultProps = {
  query: string;
};

const SearchResult = ({
  query,
}: SearchResultProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!query.trim()) {
        setVideos([]);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          "http://localhost:5000/video/getall"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch videos"
          );
        }

        const data = await response.json();

        // Handle different possible backend response formats
        const allVideos: Video[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data.videos)
            ? data.videos
            : Array.isArray(data.data)
            ? data.data
            : [];

        const searchText =
          query.toLowerCase().trim();

        const results = allVideos.filter(
          (video) => {
            const title =
              video.videotitle
                ?.toLowerCase() || "";

            const channel =
              video.videochanel
                ?.toLowerCase() || "";

            const filename =
              video.filename
                ?.toLowerCase() || "";

            return (
              title.includes(searchText) ||
              channel.includes(searchText) ||
              filename.includes(searchText)
            );
          }
        );

        setVideos(results);
      } catch (error) {
        console.error(
          "Search error:",
          error
        );

        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [query]);

  /* ================= EMPTY SEARCH ================= */

  if (!query.trim()) {
    return (
      <div className="px-6 py-8">
        <p className="text-gray-600">
          Enter a search term to find videos
          and channels.
        </p>
      </div>
    );
  }

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <main className="w-full px-6 py-8">
        <h1 className="mb-6 text-xl font-medium text-gray-900">
          Search results for "{query}"
        </h1>

        <p className="text-gray-600">
          Searching videos...
        </p>
      </main>
    );
  }

  /* ================= SEARCH RESULTS ================= */

  return (
    <div className="w-full px-6 py-5">

      {/* SEARCH HEADING */}

      <h1 className="mb-6 text-xl font-medium text-gray-900">
        Search results for "{query}"
      </h1>

      {/* ================= NO RESULTS ================= */}

      {videos.length === 0 ? (
        <div className="py-16 text-center">

          <p className="text-lg text-gray-600">
            No results found
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Try different keywords or remove
            search filters
          </p>

        </div>
      ) : (

        /* ================= VIDEO LIST ================= */

        <div className="space-y-6">

          {videos.map((video) => {

            const cleanPath =
              video.filepath
                ?.replace(/\\/g, "/")
                .replace(/^uploads\//, "");

            const videoUrl =
              video.filepath?.startsWith(
                "http"
              )
                ? video.filepath
                : `http://localhost:5000/uploads/${encodeURI(
                    cleanPath || ""
                  )}`;

            return (
              <div
                key={video._id}
                className="flex w-full max-w-5xl gap-5"
              >

                {/* ================= THUMBNAIL ================= */}

                <Link
                  href={`/watch/${video._id}`}
                  className="group relative block h-[180px] w-[320px] flex-shrink-0 overflow-hidden rounded-xl bg-gray-200"
                >

                  <video
                    src={videoUrl}
                    muted
                    preload="metadata"
                    playsInline
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  />

                  {/* VIDEO DURATION */}

                  <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                    10:24
                  </span>

                </Link>

                {/* ================= INFORMATION ================= */}

                <div className="min-w-0 flex-1 py-1">

                  {/* TITLE */}

                  <Link
                    href={`/watch/${video._id}`}
                  >
                    <h2 className="mb-2 line-clamp-2 text-xl font-medium text-gray-900 hover:text-blue-600">
                      {video.videotitle}
                    </h2>
                  </Link>

                  {/* VIEWS + DATE */}

                  <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">

                    <span>
                      {Number(
                        video.views || 0
                      ).toLocaleString()}{" "}
                      views
                    </span>

                    <span>•</span>

                    <span>
                      {video.createdAt
                        ? formatDistanceToNow(
                            new Date(
                              video.createdAt
                            )
                          ) + " ago"
                        : "Recently"}
                    </span>

                  </div>

                  {/* CHANNEL */}

                  <Link
                    href={`/channel/${video.uploader}`}
                    className="mb-3 flex items-center gap-2 hover:text-blue-600"
                  >

                    <Avatar className="h-7 w-7">

                      <AvatarImage
                        src="/placeholder.svg"
                        alt={
                          video.videochanel
                        }
                      />

                      <AvatarFallback>
                        {(
                          video.videochanel ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>

                    </Avatar>

                    <span className="text-sm text-gray-600">
                      {video.videochanel}
                    </span>

                  </Link>

                  {/* DESCRIPTION */}

                  <p className="line-clamp-2 text-sm leading-5 text-gray-600">
                    Watch this video and
                    discover interesting
                    content from{" "}
                    {video.videochanel}.
                    Click the video to watch
                    the complete content.
                  </p>

                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* ================= RESULT COUNT ================= */}

      {videos.length > 0 && (
        <div className="max-w-5xl py-8 text-center">

          <p className="text-sm text-gray-500">
            Showing {videos.length} result
            {videos.length !== 1
              ? "s"
              : ""}{" "}
            for "{query}"
          </p>

        </div>
      )}

    </div>
  );
};

export default SearchResult;