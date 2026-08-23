import VideoCard from "@/components/videocard";

type ChannelVideo = {
  _id: string;
  videotitle: string;
  filename?: string;
  filetype?: string;
  filepath?: string;
  filesize?: string;
  videochannel?: string;
  videochanel?: string;
  Like?: number;
  views?: number;
  uploader?: string;
  createdAt?: string;
};

type ChannelVideosProps = {
  videos: ChannelVideo[];
};

export default function ChannelVideos({
  videos,
}: ChannelVideosProps) {
  return (
    <section className="w-full">
      {/* Videos heading */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-black">
          Videos
        </h2>

        <span className="text-sm text-gray-500">
          {videos.length} videos
        </span>
      </div>

      {/* No videos */}
      {videos.length === 0 ? (
        <div className="rounded-lg border border-gray-200 py-12 text-center">
          <p className="text-gray-500">
            No videos uploaded yet.
          </p>
        </div>
      ) : (
        /* Video grid */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
            />
          ))}
        </div>
      )}
    </section>
  );
}