import Link from "next/link";

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
  const videoUrl = video.filepath
    ? video.filepath.startsWith("http")
      ? video.filepath
      : `http://localhost:5000/${video.filepath.replace(/^\/+/, "")}`
    : "";

  return (
    <Link href={`/watch/${video._id}`} className="block">
      <div className="w-full cursor-pointer">
        <div className="aspect-video overflow-hidden rounded-xl bg-black">
          {videoUrl ? (
            <video
              src={videoUrl}
              className="h-full w-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white">
              No video
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-3">
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
        </div>
      </div>
    </Link>
  );
}