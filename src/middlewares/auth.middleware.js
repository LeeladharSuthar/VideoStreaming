import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from 'jsonwebtoken'
import { User } from "../models/user.model.js"

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // extract token
        // either the server can get accessToken from cookies or client needs to send accessToken in header with {"Authorization": "Bearer accessToken"}
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        // verify token
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        // decode token
        //jwt.decode() decodes the token
        // jwt.verify() decodes and verifies the JWT token's signature and optionally checks its expiration time
        // if the token is expired jwt.verify() send an error: { "success": false, "message": "jwt expired" }
        // const data = await jwt.decode(token) 
        const data = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        // console.log(data)
        // {
        //     _id: '664060015d3954d757acb244',
        //     email: 'leeladharsuthar62@gmail.com',
        //     username: 'lldhrsuthar',
        //     fullname: 'Leeladhar Suthar',
        //     iat: 1715515359,
        //     exp: 1715601759
        // }

        // get user document
        const user = await User.findById(data?._id).select("-password -refreshToken")

        // verify user
        if (!user) {
            throw new ApiError(401, "Invalid Access Token!")
        }

        // append user to req and call next()
        req.user = user

        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})

export default verifyJWT