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
    visible_to: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // providers
      },
    ],

    // optional: visibility type
    visibility_type: {
      type: String,
      enum: ["private", "selected_providers", "all_providers"],
      default: "private",
    },
    
}, { timestamps: true });

const FeelingsPost = mongoose.model("FeelingsPost", feelingsPostSchema);
export default FeelingsPost;