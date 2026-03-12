import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Service selection
    service: {
      type: String,
      enum: ["pregnancy care", "newborn care", "male fertility", "women fertility"],
      required: true,
    },

    // Pregnancy details
    mode_of_pregnancy: {
      type: String,
      enum: ["natural", "assisted"],
      required: true,
    },

    last_menstrual_period: {
      type: Date,
      required: true,
    },

    // Health conditions
    has_health_condition: {
      type: Boolean,
      required: true,
    },

    health_condition_details: {
      type: String,
      required: function () {
        return this.has_health_condition === true;
      },
      default: null,
    },

    // Baby details (newborn care)
    baby_height: {
      value: {
        type: Number,
      },
      unit: {
        type: String,
        enum: ["cm", "m"],
        default: "cm",
      },
    },

    // Vitals
    blood_pressure: {
      systolic: {
        type: Number,
      },
      systolic: {
        type: Number,
      },
      unit: {
        type: String,
        enum: ["mmHg"],
        default: "mmHg",
      },
    },

    sugar_level: {
      value: {
        type: Number,
      },
      unit: {
        type: String,
        enum: ["mmol/L", "mg/dL"],
        default: "mmol/L",
      },
    },

    // Blood info
    rhesus_factor: {
      type: String,
      enum: ["positive", "negative"],
      required: true,
    },

    // Reproductive health
    fibroid_or_ovarian_cyst: {
      type: Boolean,
      required: true,
    },

    // Profile photo
    profile_photo: {
      type: String, // Cloudinary or image URL
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;