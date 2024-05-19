import mongoose from "mongoose"

const TweetSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Types.ObjectId,
            ref: "User"
        },
        content: {
            type: String,
            required: true
        },
        image: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

export const Tweet = mongoose.model("Tweet", TweetSchema)