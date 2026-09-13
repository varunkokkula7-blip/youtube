"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Settings,
  Maximize,
  Minimize,
  PictureInPicture,
  Theater,
  Captions,
  RotateCcw,
  RotateCw,
  Loader2,
  X,
} from "lucide-react";

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  videoId?: string;
  userId?: string;
  nextVideoId?: string;
  nextVideoTitle?: string;
  onNext?: () => void;
  completionPercentage?: number;
}

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

export default function CustomVideoPlayer({
  src,
  poster,
  videoId,
  userId,
  nextVideoTitle = "Next video",
  onNext,
  completionPercentage = 90,
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);

  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const [speed, setSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const [fullscreen, setFullscreen] = useState(false);
  const [theater, setTheater] = useState(false);
  const [pip, setPip] = useState(false);

  const [captions, setCaptions] = useState(false);
  const [hasCaptions, setHasCaptions] = useState(false);

  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);

  const [showControls, setShowControls] = useState(true);

  const [previewTime, setPreviewTime] = useState<number | null>(null);
  const [previewLeft, setPreviewLeft] = useState(0);

  const [quality, setQuality] = useState("Auto");

  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const [completed, setCompleted] = useState(false);

  // --------------------------------------------------
  // Format time
  // --------------------------------------------------

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(
        secs
      ).padStart(2, "0")}`;
    }

    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  // --------------------------------------------------
  // Save progress
  // --------------------------------------------------

  const saveProgress = useCallback(() => {
    if (!videoId || !userId || !videoRef.current) return;

    const video = videoRef.current;

    if (!video.duration || !Number.isFinite(video.duration)) return;

    const progress = {
      userId,
      videoId,
      currentTime: video.currentTime,
      duration: video.duration,
      percentage:
        video.duration > 0
          ? (video.currentTime / video.duration) * 100
          : 0,
      completed:
        video.currentTime / video.duration >=
        completionPercentage / 100,
    };

    localStorage.setItem(
      `video-progress-${userId}-${videoId}`,
      JSON.stringify(progress)
    );

    /*
      If your backend has a progress endpoint,
      you can send this object there.

      Example:

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/history/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(progress),
      });
    */
  }, [videoId, userId, completionPercentage]);

  // --------------------------------------------------
  // Restore progress
  // --------------------------------------------------

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !videoId || !userId) return;

    const restore = () => {
      const saved = localStorage.getItem(
        `video-progress-${userId}-${videoId}`
      );

      if (!saved) return;

      try {
        const data = JSON.parse(saved);

        if (
          data.currentTime &&
          data.currentTime > 5 &&
          data.currentTime < video.duration - 2
        ) {
          video.currentTime = data.currentTime;
        }
      } catch (error) {
        console.error("Unable to restore video progress", error);
      }
    };

    video.addEventListener("loadedmetadata", restore);

    return () => {
      video.removeEventListener("loadedmetadata", restore);
    };
  }, [videoId, userId, src]);

  // --------------------------------------------------
  // Periodically save progress
  // --------------------------------------------------

  useEffect(() => {
    progressTimer.current = setInterval(() => {
      saveProgress();
    }, 5000);

    return () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
    };
  }, [saveProgress]);

  // --------------------------------------------------
  // Save when leaving page
  // --------------------------------------------------

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveProgress();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [saveProgress]);

  // --------------------------------------------------
  // Play / pause
  // --------------------------------------------------

  const togglePlay = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (error) {
      console.error("Playback error:", error);
    }
  };

  // --------------------------------------------------
  // Volume
  // --------------------------------------------------

  const handleVolume = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = Number(event.target.value);

    setVolume(value);
    setMuted(value === 0);

    if (videoRef.current) {
      videoRef.current.volume = value;
      videoRef.current.muted = value === 0;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.muted || video.volume === 0) {
      video.muted = false;
      video.volume = volume || 1;

      setMuted(false);
      setVolume(volume || 1);
    } else {
      video.muted = true;
      setMuted(true);
    }
  };

  // --------------------------------------------------
  // Seek
  // --------------------------------------------------

  const seek = (seconds: number) => {
    const video = videoRef.current;

    if (!video) return;

    video.currentTime = Math.max(
      0,
      Math.min(video.duration, video.currentTime + seconds)
    );
  };

  const handleTimelineClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const video = videoRef.current;

    if (!video || !duration) return;

    const rect = event.currentTarget.getBoundingClientRect();

    const percent =
      (event.clientX - rect.left) / rect.width;

    video.currentTime = percent * duration;
  };

  // --------------------------------------------------
  // Timeline hover preview
  // --------------------------------------------------

  const handleTimelineMove = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const percent =
      (event.clientX - rect.left) / rect.width;

    const time = percent * duration;

    setPreviewTime(time);

    setPreviewLeft(event.clientX - rect.left);

    if (previewRef.current && Number.isFinite(time)) {
      previewRef.current.currentTime = time;
    }
  };

  const handleTimelineLeave = () => {
    setPreviewTime(null);
  };

  // --------------------------------------------------
  // Playback speed
  // --------------------------------------------------

  const changeSpeed = (value: number) => {
    setSpeed(value);

    if (videoRef.current) {
      videoRef.current.playbackRate = value;
    }

    setShowSettings(false);
  };

  // --------------------------------------------------
  // Fullscreen
  // --------------------------------------------------

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
  }, []);

  // --------------------------------------------------
  // Theater
  // --------------------------------------------------

  const toggleTheater = () => {
    setTheater((value) => !value);
  };

  // --------------------------------------------------
  // Picture in Picture
  // --------------------------------------------------

  const togglePiP = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setPip(false);
      } else if (
        document.pictureInPictureEnabled &&
        !video.disablePictureInPicture
      ) {
        await video.requestPictureInPicture();
        setPip(true);
      }
    } catch (error) {
      console.error("PiP error:", error);
    }
  };

  // --------------------------------------------------
  // Captions
  // --------------------------------------------------

  const toggleCaptions = () => {
    const video = videoRef.current;

    if (!video) return;

    const tracks = video.textTracks;

    let enabled = false;

    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = captions ? "hidden" : "showing";

      if (!captions) enabled = true;
    }

    setCaptions(enabled);
  };

  // --------------------------------------------------
  // Buffer
  // --------------------------------------------------

  const updateBuffered = () => {
    const video = videoRef.current;

    if (!video || !video.duration) return;

    try {
      const bufferedEnd =
        video.buffered.length > 0
          ? video.buffered.end(video.buffered.length - 1)
          : 0;

      setBuffered((bufferedEnd / video.duration) * 100);
    } catch {
      setBuffered(0);
    }
  };

  // --------------------------------------------------
  // Quality information
  // --------------------------------------------------

  const updateQuality = () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.videoHeight >= 2160) {
      setQuality("2160p 4K");
    } else if (video.videoHeight >= 1440) {
      setQuality("1440p");
    } else if (video.videoHeight >= 1080) {
      setQuality("1080p");
    } else if (video.videoHeight >= 720) {
      setQuality("720p");
    } else if (video.videoHeight >= 480) {
      setQuality("480p");
    } else {
      setQuality("Auto");
    }
  };

  // --------------------------------------------------
  // Autoplay countdown
  // --------------------------------------------------

  const startCountdown = () => {
    if (!onNext) return;

    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
    }

    setCountdown(5);

    let count = 5;

    countdownTimer.current = setInterval(() => {
      count--;

      setCountdown(count);

      if (count <= 0) {
        if (countdownTimer.current) {
          clearInterval(countdownTimer.current);
          countdownTimer.current = null;
        }
        setCountdown(null);
        onNext();
      }
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    setCountdown(null);
  };

  useEffect(() => {
    return () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
      }
    };
  }, []);

  // --------------------------------------------------
  // Video ended
  // --------------------------------------------------

  const handleEnded = () => {
    setPlaying(false);

    if (videoId && userId) {
      localStorage.setItem(
        `video-completed-${userId}-${videoId}`,
        "true"
      );

      setCompleted(true);
    }

    startCountdown();
  };

  // --------------------------------------------------
  // Prevent multiple videos
  // --------------------------------------------------

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const pauseOtherVideos = () => {
      const videos =
        document.querySelectorAll("video");

      videos.forEach((otherVideo) => {
        if (otherVideo !== video) {
          otherVideo.pause();
        }
      });
    };

    video.addEventListener("play", pauseOtherVideos);

    return () => {
      video.removeEventListener(
        "play",
        pauseOtherVideos
      );
    };
  }, []);

  // --------------------------------------------------
  // Controls auto hide
  // --------------------------------------------------

  const showPlayerControls = () => {
    setShowControls(true);

    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }

    hideControlsTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, []);

  // --------------------------------------------------
  // Keyboard shortcuts
  // --------------------------------------------------

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA"
      ) {
        return;
      }

      const video = videoRef.current;

      if (!video) return;

      switch (event.key.toLowerCase()) {
        case " ":
        case "k":
          event.preventDefault();
          togglePlay();
          break;

        case "arrowleft":
          event.preventDefault();
          seek(event.shiftKey ? -30 : -10);
          break;

        case "arrowright":
          event.preventDefault();
          seek(event.shiftKey ? 30 : 10);
          break;

        case "arrowup":
          event.preventDefault();

          video.volume = Math.min(
            1,
            video.volume + 0.1
          );

          setVolume(video.volume);
          setMuted(false);
          break;

        case "arrowdown":
          event.preventDefault();

          video.volume = Math.max(
            0,
            video.volume - 0.1
          );

          setVolume(video.volume);

          if (video.volume === 0) {
            setMuted(true);
          }

          break;

        case "m":
          toggleMute();
          break;

        case "f":
          toggleFullscreen();
          break;

        case "t":
          toggleTheater();
          break;

        case "p":
          togglePiP();
          break;

        case "c":
          if (hasCaptions) {
            toggleCaptions();
          }
          break;

        case "n":
          if (onNext) {
            onNext();
          }
          break;

        case "escape":
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  });

  // --------------------------------------------------
  // Video events
  // --------------------------------------------------

  const handleLoadedMetadata = () => {
    const video = videoRef.current;

    if (!video) return;

    setDuration(video.duration);
    setLoading(false);

    setHasCaptions(video.textTracks.length > 0);

    updateQuality();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;

    if (!video) return;

    setCurrentTime(video.currentTime);

    updateBuffered();

    if (
      video.duration > 0 &&
      video.currentTime / video.duration >=
        completionPercentage / 100
    ) {
      setCompleted(true);
    }
  };

  // --------------------------------------------------
  // Progress percentages
  // --------------------------------------------------

  const progressPercentage =
    duration > 0
      ? (currentTime / duration) * 100
      : 0;

  const remainingTime = Math.max(
    0,
    duration - currentTime
  );

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black overflow-hidden ${
        theater
          ? "fixed inset-0 z-[9999] flex items-center justify-center"
          : "aspect-video rounded-xl"
      }`}
      onMouseMove={showPlayerControls}
      onMouseLeave={() => {
        if (playing) {
          setShowControls(false);
        }
      }}
    >
      {/* Main video */}

      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={updateBuffered}
        onPlay={() => {
          setPlaying(true);
          showPlayerControls();
        }}
        onPause={() => {
          setPlaying(false);
          setShowControls(true);
        }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setLoading(false)}
        onEnded={handleEnded}
        onLoadedData={() => {
          setLoading(false);
          updateQuality();
        }}
      />

      {/* Hidden preview video */}

      <video
        ref={previewRef}
        src={src}
        muted
        preload="metadata"
        className="pointer-events-none absolute bottom-14 left-1/2 z-10 hidden h-24 w-40 -translate-x-1/2 rounded border border-white/30 bg-black object-contain shadow-xl sm:block"
        style={{ display: previewTime === null ? "none" : "block" }}
      />

      {/* Loading */}

      {(loading || buffering) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-full bg-black/60 p-4">
            <Loader2
              size={35}
              className="animate-spin text-white"
            />
          </div>
        </div>
      )}

      {/* Big play button */}

      {!playing && !loading && (
        <button
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 p-5 text-white hover:bg-black/90"
        >
          <Play
            size={42}
            fill="currentColor"
          />
        </button>
      )}

      {/* Autoplay countdown */}

      {countdown !== null && (
        <div className="absolute right-5 top-5 w-72 rounded-xl bg-black/90 p-4 text-white shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">
              Up next
            </span>

            <button
              onClick={cancelCountdown}
              className="text-gray-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <p className="mb-3 text-sm text-gray-300">
            {nextVideoTitle}
          </p>

          <div className="mb-3 text-center text-3xl font-bold">
            {countdown}
          </div>

          <button
            onClick={cancelCountdown}
            className="w-full rounded-lg bg-white px-3 py-2 text-black"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Controls */}

      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300 ${
          showControls
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {/* Timeline */}

        <div
          className="relative mb-3 h-2 cursor-pointer rounded-full bg-white/30"
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMove}
          onMouseLeave={handleTimelineLeave}
        >
          {/* Buffered */}

          <div
            className="absolute left-0 top-0 h-full rounded-full bg-white/40"
            style={{
              width: `${buffered}%`,
            }}
          />

          {/* Playback */}

          <div
            className="absolute left-0 top-0 h-full rounded-full bg-red-600"
            style={{
              width: `${progressPercentage}%`,
            }}
          />

          {/* Preview */}

          {previewTime !== null && (
            <div
              className="absolute bottom-1 -translate-x-1/2 rounded bg-black/80 px-2 py-1 text-xs text-white"
              style={{
                left: previewLeft,
              }}
            >
              {formatTime(previewTime)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-white">
          {/* Play */}

          <button
            onClick={togglePlay}
            title="Play/Pause (Space/K)"
          >
            {playing ? (
              <Pause size={22} />
            ) : (
              <Play size={22} />
            )}
          </button>

          {/* Backward */}

          <button
            onClick={() => seek(-10)}
            title="Back 10 seconds"
          >
            <RotateCcw size={21} />
          </button>

          {/* Forward */}

          <button
            onClick={() => seek(10)}
            title="Forward 10 seconds"
          >
            <RotateCw size={21} />
          </button>

          {/* Volume */}

          <button
            onClick={toggleMute}
            title="Mute (M)"
          >
            {muted || volume === 0 ? (
              <VolumeX size={22} />
            ) : volume < 0.5 ? (
              <Volume1 size={22} />
            ) : (
              <Volume2 size={22} />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={handleVolume}
            className="w-20 cursor-pointer"
          />

          {/* Time */}

          <span className="whitespace-nowrap text-sm">
            {formatTime(currentTime)} /{" "}
            {formatTime(duration)}
          </span>

          <span className="text-xs text-gray-300">
            -{formatTime(remainingTime)}
          </span>

          <div className="flex-1" />

          {/* Quality */}

          <span className="hidden text-xs text-gray-300 sm:block">
            {quality}
          </span>

          {/* Captions */}

          {hasCaptions && (
            <button
              onClick={toggleCaptions}
              title="Subtitles (C)"
              className={
                captions ? "text-yellow-400" : ""
              }
            >
              <Captions size={21} />
            </button>
          )}

          {/* Theater */}

          <button
            onClick={toggleTheater}
            title="Theater mode (T)"
          >
            <Theater size={21} />
          </button>

          {/* PiP */}

          <button
            onClick={togglePiP}
            title="Picture in Picture (P)"
          >
            <PictureInPicture size={21} />
          </button>

          {/* Settings */}

          <div className="relative">
            <button
              onClick={() =>
                setShowSettings((value) => !value)
              }
              title="Settings"
            >
              <Settings size={21} />
            </button>

            {showSettings && (
              <div className="absolute bottom-9 right-0 w-40 rounded-lg bg-black/95 p-2 shadow-xl">
                <p className="px-2 py-1 text-xs text-gray-400">
                  Playback speed
                </p>

                {SPEEDS.map((item) => (
                  <button
                    key={item}
                    onClick={() =>
                      changeSpeed(item)
                    }
                    className={`block w-full rounded px-2 py-2 text-left text-sm hover:bg-white/10 ${
                      speed === item
                        ? "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {item}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}

          <button
            onClick={toggleFullscreen}
            title="Fullscreen (F)"
          >
            {fullscreen ? (
              <Minimize size={21} />
            ) : (
              <Maximize size={21} />
            )}
          </button>
        </div>
      </div>

      {/* Completed indicator */}

      {completed && (
        <div className="absolute left-4 top-4 rounded bg-green-600 px-3 py-1 text-xs text-white">
          ✓ Completed
        </div>
      )}
    </div>
  );
}