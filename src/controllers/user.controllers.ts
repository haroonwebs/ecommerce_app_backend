import { apiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import { User } from "../models/user.model";
import { uploadToCloudinary } from "../utils/cloudinary";
import { apiResponse } from "../utils/apiResponse";
import { Types } from "mongoose";
import jwt, { JwtPayload } from "jsonwebtoken";
// method to generate access token and refresh token
const generateAccessAndRefreshTokens = async (UserId: Types.ObjectId) => {
  try {
    const user = await User.findById(UserId);
    if (!user) {
      throw new apiError(404, "User not found");
    }
    const accessToken = user.generateAccesstoken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "Error while generating access and refresh tokens");
  }
};

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

const LoginUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email) {
    throw new apiError(400, "username and email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apiError(404, "User with username or email not exist");
  }

  const isPassowrdValid = await user.comparePassword(password);
  if (!isPassowrdValid) {
    throw new apiError(401, "invalid password");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const LoggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(200, "user Logged in successfully", {
        LoggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const LogoutUser = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate((req as any).user?._id, {
    $set: { refreshToken: "" },
  });
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, "User logged out successfully", {}));
});

const RefreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new apiError(401, "Refresh Token is expired or Used");
  }
  try {
    // decode refreshToken
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as JwtPayload;
    if (!decodedToken) {
      throw new apiError(401, "Refresh Token is Expired: Please Login Again");
    }
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new apiError(401, "Token Not Matched");
    }
    if (incomingRefreshToken !== user.refreshToken) {
      throw new apiError(401, "Invalid Refresh Token");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apiResponse(200, "Access token refreshed successfully", {
          accessToken,
          refreshToken,
        })
      );
  } catch (error) {
    throw new apiError(401, "Invalid Refresh Token");
  }
});

const changeUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { password, newPassword } = req.body;
  if (!(password && newPassword)) {
    throw new apiError(400, "All fields are required");
  }
  const user = await User.findById((req as any).user?._id);
  if (!user) {
    throw new apiError(400, "invalid password");
  }
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new apiError(400, "invalid password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new apiResponse(200, "Password changed successfully", {}));
});

const currentUser = asyncHandler(async (req: Request, res: Response) => {
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        "Current user fetched successfully",
        (req as any).user
      )
    );
});

export {
  RegisterUser,
  LoginUser,
  LogoutUser,
  RefreshAccessToken,
  changeUserPassword,
  currentUser,
};
