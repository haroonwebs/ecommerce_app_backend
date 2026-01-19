import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";

const RegisterUser = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    message: "User Registered Successfully",
  });
});

export { RegisterUser };
