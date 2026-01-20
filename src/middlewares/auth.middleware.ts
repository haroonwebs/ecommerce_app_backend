import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response, NextFunction } from "express";
import { apiError } from "../utils/apiError";
import { User } from "../models/user.model";
import jwt, { JwtPayload } from "jsonwebtoken";

export const authenticateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];
    if (!token) {
      throw new apiError(401, "Authentication Failed");
    }

    const verifyToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as JwtPayload;

    if (!verifyToken) {
      throw new apiError(401, "Authentication Token is Missing or Expired");
    }

    const user = await User.findById(verifyToken._id).select(
      "-password -refreshToken"
    );
    (req as any).user = user;
    next();
  }
);
