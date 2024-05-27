import mongoose, { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
const { ObjectId } = mongoose.Types;


const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { channelId } = req.body
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Id")
    }
    const result = await User.aggregate([
        {
            $match: {
                _id: new ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videosList",
                pipeline: [
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "likes"
                        }
                    },
                    {
                        $addFields: {
                            "totalLikes": { $size: "$likes" }
                        }
                    },
                    {
                        $project: {
                            "totalLikes": 1,
                            "views": 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriptions"
            }
        },
        {
            $addFields: {
                totalLikesSum: { $sum: "$videosList.totalLikes" },
                totalVideoCount: { $size: "$videosList" },
                totalVideoViews: { $sum: "$videosList.views" },
                totalSubscribersCount: { $size: "$subscriptions" }
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                totalLikesSum: 1,
                totalVideoCount: 1,
                totalVideoViews: 1,
                totalSubscribersCount: 1
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, result, "Successful"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { channelId } = req.body
    const result = await User.aggregate([
        {
            $match: {
                _id: new ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                videos: 1
            }
        }
    ])
    console.log(result)
    return res.status(200).json(new ApiResponse(200, result, "Successful"))
})

export {
    getChannelStats,
    getChannelVideos
}