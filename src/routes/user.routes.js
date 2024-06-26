import { Router } from "express"
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateUser, updateAvatar, updateCoverImage, getUserChannelProfile, watchHistory } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import verifyJWT from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([{
        name: "avatar",
        maxCount: 1
    }, {
        name: "coverImage",
        maxCount: 1
    }]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refreshAccessToken").post(refreshAccessToken)

router.route("/changePassword").post(verifyJWT, changeCurrentPassword)

router.route("/getCurrentUser").get(verifyJWT, getCurrentUser)

router.route("/updateUser").patch(verifyJWT, updateUser)

router.route("/updateAvatar").patch(upload.single("avatar"), verifyJWT, updateAvatar)

router.route("/updateCoverImage").patch(upload.single("coverImage"), verifyJWT, updateCoverImage)

router.route("/getUserChannelProfile/:username").get(verifyJWT, getUserChannelProfile)

router.route("/watchHistory").get(verifyJWT, watchHistory)

export default router