import mongoose, { isValidObjectId } from "mongoose";
import { Request, Response } from "express";
import { PlayList } from "../models/playlist.model";
import { apiError } from "../utils/apiError";
import { apiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const createPlaylist = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const owner = (req as any).user?._id;
  if (!isValidObjectId(owner)) {
    throw new apiError(401, "playlist owner id is required");
  }
  if (!name || !description) {
    throw new apiError(404, "name and description is required");
  }

  const playlist = await PlayList.create({
    name,
    description,
    owner,
  });

  return res
    .status(201)
    .json(new apiResponse(201, "playlist created successfully", playlist));
});

const getUserPlaylists = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!isValidObjectId) {
    throw new apiError(401, "User id is invalid");
  }

  const playlists = await PlayList.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId as any) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$owner" },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(200, "User playlists fetched successfully", playlists)
    );
});

const getPlaylistById = asyncHandler(async (req: Request, res: Response) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new apiError(401, "playlist id is not valid");
  }

  const playlist = await PlayList.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId as any),
      },
    },
    // Join owner document
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$owner" },

    // Join videos (keep as array)
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: {
              title: 1,
              thumbnail: 1,
              duration: 1,
              videoFile: 1,
            },
          },
        ],
      },
    },

    // Shaping final response
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        owner: 1,
        videos: 1,
      },
    },
  ]);
  return res
    .status(200)
    .json(new apiResponse(200, "playlist fetched succssfully", playlist));
});

const addVideoToPlaylist = asyncHandler(async (req: Request, res: Response) => {
  const { playlistId, videoId } = req.params;
  const userId = (req as any).user?._id;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid playlist or video ID");
  }
  const playlist = await PlayList.findOne({
    _id: playlistId,
    owner: userId,
  });
  if (!playlist) {
    throw new apiError(404, "Playlist not found against given id");
  }
  if (playlist?.videos?.include(videoId as any)) {
    throw new apiError(400, "video already exist in this playlist");
  }
  playlist.videos.push(videoId);
  const Savedplaylist = await playlist.save();
  return res
    .status(201)
    .json(new apiResponse(201, "video added successfully", Savedplaylist));
});

const removeVideoFromPlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId, videoId } = req.params;
    const userId = (req as any).user?._id;
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
      throw new apiError(400, "Invalid playlist or video ID");
    }
    const playlist = await PlayList.findOneAndUpdate(
      {
        _id: playlistId,
        owner: userId,
      },
      { $pull: { videos: videoId } },
      { new: true }
    );

    if (!playlist) {
      throw new apiError(404, "Playlist not found or unauthorized");
    }
    return res
      .status(200)
      .json(new apiResponse(200, "Video deleted successfully", playlist));
  }
);

const deletePlaylist = asyncHandler(async (req: Request, res: Response) => {
  const { playlistId } = req.params;
  const userId = (req as any).user?._id;
  if (!isValidObjectId(playlistId) || !isValidObjectId(userId)) {
    throw new apiError(400, "playlist id or userid is not valid");
  }
  const playlist = await PlayList.findOneAndDelete({
    _id: playlistId,
    owner: userId,
  });
  if (!playlist) {
    throw new apiError(404, "playlist not found");
  }
  return res
    .status(200)
    .json(new apiResponse(200, "playlist deleted successfully", playlist));
});

const updatePlaylist = asyncHandler(async (req: Request, res: Response) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const userId = (req as any).user?._id;
  if (!isValidObjectId(playlistId)) {
    throw new apiError(400, "playlist id not valid");
  }
  if (!name || !description) {
    throw new apiError(400, "name or discription is required");
  }
  const playlist = await PlayList.findOneAndUpdate(
    { _id: playlistId, owner: userId },
    {
      $set: {
        ...(name && { name }),
        ...(description && { description }),
      },
    },
    { new: true }
  );
  if (!playlist) {
    throw new apiError(404, "something went wrong while updating playlist");
  }
  return res
    .status(200)
    .json(new apiResponse(200, "playlist Updated successfully", playlist));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
