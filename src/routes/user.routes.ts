import Router from "express";
import {
  LoginUser,
  RegisterUser,
  LogoutUser,
  RefreshAccessToken,
  changeUserPassword,
  currentUser,
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

export default router;
