import mongoose from 'mongoose'
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const VideoSchema = new mongoose.Schema({
    videoFile: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })

VideoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", VideoSchema)