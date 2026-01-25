import { asyncHandler } from "../utils/asyncHandler";
import z from "zod";
import mongoose from "mongoose";
import { Request, Response } from "express";

import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary";
import { Video } from "../models/video.model";
import { apiError } from "../utils/apiError";
import { apiResponse } from "../utils/apiResponse";
import { User } from "../models/user.model";

const publishVideo = asyncHandler(async (req: Request, res: Response) => {
  const videoFileLocalPath = (req.files as any)?.videoFile?.[0]?.path;
  const thumbnailLocalPath = (req.files as any)?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new apiError(400, "Video file and thumbnail are required");
  }

  const requiredBody = z.object({
    title: z.string().trim().min(2).max(80),
    description: z.string().trim().min(4).max(300),
  });

  const validatedData = requiredBody.safeParse(req.body);
  if (!validatedData.success) {
    return res.status(400).json({
      message: "Invalid Title or Description data format",
      error: validatedData.error.issues,
    });
  }

  const { title, description } = validatedData.data;

  const data = { title, description, videoFileLocalPath, thumbnailLocalPath };
  for (const [key, value] of Object.entries(data)) {
    if (!value) throw new apiError(400, `${key} is required`);
  }

  const videoFile = await uploadToCloudinary(videoFileLocalPath).catch((e) =>
    console.log("Failed to upload video file \n", e)
  );
  const thumbnail = await uploadToCloudinary(thumbnailLocalPath).catch((e) =>
    console.log("Failed to upload thumbnail file \n", e)
  );

  if (!videoFile?.secure_url || !thumbnail?.secure_url) {
    throw new apiError(500, "Cloudinary upload failed");
  }

  const duration = Math.floor(videoFile.duration);

  const video = await Video.create({
    videoFile: {
      url: videoFile.secure_url,
      public_id: videoFile.public_id,
    },
    thumbnail: {
      url: thumbnail.secure_url,
      public_id: thumbnail.public_id,
    },
    title,
    description,
    duration,
    owner: (req as any)?.user._id,
    isPublished: true,
  });

  return res
    .status(201)
    .json(new apiResponse(201, video, "Video uploaded successfully"));
});

const getAllVideos = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  if (!userId) {
    throw new apiError(400, "userId is required", []);
  }

  const existedUser = await User.findById(userId);
  if (!existedUser) {
    throw new apiError(404, "User not found", []);
  }

  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);
  const skip = (pageNumber - 1) * limitNumber;

  const filter: {
    owner: mongoose.Types.ObjectId;
    title?: { $regex: string; $options: string };
  } = {
    owner: new mongoose.Types.ObjectId(userId as string),
  };

  if (query) {
    filter.title = { $regex: query as string, $options: "i" };
  }

  const sortOption: { [key: string]: 1 | -1 } = {};
  sortOption[sortBy as string] = sortType === "asc" ? 1 : -1;

  const totalVideos = await Video.countDocuments(filter);
  const totalPages = Math.ceil(totalVideos / limitNumber);

  const videos = await Video.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNumber)
    .populate("owner", "username fullName avatar");

  return res.status(200).json(
    new apiResponse(200, "Videos fetched successfully", {
      currentPage: pageNumber,
      totalPages,
      totalVideos,
      videos,
    })
  );
});

const getVideoById = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId as string)) {
    throw new apiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "username fullName avatar"
  );

  if (!video) {
    throw new apiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId as string)) {
    throw new apiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }

  const videoFileLocalPath = (req.files as any)?.videoFile?.[0]?.path;
  const thumbnailLocalPath = (req.files as any)?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new apiError(400, "Video file and thumbnail are required");
  }

  const requiredBody = z.object({
    title: z.string().trim().min(2).max(80),
    description: z.string().trim().min(4).max(300),
  });

  const validatedData = requiredBody.safeParse(req.body);
  if (!validatedData.success) {
    return res.status(400).json({
      message: "Invalid Title or Description data format",
      error: validatedData.error.issues,
    });
  }

  const { title, description } = validatedData.data;

  const videoFileUpload = await uploadToCloudinary(videoFileLocalPath).catch(
    (e) => console.log("Failed to upload video file \n", e)
  );
  const thumbnailUpload = await uploadToCloudinary(thumbnailLocalPath).catch(
    (e) => console.log("Failed to upload thumbnail file \n", e)
  );

  if (!videoFileUpload?.secure_url || !thumbnailUpload?.secure_url) {
    throw new apiError(500, "Cloudinary upload failed");
  }

  const duration = Math.floor(videoFileUpload?.duration || 0);

  // Delete old cloudinary files if they exist
  if (video.videoFile?.public_id) {
    await deleteFromCloudinary(video.videoFile.public_id, "video");
  }

  if (video.thumbnail?.public_id) {
    await deleteFromCloudinary(video.thumbnail.public_id);
  }

  video.videoFile = {
    url: videoFileUpload.secure_url,
    public_id: videoFileUpload.public_id,
  };
  video.thumbnail = {
    url: thumbnailUpload.secure_url,
    public_id: thumbnailUpload.public_id,
  };
  video.title = title;
  video.description = description;
  video.duration = duration;

  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId as string)) {
    throw new apiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }
  if (video.videoFile?.public_id) {
    await deleteFromCloudinary(video.videoFile.public_id);
  }
  if (video.thumbnail?.public_id) {
    await deleteFromCloudinary(video.thumbnail.public_id);
  }

  await Video.deleteOne({ _id: videoId });

  return res
    .status(200)
    .json(new apiResponse(200, "Video deleted successfully", {}));
});
const togglePublishStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(videoId as string)) {
      throw new apiError(400, "Invalid video ID format");
    }

    const video = await Video.findById(videoId);
    if (!video) {
      throw new apiError(404, "Video not found");
    }
    video.isPublished = !video.isPublished;

    await video.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          `Video has been ${video.isPublished ? "published" : "unpublished"} successfully`,
          { isPublished: video.isPublished }
        )
      );
  }
);

const watchVideo = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const userId = (req as any)?.user._id;

  if (!mongoose.Types.ObjectId.isValid(videoId as string)) {
    throw new apiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }

  video.views += 1;
  await video.save();

  await User.findByIdAndUpdate(
    userId,
    { $addToSet: { watchHistory: videoId } },
    { new: true }
  );

  return res.status(200).json(
    new apiResponse(200, "Video watched and added to history", {
      videoId: video._id,
      updatedViews: video.views,
      watchHistoryUpdated: true,
    })
  );
});

export {
  publishVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  watchVideo,
};
