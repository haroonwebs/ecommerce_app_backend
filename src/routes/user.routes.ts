import Router from "express";
import {
  LoginUser,
  RegisterUser,
  LogoutUser,
  RefreshAccessToken,
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

export default router;
