import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    if (!content) {
        throw new ApiError(400, "Content missing")
    }
    const tweet = await Tweet.create({
        owner: req.user._id,
        content,
    })
    return res.status(200).json(new ApiResponse(200, tweet, "successful"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid Id")
    }
    const tweets = await Tweet.aggregate([
        {
            $match: {
                "owner": new ObjectId(userId)
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, tweets, "Successful"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Id")
    }
    if (!content) {
        throw new ApiError(400, "Content missing")
    }
    const tweet = await Tweet.findById(tweetId)
    tweet.content = content
    tweet.save({ validateBeforeSave: true })
    const updatedTweet = await Tweet.findById(tweetId)
    return res.status(200).json(new ApiResponse(200, updatedTweet, "Successful"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Id")
    }
    await Tweet.deleteOne({ _id: tweetId })
    return res.status(200).json(new ApiResponse(200, {}, "delete successful"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}