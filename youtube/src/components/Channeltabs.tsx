import { useState } from "react";

const tabs = [
  "Home",
  "Videos",
  "Shorts",
  "Playlists",
  "Community",
  "About",
];

export default function Channeltabs() {
  const [activeTab, setActiveTab] = useState("Home");

  return (
    <div className="border-b border-gray-200 px-8">
      <div className="flex items-center gap-7">

        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative py-3 text-xs font-medium transition-colors ${
              activeTab === tab
                ? "text-black"
                : "text-gray-500 hover:text-black"
            }`}
          >
            {tab}

            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full bg-black" />
            )}
          </button>
        ))}

      </div>
    </div>
  );
}