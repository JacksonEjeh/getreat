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
      required: function () {
        return this.service === "pregnancy care";
      },
    },

    last_menstrual_period: {
      type: Date,
      required: function () {
        return this.service === "pregnancy care";
      },
    },

    expected_delivery_date: {
      type: Date,
      required: function () {
        return this.service === "pregnancy care";
      },
    },

    gestational_weeks: {
      type: Number,
      required: function () {
        return this.service === "pregnancy care";
      },
    },

    // Health conditions
    has_health_condition: {
      type: Boolean,
      required: function () {
        return this.service === "pregnancy care";
      },
    },

    medical_conditions: [
      {
        type: String,
        enum: ["diabetes", "hypertension", "thyroid disorder", "heart disease", "none"],
        required: function () {
          return this.has_health_condition === true;
        }
      },
    ],

    on_medication: {
      type: Boolean,
      required: function () {
        return this.service === "pregnancy care";
      },
    },

    medication_details: {
      type: String,
      required: function () {
        return this.on_medication === true;
      },
    },

    // Profile photo
    profile_photo: {
      type: String, // Cloudinary or image URL
      default: null,
    },

    mode_of_delivery: {
      type: String,
      enum: ["vaginal", "cesarean"],
      required: function () {
        return this.service === "newborn care";
      },
    },

    baby_full_name: {
      type: String,
      required: function () {
        return this.service === "newborn care";
      },
    },

    date_of_birth: {
      type: Date,
      required: function () {
        return this.service === "newborn care";
      },
    },

    baby_gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: function () {
        return this.service === "newborn care";
      },
    },
     
    baby_weight: {
      value:{
        type: Number,
      },
      unit: {
        type: String,
        enum: ["kg", "lbs"],
        default: "kg",
      }
    },
    
    baby_length: {
      value:{
        type: Number,
      },
      unit: {
        type: String,
        enum: ["cm", "m"],
        default: "cm",
      }
    },

    baby_head_circumference: {
      value:{
        type: Number,
      },
      unit: {
        type: String,
        enum: ["cm", "m"],
        default: "cm",
      }
    },

    baby_photo: {
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