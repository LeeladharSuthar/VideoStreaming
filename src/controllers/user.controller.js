import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { deleteFromCloudnary, uploadOnCloudnary } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken;
        const res = await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details
    const { username, email, fullname, password } = req.body

    // console.log(req.body)
    // [Object: null prototype] {
    //     username: 'lldhrs',
    //     fullname: 'Leeladhar Suthar',
    //     password: '812749asjdkj',
    //     email: 'leeladharsusthar62@gmail.com'
    //   }

    // validate the details
    if ([username, email, fullname, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All field are required")
    }

    // Check if user already exists in db
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "Username or email already exist")
    }


    // Check avatar  and coverImage
    // avatar is compulsory, coverImage id optional

    // console.log(req.files.avatar[0].path) ===> gives the local path of image

    const localAvatarPath = req.files?.avatar?.[0].path;
    const localCoverImagePath = req.files?.coverImage?.[0].path || null;

    // console.log(req.files)
    // [Object: null prototype] {
    //     avatar: [
    //         {
    //             fieldname: 'avatar',
    //             originalname: '2023-01-24.png',
    //             encoding: '7bit',
    //             mimetype: 'image/png',
    //             destination: './public/temp',
    //             filename: 'avatar1715447046191.png',
    //             path: 'public\\temp\\avatar1715447046191.png',
    //             size: 64649
    //         }
    //     ]
    // }

    if (!localAvatarPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // Upload images on cloudnary
    const avatar = await uploadOnCloudnary(localAvatarPath)
    const coverImage = localCoverImagePath ? await uploadOnCloudnary(localCoverImagePath) : ""

    // console.log(avatar)
    // {
    //     asset_id: 'fbc6d94f2e4bd12589c8283d7e92e8ef',
    //     public_id: 'u3em7fuidwqkjzcag4xv',
    //     version: 1715486394,
    //     version_id: '6f3db8a3001e3b9d77479925e0a7e732',
    //     signature: '7e9ecfcad9fd18981be8238495973c1a1e7df000',
    //     width: 1366,
    //     height: 728,
    //     format: 'png',
    //     resource_type: 'image',
    //     created_at: '2024-05-12T03:59:54Z',
    //     tags: [],
    //     bytes: 64649,
    //     type: 'upload',
    //     etag: 'e913b139e3374dba0625401f0fa9d730',
    //     placeholder: false,
    //     url: 'http://res.cloudinary.com/lldhrcloud/image/upload/v1715486394/u3em7fuidwqkjzcag4xv.png',
    //     secure_url: 'https://res.cloudinary.com/lldhrcloud/image/upload/v1715486394/u3em7fuidwqkjzcag4xv.png',
    //     folder: '',
    //     original_filename: 'avatar1715486392211',
    //     api_key: 'key here'
    //   }

    if (!avatar) {
        throw new ApiError(400, "Cloudnary Error")
    }

    // save in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        username: username.toLowerCase(),
        password,
        email,
        coverImage: coverImage?.url || ""
    })

    // See if saved in db
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // get data
    const { email, password, username } = req.body

    // validate the data

    if (!username && !email) {
        throw new ApiError(400, "Both username and email is required")
    } else if (!(username || email)) {
        throw new ApiError(400, "Either username or email is required")
    }
    if (!password) {
        throw new ApiError(400, "password not provided")
    }

    // find the user
    const user = await User.findOne({ $or: [{ "email": email }, { "username": username }] })

    // if no user send APiError
    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    // else password check
    const isPasswordValid = await user.isPasswordCorrect(password) // returns boolean
    if (!isPasswordValid) {
        throw new ApiError(401, "invalid password provided")
    }

    // generate access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // send tokens through cookies and send the response
    const data = await User.findById(user._id).select("-password")

    const options = { // makes cookies secure. i.e., only server can modify them
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {
            user: data,
            accessToken,
            refreshToken
        }, "User Logged in successfully"))
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } })
    const options = { // makes cookies secure. i.e., only server can modify them
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged-out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if (!incomingRefreshToken) {
            throw new ApiError(401, "unauthorized request")
        }

        const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        // console.log(decodedToken)
        // { _id: '664060015d3954d757acb244', iat: 1715628735, exp: 1716492735 }
        const user = await User.findById(decodedToken._id).select("-password")
        // console.log(user)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token!")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token!")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, {
                accessToken,
                refreshToken
            }, "Access token refreshed"))
    } catch (error) {
        throw new ApiError(401, error.message || "Error while generating access token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // get old password and new password
    const { currentPassword, newPassword, confirmNewPassword } = req.body

    // verify new password and confirm password
    if (newPassword !== confirmNewPassword) {
        throw new ApiError(400, "New Password and confirm Password does't match")
    }

    // get data from db and verify old password
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    // set the new passowrd
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    // return confirm message
    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateUser = asyncHandler(async (req, res) => {
    const { email, fullname } = req.body
    if (!email && !fullname) {
        throw new ApiError(400, "No changes provided")
    }

    const user = await User.findById(req.user?._id)
    if (email === user.email && fullname === user.fullname) {
        throw new ApiError(400, "No changes provided")
    }

    if (email)
        user.email = email
    if (fullname)
        user.fullname = fullname
    const status = await user.save({ validateBeforeSave: false })

    const result = await User.findById(status._id).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, result, "Success"))
})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    // console.log(req.file)
    // {
    //     fieldname: 'avatar',
    //     originalname: 'img.jpg',
    //     encoding: '7bit',
    //     mimetype: 'image/jpeg',
    //     destination: './public/temp',
    //     filename: 'avatar1715780458842.jpg',
    //     path: 'public\\temp\\avatar1715780458842.jpg',
    //     size: 308300
    // }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file missing")
    }
    const avatar = await uploadOnCloudnary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Cloudnary Error")
    }

    const user = await User.findById(req.user._id)
    const oldUrl = user.avatar

    user.avatar = avatar.url

    await user.save({ validateBeforeSave: false })

    const updatedUser = await User.findById(req.user._id).select("-password -refreshToken")

    await deleteFromCloudnary(oldUrl)

    return res.status(200).json(new ApiResponse(200, updatedUser, "Avatar updated successful"))
})

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    // console.log(req.file)
    // {
    //     fieldname: 'avatar',
    //     originalname: 'img.jpg',
    //     encoding: '7bit',
    //     mimetype: 'image/jpeg',
    //     destination: './public/temp',
    //     filename: 'avatar1715780458842.jpg',
    //     path: 'public\\temp\\avatar1715780458842.jpg',
    //     size: 308300
    // }


    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover-image file missing")
    }
    const coverImage = await uploadOnCloudnary(coverImageLocalPath)
    if (!coverImage) {
        throw new ApiError(400, "Cloudnary Error")
    }
    const user = await User.findById(req.user._id)
    const oldUrl = user.coverImage

    user.coverImage = coverImage.url

    await user.save({ validateBeforeSave: false })

    const updatedUser = await User.findById(req.user._id).select("-password -refreshToken")

    let deletedStatus = await deleteFromCloudnary(oldUrl)

    return res.status(200).json(new ApiResponse(200, updatedUser, "Cover-image updated successful"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    // get username for channel
    const { username } = req.params // if you define a route as /user/:id, you can access the id parameter using req.params.id.

    // check is username is valid
    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }



    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSuscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                isSuscribed: 1,
                subscribedToCount: 1,
                subscribersCount: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if (channel.length == 0 || !channel) {
        throw new ApiError(400, "Channel does not exist")
    }


    return res.status(200).json(new ApiResponse(200, channel[0], "Successful"))
})

const watchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: req.user._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchedVideos",
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
                watchedVideos: 1
            }
        }
    ])


    return res.status(200).json(new ApiResponse(200,  user[0] , "Watch History fetched Successful"))
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateUser, updateAvatar, updateCoverImage, getUserChannelProfile, watchHistory }