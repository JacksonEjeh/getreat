import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String, // "09:00 AM"
      required: true,
    },
    endTime: {
      type: String, // "10:00 AM"
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const providerScheduleSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderProfile",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    timeZone: {
      type: String, // "(GMT-0800) United States (Los Angeles)"
      required: true,
    },

    slots: {
      type: [slotSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one time slot is required",
      },
    },
  },
  { timestamps: true }
);

providerScheduleSchema.index({ provider: 1, date: 1 }, { unique: true });

const ProviderSchedule = mongoose.model(
  "ProviderSchedule",
  providerScheduleSchema
);

export default ProviderSchedule;