"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/router";

import { io, Socket } from "socket.io-client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  Hand,
  MessageCircle,
  Users,
  Copy,
  Send,
  Settings,
  Shield,
  Lock,
  Unlock,
  UserMinus,
  Volume2,
  VolumeX,
  Camera,
  Smile,
  Upload,
  Circle,
  Square,
} from "lucide-react";

import { useUser } from "@/lib/AuthContext";

interface Participant {
  socketId: string;
  userId?: string;
  name: string;
  image?: string | null;

  mic: boolean;
  camera: boolean;
  speaking: boolean;
  handRaised: boolean;

  coHost: boolean;

  canShareScreen: boolean;
  canChat: boolean;
}

interface ChatMessage {
  id: string;
  socketId: string;
  name: string;
  message: string;
  timestamp: number;
}

interface PeerMap {
  [socketId: string]: RTCPeerConnection;
}

export default function VideoCallPage() {
  const router = useRouter();

  const { roomId } = router.query;

  const { user } = useUser();

  const socketRef =
    useRef<Socket | null>(null);

  const localVideoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const localStreamRef =
    useRef<MediaStream | null>(null);

  const peersRef =
    useRef<PeerMap>({});

  const remoteVideoRefs =
    useRef<
      Record<
        string,
        HTMLVideoElement | null
      >
    >({});

  const audioContextRef =
    useRef<AudioContext | null>(null);

  const analyserRef =
    useRef<AnalyserNode | null>(null);

  const [participants, setParticipants] =
    useState<Participant[]>([]);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [messageText, setMessageText] =
    useState("");

  const [showParticipants, setShowParticipants] =
    useState(false);

  const [showChat, setShowChat] =
    useState(false);

  const [showHostControls, setShowHostControls] =
    useState(false);

  const [muted, setMuted] =
    useState(false);

  const [cameraOff, setCameraOff] =
    useState(false);

  const [handRaised, setHandRaised] =
    useState(false);

  const [screenSharing, setScreenSharing] =
    useState(false);

  const [locked, setLocked] =
    useState(false);

  const [callSeconds, setCallSeconds] =
    useState(0);

  const [connectionQuality, setConnectionQuality] =
    useState("Good");

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [canShareScreen, setCanShareScreen] =
    useState(true);

  const [canChat, setCanChat] =
    useState(true);

  const [recording, setRecording] =
    useState(false);

  const recorderRef =
    useRef<MediaRecorder | null>(
      null
    );

  const recordedChunksRef =
    useRef<Blob[]>([]);

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "https://youtube-hiv1.onrender.com";

  // ==========================================
  // CURRENT USER
  // ==========================================

  const currentUser = {
    id:
      (user as any)?._id ||
      (user as any)?.id ||
      undefined,

    name:
      (user as any)?.name ||
      (user as any)?.channelname ||
      "User",

    image:
      (user as any)?.image ||
      null,
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatDuration = (
    seconds: number
  ) => {
    const hours = Math.floor(
      seconds / 3600
    );

    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(
        minutes
      ).padStart(2, "0")}:${String(
        secs
      ).padStart(2, "0")}`;
    }

    return `${minutes}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  // ==========================================
  // CREATE PEER
  // ==========================================

  const createPeer = (
    targetId: string
  ) => {
    const peer =
      new RTCPeerConnection({
        iceServers: [
          {
            urls:
              "stun:stun.l.google.com:19302",
          },
        ],

        // Helps browser adapt to network conditions
        bundlePolicy: "max-bundle",
      });

    const stream =
      localStreamRef.current;

    if (stream) {
      stream
        .getTracks()
        .forEach((track) => {
          peer.addTrack(
            track,
            stream
          );
        });
    }

    peer.onicecandidate = (
      event
    ) => {
      if (
        event.candidate &&
        socketRef.current
      ) {
        socketRef.current.emit(
          "signal",
          {
            target: targetId,

            signal: {
              type: "candidate",

              candidate:
                event.candidate,
            },
          }
        );
      }
    };

    peer.ontrack = (
      event
    ) => {
      const video =
        remoteVideoRefs.current[
          targetId
        ];

      if (
        video &&
        event.streams[0]
      ) {
        video.srcObject =
          event.streams[0];
      }
    };

    peer.onconnectionstatechange =
      () => {
        if (
          peer.connectionState ===
            "failed" ||
          peer.connectionState ===
            "disconnected"
        ) {
          peer.restartIce?.();
        }
      };

    peersRef.current[targetId] =
      peer;

    return peer;
  };

  // ==========================================
  // CREATE OFFER
  // ==========================================

  const createOffer = async (
    targetId: string
  ) => {
    let peer =
      peersRef.current[targetId];

    if (!peer) {
      peer = createPeer(targetId);
    }

    const offer =
      await peer.createOffer();

    await peer.setLocalDescription(
      offer
    );

    socketRef.current?.emit(
      "signal",
      {
        target: targetId,

        signal: {
          type: "offer",
          sdp: offer,
        },
      }
    );
  };

  // ==========================================
  // HANDLE SIGNAL
  // ==========================================

  const handleSignal = async ({
    sender,
    signal,
  }: any) => {
    let peer =
      peersRef.current[sender];

    if (!peer) {
      peer = createPeer(sender);
    }

    if (
      signal.type ===
      "offer"
    ) {
      await peer.setRemoteDescription(
        new RTCSessionDescription(
          signal.sdp
        )
      );

      const answer =
        await peer.createAnswer();

      await peer.setLocalDescription(
        answer
      );

      socketRef.current?.emit(
        "signal",
        {
          target: sender,

          signal: {
            type: "answer",
            sdp: answer,
          },
        }
      );
    }

    if (
      signal.type ===
      "answer"
    ) {
      await peer.setRemoteDescription(
        new RTCSessionDescription(
          signal.sdp
        )
      );
    }

    if (
      signal.type ===
      "candidate"
    ) {
      try {
        await peer.addIceCandidate(
          new RTCIceCandidate(
            signal.candidate
          )
        );
      } catch (e) {
        console.log(
          "ICE error",
          e
        );
      }
    }
  };

  // ==========================================
  // START CAMERA / MICROPHONE
  // ==========================================

  useEffect(() => {
    if (
      !roomId ||
      typeof roomId !== "string"
    ) {
      return;
    }

    let active = true;

    const start = async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },

              video: {
                width: {
                  ideal: 1280,
                },

                height: {
                  ideal: 720,
                },

                frameRate: {
                  ideal: 30,
                },
              },
            }
          );

        if (!active) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        localStreamRef.current =
          stream;

        if (
          localVideoRef.current
        ) {
          localVideoRef.current.srcObject =
            stream;
        }

        const socket =
          io(BACKEND_URL, {
            transports: [
              "websocket",
              "polling",
            ],

            reconnection: true,

            reconnectionAttempts: Infinity,

            reconnectionDelay: 1000,
          });

        socketRef.current =
          socket;

        socket.on(
          "connect",
          () => {
            socket.emit(
              "join-room",
              {
                roomId,

                user: {
                  id: currentUser.id,
                  name: currentUser.name,
                  image: currentUser.image,
                },
              }
            );
          }
        );

        // Existing users
        socket.on(
          "existing-users",
          async (
            users: Participant[]
          ) => {
            setParticipants(
              users
            );

            for (
              const participant of users
            ) {
              await createOffer(
                participant.socketId
              );
            }
          }
        );

        // New participant
        socket.on(
          "user-joined",
          ({
            participant,
          }) => {
            setParticipants(
              (current) => {
                const exists =
                  current.some(
                    (p) =>
                      p.socketId ===
                      participant.socketId
                  );

                if (exists) {
                  return current;
                }

                return [
                  ...current,
                  participant,
                ];
              }
            );
          }
        );

        // Signaling
        socket.on(
          "signal",
          handleSignal
        );

        // Room state
        socket.on(
          "room-state",
          ({
            hostId,
            locked,
            participants,
          }) => {
            setParticipants(
              participants
            );

            setLocked(
              locked
            );

            setIsHost(
              hostId === socket.id
            );
          }
        );

        // User leaves
        socket.on(
          "user-left",
          ({
            socketId,
          }) => {
            const peer =
              peersRef.current[
                socketId
              ];

            if (peer) {
              peer.close();

              delete peersRef.current[
                socketId
              ];
            }

            delete remoteVideoRefs
              .current[socketId];

            setParticipants(
              (current) =>
                current.filter(
                  (p) =>
                    p.socketId !==
                    socketId
                )
            );
          }
        );

        // Chat
        socket.on(
          "chat-message",
          (
            message: ChatMessage
          ) => {
            setMessages(
              (current) => [
                ...current,
                message,
              ]
            );
          }
        );

        // Speaking
        socket.on(
          "participant-speaking",
          ({
            socketId,
            speaking,
          }) => {
            setParticipants(
              (current) =>
                current.map(
                  (p) =>
                    p.socketId ===
                    socketId
                      ? {
                          ...p,
                          speaking,
                        }
                      : p
                )
            );
          }
        );

        // Host actions
        socket.on(
          "host-action",
          ({
            action,
          }) => {
            if (
              action ===
              "force-mute"
            ) {
              muteLocal(true);
            }

            if (
              action ===
              "removed"
            ) {
              alert(
                "You were removed from the meeting."
              );

              router.push("/");
            }
          }
        );

        // Permissions
        socket.on(
          "permission-update",
          ({
            canShareScreen,
            canChat,
          }) => {
            if (
              typeof canShareScreen ===
              "boolean"
            ) {
              setCanShareScreen(
                canShareScreen
              );
            }

            if (
              typeof canChat ===
              "boolean"
            ) {
              setCanChat(
                canChat
              );
            }
          }
        );

        // Reconnect
        socket.on(
          "reconnect",
          () => {
            socket.emit(
              "reconnect-room",
              {
                roomId,

                user: {
                  id: currentUser.id,
                  name: currentUser.name,
                  image: currentUser.image,
                },
              }
            );
          }
        );

        socket.on(
          "join-denied",
          ({
            reason,
          }) => {
            setError(
              reason
            );
          }
        );
      } catch (err) {
        console.error(err);

        setError(
          "Camera or microphone permission was denied. Please allow access and refresh the page."
        );
      }
    };

    start();

    return () => {
      active = false;

      Object.values(
        peersRef.current
      ).forEach((peer) =>
        peer.close()
      );

      peersRef.current = {};

      localStreamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      socketRef.current?.emit(
        "leave-room",
        {
          roomId,
        }
      );

      socketRef.current?.disconnect();
    };
  }, [roomId]);

  // ==========================================
  // HOST
  // ==========================================

  const [isHost, setIsHost] =
    useState(false);

  // ==========================================
  // CALL TIMER
  // ==========================================

  useEffect(() => {
    const timer =
      setInterval(() => {
        setCallSeconds(
          (seconds) =>
            seconds + 1
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, []);

  // ==========================================
  // MUTE
  // ==========================================

  const muteLocal = (
    force = false
  ) => {
    const stream =
      localStreamRef.current;

    if (!stream) return;

    const nextMuted = force
      ? true
      : !muted;

    stream
      .getAudioTracks()
      .forEach(
        (track) => {
          track.enabled =
            !nextMuted;
        }
      );

    setMuted(
      nextMuted
    );

    socketRef.current?.emit(
      "media-status",
      {
        roomId,

        mic:
          !nextMuted,

        camera:
          !cameraOff,
      }
    );
  };

  // ==========================================
  // CAMERA
  // ==========================================

  const toggleCamera = () => {
    const next =
      !cameraOff;

    setCameraOff(
      !next
    );

    localStreamRef.current
      ?.getVideoTracks()
      .forEach(
        (track) => {
          track.enabled =
            next;
        }
      );

    socketRef.current?.emit(
      "media-status",
      {
        roomId,

        mic:
          !muted,

        camera:
          next,
      }
    );
  };

  // ==========================================
  // SWITCH FRONT / REAR CAMERA
  // ==========================================

  const switchCamera = async () => {
    try {
      const stream = localStreamRef.current;

      if (!stream) return;

      const currentTrack =
        stream.getVideoTracks()[0];

      const currentFacing =
        currentTrack?.getSettings()
          ?.facingMode;

      const newFacing =
        currentFacing ===
        "environment"
          ? "user"
          : "environment";

      const newStream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              facingMode: newFacing,
            },

            audio: false,
          }
        );

      const newTrack =
        newStream.getVideoTracks()[0];

      const oldTrack =
        stream.getVideoTracks()[0];

      if (oldTrack) {
        stream.removeTrack(oldTrack);

        oldTrack.stop();
      }

      stream.addTrack(newTrack);

      if (
        localVideoRef.current
      ) {
        localVideoRef.current.srcObject =
          stream;
      }

      // Replace track in every connection
      Object.values(
        peersRef.current
      ).forEach((peer) => {
        const sender =
          peer
            .getSenders()
            .find(
              (item) =>
                item.track?.kind ===
                "video"
            );

        if (sender) {
          sender.replaceTrack(
            newTrack
          );
        }
      });
    } catch (error) {
      console.error(
        "Camera switching failed:",
        error
      );
    }
  };

  // ==========================================
  // SCREEN SHARE
  // ==========================================

  const shareScreen = async () => {
    if (!canShareScreen) {
      alert(
        "The host has disabled screen sharing."
      );

      return;
    }

    try {
      if (screenSharing) {
        await stopScreenShare();

        return;
      }

      const screenStream =
        await navigator.mediaDevices.getDisplayMedia(
          {
            video: true,
          }
        );

      const screenTrack =
        screenStream.getVideoTracks()[0];

      Object.values(
        peersRef.current
      ).forEach((peer) => {
        const sender =
          peer
            .getSenders()
            .find(
              (item) =>
                item.track?.kind ===
                "video"
            );

        if (sender) {
          sender.replaceTrack(
            screenTrack
          );
        }
      });

      if (
        localVideoRef.current
      ) {
        localVideoRef.current.srcObject =
          screenStream;
      }

      setScreenSharing(
        true
      );

      socketRef.current?.emit(
        "screen-status",
        {
          roomId,
          sharing: true,
        }
      );

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error(
        "Screen share error:",
        error
      );
    }
  };

  // ==========================================
  // STOP SCREEN SHARE
  // ==========================================

  const stopScreenShare = async () => {
    const cameraTrack =
      localStreamRef.current
        ?.getVideoTracks()[0];

    if (!cameraTrack) return;

    Object.values(
      peersRef.current
    ).forEach((peer) => {
      const sender =
        peer
          .getSenders()
          .find(
            (item) =>
              item.track?.kind ===
              "video"
          );

      if (sender) {
        sender.replaceTrack(
          cameraTrack
        );
      }
    });

    if (
      localVideoRef.current &&
      localStreamRef.current
    ) {
      localVideoRef.current.srcObject =
        localStreamRef.current;
    }

    setScreenSharing(
      false
    );

    socketRef.current?.emit(
      "screen-status",
      {
        roomId,
        sharing: false,
      }
    );
  };

  // ==========================================
  // RAISE HAND
  // ==========================================

  const toggleHand = () => {
    const next =
      !handRaised;

    setHandRaised(next);

    socketRef.current?.emit(
      "raise-hand",
      {
        roomId,
        raised: next,
      }
    );
  };

  // ==========================================
  // CHAT
  // ==========================================

  const sendMessage = () => {
    if (
      !messageText.trim() ||
      !canChat
    ) {
      return;
    }

    socketRef.current?.emit(
      "chat-message",
      {
        roomId,

        message:
          messageText.trim(),
      }
    );

    setMessageText("");
  };

  // ==========================================
  // EMOJI
  // ==========================================

  const addEmoji = (
    emoji: string
  ) => {
    setMessageText(
      (current) =>
        current + emoji
    );
  };

  // ==========================================
  // FILE SHARE
  // ==========================================

  const shareFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    // Keep Socket.IO file transfer reasonable
    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "Please select a file smaller than 5 MB."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      const data =
        reader.result;

      socketRef.current?.emit(
        "chat-message",
        {
          roomId,

          message: `📎 ${file.name}\n${data}`,
        }
      );
    };

    reader.readAsDataURL(file);
  };

  // ==========================================
  // COPY LINK
  // ==========================================

  const copyMeetingLink =
    async () => {
      await navigator.clipboard.writeText(
        window.location.href
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    };

  // ==========================================
  // HOST ACTION
  // ==========================================

  const hostAction = (
    action: string,
    targetId?: string,
    value?: boolean
  ) => {
    if (!isHost) return;

    socketRef.current?.emit(
      "host-action",
      {
        roomId,
        action,
        targetId,
        value,
      }
    );
  };

  const setRoomPermission = (
    action: "screen-permission" | "chat-permission",
    value: boolean
  ) => {
    if (!isHost) return;

    participants.forEach((participant) => {
      hostAction(action, participant.socketId, value);
    });

    if (action === "screen-permission") {
      setCanShareScreen(value);
    } else {
      setCanChat(value);
    }
  };

  // ==========================================
  // RECORDING
  // ==========================================

  const startRecording =
    () => {
      const stream =
        localStreamRef.current;

      if (!stream) return;

      try {
        const recorder =
          new MediaRecorder(
            stream
          );

        recordedChunksRef.current =
          [];

        recorder.ondataavailable =
          (event) => {
            if (
              event.data.size >
              0
            ) {
              recordedChunksRef.current.push(
                event.data
              );
            }
          };

        recorder.onstop = () => {
          const blob =
            new Blob(
              recordedChunksRef.current,
              {
                type:
                  "video/webm",
              }
            );

          const url =
            URL.createObjectURL(
              blob
            );

          const a =
            document.createElement(
              "a"
            );

          a.href = url;

          a.download =
            `video-call-${roomId}.webm`;

          a.click();

          URL.revokeObjectURL(
            url
          );
        };

        recorder.start();

        recorderRef.current =
          recorder;

        setRecording(
          true
        );
      } catch (error) {
        console.error(
          "Recording failed:",
          error
        );
      }
    };

  const stopRecording =
    () => {
      recorderRef.current?.stop();

      recorderRef.current =
        null;

      setRecording(
        false
      );
    };

  // ==========================================
  // CONNECTION QUALITY
  // ==========================================

  useEffect(() => {
    const interval =
      setInterval(async () => {
        const peers =
          Object.values(
            peersRef.current
          );

        if (!peers.length) {
          setConnectionQuality(
            "Good"
          );

          return;
        }

        let totalPacketsLost =
          0;

        let totalPackets =
          0;

        for (
          const peer of peers
        ) {
          try {
            const stats =
              await peer.getStats();

            stats.forEach(
              (report) => {
                if (
                  report.type ===
                    "inbound-rtp" &&
                  report.kind ===
                    "video"
                ) {
                  totalPacketsLost +=
                    report
                      .packetsLost ||
                    0;

                  totalPackets +=
                    report
                      .packetsReceived ||
                    0;
                }
              }
            );
          } catch {}
        }

        const loss =
          totalPackets > 0
            ? totalPacketsLost /
              totalPackets
            : 0;

        if (loss > 0.1) {
          setConnectionQuality(
            "Poor"
          );
        } else if (
          loss > 0.03
        ) {
          setConnectionQuality(
            "Fair"
          );
        } else {
          setConnectionQuality(
            "Good"
          );
        }
      }, 3000);

    return () =>
      clearInterval(
        interval
      );
  }, []);

  // ==========================================
  // LEAVE
  // ==========================================

  const leaveCall = () => {
    socketRef.current?.emit(
      "leave-room",
      {
        roomId,
      }
    );

    localStreamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );

    socketRef.current?.disconnect();

    router.push("/");
  };

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f] p-6 text-white">
        <div className="max-w-md rounded-2xl bg-[#202124] p-8 text-center">
          <VideoOff
            size={50}
            className="mx-auto mb-4 text-red-500"
          />

          <h1 className="mb-3 text-xl font-bold">
            Unable to join meeting
          </h1>

          <p className="mb-5 text-gray-400">
            {error}
          </p>

          <button
            onClick={() =>
              router.push("/")
            }
            className="rounded-lg bg-red-600 px-5 py-3"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* ======================================
          TOP BAR
      ======================================= */}

      <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-[#171717] px-5">
        <div>
          <h1 className="font-semibold">
            Video Meeting
          </h1>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>
              Room: {roomId}
            </span>

            <span>
              {formatDuration(
                callSeconds
              )}
            </span>

            <span
              className={
                connectionQuality ===
                "Good"
                  ? "text-green-400"
                  : connectionQuality ===
                    "Fair"
                  ? "text-yellow-400"
                  : "text-red-400"
              }
            >
              ●{" "}
              {connectionQuality}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={
              copyMeetingLink
            }
            className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm hover:bg-gray-700"
          >
            <Copy size={17} />

            {copied
              ? "Copied"
              : "Copy link"}
          </button>

          {isHost && (
            <button
              onClick={() =>
                setShowHostControls(
                  (v) => !v
                )
              }
              className="rounded-lg bg-gray-800 p-2"
              title="Host controls"
            >
              <Shield size={20} />
            </button>
          )}
        </div>
      </header>

      {/* ======================================
          MAIN
      ======================================= */}

      <div className="flex h-[calc(100vh-64px)]">
        {/* VIDEO AREA */}

        <main className="relative flex-1 overflow-auto p-4 pb-28">
          <div
            className={`grid gap-4 ${
              participants.length === 0
                ? "grid-cols-1"
                : participants.length ===
                  1
                ? "grid-cols-1 md:grid-cols-2"
                : participants.length <=
                  4
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {/* LOCAL */}

            <div
              className={`relative aspect-video overflow-hidden rounded-xl border-2 ${
                isHost
                  ? "border-blue-500"
                  : "border-gray-800"
              } bg-black`}
            >
              <video
                ref={
                  localVideoRef
                }
                autoPlay
                muted
                playsInline
                className={`h-full w-full object-cover ${
                  cameraOff ? "hidden" : ""
                }`}
              />

              {cameraOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-700 text-2xl">
                    {currentUser.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                </div>
              )}

              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2">
                <span>
                  {currentUser.name}
                </span>

                {isHost && (
                  <span className="rounded bg-blue-600 px-1.5 py-0.5 text-xs">
                    Host
                  </span>
                )}

                {muted ? (
                  <MicOff
                    size={15}
                    className="text-red-400"
                  />
                ) : (
                  <Mic
                    size={15}
                  />
                )}
              </div>
            </div>

            {/* REMOTE */}

            {participants.map(
              (participant) => (
                <div
                  key={
                    participant.socketId
                  }
                  className={`relative aspect-video overflow-hidden rounded-xl border-2 bg-black ${
                    participant.speaking
                      ? "border-green-500"
                      : "border-gray-800"
                  }`}
                >
                  <video
                    ref={(element) => {
                      remoteVideoRefs.current[
                        participant.socketId
                      ] = element;
                    }}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                  />

                  {!participant.camera && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-700 text-2xl">
                        {participant.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2">
                    <span>
                      {
                        participant.name
                      }
                    </span>

                    {participant.coHost && (
                      <span className="text-xs text-blue-400">
                        Co-host
                      </span>
                    )}

                    {participant.handRaised && (
                      <Hand
                        size={15}
                        className="text-yellow-400"
                      />
                    )}

                    {participant.mic ? (
                      <Mic size={15} />
                    ) : (
                      <MicOff
                        size={15}
                        className="text-red-400"
                      />
                    )}
                  </div>

                  {participant.speaking && (
                    <div className="absolute right-3 top-3 rounded-full bg-green-500 px-2 py-1 text-xs">
                      Speaking
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* ====================================
              BOTTOM CONTROLS
          ===================================== */}

          <div className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-[#202124] p-3 shadow-2xl">
            <button
              onClick={() =>
                muteLocal()
              }
              className={`rounded-full p-3 ${
                muted
                  ? "bg-red-600"
                  : "bg-gray-700"
              }`}
              title="Mute / Unmute"
            >
              {muted ? (
                <MicOff size={20} />
              ) : (
                <Mic size={20} />
              )}
            </button>

            <button
              onClick={
                toggleCamera
              }
              className={`rounded-full p-3 ${
                cameraOff
                  ? "bg-red-600"
                  : "bg-gray-700"
              }`}
              title="Camera"
            >
              {cameraOff ? (
                <VideoOff size={20} />
              ) : (
                <Video size={20} />
              )}
            </button>

            <button
              onClick={
                switchCamera
              }
              className="rounded-full bg-gray-700 p-3"
              title="Switch camera"
            >
              <Camera size={20} />
            </button>

            <button
              onClick={
                shareScreen
              }
              className={`rounded-full p-3 ${
                screenSharing
                  ? "bg-blue-600"
                  : "bg-gray-700"
              }`}
              title="Share screen"
            >
              <MonitorUp size={20} />
            </button>

            <button
              onClick={
                toggleHand
              }
              className={`rounded-full p-3 ${
                handRaised
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-700"
              }`}
              title="Raise hand"
            >
              <Hand size={20} />
            </button>

            <button
              onClick={() =>
                setShowParticipants(
                  (v) => !v
                )
              }
              className="relative rounded-full bg-gray-700 p-3"
              title="Participants"
            >
              <Users size={20} />

              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs">
                {participants.length +
                  1}
              </span>
            </button>

            <button
              onClick={() =>
                setShowChat(
                  (v) => !v
                )
              }
              className="rounded-full bg-gray-700 p-3"
              title="Chat"
            >
              <MessageCircle
                size={20}
              />
            </button>

            {isHost && (
              <button
                onClick={
                  recording
                    ? stopRecording
                    : startRecording
                }
                className={`rounded-full p-3 ${
                  recording
                    ? "bg-red-600"
                    : "bg-gray-700"
                }`}
                title="Recording"
              >
                {recording ? (
                  <Square size={20} />
                ) : (
                  <Circle size={20} />
                )}
              </button>
            )}

            <button
              onClick={
                leaveCall
              }
              className="rounded-full bg-red-600 p-3"
              title="Leave call"
            >
              <PhoneOff
                size={20}
              />
            </button>
          </div>
        </main>

        {/* ======================================
            PARTICIPANT PANEL
        ======================================= */}

        {showParticipants && (
          <aside className="w-80 border-l border-gray-800 bg-[#171717] p-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">
                Participants (
                {participants.length +
                  1}
                )
              </h2>

              <button
                onClick={() =>
                  setShowParticipants(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-gray-800 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600">
                    {currentUser.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p>
                      {
                        currentUser.name
                      }
                    </p>

                    <p className="text-xs text-blue-400">
                      {isHost
                        ? "Host"
                        : "You"}
                    </p>
                  </div>
                </div>

                {muted ? (
                  <MicOff
                    size={17}
                  />
                ) : (
                  <Mic size={17} />
                )}
              </div>

              {participants.map(
                (participant) => (
                  <div
                    key={
                      participant.socketId
                    }
                    className="rounded-lg bg-gray-800 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600">
                          {participant.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p>
                            {
                              participant.name
                            }
                          </p>

                          <p className="text-xs text-gray-400">
                            {participant.coHost
                              ? "Co-host"
                              : participant.speaking
                              ? "Speaking"
                              : "Participant"}
                          </p>
                        </div>
                      </div>

                      {participant.mic ? (
                        <Mic
                          size={17}
                        />
                      ) : (
                        <MicOff
                          size={17}
                          className="text-red-400"
                        />
                      )}
                    </div>

                    {/* HOST CONTROLS */}

                    {isHost && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            hostAction(
                              "mute",
                              participant.socketId
                            )
                          }
                          className="rounded bg-gray-700 px-2 py-1 text-xs"
                        >
                          Mute
                        </button>

                        <button
                          onClick={() =>
                            hostAction(
                              "remove",
                              participant.socketId
                            )
                          }
                          className="rounded bg-red-700 px-2 py-1 text-xs"
                        >
                          Remove
                        </button>

                        <button
                          onClick={() =>
                            hostAction(
                              "cohost",
                              participant.socketId,
                              !participant.coHost
                            )
                          }
                          className="rounded bg-blue-700 px-2 py-1 text-xs"
                        >
                          {participant.coHost
                            ? "Remove co-host"
                            : "Co-host"}
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </aside>
        )}

        {/* ======================================
            CHAT PANEL
        ======================================= */}

        {showChat && (
          <aside className="flex w-80 flex-col border-l border-gray-800 bg-[#171717]">
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
              <h2 className="font-semibold">
                In-call chat
              </h2>

              <button
                onClick={() =>
                  setShowChat(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length ===
                0 && (
                <p className="text-center text-sm text-gray-500">
                  No messages yet.
                </p>
              )}

              {messages.map(
                (message) => (
                  <div
                    key={
                      message.id
                    }
                    className="rounded-lg bg-gray-800 p-3"
                  >
                    <div className="mb-1 text-xs font-semibold text-blue-400">
                      {
                        message.name
                      }
                    </div>

                    <div className="whitespace-pre-wrap break-words text-sm">
                      {
                        message.message
                      }
                    </div>

                    <div className="mt-1 text-[10px] text-gray-500">
                      {new Date(
                        message.timestamp
                      ).toLocaleTimeString()}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="border-t border-gray-800 p-3">
              <div className="mb-2 flex gap-1">
                {[
                  "👍",
                  "❤️",
                  "😂",
                  "👏",
                  "🎉",
                  "😊",
                ].map(
                  (emoji) => (
                    <button
                      key={emoji}
                      onClick={() =>
                        addEmoji(
                          emoji
                        )
                      }
                      className="rounded p-1 hover:bg-gray-800"
                    >
                      <Smile
                        size={15}
                      />
                    </button>
                  )
                )}
              </div>

              <div className="flex gap-2">
                <input
                  value={
                    messageText
                  }
                  onChange={(e) =>
                    setMessageText(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      sendMessage();
                    }
                  }}
                  disabled={
                    !canChat
                  }
                  placeholder={
                    canChat
                      ? "Type a message..."
                      : "Chat disabled"
                  }
                  className="min-w-0 flex-1 rounded-lg bg-gray-800 px-3 py-2 text-sm outline-none"
                />

                <label className="cursor-pointer rounded-lg bg-gray-800 p-2">
                  <Upload
                    size={18}
                  />

                  <input
                    type="file"
                    className="hidden"
                    onChange={
                      shareFile
                    }
                    disabled={
                      !canChat
                    }
                  />
                </label>

                <button
                  onClick={
                    sendMessage
                  }
                  disabled={
                    !canChat
                  }
                  className="rounded-lg bg-blue-600 p-2"
                >
                  <Send
                    size={18}
                  />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ======================================
          HOST CONTROLS
      ======================================= */}

      {showHostControls &&
        isHost && (
          <div className="fixed right-5 top-20 z-50 w-72 rounded-xl border border-gray-700 bg-[#202124] p-4 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <Shield size={20} />

              <h2 className="font-semibold">
                Host controls
              </h2>
            </div>

            <button
              onClick={() =>
                hostAction(
                  "lock",
                  undefined,
                  !locked
                )
              }
              className="mb-2 flex w-full items-center gap-3 rounded-lg bg-gray-800 p-3 text-left hover:bg-gray-700"
            >
              {locked ? (
                <Unlock size={18} />
              ) : (
                <Lock size={18} />
              )}

              {locked
                ? "Unlock meeting"
                : "Lock meeting"}
            </button>

            <div className="mb-3 rounded-lg bg-gray-800 p-3 text-sm text-gray-400">
              {locked
                ? "New participants cannot join."
                : "Participants can join using the meeting link."}
            </div>

            <div className="mb-3 space-y-2">
              <button
                onClick={() =>
                  setRoomPermission(
                    "screen-permission",
                    !canShareScreen
                  )
                }
                className="flex w-full items-center justify-between rounded-lg bg-gray-800 p-3 text-left text-sm hover:bg-gray-700"
              >
                <span>Allow screen sharing</span>
                <span
                  className={
                    canShareScreen
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {canShareScreen ? "On" : "Off"}
                </span>
              </button>

              <button
                onClick={() =>
                  setRoomPermission(
                    "chat-permission",
                    !canChat
                  )
                }
                className="flex w-full items-center justify-between rounded-lg bg-gray-800 p-3 text-left text-sm hover:bg-gray-700"
              >
                <span>Allow chat</span>
                <span
                  className={
                    canChat
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {canChat ? "On" : "Off"}
                </span>
              </button>
            </div>

            <div className="text-xs text-gray-500">
              Maximum participants:
              {" "}
              6
            </div>
          </div>
        )}
    </div>
  );
}