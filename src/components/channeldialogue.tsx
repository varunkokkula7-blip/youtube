"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

type ChannelDialogueProps = {
  isopen: boolean;
  onclose: () => void;
  mode?: "create" | "edit";
};

type Channel = {
  name: string;
  description: string;
  createdAt: string;
};

const Channeldialogue = ({
  isopen,
  onclose,
  mode = "create",
}: ChannelDialogueProps) => {
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");

  // Load existing channel when editing
  useEffect(() => {
    if (!isopen) return;

    const savedChannel = localStorage.getItem("yourTubeChannel");

    if (savedChannel) {
      try {
        const channel: Channel = JSON.parse(savedChannel);

        setChannelName(channel.name || "");
        setChannelDescription(channel.description || "");
      } catch {
        setChannelName("");
        setChannelDescription("");
      }
    } else {
      setChannelName("");
      setChannelDescription("");
    }
  }, [isopen]);

  if (!isopen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const name = channelName.trim();
    const description = channelDescription.trim();

    if (!name) {
      alert("Please enter a channel name.");
      return;
    }

    const channel: Channel = {
      name,
      description,
      createdAt:
        mode === "edit"
          ? JSON.parse(
              localStorage.getItem("yourTubeChannel") || "{}"
            ).createdAt || new Date().toISOString()
          : new Date().toISOString(),
    };

    // Save channel
    localStorage.setItem(
      "yourTubeChannel",
      JSON.stringify(channel)
    );

    // Tell Header that the channel changed
    window.dispatchEvent(
      new CustomEvent("channelUpdated", {
        detail: channel,
      })
    );

    // Close dialog
    onclose();

    // Go to channel page
    window.location.href = "/channel";
  };

  const handleClose = () => {
    onclose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-black">
            {mode === "edit"
              ? "Edit your channel"
              : "Create your channel"}
          </h2>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          {/* CHANNEL NAME */}
          <div className="mb-5">
            <label
              htmlFor="channelName"
              className="mb-2 block text-sm font-medium text-black"
            >
              Channel name
            </label>

            <input
              id="channelName"
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="Enter channel name"
              autoFocus
              className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-black outline-none placeholder:text-gray-400 focus:border-black"
            />
          </div>

          {/* DESCRIPTION */}
          <div className="mb-6">
            <label
              htmlFor="channelDescription"
              className="mb-2 block text-sm font-medium text-black"
            >
              Channel description
            </label>

            <textarea
              id="channelDescription"
              value={channelDescription}
              onChange={(e) =>
                setChannelDescription(e.target.value)
              }
              placeholder="Tell viewers about your channel"
              rows={4}
              className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black outline-none placeholder:text-gray-400 focus:border-black"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {mode === "edit"
                ? "Save changes"
                : "Create channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Channeldialogue;