import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    const status = await Like.find({
        likedBy: req.user._id,
        video: video._id
    })

    if (status.length != 0) {
        let result = await Like.deleteOne({
            likedBy: req.user._id,
            video: video._id
        })
        if (result.acknowledged) {
            return res.status(200).json(new ApiResponse(200, result, "dislike successful"))
        }
        throw new ApiError(400, "Somrthing went wrong")
    }

    let result = await Like.create({
        likedBy: req.user._id,
        video: video._id
    })

    return res.status(200).json(new ApiResponse(200, result, "like successful"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Id")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(400, "Comment not found")
    }
    const status = await Like.find({
        likedBy: req.user._id,
        comment: comment._id
    })

    if (status.length != 0) {
        let result = await Comment.deleteOne({
            likedBy: req.user._id,
            comment: comment._id
        })
        if (result.acknowledged) {
            return res.status(200).json(new ApiResponse(200, result, "dislike successful"))
        }
        throw new ApiError(400, "Something went wrong")
    }

    let result = await Comment.create({
        likedBy: req.user._id,
        comment: comment._id
    })

    return res.status(200).json(new ApiResponse(200, result, "like successful"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Id")
    }
    const tweet = await Comment.findById(tweetId)
    if (!tweet) {
        throw new ApiError(400, "Tweet not found")
    }
    const status = await Tweet.find({
        likedBy: req.user._id,
        tweet: tweet._id
    })

    if (status.length != 0) {
        let result = await Comment.deleteOne({
            likedBy: req.user._id,
            tweet: tweet._id
        })
        if (result.acknowledged) {
            return res.status(200).json(new ApiResponse(200, result, "dislike successful"))
        }
        throw new ApiError(400, "Something went wrong")
    }

    let result = await Tweet.create({
        likedBy: req.user._id,
        tweet: tweet._id
    })

    return res.status(200).json(new ApiResponse(200, result, "like successful"))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const videos = await Like.aggregate([
        {
            $match: {
                video: { $exists: true },
                likedBy: req.user._id
            }
        }
    ])
    
    return res.status(200).json(new ApiResponse(200, videos, "Sucessful"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}