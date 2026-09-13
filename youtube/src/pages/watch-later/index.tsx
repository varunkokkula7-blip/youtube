"use client";

import WatchLaterContent from "@/components/WatchLaterContent";

export default function WatchLaterPage() {
  return (
    <main className="flex-1 bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <WatchLaterContent />
      </div>
    </main>
  );
}