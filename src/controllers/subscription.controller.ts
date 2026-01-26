import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model";
import { Subscription } from "../models/subscription.model";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";

const toggleSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(
  async (req: Request, res: Response) => {
    const { channelId } = req.params;
  }
);

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(
  async (req: Request, res: Response) => {
    const { subscriberId } = req.params;
  }
);

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
