import express from "express";
import multer from "multer";

import {
  uploadvideo,
  getallvideo,
} from "../controllers/video.js";

const routes = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const filename =
      new Date().toISOString().replace(/:/g, "-") +
      "-" +
      file.originalname;

    cb(null, filename);
  },
});

const upload = multer({ storage });

// Upload video
routes.post(
  "/upload",
  upload.single("file"),
  uploadvideo
);

// Get all videos
routes.get(
  "/getall",
  getallvideo
);

export default routes;