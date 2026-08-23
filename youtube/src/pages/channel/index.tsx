"use client";

import React from "react";
import VideoUploader from "../../components/VideoUploader";
import VideoGrid from "../../components/videogrid";

export default function ChannelPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* =====================================================
          CHANNEL BANNER
      ===================================================== */}
      <div className="h-[180px] w-full bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500" />

      {/* =====================================================
          CHANNEL INFORMATION
      ===================================================== */}
      <div className="px-8 pt-6">
        <div className="flex items-start gap-5">

          {/* CHANNEL AVATAR */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gray-200 text-3xl font-semibold">
            T
          </div>

          {/* CHANNEL DETAILS */}
          <div className="flex-1">

            <h1 className="text-3xl font-bold">
              Tech Channel
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              @techchannel
            </p>

            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Welcome to our tech channel! We cover the latest
              technology, reviews, and tutorials.
            </p>

            <p className="mt-2 text-sm text-gray-600">
              1.25K subscribers
            </p>

            {/* SUBSCRIBE */}
            <button
              type="button"
              className="mt-4 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Subscribe
            </button>

          </div>
        </div>
      </div>

      {/* =====================================================
          CHANNEL TABS
      ===================================================== */}
      <div className="mt-6 border-b">
        <div className="flex gap-8 px-8">

          <button
            type="button"
            className="border-b-2 border-black px-1 py-4 text-sm font-semibold"
          >
            Home
          </button>

          <button
            type="button"
            className="px-1 py-4 text-sm text-gray-600 hover:text-black"
          >
            Videos
          </button>

          <button
            type="button"
            className="px-1 py-4 text-sm text-gray-600 hover:text-black"
          >
            Shorts
          </button>

          <button
            type="button"
            className="px-1 py-4 text-sm text-gray-600 hover:text-black"
          >
            Playlists
          </button>

          <button
            type="button"
            className="px-1 py-4 text-sm text-gray-600 hover:text-black"
          >
            Community
          </button>

          <button
            type="button"
            className="px-1 py-4 text-sm text-gray-600 hover:text-black"
          >
            About
          </button>

        </div>
      </div>

      {/* =====================================================
          UPLOAD VIDEO
      ===================================================== */}
      <div className="px-8 pt-5">

        <h2 className="mb-3 text-lg font-semibold">
          Upload a video
        </h2>

        <VideoUploader />

      </div>

      {/* =====================================================
          VIDEOS
      ===================================================== */}
      <div className="px-8 py-6">

        <h2 className="mb-5 text-lg font-semibold">
          Videos
        </h2>

        <VideoGrid />

      </div>

    </div>
  );
}