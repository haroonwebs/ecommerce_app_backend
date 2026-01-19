import Router from "express";
import { RegisterUser } from "../controllers/user.controllers";
import { fileUpload } from "../middlewares/multer.middleware";

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

export default router;
