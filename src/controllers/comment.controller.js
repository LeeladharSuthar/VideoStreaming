import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body
    const { videoId } = req.params

    if (!content) {
        throw new ApiError(400, "Content missing")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Id")
    }

    const comment = await Comment.create({
        content: content,
        video: videoId,
        user: req.user._id
    })

    return res.status(200).json(new ApiResponse(200, comment, "Comment created"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Id")
    }

    if (!content) {
        throw new ApiError(400, "Content missing")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "Comment not found")
    }

    comment.content = content

    await comment.save({ validateBeforeSave: true })

    const result = await Comment.findById(commentId)

    return res.status(200).json(200, result, "Comment update Successful")

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Id")
    }

    const status = await Comment.deleteOne({
        _id: commentId
    })

    if (!status.acknowledged) {
        throw new ApiError(400, "Something went wrong while removing comment")
    }

    return res.status(200).json(new ApiResponse(200, {}, "Comment removed"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}