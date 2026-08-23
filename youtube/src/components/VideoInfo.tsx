"use client";

import React, { useEffect, useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Share,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "./ui/button";
import {
  Avatar,
  AvatarFallback,
} from "./ui/avatar";

type VideoInfoProps = {
  video: {
    _id?: string;
    videotitle?: string;
    videochannel?: string;
    Like?: number;
    Dislike?: number;
    dislike?: number;
    views?: number;
    createdAt?: string;
    description?: string;
  };
};

const VideoInfo = ({ video }: VideoInfoProps) => {
  const [likes, setLikes] = useState(video.Like || 0);

  const [dislikes, setDislikes] = useState(
    video.Dislike ?? video.dislike ?? 0
  );

  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const [showFullDescription, setShowFullDescription] =
    useState(false);

  const [isSubscribed, setIsSubscribed] =
    useState(false);

  useEffect(() => {
    setLikes(video.Like || 0);

    setDislikes(
      video.Dislike ?? video.dislike ?? 0
    );

    setIsLiked(false);
    setIsDisliked(false);
    setShowFullDescription(false);
  }, [video]);

  // Like button
  const handleLike = () => {
    if (isLiked) {
      setLikes((previous) => previous - 1);
      setIsLiked(false);
      return;
    }

    setLikes((previous) => previous + 1);
    setIsLiked(true);

    if (isDisliked) {
      setDislikes((previous) => previous - 1);
      setIsDisliked(false);
    }
  };

  // Dislike button
  const handleDislike = () => {
    if (isDisliked) {
      setDislikes((previous) => previous - 1);
      setIsDisliked(false);
      return;
    }

    setDislikes((previous) => previous + 1);
    setIsDisliked(true);

    if (isLiked) {
      setLikes((previous) => previous - 1);
      setIsLiked(false);
    }
  };

  // Channel name
  const channelName =
    video.videochannel || "Tech Channel";

  // Channel initial
  const channelInitial =
    channelName.charAt(0).toUpperCase();

  // Uploaded date
  const uploadedDate = video.createdAt
    ? formatDistanceToNow(
        new Date(video.createdAt)
      )
    : "recently";

  return (
    <div className="w-full">
      {/* Video title */}
      <h1 className="text-xl font-semibold text-black">
        {video.videotitle || "Untitled Video"}
      </h1>

      {/* Channel + buttons */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Channel information */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {channelInitial}
            </AvatarFallback>
          </Avatar>

          {/* Channel name */}
          <div>
            <h3 className="font-medium">
              {channelName}
            </h3>

            <p className="text-sm text-gray-600">
              1.2M subscribers
            </p>
          </div>

          {/* Subscribe */}
          <Button
            className={`ml-2 rounded-full ${
              isSubscribed
                ? "bg-black text-white hover:bg-black/90"
                : "bg-gray-100 text-black hover:bg-gray-200"
            }`}
            onClick={() =>
              setIsSubscribed(
                (previous) => !previous
              )
            }
          >
            {isSubscribed
              ? "Subscribed"
              : "Subscribe"}
          </Button>
        </div>

        {/* Video actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Like */}
          <Button
            variant="ghost"
            onClick={handleLike}
            className={`rounded-full ${
              isLiked
                ? "bg-black text-white hover:bg-black/90"
                : "bg-gray-100"
            }`}
          >
            <ThumbsUp className="mr-2 h-5 w-5" />

            {likes.toLocaleString()}
          </Button>

          {/* Dislike */}
          <Button
            variant="ghost"
            onClick={handleDislike}
            className={`rounded-full ${
              isDisliked
                ? "bg-black text-white hover:bg-black/90"
                : "bg-gray-100"
            }`}
          >
            <ThumbsDown className="mr-2 h-5 w-5" />

            {dislikes.toLocaleString()}
          </Button>

          {/* Share */}
          <Button
            variant="ghost"
            className="rounded-full bg-gray-100"
          >
            <Share className="mr-2 h-5 w-5" />
            Share
          </Button>

          {/* Download */}
          <Button
            variant="ghost"
            className="rounded-full bg-gray-100"
          >
            <Download className="mr-2 h-5 w-5" />
            Download
          </Button>

          {/* More */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-gray-100"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Description */}
      <div className="mt-4 rounded-lg bg-gray-100 p-4">
        {/* Views and date */}
        <div className="mb-2 flex gap-4 text-sm font-medium">
          <span>
            {(video.views || 0).toLocaleString()} views
          </span>

          <span>
            {uploadedDate} ago
          </span>
        </div>

        {/* Description text */}
        <div
          className={`text-sm ${
            showFullDescription
              ? ""
              : "line-clamp-3"
          }`}
        >
          <p>
            {video.description ||
              "Sample video description. This would contain the actual video description from the database."}
          </p>
        </div>

        {/* Show more / less */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-auto p-0 font-medium"
          onClick={() =>
            setShowFullDescription(
              (previous) => !previous
            )
          }
        >
          {showFullDescription
            ? "Show less"
            : "Show more"}
        </Button>
      </div>
    </div>
  );
};

export default VideoInfo;