import React from "react";
import { useRouter } from "next/router";
import SearchResult from "@/components/SearchResult";

const SearchPage = () => {
  const router = useRouter();

  const query =
    typeof router.query.q === "string"
      ? router.query.q
      : "";

  if (!router.isReady) {
    return (
      <main className="flex-1 p-6">
        <p className="text-gray-600">
          Loading search results...
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <SearchResult query={query} />
    </main>
  );
};

export default SearchPage;