import CategoryTabs from "@/components/category-tabs";
import VideoGrid from "@/components/videogrid";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="flex-1 p-4">
      <CategoryTabs />
      <Suspense fallback={<div>Loading videos...</div>}>
        <VideoGrid />
      </Suspense>
    </main>
  );
}
