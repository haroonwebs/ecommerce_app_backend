import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model";
import { Subscription } from "../models/subscription.model";
import { apiError } from "../utils/apiError";
import { apiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";

const toggleSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { channelId } = req.params;
  const myId = (req as any).user?._id;
  if (!isValidObjectId(channelId)) {
    throw new apiError(401, "channelId is not valid");
  }
  if (myId.toString() === channelId) {
    throw new apiError(400, "You cannot subscribe to your own channel");
  }
  const ChannelExist = await User.findById(channelId);
  if (!ChannelExist) {
    throw new apiError(404, "channel against the id not exist");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: myId,
    channel: channelId,
  });
  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);
    return res
      .status(200)
      .json(new apiResponse(201, "UnSubscribed successfully", {}));
  }
  await Subscription.create({
    subscriber: myId,
    channel: channelId,
  });
  return res
    .status(201)
    .json(new apiResponse(201, "Subscribed successfully", {}));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(
  async (req: Request, res: Response) => {
    const { channelId } = req.params;
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 20;
    const skip = (page - 1) * limit;
    if (!isValidObjectId(channelId)) {
      throw new apiError(400, "channal id is not valid");
    }

    const subscribers = await Subscription.aggregate([
      { $match: { channel: new mongoose.Types.ObjectId(channelId as any) } },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriber",
        },
      },
      {
        $unwind: "$subscriber",
      },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                createdAt: 1,
                subscriber: {
                  _id: 1,
                  username: 1,
                  email: 1,
                  avatar: 1,
                },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const totalSubscribers = subscribers[0]?.totalCount[0]?.count || 0;

    return res.status(200).json(
      new apiResponse(200, "Subscribers fetched successfully", {
        totalSubscribers,
        currentPage: page,
        totalPages: Math.ceil(totalSubscribers / limit),
        subscribers: subscribers[0]?.data || [],
      })
    );
  }
);

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(
  async (req: Request, res: Response) => {
    const { subscriberId } = req.params;
  }
);

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
