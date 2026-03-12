import mongoose from "mongoose";

const credentialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const ProviderProfile = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        professional_field:{
            type: String,
            enum: ["doctor", "therapist", "nutritionist", "fitness trainer", "other"],
            required: true,
        },
        years_of_experience: {
            type: Number,
            required: true,
            min: 0,
            max: 60,
        },
        bio: {
            type: String,
            required: true,
            maxlength: 300,
            trim: true,
        },
        country: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        profilePhoto: {
            type: String, // Cloudinary
            required: true,
        },
        credentials: {
            type: [credentialSchema],
            validate: {
                validator: (v) => v.length > 0,
                message: "At least one credential is required",
            },
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "suspended", "active"],
            default: "pending",
        },
        rejectionReason: {
            type: String,
            default: null,
        },

        appointments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Appointment",
            },
        ],
        appointmentStats: {
            total: { type: Number, default: 0 },
            completed: { type: Number, default: 0 },
            cancelled: { type: Number, default: 0 },
        },

        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        followersCount: {
            type: Number,
            default: 0,
        },
        reviews: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Review",
            },
        ],
        rating: {
            average: {
                type: Number,
                default: 0,
                min: 0,
                max: 5,
            },
            totalReviews: {
                type: Number,
                default: 0,
            },
        },
    },
    { timestamps: true }
);

const Provider = mongoose.model("ProviderProfile", ProviderProfile);
export default Provider;