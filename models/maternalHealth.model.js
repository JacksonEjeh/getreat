import mongoose from "mongoose";

const maternalHealthSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    date: {
        type: Date,
        required: true,
    },
    has_existing_conditions: {
        type: Boolean,
        required: true,
    },
    existing_conditions_details: {
        type: String,
        required: function () {
            return this.has_existing_conditions === true;
        },  
        default: null,
    },
    has_medications: {
        type: Boolean,
        required: true,
    },
    medications_details: {
        type: String,
        required: function () {
            return this.has_medications === true;
        },
        default: null,
    },
});

const MaternalHealthProfile = mongoose.model("MaternalHealthProfile", maternalHealthSchema);
export default MaternalHealthProfile;