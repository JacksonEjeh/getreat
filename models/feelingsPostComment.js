import mongoose from "mongoose";

const FeelingPostCommentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId, 
        required: true
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
}, {timestamps: true});

const FeelingPostComment = mongoose.model('FeelingPostComment', FeelingPostCommentSchema);
export default FeelingPostComment;