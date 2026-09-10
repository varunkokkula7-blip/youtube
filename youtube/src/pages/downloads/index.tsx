"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  FileVideo,
  HardDrive,
} from "lucide-react";

import { useUser } from "@/lib/AuthContext";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

type DownloadItem = {
  _id: string;

  videoId?: {
    _id: string;
    videotitle?: string;
    filepath?: string;
    thumbnail?: string;
    videochannel?: string;
    videochanel?: string;
  };

  videoTitle: string;

  thumbnail?: string;

  fileName?: string;

  fileSize?: number;

  subscriptionPlan: string;

  status: string;

  downloadedAt: string;
};

type DownloadInfo = {
  plan: string;

  dailyLimit: number;

  dailyUsed: number;

  dailyRemaining: number;

  monthlyLimit: number;

  monthlyUsed: number;

  monthlyRemaining: number;
};

export default function DownloadsPage() {
  const { user } = useUser();

  const [downloads, setDownloads] =
    useState<DownloadItem[]>([]);

  const [info, setInfo] =
    useState<DownloadInfo | null>(null);

  const [loading, setLoading] =
    useState(true);

  // ====================================================
  // USER ID
  // ====================================================

  const userId =
    user?._id || user?.id;

  // ====================================================
  // LOAD DATA
  // ====================================================

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadDownloads();
    loadDownloadInfo();
  }, [userId]);

  // ====================================================
  // LOAD DOWNLOADS
  // ====================================================

  const loadDownloads = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/download/user/${userId}`
      );

      const data = await response.json();

      if (data.success) {
        setDownloads(data.downloads || []);
      }
    } catch (error) {
      console.error(
        "Unable to load downloads:",
        error
      );
    }
  };

  // ====================================================
  // LOAD QUOTA
  // ====================================================

  const loadDownloadInfo = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/download/info/${userId}`
      );

      const data = await response.json();

      if (data.success) {
        setInfo(data);
      }
    } catch (error) {
      console.error(
        "Unable to load download information:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // FORMAT FILE SIZE
  // ====================================================

  const formatFileSize = (
    bytes = 0
  ) => {
    if (bytes === 0) {
      return "0 MB";
    }

    const mb =
      bytes / (1024 * 1024);

    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    }

    const gb = mb / 1024;

    return `${gb.toFixed(2)} GB`;
  };

  // ====================================================
  // FORMAT DATE
  // ====================================================

  const formatDate = (
    date: string
  ) => {
    return new Date(
      date
    ).toLocaleString();
  };

  // ====================================================
  // THUMBNAIL
  // ====================================================

  const getThumbnail = (
    item: DownloadItem
  ) => {
    if (item.thumbnail) {
      if (
        item.thumbnail.startsWith(
          "http"
        )
      ) {
        return item.thumbnail;
      }

      return `${BACKEND_URL}/uploads/${item.thumbnail
        .replace(/\\/g, "/")
        .replace(/^uploads\//, "")}`;
    }

    const filepath =
      item.videoId?.filepath;

    if (filepath) {
      const cleanPath =
        filepath
          .replace(/\\/g, "/")
          .replace(/^uploads\//, "");

      return `${BACKEND_URL}/uploads/${cleanPath}`;
    }

    return "";
  };

  // ====================================================
  // NOT LOGGED IN
  // ====================================================

  if (!userId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Download
            className="mx-auto mb-4"
            size={50}
          />

          <h1 className="text-2xl font-bold">
            Sign in to view downloads
          </h1>

          <p className="text-gray-400 mt-2">
            Your downloaded videos will
            appear here.
          </p>
        </div>
      </div>
    );
  }

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">
          Loading downloads...
        </p>
      </div>
    );
  }

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-8">

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="flex items-center gap-3 mb-8">

        <div className="bg-red-600 p-3 rounded-full">
          <Download size={28} />
        </div>

        <div>
          <h1 className="text-3xl font-bold">
            Downloads
          </h1>

          <p className="text-gray-400">
            Manage your downloaded videos
          </p>
        </div>

      </div>

      {/* ============================================== */}
      {/* QUOTA CARDS */}
      {/* ============================================== */}

      {info && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          {/* PLAN */}

          <div className="bg-[#181818] border border-gray-800 rounded-xl p-5">

            <p className="text-gray-400 text-sm">
              Subscription Plan
            </p>

            <h2 className="text-2xl font-bold mt-2">
              {info.plan}
            </h2>

            <p className="text-green-400 mt-2">
              Active
            </p>

          </div>

          {/* DAILY */}

          <div className="bg-[#181818] border border-gray-800 rounded-xl p-5">

            <p className="text-gray-400 text-sm">
              Daily Downloads
            </p>

            <h2 className="text-2xl font-bold mt-2">
              {info.dailyRemaining}
              <span className="text-gray-500 text-base">
                {" "}
                / {info.dailyLimit}
              </span>
            </h2>

            <div className="w-full bg-gray-700 h-2 rounded-full mt-4">

              <div
                className="bg-red-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    (info.dailyUsed /
                      info.dailyLimit) *
                      100,
                    100
                  )}%`,
                }}
              />

            </div>

            <p className="text-gray-400 text-sm mt-2">
              {info.dailyRemaining} remaining today
            </p>

          </div>

          {/* MONTHLY */}

          <div className="bg-[#181818] border border-gray-800 rounded-xl p-5">

            <p className="text-gray-400 text-sm">
              Monthly Downloads
            </p>

            <h2 className="text-2xl font-bold mt-2">
              {info.monthlyRemaining}
              <span className="text-gray-500 text-base">
                {" "}
                / {info.monthlyLimit}
              </span>
            </h2>

            <div className="w-full bg-gray-700 h-2 rounded-full mt-4">

              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    (info.monthlyUsed /
                      info.monthlyLimit) *
                      100,
                    100
                  )}%`,
                }}
              />

            </div>

            <p className="text-gray-400 text-sm mt-2">
              {info.monthlyRemaining} remaining this month
            </p>

          </div>

        </div>
      )}

      {/* ============================================== */}
      {/* DOWNLOAD LIST */}
      {/* ============================================== */}

      {downloads.length === 0 ? (
        <div className="bg-[#181818] border border-gray-800 rounded-xl p-12 text-center">

          <Download
            className="mx-auto text-gray-500"
            size={60}
          />

          <h2 className="text-xl font-semibold mt-4">
            No downloaded videos
          </h2>

          <p className="text-gray-400 mt-2">
            Videos you download will appear here.
          </p>

          <Link
            href="/"
            className="inline-block mt-6 bg-red-600 hover:bg-red-700 px-5 py-3 rounded-lg"
          >
            Browse Videos
          </Link>

        </div>
      ) : (
        <div>

          <h2 className="text-xl font-semibold mb-4">
            Download History
          </h2>

          <div className="space-y-4">

            {downloads.map(
              (item) => {

                const thumbnail =
                  getThumbnail(item);

                return (
                  <div
                    key={item._id}
                    className="bg-[#181818] border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row gap-5"
                  >

                    {/* THUMBNAIL */}

                    <Link
                      href={
                        item.videoId?._id
                          ? `/watch/${item.videoId._id}`
                          : "#"
                      }
                      className="w-full md:w-64 h-36 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0"
                    >

                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={
                            item.videoTitle
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileVideo
                            size={45}
                            className="text-gray-600"
                          />
                        </div>
                      )}

                    </Link>

                    {/* INFORMATION */}

                    <div className="flex-1">

                      <Link
                        href={
                          item.videoId?._id
                            ? `/watch/${item.videoId._id}`
                            : "#"
                        }
                      >
                        <h3 className="text-lg font-semibold hover:text-red-500">
                          {item.videoTitle ||
                            "Untitled Video"}
                        </h3>
                      </Link>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-400 mt-3">

                        <span className="flex items-center gap-1">
                          <HardDrive
                            size={16}
                          />
                          {formatFileSize(
                            item.fileSize
                          )}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock
                            size={16}
                          />
                          {formatDate(
                            item.downloadedAt
                          )}
                        </span>

                      </div>

                      {/* PLAN */}

                      <div className="mt-4">

                        <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                          Plan:{" "}
                          {item.subscriptionPlan}
                        </span>

                      </div>

                      {/* STATUS */}

                      <div className="mt-4">

                        {item.status ===
                        "success" ? (
                          <span className="text-green-400 flex items-center gap-2">
                            <CheckCircle
                              size={18}
                            />
                            Download completed
                          </span>
                        ) : (
                          <span className="text-yellow-400 flex items-center gap-2">
                            <AlertCircle
                              size={18}
                            />
                            {item.status}
                          </span>
                        )}

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>
      )}

    </div>
  );
}