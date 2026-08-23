"use client";

import React, { useState } from "react";

type VideoUploaderProps = {
  onUploadSuccess?: () => void;
};

const VideoUploader = ({
  onUploadSuccess,
}: VideoUploaderProps) => {

  const [file, setFile] =
    useState<File | null>(null);

  const [title, setTitle] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================
  // SELECT FILE
  // ==========================================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    const selectedFile =
      event.target.files?.[0];

    setError("");
    setSuccess("");
    setProgress(0);

    if (!selectedFile) {
      return;
    }

    if (
      selectedFile.type !==
      "video/mp4"
    ) {
      setError(
        "Please select an MP4 video file."
      );

      return;
    }

    if (
      selectedFile.size >
      100 * 1024 * 1024
    ) {
      setError(
        "Video must be less than 100MB."
      );

      return;
    }

    setFile(selectedFile);
  };


  // ==========================================
  // UPLOAD
  // ==========================================

  const handleUpload = async () => {

    setError("");
    setSuccess("");

    if (!file) {
      setError(
        "Please select a video first."
      );

      return;
    }

    if (!title.trim()) {
      setError(
        "Please enter a video title."
      );

      return;
    }

    try {

      setUploading(true);
      setProgress(10);

      const formData = new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "videotitle",
        title
      );

      formData.append(
        "videochanel",
        "Tech Channel"
      );

      formData.append(
        "uploader",
        "tech_creator"
      );


      const xhr = new XMLHttpRequest();

      xhr.open(
        "POST",
        "http://localhost:5000/video/upload"
      );


      // ======================================
      // PROGRESS
      // ======================================

      xhr.upload.onprogress = (
        event
      ) => {

        if (event.lengthComputable) {

          const percent =
            Math.round(
              (event.loaded /
                event.total) *
                100
            );

          setProgress(percent);
        }
      };


      // ======================================
      // RESPONSE
      // ======================================

      xhr.onload = () => {

        setUploading(false);

        let response;

        try {

          response =
            JSON.parse(xhr.responseText);

        } catch {

          setError(
            "Server returned an invalid response."
          );

          return;
        }


        if (
          xhr.status >= 200 &&
          xhr.status < 300
        ) {

          setProgress(100);

          setSuccess(
            "Video uploaded successfully!"
          );

          setFile(null);
          setTitle("");

          onUploadSuccess?.();

        } else {

          setError(
            response?.message ||
              "Upload failed."
          );
        }
      };


      // ======================================
      // NETWORK ERROR
      // ======================================

      xhr.onerror = () => {

        setUploading(false);

        setError(
          "Could not connect to the backend server."
        );
      };


      xhr.send(formData);

    } catch (error) {

      console.error(
        "Upload error:",
        error
      );

      setUploading(false);

      setError(
        "Something went wrong while uploading."
      );
    }
  };


  return (
    <div className="w-full">

      <h2 className="mb-3 text-lg font-semibold">
        Upload a video
      </h2>


      {/* ======================================
          FILE SELECT
      ====================================== */}

      <div className="rounded-lg border bg-white p-4">

        <input
          type="file"
          accept="video/mp4"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm"
        />


        {/* ====================================
            FILE INFORMATION
        ==================================== */}

        {file && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3">

            <p className="font-medium">
              {file.name}
            </p>

            <p className="text-sm text-gray-500">
              {(
                file.size /
                (1024 * 1024)
              ).toFixed(2)}{" "}
              MB
            </p>

          </div>
        )}


        {/* ====================================
            TITLE
        ==================================== */}

        <div className="mt-4">

          <label className="mb-2 block text-sm font-medium">
            Title (required)
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            disabled={uploading}
            placeholder="Enter video title"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-black"
          />

        </div>


        {/* ====================================
            ERROR
        ==================================== */}

        {error && (
          <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-600">
            {error}
          </p>
        )}


        {/* ====================================
            SUCCESS
        ==================================== */}

        {success && (
          <p className="mt-3 rounded bg-green-50 p-2 text-sm text-green-600">
            {success}
          </p>
        )}


        {/* ====================================
            PROGRESS
        ==================================== */}

        {uploading && (
          <div className="mt-4">

            <div className="mb-1 flex justify-between text-sm">

              <span>
                Uploading...
              </span>

              <span>
                {progress}%
              </span>

            </div>

            <div className="h-2 w-full rounded-full bg-gray-200">

              <div
                className="h-2 rounded-full bg-black transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

          </div>
        )}


        {/* ====================================
            BUTTON
        ==================================== */}

        <div className="mt-4 flex justify-end">

          <button
            onClick={handleUpload}
            disabled={
              uploading ||
              !file ||
              !title.trim()
            }
            className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading
              ? "Uploading..."
              : "Upload"}
          </button>

        </div>

      </div>

    </div>
  );
};

export default VideoUploader;