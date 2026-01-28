import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller";

const router = Router();

router.route("/create-playlist").post(authenticateUser, createPlaylist);
router.route("/user-playlists/:userId").get(getUserPlaylists);
router
  .route("/user-playlist/:playlistId")
  .get(authenticateUser, getPlaylistById);
router
  .route("/add-video-playlist/:playlistId/:videoId")
  .post(authenticateUser, addVideoToPlaylist);
router
  .route("/remove-video-playlist/:playlistId/:videoId")
  .put(authenticateUser, removeVideoFromPlaylist);
router
  .route("/delete-playlist/:playlistId")
  .delete(authenticateUser, deletePlaylist);
router
  .route("/update-playlist/:playlistId")
  .put(authenticateUser, updatePlaylist);

export default router;
