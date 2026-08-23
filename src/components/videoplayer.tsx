import React from "react";

type VideoPlayerProps = {
  src: string;
};

export default function VideoPlayer({ src }: VideoPlayerProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-black">
      <video
        src={src}
        controls
        className="w-full"
        playsInline
      >
        Your browser does not support the video player.
      </video>
    </div>
  );
}