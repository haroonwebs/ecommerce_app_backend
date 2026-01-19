import { apiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import { User } from "../models/user.model";
import { uploadToCloudinary } from "../utils/cloudinary";
import { apiResponse } from "../utils/apiResponse";

const RegisterUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, fullName } = req.body;
  if (
    [username, email, password, fullName].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    throw new apiError(409, "User with this namename and email already exist");
  }
  // validation for user done now receive files

  const avatarLocalPath = (req.files as any)?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new apiError(404, "Avatar image is required");
  }
  const coverImageLocalPath = (req.files as any)?.coverImage?.[0]?.path;

  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = await uploadToCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new apiError(404, "Avatar image is required");
  }
  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new apiError(500, "User creation failed");
  }
  return res
    .status(201)
    .json(new apiResponse(201, "User registered successfully", createdUser));
});

export { RegisterUser };
