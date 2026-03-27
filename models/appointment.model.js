import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    appointmentDate: {
      type: String, // e.g. "2024-06-01"
      required: true,
    },

    appointmentTime: {
      type: String, // e.g. "10:30 AM"
      required: true,
    },

    appointmentType: {
      type: String,
      enum: ["digital", "inperson"],
      required: true,
    },

    digitalOption: {
      type: String,
      enum: ["video_call", "audio_call", "message"],
      required: function () {
        return this.appointmentType === "digital";
      },
      default: null,
    },

    reason: {
      type: String,
      required: true,
      maxlength: 300,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },

    cancellationReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;