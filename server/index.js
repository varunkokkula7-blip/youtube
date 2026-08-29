import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// ==========================================
// ROUTES
// ==========================================

import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/video.js";
import likeRoutes from "./routes/like.js";
import watchLaterRoutes from "./routes/watchlater.js";
import historyRoutes from "./routes/history.js";
import commentRoutes from "./routes/comment.js";

// ==========================================
// ENV
// ==========================================

dotenv.config();

// ==========================================
// APP
// ==========================================

const app = express();

// ==========================================
// __dirname
// ==========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CORS
// ==========================================

const allowedOrigins = [
  "http://localhost:3000",
  "https://youtube-bite-rho.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an origin
      // such as Postman or direct server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);

      return callback(
        new Error("Not allowed by CORS")
      );
    },
    credentials: true,
  })
);

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// STATIC UPLOADS
// ==========================================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "YouTube Clone Server is running",
  });
});

// ==========================================
// TEST API
// ==========================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
  });
});

// ==========================================
// AUTH ROUTES
// ==========================================

app.use("/user", authRoutes);

// ==========================================
// VIDEO ROUTES
// ==========================================

app.use("/video", videoRoutes);

// ==========================================
// LIKE ROUTES
// ==========================================

app.use("/like", likeRoutes);

// ==========================================
// WATCH LATER ROUTES
// ==========================================

app.use("/watchlater", watchLaterRoutes);

// ==========================================
// HISTORY ROUTES
// ==========================================

app.use("/history", historyRoutes);

// ==========================================
// COMMENT ROUTES
// ==========================================

app.use("/comment", commentRoutes);

// ==========================================
// 404 ROUTE
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message,
  });
});

// ==========================================
// MONGODB
// ==========================================

const PORT = process.env.PORT || 5000;

const DB_URL = process.env.DB_URL;

if (!DB_URL) {
  console.error("DB_URL is missing in .env file");
  process.exit(1);
}

mongoose
  .connect(DB_URL)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });