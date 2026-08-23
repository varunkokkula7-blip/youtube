import React, { useState } from "react";

import { Button } from "./ui/button";

const categories = [
  "All",
  "Music",
  "Gaming",
  "News",
  "Sports",
  "Technology",
  "Comedy",
  "Education",
  "Science",
  "Travel",
  "Food",
  "Fashion",
];

const CategoryTabs = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => (
        <Button
          key={category}
          variant={activeCategory === category ? "default" : "secondary"}
          className="whitespace-nowrap rounded-full"
          onClick={() => setActiveCategory(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  );
};

export default CategoryTabs;