import { FormEvent, useState } from "react";

import { useRouter } from "next/router";

import { Check, Clipboard, Link, Video } from "lucide-react";

const ROOM_ID_LENGTH = 8;
const ROOM_ID_CHARACTERS =
  "abcdefghijklmnopqrstuvwxyz0123456789";

function createRoomId() {
  const values = new Uint32Array(ROOM_ID_LENGTH);
  crypto.getRandomValues(values);

  return Array.from(
    values,
    (value) =>
      ROOM_ID_CHARACTERS[value % ROOM_ID_CHARACTERS.length],
  ).join("");
}

function isValidRoomId(roomId: string) {
  return /^[a-zA-Z0-9_-]{3,64}$/.test(roomId);
}

export default function MeetingLandingPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const getMeetingUrl = (id: string) => {
    if (typeof window === "undefined") {
      return `/call/${id}`;
    }

    return `${window.location.origin}/call/${id}`;
  };

  const createMeeting = () => {
    const newRoomId = createRoomId();
    setCreatedRoomId(newRoomId);
    setRoomId(newRoomId);
    setCopied(false);
    setError("");
  };

  const joinMeeting = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedRoomId = roomId.trim();

    if (!isValidRoomId(normalizedRoomId)) {
      setError(
        "Enter a room ID with 3-64 letters, numbers, hyphens, or underscores.",
      );
      return;
    }

    router.push(`/call/${encodeURIComponent(normalizedRoomId)}`);
  };

  const copyMeetingLink = async () => {
    if (!createdRoomId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(getMeetingUrl(createdRoomId));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the link. Please copy it manually.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-4 py-12 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-gray-800 bg-[#171717] p-6 shadow-2xl sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
            <Video size={28} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold">Video Meeting</h1>
          <p className="mt-2 text-gray-400">
            Create a room and share the link for a 1-on-1 call.
          </p>
        </div>

        <button
          type="button"
          onClick={createMeeting}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Create New Meeting
        </button>

        {createdRoomId && (
          <div className="mt-5 rounded-xl border border-blue-900 bg-blue-950/40 p-4">
            <p className="text-sm font-medium text-blue-200">
              Your meeting is ready
            </p>
            <p className="mt-1 break-all text-sm text-gray-300">
              {getMeetingUrl(createdRoomId)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-lg bg-gray-800 px-3 py-2 text-sm">
                Room ID: <strong>{createdRoomId}</strong>
              </span>
              <button
                type="button"
                onClick={copyMeetingLink}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {copied ? <Check size={16} /> : <Clipboard size={16} />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/call/${createdRoomId}`)}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"
            >
              <Link size={16} />
              Join this meeting
            </button>
          </div>
        )}

        <div className="my-8 flex items-center gap-3 text-xs uppercase tracking-wider text-gray-500">
          <span className="h-px flex-1 bg-gray-800" />
          or join an existing room
          <span className="h-px flex-1 bg-gray-800" />
        </div>

        <form onSubmit={joinMeeting}>
          <label
            htmlFor="room-id"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Enter Room ID
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="room-id"
              value={roomId}
              onChange={(event) => {
                setRoomId(event.target.value);
                setError("");
              }}
              placeholder="e.g. test123"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-[#202124] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-gray-700 px-5 py-3 font-semibold hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Join Meeting
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}