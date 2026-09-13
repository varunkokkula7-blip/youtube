"use client";

import LikedContent from "@/components/LikedContent";

export default function LikedPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <LikedContent />
      </div>
    </main>
  );
}