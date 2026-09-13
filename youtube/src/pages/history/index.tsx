"use client";

import HistoryContent from "@/components/HistoryContent";

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <HistoryContent />
      </div>
    </main>
  );
}