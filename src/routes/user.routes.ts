import Router from "express";
import {
  LoginUser,
  RegisterUser,
  LogoutUser,
  RefreshAccessToken,
  changeUserPassword,
  currentUser,
  updateUserAccount,
  updateCoverImage,
  updateAvatarImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controllers";
import { fileUpload } from "../middlewares/multer.middleware";
import { authenticateUser } from "../middlewares/auth.middleware";

const router = Router();

router.route("/register").post(
  fileUpload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  RegisterUser
);

router.route("/login").post(LoginUser);
router.route("/logout").post(authenticateUser, LogoutUser);
router.route("/refresh-token").post(RefreshAccessToken);
router.route("/reset-password").post(authenticateUser, changeUserPassword);
router.route("/current-user").get(authenticateUser, currentUser);
router.route("/update-account").patch(authenticateUser, updateUserAccount);
router
  .route("/update-cover-image")
  .patch(authenticateUser, fileUpload.single("coverImage"), updateCoverImage);
router
  .route("/update-avatar-image")
  .patch(authenticateUser, fileUpload.single("avatar"), updateAvatarImage);
router.route("/watch-history").get(authenticateUser, getWatchHistory);
router
  .route("/channel-profile/:username")
  .get(authenticateUser, getUserChannelProfile);

export default router;
