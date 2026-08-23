import express from "express";
import {
  handlelike,
  getallLikedVideo,
} from "../controllers/like.js";

const routes = express.Router();

// LIKE / DISLIKE
routes.post("/:videoId", handlelike);

// GET USER LIKED VIDEOS
routes.get(
  "/user/:userId",
  getallLikedVideo
);

export default routes;