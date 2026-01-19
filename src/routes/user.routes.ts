import Router from "express";
import {
  LoginUser,
  RegisterUser,
  LogoutUser,
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

export default router;
