import Link from "next/link";
import { useRouter } from "next/router";

type Video = {
  _id: string;
  videotitle?: string;
  title?: string;
  filename?: string;
  filepath?: string;
  videochanel?: string;
  channelname?: string;
  views?: number;
  createdAt?: string;
};

type VideoCardProps = {
  video: Video;
};

export default function VideoCard({ video }: VideoCardProps) {
  const router = useRouter();
  const videoUrl = video.filepath
    ? video.filepath.startsWith("http")
      ? video.filepath
      : `${(
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          "https://youtube-hiv1.onrender.com"
        ).replace(/\/$/, "")}/${video.filepath.replace(/^\/+/, "")}`
    : "";

  return (
    <div className="w-full">
      <button
        type="button"
        className="block aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-black text-left"
        aria-label={`Open ${video.videotitle || video.title || "video"}`}
        onClick={() => router.push(`/watch/${video._id}`)}
      >
        {videoUrl ? (
          <video
            src={videoUrl}
            className="h-full w-full object-cover"
            muted
            preload="metadata"
            tabIndex={-1}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white">
            No video
          </div>
        )}
      </button>

      <Link
        href={`/watch/${video._id}`}
        className="mt-3 flex gap-3"
      >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-300">
            {(
              video.videochanel ||
              video.channelname ||
              "B"
            ).charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 className="line-clamp-2 font-medium">
              {video.videotitle || video.title || "Untitled video"}
            </h3>

            <p className="text-sm text-gray-500">
              {video.videochanel || video.channelname || "Your Channel"}
            </p>

            <p className="text-sm text-gray-500">
              {video.views || 0} views
            </p>
          </div>
      </Link>
    </div>
  );
}