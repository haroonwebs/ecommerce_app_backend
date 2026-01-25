import { Router } from "express";
import { fileUpload } from "../middlewares/multer.middleware";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  deleteVideo,
  getVideoById,
  publishVideo,
  togglePublishStatus,
  updateVideo,
  getAllVideos,
  watchVideo,
} from "../controllers/video.controller";

const router = Router();
router.use(authenticateUser);
router.route("/publishVideo").post(
  fileUpload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);

router.route("/getvideobyid/:videoId").get(getVideoById);
router.route("/").get(getAllVideos);
router.route("/updatevideo/:videoId").put(
  fileUpload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  updateVideo
);
router.route("/deletevideobyid/:videoId").delete(deleteVideo);
router.route("/togglepublishstatus/:videoId").post(togglePublishStatus);
router.route("/:videoId/watch").post(watchVideo);

export default router;
