"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import {
  Menu,
  Search,
  Mic,
  Video,
  Bell,
  User,
  History,
  ThumbsUp,
  Clock,
  LogOut,
} from "lucide-react";

import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";

type Channel = {
  name: string;
  description: string;
  createdAt: string;
};

const Header = () => {
  const router = useRouter();

  // ==========================================
  // AUTH USER
  // ==========================================

  const { user, logout } = useUser();

  // ==========================================
  // STATES
  // ==========================================

  const [menuOpen, setMenuOpen] = useState(false);

  const [channelDialogOpen, setChannelDialogOpen] =
    useState(false);

  const [channel, setChannel] =
    useState<Channel | null>(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearch = () => {
    const query = searchQuery.trim();

    if (!query) {
      return;
    }

    router.push(
      `/search?q=${encodeURIComponent(query)}`
    );
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  // ==========================================
  // LOAD CHANNEL
  // ==========================================

  useEffect(() => {
    const loadChannel = () => {
      const savedChannel =
        localStorage.getItem("yourTubeChannel");

      if (!savedChannel) {
        setChannel(null);
        return;
      }

      try {
        const parsedChannel: Channel =
          JSON.parse(savedChannel);

        setChannel(parsedChannel);
      } catch {
        setChannel(null);
      }
    };

    loadChannel();

    const handleChannelUpdated = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<Channel>;

      if (customEvent.detail) {
        setChannel(customEvent.detail);
      } else {
        loadChannel();
      }
    };

    window.addEventListener(
      "channelUpdated",
      handleChannelUpdated
    );

    return () => {
      window.removeEventListener(
        "channelUpdated",
        handleChannelUpdated
      );
    };
  }, []);

  // ==========================================
  // SIGN OUT
  // ==========================================

  const handleSignOut = async () => {
    try {
      setMenuOpen(false);

      // REAL AUTH LOGOUT
      await logout();

      // Remove local channel data
      localStorage.removeItem(
        "yourTubeChannel"
      );

      // Go home
      router.push("/");
    } catch (error) {
      console.error(
        "Sign out error:",
        error
      );
    }
  };

  // ==========================================
  // CREATE / EDIT CHANNEL
  // ==========================================

  const handleChannelClick = () => {
    setMenuOpen(false);
    setChannelDialogOpen(true);
  };

  // ==========================================
  // USER DISPLAY NAME
  // ==========================================

  const displayName =
    user?.name ||
    user?.email ||
    "Guest User";

  const displayEmail =
    user?.email ||
    "Not signed in";

  // ==========================================
  // USER IMAGE
  // ==========================================

  const userImage = user?.image || "";

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <header className="sticky top-0 z-50 flex h-16 items-center border-b bg-white px-4">
        {/* LEFT */}

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5 text-black" />
          </button>

          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <div className="rounded-lg bg-red-600 px-2 py-1 text-sm font-bold text-white">
              ▶
            </div>

            <span className="text-xl font-bold text-black">
              YourTube
            </span>
          </Link>
        </div>

        {/* ====================================== */}
        {/* SEARCH */}
        {/* ====================================== */}

        <div className="mx-auto flex w-full max-w-xl items-center">
          <div className="flex h-10 flex-1 items-center rounded-l-full border border-gray-300 px-4">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              onKeyDown={
                handleSearchKeyDown
              }
              className="w-full bg-transparent text-sm text-black outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="flex h-10 w-14 items-center justify-center rounded-r-full border border-l-0 border-gray-300 bg-gray-50 hover:bg-gray-100"
          >
            <Search className="h-5 w-5 text-black" />
          </button>

          <button
            type="button"
            className="ml-3 flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <Mic className="h-5 w-5 text-black" />
          </button>
        </div>

        {/* ====================================== */}
        {/* RIGHT */}
        {/* ====================================== */}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <Video className="h-5 w-5 text-black" />
          </button>

          <button
            type="button"
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <Bell className="h-5 w-5 text-black" />
          </button>

          {/* ====================================== */}
          {/* PROFILE */}
          {/* ====================================== */}

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setMenuOpen(
                  (previous) =>
                    !previous
                )
              }
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-orange-200 hover:ring-2 hover:ring-gray-300"
            >
              {userImage ? (
                <img
                  src={userImage}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-black" />
              )}
            </button>

            {/* ====================================== */}
            {/* PROFILE MENU */}
            {/* ====================================== */}

            {menuOpen && (
              <div className="absolute right-0 top-12 z-[100] w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                {/* ACCOUNT */}

                <div className="border-b px-4 py-4">
                  <p className="font-semibold text-black">
                    {displayName}
                  </p>

                  <p className="mt-1 break-all text-xs text-gray-500">
                    {displayEmail}
                  </p>

                  {/* DEBUG USER ID */}
                  {user?._id && (
                    <p className="mt-1 break-all text-[10px] text-gray-400">
                      ID: {user._id}
                    </p>
                  )}
                </div>

                {/* ====================================== */}
                {/* CHANNEL */}
                {/* ====================================== */}

                {channel ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);

                      router.push(
                        "/channel"
                      );
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-black hover:bg-gray-100"
                  >
                    <User className="h-5 w-5" />

                    <div>
                      <p className="font-medium">
                        Your channel
                      </p>

                      <p className="text-xs text-gray-500">
                        {channel.name}
                      </p>
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={
                      handleChannelClick
                    }
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-black hover:bg-gray-100"
                  >
                    <User className="h-5 w-5" />

                    <span>
                      Create Channel
                    </span>
                  </button>
                )}

                {/* ====================================== */}
                {/* HISTORY */}
                {/* ====================================== */}

                <Link
                  href="/history"
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="flex items-center gap-3 px-4 py-3 text-sm text-black hover:bg-gray-100"
                >
                  <History className="h-5 w-5" />

                  <span>
                    History
                  </span>
                </Link>

                {/* ====================================== */}
                {/* LIKED VIDEOS */}
                {/* ====================================== */}

                <Link
                  href="/liked"
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="flex items-center gap-3 px-4 py-3 text-sm text-black hover:bg-gray-100"
                >
                  <ThumbsUp className="h-5 w-5" />

                  <span>
                    Liked videos
                  </span>
                </Link>

                {/* ====================================== */}
                {/* WATCH LATER */}
                {/* ====================================== */}

                <Link
                  href="/watch-later"
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="flex items-center gap-3 px-4 py-3 text-sm text-black hover:bg-gray-100"
                >
                  <Clock className="h-5 w-5" />

                  <span>
                    Watch later
                  </span>
                </Link>

                <div className="my-1 border-t" />

                {/* ====================================== */}
                {/* SIGN OUT */}
                {/* ====================================== */}

                <button
                  type="button"
                  onClick={
                    handleSignOut
                  }
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />

                  <span>
                    Sign out
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ====================================== */}
      {/* CHANNEL DIALOG */}
      {/* ====================================== */}

      <Channeldialogue
        isopen={channelDialogOpen}
        onclose={() =>
          setChannelDialogOpen(false)
        }
        mode={
          channel
            ? "edit"
            : "create"
        }
      />
    </>
  );
};

export default Header;