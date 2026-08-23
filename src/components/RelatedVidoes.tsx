import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import React from "react";

const vid = "/video/vdo.mp4";

const RelatedVideos = ({ videos }: any) => {
  const thumbnailMap: Record<string, string> = {
    "1": "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=800&q=80",
    "2": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
  };

  return (
    <div className="space-y-4">
      {videos.map((video: any) => (
        <Link
          key={video._id}
          href={`/watch/${video._id}`}
          className="flex items-start gap-3 rounded-xl p-1 transition hover:bg-zinc-100"
        >
          <div className="h-[104px] w-[180px] overflow-hidden rounded-xl bg-zinc-200 shadow-sm">
            <img
              src={thumbnailMap[video._id] ?? "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80"}
              alt={video.videotitle}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <h3 className="line-clamp-2 text-base font-medium leading-5 text-zinc-900">
              {video.videotitle}
            </h3>
            <p className="mt-1 text-sm text-zinc-600">{video.videochannel}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {video.views?.toLocaleString() ?? "0"} views · {formatDistanceToNow(new Date(video.createdAt))}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RelatedVideos;