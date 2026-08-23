"use client";

import Link from "next/link";

import {
  Home,
  Compass,
  PlaySquare,
  History,
  ThumbsUp,
  Clock,
  User,
  LogOut,
} from "lucide-react";

import { useUser } from "@/lib/AuthContext";

export default function Sidebar() {
  // ==========================================
  // USER
  // ==========================================

  const {
    user,
    logout,
    handlegooglesignin,
  } = useUser();

  // ==========================================
  // SIDEBAR
  // ==========================================

  return (
    <>
      <aside className="min-h-screen w-64 shrink-0 border-r bg-white">
        <div className="flex flex-col p-3">

          {/* ==================================
              HOME
          ================================== */}

          <Link
            href="/"
            className="flex items-center gap-5 rounded-lg px-4 py-3 hover:bg-gray-100"
          >
            <Home size={22} />

            <span className="text-sm font-medium">
              Home
            </span>
          </Link>

          {/* ==================================
              EXPLORE
          ================================== */}

          <Link
            href="/explore"
            className="flex items-center gap-5 rounded-lg px-4 py-3 hover:bg-gray-100"
          >
            <Compass size={22} />

            <span className="text-sm font-medium">
              Explore
            </span>
          </Link>

          {/* ==================================
              SUBSCRIPTIONS
          ================================== */}

          <Link
            href="/subscriptions"
            className="flex items-center gap-5 rounded-lg px-4 py-3 hover:bg-gray-100"
          >
            <PlaySquare size={22} />

            <span className="text-sm font-medium">
              Subscriptions
            </span>
          </Link>

          {/* ==================================
              DIVIDER
          ================================== */}

          <div className="my-3 border-t" />

          {/* ==================================
              HISTORY
          ================================== */}

          <Link
            href="/history"
            className="flex items-center gap-5 rounded-lg px-4 py-3 hover:bg-gray-100"
          >
            <History size={22} />

            <span className="text-sm font-medium">
              History
            </span>
          </Link>

          {/* ==================================
              LIKED VIDEOS
          ================================== */}

          <Link
            href="/liked"
            className="flex items-center gap-5 rounded-lg px-4 py-3 hover:bg-gray-100"
          >
            <ThumbsUp size={22} />

            <span className="text-sm font-medium">
              Liked videos
            </span>
          </Link>

          {/* ==================================
              WATCH LATER
          ================================== */}

          <Link
            href="/watch-later"
            className="flex items-center gap-5 rounded-lg px-4 py-3 hover:bg-gray-100"
          >
            <Clock size={22} />

            <span className="text-sm font-medium">
              Watch later
            </span>
          </Link>

          {/* ==================================
              YOUR CHANNEL
          ================================== */}

          <Link
            href="/channel"
            className="flex items-center gap-5 rounded-lg px-4 py-3 hover:bg-gray-100"
          >
            <User size={22} />

            <span className="text-sm font-medium">
              Your channel
            </span>
          </Link>

          {/* ==================================
              DIVIDER
          ================================== */}

          <div className="my-3 border-t" />

          {/* ==================================
              LOGGED IN USER
          ================================== */}

          {user ? (
            <>
              {/* USER DETAILS */}

              <div className="px-4 py-2">
                <p className="truncate text-sm font-semibold">
                  {user.name || "User"}
                </p>

                <p className="truncate text-xs text-gray-500">
                  {user.email || ""}
                </p>
              </div>

              {/* ==================================
                  SIGN OUT
              ================================== */}

              <button
                type="button"
                onClick={async () => {
                  await logout();
                }}
                className="mt-2 flex w-full items-center gap-5 rounded-lg px-4 py-3 text-left hover:bg-gray-100"
              >
                <LogOut size={22} />

                <span className="text-sm font-medium">
                  Sign Out
                </span>
              </button>
            </>
          ) : (
            <>
              {/* ==================================
                  SIGN IN
              ================================== */}

              <button
                type="button"
                onClick={async () => {
                  await handlegooglesignin();
                }}
                className="mt-2 flex w-full items-center gap-5 rounded-lg px-4 py-3 text-left hover:bg-gray-100"
              >
                <User size={22} />

                <span className="text-sm font-medium">
                  Sign In
                </span>
              </button>
            </>
          )}

        </div>
      </aside>
    </>
  );
}