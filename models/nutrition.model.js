import mongoose from "mongoose";

const nutritionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    dietary_preferences: {
        type: [String],
        enum: ["vegetarian", "vegan", "gluten-free", "dairy-free", "paleo", "keto", "other"],
        default: [],
    },
    allergies: {
        type: Boolean,
        required: true,
    },
    allergy_details: {
        type: String,
        required: function () {
            return this.allergies === true;
        },
        default: null,
    },

});

const NutritionProfile = mongoose.model("NutritionProfile", nutritionSchema);
export default NutritionProfile;