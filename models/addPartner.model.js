import mongoose from "mongoose";

const partnerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    relationship: {
        type: String,
        enum: ["spouse", "family", "friend", "other"],
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const Partner = mongoose.model("Partner", partnerSchema);
export default Partner;