import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/video.js";
import likeRoutes from "./routes/like.js";
import watchLaterRoutes from "./routes/watchlater.js";
import historyRoutes from "./routes/history.js";
import commentRoutes from "./routes/comment.js";
import adminCommentsRoutes from "./routes/adminComments.js";
import downloadRoutes from "./routes/download.js";
import subscriptionRoutes from "./routes/subscription.js";
import paymentRoutes from "./routes/payment.js";
import securityRoutes from "./routes/security.js";
import { setupVideoCallSocket } from "./videoCallSocket.js";
dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://youtube-bice-rho.vercel.app",
];

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

setupVideoCallSocket(io);

app.use(
  cors({
    origin: function (origin, callback) {
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);
app.use(
  "/admin/comments",
  adminCommentsRoutes
);
app.use("/download", downloadRoutes);
app.use("/subscription", subscriptionRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/security", securityRoutes);
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "YouTube Clone Server is running",
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
  });
});

app.use("/user", authRoutes);
app.use("/video", videoRoutes);
app.use("/like", likeRoutes);
app.use("/watchlater", watchLaterRoutes);
app.use("/history", historyRoutes);
app.use("/comment", commentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message,
  });
});

const PORT = process.env.PORT || 5000;
const DB_URL = process.env.DB_URL;

if (!DB_URL) {
  console.error("DB_URL is missing in .env file");
  process.exit(1);
}

const startServer = async () => {
  try {
    await mongoose.connect(DB_URL, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully");

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.log("Retrying MongoDB connection in 5 seconds...");
    setTimeout(startServer, 5000);
  }
};

startServer();