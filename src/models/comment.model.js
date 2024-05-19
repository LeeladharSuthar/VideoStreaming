import mongoose from 'mongoose'
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const CommentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true
        },
        user: {
            type: mongoose.Types.ObjectId,
            ref: "User"
        },
        video: {
            type: mongoose.Types.ObjectId,
            ref: "Video"
        }
    },
    { timestamps: true }
)

export const Comment = mongoose.model("Comment", CommentSchema)