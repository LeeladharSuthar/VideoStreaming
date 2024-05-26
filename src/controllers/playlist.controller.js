import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const { ObjectId } = mongoose.Types;

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist
    const playlist = await Playlist.create({
        name,
        description,
        "owner": req.user._id
    })
    if (!playlist) {
        throw new ApiError(400, "Something went wrong, while creating playlist.")
    }
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist  Created"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid id")
    }
    //TODO: get user playlists
    const result = await Playlist.find({ owner: userId })
    if (!result) {
        throw new ApiError(400, "Hello")
    }
    return res.status(200).json(new ApiResponse(200, result, "Successful"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Id")
    }

    const result = await Playlist.aggregate([
        {
            $match: {
                "_id": new ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "result",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            thumbnail: 1,
                            title: 1,
                            decription: 1,
                            duration: 1,
                            views: 1,
                            owner: 1
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                // $ arrayElemAt: ["$owner", 1]
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                owner: 1,
                result: 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, result, "Successfuls"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Id not provided")
    }

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Object Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Either Playlist not found or not available")
    }

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(400, "Unauthorized Access")
    }
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Something went wrong")
    }
    playlist.videos.push(videoId)

    const temp = await playlist.save({ validateBeforeSave: true })

    if (!temp) {
        throw new ApiError(400, "Something went  wrong")
    }

    const updatedPlaylist = await Playlist.findById(playlistId)

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video added successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Id not provided")
    }

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Object Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Either Playlist not found or not available")
    }

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(400, "Unauthorized Access")
    }

    playlist.videos.pull(videoId)

    const temp = await playlist.save({ validateBeforeSave: true })

    if (!temp) {
        throw new ApiError(400, "Something went  wrong")
    }

    const updatedPlaylist = await Playlist.findById(playlistId)

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video removed successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId) {
        throw new ApiError(400, "Id not provided")
    }
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Object Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Either Playlist not found or not available")
    }

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(400, "Unauthorized Access")
    }

    const status = await Playlist.deleteOne({ _id: playlistId })

    if (!status.acknowledged) {
        throw new ApiError(400, "Something went wrong while deleting playlist")
    }

    return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted Successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    if (!playlistId) {
        throw new ApiError(400, "Id not provided")
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Object Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Either Playlist not found or not available")
    }

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(400, "Unauthorized Access")
    }

    if ((!name && !description) || (playlist.name === name && playlist.description === description) || (!description && playlist.name === name) || (!name && playlist.description === description)) {
        throw new ApiError(400, "No changes provided")
    }

    if (name && playlist.name !== name) {
        playlist.name = name
    }
    if (description && playlist.description !== description) {
        playlist.description = description
    }

    await playlist.save({ validateBeforeSave: true })

    const updatedPlaylist = await Playlist.findById(playlistId)

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}