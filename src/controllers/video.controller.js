import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudnary, uploadOnCloudnary, deleteVideoFromCloudnary } from "../utils/cloudnary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, queryText, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
    const options = {
        "sort": { [sortType]: sortBy }, // Sort by ID descending (optional)
        "limit": limit,
        "offset": (page - 1) * limit, // Calculate offset for pagination
        "page": page
    };

    const query = {
        title: {
            $text: { $search: queryText }
        }
    };

    const myAggregate = Video.aggregate();
    const result = await myAggregate.paginateExec(query, options)

    return res.status(200).json(new ApiResponse(200, result, "Successful"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title } = req.body
    const { description } = req.body || ""
    if (!title) {
        throw new ApiError(400, "Title required")
    }

    // TODO: get video, upload to cloudinary, create video

    // console.log(req.files)

    // [Object: null prototype] {
    //     thumbnail: [
    //         {
    //             fieldname: 'thumbnail',
    //             originalname: 'img.jpg',
    //             encoding: '7bit',
    //             mimetype: 'image/jpeg',
    //             destination: './public/temp',
    //             filename: 'thumbnail1716224397445.jpg',
    //             path: 'public\\temp\\thumbnail1716224397445.jpg',
    //             size: 308300
    //         }
    //     ],
    //         videoFile: [
    //             {
    //                 fieldname: 'videoFile',
    //                 originalname: '856787-sd_640_360_30fps.mp4',
    //                 encoding: '7bit',
    //                 mimetype: 'video/mp4',
    //                 destination: './public/temp',
    //                 filename: 'videoFile1716224397466.mp4',
    //                 path: 'public\\temp\\videoFile1716224397466.mp4',
    //                 size: 434438
    //             }
    //         ]
    // }
    const thumbnailPath = req.files.thumbnail[0].path
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail required")
    }
    const videoPath = req.files.videoFile[0].path
    if (!videoPath) {
        throw new ApiError(400, "Video required")
    }

    const thumbnail = await uploadOnCloudnary(thumbnailPath)
    const videoFile = await uploadOnCloudnary(videoPath)

    if (!thumbnail || !videoFile) {
        throw new ApiError(400, "Cloudnary Error")
    }

    // console.log(videoFile)
    // {
    //     asset_id: 'ce60513f0c860a0601e3273ae33c4ea9',
    //     public_id: 'bl13zg7qzdi1iujzocta',
    //     version: 1716225167,
    //     version_id: '96106a35e744c069a615d85211cd1587',
    //     signature: '2a0c1c147f26ba96e5b7f6328780478566dc84c7',
    //     width: 640,
    //     height: 360,
    //     format: 'mp4',
    //     resource_type: 'video',
    //     created_at: '2024-05-20T17:12:47Z',
    //     tags: [],
    //     pages: 0,
    //     bytes: 434438,
    //     type: 'upload',
    //     etag: 'cd275497ca3d24ddbaeee440dc56be6a',
    //     placeholder: false,
    //     url: 'http://res.cloudinary.com/lldhrcloud/video/upload/v1716225167/bl13zg7qzdi1iujzocta.mp4',
    //     secure_url: 'https://res.cloudinary.com/lldhrcloud/video/upload/v1716225167/bl13zg7qzdi1iujzocta.mp4',
    //     playback_url: 'https://res.cloudinary.com/lldhrcloud/video/upload/sp_auto/v1716225167/bl13zg7qzdi1iujzocta.m3u8',
    //     folder: '',
    //     audio: {
    //       codec: 'aac',
    //       bit_rate: '128000',
    //       frequency: 48000,
    //       channels: 2,
    //       channel_layout: 'stereo'
    //     },
    //     video: {
    //       pix_format: 'yuv420p',
    //       codec: 'h264',
    //       level: 30,
    //       profile: 'High',
    //       bit_rate: '496680',
    //       dar: '16:9',
    //       time_base: '1/30000'
    //     },
    //     is_audio: false,
    //     frame_rate: 29.97002997002997,
    //     bit_rate: 629050,
    //     duration: 5.525,
    //     rotation: 0,
    //     original_filename: 'videoFile1716225159882',
    //     nb_frames: 165,
    //     api_key: 'api key'
    //   }

    const video = await Video.create({
        "title": title,
        "description": description,
        "videoFile": videoFile.url,
        "thumbnail": thumbnail.url,
        "duration": videoFile.duration,
        "owner": req.user._id
    })
    if (!video) {
        throw new ApiError(400, "Something went wrong while uploading video")
    }

    const createdVideo = await Video.findById(video._id)
    if (!createdVideo) {
        throw new ApiError(400, "Something went wrong while uploading video")
    }
    return res.status(200).json(new ApiResponse(200, createdVideo, "Successfull"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "Video not present")
    }
    return res.status(200).json(new ApiResponse(200, video, "Successful"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Id")
    }

    const thumbnailPath = req.file?.path || ""
    let oldUrl = undefined
    //TODO: update video details like title, description, thumbnail
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    if (title) {
        video.title = title
    }
    if (description) {
        video.description = description
    }
    if (thumbnailPath) {
        const cloudnaryThumbnail = await uploadOnCloudnary(thumbnailPath)
        if (!cloudnaryThumbnail) {
            throw new ApiError(400, "Cloudnary error")
        }
        oldUrl = video.thumbnail
        video.thumbnail = cloudnaryThumbnail.url
    }
    await video.save({ validateBeforeSave: false })

    const newVideo = await Video.findById(videoId)
    if (oldUrl) {
        await deleteFromCloudnary(oldUrl)
    }

    return res.status(200).json(new ApiResponse(200, newVideo, "Successful"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Id")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "Invalid video")
    }
    const userId = req.user._id

    // console.log(video.owner.equals(userId))
    if (!video.owner.equals(userId)) {
        throw new ApiError(400, "Unauthorized access")
    }

    const cloudnaryVideoId = video.videoFile
    const cloudnaryThumbanilId = video.thumbnail

    await deleteFromCloudnary(cloudnaryThumbanilId)
    await deleteVideoFromCloudnary(cloudnaryVideoId)

    await Video.deleteOne({ _id: video._id })

    return res.status(200).json(new ApiResponse(200, {}, "Successful"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId)

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Id")
    }

    if (!video.owner.equals(req.user._id)) {
        throw new ApiError(400, "Unauthorized access")
    }
    const currentStatus = video.isPublished
    video.isPublished = !currentStatus
    video.save({ validateBeforeSave: false })

    const newVideo = await Video.findById(videoId)

    return res.status(200).json(new ApiResponse(200, newVideo, "Successful"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}