import mongoose from "mongoose";

const feelingsPostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",    
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    media: [
        {
            url: {
                type: String,
                required: true,
            },
            type: {
                type: String,
                enum: ["image", "video"],
                required: true, 
            },
        },
    ],
    comments: [
        {
            user: { 
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            comment: {
                type: String,
                required: true,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    
}, { timestamps: true });

const FeelingsPost = mongoose.model("FeelingsPost", feelingsPostSchema);
export default FeelingsPost;